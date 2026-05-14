// Helpers for parent-child relationship and access control
import { query, queryOne } from "@/lib/db"

export interface ParentChildLink {
  id: string
  parent_id: string
  child_id: string
  relation: string
  status: string
  link_code: string | null
  link_code_expires_at: string | null
  requested_at: string
  confirmed_at: string | null
  rejected_at: string | null
  created_at: string
}

/**
 * Verify the given parent has an ACTIVE link to the given child.
 * Returns the link row when active, null otherwise.
 */
export async function getActiveParentChild(
  parentId: string,
  childId: string
): Promise<ParentChildLink | null> {
  return queryOne<ParentChildLink>(
    `SELECT * FROM parent_children
     WHERE parent_id = $1 AND child_id = $2 AND status = 'active'
     LIMIT 1`,
    [parentId, childId]
  )
}

/**
 * Generate a 6-digit numeric link code.
 */
export function generateLinkCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Check if a child has any active parent links and whether a given target
 * (surah or path id) is blocked.
 *
 * Returns true when the action should be blocked.
 *
 * Default policy: ALLOW everything unless an active parent has explicitly
 * blocked the resource.
 */
export async function isContentBlockedForStudent(
  studentId: string,
  restrictionType: "surah" | "memorization_path" | "tajweed_path",
  targetId: string
): Promise<{ blocked: boolean; parentName?: string }> {
  const row = await queryOne<{ parent_name: string }>(
    `SELECT u.name AS parent_name
     FROM parent_children pc
     JOIN parent_content_restrictions pcr ON pcr.parent_child_id = pc.id
     JOIN users u ON u.id = pc.parent_id
     WHERE pc.child_id = $1
       AND pc.status = 'active'
       AND pcr.restriction_type = $2
       AND pcr.target_id = $3
       AND pcr.is_blocked = TRUE
     LIMIT 1`,
    [studentId, restrictionType, targetId]
  )

  if (row) return { blocked: true, parentName: row.parent_name }
  return { blocked: false }
}
