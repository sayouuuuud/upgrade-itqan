import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { createNotification } from '@/lib/notifications'
import { awardTaskPoints } from '@/lib/academy/gamification'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, submissionId: string }> }
) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const p = await params;
    const { id: taskId, submissionId } = p;
    const body = await req.json()
    const { score, feedback } = body

    if (score === undefined || score === null) {
      return NextResponse.json({ error: 'score مطلوب' }, { status: 400 })
    }

    // Ownership check
    const tCheck = await query<any>(`
      SELECT t.id,
             t.max_score,
             t.title,
             t.course_id,
             COALESCE(t.points_reward, 15) AS points_reward
        FROM tasks t 
        JOIN courses c ON t.course_id = c.id 
       WHERE t.id = $1 AND c.teacher_id = $2
    `, [taskId, session.sub])

    if (tCheck.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const task = tCheck[0]

    const existingSubmission = await query<{ status: string }>(
      `SELECT status FROM task_submissions WHERE id = $1 AND task_id = $2`,
      [submissionId, taskId]
    )
    const wasAlreadyGraded = existingSubmission[0]?.status === 'graded'

    // C-7: تحديث submission وضبط status = 'graded'
    const updateRes = await query<any>(`
      UPDATE task_submissions 
      SET score = $1, feedback = $2, status = 'graded', graded_at = NOW(), updated_at = NOW()
      WHERE id = $3 AND task_id = $4
      RETURNING *
    `, [score, feedback || null, submissionId, taskId])

    if (updateRes.length === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }
    const submission = updateRes[0]

    // C-7: فحص هل كل submissions المهمة اتقيّمت — وإذا آه حدث task status
    try {
      const allSubs = await query<any>(
        `SELECT status FROM task_submissions WHERE task_id = $1`,
        [taskId]
      )
      const allGraded = allSubs.length > 0 && allSubs.every(s => s.status === 'graded')
      if (allGraded) {
        await query(
          `UPDATE tasks SET status = 'graded', updated_at = NOW() WHERE id = $1`,
          [taskId]
        )
      }
    } catch (taskUpdateErr) {
      console.error('[C-7] Failed to update task status:', taskUpdateErr)
    }

    // C-7: إشعار للطالب (trigger DB بيشتغل تلقائياً — هذا كـ fallback)
    try {
      await createNotification({
        userId: submission.student_id,
        type: 'general',
        title: `📝 تم تقييم مهمتك «${task.title}»`,
        message: `حصلت على ${score} من ${task.max_score || '?'}. ${feedback ? 'تعليق المدرس: ' + feedback : ''}`,
        category: 'course',
        link: '/academy/student/tasks',
      })
    } catch (notifErr) {
      console.error('[C-7] Failed to send grade notification:', notifErr)
    }

    // Phase 5 (Gamification): task completion gives the configured reward once.
    try {
      const earned = Number(task.points_reward) || 15
      if (earned > 0 && !wasAlreadyGraded) {
        const result = await awardTaskPoints(
          submission.student_id,
          earned,
          taskId,
          task.title,
        )
        // Notify the student about any newly unlocked badges.
        for (const badgeType of result.new_badges) {
          await createNotification({
            userId: submission.student_id,
            type: 'general',
            title: '🏅 شارة جديدة!',
            message: `حصلت على شارة جديدة بفضل إنجازاتك (${badgeType}).`,
            category: 'general',
            link: '/academy/student/badges',
          }).catch(() => { /* non-fatal */ })
        }
      }
    } catch (pointsErr) {
      console.error('[Gamification] Failed to award task points:', pointsErr)
    }

    // C-6: إنشاء signed URL لملف التسليم إذا موجود
    let fileSignedUrl: string | null = null
    if (submission.file_url) {
      try {
        // استخرج الـ path من الـ URL
        const urlObj = new URL(submission.file_url)
        // الـ path بعد /storage/v1/object/public/
        const pathParts = urlObj.pathname.split('/storage/v1/object/public/')
        if (pathParts.length > 1) {
          const [bucket, ...rest] = pathParts[1].split('/')
          const filePath = rest.join('/')
          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, 3600) // ساعة
          if (!error && data) {
            fileSignedUrl = data.signedUrl
          }
        }
      } catch (urlErr) {
        console.error('[C-6] Failed to create signed URL:', urlErr)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...submission,
        file_signed_url: fileSignedUrl,
      }
    })
  } catch (error) {
    console.error('[API] Grade submission error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// C-6: GET — جلب signed URL لملف التسليم
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, submissionId: string }> }
) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: taskId, submissionId } = await params

    const rows = await query<any>(
      `SELECT ts.*, u.name as student_name
       FROM task_submissions ts
       JOIN users u ON ts.student_id = u.id
       WHERE ts.id = $1 AND ts.task_id = $2`,
      [submissionId, taskId]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const sub = rows[0]

    // C-6: توليد signed URL
    let fileSignedUrl: string | null = null
    if (sub.file_url) {
      try {
        const urlObj = new URL(sub.file_url)
        const pathParts = urlObj.pathname.split('/storage/v1/object/public/')
        if (pathParts.length > 1) {
          const [bucket, ...rest] = pathParts[1].split('/')
          const filePath = rest.join('/')
          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, 3600)
          if (!error && data) {
            fileSignedUrl = data.signedUrl
          }
        }
      } catch { }
    }

    return NextResponse.json({
      data: {
        ...sub,
        file_signed_url: fileSignedUrl,
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
