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
