// High-level helpers for actually issuing a certificate end-to-end:
//   1. Load the request + template + settings
//   2. Build the FieldValues map (student name, teacher, source, date,
//      certificate number, watermark/logo/signature urls...)
//   3. Render to PDF via puppeteer
//   4. Upload to storage and persist on the request row.

import { query, queryOne } from "@/lib/db"
import { uploadToStorage } from "@/lib/storage"
import {
  generateSerialCode,
  getAllSettings,
  type CertificateScope,
} from "@/lib/certificates"
import { renderCertificate } from "./render"
import type { FieldAnchor, FieldValues } from "./fields"

interface IssueInput {
  request_id: string
  scope: CertificateScope
  format?: "pdf" | "png"
}

interface IssueResult {
  pdf_url: string | null
  certificate_number: string
  serial_code: string
  format: "pdf" | "png"
}

export async function buildValuesForRequest(
  scope: CertificateScope,
  requestId: string,
): Promise<{
  values: FieldValues
  template_url: string | null
  field_positions: Record<string, FieldAnchor>
  language: "ar" | "en"
  certificate_number: string
  serial_code: string
}> {
  const r = await queryOne<{
    id: string
    student_id: string
    student_name: string
    student_email: string
    kind: string
    source_table: string | null
    source_id: string | null
    source_label: string | null
    reason: string | null
    rank: number | null
    data: Record<string, unknown> | null
    template_id: string | null
    template_url: string | null
    field_positions: Record<string, FieldAnchor> | null
    language: "ar" | "en"
    certificate_number: string | null
    serial_code: string | null
  }>(
    `SELECT r.id, r.student_id, u.name AS student_name, u.email AS student_email,
            r.kind, r.source_table, r.source_id, r.source_label, r.reason,
            r.rank, r.data, r.template_id, t.template_url, t.field_positions,
            r.language, r.certificate_number, r.serial_code
       FROM certificate_issuance_requests r
       JOIN users u ON u.id = r.student_id
       LEFT JOIN certificate_templates t ON t.id = r.template_id
       WHERE r.id = $1 AND r.scope = $2`,
    [requestId, scope],
  )

  if (!r) throw new Error("Request not found")
  if (!r.template_url) {
    throw new Error("Template not assigned to this request yet")
  }

  const settings = await getAllSettings(scope)
  const language: "ar" | "en" = (r.language || "ar") as "ar" | "en"
  const isAr = language === "ar"

  const platformName =
    (isAr
      ? (settings.platform_name_ar as string)
      : (settings.platform_name_en as string)) || ""

  // Resolve teacher name lazily from source table.
  let teacherName: string | null = null
  if (r.source_table && r.source_id) {
    try {
      const trow = await queryOne<{ teacher_name: string | null }>(
        `SELECT u.name AS teacher_name
           FROM ${r.source_table} s
           LEFT JOIN users u ON u.id = s.teacher_id
           WHERE s.id = $1 LIMIT 1`,
        [r.source_id],
      )
      teacherName = trow?.teacher_name || null
    } catch {
      teacherName = null
    }
  }

  // Reason text (rank, custom string from admin or auto-derived)
  let reason = r.reason || ""
  if (!reason && r.rank) {
    reason = isAr ? `المركز ${r.rank}` : `Rank #${r.rank}`
  }

  // Issue numbers (re-use existing if present, otherwise generate now)
  const serial = r.serial_code || (await generateSerialCode(scope))
  const certNumber =
    r.certificate_number ||
    serial ||
    `${scope.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

  const dateStr = new Date().toLocaleDateString(isAr ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const dataMap = (r.data || {}) as Record<string, string>

  const values: FieldValues = {
    student_name: r.student_name,
    teacher_name: teacherName || dataMap.teacher_name || "",
    source_label: r.source_label || "",
    reason,
    date: dataMap.date || dateStr,
    certificate_number: certNumber,
    platform_name: platformName,
    signer_name: (settings.default_signer_name as string) || "",
    signer_title: (settings.default_signer_title as string) || "",
    logo: (settings.logo_url as string) || "",
    watermark: (settings.watermark_url as string) || "",
    signature: (settings.signature_url as string) || "",
  }

  return {
    values,
    template_url: r.template_url,
    field_positions: r.field_positions || {},
    language,
    certificate_number: certNumber,
    serial_code: serial,
  }
}

export async function issueCertificateForRequest(
  input: IssueInput,
): Promise<IssueResult> {
  const { request_id, scope, format = "pdf" } = input
  const built = await buildValuesForRequest(scope, request_id)

  const buffer = await renderCertificate(
    {
      template_url: built.template_url!,
      field_positions: built.field_positions,
      values: built.values,
      language: built.language,
    },
    format,
  )

  const ext = format === "png" ? "png" : "pdf"
  const mime = format === "png" ? "image/png" : "application/pdf"
  const fileName = `certificate-${scope}-${built.certificate_number}.${ext}`
  const upload = await uploadToStorage(buffer, fileName, mime)

  await query(
    `UPDATE certificate_issuance_requests
        SET pdf_url = $2,
            certificate_number = $3,
            serial_code = $4
      WHERE id = $1`,
    [request_id, upload.url, built.certificate_number, built.serial_code],
  )

  return {
    pdf_url: upload.url || null,
    certificate_number: built.certificate_number,
    serial_code: built.serial_code,
    format,
  }
}
