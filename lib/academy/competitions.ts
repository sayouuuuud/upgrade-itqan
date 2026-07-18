
import { query, queryOne, withTransaction } from '@/lib/db'
import { awardPoints } from '@/lib/academy/gamification'
import { createNotification } from '@/lib/notifications'
import { createEligibilityRequest } from '@/lib/certificate/eligibility'
import { en } from '@/lib/i18n/locales/en';

export async function getCompetitions(filters: { status?: string; type?: string; userId?: string; scope?: string } = {}) {
  let sql = `SELECT * FROM competitions WHERE 1=1`
  const params: any[] = []

  // 'all' (and empty) is a client sentinel meaning "no filter". No competition
  // ever has a literal status/type of 'all', so without this guard a request
  // like `?status=all` would filter `status = 'all'` and match nothing — which
  // silently broke the student detail page (it fetches the list with
  // `status=all` then finds by id, so every competition showed "not found").
  if (filters.status && filters.status !== 'all') {
    params.push(filters.status)
    sql += ` AND status = $${params.length}`
  }
  if (filters.type && filters.type !== 'all') {
    params.push(filters.type)
    sql += ` AND type = $${params.length}`
  }
  if (filters.scope) {
    params.push(filters.scope)
    sql += ` AND scope = $${params.length}`
  }
  
  sql += ` ORDER BY start_date DESC`
  
  const competitions = await query<any>(sql, params)
  
  if (filters.userId) {
    const entries = await query<{ competition_id: string }>(
      `SELECT competition_id FROM competition_entries WHERE student_id = $1`,
      [filters.userId]
    )
    const enteredIds = new Set(entries.map((e) => e.competition_id))
    return competitions.map((c) => ({
      ...c,
      has_joined: enteredIds.has(c.id),
      has_entered: enteredIds.has(c.id)
    }))
  }
  
  return competitions
}

export async function getLibraryCompetitions(filters: { status?: string; userId?: string } = {}) {
  return getCompetitions({ ...filters, scope: 'library' })
}

export async function getAcademyCompetitions(filters: { status?: string; type?: string; userId?: string } = {}) {
  return getCompetitions({ ...filters, scope: 'academy' })
}

export async function getStudentEntries(studentId: string, scope?: string) {
  let sql = `
    SELECT ce.*, c.title as competition_title, c.type as competition_type, c.scope as competition_scope
    FROM competition_entries ce
    JOIN competitions c ON c.id = ce.competition_id
    WHERE ce.student_id = $1
  `
  const params: any[] = [studentId]
  if (scope) {
    params.push(scope)
    sql += ` AND c.scope = $${params.length}`
  }
  sql += ` ORDER BY ce.submitted_at DESC`
  return query(sql, params)
}

export async function getEntries(competitionId: string, stageId?: string) {
  // Default to the active stage so judges/admins always see the current round.
  // Pass an explicit stageId to inspect a past round. For single-stage
  // competitions the active stage owns every entry, so behaviour is unchanged.
  let targetStageId = stageId
  if (!targetStageId) {
    const active = await getActiveStage(competitionId)
    targetStageId = active?.id
  }
  return query(`
    SELECT ce.*, u.name as student_name, u.email as student_email,
           u.avatar_url as student_avatar_url,
           evaluator.name as evaluated_by_name,
           COALESCE(js.judge_count, 0)::int AS judge_count
    FROM competition_entries ce
    JOIN users u ON u.id = ce.student_id
    LEFT JOIN users evaluator ON evaluator.id = ce.evaluated_by
    LEFT JOIN (
      SELECT entry_id, COUNT(*) AS judge_count
      FROM competition_judge_scores
      GROUP BY entry_id
    ) js ON js.entry_id = ce.id
    WHERE ce.competition_id = $1
      AND ($2::uuid IS NULL OR ce.stage_id = $2)
    ORDER BY ce.rank ASC NULLS LAST, ce.score DESC NULLS LAST, ce.submitted_at DESC
  `, [competitionId, targetStageId ?? null])
}

export async function getCompetition(id: string) {
  return queryOne(`SELECT * FROM competitions WHERE id = $1`, [id])
}

// ============================================================================
// Stages (elimination rounds)
// ----------------------------------------------------------------------------
// A competition runs as one or more ordered stages. The LAST stage (highest
// order_index, advance_count = NULL) is the "final" — its top finishers are the
// winners. Earlier stages advance their top `advance_count` students to the
// next stage. A single-stage competition behaves exactly like the old system.
// ============================================================================

export interface CompetitionStage {
  id: string
  competition_id: string
  order_index: number
  name: string
  description: string | null
  advance_count: number | null
  min_verses: number | null
  tajweed_rules: string | null
  start_date: string | null
  end_date: string | null
  status: string // locked | active | completed
  created_at?: string
  updated_at?: string
}

export interface StageInput {
  name: string
  description?: string | null
  advance_count?: number | null
  min_verses?: number | null
  tajweed_rules?: string | null
  start_date?: string | null
  end_date?: string | null
}

/** All stages of a competition, ordered. */
export async function getStages(competitionId: string): Promise<CompetitionStage[]> {
  return query<CompetitionStage>(
    `SELECT * FROM competition_stages WHERE competition_id = $1 ORDER BY order_index ASC`,
    [competitionId],
  )
}

/**
 * The stage currently open for submissions/judging. Prefers the competition's
 * `current_stage_id` pointer, then any 'active' stage, then the first stage.
 */
export async function getActiveStage(competitionId: string): Promise<CompetitionStage | null> {
  const comp = await queryOne<{ current_stage_id: string | null }>(
    `SELECT current_stage_id FROM competitions WHERE id = $1`,
    [competitionId],
  )
  if (comp?.current_stage_id) {
    const s = await queryOne<CompetitionStage>(
      `SELECT * FROM competition_stages WHERE id = $1`,
      [comp.current_stage_id],
    )
    if (s) return s
  }
  return queryOne<CompetitionStage>(
    `SELECT * FROM competition_stages
      WHERE competition_id = $1
      ORDER BY (status = 'active') DESC, order_index ASC
      LIMIT 1`,
    [competitionId],
  )
}

/**
 * Stage context for a student viewing a competition: all stages, the active
 * stage, the student's entry in each stage, and whether they can submit now.
 * Used by the student-facing detail pages to render round progress and gate
 * the submission form.
 */
export async function getStudentStageContext(competitionId: string, studentId: string): Promise<{
  stages: CompetitionStage[]
  activeStage: CompetitionStage | null
  entries: any[]
  activeEntry: any | null
  canSubmit: boolean
}> {
  const [stages, activeStage, entries] = await Promise.all([
    getStages(competitionId),
    getActiveStage(competitionId),
    query<any>(
      `SELECT * FROM competition_entries WHERE competition_id = $1 AND student_id = $2`,
      [competitionId, studentId],
    ),
  ])
  const activeEntry = activeStage ? entries.find((e) => e.stage_id === activeStage.id) ?? null : null
  // A student can submit if the active stage is open AND either it's stage 1
  // (open to all) or they qualified into this stage (an entry row exists), and
  // they haven't already been judged this round.
  const canSubmit = Boolean(
    activeStage &&
    activeStage.status === 'active' &&
    (activeStage.order_index === 1 || !!activeEntry) &&
    !(activeEntry && ['evaluated', 'winner', 'eliminated'].includes(activeEntry.status)),
  )
  return { stages, activeStage, entries, activeEntry, canSubmit }
}

/** The stage immediately after the given order index, if any. */
async function getNextStage(competitionId: string, orderIndex: number): Promise<CompetitionStage | null> {
  return queryOne<CompetitionStage>(
    `SELECT * FROM competition_stages
      WHERE competition_id = $1 AND order_index > $2
      ORDER BY order_index ASC LIMIT 1`,
    [competitionId, orderIndex],
  )
}

/** True when this stage is the last one (no further rounds to advance into). */
function isFinalStage(stage: CompetitionStage, allStages: CompetitionStage[]): boolean {
  const maxOrder = Math.max(...allStages.map((s) => s.order_index))
  return stage.order_index >= maxOrder
}

/**
 * Define the stages for a competition at creation time.
 *
 * - When `stages` has 2+ entries, the competition is multi-stage: stage 1 is
 *   `active`, the rest `locked`, and the last stage's `advance_count` is forced
 *   to NULL (it's the final). The competition pointer/flag are set accordingly.
 * - When `stages` is empty or has 1 entry, a single implicit stage is created
 *   so the competition behaves like a classic single-round contest.
 *
 * Any stages auto-created earlier (e.g. by the backfill) are replaced. Safe to
 * call right after inserting the competition row.
 */
export async function createCompetitionStages(
  competitionId: string,
  stages: StageInput[],
  fallback: { min_verses?: number | null; tajweed_rules?: string | null; start_date?: string | null; end_date?: string | null },
): Promise<void> {
  const clean = (stages || []).filter((s) => s && s.name && s.name.trim())

  // Single (or no) stage → one implicit "final" round from competition fields.
  const list: StageInput[] = clean.length >= 2 ? clean : [
    {
      name: clean[0]?.name?.trim() || 'المسابقة',
      description: clean[0]?.description ?? null,
      advance_count: null,
      min_verses: clean[0]?.min_verses ?? fallback.min_verses ?? null,
      tajweed_rules: clean[0]?.tajweed_rules ?? fallback.tajweed_rules ?? null,
      start_date: clean[0]?.start_date ?? fallback.start_date ?? null,
      end_date: clean[0]?.end_date ?? fallback.end_date ?? null,
    },
  ]

  await withTransaction(async (tx) => {
    // Replace any pre-existing (e.g. backfilled) stages for a clean slate.
    await tx(`UPDATE competitions SET current_stage_id = NULL WHERE id = $1`, [competitionId])
    await tx(`DELETE FROM competition_stages WHERE competition_id = $1`, [competitionId])

    let firstStageId: string | null = null
    for (let i = 0; i < list.length; i++) {
      const s = list[i]
      const isLast = i === list.length - 1
      // Only non-final stages advance students; the final stage's advance_count
      // is always NULL (its top finishers are awarded as winners instead).
      const advance = isLast ? null : Math.max(1, Number(s.advance_count) || 1)
      const inserted = await tx<{ id: string }>(
        `INSERT INTO competition_stages
           (competition_id, order_index, name, description, advance_count, min_verses, tajweed_rules, start_date, end_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          competitionId,
          i + 1,
          s.name.trim(),
          s.description ?? null,
          advance,
          s.min_verses ?? null,
          s.tajweed_rules ?? null,
          s.start_date ?? null,
          s.end_date ?? null,
          i === 0 ? 'active' : 'locked',
        ],
      )
      if (i === 0) firstStageId = inserted[0].id
    }

    await tx(
      `UPDATE competitions SET current_stage_id = $1, is_multi_stage = $2 WHERE id = $3`,
      [firstStageId, list.length >= 2, competitionId],
    )
  })
}

export async function joinCompetition(competitionId: string, studentId: string, stageId?: string) {
  // Joining only registers participation in the active stage. `submitted_at`
  // stays NULL until the student actually submits, so a joined-but-not-submitted
  // entry is never mistaken for a submission (and never shows a bogus date).
  // Students join the active stage only; later stages are populated
  // automatically when they qualify.
  let targetStageId = stageId
  if (!targetStageId) {
    const active = await getActiveStage(competitionId)
    targetStageId = active?.id
  }
  return query(`
    INSERT INTO competition_entries (competition_id, student_id, stage_id, status)
    VALUES ($1, $2, $3, 'pending')
    ON CONFLICT (competition_id, student_id, stage_id) DO NOTHING
    RETURNING *
  `, [competitionId, studentId, targetStageId])
}

export async function submitEntry(competitionId: string, studentId: string, data: {
  submission_url?: string | null
  notes?: string | null
  verses_count?: number
}): Promise<{ success: true; data: any } | { success: false; error: string }> {
  const comp = await queryOne<{ status: string; min_verses: number | null }>(
    `SELECT status, min_verses FROM competitions WHERE id = $1`,
    [competitionId]
  )
  if (!comp) return { success: false, error: "المسابقة غير موجودة" }
  if (comp.status !== 'active') return { success: false, error: "المسابقة غير نشطة" }

  // Submissions always target the active stage. The stage must be open, and the
  // stage's own min_verses requirement takes precedence over the competition's.
  const stage = await getActiveStage(competitionId)
  if (!stage) return { success: false, error: "لا توجد مرحلة نشطة" }
  if (stage.status !== 'active') {
    return { success: false, error: "هذه المرحلة غير مفتوحة للتسليم" }
  }

  const minVerses = Number(stage.min_verses ?? comp.min_verses) || 0
  const verses = Number(data.verses_count) || 0
  if (minVerses > 0 && verses < minVerses) {
    return { success: false, error: `الحد الأدنى للمشاركة هو ${minVerses} آية` }
  }

  // The student's entry row for THIS stage. For stage 1 it's created on demand;
  // for later stages it only exists if the student qualified (advanced).
  const existing = await queryOne<{ status: string }>(
    `SELECT status FROM competition_entries WHERE competition_id = $1 AND student_id = $2 AND stage_id = $3`,
    [competitionId, studentId, stage.id]
  )
  if (stage.order_index > 1 && !existing) {
    return { success: false, error: "لم تتأهّل لهذه المرحلة" }
  }
  // Block re-submission once this stage's entry has already been judged.
  if (existing && (existing.status === 'evaluated' || existing.status === 'winner')) {
    return { success: false, error: "تم تقييم مشاركتك بالفعل ولا يمكن تعديلها" }
  }

  // Ensure the participation row exists in this stage, then record submission.
  await joinCompetition(competitionId, studentId, stage.id)

  const rows = await query<any>(`
    UPDATE competition_entries
    SET submission_url = $3, notes = $4, verses_count = $5, status = 'pending', submitted_at = NOW()
    WHERE competition_id = $1 AND student_id = $2 AND stage_id = $6
    RETURNING *
  `, [competitionId, studentId, data.submission_url || null, data.notes || null, verses, stage.id])

  return { success: true, data: rows[0] }
}

export async function getJudgeAssignments(judgeId: string) {
  const assigned = await query(`
    SELECT c.*, COUNT(ce.id)::int AS participants_count,
      COUNT(ce.id) FILTER (WHERE ce.submission_url IS NOT NULL AND ce.status = 'pending')::int AS pending_count
    FROM competitions c
    JOIN competition_judges cj ON cj.competition_id = c.id
    LEFT JOIN competition_entries ce ON ce.competition_id = c.id
    WHERE cj.judge_id = $1
    GROUP BY c.id
    ORDER BY c.start_date DESC
  `, [judgeId])
  return assigned
}

// Roles allowed to be assigned as competition judges.
export const JUDGE_ROLES = ['teacher', 'reader', 'student_supervisor', 'reciter_supervisor', 'admin', 'academy_admin'] as const

export interface JudgeRow {
  id: string
  judge_id: string
  assigned_at: string
  name: string | null
  email: string | null
  role: string
  avatar_url: string | null
}

export interface CandidateJudge {
  id: string
  name: string | null
  email: string | null
  role: string
  avatar_url: string | null
}

/** Judges currently assigned to a competition. */
export async function getCompetitionJudges(competitionId: string): Promise<JudgeRow[]> {
  return query<JudgeRow>(
    `SELECT cj.id, cj.judge_id, cj.assigned_at,
            u.name, u.email, u.role, u.avatar_url
     FROM competition_judges cj
     JOIN users u ON u.id = cj.judge_id
     WHERE cj.competition_id = $1
     ORDER BY cj.assigned_at ASC`,
    [competitionId]
  )
}

/**
 * Users eligible to be assigned as judges (teachers + reciters). Optional
 * free-text search on name/email. Capped to keep the picker responsive.
 */
export async function getCandidateJudges(search?: string, scope?: string): Promise<CandidateJudge[]> {
  const params: any[] = []
  let sql = `SELECT id, name, email, role, avatar_url
             FROM users
             WHERE role = ANY($1)`
  
  let allowedRoles = [...JUDGE_ROLES] as string[]
  if (scope === 'academy') {
    allowedRoles = allowedRoles.filter(r => ['teacher', 'student_supervisor', 'academy_admin', 'admin'].includes(r))
  } else if (scope === 'library') {
    allowedRoles = allowedRoles.filter(r => ['reader', 'reciter_supervisor', 'admin'].includes(r))
  }
  
  params.push(allowedRoles)
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`)
    sql += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`
  }
  sql += ` ORDER BY name ASC NULLS LAST LIMIT 100`
  return query<CandidateJudge>(sql, params)
}

export async function addCompetitionJudge(competitionId: string, judgeId: string) {
  const comp = await queryOne<{ scope: string }>(`SELECT scope FROM competitions WHERE id = $1`, [competitionId])
  if (!comp) return { success: false as const, error: "المسابقة غير موجودة" }

  const user = await queryOne<{ role: string }>(`SELECT role FROM users WHERE id = $1`, [judgeId])
  if (!user) return { success: false as const, error: "المستخدم غير موجود" }

  let allowedRoles = [...JUDGE_ROLES] as string[]
  if (comp.scope === 'academy') {
    allowedRoles = allowedRoles.filter(r => ['teacher', 'student_supervisor', 'academy_admin', 'admin'].includes(r))
  } else if (comp.scope === 'library') {
    allowedRoles = allowedRoles.filter(r => ['reader', 'reciter_supervisor', 'admin'].includes(r))
  }

  if (!allowedRoles.includes(user.role)) {
    return { success: false as const, error: "دور المستخدم غير صالح للتحكيم في هذه المسابقة" }
  }
  await query(
    `INSERT INTO competition_judges (competition_id, judge_id)
     VALUES ($1, $2)
     ON CONFLICT (competition_id, judge_id) DO NOTHING`,
    [competitionId, judgeId]
  )
  return { success: true as const }
}

export async function removeCompetitionJudge(competitionId: string, judgeId: string) {
  await query(
    `DELETE FROM competition_judges WHERE competition_id = $1 AND judge_id = $2`,
    [competitionId, judgeId]
  )
  return { success: true as const }
}

export async function evaluateEntry(entryId: string, judgeId: string, evaluation: { score: number; tajweedScores: any; feedback: string | null }) {
  try {
    const score = Number(evaluation.score)
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return { success: false, error: "الدرجة يجب أن تكون بين 0 و 100" }
    }

    const entry = await queryOne<{
      competition_id: string
      submission_url: string | null
      status: string
    }>(
      `SELECT competition_id, submission_url, status FROM competition_entries WHERE id = $1`,
      [entryId]
    )
    if (!entry) return { success: false, error: 'Entry not found' }

    // Guard 1: a judge can only score an entry that was actually submitted.
    // Without this a joined-but-not-submitted (pending, no URL) entry could be
    // given a score and then sneak into the ranking.
    if (!entry.submission_url) {
      return { success: false, error: "لا يمكن تقييم مشاركة لم تُسلَّم بعد" }
    }

    // Guard 2: never re-open scoring after results are official. Re-scoring an
    // ended competition would silently desync ranks, winner flags and points.
    const comp = await queryOne<{ status: string; scope: string; created_by: string | null }>(
      `SELECT status, scope, created_by FROM competitions WHERE id = $1`,
      [entry.competition_id]
    )
    if (!comp) return { success: false, error: 'Competition not found' }
    if (comp.status === 'ended') {
      return { success: false, error: "تم اعتماد نتائج هذه المسابقة ولا يمكن تعديل التقييم" }
    }

    // Authorization: an assigned judge, the competition's own creator, or an
    // administrator of THIS competition's scope. We intentionally do NOT treat
    // every `reader` as an admin here — that previously let any reciter score
    // any competition they were never assigned to. Reciters can only judge
    // competitions they are explicitly assigned to (or created).
    const isJudge = await queryOne(
      `SELECT 1 FROM competition_judges WHERE competition_id = $1 AND judge_id = $2`,
      [entry.competition_id, judgeId]
    )
    const user = await queryOne<{ role: string }>(`SELECT role FROM users WHERE id = $1`, [judgeId])
    const role = user?.role
    // Global admins manage either scope; supervisors manage only the library
    // (scope = 'library'); academy_admin manages only the academy.
    const isScopeAdmin =
      role === 'admin' ||
      (comp.scope === 'academy' && role === 'academy_admin') ||
      (comp.scope === 'library' && ['student_supervisor', 'reciter_supervisor'].includes(role || ''))
    const isCreator = comp.created_by === judgeId

    if (!isJudge && !isScopeAdmin && !isCreator) {
      return { success: false, error: 'Unauthorized judge' }
    }

    // Record this judge's individual score (one row per judge per entry), then
    // recompute the entry's official score as the average across all judges.
    // This makes multi-judge competitions actually work instead of "last judge
    // to click save overwrites everyone".
    await query(
      `INSERT INTO competition_judge_scores (entry_id, judge_id, score, tajweed_scores, feedback)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (entry_id, judge_id)
       DO UPDATE SET score = EXCLUDED.score,
                     tajweed_scores = EXCLUDED.tajweed_scores,
                     feedback = EXCLUDED.feedback,
                     evaluated_at = NOW()`,
      [entryId, judgeId, score, JSON.stringify(evaluation.tajweedScores ?? {}), evaluation.feedback]
    )

    const agg = await queryOne<{ avg_score: string; judge_count: string }>(
      `SELECT ROUND(AVG(score)::numeric, 2) AS avg_score, COUNT(*)::text AS judge_count
         FROM competition_judge_scores WHERE entry_id = $1`,
      [entryId]
    )
    const avgScore = Number(agg?.avg_score ?? score)
    const judgeCount = Number(agg?.judge_count ?? 1)

    // The entry keeps the averaged score and the most recent judge's tajweed
    // breakdown/feedback as the headline; per-judge detail lives in the scores
    // table. `evaluated_by` reflects the latest judge to act.
    await query(
      `UPDATE competition_entries
       SET score = $1, tajweed_scores = $2, feedback = $3, status = 'evaluated', evaluated_at = NOW(), evaluated_by = $4
       WHERE id = $5`,
      [avgScore, JSON.stringify(evaluation.tajweedScores ?? {}), evaluation.feedback, judgeId, entryId]
    )

    return { success: true, averageScore: avgScore, judgeCount }
  } catch (error) {
    console.error('Error evaluating entry:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/** All individual judge scores for an entry (for transparency in the UI). */
export async function getEntryJudgeScores(entryId: string) {
  return query<{
    judge_id: string
    score: number
    tajweed_scores: any
    feedback: string | null
    evaluated_at: string
    judge_name: string | null
    judge_role: string
  }>(
    `SELECT cjs.judge_id, cjs.score, cjs.tajweed_scores, cjs.feedback, cjs.evaluated_at,
            u.name AS judge_name, u.role AS judge_role
       FROM competition_judge_scores cjs
       JOIN users u ON u.id = cjs.judge_id
      WHERE cjs.entry_id = $1
      ORDER BY cjs.evaluated_at ASC`,
    [entryId]
  )
}

/**
 * Award points for a finishing position in a competition.
 *
 * `rank` 1/2/3 maps to the competition's configurable points_first/second/third
 * columns. Points are granted through the real gamification engine
 * (user_points + points_log) — NOT the old non-existent `student_points` table.
 *
 * Idempotent: if this student was already awarded competition points for this
 * competition we skip, so re-saving an evaluation never double-pays.
 */
/**
 * Tell a top-N finisher they placed, and (if the competition issues
 * certificates) create their certificate-issuance request so it appears in
 * "أكمل بيانات الشهادة" — auto-issuing when the admin enabled that setting.
 *
 * Both writes are idempotent (notification dedupKey + the eligibility request's
 * unique index), and every failure is swallowed so the surrounding points/award
 * flow is never interrupted.
 */
async function notifyAndCertifyCompetitionRank(opts: {
  competitionId: string
  studentId: string
  rank: number
  title: string | null
  scope: string | null
  certificateEnabled: boolean | null
  awardTopN: number | null
}): Promise<void> {
  const { competitionId, studentId, rank, title } = opts
  const topN = Math.max(3, Number(opts.awardTopN || 10))
  if (rank > topN) return // only people who actually placed are notified

  const compTitle = title || 'المسابقة'
  const rankWord =
    rank === 1 ? 'المركز الأول 🥇'
    : rank === 2 ? 'المركز الثاني 🥈'
    : rank === 3 ? 'المركز الثالث 🥉'
    : `المركز ${rank}`
  const isPodium = rank <= 3
  const studentLink = opts.scope === 'academy' ? '/academy/student/competitions' : '/student/competitions'

  // 1. Result notification (idempotent per student per competition).
  try {
    await createNotification({
      userId: studentId,
      type: 'general',
      title: isPodium ? `مبارك! حصلت على ${rankWord} 🎉` : `نتيجة المسابقة: ${rankWord}`,
      message: `لقد حصلت على ${rankWord} في «${compTitle}». اضغط لعرض النتيجة.`,
      category: 'system',
      link: studentLink,
      dedupKey: `competition-result:${competitionId}:${studentId}`,
    })
  } catch (err) {
    console.error('[competitions] result notification failed', err)
  }

  // 2. Certificate eligibility (only when the competition issues certificates).
  if (opts.certificateEnabled === false) return
  try {
    const certScope: 'academy' | 'maqraa' = opts.scope === 'academy' ? 'academy' : 'maqraa'
    await createEligibilityRequest({
      scope: certScope,
      kind: 'competition',
      studentId,
      sourceTable: 'competitions',
      sourceId: competitionId,
      sourceLabel: compTitle,
      rank,
      reason: `${rankWord} في ${compTitle}`,
      language: 'ar',
    })
  } catch (err) {
    console.error('[competitions] certificate eligibility failed', err)
  }
}

export async function awardCompetitionRank(
  competitionId: string,
  studentId: string,
  rank: number,
) {
  try {
    const comp = await queryOne<{
      title: string | null
      scope: string | null
      certificate_enabled: boolean | null
      award_top_n: number | null
      points_multiplier: number | null
      points_first: number | null
      points_second: number | null
      points_third: number | null
    }>(
      `SELECT title, scope, certificate_enabled, award_top_n,
              points_multiplier, points_first, points_second, points_third
         FROM competitions WHERE id = $1`,
      [competitionId],
    )
    if (!comp) return { success: false, error: 'Competition not found' }

    // The 1st-place finisher is recorded as the competition winner.
    if (rank === 1) {
      await query(
        `UPDATE competitions SET winner_id = $1 WHERE id = $2`,
        [studentId, competitionId],
      )
      await query(
        `UPDATE competition_entries SET status = 'winner' WHERE competition_id = $1 AND student_id = $2`,
        [competitionId, studentId],
      )
    }

    // Notify the student of their result and (when enabled) open the
    // certificate-issuance flow. Best-effort and idempotent, so it runs for
    // every awarded rank (top-N) regardless of whether the rank earns points,
    // and never blocks the points award below. This is the single place both
    // the reader-finalize flow and the admin manual-award flow pass through.
    await notifyAndCertifyCompetitionRank({
      competitionId,
      studentId,
      rank,
      title: comp.title,
      scope: comp.scope,
      certificateEnabled: comp.certificate_enabled,
      awardTopN: comp.award_top_n,
    })

    const rankPoints: Record<number, number> = {
      1: Number(comp.points_first ?? 500),
      2: Number(comp.points_second ?? 300),
      3: Number(comp.points_third ?? 150),
    }
    const basePoints = rankPoints[rank]
    if (!basePoints || basePoints <= 0) {
      // Only the top 3 ranks earn points.
      return { success: true, awarded: 0 }
    }

    const multiplier = Number(comp.points_multiplier) > 0 ? Number(comp.points_multiplier) : 1
    const points = Math.round(basePoints * multiplier)

    // Idempotency guard: skip if this student already has competition points
    // logged for this competition (regardless of rank changes).
    const already = await queryOne<{ id: string }>(
      `SELECT id FROM points_log
        WHERE user_id = $1 AND reason = 'competition_win'
          AND related_entity_type = 'competition' AND related_entity_id = $2
        LIMIT 1`,
      [studentId, competitionId],
    )
    if (already) {
      return { success: true, awarded: 0, alreadyAwarded: true }
    }

    const rankLabel = rank === 1 ? "المركز الأول" : rank === 2 ? "المركز الثاني" : "المركز الثالث"
    await awardPoints(studentId, points, 'competition_win', {
      description: `${rankLabel}${" في مسابقة: "}${comp.title ?? ''}`.trim(),
      relatedEntityType: 'competition',
      relatedEntityId: competitionId,
      applyStreakMultiplier: false,
    })

    return { success: true, awarded: points }
  } catch (error) {
    console.error('Error awarding competition rank:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/** Back-compat helper: awarding the winner is just rank #1. */
export async function awardCompetitionWinner(competitionId: string, studentId: string) {
  await query(`UPDATE competitions SET status = 'ended' WHERE id = $1`, [competitionId])
  return awardCompetitionRank(competitionId, studentId, 1)
}

export interface RankPreviewRow {
  entry_id: string
  student_id: string
  student_name: string | null
  score: number | null
  rank: number
  is_winner: boolean
}

/**
 * Compute the proposed ranking for a competition WITHOUT writing anything.
 * Evaluated entries are ordered by score (desc), then earliest submission as a
 * tie-breaker. The top `award_top_n` (default 3, capped at 3 for points) are
 * flagged as winners. Used to preview results before the judge confirms.
 */
export async function previewCompetitionResults(competitionId: string, stageId?: string): Promise<{
  ready: boolean
  pending: number
  topN: number
  ranking: RankPreviewRow[]
}> {
  // Resolve which stage we're previewing (defaults to the active stage).
  const stages = await getStages(competitionId)
  let stage: CompetitionStage | null = stageId
    ? stages.find((s) => s.id === stageId) ?? null
    : await getActiveStage(competitionId)
  const targetStageId = stage?.id ?? null

  const comp = await queryOne<{ award_top_n: number | null }>(
    `SELECT award_top_n FROM competitions WHERE id = $1`,
    [competitionId],
  )

  // Cutoff: a non-final stage advances its top `advance_count`; the final stage
  // (or a single-stage competition) awards its top `award_top_n`.
  const finalStage = !stage || isFinalStage(stage, stages)
  const topN = finalStage
    ? Math.max(1, Number(comp?.award_top_n) || 3)
    : Math.max(1, Number(stage?.advance_count) || 1)

  const pendingRow = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM competition_entries
      WHERE competition_id = $1 AND ($2::uuid IS NULL OR stage_id = $2)
        AND submission_url IS NOT NULL AND status = 'pending'`,
    [competitionId, targetStageId],
  )
  const pending = Number(pendingRow?.count ?? 0)

  const evaluated = await query<{ id: string; student_id: string; student_name: string | null; score: number | null }>(
    `SELECT ce.id, ce.student_id, u.name AS student_name, ce.score
       FROM competition_entries ce
       JOIN users u ON u.id = ce.student_id
      WHERE ce.competition_id = $1
        AND ($2::uuid IS NULL OR ce.stage_id = $2)
        AND ce.status IN ('evaluated', 'winner', 'qualified', 'eliminated', 'disqualified')
        AND ce.score IS NOT NULL
      ORDER BY ce.score DESC, ce.submitted_at ASC`,
    [competitionId, targetStageId],
  )

  // Competition-style ranking with ties: equal scores share the same rank, and
  // the next rank skips accordingly (e.g. 90, 90, 80 -> ranks 1, 1, 3). A
  // student is a winner if their *rank* is within topN, so tied students at the
  // cutoff are all included rather than arbitrarily split by submission time.
  let lastScore: number | null = null
  let lastRank = 0
  const ranking: RankPreviewRow[] = evaluated.map((e, i) => {
    const scoreNum = Number(e.score)
    const rank = lastScore !== null && scoreNum === lastScore ? lastRank : i + 1
    lastScore = scoreNum
    lastRank = rank
    return {
      entry_id: e.id,
      student_id: e.student_id,
      student_name: e.student_name,
      score: e.score,
      rank,
      is_winner: rank <= topN,
    }
  })

  return { ready: evaluated.length > 0, pending, topN, ranking }
}

/**
 * Internal: treat `stage` as the FINAL stage and crown its winners — persist
 * ranks, flag winners, set the competition winner, award points/certs, and
 * close the competition. All structural writes are atomic; points/certs run
 * post-commit and are independently idempotent. Used both by the normal final
 * stage and by the "finalize current stage as results" admin action.
 */
async function finalizeStageAsResults(
  competitionId: string,
  stage: CompetitionStage,
  remainingStageIds: string[],
  allowTie: boolean = false,
): Promise<{ success: boolean; error?: string; winners?: number; ranked?: number }> {
  const { ready, ranking, topN } = await previewCompetitionResults(competitionId, stage.id)
  if (!ready) {
    return { success: false, error: "لا توجد مشاركات مُقيّمة لاعتماد نتائجها" }
  }

  const winnerRows = ranking.filter((r) => r.is_winner)
  if (!allowTie && winnerRows.length > topN) {
    return { success: false, error: "يوجد تعادل في الدرجات يتجاوز العدد المسموح. يرجى تعديل التقييم لكسر التعادل." }
  }
  const firstPlace = ranking.find((r) => r.rank === 1)

  await withTransaction(async (tx) => {
    // Reset previous winner flags in this stage so re-finalizing reflects latest scores.
    await tx(
      `UPDATE competition_entries SET status = 'evaluated'
        WHERE competition_id = $1 AND stage_id = $2 AND status = 'winner'`,
      [competitionId, stage.id],
    )
    // Persist computed ranks.
    for (const row of ranking) {
      await tx(`UPDATE competition_entries SET rank = $1 WHERE id = $2`, [row.rank, row.entry_id])
    }
    // Flag winners (rank within topN) within this stage.
    for (const row of winnerRows) {
      await tx(
        `UPDATE competition_entries SET status = 'winner'
          WHERE competition_id = $1 AND stage_id = $2 AND student_id = $3`,
        [competitionId, stage.id, row.student_id],
      )
    }
    if (firstPlace) {
      await tx(`UPDATE competitions SET winner_id = $1 WHERE id = $2`, [firstPlace.student_id, competitionId])
    }
    // This stage is done; any not-yet-reached stages are locked out.
    await tx(`UPDATE competition_stages SET status = 'completed', updated_at = NOW() WHERE id = $1`, [stage.id])
    if (remainingStageIds.length > 0) {
      await tx(
        `UPDATE competition_stages SET status = 'locked', updated_at = NOW() WHERE id = ANY($1::uuid[])`,
        [remainingStageIds],
      )
    }
    await tx(`UPDATE competitions SET status = 'ended', current_stage_id = $1 WHERE id = $2`, [stage.id, competitionId])
  })

  // Award points/certs/notifications post-commit (idempotent).
  let winners = 0
  for (const row of winnerRows) {
    await awardCompetitionRank(competitionId, row.student_id, row.rank)
    winners++
  }
  return { success: true, winners, ranked: ranking.length }
}

/**
 * Finalize a competition's CURRENT stage as the official end result.
 *
 * - If the active stage is the final stage (or the competition is single-stage),
 *   this crowns the overall winners — identical to the classic behaviour.
 * - If called on an earlier stage (via the admin "إنهاء واعتماد النتائج الحالية"
 *   option), it treats that stage as the finish line: top scorer wins, remaining
 *   stages are locked, competition closes.
 *
 * Idempotent on points. Backwards compatible: existing callers pass only the
 * competition id and get the active/final stage.
 */
export async function finalizeCompetitionResults(
  competitionId: string,
  stageId?: string,
  allowTie: boolean = false,
): Promise<{ success: boolean; error?: string; winners?: number; ranked?: number }> {
  try {
    const stages = await getStages(competitionId)
    const stage = stageId
      ? stages.find((s) => s.id === stageId) ?? null
      : (await getActiveStage(competitionId))
    if (!stage) {
      return { success: false, error: "لا توجد مرحلة نشطة" }
    }
    const remaining = stages.filter((s) => s.order_index > stage.order_index).map((s) => s.id)
    return await finalizeStageAsResults(competitionId, stage, remaining, allowTie)
  } catch (error) {
    console.error('Error finalizing competition results:', error)
    return { success: false, error: "حدث خطأ أثناء اعتماد النتائج" }
  }
}

/** Explicit alias for the admin "finalize current stage now" action (option 2). */
export async function finalizeCurrentStageAsResults(competitionId: string, allowTie: boolean = false) {
  return finalizeCompetitionResults(competitionId, undefined, allowTie)
}

/**
 * The core stage-transition action.
 *
 * - On a NON-final stage: ranks the stage, advances the top `advance_count`
 *   students (marks them 'qualified', creates fresh pending entries in the next
 *   stage), marks the rest 'eliminated', activates the next stage, and notifies
 *   both groups. All writes are atomic; notifications are post-commit.
 * - On the FINAL stage: delegates to finalizeCompetitionResults (crowns winners).
 *
 * Idempotent: re-running after a stage is already completed is a no-op for that
 * stage (it will operate on the now-active next stage instead).
 */
export async function advanceStageOrFinalize(
  competitionId: string,
  opts?: { allowTie?: boolean },
): Promise<{ success: boolean; error?: string; advanced?: number; eliminated?: number; finalized?: boolean; winners?: number }> {
  try {
    const stages = await getStages(competitionId)
    const stage = await getActiveStage(competitionId)
    if (!stage) {
      return { success: false, error: "لا توجد مرحلة نشطة" }
    }

    // Final stage → crown winners.
    if (isFinalStage(stage, stages)) {
      const res = await finalizeCompetitionResults(competitionId, stage.id, opts?.allowTie)
      return { ...res, finalized: true }
    }

    // Non-final stage → advance the top scorers.
    const nextStage = await getNextStage(competitionId, stage.order_index)
    if (!nextStage) {
      // No next stage despite not being "final" (shouldn't happen) — finalize.
      const res = await finalizeCompetitionResults(competitionId, stage.id, opts?.allowTie)
      return { ...res, finalized: true }
    }

    const { ready, ranking, topN } = await previewCompetitionResults(competitionId, stage.id)
    if (!ready) {
      return { success: false, error: "لا توجد مشاركات مُقيّمة في هذه المرحلة" }
    }

    const advancing = ranking.filter((r) => r.is_winner) // is_winner == within advance_count here
    if (!opts?.allowTie && advancing.length > topN) {
      return { success: false, error: "يوجد تعادل في الدرجات يتجاوز العدد المسموح للتأهل. يرجى تعديل التقييم لكسر التعادل." }
    }
    const eliminated = ranking.filter((r) => !r.is_winner)

    await withTransaction(async (tx) => {
      // Persist ranks for this stage's entries.
      for (const row of ranking) {
        await tx(`UPDATE competition_entries SET rank = $1 WHERE id = $2`, [row.rank, row.entry_id])
      }
      // Mark advancing vs eliminated in the CURRENT stage.
      for (const row of advancing) {
        await tx(`UPDATE competition_entries SET status = 'winner' WHERE id = $1`, [row.entry_id])
      }
      for (const row of eliminated) {
        await tx(`UPDATE competition_entries SET status = 'disqualified' WHERE id = $1`, [row.entry_id])
      }
      // Create fresh pending entries for advancers in the NEXT stage.
      for (const row of advancing) {
        await tx(
          `INSERT INTO competition_entries (competition_id, student_id, stage_id, status)
           VALUES ($1, $2, $3, 'pending')
           ON CONFLICT (competition_id, student_id, stage_id) DO NOTHING`,
          [competitionId, row.student_id, nextStage.id],
        )
      }
      // Close this stage, open the next, and move the competition pointer.
      await tx(`UPDATE competition_stages SET status = 'completed', updated_at = NOW() WHERE id = $1`, [stage.id])
      await tx(`UPDATE competition_stages SET status = 'active', updated_at = NOW() WHERE id = $1`, [nextStage.id])
      await tx(`UPDATE competitions SET current_stage_id = $1 WHERE id = $2`, [nextStage.id, competitionId])
    })

    // Notify advancers and eliminated students (post-commit, best-effort).
    const comp = await queryOne<{ title: string | null; scope: string | null }>(
      `SELECT title, scope FROM competitions WHERE id = $1`, [competitionId])
    const compTitle = comp?.title || 'المسابقة'
    const studentLink = comp?.scope === 'academy' ? '/academy/student/competitions' : '/student/competitions'
    for (const row of advancing) {
      try {
        await createNotification({
          userId: row.student_id,
          type: 'general',
          title: `تأهّلت إلى «${nextStage.name}» 🎉`,
          message: `لقد تأهّلت إلى مرحلة «${nextStage.name}» في «${compTitle}». جهّز تسليمك الجديد!`,
          category: 'system',
          link: studentLink,
          dedupKey: `competition-advance:${nextStage.id}:${row.student_id}`,
        })
      } catch (err) { console.error('[competitions] advance notification failed', err) }
    }
    for (const row of eliminated) {
      try {
        await createNotification({
          userId: row.student_id,
          type: 'general',
          title: `نتيجة مرحلة «${stage.name}»`,
          message: `شكراً لمشاركتك في «${compTitle}». لم تتأهّل لمرحلة «${nextStage.name}» هذه المرة، نتمنى لك التوفيق!`,
          category: 'system',
          link: studentLink,
          dedupKey: `competition-eliminated:${stage.id}:${row.student_id}`,
        })
      } catch (err) { console.error('[competitions] eliminated notification failed', err) }
    }

    return { success: true, advanced: advancing.length, eliminated: eliminated.length, finalized: false }
  } catch (error) {
    console.error('Error advancing competition stage:', error)
    return { success: false, error: "حدث خطأ أثناء ترحيل المرحلة" }
  }
}

/**
 * Cancel a competition immediately (admin option 3): close it with NO ranking,
 * winner, points or certificates, and notify every participant that it ended.
 * Idempotent — notifications are de-duplicated per student.
 */
export async function cancelCompetition(
  competitionId: string,
): Promise<{ success: boolean; error?: string; notified?: number }> {
  try {
    const comp = await queryOne<{ title: string | null; scope: string | null; status: string }>(
      `SELECT title, scope, status FROM competitions WHERE id = $1`, [competitionId])
    if (!comp) return { success: false, error: "المسابقة غير موجودة" }

    // Everyone who ever participated in any stage.
    const participants = await query<{ student_id: string }>(
      `SELECT DISTINCT student_id FROM competition_entries WHERE competition_id = $1`,
      [competitionId],
    )

    await withTransaction(async (tx) => {
      await tx(`UPDATE competition_stages SET status = 'completed', updated_at = NOW()
                 WHERE competition_id = $1 AND status <> 'completed'`, [competitionId])
      await tx(`UPDATE competitions SET status = 'ended' WHERE id = $1`, [competitionId])
    })

    const compTitle = comp.title || 'المسابقة'
    const studentLink = comp.scope === 'academy' ? '/academy/student/competitions' : '/student/competitions'
    let notified = 0
    for (const p of participants) {
      try {
        await createNotification({
          userId: p.student_id,
          type: 'general',
          title: `تم إنهاء المسابقة`,
          message: `نأسف، تم إنهاء «${compTitle}» من قبل الإدارة.`,
          category: 'system',
          link: studentLink,
          dedupKey: `competition-cancelled:${competitionId}:${p.student_id}`,
        })
        notified++
      } catch (err) { console.error('[competitions] cancel notification failed', err) }
    }
    return { success: true, notified }
  } catch (error) {
    console.error('Error cancelling competition:', error)
    return { success: false, error: "حدث خطأ أثناء إنهاء المسابقة" }
  }
}
