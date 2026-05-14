import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

// GET: list officers (admin)
export async function GET() {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const officers = await query(
    `SELECT o.id, o.user_id, o.bio, o.is_active, o.created_at,
            u.name, u.email, u.avatar_url, u.role,
            COALESCE(
              (SELECT array_agg(c.id::text)
                 FROM fiqh_officer_categories oc
                 JOIN fiqh_categories c ON c.id = oc.category_id
                WHERE oc.officer_id = o.id),
              ARRAY[]::text[]
            ) AS category_ids,
            COALESCE(
              (SELECT array_agg(c.name_ar)
                 FROM fiqh_officer_categories oc
                 JOIN fiqh_categories c ON c.id = oc.category_id
                WHERE oc.officer_id = o.id),
              ARRAY[]::text[]
            ) AS category_names,
            COALESCE((
              SELECT COUNT(*)::int FROM fiqh_questions q
                WHERE q.assigned_to = o.user_id
                  AND q.status IN ('assigned','in_progress','awaiting_consent')
            ), 0) AS open_count
       FROM fiqh_officers o
       JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC`
  )
  return NextResponse.json({ officers })
}

// POST: add an officer (or update categories)
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { user_id, email, category_ids, bio, is_active } = await req.json()

  let userId = user_id as string | undefined
  if (!userId && email) {
    const u = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE email = $1`,
      [String(email).toLowerCase()]
    )
    if (!u) {
      return NextResponse.json({ error: 'لم يتم العثور على مستخدم بهذا البريد' }, { status: 404 })
    }
    userId = u.id
  }
  if (!userId) {
    return NextResponse.json({ error: 'user_id أو email مطلوب' }, { status: 400 })
  }

  const upserted = await query<{ id: string }>(
    `INSERT INTO fiqh_officers (user_id, bio, is_active)
     VALUES ($1, $2, COALESCE($3, TRUE))
     ON CONFLICT (user_id)
     DO UPDATE SET bio = COALESCE(EXCLUDED.bio, fiqh_officers.bio),
                   is_active = COALESCE(EXCLUDED.is_active, fiqh_officers.is_active)
     RETURNING id`,
    [userId, bio || null, typeof is_active === 'boolean' ? is_active : null]
  )

  const officerId = upserted[0].id

  if (Array.isArray(category_ids)) {
    await query(`DELETE FROM fiqh_officer_categories WHERE officer_id = $1`, [officerId])
    for (const cid of category_ids) {
      await query(
        `INSERT INTO fiqh_officer_categories (officer_id, category_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [officerId, cid]
      )
    }
  }

  return NextResponse.json({ ok: true, officer_id: officerId })
}
