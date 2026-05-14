import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAllBadgeDefinitions, getUserBadges } from '@/lib/academy/badges'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['student', 'reader', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [definitions, earned] = await Promise.all([
      getAllBadgeDefinitions(),
      getUserBadges(session.sub),
    ])

    const earnedKeys = new Set(earned.map(b => b.badge_key))

    const CATEGORY_LABELS: Record<string, string> = {
      recitation: 'التلاوة',
      memorization: 'الحفظ',
      streak: 'الاستمرارية',
      mastery: 'الإتقان',
      special: 'شارات خاصة',
      achievement: 'إنجازات',
    }

    const categoryMap: Record<string, { name: string; badges: any[] }> = {}

    for (const def of definitions) {
      const cat = def.category || 'achievement'
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: CATEGORY_LABELS[cat] || cat, badges: [] }
      }

      const earnedBadge = earned.find(e => e.badge_key === def.badge_key)
      categoryMap[cat].badges.push({
        id: def.id,
        name: def.badge_name,
        description: def.badge_description,
        icon: def.badge_icon,
        icon_url: def.badge_image_url,
        color: def.badge_color,
        points_awarded: def.points_awarded,
        criteria_type: def.criteria_type,
        criteria_value: def.criteria_value,
        category: def.category,
        badge_key: def.badge_key,
        is_earned: earnedKeys.has(def.badge_key),
        earned_at: earnedBadge?.awarded_at || null,
      })
    }

    return NextResponse.json({
      categories: Object.values(categoryMap),
      total: definitions.length,
      earned_count: earnedKeys.size,
      earned_badges: earned,
    })
  } catch (error) {
    console.error('Error fetching badges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
