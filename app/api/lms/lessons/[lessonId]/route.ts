/**
 * GET /api/lms/lessons/[lessonId] - Get lesson details
 * PUT /api/lms/lessons/[lessonId] - Update lesson
 * DELETE /api/lms/lessons/[lessonId] - Delete lesson
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/better-auth-config"
import * as lessonQueries from "@/lib/db-queries/lesson"
import * as courseQueries from "@/lib/db-queries/course"

interface Params {
  params: { lessonId: string }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const lesson = await lessonQueries.getLessonById(params.lessonId)
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: lesson })
  } catch (error) {
    console.error("[API] Error fetching lesson:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const lesson = await lessonQueries.getLessonById(params.lessonId)
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    // Verify permission
    const course = await courseQueries.getCourseById(lesson.course_id)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (course.teacher_id !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const updated = await lessonQueries.updateLesson(params.lessonId, body)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("[API] Error updating lesson:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const lesson = await lessonQueries.getLessonById(params.lessonId)
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    const course = await courseQueries.getCourseById(lesson.course_id)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (course.teacher_id !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const deleted = await lessonQueries.deleteLesson(params.lessonId)
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Lesson deleted" })
  } catch (error) {
    console.error("[API] Error deleting lesson:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
