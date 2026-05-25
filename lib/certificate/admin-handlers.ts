// Shared admin handlers for the certificates centre.
//
// Both the academy ("/api/academy/admin/certificates/*") and the
// maqraa ("/api/admin/certificates-center/*") routes need the same
// behaviour parameterised by scope.  Instead of duplicating ~860
// lines of handler code, the academy and maqraa route files are thin
// wrappers around the factories defined here.
//
// Each factory takes a `RouteSpec` (scope + the role(s) allowed to
// act as admin for that scope) and returns Next.js route handlers.

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import {
  ALL_KINDS,
  ALL_LANGUAGES,
  generateSerialCode,
  getAllSettings,
  upsertSetting,
  type CertificateKind,
  type CertificateLanguage,
  type CertificateScope,
} from "@/lib/certificates"
import { issueCertificateForRequest, buildValuesForRequest } from "./issue"
import { renderCertificate } from "./render"
import { ALL_FIELDS, type FieldAnchor } from "./fields"

export interface RouteSpec {
  scope: CertificateScope
  /** Roles allowed to act as admin for this scope. */
  adminRoles: string[]
}

function isAdmin(spec: RouteSpec, role: string | undefined) {
  if (!role) return false
  return spec.adminRoles.includes(role)
}

// =====================================================================
//                       /requests  — GET
// =====================================================================
export function makeRequestsListGet(spec: RouteSpec) {
  return async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session || !isAdmin(spec, session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const kind = searchParams.get("kind")

    const filters: string[] = ["r.scope = $1"]
    const params: unknown[] = [spec.scope]

    if (status && status !== "all") {
      params.push(status)
      filters.push(`r.status = $${params.length}`)
    }
    if (kind && kind !== "all") {
      params.push(kind)
      filters.push(`r.kind = $${params.length}`)
    }

    const rows = await query(
      `SELECT r.*,
              u.name AS student_name,
              u.email AS student_email,
              t.name AS template_name,
              t.template_url AS template_url
         FROM certificate_issuance_requests r
         JOIN users u ON u.id = r.student_id
         LEFT JOIN certificate_templates t ON t.id = r.template_id
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
           r.created_at DESC`,
      params,
    )

    const counts = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*)::text AS count
         FROM certificate_issuance_requests
         WHERE scope = $1
         GROUP BY status`,
      [spec.scope],
    )

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
//                       /requests/[id]  — GET + PATCH
// =====================================================================
export function makeRequestDetailGet(spec: RouteSpec) {
  return async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const session = await getSession()
    if (!session || !isAdmin(spec, session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params

    const request = await queryOne(
      `SELECT r.*,
              u.name AS student_name,
              u.email AS student_email,
              t.name AS template_name,
              t.template_url AS template_url,
              t.field_positions AS template_field_positions
         FROM certificate_issuance_requests r
         JOIN users u ON u.id = r.student_id
         LEFT JOIN certificate_templates t ON t.id = r.template_id
         WHERE r.id = $1 AND r.scope = $2`,
      [id, spec.scope],
    )
    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ request })
  }
}

export function makeRequestDetailPatch(spec: RouteSpec) {
  return async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const session = await getSession()
    if (!session || !isAdmin(spec, session.role)) {
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
      serial_code: string | null
      certificate_number: string | null
      template_id: string | null
      kind: string
      source_table: string | null
      source_id: string | null
      language: string
    }>(
      `SELECT id, student_id, status, serial_code, certificate_number,
              template_id, kind, source_table, source_id, language
         FROM certificate_issuance_requests
         WHERE id = $1 AND scope = $2`,
      [id, spec.scope],
    )
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    switch (body.action) {
      case "approve": {
        if (!["submitted", "data_required"].includes(existing.status)) {
          return NextResponse.json(
            { error: "Cannot approve in current status" },
            { status: 400 },
          )
        }
        const [row] = await query(
          `UPDATE certificate_issuance_requests
              SET status = 'approved', approved_at = NOW(),
                  approved_by = $2, rejection_reason = NULL
            WHERE id = $1 RETURNING *`,
          [id, session.sub],
        )
        return NextResponse.json({ request: row })
      }
      case "reject": {
        const reason = (body.reason || "").toString().trim() || null
        const [row] = await query(
          `UPDATE certificate_issuance_requests
              SET status = 'rejected', rejection_reason = $2,
                  approved_by = $3, approved_at = NOW()
            WHERE id = $1 RETURNING *`,
          [id, reason, session.sub],
        )
        return NextResponse.json({ request: row })
      }
      case "assign_template": {
        if (!body.template_id) {
          return NextResponse.json(
            { error: "Missing template_id" },
            { status: 400 },
          )
        }
        const language = body.language || existing.language || "ar"
        const [row] = await query(
          `UPDATE certificate_issuance_requests
              SET template_id = $2, language = $3
            WHERE id = $1 RETURNING *`,
          [id, body.template_id, language],
        )
        return NextResponse.json({ request: row })
      }
      case "issue": {
        const serial =
          existing.serial_code || (await generateSerialCode(spec.scope))
        const certNumber =
          existing.certificate_number ||
          serial ||
          `${spec.scope.toUpperCase()}-${Date.now()
            .toString(36)
            .toUpperCase()}`

        let pdfUrl: string | null = body.pdf_url || null
        const autoRender = body.auto_render !== false && !pdfUrl

        if (autoRender && existing.template_id) {
          try {
            const r = await issueCertificateForRequest({
              request_id: id,
              scope: spec.scope,
              format: body.format === "png" ? "png" : "pdf",
            })
            pdfUrl = r.pdf_url
          } catch (e) {
            console.error("[issue] auto-render failed", e)
            if (!body.allow_no_pdf) {
              return NextResponse.json(
                {
                  error: "Auto-render failed",
                  detail: e instanceof Error ? e.message : String(e),
                },
                { status: 500 },
              )
            }
          }
        }

        const [row] = await query(
          `UPDATE certificate_issuance_requests
              SET status = 'issued', issued_at = NOW(),
                  serial_code = $2, certificate_number = $3,
                  pdf_url = COALESCE($4, pdf_url)
            WHERE id = $1 RETURNING *`,
          [id, serial, certNumber, pdfUrl],
        )

        // Also persist a row in the scope-specific issued table.
        // Academy → academy_certificates, maqraa → academy_certificates
        // *only* when scope=academy (the legacy maqraa table is
        // certificate_data and we do not write back to it here).
        if (spec.scope === "academy") {
          if (existing.kind === "course" && existing.source_id) {
            await query(
              `INSERT INTO academy_certificates
                  (student_id, course_id, issued_at, certificate_number,
                   pdf_url, request_id, template_id, language, kind, issued_by)
                VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT DO NOTHING`,
              [
                existing.student_id,
                existing.source_id,
                certNumber,
                pdfUrl,
                id,
                existing.template_id,
                existing.language,
                existing.kind,
                session.sub,
              ],
            ).catch(() => {})
          } else {
            await query(
              `INSERT INTO academy_certificates
                  (student_id, course_id, issued_at, certificate_number,
                   pdf_url, request_id, template_id, language, kind, issued_by,
                   source_table, source_id)
                VALUES ($1, NULL, NOW(), $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [
                existing.student_id,
                certNumber,
                pdfUrl,
                id,
                existing.template_id,
                existing.language,
                existing.kind,
                session.sub,
                existing.source_table,
                existing.source_id,
              ],
            ).catch(() => {})
          }
        }

        await query(
          `INSERT INTO notifications (user_id, title, message, type, link, created_at)
           VALUES ($1, $2, $3, 'certificate', $4, NOW())`,
          [
            existing.student_id,
            "تم إصدار شهادتك",
            "تهانينا! تم إصدار شهادتك بنجاح. اضغط هنا لعرضها وتحميلها.",
            spec.scope === "academy"
              ? "/academy/student/certificates"
              : "/student/certificates",
          ],
        ).catch(() => {})

        return NextResponse.json({ request: row })
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  }
}

// =====================================================================
//                       /requests/[id]/preview  — GET
// =====================================================================
export function makeRequestPreviewGet(spec: RouteSpec) {
  return async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const session = await getSession()
    if (!session || !isAdmin(spec, session.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const format = (searchParams.get("format") === "pdf" ? "pdf" : "png") as
      | "pdf"
      | "png"

    try {
      const built = await buildValuesForRequest(spec.scope, id)
      if (!built.template_url) {
        return NextResponse.json(
          { error: "Template not assigned yet" },
          { status: 400 },
        )
      }
      const buffer = await renderCertificate(
        {
          template_url: built.template_url,
          field_positions: built.field_positions,
          values: built.values,
          language: built.language,
        },
        format,
      )
      return new NextResponse(buffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": format === "png" ? "image/png" : "application/pdf",
          "Cache-Control": "no-store",
        },
      })
    } catch (e) {
      console.error("[request preview]", e)
      return NextResponse.json(
        { error: e instanceof Error ? e.message : String(e) },
        { status: 500 },
      )
    }
  }
}

// =====================================================================
//                       /issued  — GET
// =====================================================================
export function makeIssuedGet(spec: RouteSpec) {
  return async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session || !isAdmin(spec, session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const kind = searchParams.get("kind")
    const search = searchParams.get("search")?.trim()

    const filters: string[] = [`r.scope = $1`, `r.status = 'issued'`]
    const params: unknown[] = [spec.scope]
    if (kind && kind !== "all") {
      params.push(kind)
      filters.push(`r.kind = $${params.length}`)
    }
    if (search) {
      params.push(`%${search}%`)
      filters.push(
        `(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR r.certificate_number ILIKE $${params.length})`,
      )
    }

    const rows = await query(
      `SELECT r.id, r.kind, r.language, r.certificate_number,
              r.serial_code, r.pdf_url, r.issued_at,
              r.source_label, r.source_table, r.source_id,
              u.id AS student_id, u.name AS student_name, u.email AS student_email,
              t.id AS template_id, t.name AS template_name
         FROM certificate_issuance_requests r
         JOIN users u ON u.id = r.student_id
         LEFT JOIN certificate_templates t ON t.id = r.template_id
        WHERE ${filters.join(" AND ")}
        ORDER BY r.issued_at DESC NULLS LAST, r.created_at DESC
        LIMIT 500`,
      params,
    )
    return NextResponse.json({ certificates: rows })
  }
}

// =====================================================================
//                       /templates  — GET + POST
// =====================================================================
export function makeTemplatesGet(spec: RouteSpec) {
  return async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session || !isAdmin(spec, session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const kind = searchParams.get("kind")
    const language = searchParams.get("language")
    const includeInactive = searchParams.get("include_inactive") === "1"

    const filters: string[] = ["scope = $1"]
    const params: unknown[] = [spec.scope]
    if (kind) {
      params.push(kind)
      filters.push(`kind = $${params.length}`)
    }
    if (language) {
      params.push(language)
      filters.push(`language = $${params.length}`)
    }
    if (!includeInactive) filters.push("is_active = TRUE")

    const templates = await query(
      `SELECT t.*, u.name AS created_by_name
         FROM certificate_templates t
         LEFT JOIN users u ON u.id = t.created_by
         WHERE ${filters.join(" AND ")}
         ORDER BY t.kind ASC, t.language ASC,
                  t.is_default DESC, t.created_at DESC`,
      params,
    )
    return NextResponse.json({ templates })
  }
}

export function makeTemplatesPost(spec: RouteSpec) {
  return async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session || !isAdmin(spec, session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json().catch(() => null)
    if (!body)
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })

    const {
      kind,
      language = "ar",
      name,
      description = null,
      template_url,
      field_positions = {},
      background_color = null,
      is_default = false,
    }: {
      kind: CertificateKind
      language?: CertificateLanguage
      name: string
      description?: string | null
      template_url: string
      field_positions?: Record<string, unknown>
      background_color?: string | null
      is_default?: boolean
    } = body

    if (!ALL_KINDS.includes(kind))
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 })
    if (!ALL_LANGUAGES.includes(language))
      return NextResponse.json({ error: "Invalid language" }, { status: 400 })
    if (!name || !template_url)
      return NextResponse.json(
        { error: "Missing name or template_url" },
        { status: 400 },
      )

    if (is_default) {
      await query(
        `UPDATE certificate_templates
           SET is_default = FALSE
           WHERE scope = $1 AND kind = $2 AND language = $3`,
        [spec.scope, kind, language],
      )
    }

    const [row] = await query(
      `INSERT INTO certificate_templates
          (scope, kind, language, name, description, template_url,
           field_positions, background_color, is_default, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
        RETURNING *`,
      [
        spec.scope,
        kind,
        language,
        name,
        description,
        template_url,
        JSON.stringify(field_positions || {}),
        background_color,
        Boolean(is_default),
        session.sub,
      ],
    )
    return NextResponse.json({ template: row }, { status: 201 })
  }
}

// =====================================================================
//                       /templates/[id]  — GET + PATCH + DELETE
// =====================================================================
export function makeTemplateDetailGet(spec: RouteSpec) {
  return async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const session = await getSession()
    if (!session || !isAdmin(spec, session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const template = await queryOne(
      `SELECT * FROM certificate_templates WHERE id = $1 AND scope = $2`,
      [id, spec.scope],
    )
    if (!template)
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ template })
  }
}

export function makeTemplateDetailPatch(spec: RouteSpec) {
  return async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const session = await getSession()
    if (!session || !isAdmin(spec, session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!body)
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })

    const existing = await queryOne<{
      id: string
      kind: string
      language: string
      is_default: boolean
    }>(
      `SELECT id, kind, language, is_default FROM certificate_templates
         WHERE id = $1 AND scope = $2`,
      [id, spec.scope],
    )
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (body.is_default === true && !existing.is_default) {
      await query(
        `UPDATE certificate_templates
           SET is_default = FALSE
           WHERE scope = $1 AND kind = $2 AND language = $3 AND id <> $4`,
        [spec.scope, existing.kind, existing.language, id],
      )
    }

    const allowed = [
      "name",
      "description",
      "template_url",
      "field_positions",
      "background_color",
      "is_default",
      "is_active",
      "language",
    ] as const

    const updates: string[] = []
    const values: unknown[] = []
    for (const key of allowed) {
      if (body[key] !== undefined) {
        values.push(
          key === "field_positions" ? JSON.stringify(body[key]) : body[key],
        )
        const cast = key === "field_positions" ? "::jsonb" : ""
        updates.push(`${key} = $${values.length}${cast}`)
      }
    }
    if (updates.length === 0)
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })

    values.push(id, spec.scope)
    const result = await query(
      `UPDATE certificate_templates
          SET ${updates.join(", ")}
        WHERE id = $${values.length - 1} AND scope = $${values.length}
        RETURNING *`,
      values,
    )
    return NextResponse.json({ template: result[0] })
  }
}

export function makeTemplateDetailDelete(spec: RouteSpec) {
  return async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const session = await getSession()
    if (!session || !isAdmin(spec, session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const hard = searchParams.get("hard") === "1"

    if (hard) {
      await query(
        `DELETE FROM certificate_templates WHERE id = $1 AND scope = $2`,
        [id, spec.scope],
      )
    } else {
      await query(
        `UPDATE certificate_templates SET is_active = FALSE
           WHERE id = $1 AND scope = $2`,
        [id, spec.scope],
      )
    }
    return NextResponse.json({ ok: true })
  }
}

// =====================================================================
//                       /templates/[id]/preview  — GET
// =====================================================================
export function makeTemplatePreviewGet(spec: RouteSpec) {
  return async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const session = await getSession()
    if (!session || !isAdmin(spec, session.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    const { id } = await params

    const template = await queryOne<{
      template_url: string
      field_positions: Record<string, FieldAnchor>
      language: "ar" | "en"
    }>(
      `SELECT template_url, field_positions, language
         FROM certificate_templates
         WHERE id = $1 AND scope = $2`,
      [id, spec.scope],
    )
    if (!template) return new NextResponse("Not found", { status: 404 })

    const { searchParams } = new URL(req.url)
    const format = (searchParams.get("format") === "pdf" ? "pdf" : "png") as
      | "pdf"
      | "png"

    const settings = await getAllSettings(spec.scope)
    const isAr = template.language === "ar"
    const platformName =
      (isAr
        ? (settings.platform_name_ar as string)
        : (settings.platform_name_en as string)) || ""

    const sampleValues: Record<string, string> = {}
    for (const f of ALL_FIELDS) {
      if (f.key === "logo") {
        const url = settings.logo_url as string | undefined
        if (url) sampleValues.logo = url
      } else if (f.key === "watermark") {
        const url = settings.watermark_url as string | undefined
        if (url) sampleValues.watermark = url
      } else if (f.key === "signature") {
        const url = settings.signature_url as string | undefined
        if (url) sampleValues.signature = url
      } else if (f.key === "platform_name") {
        sampleValues.platform_name = platformName || f.sample
      } else if (f.key === "signer_name") {
        sampleValues.signer_name =
          (settings.default_signer_name as string) || f.sample
      } else if (f.key === "signer_title") {
        sampleValues.signer_title =
          (settings.default_signer_title as string) || f.sample
      } else {
        sampleValues[f.key] = f.sample
      }
    }

    try {
      const buffer = await renderCertificate(
        {
          template_url: template.template_url,
          field_positions: template.field_positions || {},
          values: sampleValues,
          language: template.language || "ar",
          use_samples: true,
        },
        format,
      )
      return new NextResponse(buffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": format === "png" ? "image/png" : "application/pdf",
          "Cache-Control": "no-store",
        },
      })
    } catch (e) {
      console.error("[cert preview]", e)
      return NextResponse.json(
        { error: e instanceof Error ? e.message : String(e) },
        { status: 500 },
      )
    }
  }
}

// =====================================================================
//                       /settings  — GET + PUT
// =====================================================================
export function makeSettingsGet(spec: RouteSpec) {
  return async function GET() {
    const session = await getSession()
    if (!session || !isAdmin(spec, session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const settings = await getAllSettings(spec.scope)
    return NextResponse.json({ settings })
  }
}

export function makeSettingsPut(spec: RouteSpec) {
  return async function PUT(req: NextRequest) {
    const session = await getSession()
    if (!session || !isAdmin(spec, session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json().catch(() => null)
    if (!body || typeof body.settings !== "object" || body.settings === null) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }
    const updates = body.settings as Record<string, unknown>
    for (const [key, value] of Object.entries(updates)) {
      if (key.length > 80) continue
      await upsertSetting(spec.scope, key, value, session.sub)
    }
    const settings = await getAllSettings(spec.scope)
    return NextResponse.json({ settings, ok: true })
  }
}
