// Helpers for the community_bans table. Kept separate from permissions.ts
// because they touch the database (permissions.ts is pure / cookie-only).

import { queryOne } from "@/lib/db"
import type { Community } from "./types"

/**
 * Returns true if the user is currently banned from the given community.
 * Expired bans are treated as inactive.
 */
export async function isUserBanned(
  userId: string,
  community: Community
): Promise<boolean> {
  if (!userId) return false
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM community_bans
     WHERE user_id = $1
       AND community = $2
       AND (expires_at IS NULL OR expires_at > NOW())
     LIMIT 1`,
    [userId, community]
  )
  return !!row
}
