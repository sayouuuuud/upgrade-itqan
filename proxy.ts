import { NextRequest, NextResponse } from "next/server"

const publicPaths = ["/", "/about", "/contact", "/sitemap-page", "/login", "/login-admin", "/register", "/reader-register", "/teacher-register", "/forgot-password", "/reset-password", "/verify", "/privacy", "/terms", "/maintenance", "/change-password", "/rejected"]
const apiPublicPaths = ["/api/auth", "/api/admin/homepage", "/api/admin/analytics", "/api/uploadthing"]

// Academy public paths (for public lessons and invitations)
const academyPublicPaths = ["/academy/public", "/academy/invite", "/academy/lesson"]

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

    // Allow public paths
    if (publicPaths.includes(pathname)) {
        return NextResponse.next()
    }

    // Allow all auth routes (Better Auth handles /api/auth/*)
    if (pathname.startsWith("/api/auth")) {
        return NextResponse.next()
    }

    // Allow API public paths
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
        // If trying to access admin panel, redirect to login-admin
        if (pathname.startsWith("/admin")) {
            return NextResponse.redirect(new URL("/login-admin", req.url))
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
                        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                        
                        if (supabaseUrl && supabaseKey) {
                            const res = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${sessionPayload.sub}&select=role,is_active,is_disabled,has_academy_access,has_quran_access,approval_status,must_change_password`, {
                                headers: {
                                    'apikey': supabaseKey,
                                    'Authorization': `Bearer ${supabaseKey}`
                                }
                            });
                            
                            if (res.ok) {
                                const userRes = await res.json();
                                if (userRes.length === 0 || userRes[0].is_disabled === true) {
                            // User deleted or disabled - invalidate session (#14: real-time suspension)
                            const response = NextResponse.redirect(new URL("/login", req.url))
                            response.cookies.delete("better-auth.session_token")
                            response.cookies.delete("auth-token")
                            return response
                        }

                        dbUser = userRes[0]

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
                        const gatedRoles = ['teacher', 'reader']
                        const isGatedStatus = dbUser.approval_status === 'pending_approval' || dbUser.approval_status === 'rejected'
                        if (isGatedStatus && gatedRoles.includes(sessionPayload.role)) {
                            const pendingPath = sessionPayload.role === 'teacher' ? '/academy/pending' : '/reader/pending'
                            const allowed =
                                pathname === pendingPath ||
                                pathname.startsWith('/api/auth') ||
                                pathname.startsWith('/api/upload-audio') ||
                                pathname.startsWith('/api/upload-pdf') ||
                                pathname.startsWith('/api/uploadthing') ||
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
                            }
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

                // #1: Strictly prevent teachers from accessing student pages by manual URL entry
                if (pathname.startsWith("/academy/student")) {
                    const isTeacher = sessionPayload.role === 'teacher' || 
                        sessionPayload.academy_roles?.includes('teacher');
                    
                    if (isTeacher && sessionPayload.role !== 'admin') {
                        return NextResponse.redirect(new URL("/academy/teacher", req.url))
                    }
                }

                // Check if user has academy access before allowing them into /academy
                if (pathname.startsWith("/academy") && !academyPublicPaths.some(p => pathname.startsWith(p))) {
                    if (!hasAcademyAccess && sessionPayload.role !== 'admin') {
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
                if (pathname.startsWith("/academy/student")) {
                    const studentAllowedRoles = ['student', 'admin', 'parent'];
                    const hasStudentAccess = studentAllowedRoles.includes(sessionPayload.role) ||
                        sessionPayload.academy_roles?.some(r => studentAllowedRoles.includes(r));

                    if (!hasStudentAccess) {
                        const role = sessionPayload.role
                        const academyRoles = sessionPayload.academy_roles || []
                        const supervisorRoles = ['supervisor', 'content_supervisor', 'fiqh_supervisor', 'quality_supervisor', 'academy_admin']

                        let target = "/academy"
                        if (role === 'teacher' || academyRoles.includes('teacher')) {
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
