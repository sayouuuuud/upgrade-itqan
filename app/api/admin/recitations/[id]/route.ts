import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import * as db from "@/lib/db"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        const allowedRoles: ("admin" | "student_supervisor" | "reciter_supervisor")[] = ["admin", "student_supervisor", "reciter_supervisor"]
        if (!requireRole(session, allowedRoles)) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
        }

        const { id } = await params

        const recitation = await db.queryOne<any>(
            `SELECT 
               r.id, 
               r.surah_name, 
               r.ayah_from, 
               r.ayah_to, 
               r.audio_url, 
               r.audio_duration_seconds, 
               r.submission_type, 
               r.recitation_type, 
               r.status, 
               r.student_notes, 
               r.internal_notes, 
               r.created_at, 
               r.reviewed_at,
               r.student_id,
               r.assigned_reader_id,
               s.name as student_name, 
               s.email as student_email, 
               s.avatar_url as student_avatar,
               rd.name as reader_name, 
               rd.email as reader_email, 
               rd.avatar_url as reader_avatar,
               rev.overall_score, 
               rev.verdict, 
               rev.detailed_feedback,
               rev.tajweed_score,
               rev.pronunciation_score,
               rev.fluency_score,
               rev.memorization_score,
               rev.strengths,
               rev.areas_for_improvement
             FROM recitations r
             INNER JOIN users s ON r.student_id = s.id
             LEFT JOIN users rd ON r.assigned_reader_id = rd.id
             LEFT JOIN reviews rev ON rev.recitation_id = r.id
             WHERE r.id = $1`,
            [id]
        )

        if (!recitation) {
            return NextResponse.json({ error: "Recitation not found" }, { status: 404 })
        }

        const wordMistakes = await db.query(
            `SELECT word
             FROM word_mistakes 
             WHERE recitation_id = $1
             ORDER BY created_at ASC`,
            [id]
        )

        return NextResponse.json({ 
            ...recitation, 
            wordMistakes: wordMistakes.map((wm: any) => wm.word) 
        })
    } catch (error) {
        console.error("Admin recitation fetch error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}

// C-2: PATCH /api/admin/recitations/[id] — تحديث status أو internal_notes
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        const allowedRoles: ("admin" | "student_supervisor" | "reciter_supervisor")[] = ["admin", "student_supervisor", "reciter_supervisor"]
        if (!requireRole(session, allowedRoles)) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
        }

        const { id } = await params
        const body = await req.json()
        const { status, internal_notes } = body

        // بناء SET clause ديناميكي
        const updates: string[] = []
        const vals: any[] = []

        if (status !== undefined) {
            const allowed = ['pending', 'in_review', 'reviewed', 'mastered', 'needs_session', 'cancelled']
            if (!allowed.includes(status)) {
                return NextResponse.json({ error: `status غير مسموح. القيم المسموحة: ${allowed.join(', ')}` }, { status: 400 })
            }
            vals.push(status)
            updates.push(`status = $${vals.length}`)

            if (status === 'reviewed' || status === 'mastered' || status === 'needs_session') {
                updates.push(`reviewed_at = NOW()`)
            }
        }

        if (internal_notes !== undefined) {
            vals.push(internal_notes)
            updates.push(`internal_notes = $${vals.length}`)
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'لا توجد حقول للتحديث' }, { status: 400 })
        }

        updates.push(`updated_at = NOW()`)
        vals.push(id)

        const result = await db.query(
            `UPDATE recitations SET ${updates.join(', ')} WHERE id = $${vals.length} RETURNING *`,
            vals
        )

        if ((result as any[]).length === 0) {
            return NextResponse.json({ error: "التسميع غير موجود" }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: (result as any[])[0] })
    } catch (error) {
        console.error("Admin recitation PATCH error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}

