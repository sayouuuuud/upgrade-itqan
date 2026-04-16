import { NextRequest, NextResponse } from "next/server"

const publicPaths = ["/", "/about", "/contact", "/sitemap-page", "/login", "/login-admin", "/register", "/reader-register", "/forgot-password", "/reset-password", "/verify", "/privacy", "/terms", "/maintenance"]
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
    if (!process.env.DATABASE_URL) {
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
            const sessionPayload = await verifyToken(sessionCookie)

            if (sessionPayload) {
                // Check if user has academy access before allowing them into /academy
                if (pathname.startsWith("/academy") && !academyPublicPaths.some(p => pathname.startsWith(p))) {
                    // If access is explicitly false (ignoring undefined for older sessions), deny access
                    if (sessionPayload.has_academy_access === false && sessionPayload.role !== 'admin') {
                        return NextResponse.redirect(new URL("/student", req.url))
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
