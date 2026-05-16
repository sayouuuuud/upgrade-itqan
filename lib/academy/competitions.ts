import { query, queryOne } from '@/lib/db'

export async function getCompetitions(filters: { status?: string; type?: string; userId?: string } = {}) {
  let sql = `SELECT * FROM competitions WHERE 1=1`
  const params: any[] = []
  
  if (filters.status) {
    params.push(filters.status)
    sql += ` AND status = $${params.length}`
  }
  if (filters.type) {
    params.push(filters.type)
    sql += ` AND type = $${params.length}`
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
      has_entered: enteredIds.has(c.id)
    }))
  }
  
  return competitions
}

export async function getStudentEntries(studentId: string) {
  return query(`
    SELECT ce.*, c.title as competition_title, c.type as competition_type
    FROM competition_entries ce
    JOIN competitions c ON c.id = ce.competition_id
    WHERE ce.student_id = $1
    ORDER BY ce.submitted_at DESC
  `, [studentId])
}

export async function getEntries(competitionId: string) {
  return query(`
    SELECT ce.*, u.full_name as student_name
    FROM competition_entries ce
    JOIN users u ON u.id = ce.student_id
    WHERE ce.competition_id = $1
    ORDER BY ce.submitted_at DESC
  `, [competitionId])
}

export async function getCompetition(id: string) {
  return queryOne(`SELECT * FROM competitions WHERE id = $1`, [id])
}

export async function joinCompetition(competitionId: string, studentId: string) {
  return query(`
    INSERT INTO competition_entries (competition_id, student_id, status, submitted_at)
    VALUES ($1, $2, 'pending', NOW())
    ON CONFLICT (competition_id, student_id) DO NOTHING
    RETURNING *
  `, [competitionId, studentId])
}

export async function submitEntry(competitionId: string, studentId: string, content: any) {
  return query(`
    UPDATE competition_entries
    SET content = $3, status = 'pending', submitted_at = NOW()
    WHERE competition_id = $1 AND student_id = $2
    RETURNING *
  `, [competitionId, studentId, JSON.stringify(content)])
}

export async function getJudgeAssignments(judgeId: string) {
  return query(`
    SELECT c.* 
    FROM competitions c
    JOIN competition_judges cj ON cj.competition_id = c.id
    WHERE cj.judge_id = $1
    ORDER BY c.start_date DESC
  `, [judgeId])
}

export async function evaluateEntry(entryId: string, judgeId: string, evaluation: { score: number; tajweedScores: any; feedback: string | null }) {
  try {
    const entry = await queryOne<{ competition_id: string }>(
      `SELECT competition_id FROM competition_entries WHERE id = $1`,
      [entryId]
    )
    if (!entry) return { success: false, error: 'Entry not found' }

    // Check if the judge is assigned to this competition
    const isJudge = await queryOne(
      `SELECT 1 FROM competition_judges WHERE competition_id = $1 AND judge_id = $2`,
      [entry.competition_id, judgeId]
    )
    
    // Also allow admins/academy_admins
    const user = await queryOne<{ role: string }>(`SELECT role FROM users WHERE id = $1`, [judgeId])
    const isAdmin = user && ['admin', 'academy_admin'].includes(user.role)
    
    if (!isJudge && !isAdmin) {
      return { success: false, error: 'Unauthorized judge' }
    }

    await query(
      `UPDATE competition_entries
       SET score = $1, tajweed_scores = $2, feedback = $3, status = 'evaluated', evaluated_at = NOW(), evaluated_by = $4
       WHERE id = $5`,
      [evaluation.score, JSON.stringify(evaluation.tajweedScores), evaluation.feedback, judgeId, entryId]
    )
    
    return { success: true }
  } catch (error) {
    console.error('Error evaluating entry:', error)
    return { success: false, error: 'Internal server error' }
  }
}

export async function awardCompetitionWinner(competitionId: string, studentId: string) {
  try {
    await query(
      `UPDATE competitions SET winner_id = $1, status = 'completed' WHERE id = $2`,
      [studentId, competitionId]
    )
    await query(
      `UPDATE competition_entries SET status = 'winner' WHERE competition_id = $1 AND student_id = $2`,
      [competitionId, studentId]
    )
    return { success: true }
  } catch (error) {
    console.error('Error awarding winner:', error)
    return { success: false, error: 'Internal server error' }
  }
}
