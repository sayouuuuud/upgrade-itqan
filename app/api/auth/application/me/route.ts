import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

type ColumnRow = { column_name: string }

async function getTableColumns(tableName: string) {
    const rows = await query<ColumnRow>(
        `SELECT column_name
           FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1`,
        [tableName]
    )
    return new Set(rows.map(row => row.column_name))
}

function optionalColumn(columns: Set<string>, columnName: string, fallback: string, alias = columnName) {
    return columns.has(columnName) ? columnName : `${fallback} AS ${alias}`
}

function teacherDocumentColumn(columns: Set<string>) {
    if (columns.has("cv_file_url") && columns.has("cv_url")) return "COALESCE(cv_file_url, cv_url) AS cv_file_url"
    if (columns.has("cv_file_url")) return "cv_file_url"
    if (columns.has("cv_url")) return "cv_url AS cv_file_url"
    return "NULL::text AS cv_file_url"
}

function latestApplicationOrder(columns: Set<string>) {
    if (columns.has("created_at")) return "ORDER BY created_at DESC"
    if (columns.has("updated_at")) return "ORDER BY updated_at DESC"
    if (columns.has("id")) return "ORDER BY id DESC"
    return ""
}

async function getTeacherApplication(userId: string) {
    const teacherColumns = await getTableColumns("teacher_applications")
    if (teacherColumns.size === 0) return null

    const selectColumns = [
        optionalColumn(teacherColumns, "status", "'draft'::text"),
        optionalColumn(teacherColumns, "responses", "'{}'::jsonb"),
        optionalColumn(teacherColumns, "audio_url", "NULL::text"),
        teacherDocumentColumn(teacherColumns),
        "NULL::text AS pdf_url",
        optionalColumn(teacherColumns, "certificate_file_url", "NULL::text"),
        optionalColumn(teacherColumns, "rejection_reason", "NULL::text"),
        optionalColumn(teacherColumns, "rejection_count", "0::int"),
        optionalColumn(teacherColumns, "created_at", "NULL::timestamptz"),
        optionalColumn(teacherColumns, "submitted_at", "NULL::timestamptz"),
        optionalColumn(teacherColumns, "reviewed_at", "NULL::timestamptz"),
    ]

    return queryOne<Record<string, unknown>>(
        `SELECT ${selectColumns.join(",\n                    ")}
           FROM teacher_applications
          WHERE user_id = $1
          ${latestApplicationOrder(teacherColumns)}
          LIMIT 1`,
        [userId]
    )
}

async function getApplicationQuestions(roleTarget: string) {
    const questionColumns = await getTableColumns("application_questions")
    if (questionColumns.size === 0) return []

    return query<{
        id: string
        label: string
        description: string | null
        type: string
        options: unknown
        is_required: boolean
        sort_order: number
    }>(
        `SELECT id, label, description, type, options, is_required, sort_order
           FROM application_questions
          WHERE role_target = $1 AND is_active = TRUE
          ORDER BY sort_order ASC, created_at ASC`,
        [roleTarget]
    )
}

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

    let application: Record<string, unknown> | null = null
    if (roleTarget === "teacher") {
        application = await getTeacherApplication(session.sub)
    } else {
        application = await queryOne<Record<string, unknown>>(
            `SELECT id, responses, audio_url, pdf_url, certificate_file_url,
                    rejection_reason, rejection_count, submitted_at,
                    full_name_triple, phone, qualification, years_of_experience
               FROM reader_profiles
              WHERE user_id = $1`,
            [session.sub]
        )
        if (application) application.status = user.approval_status
    }

    const questions = user.approval_status === "rejected" ? [] : await getApplicationQuestions(roleTarget)

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
