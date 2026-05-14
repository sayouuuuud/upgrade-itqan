import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { createNotificationForAdmins } from "@/lib/notifications"

/**
 * Marks the applicant's draft as submitted (status='pending', submitted_at=now)
 * after validating that all required questions are answered.
 */
export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const user = await queryOne<{ role: string; name: string; approval_status: string }>(
        `SELECT role, name, approval_status FROM users WHERE id = $1`,
        [session.sub]
    )
    if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })

    const roleTarget = user.role === "teacher" ? "teacher" : user.role === "reader" ? "reader" : null
    if (!roleTarget) {
        return NextResponse.json({ error: "هذا الدور لا يحتاج طلب قبول" }, { status: 400 })
    }

    const questions = await query<{ id: string; label: string; type: string; is_required: boolean }>(
        `SELECT id, label, type, is_required
           FROM application_questions
          WHERE role_target = $1 AND is_active = TRUE`,
        [roleTarget]
    )

    let responses: Record<string, any> = {}
    let audio_url: string | null = null
    let pdf_url: string | null = null

    if (roleTarget === "teacher") {
        const app = await queryOne<{ responses: any; audio_url: string | null; cv_file_url: string | null }>(
            `SELECT responses, audio_url, cv_file_url FROM teacher_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [session.sub]
        )
        if (!app) return NextResponse.json({ error: "لم يتم تعبئة أي بيانات" }, { status: 400 })
        responses = app.responses || {}
        audio_url = app.audio_url
        pdf_url = app.cv_file_url
    } else {
        const profile = await queryOne<{ responses: any; audio_url: string | null; pdf_url: string | null }>(
            `SELECT responses, audio_url, pdf_url FROM reader_profiles WHERE user_id = $1`,
            [session.sub]
        )
        if (!profile) return NextResponse.json({ error: "لم يتم تعبئة أي بيانات" }, { status: 400 })
        responses = profile.responses || {}
        audio_url = profile.audio_url
        pdf_url = profile.pdf_url
    }

    // Validate required answers
    const missing: string[] = []
    for (const q of questions) {
        if (!q.is_required) continue
        if (q.type === "audio") {
            if (!audio_url) missing.push(q.label)
        } else if (q.type === "file") {
            if (!pdf_url) missing.push(q.label)
        } else {
            const v = responses[q.id]
            if (!v || (typeof v === "string" && !v.trim())) missing.push(q.label)
        }
    }
    if (missing.length > 0) {
        return NextResponse.json(
            { error: "يرجى إكمال الحقول المطلوبة:\n- " + missing.join("\n- ") },
            { status: 400 }
        )
    }

    if (roleTarget === "teacher") {
        await query(
            `UPDATE teacher_applications
                SET status = 'pending', submitted_at = NOW(), updated_at = NOW()
              WHERE user_id = $1`,
            [session.sub]
        )
        await query(
            `UPDATE users SET approval_status = 'pending_approval' WHERE id = $1`,
            [session.sub]
        )
    } else {
        await query(
            `UPDATE reader_profiles
                SET submitted_at = NOW(), updated_at = NOW()
              WHERE user_id = $1`,
            [session.sub]
        )
        await query(
            `UPDATE users SET approval_status = 'pending_approval' WHERE id = $1`,
            [session.sub]
        )
    }

    try {
        await createNotificationForAdmins({
            type: roleTarget === "teacher" ? "new_teacher_application" : "new_reader_application",
            title: roleTarget === "teacher" ? "طلب انضمام مدرس جديد" : "طلب انضمام مقرئ جديد",
            message: `قدّم ${user.name} طلباً للانضمام كـ${roleTarget === "teacher" ? "أستاذ" : "مقرئ"}. يرجى مراجعة بياناته.`,
            category: "account",
            link: roleTarget === "teacher" ? "/academy/admin/teacher-applications" : "/admin/reader-applications",
        })
    } catch { }

    return NextResponse.json({
        success: true,
        message: "تم استلام طلبك. سيتم مراجعته من قبل الإدارة.",
    })
}
