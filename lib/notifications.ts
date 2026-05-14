import { query } from "@/lib/db"

export type NotificationType =
    | "recitation_received"      // reader: new recitation to review
    | "recitation_reviewed"      // student: reader submitted review
    | "mastered"                  // student: verdict mastered
    | "needs_session"             // student: verdict needs_session
    | "session_booked"            // student+reader: booking confirmed
    | "session_reminder"          // student+reader: 1h before session
    | "new_reader_application"    // admin: new reader applied
    | "new_teacher_application"   // admin: new teacher applied
    | "reader_approved"           // reader: admin approved
    | "reader_rejected"           // reader: admin rejected
    | "new_recitation_admin"      // admin: new unassigned recitation
    | "new_message"               // student+reader+admin: new direct message received
    | "new_announcement"          // student+reader: new announcement published
    | "new_contact_message"       // admin: new contact form message
    | "reschedule_request"         // student+reader: reschedule proposed
    | "reschedule_accepted"        // student+reader: reschedule accepted
    | "reschedule_rejected"        // student+reader: reschedule rejected
    | "reader_reassigned"          // student+reader: admin reassigned reader
    | "recitation_reassigned"     // reader: admin took the recitation from them and reassigned it
    // Academy calendar / tasks / reminders
    | "session_60min"             // student: 60 min before live session
    | "session_10min"             // student: 10 min before live session
    | "task_morning"              // student: daily morning reminder of today's tasks
    | "task_overdue"              // student: task past its deadline
    | "task_assigned"             // student: teacher assigned a new task
    | "task_marked_done"          // teacher: student self-marked a task done
    | "memorization_goal_set"     // student: teacher set a weekly memorization goal
    | "memorization_goal_completed" // teacher+student: goal completed
    | "general"

export interface CreateNotificationInput {
    userId: string
    type: NotificationType
    title: string
    message: string
    category?:
        | "recitation" | "session" | "account" | "general" | "message"
        | "announcement" | "booking" | "course" | "task" | "reminder"
        | "goal" | "system" | "review"
    link?: string                 // optional navigation link
    relatedRecitationId?: string
    relatedBookingId?: string
    /**
     * Optional idempotency key, scoped per-user. If a notification with the
     * same (user_id, dedup_key) already exists, this insert is a no-op.
     * Used by /api/cron/academy-reminders to avoid spamming users when the
     * scheduler runs more frequently than the reminder window.
     */
    dedupKey?: string
}

/**
 * Creates a notification record in the database.
 * Safe to call from any API route or server action.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
    try {
        await query(
            `INSERT INTO notifications (
        user_id, type, title, message, category, action_url,
        related_recitation_id, related_booking_id, dedup_key,
        is_read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, NOW())
       ON CONFLICT (user_id, dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING`,
            [
                input.userId,
                input.type,
                input.title,
                input.message,
                input.category || "general",
                input.link || null,
                input.relatedRecitationId || null,
                input.relatedBookingId || null,
                input.dedupKey || null,
            ]
        )
    } catch (err: any) {
        // If the partial unique index isn't in place yet (migration not run),
        // fall back to a plain insert without ON CONFLICT.
        if (err?.code === "42P10" || err?.code === "42703") {
            try {
                await query(
                    `INSERT INTO notifications (
                user_id, type, title, message, category, action_url,
                related_recitation_id, related_booking_id, is_read, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW())`,
                    [
                        input.userId,
                        input.type,
                        input.title,
                        input.message,
                        input.category || "general",
                        input.link || null,
                        input.relatedRecitationId || null,
                        input.relatedBookingId || null,
                    ]
                )
                return
            } catch (fallbackErr: any) {
                console.error("[notifications] Fallback insert failed:", fallbackErr?.message)
            }
        }
        console.error("[notifications] Failed to create notification:", {
            error: err?.message,
            code: err?.code,
            detail: err?.detail,
            constraint: err?.constraint,
            type: input.type,
            category: input.category,
            userId: input.userId,
        })
    }
}

/**
 * Bulk-create notifications for multiple users at once.
 */
export async function createNotificationForMany(
    userIds: string[],
    data: Omit<CreateNotificationInput, "userId">
): Promise<void> {
    for (const userId of userIds) {
        await createNotification({ ...data, userId })
    }
}

/**
 * Get all admin user IDs from the database
 */
export async function getAdminUserIds(): Promise<string[]> {
    try {
        const result = await query(
            `SELECT id FROM users WHERE role IN ('admin', 'academy_admin') AND is_active = true`
        )
        return (result as any[]).map(row => row.id)
    } catch (error) {
        console.error("Failed to get admin user IDs:", error)
        return []
    }
}

/**
 * Create notification for all admin users
 */
export async function createNotificationForAdmins(
    data: Omit<CreateNotificationInput, "userId">
): Promise<void> {
    const adminIds = await getAdminUserIds()
    if (adminIds.length > 0) {
        await createNotificationForMany(adminIds, data)
    }
}
