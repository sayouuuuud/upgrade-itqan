// Shared student-side handlers for the certificates centre.
//
// Like admin-handlers.ts, factor out the academy/maqraa-specific
// scope so both portals share the same backend behaviour.

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { getAllSettings, type CertificateScope } from "@/lib/certificates"
import { autoIssueRequest } from "@/lib/certificate/eligibility"

export interface StudentSpec {
  scope: CertificateScope
}

// =====================================================================
//                       /certificates  — GET (dashboard)
// =====================================================================
export function makeStudentCertificatesGet(spec: StudentSpec) {
  return async function GET() {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      const requests = await query<{
        id: string
        kind: string
        status: string
        source_label: string | null
        source_table: string | null
        source_id: string | null
        template_id: string | null
        template_name: string | null
        language: string
        data: Record<string, unknown> | null
        rejection_reason: string | null
        requested_at: string
        submitted_at: string | null
        approved_at: string | null
        issued_at: string | null
        certificate_number: string | null
        serial_code: string | null
        pdf_url: string | null
        teacher_name: string | null
        reason: string | null
        rank: number | null
      }>(
        `SELECT r.id, r.kind, r.status, r.source_label, r.source_table, r.source_id,
                r.template_id, t.name AS template_name, r.language, r.data,
                r.rejection_reason, r.requested_at, r.submitted_at,
                r.approved_at, r.issued_at, r.certificate_number,
                r.serial_code, r.pdf_url,
                NULL::text AS teacher_name,
                r.reason, r.rank
           FROM certificate_issuance_requests r
           LEFT JOIN certificate_templates t ON t.id = r.template_id
          WHERE r.student_id = $1 AND r.scope = $2
          ORDER BY r.requested_at DESC`,
        [session.sub, spec.scope],
      ).catch(() => [])

      let legacy: Array<{
        id: string
        course_name: string
        teacher_name: string
        issued_at: string
        pdf_url: string | null
        certificate_number: string | null
      }> = []

      // Academy: pull legacy academy_certificates rows that aren't tied
      // to the new pipeline yet.
      if (spec.scope === "academy") {
        legacy = await query<{
          id: string
          course_name: string
          teacher_name: string
          issued_at: string
          pdf_url: string | null
          certificate_number: string | null
        }>(
          `SELECT cert.id,
                  c.title AS course_name,
                  u.name  AS teacher_name,
                  cert.issued_at,
                  cert.pdf_url,
                  cert.certificate_number
             FROM academy_certificates cert
             JOIN courses c ON cert.course_id = c.id
             LEFT JOIN users u ON c.teacher_id = u.id
            WHERE cert.student_id = $1
              AND (cert.request_id IS NULL OR cert.request_id NOT IN (
                SELECT id FROM certificate_issuance_requests
                 WHERE student_id = $1 AND scope = 'academy'
              ))
            ORDER BY cert.issued_at DESC`,
          [session.sub],
        ).catch(() => [] as Array<{
          id: string
          course_name: string
          teacher_name: string
          issued_at: string
          pdf_url: string | null
          certificate_number: string | null
        }>)
      }

      return NextResponse.json({
        data_required: requests.filter((r) => r.status === "data_required"),
        submitted: requests.filter((r) => r.status === "submitted"),
        approved: requests.filter((r) => r.status === "approved"),
        rejected: requests.filter((r) => r.status === "rejected"),
        issued: [
          ...requests.filter((r) => r.status === "issued"),
          ...legacy.map((l) => ({
            id: l.id,
            kind: "course",
            status: "issued",
            source_label: l.course_name,
            source_table: "courses",
            source_id: null,
            template_id: null,
            template_name: null,
            language: "ar",
            data: null,
            rejection_reason: null,
            requested_at: l.issued_at,
            submitted_at: l.issued_at,
            approved_at: l.issued_at,
            issued_at: l.issued_at,
            certificate_number: l.certificate_number,
            serial_code: null,
            pdf_url: l.pdf_url,
            teacher_name: l.teacher_name,
            reason: null,
            rank: null,
            legacy: true,
          })),
        ],
      })
    } catch (error) {
      console.error("[API] Error fetching certificates:", error)
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      )
    }
  }
}

// =====================================================================
//                       /pending-count  — GET
// =====================================================================
export function makeStudentPendingCountGet(spec: StudentSpec) {
  return async function GET() {
    const session = await getSession()
    if (!session) return NextResponse.json({ count: 0 })

    try {
      const row = await queryOne<{ c: string }>(
        `SELECT COUNT(*)::text AS c
           FROM certificate_issuance_requests
          WHERE student_id = $1 AND scope = $2
            AND status = 'data_required'`,
        [session.sub, spec.scope],
      )
      return NextResponse.json({ count: parseInt(row?.c || "0", 10) })
    } catch {
      return NextResponse.json({ count: 0 })
    }
  }
}

// =====================================================================
//                       /requests/[id]  — GET + PATCH
// =====================================================================
export function makeStudentRequestGet(spec: StudentSpec) {
  return async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params

    const request = await queryOne<{
      id: string
      student_id: string
      scope: string
      kind: string
      source_table: string | null
      source_id: string | null
      source_label: string | null
      status: string
      template_id: string | null
      template_name: string | null
      language: string
      data: Record<string, unknown> | null
      rejection_reason: string | null
      rank: number | null
      reason: string | null
      pdf_url: string | null
    }>(
      `SELECT r.id, r.student_id, r.scope, r.kind, r.source_table,
              r.source_id, r.source_label, r.status, r.template_id,
              t.name AS template_name, r.language, r.data,
              r.rejection_reason, r.rank, r.reason, r.pdf_url
         FROM certificate_issuance_requests r
         LEFT JOIN certificate_templates t ON t.id = r.template_id
        WHERE r.id = $1 AND r.scope = $2`,
      [id, spec.scope],
    )
    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (request.student_id !== session.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let teacherName: string | null = null
    if (request.source_table && request.source_id) {
      try {
        const t = await queryOne<{ teacher_name: string | null }>(
          `SELECT u.name AS teacher_name
             FROM ${request.source_table} s
             LEFT JOIN users u ON u.id = s.teacher_id
            WHERE s.id = $1`,
          [request.source_id],
        )
        teacherName = t?.teacher_name || null
      } catch {
        teacherName = null
      }
    }

    return NextResponse.json({
      request: { ...request, teacher_name: teacherName },
    })
  }
}

export function makeStudentRequestPatch(spec: StudentSpec) {
  return async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!body?.action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 })
    }

    const existing = await queryOne<{
      id: string
      student_id: string
      status: string
    }>(
      `SELECT id, student_id, status FROM certificate_issuance_requests
        WHERE id = $1 AND scope = $2`,
      [id, spec.scope],
    )
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (existing.student_id !== session.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    switch (body.action) {
      case "submit": {
        if (
          !["data_required", "submitted", "rejected"].includes(existing.status)
        ) {
          return NextResponse.json(
            { error: "Cannot edit this request in its current state" },
            { status: 400 },
          )
        }
        const cleanData: Record<string, string> = {}
        const incoming = body.data || {}
        if (typeof incoming === "object") {
          for (const [k, v] of Object.entries(incoming)) {
            if (v === null || v === undefined) continue
            cleanData[k] = String(v).slice(0, 5000)
          }
        }
        const [row] = await query(
          `UPDATE certificate_issuance_requests
              SET data = $2::jsonb,
                  status = 'submitted',
                  submitted_at = NOW(),
                  rejection_reason = NULL
            WHERE id = $1
            RETURNING *`,
          [id, JSON.stringify(cleanData)],
        )

        // Auto-issue immediately — no admin step — when enabled in settings.
        // On any failure the request stays `submitted` so the admin flow still
        // acts as a fallback.
        let finalRow = row
        let autoIssued = false
        try {
          const settings = await getAllSettings(spec.scope)
          if (settings.auto_issue_on_eligibility === true) {
            const res = await autoIssueRequest(id, spec.scope)
            if (res.issued) {
              autoIssued = true
              finalRow =
                (await queryOne(
                  `SELECT * FROM certificate_issuance_requests WHERE id = $1`,
                  [id],
                )) || row
            }
          }
        } catch (err) {
          console.error("[student-submit] auto-issue failed", err)
        }

        return NextResponse.json({ request: finalRow, auto_issued: autoIssued })
      }
      case "cancel": {
        if (!["data_required", "submitted"].includes(existing.status)) {
          return NextResponse.json(
            { error: "Cannot cancel this request" },
            { status: 400 },
          )
        }
        const [row] = await query(
          `UPDATE certificate_issuance_requests
              SET status = 'rejected', rejection_reason = 'cancelled_by_student'
            WHERE id = $1
            RETURNING *`,
          [id],
        )
        return NextResponse.json({ request: row })
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  }
}
