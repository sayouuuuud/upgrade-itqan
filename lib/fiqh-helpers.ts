import { query, queryOne } from '@/lib/db'
import { createNotification, getAdminUserIds } from '@/lib/notifications'

export interface FiqhOfficer {
  officer_id: string
  user_id: string
  user_name: string
  user_email: string
  open_count: number
}

/**
 * Pick the active officer for a given category with the smallest open queue.
 * Returns null if no officer is registered for the category.
 */
export async function pickOfficerForCategory(
  categoryId: string
): Promise<FiqhOfficer | null> {
  const rows = await query<FiqhOfficer>(
    `SELECT
        o.id  AS officer_id,
        o.user_id,
        u.name  AS user_name,
        u.email AS user_email,
        COALESCE((
          SELECT COUNT(*)::int
          FROM fiqh_questions q
          WHERE q.assigned_to = o.user_id
            AND q.status IN ('assigned','in_progress','answered','awaiting_consent')
        ), 0) AS open_count
      FROM fiqh_officers o
      JOIN fiqh_officer_categories oc ON oc.officer_id = o.id
      JOIN users u                    ON u.id = o.user_id
      WHERE o.is_active = TRUE
        AND oc.category_id = $1
      ORDER BY open_count ASC, o.created_at ASC
      LIMIT 1`,
    [categoryId]
  )
  return rows[0] ?? null
}

/**
 * Returns true if userId is an active fiqh officer.
 */
export async function isOfficer(userId: string): Promise<boolean> {
  const r = await queryOne<{ id: string }>(
    `SELECT id FROM fiqh_officers WHERE user_id = $1 AND is_active = TRUE LIMIT 1`,
    [userId]
  )
  return !!r
}

/**
 * Returns true if userId may access the question (asker, assigned officer, admin,
 * or any fiqh_supervisor / supervisor — the latter act as admins for fiqh).
 */
export async function canAccessQuestion(
  userId: string,
  role: string,
  questionId: string
): Promise<{
  allowed: boolean
  perspective: 'asker' | 'officer' | 'admin' | null
}> {
  if (
    role === 'admin' ||
    role === 'academy_admin' ||
    role === 'fiqh_supervisor' ||
    role === 'supervisor'
  ) {
    return { allowed: true, perspective: 'admin' }
  }
  const q = await queryOne<{ asked_by: string; assigned_to: string | null }>(
    `SELECT asked_by, assigned_to FROM fiqh_questions WHERE id = $1 LIMIT 1`,
    [questionId]
  )
  if (!q) return { allowed: false, perspective: null }
  if (q.asked_by === userId) return { allowed: true, perspective: 'asker' }
  if (q.assigned_to === userId) return { allowed: true, perspective: 'officer' }
  return { allowed: false, perspective: null }
}

/**
 * Resolve a category by either its UUID or its `slug` string.
 * Returns null if no matching category is found.
 */
export async function resolveCategory(
  idOrSlug: string
): Promise<{ id: string; slug: string; name_ar: string } | null> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    )
  const row = await queryOne<{ id: string; slug: string; name_ar: string }>(
    isUuid
      ? `SELECT id, slug, name_ar FROM fiqh_categories WHERE id = $1 AND is_active = TRUE LIMIT 1`
      : `SELECT id, slug, name_ar FROM fiqh_categories WHERE slug = $1 AND is_active = TRUE LIMIT 1`,
    [idOrSlug]
  )
  return row ?? null
}

interface NotifyNewQuestionOptions {
  questionId: string
  categoryId: string
  categoryNameAr: string
  askerName: string
  isAnonymous: boolean
  assignedOfficerUserId: string | null
}

/**
 * Notify the relevant parties when a new question is submitted:
 *  - The assigned officer (if any) gets a high-priority alert.
 *  - All admins / academy admins always get a copy (per product spec:
 *    "نسخة من السؤال تروح للأدمن"), so they can keep an eye on the
 *    workflow even when an officer is handling it.
 */
export async function notifyNewFiqhQuestion(opts: NotifyNewQuestionOptions) {
  const { questionId, categoryNameAr, askerName, isAnonymous, assignedOfficerUserId } =
    opts
  const displayAsker = isAnonymous ? 'سائل مجهول' : askerName

  if (assignedOfficerUserId) {
    await createNotification({
      userId: assignedOfficerUserId,
      type: 'general',
      category: 'fiqh',
      title: 'سؤال فقهي جديد',
      message: `سؤال جديد في تصنيف ${categoryNameAr} ينتظر الإجابة (من ${displayAsker}).`,
      link: `/academy/fiqh-supervisor/questions/${questionId}`,
    }).catch(() => {})
  }

  const adminIds = await getAdminUserIds()
  for (const adminId of adminIds) {
    // Don't double-notify if the officer happens to also be an admin
    if (adminId === assignedOfficerUserId) continue
    await createNotification({
      userId: adminId,
      type: 'general',
      category: 'fiqh',
      title: assignedOfficerUserId ? 'سؤال فقهي جديد (مُسند)' : 'سؤال فقهي بدون مسؤول',
      message: assignedOfficerUserId
        ? `تم تعيين سؤال في ${categoryNameAr} لمسؤول. نسخة للمتابعة.`
        : `سؤال جديد في ${categoryNameAr} لا يوجد مسؤول مختص — يحتاج تعيين.`,
      link: `/academy/admin/fiqh/${questionId}`,
    }).catch(() => {})
  }
}
