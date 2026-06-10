import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

        const { id } = await params

        const rows = await query<any>(
            `SELECT b.*,
                    s.name AS student_name, s.email AS student_email, s.avatar_url AS student_avatar,
                    r.name AS reader_name,
                    rec.surah_name, rec.ayah_from, rec.ayah_to, rec.status AS recitation_status,
                    rec.audio_url AS recitation_audio
             FROM bookings b
             JOIN users s ON b.student_id = s.id
             JOIN users r ON b.reader_id = r.id
             LEFT JOIN recitations rec ON b.recitation_id = rec.id
             WHERE b.id = $1
             LIMIT 1`,
            [id]
        )

        const booking = rows[0]
        if (!booking) return NextResponse.json({ error: "لم يتم العثور على الجلسة" }, { status: 404 })

        // Scope: only the assigned reader, the student, or an admin may view
        const isOwner =
            (session.role === "reader" && booking.reader_id === session.sub) ||
            (session.role === "student" && booking.student_id === session.sub) ||
            session.role === "admin"
        if (!isOwner) return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

        return NextResponse.json({ booking })
    } catch (error) {
        console.error("Get booking error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

        const { id } = await params
        const body = await req.json()
        const { status, reader_notes, session_summary } = body

        // Allow updating status and/or reader notes / session summary
        const sets: string[] = []
        const vals: unknown[] = []
        let i = 1
        if (status !== undefined) { sets.push(`status = $${i++}`); vals.push(status) }
        if (reader_notes !== undefined) { sets.push(`reader_notes = $${i++}`); vals.push(reader_notes) }
        if (session_summary !== undefined) { sets.push(`session_summary = $${i++}`); vals.push(session_summary) }

        if (sets.length === 0) {
            return NextResponse.json({ error: "لا يوجد بيانات للتحديث" }, { status: 400 })
        }

        vals.push(id)
        const result = await query(
            `UPDATE bookings SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${i} RETURNING *`,
            vals
        )

        if (result.length === 0) {
            return NextResponse.json({ error: "لم يتم العثور على الحجز" }, { status: 404 })
        }

        return NextResponse.json({ booking: result[0] })
    } catch (error) {
        console.error("Update booking error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
