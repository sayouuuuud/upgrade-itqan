/**
 * GET /api/lms/parent-student - Get family relationships
 * POST /api/lms/parent-student - Link parent to student
 * DELETE /api/lms/parent-student - Unlink parent from student
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/better-auth-config"
import * as parentQueries from "@/lib/db-queries/parent"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role === "PARENT") {
      // Parents can see their children
      const children = await parentQueries.getStudentChildren(session.user.id)
      return NextResponse.json({ success: true, data: children })
    } else if (session.user.role === "STUDENT") {
      // Students can see their parents
      const parents = await parentQueries.getStudentParents(session.user.id)
      return NextResponse.json({ success: true, data: parents })
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  } catch (error) {
    console.error("[API] Error fetching relationships:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and PARENT can link students
    if (!["ADMIN", "PARENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { studentId, relationship } = body

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 })
    }

    // If parent, can only link to themselves
    if (session.user.role === "PARENT" && session.user.id !== body.parentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const parentId = body.parentId || session.user.id

    const link = await parentQueries.linkParentToStudent(
      parentId,
      studentId,
      relationship || "parent"
    )

    return NextResponse.json({ success: true, data: link }, { status: 201 })
  } catch (error) {
    console.error("[API] Error linking parent-student:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { studentId, parentId } = body

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 })
    }

    // Can only remove if you're the parent or admin
    if (session.user.role === "PARENT" && session.user.id !== parentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!["ADMIN", "PARENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const removed = await parentQueries.removeParentStudentLink(parentId || session.user.id, studentId)
    return NextResponse.json({ success: true, message: "Link removed" })
  } catch (error) {
    console.error("[API] Error removing relationship:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
