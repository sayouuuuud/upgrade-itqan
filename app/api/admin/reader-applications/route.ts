import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { sendReaderApprovedEmail, sendReaderRejectedEmail } from "@/lib/email"
import { logAdminAction } from "@/lib/activity-log"
import { createNotification } from "@/lib/notifications"

// GET /api/admin/reader-applications
export async function GET() {
  const session = await getSession()
  const allowedRoles: ("admin" | "reciter_supervisor")[] = ["admin", "reciter_supervisor"]
  if (!requireRole(session, allowedRoles)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const applications = await query(
    `SELECT u.id, u.name, u.email, u.gender, u.approval_status, u.created_at,
            rp.full_name_triple, rp.phone, rp.city, rp.qualification,
            rp.memorized_parts, rp.years_of_experience, rp.certificate_file_url
     FROM users u
     LEFT JOIN reader_profiles rp ON rp.user_id = u.id
     WHERE u.role = 'reader'
     ORDER BY 
       CASE u.approval_status 
         WHEN 'pending_approval' THEN 0 
         ELSE 1 
       END,
       u.created_at DESC`
  )

  return NextResponse.json({ applications })
}

// PUT /api/admin/reader-applications - approve or reject
export async function PUT(req: NextRequest) {
  const session = await getSession()
  const allowedRoles: ("admin" | "reciter_supervisor")[] = ["admin", "reciter_supervisor"]
  if (!requireRole(session, allowedRoles)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const { userId, action } = await req.json()

  if (!userId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 })
  }

  const newStatus = action === "approve" ? "approved" : "rejected"

  await query(
    `UPDATE users SET approval_status = $1 WHERE id = $2 AND role = 'reader'`,
    [newStatus, userId]
  )

  // Get reader info for email
  const reader = await query<{ name: string; email: string }>(
    `SELECT name, email FROM users WHERE id = $1`,
    [userId]
  )

  if (reader[0]) {
    if (action === "approve") {
      await sendReaderApprovedEmail(reader[0].email, reader[0].name)
      await createNotification({
        userId,
        type: 'reader_approved',
        title: 'تم اعتماد حسابك ✅',
        message: 'مبروك! تم اعتماد طلب انضمامك كمنقرئ للمنصة. يمكنك الآن البدء باستقبال التلاوات.',
        category: 'account',
        link: '/reader'
      })
    } else {
      await sendReaderRejectedEmail(reader[0].email, reader[0].name)
      await createNotification({
        userId,
        type: 'reader_rejected',
        title: 'تحديث بشأن طلب الانضمام',
        message: 'نأسف لإبلاغك بأنه لم يتم اعتماد طلب انضمامك في الوقت الحالي.',
        category: 'account'
      })
    }
  }

  await logAdminAction({
    userId: session!.sub,
    action: action === 'approve' ? 'reader_approved' : 'reader_rejected',
    entityType: 'reader',
    entityId: userId,
    description: `Admin ${action}d reader application for ${reader[0]?.name ?? userId}`,
  })

  return NextResponse.json({ success: true, status: newStatus })
}
