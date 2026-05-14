import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

/**
 * Returns the current applicant's application state plus the admin-defined
 * questions for their role. Used by the pending dashboard.
 */
export async function GET() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const user = await queryOne<{ role: string; approval_status: string }>(
        `SELECT role, approval_status FROM users WHERE id = $1`,
        [session.sub]
    )
    if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })

    const roleTarget = user.role === "teacher" ? "teacher" : user.role === "reader" ? "reader" : null
    if (!roleTarget) {
        return NextResponse.json({
            user: { role: user.role, approval_status: user.approval_status },
            application: null,
            questions: [],
        })
    }

    const questions = await query<{
        id: string
        label: string
        description: string | null
        type: string
        options: any
        is_required: boolean
        sort_order: number
    }>(
        `SELECT id, label, description, type, options, is_required, sort_order
           FROM application_questions
          WHERE role_target = $1 AND is_active = TRUE
          ORDER BY sort_order ASC, created_at ASC`,
        [roleTarget]
    )

    let application: any = null
    if (roleTarget === "teacher") {
        application = await queryOne<any>(
            `SELECT id, status, responses, audio_url, cv_url, cv_file_url, certificate_file_url,
                    rejection_reason, rejection_count, created_at, submitted_at, reviewed_at
               FROM teacher_applications
              WHERE user_id = $1
              ORDER BY created_at DESC LIMIT 1`,
            [session.sub]
        )
    } else {
        application = await queryOne<any>(
            `SELECT id, responses, audio_url, pdf_url, certificate_file_url,
                    rejection_reason, rejection_count, submitted_at,
                    full_name_triple, phone, qualification, years_of_experience
               FROM reader_profiles
              WHERE user_id = $1`,
            [session.sub]
        )
        if (application) application.status = user.approval_status
    }

    return NextResponse.json({
        user: { role: user.role, approval_status: user.approval_status },
        application,
        questions,
    })
}

/**
 * Saves the in-progress draft (responses + audio_url + pdf_url) without
 * actually submitting. Allows the applicant to come back later.
 */
export async function PATCH(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const user = await queryOne<{ role: string; approval_status: string }>(
        `SELECT role, approval_status FROM users WHERE id = $1`,
        [session.sub]
    )
    if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })

    const body = await req.json()
    const { responses, audio_url, pdf_url } = body

    if (user.role === "teacher") {
        const existing = await queryOne<{ id: string }>(
            `SELECT id FROM teacher_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [session.sub]
        )
        if (existing) {
            await query(
                `UPDATE teacher_applications
                    SET responses = COALESCE($1, responses),
                        audio_url = COALESCE($2, audio_url),
                        cv_file_url = COALESCE($3, cv_file_url),
                        updated_at = NOW()
                  WHERE id = $4`,
                [responses ? JSON.stringify(responses) : null, audio_url ?? null, pdf_url ?? null, existing.id]
            )
        } else {
            await query(
                `INSERT INTO teacher_applications (user_id, qualifications, responses, audio_url, cv_file_url, status)
                 VALUES ($1, $2, $3, $4, $5, 'draft')`,
                [session.sub, "", JSON.stringify(responses || {}), audio_url ?? null, pdf_url ?? null]
            )
        }
    } else if (user.role === "reader") {
        await query(
            `UPDATE reader_profiles
                SET responses = COALESCE($1, responses),
                    audio_url = COALESCE($2, audio_url),
                    pdf_url   = COALESCE($3, pdf_url),
                    updated_at = NOW()
              WHERE user_id = $4`,
            [responses ? JSON.stringify(responses) : null, audio_url ?? null, pdf_url ?? null, session.sub]
        )
    } else {
        return NextResponse.json({ error: "هذا الدور لا يحتاج طلب قبول" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
}
