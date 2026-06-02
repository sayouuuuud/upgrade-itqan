import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import {
  notifyNewFiqhQuestion,
  pickOfficerForCategory,
  resolveCategory,
} from "@/lib/fiqh-helpers"

const ADMIN_LIKE_ROLES = ["admin", "academy_admin"]
const SUPERVISOR_LIKE_ROLES = [
  ...ADMIN_LIKE_ROLES,
  "fiqh_supervisor",
  "supervisor",
]

/**
 * GET /api/academy/fiqh
 *
 * Supported views (via ?view=...):
 *   - `library` (default for public/students): returns published Q&A, joined
 *      with their category + officer + asker. Supports `category`, `q` (search)
 *      and `limit/offset` pagination.
 *   - `mine`: the current user's own questions across every status, newest
 *      first. Bypasses the "published only" filter.
 *   - `inbox`: for fiqh_supervisor / officer users — questions assigned to
 *      *them* with a `status` filter (`open` = assigned+in_progress+answered,
 *      `awaiting_consent`, `published`, `closed`, `all`).
 *   - `admin`: admin-only view returning ALL questions (including closed-with-
 *      answer) so the admin can audit officer replies even when the asker
 *      denied publication.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  const { searchParams } = new URL(req.url)
  const rawView = searchParams.get("view") || "library"
  const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10) || 30, 100)
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0)
  const categorySlug = searchParams.get("category")?.trim() || ""
  const searchText = searchParams.get("q")?.trim() || ""
  const statusFilter = searchParams.get("status")?.trim() || ""

  // Library is the only view we let unauthenticated users hit, because we
  // want anyone landing on /academy/fiqh to be able to browse published Q&A.
  if (rawView !== "library" && !session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    if (rawView === "library") {
      return await getLibrary({ limit, offset, categorySlug, searchText })
    }

    if (!session) {
      // Re-check (typescript flow); already handled above.
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    if (rawView === "mine") {
      return await getMine(session.sub, { limit, offset, statusFilter })
    }

    if (rawView === "inbox") {
      return await getInbox(session.sub, session.role, { limit, offset, statusFilter, categorySlug, searchText })
    }

    if (rawView === "admin") {
      if (!ADMIN_LIKE_ROLES.includes(session.role)) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
      }
      return await getAdminAll({ limit, offset, statusFilter, categorySlug, searchText })
    }

    return NextResponse.json({ error: "view غير معروفة" }, { status: 400 })
  } catch (error) {
    console.error("[fiqh] GET error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

/**
 * Common SELECT clause that joins the question with its category, asker,
 * assigned officer, and answerer so the UI can render everything in one
 * pass without N+1 lookups.
 */
const BASE_SELECT = `
  SELECT
    fq.id,
    fq.title,
    fq.question,
    fq.answer,
    fq.status,
    fq.publish_consent,
    fq.publish_consent_requested_at,
    fq.publish_consent_responded_at,
    fq.is_published,
    fq.is_anonymous,
    fq.views_count,
    fq.asked_at,
    fq.answered_at,
    fq.published_at,
    fq.asked_by,
    fq.assigned_to,
    fq.answered_by,
    fq.extra_data,
    fq.category   AS category_slug_legacy,
    cat.id        AS category_id,
    cat.slug      AS category_slug,
    cat.name      AS category_name_ar,
    cat.name      AS category_name_en,
    asker.name    AS asker_name,
    asker.avatar_url AS asker_avatar,
    assignee.name AS assigned_to_name,
    answerer.name AS answered_by_name
  FROM fiqh_questions fq
  LEFT JOIN categories cat  ON cat.id = fq.category_id
  LEFT JOIN users asker     ON asker.id    = fq.asked_by
  LEFT JOIN users assignee  ON assignee.id = fq.assigned_to
  LEFT JOIN users answerer  ON answerer.id = fq.answered_by
`

async function getLibrary(opts: {
  limit: number
  offset: number
  categorySlug: string
  searchText: string
}) {
  const params: unknown[] = []
  const where: string[] = [
    `fq.is_published = TRUE`,
    `fq.answer IS NOT NULL`,
    `fq.status = 'published'`,
  ]

  if (opts.categorySlug) {
    params.push(opts.categorySlug)
    where.push(`(cat.slug = $${params.length} OR fq.category = $${params.length})`)
  }

  if (opts.searchText) {
    params.push(opts.searchText)
    where.push(`(
      fq.title    ILIKE '%' || $${params.length} || '%' OR
      fq.question ILIKE '%' || $${params.length} || '%' OR
      fq.answer   ILIKE '%' || $${params.length} || '%'
    )`)
  }

  params.push(opts.limit, opts.offset)
  const sql = `
    ${BASE_SELECT}
    WHERE ${where.join(" AND ")}
    ORDER BY fq.published_at DESC NULLS LAST, fq.answered_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `

  const questions = await query(sql, params)

  // Anonymise the asker before sending to the public library so we never
  // leak names of people who chose anonymity.
  const safe = (questions as Array<Record<string, unknown>>).map((q) => ({
    ...q,
    asker_name: q.is_anonymous ? null : q.asker_name,
    asker_avatar: q.is_anonymous ? null : q.asker_avatar,
    asked_by: null,
  }))

  return NextResponse.json({ questions: safe })
}

async function getMine(
  userId: string,
  opts: { limit: number; offset: number; statusFilter: string }
) {
  const params: unknown[] = [userId]
  const where: string[] = [`fq.asked_by = $1`]
  if (opts.statusFilter && opts.statusFilter !== "all") {
    params.push(opts.statusFilter)
    where.push(`fq.status = $${params.length}`)
  }
  params.push(opts.limit, opts.offset)
  const sql = `
    ${BASE_SELECT}
    WHERE ${where.join(" AND ")}
    ORDER BY fq.asked_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `
  const questions = await query(sql, params)
  return NextResponse.json({ questions })
}

async function getInbox(
  userId: string,
  role: string,
  opts: {
    limit: number
    offset: number
    statusFilter: string
    categorySlug: string
    searchText: string
  }
) {
  const params: unknown[] = []
  const where: string[] = []

  // fiqh_supervisor / supervisor see EVERY question they're assigned to OR
  // any question without an officer assignment (so they can grab unassigned
  // ones too). Admins call ?view=admin instead.
  if (role === "fiqh_supervisor" || role === "supervisor") {
    params.push(userId)
    where.push(`(fq.assigned_to = $${params.length} OR fq.assigned_to IS NULL)`)
  } else {
    // Generic users only see questions explicitly assigned to them
    // (e.g. an admin who is also a fiqh_officer).
    params.push(userId)
    where.push(`fq.assigned_to = $${params.length}`)
  }

  if (opts.statusFilter && opts.statusFilter !== "all") {
    if (opts.statusFilter === "open") {
      where.push(`fq.status IN ('pending','assigned','in_progress')`)
    } else if (opts.statusFilter === "awaiting_consent") {
      where.push(`fq.status = 'awaiting_consent'`)
    } else if (opts.statusFilter === "published") {
      where.push(`fq.status = 'published'`)
    } else if (opts.statusFilter === "closed") {
      where.push(`fq.status IN ('declined','closed')`)
    } else {
      params.push(opts.statusFilter)
      where.push(`fq.status = $${params.length}`)
    }
  }

  if (opts.categorySlug) {
    params.push(opts.categorySlug)
    where.push(`(cat.slug = $${params.length} OR fq.category = $${params.length})`)
  }

  if (opts.searchText) {
    params.push(opts.searchText)
    where.push(`(
      fq.title    ILIKE '%' || $${params.length} || '%' OR
      fq.question ILIKE '%' || $${params.length} || '%' OR
      fq.answer   ILIKE '%' || $${params.length} || '%'
    )`)
  }

  params.push(opts.limit, opts.offset)
  const sql = `
    ${BASE_SELECT}
    WHERE ${where.join(" AND ")}
    ORDER BY
      CASE WHEN fq.status IN ('pending','assigned','in_progress') THEN 0 ELSE 1 END,
      fq.asked_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `
  const questions = await query(sql, params)
  const counts = await getInboxCounts(userId, role)
  return NextResponse.json({ questions, counts })
}

async function getInboxCounts(userId: string, role: string) {
  const baseWhere =
    role === "fiqh_supervisor" || role === "supervisor"
      ? `(assigned_to = $1 OR assigned_to IS NULL)`
      : `assigned_to = $1`
  const rows = await query<{ bucket: string; count: number }>(
    `
    SELECT 'open' AS bucket, COUNT(*)::int AS count
      FROM fiqh_questions WHERE ${baseWhere}
        AND status IN ('pending','assigned','in_progress')
    UNION ALL
    SELECT 'awaiting_consent', COUNT(*)::int
      FROM fiqh_questions WHERE ${baseWhere} AND status = 'awaiting_consent'
    UNION ALL
    SELECT 'published', COUNT(*)::int
      FROM fiqh_questions WHERE ${baseWhere} AND status = 'published'
    UNION ALL
    SELECT 'closed', COUNT(*)::int
      FROM fiqh_questions WHERE ${baseWhere} AND status IN ('declined','closed')
    UNION ALL
    SELECT 'all', COUNT(*)::int
      FROM fiqh_questions WHERE ${baseWhere}
    `,
    [userId]
  )
  const out: Record<string, number> = {}
  for (const r of rows) out[r.bucket] = Number(r.count) || 0
  return out
}

async function getAdminAll(opts: {
  limit: number
  offset: number
  statusFilter: string
  categorySlug: string
  searchText: string
}) {
  const params: unknown[] = []
  const where: string[] = ["1=1"]

  if (opts.statusFilter && opts.statusFilter !== "all") {
    if (opts.statusFilter === "open") {
      where.push(`fq.status IN ('pending','assigned','in_progress')`)
    } else if (opts.statusFilter === "awaiting_consent") {
      where.push(`fq.status = 'awaiting_consent'`)
    } else if (opts.statusFilter === "published") {
      where.push(`fq.status = 'published'`)
    } else if (opts.statusFilter === "closed") {
      where.push(`fq.status IN ('declined','closed')`)
    } else {
      params.push(opts.statusFilter)
      where.push(`fq.status = $${params.length}`)
    }
  }

  if (opts.categorySlug) {
    params.push(opts.categorySlug)
    where.push(`(cat.slug = $${params.length} OR fq.category = $${params.length})`)
  }

  if (opts.searchText) {
    params.push(opts.searchText)
    where.push(`(
      fq.title    ILIKE '%' || $${params.length} || '%' OR
      fq.question ILIKE '%' || $${params.length} || '%' OR
      fq.answer   ILIKE '%' || $${params.length} || '%'
    )`)
  }

  params.push(opts.limit, opts.offset)
  const sql = `
    ${BASE_SELECT}
    WHERE ${where.join(" AND ")}
    ORDER BY
      CASE WHEN fq.status IN ('pending','assigned','in_progress') THEN 0 ELSE 1 END,
      fq.asked_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `
  const questions = await query(sql, params)

  // Compute aggregate counts for the admin tabs
  const counts = await query<{ bucket: string; count: number }>(
    `
    SELECT 'open' AS bucket, COUNT(*)::int AS count
      FROM fiqh_questions WHERE status IN ('pending','assigned','in_progress')
    UNION ALL
    SELECT 'awaiting_consent', COUNT(*)::int FROM fiqh_questions WHERE status = 'awaiting_consent'
    UNION ALL
    SELECT 'published', COUNT(*)::int FROM fiqh_questions WHERE status = 'published'
    UNION ALL
    SELECT 'closed', COUNT(*)::int FROM fiqh_questions WHERE status IN ('declined','closed')
    UNION ALL
    SELECT 'all', COUNT(*)::int FROM fiqh_questions
    `
  )
  const countMap: Record<string, number> = {}
  for (const c of counts) countMap[c.bucket] = Number(c.count) || 0

  return NextResponse.json({ questions, counts: countMap })
}

/**
 * POST /api/academy/fiqh
 *
 * Submit a new fiqh question. Open to ANY authenticated user (academy
 * students, maqraa students, readers, parents…). Auto-assigns the
 * question to the officer with the lightest open queue in the chosen
 * category; if no officer exists for the category, it falls through
 * to the admin inbox in the unassigned state.
 *
 * Body:
 *   { title?: string, question: string, categoryId?: string,
 *     category?: string  // slug, alternative to categoryId
 *     isAnonymous?: boolean }
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const title = typeof body?.title === "string" ? body.title.trim() : ""
    const question = typeof body?.question === "string" ? body.question.trim() : ""
    const isAnonymous = body?.isAnonymous === true
    const extraData = body?.extraData && typeof body.extraData === 'object' ? body.extraData : {}
    const categoryRef =
      (typeof body?.categoryId === "string" && body.categoryId.trim()) ||
      (typeof body?.category === "string" && body.category.trim()) ||
      ""

    if (!question || question.length < 5) {
      return NextResponse.json(
        { error: "نص السؤال مطلوب (5 أحرف على الأقل)" },
        { status: 400 }
      )
    }
    if (!categoryRef) {
      return NextResponse.json(
        { error: "اختر تصنيف السؤال" },
        { status: 400 }
      )
    }

    const category = await resolveCategory(categoryRef)
    if (!category) {
      return NextResponse.json(
        { error: "تصنيف غير معروف أو غير مفعّل" },
        { status: 400 }
      )
    }

    // Find an officer to auto-assign. If none, leave NULL (admin handles).
    const officer = await pickOfficerForCategory(category.id)
    const assignedTo = officer?.user_id ?? null
    const status = assignedTo ? "assigned" : "pending"

    const inserted = await queryOne<{ id: string }>(
      `INSERT INTO fiqh_questions (
         asked_by, title, question, category, category_id,
         assigned_to, status, is_anonymous, source_role, asked_at, extra_data
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
       RETURNING id`,
      [
        session.sub,
        title || null,
        question,
        category.slug,
        category.id,
        assignedTo,
        status,
        isAnonymous,
        session.role,
        JSON.stringify(extraData)
      ]
    )

    if (!inserted) {
      return NextResponse.json({ error: "تعذّر إنشاء السؤال" }, { status: 500 })
    }

    // Fire notifications (officer + always to admins)
    notifyNewFiqhQuestion({
      questionId: inserted.id,
      categoryId: category.id,
      categoryNameAr: category.name_ar,
      askerName: session.name || "مستخدم",
      isAnonymous,
      assignedOfficerUserId: assignedTo,
    }).catch((err) => {
      console.warn("[fiqh] notify failed (non-fatal):", err)
    })

    return NextResponse.json({
      id: inserted.id,
      status,
      assigned_to: assignedTo,
      category: { id: category.id, slug: category.slug, name_ar: category.name_ar },
    })
  } catch (error) {
    console.error("[fiqh] POST error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

/**
 * Roles allowed to call /api/academy/fiqh in admin-style modes. Re-exported
 * for tests and admin handlers.
 */
export const FIQH_SUPERVISOR_ROLES = SUPERVISOR_LIKE_ROLES
