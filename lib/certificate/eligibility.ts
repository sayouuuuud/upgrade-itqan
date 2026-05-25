// Central eligibility helpers for the certificates centre.
//
// These helpers are invoked from completion/award endpoints whenever a
// student becomes eligible for a certificate.  They:
//   1. Create a row in `certificate_issuance_requests` with status
//      `data_required` (idempotent on `student_id + scope + kind + source`).
//   2. Pre-assign the default template+language for that (scope, kind).
//   3. Notify the student so the sidebar entry "إكمال بيانات الشهادة"
//      shows up immediately.
//   4. Optionally auto-issue the certificate when the admin set
//      `auto_issue_on_eligibility=true` in settings AND the request
//      already has enough data (no extra info required).
//
// The helpers are intentionally defensive: every failure is swallowed
// (logged) so a missing migration or DB hiccup never breaks the
// underlying completion / award flow.

import { query, queryOne } from "@/lib/db"
import { createNotification } from "@/lib/notifications"
import { issueCertificateForRequest } from "./issue"
import {
  resolveDefaultTemplate,
  getAllSettings,
  type CertificateScope,
  type CertificateKind,
  type CertificateLanguage,
} from "@/lib/certificates"

export interface EligibilityInput {
  scope: CertificateScope
  kind: CertificateKind
  studentId: string
  sourceTable?: string | null
  sourceId?: string | null
  sourceLabel?: string | null
  rank?: number | null
  reason?: string | null
  language?: CertificateLanguage
  /**
   * When true, mark the request as already `submitted` (skip the
   * student data-collection step). Useful for cases where the system
   * already has every field it needs (e.g. course completion).
   */
  skipDataStep?: boolean
}

export interface EligibilityResult {
  request_id: string | null
  status: string | null
  auto_issued: boolean
  pdf_url: string | null
  reason?: string
}

/**
 * Resolve whether the source entity has certificates enabled.  Each
 * source has its own column (`certificate_enabled`) on the parent
 * table.  Courses default to TRUE; everything else defaults to FALSE.
 */
async function sourceHasCertificatesEnabled(
  sourceTable: string | null | undefined,
  sourceId: string | null | undefined,
): Promise<boolean> {
  if (!sourceTable || !sourceId) return true // generic request (custom etc.)
  try {
    const row = await queryOne<{ enabled: boolean | null }>(
      `SELECT certificate_enabled AS enabled FROM ${sourceTable} WHERE id = $1`,
      [sourceId],
    )
    if (row === null) return true
    return row.enabled !== false
  } catch {
    // Column or table missing — be permissive.
    return true
  }
}

/**
 * Resolve the source-level template override (e.g. a specific
 * competition has its own template).  Falls back to the default for
 * the kind/language combo when unset.
 */
async function resolveTemplateForSource(
  scope: CertificateScope,
  kind: CertificateKind,
  language: CertificateLanguage,
  sourceTable: string | null | undefined,
  sourceId: string | null | undefined,
): Promise<{ id: string | null }> {
  if (sourceTable && sourceId) {
    try {
      const row = await queryOne<{ tid: string | null }>(
        `SELECT certificate_template_id AS tid FROM ${sourceTable} WHERE id = $1`,
        [sourceId],
      )
      if (row?.tid) return { id: row.tid }
    } catch {
      /* column not present — fall through */
    }
  }
  const def = await resolveDefaultTemplate(scope, kind, language)
  return { id: def?.id || null }
}

/**
 * Build a notification body suitable for an eligibility event.
 */
function buildNotificationContent(
  kind: CertificateKind,
  scope: CertificateScope,
  language: CertificateLanguage,
  reason: string | null,
): { title: string; message: string; link: string } {
  const isAr = language !== "en"
  const linkBase =
    scope === "academy"
      ? "/academy/student/certificates"
      : "/student/certificates"

  const kindLabelAr: Record<CertificateKind, string> = {
    course: "دورة تعليمية",
    learning_path: "المسار التعليمي",
    memorization_path: "مسار الحفظ",
    tajweed_path: "مسار التجويد",
    series: "السلسلة",
    competition: "المسابقة",
    recitation: "ختمة التلاوة",
    custom: "إنجاز",
  }
  const kindLabelEn: Record<CertificateKind, string> = {
    course: "course",
    learning_path: "learning path",
    memorization_path: "memorization path",
    tajweed_path: "tajweed path",
    series: "series",
    competition: "competition",
    recitation: "recitation",
    custom: "achievement",
  }

  if (isAr) {
    return {
      title: "تستحق شهادة جديدة! 🎓",
      message:
        reason ||
        `أكملت ${kindLabelAr[kind]} بنجاح. أكمل بيانات الشهادة من الشريط الجانبي لإصدارها.`,
      link: linkBase,
    }
  }
  return {
    title: "You've earned a new certificate! 🎓",
    message:
      reason ||
      `You completed a ${kindLabelEn[kind]}. Fill in your certificate details from the sidebar to receive it.`,
    link: linkBase,
  }
}

/**
 * Create — or return existing — an eligibility request and notify the
 * student.  Designed to be idempotent.  Safe to call repeatedly.
 */
export async function createEligibilityRequest(
  input: EligibilityInput,
): Promise<EligibilityResult> {
  const {
    scope,
    kind,
    studentId,
    sourceTable = null,
    sourceId = null,
    sourceLabel = null,
    rank = null,
    reason = null,
    language = "ar",
    skipDataStep = false,
  } = input

  try {
    // 0. Source must have certificates enabled.
    const enabled = await sourceHasCertificatesEnabled(sourceTable, sourceId)
    if (!enabled) {
      return {
        request_id: null,
        status: null,
        auto_issued: false,
        pdf_url: null,
        reason: "Source has certificates disabled",
      }
    }

    // 1. Avoid duplicates — partial unique index on
    //    (student_id, scope, kind, source_table, source_id)
    //    handles this at the DB level but we short-circuit for clarity.
    if (sourceId) {
      const existing = await queryOne<{
        id: string
        status: string
        pdf_url: string | null
      }>(
        `SELECT id, status, pdf_url
           FROM certificate_issuance_requests
          WHERE student_id = $1 AND scope = $2 AND kind = $3
            AND source_table IS NOT DISTINCT FROM $4
            AND source_id IS NOT DISTINCT FROM $5
          LIMIT 1`,
        [studentId, scope, kind, sourceTable, sourceId],
      )
      if (existing) {
        return {
          request_id: existing.id,
          status: existing.status,
          auto_issued: existing.status === "issued",
          pdf_url: existing.pdf_url,
        }
      }
    }

    // 2. Resolve template (source-specific override → default).
    const template = await resolveTemplateForSource(
      scope,
      kind,
      language,
      sourceTable,
      sourceId,
    )

    const initialStatus = skipDataStep ? "submitted" : "data_required"

    const insert = await queryOne<{
      id: string
      status: string
    }>(
      `INSERT INTO certificate_issuance_requests (
         scope, kind, student_id, source_table, source_id, source_label,
         rank, reason, template_id, language, status,
         requested_at, submitted_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
         NOW(),
         CASE WHEN $11 = 'submitted' THEN NOW() ELSE NULL END
       )
       RETURNING id, status`,
      [
        scope,
        kind,
        studentId,
        sourceTable,
        sourceId,
        sourceLabel,
        rank,
        reason,
        template.id,
        language,
        initialStatus,
      ],
    )

    if (!insert) {
      return {
        request_id: null,
        status: null,
        auto_issued: false,
        pdf_url: null,
      }
    }

    // 3. Notify the student (best effort).
    const notif = buildNotificationContent(kind, scope, language, reason)
    await createNotification({
      userId: studentId,
      type: "general",
      title: notif.title,
      message: notif.message,
      category: "system",
      link: notif.link,
      dedupKey: `cert-eligible:${insert.id}`,
    })

    // 4. Optional auto-issue when settings allow it.
    const result: EligibilityResult = {
      request_id: insert.id,
      status: insert.status,
      auto_issued: false,
      pdf_url: null,
    }

    if (skipDataStep) {
      try {
        const settings = await getAllSettings(scope)
        if (settings.auto_issue_on_eligibility === true) {
          // Move request to approved first so the issue flow is uniform.
          await query(
            `UPDATE certificate_issuance_requests
                SET status = 'approved', approved_at = NOW()
              WHERE id = $1`,
            [insert.id],
          )
          const issued = await issueCertificateForRequest({
            request_id: insert.id,
            scope,
            format: "pdf",
          })
          await query(
            `UPDATE certificate_issuance_requests
                SET status = 'issued', issued_at = NOW()
              WHERE id = $1`,
            [insert.id],
          )
          result.auto_issued = true
          result.pdf_url = issued.pdf_url
          result.status = "issued"

          await createNotification({
            userId: studentId,
            type: "general",
            title: "تم إصدار شهادتك",
            message:
              "تهانينا! تم إصدار شهادتك بنجاح. اضغط هنا لعرضها وتحميلها.",
            category: "system",
            link: notif.link,
            dedupKey: `cert-issued:${insert.id}`,
          })
        }
      } catch (err) {
        console.error("[eligibility] auto-issue failed", err)
      }
    }

    return result
  } catch (err) {
    console.error("[eligibility] createEligibilityRequest failed", err)
    return {
      request_id: null,
      status: null,
      auto_issued: false,
      pdf_url: null,
      reason: err instanceof Error ? err.message : String(err),
    }
  }
}

// =====================================================================
//                       Source-specific trigger helpers
// =====================================================================

/**
 * Triggered when a student finishes a course (progress reaches 100%).
 * For Academy.  Courses use `course_id` from the legacy
 * `academy_certificates` table — we keep that legacy insert in place
 * elsewhere; here we just create a parallel issuance request so the
 * admin can also see/approve/re-issue with a proper template.
 */
export async function onCourseCompleted(opts: {
  scope: CertificateScope
  studentId: string
  courseId: string
  courseTitle: string
  language?: CertificateLanguage
}): Promise<EligibilityResult> {
  return createEligibilityRequest({
    scope: opts.scope,
    kind: "course",
    studentId: opts.studentId,
    sourceTable: "courses",
    sourceId: opts.courseId,
    sourceLabel: opts.courseTitle,
    language: opts.language || "ar",
    skipDataStep: true,
  })
}

/**
 * Triggered when an academy/maqraa learning path is finished.
 * pathType maps to the underlying table (tajweed_paths,
 * memorization_paths, learning_paths).
 */
export async function onPathCompleted(opts: {
  scope: CertificateScope
  studentId: string
  pathId: string
  pathTitle: string
  pathType: "learning_path" | "memorization_path" | "tajweed_path"
  language?: CertificateLanguage
}): Promise<EligibilityResult> {
  const tableMap: Record<typeof opts.pathType, string> = {
    learning_path: "learning_paths",
    memorization_path: "memorization_paths",
    tajweed_path: "tajweed_paths",
  }
  return createEligibilityRequest({
    scope: opts.scope,
    kind: opts.pathType,
    studentId: opts.studentId,
    sourceTable: tableMap[opts.pathType],
    sourceId: opts.pathId,
    sourceLabel: opts.pathTitle,
    language: opts.language || "ar",
  })
}

/**
 * Triggered when a series is fully completed by the student.
 */
export async function onSeriesCompleted(opts: {
  scope: CertificateScope
  studentId: string
  seriesId: string
  seriesTitle: string
  language?: CertificateLanguage
}): Promise<EligibilityResult> {
  return createEligibilityRequest({
    scope: opts.scope,
    kind: "series",
    studentId: opts.studentId,
    sourceTable: "series",
    sourceId: opts.seriesId,
    sourceLabel: opts.seriesTitle,
    language: opts.language || "ar",
  })
}

/**
 * Triggered when an admin closes a competition and wants to issue
 * eligibility certificates for the top N participants.  Each entry
 * gets its own request.  Idempotent thanks to the unique index.
 */
export async function onCompetitionAwardTopN(opts: {
  scope: CertificateScope
  competitionId: string
  language?: CertificateLanguage
}): Promise<{ created: number; existing: number; skipped: number }> {
  let created = 0
  let existing = 0
  let skipped = 0

  try {
    const comp = await queryOne<{
      id: string
      title: string
      certificate_enabled: boolean | null
      award_top_n: number | null
    }>(
      `SELECT id, title, certificate_enabled, award_top_n
         FROM competitions WHERE id = $1`,
      [opts.competitionId],
    )
    if (!comp) return { created: 0, existing: 0, skipped: 0 }
    if (comp.certificate_enabled === false) {
      return { created: 0, existing: 0, skipped: 0 }
    }
    const topN = Math.max(1, Number(comp.award_top_n || 10))

    // Rank entries by score, then by submitted_at as a tiebreaker.
    const entries = await query<{
      student_id: string
      score: number | null
      rank: number
    }>(
      `SELECT student_id, score,
              ROW_NUMBER() OVER (ORDER BY COALESCE(score, 0) DESC,
                                          submitted_at ASC) AS rank
         FROM competition_entries
        WHERE competition_id = $1 AND student_id IS NOT NULL
        ORDER BY rank ASC
        LIMIT $2`,
      [opts.competitionId, topN],
    )

    for (const e of entries) {
      const reasonAr =
        e.rank === 1
          ? `المركز الأول في ${comp.title}`
          : e.rank === 2
            ? `المركز الثاني في ${comp.title}`
            : e.rank === 3
              ? `المركز الثالث في ${comp.title}`
              : `المركز ${e.rank} في ${comp.title}`

      const res = await createEligibilityRequest({
        scope: opts.scope,
        kind: "competition",
        studentId: e.student_id,
        sourceTable: "competitions",
        sourceId: comp.id,
        sourceLabel: comp.title,
        rank: e.rank,
        reason: reasonAr,
        language: opts.language || "ar",
      })
      if (res.request_id && res.status === "data_required") created++
      else if (res.request_id) existing++
      else skipped++
    }

    return { created, existing, skipped }
  } catch (err) {
    console.error("[eligibility] onCompetitionAwardTopN failed", err)
    return { created, existing, skipped }
  }
}
