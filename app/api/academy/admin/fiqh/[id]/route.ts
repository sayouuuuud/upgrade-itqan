import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

const ALLOWED_ROLES = ['academy_admin', 'admin', 'fiqh_supervisor', 'supervisor']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  try {
    const body = await req.json()

    // Detect transitions for notifications.
    const before = await queryOne<{
      asked_by: string | null
      answer: string | null
      is_published: boolean
      question: string
    }>(
      `SELECT asked_by, answer, is_published, question FROM fiqh_questions WHERE id = $1`,
      [id],
    )
    if (!before) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const willHaveAnswer =
      typeof body.answer === 'string' && body.answer.trim().length > 0
    const isFirstAnswer = willHaveAnswer && (!before.answer || before.answer.trim() === '')
    const isFirstPublish = body.is_published === true && before.is_published === false
    const answered_at_value = isFirstAnswer ? new Date().toISOString() : null

    const result = await query<any>(
      `
      UPDATE fiqh_questions
         SET question      = COALESCE($1, question),
             answer        = COALESCE($2, answer),
             category      = COALESCE($3, category),
             is_published  = COALESCE($4, is_published),
             answered_at   = COALESCE($5, answered_at),
             answered_by   = CASE
                               WHEN $2::text IS NOT NULL AND answered_by IS NULL THEN $6
                               ELSE answered_by
                             END,
             updated_at    = NOW()
       WHERE id = $7
       RETURNING *
      `,
      [
        body.question || null,
        typeof body.answer === 'string' ? body.answer : null,
        body.category || null,
        body.is_published !== undefined ? body.is_published : null,
        answered_at_value,
        session.sub,
        id,
      ],
    )

    if (result.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Notify the asker (if any) when their question receives its first
    // answer or is first published to the public list.
    if (before.asked_by && (isFirstAnswer || isFirstPublish)) {
      const titleAr = isFirstPublish
        ? '📢 تم نشر إجابة سؤالك'
        : '✅ تم الرد على سؤالك الفقهي'
      try {
        await createNotification({
          userId: before.asked_by,
          type: 'general',
          title: titleAr,
          message: before.question.length > 80
            ? before.question.slice(0, 80) + '…'
            : before.question,
          category: 'general',
          link: '/academy/student/fiqh',
        })
      } catch (e) {
        console.error('[API] fiqh notify error:', e)
      }
    }

    return NextResponse.json({ data: result[0] })
  } catch (error) {
    console.error('[API] admin/fiqh PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    await query(`DELETE FROM fiqh_questions WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] admin/fiqh DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
