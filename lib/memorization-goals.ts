/**
 * Helpers for the weekly memorization-goal feature.
 *
 * The "academic week" starts on Saturday (matches the Arabic calendar
 * convention used everywhere else in the academy).  Given any date, this
 * helper returns the Saturday at 00:00 UTC of that week, formatted as
 * YYYY-MM-DD so it lines up with the DATE column on memorization_goals.
 */

/** Returns the Saturday that starts the week containing `date` (UTC). */
export function getWeekStart(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : new Date(date.getTime())
  // Saturday = 6 in JS getDay() (0 = Sunday).
  // Number of days to subtract to land on the most-recent Saturday.
  const dow = d.getUTCDay()
  const offset = (dow + 1) % 7 // Sat → 0, Sun → 1, ..., Fri → 6
  d.setUTCDate(d.getUTCDate() - offset)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString().split("T")[0]
}

/** Returns the Friday that ends the same week as `date` (UTC). */
export function getWeekEnd(date: Date | string): string {
  const start = new Date(getWeekStart(date) + "T00:00:00Z")
  start.setUTCDate(start.getUTCDate() + 6)
  return start.toISOString().split("T")[0]
}

export interface MemorizationGoal {
  id: string
  student_id: string
  set_by: string | null
  week_start: string
  surah_from: number | null
  ayah_from: number | null
  surah_to: number | null
  ayah_to: number | null
  target_verses: number
  notes: string | null
  status: "active" | "completed" | "missed"
  completed_at: string | null
  created_at: string
  updated_at: string
}
