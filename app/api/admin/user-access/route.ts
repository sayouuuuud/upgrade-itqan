import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Verify that the caller is an admin
  const isAdmin = session.role === "admin" || session.academy_roles?.includes("admin")
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 })
  }

  try {
    const { userId, has_quran_access, has_academy_access, platform_preference } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Prepare fields to update
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (has_quran_access !== undefined) {
      updates.push(`has_quran_access = $${paramIndex++}`)
      values.push(has_quran_access)
    }

    if (has_academy_access !== undefined) {
      updates.push(`has_academy_access = $${paramIndex++}`)
      values.push(has_academy_access)
    }

    if (platform_preference !== undefined) {
      updates.push(`platform_preference = $${paramIndex++}`)
      values.push(platform_preference)
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: "No fields to update" }, { status: 200 })
    }

    // Append userId for the WHERE clause
    values.push(userId)

    const queryStr = `
      UPDATE users 
      SET ${updates.join(", ")} 
      WHERE id = $${paramIndex} 
      RETURNING id, name, email, has_quran_access, has_academy_access, platform_preference
    `

    const result = await query(queryStr, values)

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result[0] }, { status: 200 })
  } catch (error) {
    console.error("[API] Error updating user access:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
