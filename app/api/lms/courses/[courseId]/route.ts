/**
 * GET /api/lms/courses/[courseId] - Get course details
 * PUT /api/lms/courses/[courseId] - Update course (TEACHER/ADMIN only)
 * DELETE /api/lms/courses/[courseId] - Delete course (TEACHER/ADMIN only)
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/better-auth-config"
import { checkRBAC } from "@/lib/rbac-middleware"
import * as courseQueries from "@/lib/db-queries/course"

interface Params {
  params: { courseId: string }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const course = await courseQueries.getCourseById(params.courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: course })
  } catch (error) {
    console.error("[API] Error fetching course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const course = await courseQueries.getCourseById(params.courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Only teacher who created or admin can update
    if (course.teacher_id !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const updated = await courseQueries.updateCourse(params.courseId, body)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("[API] Error updating course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const course = await courseQueries.getCourseById(params.courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Only teacher who created or admin can delete
    if (course.teacher_id !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const deleted = await courseQueries.deleteCourse(params.courseId)
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete course" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Course deleted" })
  } catch (error) {
    console.error("[API] Error deleting course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
