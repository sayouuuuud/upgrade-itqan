import { query, queryOne } from '@/lib/db'

export interface FiqhOfficer {
  officer_id: string
  user_id: string
  user_name: string
  user_email: string
  open_count: number
}

/**
 * Pick the active officer for a given category with the smallest open queue.
 * Returns null if no officer is registered for the category.
 */
export async function pickOfficerForCategory(
  categoryId: string
): Promise<FiqhOfficer | null> {
  const rows = await query<FiqhOfficer>(
    `SELECT
        o.id  AS officer_id,
        o.user_id,
        u.name  AS user_name,
        u.email AS user_email,
        COALESCE((
          SELECT COUNT(*)::int
          FROM fiqh_questions q
          WHERE q.assigned_to = o.user_id
            AND q.status IN ('assigned','in_progress','answered','awaiting_consent')
        ), 0) AS open_count
      FROM fiqh_officers o
      JOIN fiqh_officer_categories oc ON oc.officer_id = o.id
      JOIN users u                    ON u.id = o.user_id
      WHERE o.is_active = TRUE
        AND oc.category_id = $1
      ORDER BY open_count ASC, o.created_at ASC
      LIMIT 1`,
    [categoryId]
  )
  return rows[0] ?? null
}

/**
 * Returns true if userId is an active fiqh officer.
 */
export async function isOfficer(userId: string): Promise<boolean> {
  const r = await queryOne<{ id: string }>(
    `SELECT id FROM fiqh_officers WHERE user_id = $1 AND is_active = TRUE LIMIT 1`,
    [userId]
  )
  return !!r
}

/**
 * Returns true if userId may access the question (asker, assigned officer, or admin).
 */
export async function canAccessQuestion(
  userId: string,
  role: string,
  questionId: string
): Promise<{ allowed: boolean; perspective: 'asker' | 'officer' | 'admin' | null }> {
  if (role === 'admin' || role === 'academy_admin') {
    return { allowed: true, perspective: 'admin' }
  }
  const q = await queryOne<{ asked_by: string; assigned_to: string | null }>(
    `SELECT asked_by, assigned_to FROM fiqh_questions WHERE id = $1 LIMIT 1`,
    [questionId]
  )
  if (!q) return { allowed: false, perspective: null }
  if (q.asked_by === userId) return { allowed: true, perspective: 'asker' }
  if (q.assigned_to === userId) return { allowed: true, perspective: 'officer' }
  return { allowed: false, perspective: null }
}
