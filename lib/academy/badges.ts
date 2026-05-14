import { query, queryOne } from '@/lib/db'

// ── Types ──

export interface BadgeDefinition {
  id: string
  badge_key: string
  badge_name: string
  badge_description: string | null
  badge_icon: string
  badge_image_url: string | null
  badge_color: string
  points_awarded: number
  criteria_type: string
  criteria_value: number
  is_active: boolean
  display_order: number
  category: string
}

export interface EarnedBadge {
  id: string
  badge_key: string
  badge_name: string
  badge_description: string | null
  badge_icon: string
  badge_image_url: string | null
  badge_color: string
  points_awarded: number
  awarded_at: string
  category: string
}

// ── Get all badge definitions ──

export async function getAllBadgeDefinitions(): Promise<BadgeDefinition[]> {
  return query<BadgeDefinition>(
    `SELECT * FROM badge_definitions WHERE is_active = true ORDER BY display_order, created_at`,
  )
}

// ── Get user's earned badges ──

export async function getUserBadges(userId: string): Promise<EarnedBadge[]> {
  return query<EarnedBadge>(
    `SELECT b.id, b.badge_key, b.badge_name, b.badge_description,
            COALESCE(bd.badge_icon, '🏆') as badge_icon,
            bd.badge_image_url,
            COALESCE(bd.badge_color, '#F59E0B') as badge_color,
            COALESCE(b.points_awarded, bd.points_awarded, 0) as points_awarded,
            b.awarded_at,
            COALESCE(bd.category, 'achievement') as category
     FROM badges b
     LEFT JOIN badge_definitions bd ON bd.badge_key = b.badge_key
     WHERE b.user_id = $1
     ORDER BY b.awarded_at DESC`,
    [userId],
  )
}

// ── Award a specific badge ──

export async function awardBadge(
  userId: string,
  badgeKey: string,
): Promise<boolean> {
  // Check if already earned
  const existing = await queryOne(
    `SELECT id FROM badges WHERE user_id = $1 AND badge_key = $2`,
    [userId, badgeKey],
  )
  if (existing) return false

  // Get badge definition
  const def = await queryOne<BadgeDefinition>(
    `SELECT * FROM badge_definitions WHERE badge_key = $1 AND is_active = true`,
    [badgeKey],
  )
  if (!def) return false

  // Insert badge
  await query(
    `INSERT INTO badges (user_id, badge_key, badge_type, badge_name, badge_description,
     badge_icon_url, points_awarded, badge_definition_id, awarded_at)
     VALUES ($1, $2, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (user_id, badge_key) DO NOTHING`,
    [userId, badgeKey, def.badge_name, def.badge_description, def.badge_image_url, def.points_awarded, def.id],
  )

  // Award points for the badge
  if (def.points_awarded > 0) {
    await query(
      `INSERT INTO points_log (user_id, points, reason, description)
       VALUES ($1, $2, 'badge_earned', $3)`,
      [userId, def.points_awarded, `شارة: ${def.badge_name}`],
    )
    await query(
      `UPDATE user_points SET total_points = total_points + $1, updated_at = NOW() WHERE user_id = $2`,
      [def.points_awarded, userId],
    )
  }

  return true
}

// ── Check and auto-award badges based on criteria ──

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const awarded: string[] = []

  // Get all active badge definitions
  const definitions = await getAllBadgeDefinitions()

  // Get already earned badge keys
  const earned = await query<{ badge_key: string }>(
    `SELECT badge_key FROM badges WHERE user_id = $1`,
    [userId],
  )
  const earnedKeys = new Set(earned.map(b => b.badge_key))

  for (const def of definitions) {
    if (earnedKeys.has(def.badge_key)) continue

    const eligible = await checkBadgeCriteria(userId, def)
    if (eligible) {
      const didAward = await awardBadge(userId, def.badge_key)
      if (didAward) awarded.push(def.badge_key)
    }
  }

  return awarded
}

// ── Check individual badge criteria ──

async function checkBadgeCriteria(userId: string, def: BadgeDefinition): Promise<boolean> {
  switch (def.criteria_type) {
    case 'recitation_count': {
      // Number of recitations submitted
      const row = await queryOne<{ cnt: number }>(
        `SELECT COUNT(*)::int as cnt FROM recitations WHERE student_id = $1`,
        [userId],
      )
      return (row?.cnt ?? 0) >= def.criteria_value
    }

    case 'recitation_total': {
      // Total recitations (same as recitation_count but higher threshold)
      const row = await queryOne<{ cnt: number }>(
        `SELECT COUNT(*)::int as cnt FROM recitations WHERE student_id = $1`,
        [userId],
      )
      return (row?.cnt ?? 0) >= def.criteria_value
    }

    case 'streak_days': {
      // Current or longest streak
      const row = await queryOne<{ streak_days: number; longest_streak: number }>(
        `SELECT COALESCE(streak_days, 0) as streak_days, COALESCE(longest_streak, 0) as longest_streak
         FROM user_points WHERE user_id = $1`,
        [userId],
      )
      return (row?.streak_days ?? 0) >= def.criteria_value || (row?.longest_streak ?? 0) >= def.criteria_value
    }

    case 'juz_memorized': {
      // Check if specific juz is fully memorized (juz 30 for juz_amma)
      // We check if the student has mastered recitations covering juz amma surahs
      const row = await queryOne<{ cnt: number }>(
        `SELECT COUNT(DISTINCT surah_number)::int as cnt
         FROM memorization_log
         WHERE student_id = $1 AND juz_number = $2 AND new_verses > 0`,
        [userId, def.criteria_value],
      )
      // Juz 30 has 37 surahs (78-114)
      const requiredSurahs = def.criteria_value === 30 ? 37 : 10
      return (row?.cnt ?? 0) >= requiredSurahs
    }

    case 'tajweed_path': {
      // Check if student completed tajweed learning path
      const row = await queryOne<{ cnt: number }>(
        `SELECT COUNT(*)::int as cnt FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         LEFT JOIN learning_path_courses lpc ON lpc.course_id = c.id
         LEFT JOIN learning_paths lp ON lp.id = lpc.path_id
         WHERE e.student_id = $1 AND e.status = 'completed'
           AND (COALESCE(lp.title, '') ILIKE '%تجويد%' OR c.title ILIKE '%تجويد%')`,
        [userId],
      )
      return (row?.cnt ?? 0) >= def.criteria_value
    }

    case 'ramadan': {
      // Check if student logged recitation every day during Ramadan
      // This is a special check — we look at consecutive days in Ramadan
      const row = await queryOne<{ cnt: number }>(
        `SELECT COUNT(DISTINCT DATE(created_at))::int as cnt
         FROM recitations
         WHERE student_id = $1
           AND EXTRACT(MONTH FROM created_at) IN (3, 4)
           AND created_at >= (DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year')`,
        [userId],
      )
      return (row?.cnt ?? 0) >= def.criteria_value
    }

    case 'quran_complete': {
      // Check total verses memorized (6236 total in Quran)
      const row = await queryOne<{ total: number }>(
        `SELECT COALESCE(total_verses_memorized, 0)::int as total
         FROM user_points WHERE user_id = $1`,
        [userId],
      )
      return (row?.total ?? 0) >= 6236
    }

    case 'top_student': {
      // This is manually awarded or checked via cron — skip auto-check
      return false
    }

    case 'points_threshold': {
      const row = await queryOne<{ total_points: number }>(
        `SELECT COALESCE(total_points, 0) as total_points FROM user_points WHERE user_id = $1`,
        [userId],
      )
      return (row?.total_points ?? 0) >= def.criteria_value
    }

    case 'manual': {
      // Manual badges are only awarded by admin
      return false
    }

    default:
      return false
  }
}

// ── Admin: Manually award badge to a student ──

export async function adminAwardBadge(userId: string, badgeKey: string): Promise<boolean> {
  return awardBadge(userId, badgeKey)
}

// ── Admin: Revoke badge from a student ──

export async function adminRevokeBadge(userId: string, badgeKey: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM badges WHERE user_id = $1 AND badge_key = $2 RETURNING id`,
    [userId, badgeKey],
  )
  return result.length > 0
}
