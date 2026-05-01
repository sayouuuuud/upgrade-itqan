import { NextRequest, NextResponse } from "next/server"

const publicPaths = ["/", "/about", "/contact", "/sitemap-page", "/login", "/login-admin", "/register", "/reader-register", "/teacher-register", "/forgot-password", "/reset-password", "/verify", "/privacy", "/terms", "/maintenance", "/change-password"]
const apiPublicPaths = ["/api/auth", "/api/admin/homepage", "/api/admin/analytics", "/api/uploadthing"]

// Academy public paths (for public lessons and invitations)
const academyPublicPaths = ["/academy/public", "/academy/invite", "/academy/lesson"]

export async function middleware(req: NextRequest) {
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

    // Check Better Auth session cookie
    const sessionCookie = req.cookies.get("better-auth.session_token")?.value || req.cookies.get("auth-token")?.value

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
            const { query } = await import("@/lib/db")
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
                        const userRes = await query<any>(
                            `SELECT role, is_active, is_disabled, has_academy_access, has_quran_access, 
                                    approval_status, must_change_password
                             FROM users WHERE id = $1 LIMIT 1`,
                            [sessionPayload.sub]
                        )

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

                        // Check if user approval status changed (e.g., reader was rejected)
                        if (dbUser.approval_status === 'rejected' && ['reader'].includes(sessionPayload.role)) {
                            const response = NextResponse.redirect(new URL("/login", req.url))
                            response.cookies.delete("better-auth.session_token")
                            response.cookies.delete("auth-token")
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
                    if (!hasQuranAccess && sessionPayload.role !== 'admin' && sessionPayload.role !== 'reader') {
                        const target = hasAcademyAccess
                            ? `/academy/${sessionPayload.role === 'parent' ? 'parent' : 'student'}`
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
