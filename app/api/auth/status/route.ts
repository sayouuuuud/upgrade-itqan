import { NextResponse } from "next/server"
import { getSession, getRoleHomePath } from "@/lib/auth"

export async function GET() {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ authenticated: false })
    }

    // Route the homepage header button to the user's real landing page.
    const dashboardLink = getRoleHomePath(session)
    const dashboardText = dashboardLink.startsWith("/admin") ? "لوحة التحكم" : "حسابي"

    return NextResponse.json({
        authenticated: true,
        user: {
            role: session.role,
            name: session.name
        },
        dashboardLink,
        dashboardText
    })
}
