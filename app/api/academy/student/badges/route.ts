import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { BADGE_CATALOGUE, BadgeType } from '@/lib/academy/gamification'

/**
 * GET /api/academy/student/badges
 *
 * Returns the user's badges as a list of categories. Each category contains
 * every badge in the catalogue with `is_earned` set, so the UI can render
 * locked + unlocked badges in one pass — matching the existing badges page.
 *
 * Response shape:
 *   {
 *     categories: [
 *       { name, badges: [{ id, name, description, criteria_type, criteria_value,
 *                          points_required, is_earned, earned_at? }] }
 *     ],
 *     stats: { total, earned }
 *   }
 */
export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session || !['student', 'teacher', 'parent', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const earnedRows = await query<{
      badge_type: BadgeType
      awarded_at: string
      points_awarded: number
    }>(
      `SELECT badge_type, awarded_at, points_awarded
         FROM badges
        WHERE user_id = $1`,
      [session.sub]
    )
    const earnedMap = new Map(earnedRows.map(r => [r.badge_type, r]))

    // Group by category
    const categoriesMap = new Map<
      string,
      Array<{
        id: string
        name: string
        description: string
        criteria_type: string
        criteria_value?: number
        points_required?: number
        is_earned: boolean
        earned_at?: string
      }>
    >()

    for (const def of BADGE_CATALOGUE) {
      const earned = earnedMap.get(def.badge_type)
      const list = categoriesMap.get(def.category) ?? []
      list.push({
        id: def.badge_type,
        name: def.name,
        description: def.description,
        criteria_type: def.criteria_type,
        criteria_value: def.criteria_value,
        points_required:
          def.criteria_type === 'points' ? def.criteria_value : undefined,
        is_earned: !!earned,
        earned_at: earned?.awarded_at,
      })
      categoriesMap.set(def.category, list)
    }

    const categories = Array.from(categoriesMap.entries()).map(([name, badges]) => ({
      name,
      badges,
    }))

    const total = BADGE_CATALOGUE.length
    const earnedCount = earnedRows.length

    return NextResponse.json({
      categories,
      stats: { total, earned: earnedCount },
    })
  } catch (error) {
    console.error('[API] student/badges GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
