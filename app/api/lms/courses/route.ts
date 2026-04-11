/**
 * GET /api/lms/courses - List all courses
 * POST /api/lms/courses - Create a new course (TEACHER/ADMIN only)
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/better-auth-config"
import { checkRBAC } from "@/lib/rbac-middleware"
import * as courseQueries from "@/lib/db-queries/course"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")

    // If teacher, only return their courses
    if (session.user.role === "TEACHER") {
      const courses = await courseQueries.getCoursesByTeacher(session.user.id)
      return NextResponse.json({ success: true, data: courses })
    }

    // For students/admin, return all active courses
    const courses = await courseQueries.getAllCourses(limit, offset)
    return NextResponse.json({ success: true, data: courses })
  } catch (error) {
    console.error("[API] Error fetching courses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check RBAC: Only TEACHER and ADMIN can create courses
    const hasPermission = await checkRBAC(session.user.id, "create:course")
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, category } = body

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    const course = await courseQueries.createCourse(
      session.user.id,
      title,
      description || "",
      category || "General"
    )

    return NextResponse.json(
      { success: true, data: course },
      { status: 201 }
    )
  } catch (error) {
    console.error("[API] Error creating course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
