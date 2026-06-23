
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

export async function getEntries(competitionId: string) {
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
    ORDER BY ce.rank ASC NULLS LAST, ce.score DESC NULLS LAST, ce.submitted_at DESC
  `, [competitionId])
}

export async function getCompetition(id: string) {
  return queryOne(`SELECT * FROM competitions WHERE id = $1`, [id])
}

export async function joinCompetition(competitionId: string, studentId: string) {
  // Joining only registers participation. `submitted_at` stays NULL until the
  // student actually submits, so a joined-but-not-submitted entry is never
  // mistaken for a submission (and never shows a bogus submission date).
  return query(`
    INSERT INTO competition_entries (competition_id, student_id, status)
    VALUES ($1, $2, 'pending')
    ON CONFLICT (competition_id, student_id) DO NOTHING
    RETURNING *
  `, [competitionId, studentId])
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
  if (!comp) return { success: false, error: ((en.extracted_2026_v2 as any)?.["المسابقة غير موجودة"] || "المسابقة غير موجودة") }
  if (comp.status !== 'active') return { success: false, error: ((en.extracted_2026_v2 as any)?.["المسابقة غير نشطة"] || "المسابقة غير نشطة") }

  const minVerses = Number(comp.min_verses) || 0
  const verses = Number(data.verses_count) || 0
  if (minVerses > 0 && verses < minVerses) {
    return { success: false, error: `${(en.extracted_2026_v2 as any)?.["الحد الأدنى للمشاركة هو "] || "الحد الأدنى للمشاركة هو "}${minVerses}${(en.extracted_2026_v2 as any)?.[" آية"] || " آية"}` }
  }

  // Block re-submission once an entry has already been judged.
  const existing = await queryOne<{ status: string }>(
    `SELECT status FROM competition_entries WHERE competition_id = $1 AND student_id = $2`,
    [competitionId, studentId]
  )
  if (existing && (existing.status === 'evaluated' || existing.status === 'winner')) {
    return { success: false, error: ((en.extracted_2026_v2 as any)?.["تم تقييم مشاركتك بالفعل ولا يمكن تعديلها"] || "تم تقييم مشاركتك بالفعل ولا يمكن تعديلها") }
  }

  // Ensure the participation row exists, then record the actual submission.
  await joinCompetition(competitionId, studentId)

  const rows = await query<any>(`
    UPDATE competition_entries
    SET submission_url = $3, notes = $4, verses_count = $5, status = 'pending', submitted_at = NOW()
    WHERE competition_id = $1 AND student_id = $2
    RETURNING *
  `, [competitionId, studentId, data.submission_url || null, data.notes || null, verses])

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
export const JUDGE_ROLES = ['teacher', 'reader'] as const

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
export async function getCandidateJudges(search?: string): Promise<CandidateJudge[]> {
  const params: any[] = []
  let sql = `SELECT id, name, email, role, avatar_url
             FROM users
             WHERE role = ANY($1)`
  params.push(JUDGE_ROLES as unknown as string[])
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`)
    sql += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`
  }
  sql += ` ORDER BY name ASC NULLS LAST LIMIT 100`
  return query<CandidateJudge>(sql, params)
}

export async function addCompetitionJudge(competitionId: string, judgeId: string) {
  const user = await queryOne<{ role: string }>(`SELECT role FROM users WHERE id = $1`, [judgeId])
  if (!user) return { success: false as const, error: ((en.extracted_2026_v2 as any)?.["المستخدم غير موجود"] || "المستخدم غير موجود") }
  if (!(JUDGE_ROLES as readonly string[]).includes(user.role)) {
    return { success: false as const, error: ((en.extracted_2026_v2 as any)?.["يمكن تعيين المدرّسين أو المقرئين فقط كمحكّمين"] || "يمكن تعيين المدرّسين أو المقرئين فقط كمحكّمين") }
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
      return { success: false, error: ((en.extracted_2026_v2 as any)?.["الدرجة يجب أن تكون بين 0 و 100"] || "الدرجة يجب أن تكون بين 0 و 100") }
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
      return { success: false, error: ((en.extracted_2026_v2 as any)?.["لا يمكن تقييم مشاركة لم تُسلَّم بعد"] || "لا يمكن تقييم مشاركة لم تُسلَّم بعد") }
    }

    // Guard 2: never re-open scoring after results are official. Re-scoring an
    // ended competition would silently desync ranks, winner flags and points.
    const comp = await queryOne<{ status: string; scope: string; created_by: string | null }>(
      `SELECT status, scope, created_by FROM competitions WHERE id = $1`,
      [entry.competition_id]
    )
    if (!comp) return { success: false, error: 'Competition not found' }
    if (comp.status === 'ended') {
      return { success: false, error: ((en.extracted_2026_v2 as any)?.["تم اعتماد نتائج هذه المسابقة ولا يمكن تعديل التقييم"] || "تم اعتماد نتائج هذه المسابقة ولا يمكن تعديل التقييم") }
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

    const rankLabel = rank === 1 ? ((en.extracted_2026_v2 as any)?.["المركز الأول"] || "المركز الأول") : rank === 2 ? ((en.extracted_2026_v2 as any)?.["المركز الثاني"] || "المركز الثاني") : ((en.extracted_2026_v2 as any)?.["المركز الثالث"] || "المركز الثالث")
    await awardPoints(studentId, points, 'competition_win', {
      description: `${rankLabel}${((en.extracted_2026_v2 as any)?.[" في مسابقة: "] || " في مسابقة: ")}${comp.title ?? ''}`.trim(),
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
export async function previewCompetitionResults(competitionId: string): Promise<{
  ready: boolean
  pending: number
  topN: number
  ranking: RankPreviewRow[]
}> {
  const comp = await queryOne<{ award_top_n: number | null }>(
    `SELECT award_top_n FROM competitions WHERE id = $1`,
    [competitionId],
  )
  const topN = Math.max(1, Number(comp?.award_top_n) || 3)

  const pendingRow = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM competition_entries
      WHERE competition_id = $1 AND submission_url IS NOT NULL AND status = 'pending'`,
    [competitionId],
  )
  const pending = Number(pendingRow?.count ?? 0)

  const evaluated = await query<{ id: string; student_id: string; student_name: string | null; score: number | null }>(
    `SELECT ce.id, ce.student_id, u.name AS student_name, ce.score
       FROM competition_entries ce
       JOIN users u ON u.id = ce.student_id
      WHERE ce.competition_id = $1
        AND ce.status IN ('evaluated', 'winner')
        AND ce.score IS NOT NULL
      ORDER BY ce.score DESC, ce.submitted_at ASC`,
    [competitionId],
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
 * Finalize a competition: persist the ranks computed from scores, mark the
 * winners, award points to the top finishers, and close the competition.
 * Idempotent on points (awardCompetitionRank guards against double-paying).
 */
export async function finalizeCompetitionResults(
  competitionId: string,
): Promise<{ success: boolean; error?: string; winners?: number; ranked?: number }> {
  try {
    const { ready, ranking } = await previewCompetitionResults(competitionId)
    if (!ready) {
      return { success: false, error: ((en.extracted_2026_v2 as any)?.["لا توجد مشاركات مُقيّمة لاعتماد نتائجها"] || "لا توجد مشاركات مُقيّمة لاعتماد نتائجها") }
    }

    const winnerRows = ranking.filter((r) => r.is_winner)
    const firstPlace = ranking.find((r) => r.rank === 1)

    // All the structural writes (rank reset, per-entry ranks, winner flags,
    // winner_id, closing the competition) happen in ONE transaction so a
    // crash or a concurrent double-submit can never leave the competition with
    // partially-written ranks/winners. Points are awarded afterwards because
    // they are independently idempotent and touch the global gamification
    // tables.
    await withTransaction(async (tx) => {
      // Reset any previous winner flags so re-finalizing reflects latest scores.
      await tx(
        `UPDATE competition_entries SET status = 'evaluated'
          WHERE competition_id = $1 AND status = 'winner'`,
        [competitionId],
      )

      // Persist every entry's computed rank.
      for (const row of ranking) {
        await tx(`UPDATE competition_entries SET rank = $1 WHERE id = $2`, [row.rank, row.entry_id])
      }

      // Flag winners (rank within topN).
      for (const row of winnerRows) {
        await tx(
          `UPDATE competition_entries SET status = 'winner'
            WHERE competition_id = $1 AND student_id = $2`,
          [competitionId, row.student_id],
        )
      }

      // Record the single headline winner (rank #1). If there is a tie for
      // first, the earliest submission (first in the ordered ranking) is used.
      if (firstPlace) {
        await tx(`UPDATE competitions SET winner_id = $1 WHERE id = $2`, [firstPlace.student_id, competitionId])
      }

      // Close the competition once results are official.
      await tx(`UPDATE competitions SET status = 'ended' WHERE id = $1`, [competitionId])
    })

    // Award points to top finishers (ranks 1-3). Safe to run post-commit:
    // awardCompetitionRank guards against double-paying on re-finalize.
    let winners = 0
    for (const row of winnerRows) {
      await awardCompetitionRank(competitionId, row.student_id, row.rank)
      winners++
    }

    return { success: true, winners, ranked: ranking.length }
  } catch (error) {
    console.error('Error finalizing competition results:', error)
    return { success: false, error: ((en.extracted_2026_v2 as any)?.["حدث خطأ أثناء اعتماد النتائج"] || "حدث خطأ أثناء اعتماد النتائج") }
  }
}
