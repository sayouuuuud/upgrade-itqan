import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { isCommunityAdmin } from "@/lib/community/permissions"
import { ForumBoard } from "@/components/community/forum-board"
import type { Community } from "@/lib/community/types"

const VALID: Community[] = ["academy", "maqraa"]

/**
 * Admin "browse" page — same Reddit-style feed but with the admin link
 * shortcuts visible in the sidebar. Read-access stays normal; per-post
 * moderation actions are surfaced inline (pin/lock/hide).
 */
export default async function CommunityAdminPage({
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
    redirect(`/login?next=/community/${community}/admin`)
  }
  const c = community as Community
  if (!isCommunityAdmin(session, c)) {
    redirect(`/community/${c}/forum`)
  }

  return (
    <ForumBoard
      community={c}
      postType="discussion"
      showPostTypeSwitcher
      isAdminView
    />
  )
}
