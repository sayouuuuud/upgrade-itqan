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

export async function awardPoints(
  userId: string,
  points: number,
  action: PointsAction,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    // Get existing user points
    const existing = await queryOne<{ user_id: string; points: number }>(
      `SELECT * FROM user_points WHERE user_id = $1`,
      [userId]
    )

    const newTotal = (existing?.points || 0) + points

    if (existing) {
      await query(
        `UPDATE user_points SET points = $1, updated_at = NOW() WHERE user_id = $2`,
        [newTotal, userId]
      )
    } else {
      await query(
        `INSERT INTO user_points (user_id, points, created_at) VALUES ($1, $2, NOW())`,
        [userId, points]
      )
    }

    // Log the points transaction
    await query(
      `INSERT INTO points_log (user_id, points, action, metadata, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId, points, action, JSON.stringify(metadata || {})]
    )

    // Check and award badges
    await checkAndAwardBadges(userId, newTotal)
  } catch (error) {
    console.error('Error awarding points:', error)
    throw error
  }
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
    { task_id: taskId }
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
    { session_id: sessionId }
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
    { competition_id: competitionId, position }
  )
}

export async function checkAndAwardBadges(userId: string, totalPoints: number): Promise<void> {
  try {
    const badges = [
      { id: 'first_steps', threshold: 100, name: 'الخطوات الأولى', description: 'اجمع 100 نقطة' },
      { id: 'rising_star', threshold: 500, name: 'نجم صاعد', description: 'اجمع 500 نقطة' },
      { id: 'champion', threshold: 2000, name: 'بطل', description: 'اجمع 2000 نقطة' },
      { id: 'legend', threshold: 5000, name: 'أسطورة', description: 'اجمع 5000 نقطة' },
      { id: 'master', threshold: 10000, name: 'ماهر', description: 'اجمع 10000 نقطة' }
    ]

    // Check which badges the user should have
    const eligibleBadges = badges.filter(b => totalPoints >= b.threshold)

    // Get existing badges
    const existingBadges = await query<{ badge_id: string }>(
      `SELECT badge_id FROM badges WHERE user_id = $1`,
      [userId]
    )

    const existingIds = new Set(existingBadges.map(b => b.badge_id))

    // Award new badges
    for (const badge of eligibleBadges) {
      if (!existingIds.has(badge.id)) {
        try {
          await query(
            `INSERT INTO badges (user_id, badge_id, badge_name, badge_description, earned_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [userId, badge.id, badge.name, badge.description]
          )

          // Award badge earned points
          await awardPoints(userId, pointsConfig.badge_earned, 'badge_earned', { badge_id: badge.id })
        } catch (e) {
          // Ignore if already exists
          console.debug('Badge already exists:', badge.id)
        }
      }
    }
  } catch (error) {
    console.error('Error checking and awarding badges:', error)
  }
}

export async function getStreakBonus(userId: string): Promise<number> {
  try {
    // Get memorization logs from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const logs = await query<{ created_at: string }>(
      `SELECT created_at FROM memorization_log
       WHERE user_id = $1 AND created_at >= $2
       ORDER BY created_at DESC`,
      [userId, thirtyDaysAgo.toISOString()]
    )

    if (!logs || logs.length === 0) return 0

    // Count consecutive days
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    const logDates = new Set(
      logs.map(log => {
        const d = new Date(log.created_at)
        d.setHours(0, 0, 0, 0)
        return d.getTime()
      })
    )

    // Count backwards from today
    while (logDates.has(currentDate.getTime())) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    }

    // Award streak bonuses
    if (streak === 30) {
      return pointsConfig.streak_bonus_30days
    } else if (streak === 7) {
      return pointsConfig.streak_bonus_7days
    } else if (streak === 3) {
      return pointsConfig.streak_bonus_3days
    }

    return 0
  } catch (error) {
    console.error('Error calculating streak bonus:', error)
    return 0
  }
}
