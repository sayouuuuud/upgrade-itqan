/**
 * GET /api/lms/progress - Get student progress
 * POST /api/lms/progress - Update student progress
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/better-auth-config"
import * as courseQueries from "@/lib/db-queries/course"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const courseId = req.nextUrl.searchParams.get("courseId")
    if (!courseId) {
      return NextResponse.json({ error: "Course ID required" }, { status: 400 })
    }

    const progress = await courseQueries.getStudentProgress(session.user.id, courseId)
    return NextResponse.json({ success: true, data: progress })
  } catch (error) {
    console.error("[API] Error fetching progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { courseId, lessonId, isCompleted } = body

    if (!courseId || !lessonId) {
      return NextResponse.json(
        { error: "Course ID and Lesson ID are required" },
        { status: 400 }
      )
    }

    const progress = await courseQueries.updateStudentProgress(
      session.user.id,
      courseId,
      lessonId,
      isCompleted || false
    )

    return NextResponse.json({ success: true, data: progress })
  } catch (error) {
    console.error("[API] Error updating progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
