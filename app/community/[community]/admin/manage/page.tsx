import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { isCommunityAdmin } from "@/lib/community/permissions"
import { ManagePageClient } from "@/components/community/admin/manage-page-client"
import type { Community } from "@/lib/community/types"

const VALID: Community[] = ["academy", "maqraa"]

/**
 * Admin "full control" page — tabbed UI containing:
 *   - Posts: bulk-action table with filters & status counters
 *   - Members: ban/unban members with reason & duration
 *   - Rules: edit the sidebar rules list
 *   - Reports: existing moderation queue, embedded for convenience
 */
export default async function ManagePage({
  params,
}: {
  params: Promise<{ community: string }>
}) {
  const { community } = await params
  if (!VALID.includes(community as Community)) {
    notFound()
  }
  const session = await getSession()
  if (!session) {
    redirect(`/login?next=/community/${community}/admin/manage`)
  }
  const c = community as Community
  if (!isCommunityAdmin(session, c)) {
    redirect(`/community/${c}/forum`)
  }

  return <ManagePageClient community={c} />
}
