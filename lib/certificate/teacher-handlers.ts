// Teacher-side handlers for the certificates centre.
//
// A teacher can review and approve certificate issuance requests, but ONLY for
// course-kind requests whose source course they own (courses.teacher_id =
// session.sub). Academy admins are also allowed (so the same surface works for
// them) but they have their own full center as well.
//
// Approval here is a single "approve & issue" step that reuses the shared
// autoIssueRequest helper (approve → render → issue → notify).

import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { createNotification } from "@/lib/notifications"
import { autoIssueRequest } from "@/lib/certificate/eligibility"

const ADMIN_ROLES = ["admin", "academy_admin"]

/**
 * Resolve a course request and verify the caller may act on it.
 * Returns the request row when allowed, otherwise null.
 */
async function loadOwnedCourseRequest(
  requestId: string,
  session: { sub: string; role?: string },
) {
  const req = await queryOne<{
    id: string
    student_id: string
    status: string
    kind: string
    source_table: string | null
    source_id: string | null
    teacher_id: string | null
  }>(
    `SELECT r.id, r.student_id, r.status, r.kind,
            r.source_table, r.source_id, c.teacher_id
       FROM certificate_issuance_requests r
       LEFT JOIN courses c
         ON r.source_table = 'courses' AND c.id = r.source_id
      WHERE r.id = $1 AND r.scope = 'academy'`,
    [requestId],
  )
  if (!req) return null
  // Only course-kind requests are in a teacher's remit.
  if (req.source_table !== "courses" || !req.source_id) return null
  const isAdmin = ADMIN_ROLES.includes(session.role || "")
  const isOwner = req.teacher_id === session.sub
  if (!isAdmin && !isOwner) return null
  return req
}

// =====================================================================
//                   GET /certificates/requests  (list)
// =====================================================================
export function makeTeacherRequestsListGet() {
  return async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session || !requireRole(session, ["teacher", "admin", "academy_admin"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const isAdmin = ADMIN_ROLES.includes(session.role || "")

    const filters: string[] = [
      "r.scope = 'academy'",
      "r.kind = 'course'",
      "r.source_table = 'courses'",
    ]
    const params: unknown[] = []

    // Teachers are scoped to the courses they own; admins see everything.
    if (!isAdmin) {
      params.push(session.sub)
      filters.push(`c.teacher_id = $${params.length}`)
    }
    if (status && status !== "all") {
      params.push(status)
      filters.push(`r.status = $${params.length}`)
    }

    const rows = await query(
      `SELECT r.id, r.status, r.kind, r.language, r.data,
              r.source_label, r.source_id,
              r.rejection_reason, r.certificate_number, r.pdf_url,
              r.requested_at, r.submitted_at, r.approved_at, r.issued_at,
              u.name AS student_name, u.email AS student_email,
              c.title AS course_title
         FROM certificate_issuance_requests r
         JOIN users u ON u.id = r.student_id
         LEFT JOIN courses c ON c.id = r.source_id
        WHERE ${filters.join(" AND ")}
        ORDER BY
          CASE r.status
            WHEN 'submitted' THEN 0
            WHEN 'data_required' THEN 1
            WHEN 'approved' THEN 2
            WHEN 'issued' THEN 3
            WHEN 'rejected' THEN 4
            ELSE 5
          END,
          r.submitted_at DESC NULLS LAST, r.requested_at DESC`,
      params,
    ).catch(() => [])

    const countFilters = ["scope = 'academy'", "kind = 'course'"]
    const countParams: unknown[] = []
    if (!isAdmin) {
      countParams.push(session.sub)
      countFilters.push(
        `source_id IN (SELECT id FROM courses WHERE teacher_id = $${countParams.length})`,
      )
    }
    const counts = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*)::text AS count
         FROM certificate_issuance_requests
        WHERE ${countFilters.join(" AND ")}
        GROUP BY status`,
      countParams,
    ).catch(() => [])

    return NextResponse.json({
      requests: rows,
      counts: counts.reduce<Record<string, number>>((acc, c) => {
        acc[c.status] = Number(c.count)
        return acc
      }, {}),
    })
  }
}

// =====================================================================
//                 PATCH /certificates/requests/[id]
// =====================================================================
export function makeTeacherRequestPatch() {
  return async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    try {
      const session = await getSession()
      if (!session || !requireRole(session, ["teacher", "admin", "academy_admin"])) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      const { id } = await params
      const body = await req.json().catch(() => null)
      if (!body?.action) {
        return NextResponse.json({ error: "Missing action" }, { status: 400 })
      }

      const existing = await loadOwnedCourseRequest(id, session)
      if (!existing) {
        return NextResponse.json(
          { error: "Not found or not permitted" },
          { status: 404 },
        )
      }

      switch (body.action) {
        case "approve": {
          if (!["submitted", "approved"].includes(existing.status)) {
            return NextResponse.json(
              { error: "Cannot approve in current status" },
              { status: 400 },
            )
          }
          // Record who approved, then issue (approve → render → issue → notify).
          await query(
            `UPDATE certificate_issuance_requests
                SET approved_by = $2, approved_at = COALESCE(approved_at, NOW())
              WHERE id = $1`,
            [id, session.sub],
          )
          const result = await autoIssueRequest(id, "academy")
          if (!result.issued) {
            const isNoTemplate = result.reason === "no_template"
            return NextResponse.json(
              {
                error: isNoTemplate
                  ? "تعذر إصدار الشهادة: لا يوجد قالب شهادة افتراضي للدورات. عيّن قالبًا افتراضيًا من إعدادات الشهادات ثم أعد المحاولة."
                  : "تعذر إصدار ملف الشهادة بسبب خطأ في التوليد. حاول مرة أخرى، وإذا تكرر الخطأ تواصل مع الدعم الفني.",
                reason: result.reason || "unknown",
                issued: false,
              },
              { status: 200 },
            )
          }
          const row = await queryOne(
            `SELECT * FROM certificate_issuance_requests WHERE id = $1`,
            [id],
          )
          return NextResponse.json({ request: row, issued: true })
        }
        case "reject": {
          if (!["submitted", "approved"].includes(existing.status)) {
            return NextResponse.json(
              { error: "Cannot reject in current status" },
              { status: 400 },
            )
          }
          const reason = (body.reason || "").toString().trim() || null
          const [row] = await query(
            `UPDATE certificate_issuance_requests
                SET status = 'rejected', rejection_reason = $2,
                    approved_by = $3, approved_at = NOW()
              WHERE id = $1 RETURNING *`,
            [id, reason, session.sub],
          )
          await createNotification({
            userId: existing.student_id,
            type: "general",
            title: "تم رفض طلب الشهادة",
            message: reason
              ? `سبب الرفض: ${reason}`
              : "تم رفض طلب إصدار شهادتك. يمكنك مراجعة البيانات وإعادة الإرسال.",
            category: "system",
            link: "/academy/student/certificates",
            dedupKey: `cert-rejected:${id}:${Date.now()}`,
          }).catch(() => {})
          return NextResponse.json({ request: row })
        }
        default:
          return NextResponse.json({ error: "Unknown action" }, { status: 400 })
      }
    } catch (err) {
      console.error("[teacher-handlers] PATCH failed", err)
      return NextResponse.json(
        {
          error:
            "حدث خطأ غير متوقع أثناء تنفيذ الإجراء. حاول مرة أخرى.",
        },
        { status: 500 },
      )
    }
  }
}
