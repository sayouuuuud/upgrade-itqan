import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { question, category } = body

    if (!question || !category) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const result = await queryOne<{ id: string }>(
      `
        INSERT INTO fiqh_questions (asked_by, question, category, is_published, asked_at)
        VALUES ($1, $2, $3, FALSE, NOW())
        RETURNING id
      `,
      [session.sub, question, category]
    )

    try {
      const admins = await query<{ id: string }>(
        `SELECT id FROM users WHERE role = 'admin'`
      )

      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: 'general',
          title: '❓ سؤال فقهي جديد',
          message: `سؤال جديد في فئة ${category} ينتظر الإجابة`,
          category: 'fiqh',
          link: '/academy/admin/fiqh',
        }).catch(() => {})
      }
    } catch (notifErr) {
      console.error('[Student Fiqh] Notification failed:', notifErr)
    }

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error('[Student Fiqh POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const questions = await query<any>(
      `
        SELECT fq.id, fq.question, fq.category, fq.answer, fq.answered_by, 
               fq.is_published, fq.asked_at as created_at, fq.answered_at,
               u.name as answered_by_name
        FROM fiqh_questions fq
        LEFT JOIN users u ON u.id = fq.answered_by
        WHERE fq.asked_by = $1
        ORDER BY fq.asked_at DESC
      `,
      [session.sub]
    )

    return NextResponse.json(questions)
  } catch (err) {
    console.error('[Student Fiqh GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
