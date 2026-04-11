/**
 * POST /api/lms/courses/[courseId]/enroll - Enroll student in course
 * GET /api/lms/courses/[courseId]/enroll - Get enrolled students
 * DELETE /api/lms/courses/[courseId]/enroll - Remove student from course
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/better-auth-config"
import * as courseQueries from "@/lib/db-queries/course"

interface Params {
  params: { courseId: string }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { studentId } = body

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 })
    }

    const course = await courseQueries.getCourseById(params.courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Only teacher of the course or admin can enroll students
    if (course.teacher_id !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const enrollment = await courseQueries.enrollStudent(params.courseId, studentId)
    return NextResponse.json({ success: true, data: enrollment }, { status: 201 })
  } catch (error) {
    console.error("[API] Error enrolling student:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
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

    // Only teacher or admin can view enrollments
    if (course.teacher_id !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const students = await courseQueries.getEnrolledStudents(params.courseId)
    return NextResponse.json({ success: true, data: students })
  } catch (error) {
    console.error("[API] Error fetching enrollments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { studentId } = body

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 })
    }

    const course = await courseQueries.getCourseById(params.courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Only teacher or admin can remove students
    if (course.teacher_id !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const removed = await courseQueries.removeCourseEnrollment(params.courseId, studentId)
    return NextResponse.json({ success: true, message: "Student removed from course" })
  } catch (error) {
    console.error("[API] Error removing student:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
