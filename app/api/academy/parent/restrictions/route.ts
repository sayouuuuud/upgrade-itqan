import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import {
  ContentRestriction,
  RestrictionType,
  SURAH_NAMES,
  getParentChildRestrictions,
  replaceParentChildAllowList,
} from "@/lib/academy/parent-controls"

function groupedRestrictions(rows: ContentRestriction[]) {
  return {
    surah: rows.filter(r => r.restriction_type === "surah").map(r => r.target_id),
    course: rows.filter(r => r.restriction_type === "course").map(r => r.target_id),
    tajweed_path: rows.filter(r => r.restriction_type === "tajweed_path").map(r => r.target_id),
    memorization_path: rows.filter(r => r.restriction_type === "memorization_path").map(r => r.target_id),
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const childId = new URL(req.url).searchParams.get("childId")
    if (!childId) {
      return NextResponse.json({ error: "معرف الابن مطلوب" }, { status: 400 })
    }

    const rows = await getParentChildRestrictions(session.sub, childId)

    const [courses, tajweedPaths, memorizationPaths] = await Promise.all([
      query(
        `SELECT id, title
           FROM courses
          WHERE (status = 'published' OR is_published = TRUE OR status IS NULL)
            AND COALESCE(is_active, TRUE) = TRUE
          ORDER BY title`,
      ).catch(() => []),
      query(
        `SELECT id, title
           FROM tajweed_paths
          WHERE is_published = TRUE AND is_active = TRUE
          ORDER BY title`,
      ).catch(() => []),
      query(
        `SELECT id, title
           FROM memorization_paths
          WHERE is_published = TRUE AND is_active = TRUE
          ORDER BY title`,
      ).catch(() => []),
    ])

    return NextResponse.json({
      restrictions: groupedRestrictions(rows),
      options: {
        surahs: SURAH_NAMES.map((name, index) => ({ id: String(index + 1), title: name })),
        courses,
        tajweed_paths: tajweedPaths,
        memorization_paths: memorizationPaths,
      },
    })
  } catch (error) {
    console.error("[API] parent restrictions GET error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const childId = body.childId
    if (!childId || typeof childId !== "string") {
      return NextResponse.json({ error: "معرف الابن مطلوب" }, { status: 400 })
    }

    const source = body.restrictions || {}
    const restrictions: Record<RestrictionType, string[]> = {
      surah: Array.isArray(source.surah) ? source.surah : [],
      course: Array.isArray(source.course) ? source.course : [],
      tajweed_path: Array.isArray(source.tajweed_path) ? source.tajweed_path : [],
      memorization_path: Array.isArray(source.memorization_path) ? source.memorization_path : [],
    }

    const success = await replaceParentChildAllowList(session.sub, childId, restrictions)
    if (!success) {
      return NextResponse.json({ error: "هذا الابن غير مرتبط بحسابك" }, { status: 403 })
    }

    const rows = await getParentChildRestrictions(session.sub, childId)
    return NextResponse.json({ success: true, restrictions: groupedRestrictions(rows) })
  } catch (error) {
    console.error("[API] parent restrictions PUT error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
