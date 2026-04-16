import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getPrayerTimes, isWithinTimeWindow } from "@/lib/external/aladhan-api"

/**
 * POST /api/cron/werd-reminders
 * 
 * Cron job to send daily Werd (Quran reading) reminders to students.
 * Should be triggered by Vercel Cron or external scheduler.
 * 
 * Sends notifications:
 * - After Fajr: Morning Werd reminder
 * - After Maghrib: Evening Werd reminder
 * 
 * Authorization: Requires CRON_SECRET header
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret for security
    const cronSecret = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace("Bearer ", "")
    
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Default location for prayer times (can be made configurable)
    const prayerTimes = await getPrayerTimes("Riyadh", "Saudi Arabia", "makkah")

    // Check if we're within 1 hour after Fajr or Maghrib
    const isAfterFajr = isWithinTimeWindow(prayerTimes.fajr, 60)
    const isAfterMaghrib = isWithinTimeWindow(prayerTimes.maghrib, 60)

    if (!isAfterFajr && !isAfterMaghrib) {
      return NextResponse.json({
        success: true,
        message: "ليس وقت إرسال تذكيرات الورد",
        currentTime: new Date().toISOString(),
        fajrTime: prayerTimes.fajr,
        maghribTime: prayerTimes.maghrib
      })
    }

    // Determine notification type based on time
    const notificationType = isAfterFajr ? "fajr_werd" : "maghrib_werd"
    const notificationTitle = isAfterFajr 
      ? "ورد الصباح - حان وقت القراءة" 
      : "ورد المساء - حان وقت القراءة"
    const notificationMessage = isAfterFajr
      ? "صباح الخير! لا تنسَ قراءة وردك اليومي من القرآن الكريم. اللهم اجعل القرآن ربيع قلوبنا."
      : "مساء الخير! حان وقت ورد المساء. اقرأ وردك اليومي واختم يومك بذكر الله."

    // Get all active students
    const students = await query<{ id: string; name: string }>(
      `SELECT id, name FROM users 
       WHERE role = 'student' 
       AND is_active = true`
    )

    if (students.length === 0) {
      return NextResponse.json({
        success: true,
        message: "لا يوجد طلاب نشطين لإرسال التذكيرات"
      })
    }

    // Check for already sent notifications today to avoid duplicates
    const today = new Date().toISOString().split('T')[0]
    const existingNotifications = await query<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM notifications 
       WHERE type = $1 
       AND DATE(created_at) = $2`,
      [notificationType, today]
    )

    const sentToUserIds = new Set(existingNotifications.map(n => n.user_id))

    // Filter students who haven't received notification today
    const studentsToNotify = students.filter(s => !sentToUserIds.has(s.id))

    if (studentsToNotify.length === 0) {
      return NextResponse.json({
        success: true,
        message: "تم إرسال التذكيرات لجميع الطلاب مسبقاً اليوم",
        totalStudents: students.length
      })
    }

    // Insert notifications for all students
    let notificationsSent = 0

    for (const student of studentsToNotify) {
      try {
        await query(
          `INSERT INTO notifications (
            user_id, type, title, message, category, priority, action_url, action_label
          ) VALUES ($1, $2, $3, $4, 'system', 'normal', '/student/quran', 'ابدأ القراءة')`,
          [student.id, notificationType, notificationTitle, notificationMessage]
        )
        notificationsSent++
      } catch (err) {
        console.error(`[CronWerd] Failed to notify student ${student.id}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم إرسال تذكيرات الورد بنجاح`,
      stats: {
        totalStudents: students.length,
        notificationsSent,
        skipped: students.length - notificationsSent,
        type: isAfterFajr ? "فجر" : "مغرب",
        prayerTime: isAfterFajr ? prayerTimes.fajr : prayerTimes.maghrib
      }
    })
  } catch (error) {
    console.error("[CronWerd] Error sending werd reminders:", error)
    return NextResponse.json({ 
      error: "حدث خطأ في إرسال تذكيرات الورد" 
    }, { status: 500 })
  }
}

// Also support GET for testing (without sending notifications)
export async function GET(req: NextRequest) {
  try {
    const prayerTimes = await getPrayerTimes("Riyadh", "Saudi Arabia", "makkah")
    
    const isAfterFajr = isWithinTimeWindow(prayerTimes.fajr, 60)
    const isAfterMaghrib = isWithinTimeWindow(prayerTimes.maghrib, 60)

    return NextResponse.json({
      status: "ready",
      currentTime: new Date().toISOString(),
      prayerTimes: {
        fajr: prayerTimes.fajr,
        maghrib: prayerTimes.maghrib
      },
      shouldSendReminders: isAfterFajr || isAfterMaghrib,
      reminderType: isAfterFajr ? "fajr_werd" : isAfterMaghrib ? "maghrib_werd" : null,
      hijriDate: prayerTimes.date.hijri
    })
  } catch (error) {
    console.error("[CronWerd] Error checking status:", error)
    return NextResponse.json({ error: "Error checking status" }, { status: 500 })
  }
}
