import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

const SUPERVISOR_ROLES = [
  "fiqh_supervisor",
  "supervisor",
  "admin",
  "academy_admin",
]

/**
 * GET /api/academy/fiqh/:id
 * Returns the full question with category + asker + officer details.
 *
 * Access rules:
 *  - Supervisors / admins always have access.
 *  - The asker can always see their own question.
 *  - The assigned officer can see the question.
 *  - Anyone can see a published question (no auth needed).
 *
 * When an anonymous viewer fetches a published question we redact the
 * asker's identity. We also bump views_count for published Q&A.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 })

  const session = await getSession()

  const rows = await query<{
    id: string
    title: string | null
    question: string
    answer: string | null
    category: string | null
    category_id: string | null
    category_slug: string | null
    category_name_ar: string | null
    category_name_en: string | null
    asked_by: string
    asker_name: string | null
    asker_avatar: string | null
    assigned_to: string | null
    assigned_to_name: string | null
    answered_by: string | null
    answered_by_name: string | null
    status: string
    publish_consent: string
    publish_consent_requested_at: string | null
    publish_consent_responded_at: string | null
    is_published: boolean
    is_anonymous: boolean
    views_count: number
    asked_at: string
    answered_at: string | null
    published_at: string | null
  }>(
    `
    SELECT
      fq.id, fq.title, fq.question, fq.answer, fq.category,
      fq.status, fq.publish_consent, fq.publish_consent_requested_at,
      fq.publish_consent_responded_at, fq.is_published, fq.is_anonymous,
      fq.views_count, fq.asked_at, fq.answered_at, fq.published_at,
      fq.asked_by, fq.assigned_to, fq.answered_by,
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
    WHERE fq.id = $1
    LIMIT 1
    `,
    [id]
  )

  if (rows.length === 0) {
    return NextResponse.json({ error: "السؤال غير موجود" }, { status: 404 })
  }

  const q = rows[0]
  const isPublic = !!q.is_published && !!q.answer
  const isSupervisor = !!session && SUPERVISOR_ROLES.includes(session.role)
  const isAsker = !!session && q.asked_by === session.sub
  const isAssignedOfficer = !!session && q.assigned_to === session.sub

  if (!isPublic && !isSupervisor && !isAsker && !isAssignedOfficer) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  // Bump views counter for public reads (don't block the response on it).
  if (isPublic && !isAsker && !isSupervisor && !isAssignedOfficer) {
    query(`UPDATE fiqh_questions SET views_count = views_count + 1 WHERE id = $1`, [id]).catch(
      () => {}
    )
  }

  // Redact asker identity for anonymous published Q&A when the viewer is
  // not the asker / staff.
  const canSeeAsker = isAsker || isSupervisor || isAssignedOfficer
  const safe = {
    ...q,
    asker_name: canSeeAsker
      ? q.asker_name
      : q.is_anonymous
      ? null
      : q.asker_name,
    asker_avatar: canSeeAsker
      ? q.asker_avatar
      : q.is_anonymous
      ? null
      : q.asker_avatar,
    asked_by: canSeeAsker ? q.asked_by : null,
  }

  return NextResponse.json({ question: safe })
}

/**
 * DELETE /api/academy/fiqh/:id  — admin only
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !["admin", "academy_admin"].includes(session.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }
  const { id } = await params
  const r = await queryOne(`DELETE FROM fiqh_questions WHERE id = $1 RETURNING id`, [id])
  if (!r) return NextResponse.json({ error: "السؤال غير موجود" }, { status: 404 })
  return NextResponse.json({ ok: true })
}

/**
 * PATCH /api/academy/fiqh/:id  — admin reassignment / publication toggle
 *
 * Body can contain:
 *   { assignedTo?: string | null }            — change the officer
 *   { isPublished?: boolean }                 — admin-force publish/unpublish
 *   { categoryId?: string }                   — re-categorise
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !["admin", "academy_admin"].includes(session.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const sets: string[] = []
  const values: unknown[] = []
  let i = 1

  if (body.assignedTo === null || typeof body.assignedTo === "string") {
    sets.push(`assigned_to = $${i++}`)
    values.push(body.assignedTo)
    // Bump status from pending -> assigned when an officer is set.
    if (body.assignedTo) {
      sets.push(`status = CASE WHEN status = 'pending' THEN 'assigned' ELSE status END`)
    }
  }
  if (typeof body.categoryId === "string") {
    sets.push(`category_id = $${i++}`)
    values.push(body.categoryId)
  }
  if (typeof body.isPublished === "boolean") {
    sets.push(`is_published = $${i++}`)
    values.push(body.isPublished)
    if (body.isPublished) {
      sets.push(`status = 'published'`, `published_at = COALESCE(published_at, NOW())`)
    } else {
      sets.push(`status = CASE WHEN status = 'published' THEN 'closed' ELSE status END`)
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "لا يوجد تغييرات" }, { status: 400 })
  }

  sets.push(`updated_at = NOW()`)
  values.push(id)

  const r = await query(
    `UPDATE fiqh_questions SET ${sets.join(", ")} WHERE id = $${i} RETURNING id`,
    values
  )
  if (!r.length) return NextResponse.json({ error: "السؤال غير موجود" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
