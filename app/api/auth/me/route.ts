import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

// GET /api/auth/me — return full user profile including avatar
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "غير مسجل" }, { status: 401 })
    }

    const rows = await query<{
      id: string
      name: string
      email: string
      role: string
      avatar_url: string | null
      gender: string | null
      phone: string | null
      city: string | null
      is_accepting_recitations: boolean
      student_status: string
      has_quran_access: boolean
      has_academy_access: boolean
      platform_preference: string
      approval_status: string | null
    }>(
      `SELECT id, name, email, role, avatar_url, gender, phone, city, is_accepting_recitations, student_status, has_quran_access, has_academy_access, platform_preference, approval_status FROM users WHERE id = $1`,
      [session.sub]
    )

    if (!rows.length) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })
    }

    const user = rows[0]

    // If reader, also fetch reader_profile fields
    if (user.role === 'reader') {
      const profile = await queryOne<{
        availability_mode: string
        availability_expires_at: string | null
        current_reserved_slots: number
        max_total_slots: number
      }>(
        `SELECT availability_mode, availability_expires_at, current_reserved_slots, max_total_slots 
         FROM reader_profiles WHERE user_id = $1`,
        [user.id]
      )
      if (profile) {
        Object.assign(user, profile)
      }
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Auth me error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// PATCH /api/auth/me — update name and/or avatar_url
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const body = await req.json()
    const { name, avatar_url, phone, gender, city, is_accepting_recitations, platform_preference } = body

    const updates: string[] = []
    const params: unknown[] = []

    if (name !== undefined) {
      params.push(name)
      updates.push(`name = $${params.length}`)
    }
    if (avatar_url !== undefined) {
      params.push(avatar_url)
      updates.push(`avatar_url = $${params.length}`)
    }
    if (phone !== undefined) {
      params.push(phone)
      updates.push(`phone = $${params.length}`)
    }
    if (gender !== undefined) {
      params.push(gender)
      updates.push(`gender = $${params.length}`)
    }
    if (is_accepting_recitations !== undefined) {
      params.push(is_accepting_recitations)
      updates.push(`is_accepting_recitations = $${params.length}`)
    }
    if (platform_preference !== undefined) {
      params.push(platform_preference)
      updates.push(`platform_preference = $${params.length}`)
    }
    if (city !== undefined) {
      params.push(city)
      updates.push(`city = $${params.length}`)
    }

    // Reader-only updates
    const { availability_mode, max_total_slots, availability_expires_at } = body
    if (session.role === 'reader') {
      const readerUpdates: string[] = []
      const readerParams: unknown[] = []
      
      if (availability_mode !== undefined) {
        readerParams.push(availability_mode)
        readerUpdates.push(`availability_mode = $${readerParams.length}`)
      }
      if (max_total_slots !== undefined) {
        readerParams.push(max_total_slots)
        readerUpdates.push(`max_total_slots = $${readerParams.length}`)
      }
      if (availability_expires_at !== undefined) {
        readerParams.push(availability_expires_at)
        readerUpdates.push(`availability_expires_at = $${readerParams.length}`)
      }

      if (readerUpdates.length > 0) {
        readerParams.push(session.sub)
        await query(
          `UPDATE reader_profiles SET ${readerUpdates.join(", ")}, updated_at = NOW() WHERE user_id = $${readerParams.length}`,
          readerParams
        )
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 })
    }

    params.push(session.sub)
    const result = await query<{ id: string; name: string; email: string; avatar_url: string | null; role: string; city: string | null }>(
      `UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${params.length}
       RETURNING id, name, email, avatar_url, role, city`,
      params
    )

    return NextResponse.json({ user: result[0] })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
