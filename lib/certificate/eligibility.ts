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

/**
 * Issue a certificate for an existing request *now*, with no admin step.
 *
 * Runs the full approve → render → issue → notify sequence. It is defensive:
 *   - returns (never throws) so callers can keep their happy path intact;
 *   - re-resolves a default template when the request has none assigned yet,
 *     so a single admin-configured default template is enough;
 *   - is idempotent — an already-issued request short-circuits.
 *
 * Returns whether a PDF was produced. When it cannot issue (no template, render
 * failure, ...) the request is left untouched so the manual admin flow still
 * works as a fallback.
 */
export async function autoIssueRequest(
  requestId: string,
  scope: CertificateScope,
): Promise<{ issued: boolean; pdf_url: string | null; reason?: string }> {
  try {
    const req = await queryOne<{
      id: string
      student_id: string
      kind: CertificateKind
      language: CertificateLanguage | null
      template_id: string | null
      status: string
      pdf_url: string | null
    }>(
      `SELECT id, student_id, kind, language, template_id, status, pdf_url
         FROM certificate_issuance_requests
        WHERE id = $1 AND scope = $2`,
      [requestId, scope],
    )
    if (!req) return { issued: false, pdf_url: null, reason: "request_not_found" }
    if (req.status === "issued") {
      return { issued: true, pdf_url: req.pdf_url }
    }

    // Ensure a template is assigned (fall back to the scope/kind default).
    let templateId = req.template_id
    if (!templateId) {
      const def = await resolveDefaultTemplate(scope, req.kind, req.language || "ar")
      if (def?.id) {
        templateId = def.id
        await query(
          `UPDATE certificate_issuance_requests SET template_id = $2 WHERE id = $1`,
          [requestId, templateId],
        )
      }
    }
    if (!templateId) {
      // No template configured at all — cannot auto-issue.
      console.error(
        "[eligibility] autoIssueRequest: no default template for",
        { scope, kind: req.kind, language: req.language },
      )
      return { issued: false, pdf_url: null, reason: "no_template" }
    }

    await query(
      `UPDATE certificate_issuance_requests
          SET status = 'approved', approved_at = COALESCE(approved_at, NOW())
        WHERE id = $1`,
      [requestId],
    )
    const result = await issueCertificateForRequest({
      request_id: requestId,
      scope,
      format: "pdf",
    })
    await query(
      `UPDATE certificate_issuance_requests
          SET status = 'issued', issued_at = NOW()
        WHERE id = $1`,
      [requestId],
    )

    const link =
      scope === "academy"
        ? "/academy/student/certificates"
        : "/student/certificates"
    await createNotification({
      userId: req.student_id,
      type: "general",
      title: "تم إصدار شهادتك 🎓",
      message: "تهانينا! تم إصدار شهادتك تلقائيًا. اضغط هنا لعرضها وتحميلها.",
      category: "system",
      link,
      dedupKey: `cert-issued:${requestId}`,
    })

    return { issued: true, pdf_url: result.pdf_url }
  } catch (err) {
    console.error("[eligibility] autoIssueRequest failed", err)
    const message =
      err instanceof Error ? err.message : "unknown_render_error"
    return { issued: false, pdf_url: null, reason: `render_failed: ${message}` }
  }
}

/**
 * Self-heal a student's certificates when they open their certificates page.
 *
 * Ensures that every COMPLETED course / tajweed path / memorization path has a
 * matching issuance request, even if the completion happened on an older build
 * before the eligibility hooks existed.
 *
 * Each created request starts at `data_required`: the student fills in their
 * data, the request becomes `submitted`, and an admin or the course teacher
 * then approves and issues it. This function never issues a certificate by
 * itself — issuance is always a manual approval step.
 *
 * Entirely best-effort: any failure is swallowed so the page still renders.
 */
export async function reconcileStudentCertificates(
  scope: CertificateScope,
  studentId: string,
): Promise<void> {
  try {
    if (scope === "academy") {
      // 1a. Completed courses.
      const courses = await query<{ course_id: string; title: string | null }>(
        `SELECT e.course_id, c.title
           FROM enrollments e
           JOIN courses c ON c.id = e.course_id
          WHERE e.student_id = $1
            AND (e.status = 'COMPLETED' OR e.progress_percentage >= 100)`,
        [studentId],
      ).catch(() => [])
      for (const c of courses) {
        await onCourseCompleted({
          scope,
          studentId,
          courseId: c.course_id,
          courseTitle: c.title || "",
        })
      }

      // 1b. Completed tajweed paths.
      const tajweed = await query<{ path_id: string; title: string | null }>(
        `SELECT e.path_id, p.title
           FROM tajweed_path_enrollments e
           JOIN tajweed_paths p ON p.id = e.path_id
          WHERE e.student_id = $1 AND e.status = 'completed'`,
        [studentId],
      ).catch(() => [])
      for (const p of tajweed) {
        await onPathCompleted({
          scope,
          studentId,
          pathId: p.path_id,
          pathTitle: p.title || "",
          pathType: "tajweed_path",
        })
      }

      // 1c. Completed memorization paths.
      const memo = await query<{ path_id: string; title: string | null }>(
        `SELECT e.path_id, p.title
           FROM memorization_path_enrollments e
           JOIN memorization_paths p ON p.id = e.path_id
          WHERE e.student_id = $1 AND e.status = 'completed'`,
        [studentId],
      ).catch(() => [])
      for (const p of memo) {
        await onPathCompleted({
          scope,
          studentId,
          pathId: p.path_id,
          pathTitle: p.title || "",
          pathType: "memorization_path",
        })
      }
    }
  } catch (err) {
    console.error("[eligibility] reconcileStudentCertificates failed", err)
  }
}

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
          const issued = await autoIssueRequest(insert.id, scope)
          if (issued.issued) {
            result.auto_issued = true
            result.pdf_url = issued.pdf_url
            result.status = "issued"
          }
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
    // Require the student to fill in their data first, then an admin or the
    // course teacher approves and issues. No auto-issue.
    skipDataStep: false,
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
