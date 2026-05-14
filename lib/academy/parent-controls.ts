import { query, queryOne } from "@/lib/db"

export type RestrictionType = "surah" | "course" | "tajweed_path" | "memorization_path"

export interface ParentChildLink {
  id: string
  parent_id: string
  child_id: string
}

export interface ContentRestriction {
  id: string
  parent_child_id: string
  restriction_type: RestrictionType
  target_id: string
  is_blocked: boolean
}

export interface RestrictionDecision {
  allowed: boolean
  reason?: "blocked" | "not_in_allowlist"
}

export interface RestrictionList {
  allowedIds: Set<string>
  blockedIds: Set<string>
  hasAllowList: boolean
}

export const SURAH_NAMES = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس",
]

export function normalizeRestrictionTarget(value: string | number): string {
  return String(value).trim()
}

export async function getActiveParentChildLink(
  parentId: string,
  childId: string,
): Promise<ParentChildLink | null> {
  return queryOne<ParentChildLink>(
    `SELECT id, parent_id, child_id
       FROM parent_children
      WHERE parent_id = $1
        AND child_id = $2
        AND status IN ('active', 'approved')
      LIMIT 1`,
    [parentId, childId],
  )
}

export async function getStudentRestrictions(
  studentId: string,
  restrictionType: RestrictionType,
): Promise<RestrictionList> {
  const rows = await query<{ target_id: string; is_blocked: boolean }>(
    `SELECT pcr.target_id, pcr.is_blocked
       FROM parent_content_restrictions pcr
       JOIN parent_children pc ON pc.id = pcr.parent_child_id
      WHERE pc.child_id = $1
        AND pc.status IN ('active', 'approved')
        AND pcr.restriction_type = $2`,
    [studentId, restrictionType],
  ).catch(() => [])

  const allowedIds = new Set<string>()
  const blockedIds = new Set<string>()
  for (const row of rows) {
    const targetId = normalizeRestrictionTarget(row.target_id)
    if (row.is_blocked) {
      blockedIds.add(targetId)
    } else {
      allowedIds.add(targetId)
    }
  }

  return {
    allowedIds,
    blockedIds,
    hasAllowList: allowedIds.size > 0,
  }
}

export function decideRestriction(list: RestrictionList, targetId: string): RestrictionDecision {
  const normalized = normalizeRestrictionTarget(targetId)
  if (list.blockedIds.has(normalized)) {
    return { allowed: false, reason: "blocked" }
  }
  if (list.hasAllowList && !list.allowedIds.has(normalized)) {
    return { allowed: false, reason: "not_in_allowlist" }
  }
  return { allowed: true }
}

export async function isTargetAllowedForStudent(
  studentId: string,
  restrictionType: RestrictionType,
  targetId: string | number,
): Promise<RestrictionDecision> {
  const list = await getStudentRestrictions(studentId, restrictionType)
  return decideRestriction(list, normalizeRestrictionTarget(targetId))
}

export async function getParentChildRestrictions(
  parentId: string,
  childId: string,
): Promise<ContentRestriction[]> {
  const link = await getActiveParentChildLink(parentId, childId)
  if (!link) return []

  return query<ContentRestriction>(
    `SELECT id, parent_child_id, restriction_type, target_id, is_blocked
       FROM parent_content_restrictions
      WHERE parent_child_id = $1
      ORDER BY restriction_type, target_id`,
    [link.id],
  ).catch(() => [])
}

export async function replaceParentChildAllowList(
  parentId: string,
  childId: string,
  restrictions: Record<RestrictionType, string[]>,
): Promise<boolean> {
  const link = await getActiveParentChildLink(parentId, childId)
  if (!link) return false

  await query(`DELETE FROM parent_content_restrictions WHERE parent_child_id = $1`, [link.id])

  for (const [restrictionType, values] of Object.entries(restrictions) as Array<[RestrictionType, string[]]>) {
    const uniqueValues = Array.from(new Set(values.map(normalizeRestrictionTarget).filter(Boolean)))
    for (const targetId of uniqueValues) {
      await query(
        `INSERT INTO parent_content_restrictions
          (parent_child_id, restriction_type, target_id, is_blocked)
         VALUES ($1, $2, $3, FALSE)
        `,
        [link.id, restrictionType, targetId],
      )
    }
  }

  return true
}
