/**
 * GET /api/lms/invitations - Get user's invitations
 * POST /api/lms/invitations - Create invitation
 * DELETE /api/lms/invitations/[id] - Revoke invitation
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/better-auth-config"
import * as invitationQueries from "@/lib/db-queries/invitation"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and TEACHER can view invitations
    if (!["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const invitations = await invitationQueries.getInvitationsByCreator(session.user.id)
    return NextResponse.json({ success: true, data: invitations })
  } catch (error) {
    console.error("[API] Error fetching invitations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { email, role, parentEmail } = body

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      )
    }

    const invitation = await invitationQueries.createInvitation(
      email,
      role,
      session.user.id,
      parentEmail
    )

    return NextResponse.json({ success: true, data: invitation }, { status: 201 })
  } catch (error) {
    console.error("[API] Error creating invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
