/**
 * GET /api/lms/lessons - List lessons for a course
 * POST /api/lms/lessons - Create a new lesson (TEACHER/ADMIN only)
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/better-auth-config"
import * as lessonQueries from "@/lib/db-queries/lesson"
import * as courseQueries from "@/lib/db-queries/course"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const courseId = req.nextUrl.searchParams.get("courseId")
    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      )
    }

    const lessons = await lessonQueries.getLessonsByCourse(courseId)
    return NextResponse.json({ success: true, data: lessons })
  } catch (error) {
    console.error("[API] Error fetching lessons:", error)
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
    const { courseId, title, content, orderIndex, duration } = body

    if (!courseId || !title) {
      return NextResponse.json(
        { error: "Course ID and title are required" },
        { status: 400 }
      )
    }

    const course = await courseQueries.getCourseById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Only teacher who created course or admin can create lessons
    if (course.teacher_id !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const lesson = await lessonQueries.createLesson(
      courseId,
      title,
      content || "",
      orderIndex || 0,
      duration
    )

    return NextResponse.json({ success: true, data: lesson }, { status: 201 })
  } catch (error) {
    console.error("[API] Error creating lesson:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
