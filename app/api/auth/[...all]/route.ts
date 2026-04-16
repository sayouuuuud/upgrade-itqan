import { NextResponse } from "next/server"

/**
 * Auth catch-all stub.
 * This project uses custom JWT-based auth routes under /api/auth/*.
 * The better-auth library route handler was removed; return 404 for
 * any unmatched path that lands here.
 */
export async function GET() {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function POST() {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
}
