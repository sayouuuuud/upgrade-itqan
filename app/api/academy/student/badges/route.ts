import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { getAcademyBadgeCatalogue } from '@/lib/academy/gamification'

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
    const [completedCourseCountRow, completedTaskCountRow, catalogue] = await Promise.all([
      query<{ count: number }>(
        `SELECT COUNT(*)::int AS count
           FROM enrollments
          WHERE student_id = $1
            AND (LOWER(status) = 'completed'
                 OR completed_at IS NOT NULL
                 OR COALESCE(progress_percentage, 0) >= 100)`,
        [session.sub]
      ),
      query<{ count: number }>(
        `SELECT COUNT(*)::int AS count
           FROM task_submissions
          WHERE student_id = $1
            AND status = 'graded'`,
        [session.sub]
      ),
      getAcademyBadgeCatalogue(),
    ])

    const completedCourseCount = completedCourseCountRow[0]?.count ?? 0
    const completedTaskCount = completedTaskCountRow[0]?.count ?? 0

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
        icon?: string | null
        is_earned: boolean
        earned_at?: string
      }>
    >()

    for (const def of catalogue) {
      const actualCriteriaEarned =
        (def.criteria_type === 'courses' &&
          def.criteria_value != null &&
          completedCourseCount >= def.criteria_value) ||
        (def.criteria_type === 'tasks' &&
          def.criteria_value != null &&
          completedTaskCount >= def.criteria_value)
      const list = categoriesMap.get(def.category) ?? []
      list.push({
        id: def.badge_type,
        name: def.name,
        description: def.description,
        criteria_type: def.criteria_type,
        criteria_value: def.criteria_value,
        icon: def.icon ?? null,
        points_required:
          def.criteria_type === 'points' ? def.criteria_value : undefined,
        is_earned: actualCriteriaEarned,
      })
      categoriesMap.set(def.category, list)
    }

    const categories = Array.from(categoriesMap.entries()).map(([name, badges]) => ({
      name,
      badges,
    }))

    const total = catalogue.length
    const earnedCount = categories.reduce(
      (sum, category) => sum + category.badges.filter(badge => badge.is_earned).length,
      0
    )

    return NextResponse.json({
      categories,
      stats: { total, earned: earnedCount },
    })
  } catch (error) {
    console.error('[API] student/badges GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
