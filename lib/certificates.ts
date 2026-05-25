// Shared helpers for the certificates center (Academy + Maqraa).
// PR1: schema-level helpers only.  PR2 will add PDF rendering helpers,
// PR3 the eligibility/triggering helpers.

import { query, queryOne } from "@/lib/db"

export type CertificateScope = "academy" | "maqraa"
export type CertificateKind =
  | "course"
  | "learning_path"
  | "memorization_path"
  | "tajweed_path"
  | "series"
  | "competition"
  | "recitation"
  | "custom"

export type CertificateLanguage = "ar" | "en"

export const ALL_KINDS: CertificateKind[] = [
  "course",
  "learning_path",
  "memorization_path",
  "tajweed_path",
  "series",
  "competition",
  "recitation",
  "custom",
]

export const ALL_LANGUAGES: CertificateLanguage[] = ["ar", "en"]

export interface CertificateTemplate {
  id: string
  scope: CertificateScope
  kind: CertificateKind
  language: CertificateLanguage
  name: string
  description: string | null
  template_url: string
  field_positions: Record<string, FieldAnchor>
  background_color: string | null
  is_default: boolean
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// Normalised (0..1) anchors saved by the visual editor.  PR2 will consume.
export interface FieldAnchor {
  x: number
  y: number
  font_size?: number
  color?: string
  align?: "left" | "center" | "right"
  max_width?: number
  rotate?: number
  weight?: "normal" | "bold"
}

export interface CertificateSettingValue {
  scope: CertificateScope
  key: string
  value: unknown
  updated_at: string
}

export interface IssuanceRequest {
  id: string
  scope: CertificateScope
  kind: CertificateKind
  student_id: string
  source_table: string | null
  source_id: string | null
  source_label: string | null
  rank: number | null
  reason: string | null
  template_id: string | null
  language: CertificateLanguage
  status:
    | "data_required"
    | "submitted"
    | "approved"
    | "rejected"
    | "issued"
  data: Record<string, unknown>
  certificate_number: string | null
  serial_code: string | null
  pdf_url: string | null
  preview_url: string | null
  requested_at: string
  submitted_at: string | null
  approved_at: string | null
  approved_by: string | null
  issued_at: string | null
  rejection_reason: string | null
}

// Per-scope serial code generator.  Used both for the public certificate
// number and the secondary "serial_code" field.
export async function generateSerialCode(
  scope: CertificateScope,
): Promise<string> {
  const seqName =
    scope === "academy"
      ? "certificate_academy_serial_seq"
      : "certificate_maqraa_serial_seq"
  const row = await queryOne<{ nextval: string }>(
    `SELECT nextval('${seqName}') as nextval`,
  )
  const seq = Number(row?.nextval || 1)
  const prefix = scope === "academy" ? "ITQ-ACA" : "ITQ-MAK"
  return `${prefix}-${String(seq).padStart(8, "0")}`
}

// Resolve the default template for a given (scope, kind, language).  Falls
// back to the closest active template in the same kind, then the same scope.
export async function resolveDefaultTemplate(
  scope: CertificateScope,
  kind: CertificateKind,
  language: CertificateLanguage = "ar",
): Promise<CertificateTemplate | null> {
  const exact = await queryOne<CertificateTemplate>(
    `SELECT * FROM certificate_templates
       WHERE scope = $1 AND kind = $2 AND language = $3
         AND is_active = TRUE AND is_default = TRUE
       LIMIT 1`,
    [scope, kind, language],
  )
  if (exact) return exact

  const sameKind = await queryOne<CertificateTemplate>(
    `SELECT * FROM certificate_templates
       WHERE scope = $1 AND kind = $2 AND is_active = TRUE
       ORDER BY is_default DESC, created_at DESC
       LIMIT 1`,
    [scope, kind],
  )
  if (sameKind) return sameKind

  const anyActive = await queryOne<CertificateTemplate>(
    `SELECT * FROM certificate_templates
       WHERE scope = $1 AND is_active = TRUE
       ORDER BY is_default DESC, created_at DESC
       LIMIT 1`,
    [scope],
  )
  return anyActive
}

export async function getAllSettings(
  scope: CertificateScope,
): Promise<Record<string, unknown>> {
  const rows = await query<{ key: string; value: unknown }>(
    `SELECT key, value FROM certificate_settings WHERE scope = $1`,
    [scope],
  )
  const out: Record<string, unknown> = {}
  for (const r of rows) out[r.key] = r.value
  return out
}

export async function upsertSetting(
  scope: CertificateScope,
  key: string,
  value: unknown,
  updatedBy?: string | null,
): Promise<void> {
  await query(
    `INSERT INTO certificate_settings (scope, key, value, updated_by)
       VALUES ($1, $2, $3::jsonb, $4)
     ON CONFLICT (scope, key) DO UPDATE
       SET value = $3::jsonb,
           updated_by = $4,
           updated_at = NOW()`,
    [scope, key, JSON.stringify(value), updatedBy || null],
  )
}
