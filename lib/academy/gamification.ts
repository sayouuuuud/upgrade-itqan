/**
 * Academy Gamification helpers — Phase 5
 *
 * Centralised, schema-aware utilities for awarding points, recomputing
 * streaks, and unlocking badges.
 *
 * IMPORTANT: this file is the single source of truth for the actual
 * shape of the `user_points`, `points_log`, and `badges` tables in the
 * production database. The older `lib/academy/points.ts` was written
 * against a different (incorrect) schema and is being deprecated.
 *
 * Tables (see scripts/011-academy-expansion.sql + 015-features-and-enhancements.sql):
 *   - user_points(user_id, total_points, level, streak_days, longest_streak,
 *                 last_activity_date, total_verses_memorized, total_verses_revised, ...)
 *   - points_log (user_id, points, reason, description, related_entity_type, related_entity_id, created_at)
 *       reason ∈ ('recitation','mastered','task','lesson','streak','juz_complete',
 *                 'course_complete','session_attend','daily_login','competition_win','badge_earned')
 *   - badges (user_id, badge_type, badge_name, badge_description, badge_icon_url,
 *             points_awarded, awarded_at) UNIQUE(user_id, badge_type)
 *       badge_type ∈ ('first_recitation','week_streak','month_streak','hafiz_juz_amma',
 *                     'hundred_recitations','tajweed_master','ramadan_badge','full_quran',
 *                     'star_of_halaqah','first_course','five_courses','ten_courses',
 *                     'first_task','task_master','early_bird','night_owl','helper')
 */

import { query, queryOne } from '@/lib/db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PointsReason =
  | 'recitation'
  | 'mastered'
  | 'task'
  | 'lesson'
  | 'streak'
  | 'juz_complete'
  | 'course_complete'
  | 'session_attend'
  | 'daily_login'
  | 'competition_win'
  | 'badge_earned'

export type AcademyLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'hafiz'
  | 'master'

export type BadgeType =
  | 'first_recitation'
  | 'week_streak'
  | 'month_streak'
  | 'hafiz_juz_amma'
  | 'hundred_recitations'
  | 'tajweed_master'
  | 'ramadan_badge'
  | 'full_quran'
  | 'star_of_halaqah'
  | 'first_course'
  | 'five_courses'
  | 'ten_courses'
  | 'first_task'
  | 'task_master'
  | 'early_bird'
  | 'night_owl'
  | 'helper'

export interface AwardOptions {
  description?: string
  relatedEntityType?: string
  relatedEntityId?: string
}

// ---------------------------------------------------------------------------
// Static catalogue of badges (Arabic). This mirrors the seed data in
// scripts/015-features-and-enhancements.sql / badge_definitions, but is
// kept in code so the API works even if that table hasn't been populated.
// ---------------------------------------------------------------------------

export interface BadgeDefinition {
  badge_type: BadgeType
  name: string
  description: string
  category: string
  criteria_type: 'points' | 'streak' | 'courses' | 'tasks' | 'memorization' | 'recitation' | 'custom'
  criteria_value?: number
  points_reward: number
}

export const BADGE_CATALOGUE: BadgeDefinition[] = [
  // التلاوة
  { badge_type: 'first_recitation',    name: 'أول تلاوة',    description: 'سجلت أول تلاوة لك في المنصة', category: 'التلاوة',  criteria_type: 'recitation',   criteria_value: 1,   points_reward: 10 },
  { badge_type: 'hundred_recitations', name: '100 تلاوة',    description: 'سجلت 100 تلاوة',                 category: 'التلاوة',  criteria_type: 'recitation',   criteria_value: 100, points_reward: 100 },
  { badge_type: 'tajweed_master',      name: 'متقن التجويد', description: 'حصلت على ممتاز في 10 تلاوات متتالية', category: 'التلاوة',  criteria_type: 'recitation', criteria_value: 10,  points_reward: 150 },

  // المثابرة
  { badge_type: 'week_streak',         name: 'أسبوع متواصل', description: 'حافظت على نشاطك لمدة 7 أيام', category: 'المثابرة', criteria_type: 'streak', criteria_value: 7,  points_reward: 25 },
  { badge_type: 'month_streak',        name: 'شهر متواصل',   description: 'حافظت على نشاطك لمدة 30 يوماً', category: 'المثابرة', criteria_type: 'streak', criteria_value: 30, points_reward: 100 },
  { badge_type: 'ramadan_badge',       name: 'مجاهد رمضان',  description: 'أكملت تحدي رمضان',              category: 'المثابرة', criteria_type: 'streak', criteria_value: 30, points_reward: 200 },

  // الحفظ
  { badge_type: 'hafiz_juz_amma', name: 'حافظ جزء عمّ', description: 'حفظت جزء عمّ كاملاً',          category: 'الحفظ', criteria_type: 'memorization', criteria_value: 1,  points_reward: 150 },
  { badge_type: 'full_quran',     name: 'حافظ القرآن',  description: 'أكملت حفظ القرآن الكريم',     category: 'الحفظ', criteria_type: 'memorization', criteria_value: 30, points_reward: 1000 },

  // الدورات
  { badge_type: 'first_course',  name: 'أول دورة', description: 'أكملت أول دورة لك',  category: 'الدورات', criteria_type: 'courses', criteria_value: 1,  points_reward: 50 },
  { badge_type: 'five_courses',  name: '5 دورات',  description: 'أكملت 5 دورات',     category: 'الدورات', criteria_type: 'courses', criteria_value: 5,  points_reward: 200 },
  { badge_type: 'ten_courses',   name: '10 دورات', description: 'أكملت 10 دورات',    category: 'الدورات', criteria_type: 'courses', criteria_value: 10, points_reward: 500 },

  // المهام
  { badge_type: 'first_task',  name: 'أول مهمة',   description: 'أنجزت أول مهمة', category: 'المهام', criteria_type: 'tasks', criteria_value: 1,  points_reward: 15 },
  { badge_type: 'task_master', name: 'سيد المهام', description: 'أنجزت 50 مهمة',  category: 'المهام', criteria_type: 'tasks', criteria_value: 50, points_reward: 250 },

  // تكريم
  { badge_type: 'star_of_halaqah', name: 'نجم الحلقة', description: 'كنت الأفضل في حلقتك هذا الأسبوع', category: 'تكريم', criteria_type: 'custom', points_reward: 100 },
  { badge_type: 'helper',          name: 'المُعين',    description: 'ساعدت زملاءك في المنتدى',         category: 'تكريم', criteria_type: 'custom', points_reward: 50 },
  { badge_type: 'early_bird',      name: 'الباكر',     description: 'دخلت المنصة قبل الفجر 7 أيام',    category: 'تكريم', criteria_type: 'custom', criteria_value: 7, points_reward: 50 },
  { badge_type: 'night_owl',       name: 'الساهر',     description: 'تلوت بعد منتصف الليل 7 ليالي',   category: 'تكريم', criteria_type: 'custom', criteria_value: 7, points_reward: 50 },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LEVEL_THRESHOLDS: { level: AcademyLevel; min: number }[] = [
  { level: 'beginner',     min: 0 },
  { level: 'intermediate', min: 100 },
  { level: 'advanced',     min: 500 },
  { level: 'hafiz',        min: 2000 },
  { level: 'master',       min: 5000 },
]

export function computeLevel(totalPoints: number): AcademyLevel {
  let level: AcademyLevel = 'beginner'
  for (const t of LEVEL_THRESHOLDS) {
    if (totalPoints >= t.min) level = t.level
  }
  return level
}

export function levelProgress(totalPoints: number): {
  level: AcademyLevel
  next: AcademyLevel | null
  current_floor: number
  next_floor: number | null
  percent: number
} {
  const level = computeLevel(totalPoints)
  const idx = LEVEL_THRESHOLDS.findIndex(l => l.level === level)
  const current_floor = LEVEL_THRESHOLDS[idx].min
  const nextLevel = LEVEL_THRESHOLDS[idx + 1] || null
  const next_floor = nextLevel?.min ?? null
  const percent = next_floor
    ? Math.min(100, Math.round(((totalPoints - current_floor) / (next_floor - current_floor)) * 100))
    : 100
  return {
    level,
    next: nextLevel?.level ?? null,
    current_floor,
    next_floor,
    percent,
  }
}

// ---------------------------------------------------------------------------
// Core: award points + log + recompute streak/level + auto-award badges
// ---------------------------------------------------------------------------

interface UserPointsRow {
  user_id: string
  total_points: number
  level: AcademyLevel
  streak_days: number
  longest_streak: number
  last_activity_date: string | null
}

async function ensureUserPoints(userId: string): Promise<UserPointsRow> {
  const existing = await queryOne<UserPointsRow>(
    `SELECT user_id, total_points, level, streak_days, longest_streak,
            to_char(last_activity_date, 'YYYY-MM-DD') AS last_activity_date
       FROM user_points WHERE user_id = $1`,
    [userId]
  )
  if (existing) return existing

  await query(
    `INSERT INTO user_points (user_id, total_points, level, streak_days, longest_streak)
     VALUES ($1, 0, 'beginner', 0, 0)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  )

  return {
    user_id: userId,
    total_points: 0,
    level: 'beginner',
    streak_days: 0,
    longest_streak: 0,
    last_activity_date: null,
  }
}

function bumpStreak(prev: { streak_days: number; longest_streak: number; last_activity_date: string | null }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const todayStr = today.toISOString().slice(0, 10)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)
  const lastStr = prev.last_activity_date

  let streak = prev.streak_days || 0
  if (lastStr === todayStr) {
    // Already counted today.
  } else if (lastStr === yesterdayStr) {
    streak += 1
  } else {
    streak = 1
  }
  const longest = Math.max(prev.longest_streak || 0, streak)
  return { streak, longest, today: todayStr }
}

/**
 * Award points to a user. This is the single entry point for any feature
 * that gives points — it logs the transaction, recomputes the streak,
 * recomputes the level, and triggers badge unlocks.
 */
export async function awardPoints(
  userId: string,
  points: number,
  reason: PointsReason,
  options: AwardOptions = {}
): Promise<{ total_points: number; level: AcademyLevel; new_badges: BadgeType[] }> {
  if (!userId || !Number.isFinite(points) || points === 0) {
    const u = await getUserPointsSummary(userId)
    return { total_points: u.total_points, level: u.level, new_badges: [] }
  }

  const prev = await ensureUserPoints(userId)
  const { streak, longest, today } = bumpStreak(prev)
  const newTotal = (prev.total_points || 0) + points
  const newLevel = computeLevel(newTotal)

  await query(
    `UPDATE user_points
        SET total_points        = $2,
            level               = $3,
            streak_days         = $4,
            longest_streak      = $5,
            last_activity_date  = $6,
            updated_at          = NOW()
      WHERE user_id = $1`,
    [userId, newTotal, newLevel, streak, longest, today]
  )

  await query(
    `INSERT INTO points_log (user_id, points, reason, description, related_entity_type, related_entity_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      userId,
      points,
      reason,
      options.description ?? null,
      options.relatedEntityType ?? null,
      options.relatedEntityId ?? null,
    ]
  )

  const new_badges = await checkAndAwardBadges(userId)
  return { total_points: newTotal, level: newLevel, new_badges }
}

// ---------------------------------------------------------------------------
// Badge unlocking
// ---------------------------------------------------------------------------

interface BadgeStatsRow {
  total_points: number
  streak_days: number
  task_count: number
  course_count: number
}

async function fetchBadgeStats(userId: string): Promise<BadgeStatsRow> {
  const row = await queryOne<BadgeStatsRow>(
    `
    SELECT
      COALESCE(up.total_points, 0)::int                         AS total_points,
      COALESCE(up.streak_days, 0)::int                          AS streak_days,
      (SELECT COUNT(*)::int FROM task_submissions ts
         WHERE ts.student_id = $1 AND ts.status = 'graded')     AS task_count,
      (SELECT COUNT(*)::int FROM enrollments e
         WHERE e.student_id = $1 AND e.status = 'completed')    AS course_count
    FROM (SELECT 1) _
    LEFT JOIN user_points up ON up.user_id = $1
    `,
    [userId]
  )
  return row || { total_points: 0, streak_days: 0, task_count: 0, course_count: 0 }
}

async function getEarnedBadgeTypes(userId: string): Promise<Set<BadgeType>> {
  const rows = await query<{ badge_type: BadgeType }>(
    `SELECT badge_type FROM badges WHERE user_id = $1`,
    [userId]
  )
  return new Set(rows.map(r => r.badge_type))
}

async function insertBadge(userId: string, def: BadgeDefinition): Promise<boolean> {
  try {
    const res = await query(
      `INSERT INTO badges (user_id, badge_type, badge_name, badge_description, points_awarded, awarded_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, badge_type) DO NOTHING
       RETURNING id`,
      [userId, def.badge_type, def.name, def.description, def.points_reward]
    )
    return res.length > 0
  } catch (e) {
    console.error('[gamification] insertBadge failed:', def.badge_type, e)
    return false
  }
}

/**
 * Look at the user's stats and unlock any new badges they qualify for.
 * Returns the badge types that were newly unlocked in THIS call.
 */
export async function checkAndAwardBadges(userId: string): Promise<BadgeType[]> {
  if (!userId) return []
  const [stats, earned] = await Promise.all([
    fetchBadgeStats(userId),
    getEarnedBadgeTypes(userId),
  ])

  const unlocked: BadgeDefinition[] = []
  for (const def of BADGE_CATALOGUE) {
    if (earned.has(def.badge_type)) continue

    let qualifies = false
    if (def.criteria_type === 'tasks' && def.criteria_value != null) {
      qualifies = stats.task_count >= def.criteria_value
    } else if (def.criteria_type === 'courses' && def.criteria_value != null) {
      qualifies = stats.course_count >= def.criteria_value
    } else if (def.criteria_type === 'streak' && def.criteria_value != null) {
      qualifies = stats.streak_days >= def.criteria_value
    } else if (def.criteria_type === 'points' && def.criteria_value != null) {
      qualifies = stats.total_points >= def.criteria_value
    }
    // Custom / recitation / memorization badges are not auto-unlocked here.

    if (qualifies) unlocked.push(def)
  }

  const inserted: BadgeType[] = []
  for (const def of unlocked) {
    const added = await insertBadge(userId, def)
    if (!added) continue
    inserted.push(def.badge_type)

    // Reward points for unlocking the badge — but DO NOT recurse into
    // checkAndAwardBadges (we'd loop forever). Inline the points + log.
    if (def.points_reward > 0) {
      await query(
        `UPDATE user_points
            SET total_points = total_points + $2,
                level        = $3,
                updated_at   = NOW()
          WHERE user_id = $1`,
        [userId, def.points_reward, computeLevel(stats.total_points + def.points_reward)]
      )
      await query(
        `INSERT INTO points_log (user_id, points, reason, description, related_entity_type, related_entity_id)
         VALUES ($1, $2, 'badge_earned', $3, 'badge', NULL)`,
        [userId, def.points_reward, `مكافأة شارة: ${def.name}`]
      )
      stats.total_points += def.points_reward
    }
  }

  return inserted
}

// ---------------------------------------------------------------------------
// Read helpers (used by the points API + badges API)
// ---------------------------------------------------------------------------

export interface UserPointsSummary {
  user_id: string
  total_points: number
  level: AcademyLevel
  streak_days: number
  longest_streak: number
  last_activity_date: string | null
  level_progress: ReturnType<typeof levelProgress>
  badges_earned: number
}

export async function getUserPointsSummary(userId: string): Promise<UserPointsSummary> {
  const points = await ensureUserPoints(userId)
  const badgesCount = await queryOne<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM badges WHERE user_id = $1`,
    [userId]
  )
  return {
    user_id: points.user_id,
    total_points: points.total_points || 0,
    level: points.level || 'beginner',
    streak_days: points.streak_days || 0,
    longest_streak: points.longest_streak || 0,
    last_activity_date: points.last_activity_date,
    level_progress: levelProgress(points.total_points || 0),
    badges_earned: badgesCount?.c ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Convenience wrappers (so callers don't have to remember the right reason
// string and metadata shape)
// ---------------------------------------------------------------------------

export const awardTaskPoints = (userId: string, points: number, taskId: string, taskTitle?: string) =>
  awardPoints(userId, points, 'task', {
    description: taskTitle ? `إنجاز مهمة: ${taskTitle}` : 'إنجاز مهمة',
    relatedEntityType: 'task',
    relatedEntityId: taskId,
  })

export const awardSessionAttendancePoints = (userId: string, sessionId: string, sessionTitle?: string) =>
  awardPoints(userId, 20, 'session_attend', {
    description: sessionTitle ? `حضور جلسة: ${sessionTitle}` : 'حضور جلسة',
    relatedEntityType: 'session',
    relatedEntityId: sessionId,
  })

export const awardLessonPoints = (userId: string, lessonId: string, lessonTitle?: string) =>
  awardPoints(userId, 10, 'lesson', {
    description: lessonTitle ? `إكمال درس: ${lessonTitle}` : 'إكمال درس',
    relatedEntityType: 'lesson',
    relatedEntityId: lessonId,
  })

export const awardDailyLoginPoints = (userId: string) =>
  awardPoints(userId, 5, 'daily_login', { description: 'دخول يومي للمنصة' })

export const awardCourseCompletePoints = (userId: string, courseId: string, courseTitle?: string) =>
  awardPoints(userId, 100, 'course_complete', {
    description: courseTitle ? `إكمال دورة: ${courseTitle}` : 'إكمال دورة',
    relatedEntityType: 'course',
    relatedEntityId: courseId,
  })
