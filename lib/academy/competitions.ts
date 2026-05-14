import { query, queryOne } from '@/lib/db'
import { awardPoints, BADGE_CATALOGUE } from '@/lib/academy/gamification'

type CompetitionAwardRow = {
  id: string
  title: string
  type: string
  badge_key: string | null
  points_multiplier: string | number | null
}

export function defaultBadgeForCompetition(type: string): string {
  if (type === 'ramadan') return 'ramadan_badge'
  if (type === 'tajweed') return 'tajweed_master'
  if (type === 'memorization') return 'hafiz_juz_amma'
  return 'star_of_halaqah'
}

export async function awardCompetitionWinner(competitionId: string, studentId: string) {
  const competition = await queryOne<CompetitionAwardRow>(
    `SELECT id, title, type, badge_key, points_multiplier
       FROM competitions
      WHERE id = $1`,
    [competitionId]
  )
  if (!competition) return null

  const multiplier = Number(competition.points_multiplier || 1)
  const basePoints = competition.type === 'ramadan' ? 150 : competition.type === 'tajweed' ? 120 : 100
  const points = Math.round(basePoints * (Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1))

  const pointsResult = await awardPoints(studentId, points, 'competition_win', {
    description: `الفوز في ${competition.title}`,
    relatedEntityType: 'competition',
    relatedEntityId: competition.id,
    applyStreakMultiplier: false,
  })

  const badgeType = competition.badge_key || defaultBadgeForCompetition(competition.type)
  const badge = BADGE_CATALOGUE.find((item) => item.badge_type === badgeType)
  if (badge) {
    await query(
      `INSERT INTO badges (user_id, badge_type, badge_key, badge_name, badge_description, badge_icon_url, points_awarded, awarded_at)
       VALUES ($1, $2, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, badge_key) DO NOTHING`,
      [studentId, badge.badge_type, badge.name, badge.description, badge.icon ?? null, badge.points_reward]
    )
  }

  await query(
    `UPDATE competitions SET winner_id = $2, updated_at = NOW() WHERE id = $1`,
    [competitionId, studentId]
  )

  return { points_awarded: points, total_points: pointsResult.total_points, badge_type: badgeType }
}
