/**
 * GET /api/lms/courses - List all courses (with gender segregation for students)
 * POST /api/lms/courses - Create a new course (TEACHER/ADMIN only)
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { checkRBAC } from "@/lib/rbac-middleware"
import { queryOne } from "@/lib/db"
import * as courseQueries from "@/lib/db-queries/course"

// Roles that bypass gender segregation
const BYPASS_GENDER_ROLES = ['admin', 'reciter_supervisor', 'student_supervisor']

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")

    // If reader (teacher), only return their courses
    if (session.role === "reader") {
      const courses = await courseQueries.getCoursesByTeacher(session.sub)
      return NextResponse.json({ success: true, data: courses })
    }

    // Check if user role bypasses gender filter
    const bypassGenderFilter = BYPASS_GENDER_ROLES.includes(session.role)

    if (bypassGenderFilter) {
      // Admin/supervisor: return all courses
      const courses = await courseQueries.getAllCourses(limit, offset)
      return NextResponse.json({ success: true, data: courses })
    }

    // For students: filter courses by teacher gender matching student gender
    const user = await queryOne<{ gender: string }>(
      `SELECT gender FROM users WHERE id = $1`,
      [session.sub]
    )

    if (user?.gender) {
      // Return courses taught by teachers of the same gender
      const courses = await courseQueries.getAllCoursesWithGenderFilter(user.gender, limit, offset)
      return NextResponse.json({ success: true, data: courses })
    }

    // Fallback: if gender not set, return all courses
    const courses = await courseQueries.getAllCourses(limit, offset)
    return NextResponse.json({ success: true, data: courses })
  } catch (error) {
    console.error("[API] Error fetching courses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check RBAC: Only reader (teacher) and admin can create courses
    const hasPermission = await checkRBAC(session.sub, "create:course")
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
      session.sub,
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
