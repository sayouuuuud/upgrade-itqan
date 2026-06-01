import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

// GET /api/recitations/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const { id } = await params
    
    // Validate UUID format to prevent DB errors from non-UUID strings (e.g. static path fallthroughs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "معرف غير صالح" }, { status: 404 })
    }

    const recitation = await queryOne(
      `SELECT r.*, 
              s.name as student_name, s.email as student_email,
              rd.name as reader_name
       FROM recitations r
       LEFT JOIN users s ON r.student_id = s.id
       LEFT JOIN users rd ON r.assigned_reader_id = rd.id
       WHERE r.id = $1`,
      [id]
    )

    if (!recitation) return NextResponse.json({ error: "التلاوة غير موجودة" }, { status: 404 })

    // Get reviews for this recitation
    const reviews = await query(
      `SELECT rv.*, u.name as reviewer_name
       FROM reviews rv
       JOIN users u ON rv.reader_id = u.id
       WHERE rv.recitation_id = $1
       ORDER BY rv.created_at DESC`,
      [id]
    )

    // Get word mistakes for this recitation
    const wordMistakes = await query(
      `SELECT word, created_at
       FROM word_mistakes 
       WHERE recitation_id = $1
       ORDER BY created_at ASC`,
      [id]
    )

    return NextResponse.json({ recitation, reviews, wordMistakes })
  } catch (error) {
    console.error("Get recitation error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// PATCH /api/recitations/:id - update status or assign reader
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const { id } = await params
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "معرف غير صالح" }, { status: 404 })
    }

    const body = await req.json()

    const updates: string[] = []
    const values: unknown[] = []

    if (body.status) {
      values.push(body.status)
      updates.push(`status = $${values.length}`)
    }

    if (body.assignedReaderId) {
      values.push(body.assignedReaderId)
      updates.push(`assigned_reader_id = $${values.length}`)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 })
    }

    values.push(id)
    const result = await query(
      `UPDATE recitations SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values
    )

    return NextResponse.json({ recitation: result[0] })
  } catch (error) {
    console.error("Update recitation error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// DELETE /api/recitations/:id - delete a recitation
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const { id } = await params
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "معرف غير صالح" }, { status: 404 })
    }

    // Fetch the recitation first to determine if the user owns it and get the audio_url
    const recitation = await queryOne<{ student_id: string, audio_url: string, status: string }>(
      `SELECT student_id, audio_url, status FROM recitations WHERE id = $1`,
      [id]
    )

    if (!recitation) return NextResponse.json({ error: "التلاوة غير موجودة" }, { status: 404 })

    // Ensure only the student who created it can delete it
    if (recitation.student_id !== session.sub) {
      return NextResponse.json({ error: "غير مصرح بحذف هذه التلاوة" }, { status: 403 })
    }

    // Cleanup file from storage if present
    if (recitation.audio_url) {
      try {
        let fileKey: string | undefined
        if (recitation.audio_url.includes("amazonaws.com")) {
          // S3 URL: https://<bucket>.s3.<region>.amazonaws.com/<key>
          fileKey = new URL(recitation.audio_url).pathname.replace(/^\/+/, "")
        } else if (recitation.audio_url.includes("utfs.io")) {
          // Legacy UploadThing URL: https://utfs.io/f/<key>
          fileKey = recitation.audio_url.split("/f/")[1]
        }
        if (fileKey) {
          const { deleteFromStorage } = await import("@/lib/storage")
          await deleteFromStorage(fileKey)
        }
      } catch (storageError) {
        console.error("Failed to delete recitation file from storage:", storageError)
      }
    }

    // Delete DB record
    await query(`DELETE FROM recitations WHERE id = $1`, [id])

    return NextResponse.json({ success: true, message: "تم حذف التلاوة بنجاح" })
  } catch (error) {
    console.error("Delete recitation error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء الحذف" }, { status: 500 })
  }
}
