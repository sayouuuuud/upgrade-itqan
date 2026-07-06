import { NextRequest, NextResponse } from "next/server"

const publicPaths = ["/", "/about", "/contact", "/sitemap-page", "/login", "/login-admin", "/register", "/reader-register", "/teacher-register", "/forgot-password", "/reset-password", "/verify", "/privacy", "/terms", "/maintenance", "/change-password", "/rejected"]
const apiPublicPaths = ["/api/auth", "/api/admin/homepage", "/api/admin/analytics", "/api/internal"]

// Academy public paths (for public lessons and invitations)
const academyPublicPaths = ["/academy/public", "/academy/invite", "/academy/lesson"]

// Shared academy paths that any authenticated user may reach regardless of
// has_academy_access. The Fiqh Library is intentionally exposed to maqraa
// readers/students from their dashboards, so it must bypass the academy-access
// gate that otherwise bounces non-academy users out of /academy/*.
function isFiqhLibraryPath(pathname: string) {
  return (
    pathname === "/academy/fiqh" ||
    pathname.startsWith("/academy/fiqh/") ||
    pathname === "/api/academy/fiqh" ||
    pathname.startsWith("/api/academy/fiqh/")
  )
}

// In-process cache for maintenance status (avoids hammering the DB on every request).
// TTL is short (20s) so enabling/disabling maintenance takes effect quickly.
let maintenanceCache: { enabled: boolean; message: string; expiry: number } | null = null

async function getMaintenanceStatus(req: NextRequest): Promise<{ enabled: boolean; message: string }> {
    const now = Date.now()
    if (maintenanceCache && maintenanceCache.expiry > now) {
        return { enabled: maintenanceCache.enabled, message: maintenanceCache.message }
    }
    // Resolve the internal API URL against the incoming request. This mirrors the
    // proven /api/internal/user-status self-fetch used elsewhere in this middleware
    // and works correctly behind Vercel's proxy.
    try {
        const res = await Promise.race([
            fetch(new URL("/api/internal/maintenance-status", req.url), { cache: "no-store" }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000)),
        ])
        const data = await (res as Response).json()
        maintenanceCache = { enabled: !!data.enabled, message: data.message ?? "", expiry: now + 20_000 }
        return { enabled: maintenanceCache.enabled, message: maintenanceCache.message }
    } catch {
        // On error, assume maintenance is OFF so the site keeps running
        return { enabled: false, message: "" }
    }
}

export default async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // Skip static assets early
    if (pathname.startsWith("/_next") || pathname.startsWith("/uploads") || pathname.includes(".")) {
        return NextResponse.next()
    }

    // In development/demo mode, skip auth for dashboard pages
    if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
        return NextResponse.next()
    }

    // ── Maintenance Mode ─────────────────────────────────────────────────────
    // Check BEFORE everything else. Only admins can pass through.
    // Paths that must ALWAYS work during maintenance so an admin can log in and
    // disable it: the maintenance page itself, the login page, and auth/internal
    // APIs. Reaching /login is harmless for non-admins — after logging in they are
    // still bounced to /maintenance since they lack an admin role.
    const maintenanceAllowlist =
        pathname === "/maintenance" ||
        pathname === "/login" ||
        pathname.startsWith("/api/internal") ||
        pathname.startsWith("/api/auth")
    if (!maintenanceAllowlist) {
        const { enabled } = await getMaintenanceStatus(req)
        if (enabled) {
            // Peek at the session cookie to see if this is an admin
            const sessionCookie = req.cookies.get("auth-token")?.value
            let isAdmin = false
            if (sessionCookie) {
                try {
                    const { verifyToken } = await import("@/lib/auth")
                    const payload = await verifyToken(sessionCookie)
                    isAdmin = payload?.role === "admin" || payload?.role === "super_admin"
                } catch {
                    isAdmin = false
                }
            }
            if (!isAdmin) {
                return NextResponse.redirect(new URL("/maintenance", req.url))
            }
        }
    }
    // ── End Maintenance Mode ─────────────────────────────────────────────────

    // Allow public paths
    if (publicPaths.includes(pathname)) {
        return NextResponse.next()
    }

    // Allow all auth routes (Better Auth handles /api/auth/*)
    if (pathname.startsWith("/api/auth")) {
        return NextResponse.next()
    }

    // Allow API public paths (INCLUDING /api/internal/*)
    // MUST check BEFORE rejecting unauthenticated API requests (line ~120)
    if (apiPublicPaths.some((p) => pathname.startsWith(p))) {
        return NextResponse.next()
    }

    // Allow academy public paths (public lessons, invitations)
    if (academyPublicPaths.some((p) => pathname.startsWith(p))) {
        return NextResponse.next()
    }

    // Check session cookie - prioritizing the new auth-token over better-auth
    const sessionCookie = req.cookies.get("auth-token")?.value || req.cookies.get("better-auth.session_token")?.value

    if (!sessionCookie) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }
        // If trying to access admin panel, redirect to login
        if (pathname.startsWith("/admin")) {
            return NextResponse.redirect(new URL("/login", req.url))
        }
        // If trying to access academy, redirect to login
        if (pathname.startsWith("/academy")) {
            return NextResponse.redirect(new URL("/login", req.url))
        }
        // Redirect to login for protected routes
        return NextResponse.redirect(new URL("/login", req.url))
    }

    try {
        // For now, we trust the session cookie validity
        // Better Auth validates the session server-side in route handlers
        // Additional role-based checks happen in route handlers

        // Use jose to read auth-token if it is the custom JWT
        // (Note: better-auth.session_token wouldn't be decoded here natively unless we duplicate BetterAuth logic,
        // but for now we decode where possible or let the layout handle advanced checks)
        if (sessionCookie) {
            const { verifyToken } = await import("@/lib/auth")
            const sessionPayload = await verifyToken(sessionCookie)

            if (sessionPayload) {
                // A-4: Real-time permission invalidation - check DB flags on sensitive routes
                const isSensitiveRoute = pathname.startsWith("/academy") || 
                                        pathname.startsWith("/admin") || 
                                        pathname.startsWith("/api/admin") ||
                                        pathname.startsWith("/api/academy")

                let dbUser: any = null
                if (isSensitiveRoute && !academyPublicPaths.some(p => pathname.startsWith(p))) {
                    try {
                        // Query the live database via an internal API route because
                        // the edge runtime does not support the pg module directly.
                        const dbCheckTimeout = new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error("middleware db check timed out")), 3000)
                        )
                        
                        const fetchUserStatus = async () => {
                            const res = await fetch(new URL("/api/internal/user-status", req.url), {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ userId: sessionPayload.sub })
                            });
                            if (!res.ok) throw new Error("Internal API returned " + res.status);
                            return await res.json();
                        }

                        const userRow = await Promise.race([
                            fetchUserStatus(),
                            dbCheckTimeout,
                        ])

                        // User deleted or disabled - invalidate session (#14: real-time suspension)
                        if (!userRow || userRow.is_disabled === true) {
                            const response = NextResponse.redirect(new URL("/login", req.url))
                            response.cookies.delete("better-auth.session_token")
                            response.cookies.delete("auth-token")
                            return response
                        }

                        dbUser = userRow

                        if (dbUser.is_active === false && sessionPayload.role !== 'admin') {
                            const response = NextResponse.redirect(new URL("/login", req.url))
                            response.cookies.delete("better-auth.session_token")
                            response.cookies.delete("auth-token")
                            return response
                        }

                        if (dbUser.must_change_password === true && !pathname.startsWith("/api/auth/change-password")) {
                            return NextResponse.redirect(new URL("/change-password", req.url))
                        }

                        // Pending/rejected applicants (teacher/reader) are gated to a single
                        // application dashboard until the admin approves them. They can:
                        //   - read GET /api/auth/* and the questions/upload endpoints they need
                        //   - view /academy/pending (teacher) or /reader/pending (reader)
                        //   - view /rejected (legacy)
                        // Anything else under /academy or /reader is redirected to their pending page.
                        // IMPORTANT: This check must come BEFORE the academy-access check so a
                        // rejected teacher (who may have has_academy_access=false) is always sent
                        // to /academy/pending rather than to the homepage.
                        const gatedRoles = ['teacher', 'reader']
                        const isGatedStatus = dbUser.approval_status === 'pending_approval' || dbUser.approval_status === 'rejected'
                        if (isGatedStatus && gatedRoles.includes(sessionPayload.role)) {
                            const pendingPath = sessionPayload.role === 'teacher' ? '/academy/pending' : '/reader/pending'
                            const allowed =
                                pathname === pendingPath ||
                                pathname.startsWith('/api/auth') ||
                                pathname.startsWith('/api/upload-audio') ||
                                pathname.startsWith('/api/upload-pdf') ||
                                pathname.startsWith('/api/upload') ||
                                pathname.startsWith('/api/admin/application-questions') ||
                                pathname.startsWith('/api/notifications') ||
                                pathname.startsWith('/api/unread-counts') ||
                                pathname.startsWith('/rejected') ||
                                pathname === '/'
                            if (!allowed) {
                                if (pathname.startsWith('/api/')) {
                                    return NextResponse.json({ error: 'pending_approval' }, { status: 403 })
                                }
                                return NextResponse.redirect(new URL(pendingPath, req.url))
                            }
                            // Early return for pending/rejected — skip academy-access checks below
                            // so they don't get bounced to homepage due to has_academy_access=false
                            const response = NextResponse.next()
                            return response
                        }

                        // #4: Detect role mismatch between JWT and DB (e.g., teacher just got approved).
                        // Force re-login so the new role is reflected in the JWT and the user is
                        // routed to the correct dashboard.
                        if (dbUser.role && dbUser.role !== sessionPayload.role && sessionPayload.role !== 'admin') {
                            const response = NextResponse.redirect(new URL("/login", req.url))
                            response.cookies.delete("better-auth.session_token")
                            response.cookies.delete("auth-token")
                            return response
                        }
                    } catch (dbErr) {
                        console.log("[v0] A-4 DB check failed, continuing with cached session:", dbErr)
                        // On DB error, allow request to continue with cached session
                    }
                }

                // #3: Use DB values for access flags so admin toggles take effect in real-time,
                // not just on the next login. Fall back to JWT only if DB lookup failed.
                const hasAcademyAccess = dbUser
                    ? dbUser.has_academy_access !== false
                    : sessionPayload.has_academy_access !== false
                const hasQuranAccess = dbUser
                    ? dbUser.has_quran_access !== false
                    : sessionPayload.has_quran_access !== false

                // Super-admin-only governance routes (design, branding, homepage,
                // SEO, role management, platform overview). Scoped admins
                // (maqraa_admin / academy_admin) and supervisors are bounced back
                // to the admin home. The legacy `admin` role is the super admin.
                const superAdminOnlyPrefixes = [
                    "/admin/theme",
                    "/admin/branding",
                    "/admin/role-management",
                    "/admin/analytics",
                    "/admin/homepage",
                    "/admin/seo",
                    "/api/admin/theme",
                    "/api/admin/branding",
                    "/api/admin/roles",
                    "/api/admin/platform-overview",
                ]
                const isSuper = sessionPayload.role === 'admin' || sessionPayload.role === 'super_admin'
                if (!isSuper && superAdminOnlyPrefixes.some(p => pathname === p || pathname.startsWith(p + "/"))) {
                    if (pathname.startsWith("/api/")) {
                        return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
                    }
                    return NextResponse.redirect(new URL("/admin", req.url))
                }

                // #1: Strictly prevent teachers from accessing student pages by manual URL entry.
                // Admins are also redirected to their own dashboard rather than silently allowed
                // to browse the student view (which can confuse RBAC tests and audits).
                if (pathname.startsWith("/academy/student")) {
                    if (sessionPayload.role === 'admin') {
                        return NextResponse.redirect(new URL("/academy/admin", req.url))
                    }
                    const isTeacher = sessionPayload.role === 'teacher' ||
                        sessionPayload.academy_roles?.includes('teacher');

                    if (isTeacher) {
                        return NextResponse.redirect(new URL("/academy/teacher", req.url))
                    }
                }

                // Check if user has academy access before allowing them into /academy.
                // NOTE: pending/rejected teachers are handled above and never reach this check.
                // Admin-role supervisors (student_supervisor, reciter_supervisor) always have
                // access to /academy/admin/* regardless of the has_academy_access flag.
                const adminSupervisorRoles = ['admin', 'student_supervisor', 'reciter_supervisor', 'academy_admin']
                const isAdminSupervisor = adminSupervisorRoles.includes(sessionPayload.role)
                if (pathname.startsWith("/academy") && !academyPublicPaths.some(p => pathname.startsWith(p)) && !isFiqhLibraryPath(pathname)) {
                    if (!hasAcademyAccess && !isAdminSupervisor) {
                        // Send to /student if they still have quran access, else home
                        const target = hasQuranAccess ? "/student" : "/"
                        return NextResponse.redirect(new URL(target, req.url))
                    }
                }

                // #3: Mirror the academy guard for the Qur'an side.
                // Block /student, /reader paths if has_quran_access is false.
                const quranPaths = ["/student", "/reader"]
                const isQuranRoute = quranPaths.some(p => pathname === p || pathname.startsWith(p + "/"))
                if (isQuranRoute) {
                    // Prevent teachers/parents from accessing Quran student dashboard if they are not explicitly readers
                    // or if hasQuranAccess is false.
                    const isReaderOrAdmin = sessionPayload.role === 'admin' || sessionPayload.role === 'reader'
                    
                    if (!hasQuranAccess || (!isReaderOrAdmin && sessionPayload.role !== 'student')) {
                        const target = hasAcademyAccess
                            ? `/academy/${sessionPayload.role === 'parent' ? 'parent' : sessionPayload.role === 'teacher' ? 'teacher' : 'student'}`
                            : "/"
                        return NextResponse.redirect(new URL(target, req.url))
                    }
                }

                // Check for supervisor paths
                if (pathname.startsWith("/academy/supervisor")) {
                    const supervisorRoles = ['supervisor', 'content_supervisor', 'fiqh_supervisor', 'quality_supervisor', 'academy_admin'];
                    const hasSupRole = supervisorRoles.includes(sessionPayload.role) ||
                        sessionPayload.academy_roles?.some(r => supervisorRoles.includes(r));
                    if (!hasSupRole && sessionPayload.role !== 'admin') {
                        return NextResponse.redirect(new URL("/academy", req.url))
                    }
                }

                // Check for parent paths
                if (pathname.startsWith("/academy/parent")) {
                    if (sessionPayload.role !== 'parent' && sessionPayload.role !== 'admin') {
                        return NextResponse.redirect(new URL("/academy", req.url))
                    }
                }

                // A-1: Prevent teachers / supervisors from accessing /academy/student/*
                // by manually editing the URL. Redirect each role to its own dashboard.
                // NOTE: admin is intentionally NOT in studentAllowedRoles — the dedicated
                // admin guard above redirects admins to /academy/admin first.
                if (pathname.startsWith("/academy/student")) {
                    const studentAllowedRoles = ['student', 'parent'];
                    const hasStudentAccess = studentAllowedRoles.includes(sessionPayload.role) ||
                        sessionPayload.academy_roles?.some(r => studentAllowedRoles.includes(r));

                    if (!hasStudentAccess) {
                        const role = sessionPayload.role
                        const academyRoles = sessionPayload.academy_roles || []
                        const supervisorRoles = ['supervisor', 'content_supervisor', 'fiqh_supervisor', 'quality_supervisor', 'academy_admin']

                        let target = "/academy"
                        if (role === 'admin') {
                            target = "/academy/admin"
                        } else if (role === 'teacher' || academyRoles.includes('teacher')) {
                            target = "/academy/teacher"
                        } else if (supervisorRoles.includes(role) || academyRoles.some(r => supervisorRoles.includes(r))) {
                            target = "/academy/supervisor"
                        }

                        return NextResponse.redirect(new URL(target, req.url))
                    }
                }
            }
        }

        const response = NextResponse.next()
        return response
    } catch (err) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        // If it's a public path, just show it anyway (even if token is bad)
        const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
        if (publicPaths.includes(normalizedPath || '/')) {
            const response = NextResponse.next()
            response.cookies.delete("better-auth.session_token")
            response.cookies.delete("auth-token")
            return response
        }

        const response = NextResponse.redirect(new URL("/login", req.url))
        response.cookies.delete("better-auth.session_token")
        response.cookies.delete("auth-token")
        return response
    }
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|uploads).*)",
    ],
}
