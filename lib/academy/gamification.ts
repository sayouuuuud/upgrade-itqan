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

export type BadgeType = string

export interface AwardOptions {
  description?: string
  relatedEntityType?: string
  relatedEntityId?: string
  applyStreakMultiplier?: boolean
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
  icon?: string | null
}

export const POINTS_RULES = {
  recitation: 10,
  mastered: 30,
  task: 15,
  session_attend: 20,
  streak: 5,
  juz_complete: 100,
} as const

export const BADGE_CATALOGUE: BadgeDefinition[] = [
  // التلاوة
  { badge_type: 'first_recitation',    name: 'أول تلاوة',    description: 'سجلت أول تلاوة لك في المنصة', category: 'التلاوة',  criteria_type: 'recitation',   criteria_value: 1,   points_reward: 20 },
  { badge_type: 'hundred_recitations', name: '100 تلاوة',    description: 'سجلت 100 تلاوة',                 category: 'التلاوة',  criteria_type: 'recitation',   criteria_value: 100, points_reward: 150 },
  { badge_type: 'tajweed_master',      name: 'متقن التجويد', description: 'اجتزت مسار التجويد الكامل', category: 'التلاوة',  criteria_type: 'recitation', criteria_value: 10,  points_reward: 300 },

  // المثابرة
  { badge_type: 'week_streak',         name: 'أسبوع متواصل', description: 'حافظت على نشاطك لمدة 7 أيام', category: 'المثابرة', criteria_type: 'streak', criteria_value: 7,  points_reward: 70 },
  { badge_type: 'month_streak',        name: 'شهر متواصل',   description: 'حافظت على نشاطك لمدة 30 يوماً', category: 'المثابرة', criteria_type: 'streak', criteria_value: 30, points_reward: 100 },
  { badge_type: 'ramadan_badge',       name: 'شهر رمضان',  description: 'سجلت تلاوة كل يوم خلال شهر رمضان',              category: 'المثابرة', criteria_type: 'streak', criteria_value: 30, points_reward: 250 },

  // الحفظ
  { badge_type: 'hafiz_juz_amma', name: 'حافظ جزء عمّ', description: 'أتقنت جميع سور الجزء الثلاثين',          category: 'الحفظ', criteria_type: 'memorization', criteria_value: 1,  points_reward: 200 },
  { badge_type: 'full_quran',     name: 'الختمة الكاملة',  description: 'أتقنت القرآن كاملاً وحصلت على إجازة',     category: 'الحفظ', criteria_type: 'memorization', criteria_value: 30, points_reward: 1000 },

  // الدورات
  { badge_type: 'first_course',  name: 'أول دورة', description: 'أكملت أول دورة لك',  category: 'الدورات', criteria_type: 'courses', criteria_value: 1,  points_reward: 50 },
  { badge_type: 'five_courses',  name: '5 دورات',  description: 'أكملت 5 دورات',     category: 'الدورات', criteria_type: 'courses', criteria_value: 5,  points_reward: 200 },
  { badge_type: 'ten_courses',   name: '10 دورات', description: 'أكملت 10 دورات',    category: 'الدورات', criteria_type: 'courses', criteria_value: 10, points_reward: 500 },

  // المهام
  { badge_type: 'first_task',  name: 'أول مهمة',   description: 'أنجزت أول مهمة', category: 'المهام', criteria_type: 'tasks', criteria_value: 1,  points_reward: 15 },
  { badge_type: 'task_master', name: 'سيد المهام', description: 'أنجزت 50 مهمة',  category: 'المهام', criteria_type: 'tasks', criteria_value: 50, points_reward: 250 },

  // تكريم
  { badge_type: 'star_of_halaqah', name: 'نجم الحلقة', description: 'الأعلى نقاطاً في حلقته لمدة شهر', category: 'تكريم', criteria_type: 'custom', points_reward: 180 },
  { badge_type: 'helper',          name: 'المُعين',    description: 'ساعدت زملاءك في المنتدى',         category: 'تكريم', criteria_type: 'custom', points_reward: 50 },
  { badge_type: 'early_bird',      name: 'الباكر',     description: 'دخلت المنصة قبل الفجر 7 أيام',    category: 'تكريم', criteria_type: 'custom', criteria_value: 7, points_reward: 50 },
  { badge_type: 'night_owl',       name: 'الساهر',     description: 'تلوت بعد منتصف الليل 7 ليالي',   category: 'تكريم', criteria_type: 'custom', criteria_value: 7, points_reward: 50 },
]

export async function getBadgeCatalogue(): Promise<BadgeDefinition[]> {
  try {
    const rows = await query<BadgeDefinition>(
      `SELECT badge_type, name, description, category, criteria_type, criteria_value, points_reward, icon
         FROM badge_definitions
        WHERE COALESCE(is_active, true) = true
        ORDER BY display_order ASC, created_at ASC`
    )
    return rows.length > 0 ? rows : BADGE_CATALOGUE
  } catch (error) {
    console.warn('[gamification] badge_definitions unavailable, using fallback catalogue:', (error as Error).message)
    return BADGE_CATALOGUE
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LEVEL_THRESHOLDS: { level: AcademyLevel; min: number }[] = [
  { level: 'beginner',     min: 0 },
  { level: 'intermediate', min: 500 },
  { level: 'advanced',     min: 2000 },
  { level: 'hafiz',        min: 5000 },
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
  const shouldMultiply = options.applyStreakMultiplier !== false && reason !== 'badge_earned' && streak >= 7
  const awardedPoints = shouldMultiply ? Math.round(points * 1.5) : points
  const newTotal = (prev.total_points || 0) + awardedPoints
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
      awardedPoints,
      reason,
      shouldMultiply
        ? `${options.description ?? ''} (مضاعفة Streak ×1.5)`.trim()
        : options.description ?? null,
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
  recitation_count: number
  juz_amma_mastered_count: number
  mastered_surah_count: number
  tajweed_completed_count: number
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
         WHERE e.student_id = $1 AND e.status = 'completed')    AS course_count,
      (SELECT COUNT(*)::int FROM recitations r
         WHERE r.student_id = $1)                                AS recitation_count,
      (SELECT COUNT(DISTINCT r.surah_number)::int
         FROM recitations r
         JOIN reviews rv ON rv.recitation_id = r.id
        WHERE r.student_id = $1
          AND rv.verdict = 'mastered'
          AND r.surah_number BETWEEN 78 AND 114)                 AS juz_amma_mastered_count,
      (SELECT COUNT(DISTINCT r.surah_number)::int
         FROM recitations r
         JOIN reviews rv ON rv.recitation_id = r.id
        WHERE r.student_id = $1
          AND rv.verdict = 'mastered'
          AND r.surah_number BETWEEN 1 AND 114)                  AS mastered_surah_count,
      (SELECT COUNT(*)::int FROM enrollments e
         JOIN courses c ON c.id = e.course_id
        WHERE e.student_id = $1
          AND e.status = 'completed'
          AND (LOWER(COALESCE(c.subject, '')) = 'tajweed'
               OR c.title ILIKE '%تجويد%'))                     AS tajweed_completed_count
    FROM (SELECT 1) _
    LEFT JOIN user_points up ON up.user_id = $1
    `,
    [userId]
  )
  return row || {
    total_points: 0,
    streak_days: 0,
    task_count: 0,
    course_count: 0,
    recitation_count: 0,
    juz_amma_mastered_count: 0,
    mastered_surah_count: 0,
    tajweed_completed_count: 0,
  }
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
      `INSERT INTO badges (user_id, badge_type, badge_name, badge_description, badge_icon_url, points_awarded, awarded_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, badge_type) DO NOTHING
       RETURNING id`,
      [userId, def.badge_type, def.name, def.description, def.icon ?? null, def.points_reward]
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
  const [stats, earned, catalogue] = await Promise.all([
    fetchBadgeStats(userId),
    getEarnedBadgeTypes(userId),
    getBadgeCatalogue(),
  ])

  const unlocked: BadgeDefinition[] = []
  for (const def of catalogue) {
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
    } else if (def.badge_type === 'first_recitation') {
      qualifies = stats.recitation_count >= 1
    } else if (def.badge_type === 'hundred_recitations') {
      qualifies = stats.recitation_count >= 100
    } else if (def.badge_type === 'hafiz_juz_amma') {
      qualifies = stats.juz_amma_mastered_count >= 37
    } else if (def.badge_type === 'tajweed_master') {
      qualifies = stats.tajweed_completed_count > 0
    } else if (def.badge_type === 'full_quran') {
      qualifies = stats.mastered_surah_count >= 114
    }
    // Other custom badges, such as star_of_halaqah, are awarded manually by admins.

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
  unlocked_features: string[]
}

export function unlockedFeaturesForLevel(level: AcademyLevel): string[] {
  const features = ['تسجيل التلاوات', 'حضور الدروس', 'لوحة المتصدرين']
  if (['intermediate', 'advanced', 'hafiz', 'master'].includes(level)) {
    features.push('شارات متقدمة', 'تحديات أسبوعية')
  }
  if (['advanced', 'hafiz', 'master'].includes(level)) {
    features.push('مسارات تجويد متقدمة', 'ملف إنجاز عام')
  }
  if (['hafiz', 'master'].includes(level)) {
    features.push('طلب الإجازة', 'تكريم الحافظين')
  }
  return features
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
    unlocked_features: unlockedFeaturesForLevel(points.level || 'beginner'),
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
  awardPoints(userId, POINTS_RULES.session_attend, 'session_attend', {
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
  awardPoints(userId, POINTS_RULES.streak, 'streak', { description: 'يوم Streak' })

export const awardCourseCompletePoints = (userId: string, courseId: string, courseTitle?: string) =>
  awardPoints(userId, POINTS_RULES.juz_complete, 'course_complete', {
    description: courseTitle ? `إكمال دورة: ${courseTitle}` : 'إكمال دورة',
    relatedEntityType: 'course',
    relatedEntityId: courseId,
  })

export const awardRecitationSubmittedPoints = (userId: string, recitationId: string) =>
  awardPoints(userId, POINTS_RULES.recitation, 'recitation', {
    description: 'تسجيل تلاوة',
    relatedEntityType: 'recitation',
    relatedEntityId: recitationId,
  })

export const awardRecitationMasteredPoints = (userId: string, recitationId: string) =>
  awardPoints(userId, POINTS_RULES.mastered, 'mastered', {
    description: 'إتقان تلاوة',
    relatedEntityType: 'recitation',
    relatedEntityId: recitationId,
  })

export const awardJuzCompletePoints = (userId: string, juzNumber: number) =>
  awardPoints(userId, POINTS_RULES.juz_complete, 'juz_complete', {
    description: `إنهاء جزء كامل: ${juzNumber}`,
    relatedEntityType: 'juz',
  })
