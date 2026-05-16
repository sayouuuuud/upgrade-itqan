import { query, queryOne } from '@/lib/db'
import { PointsAction, MemorizationQuality } from '@/lib/types'

export interface PointsConfig {
  task_complete: number
  memorization_excellent: number
  memorization_good: number
  memorization_acceptable: number
  attendance: number
  competition_win: number
  competition_second: number
  competition_third: number
  streak_bonus_3days: number
  streak_bonus_7days: number
  streak_bonus_30days: number
  forum_answer: number
  badge_earned: number
}

const pointsConfig: PointsConfig = {
  task_complete: 50,
  memorization_excellent: 100,
  memorization_good: 75,
  memorization_acceptable: 50,
  attendance: 20,
  competition_win: 500,
  competition_second: 300,
  competition_third: 150,
  streak_bonus_3days: 100,
  streak_bonus_7days: 200,
  streak_bonus_30days: 500,
  forum_answer: 25,
  badge_earned: 100
}

export const POINTS = pointsConfig

export const LEVELS = [
  { key: 'beginner', label: 'مبتدئ', min: 0 },
  { key: 'intermediate', label: 'متوسط', min: 500 },
  { key: 'advanced', label: 'متقدم', min: 2000 },
  { key: 'hafiz', label: 'حافظ', min: 5000 },
  { key: 'master', label: 'خاتم', min: 10000 },
]

export function levelForPoints(points: number): string {
  let level = 'beginner'
  for (const l of LEVELS) {
    if (points >= l.min) level = l.key
  }
  return level
}

export async function awardPoints(
  userId: string,
  points: number,
  reason: PointsAction,
  metadata?: {
    description?: string
    admin_id?: string
    type?: string
  }
): Promise<{ success: boolean; total_points: number; badge_earned?: string }> {
  try {
    const existing = await queryOne<{ total_points: number }>(
      `SELECT total_points FROM user_points WHERE user_id = $1`,
      [userId]
    )

    const newTotal = (existing?.total_points || 0) + points
    const level = levelForPoints(newTotal)

    if (existing) {
      await query(
        `UPDATE user_points SET total_points = $1, level = $2, updated_at = NOW() WHERE user_id = $3`,
        [newTotal, level, userId]
      )
    } else {
      await query(
        `INSERT INTO user_points (user_id, total_points, level, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [userId, newTotal, level]
      )
    }

    await query(
      `INSERT INTO points_log (user_id, points, reason, description, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId, points, reason, metadata?.description || '']
    )

    return { success: true, total_points: newTotal }
  } catch (error) {
    console.error('Error awarding points:', error)
    throw error
  }
}

export async function adminAdjustPoints(userId: string, points: number, description: string, adminId: string) {
  return awardPoints(userId, points, 'manual', {
    description,
    admin_id: adminId,
    type: 'manual_adjustment'
  })
}

export async function awardMemorizationPoints(
  userId: string,
  quality: MemorizationQuality,
  metadata?: Record<string, any>
): Promise<void> {
  const pointsMap = {
    excellent: pointsConfig.memorization_excellent,
    good: pointsConfig.memorization_good,
    acceptable: pointsConfig.memorization_acceptable,
    needs_review: 0
  }

  await awardPoints(userId, pointsMap[quality], 'memorization', metadata)
}

export async function awardTaskCompletePoints(
  userId: string,
  taskId: string
): Promise<void> {
  await awardPoints(
    userId,
    pointsConfig.task_complete,
    'task_complete',
    { description: `إكمال مهمة: ${taskId}` }
  )
}

export async function awardAttendancePoints(
  userId: string,
  sessionId: string
): Promise<void> {
  await awardPoints(
    userId,
    pointsConfig.attendance,
    'attendance',
    { description: `حضور جلسة: ${sessionId}` }
  )
}

export async function awardCompetitionPoints(
  userId: string,
  position: 1 | 2 | 3,
  competitionId: string
): Promise<void> {
  const pointsMap = {
    1: pointsConfig.competition_win,
    2: pointsConfig.competition_second,
    3: pointsConfig.competition_third
  }

  await awardPoints(
    userId,
    pointsMap[position],
    'competition_win',
    { description: `فوز في مسابقة: ${competitionId} المركز ${position}` }
  )
}
