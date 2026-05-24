import { redirect, notFound } from "next/navigation"
import { getSession } from "@/lib/auth"
import {
  canAccessCommunity,
  canModerate,
  isCommunityAdmin,
} from "@/lib/community/permissions"
import { ThreadPageClient } from "@/components/community/thread-page-client"
import type { Community } from "@/lib/community/types"

const VALID: Community[] = ["academy", "maqraa"]

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ community: string; id: string }>
}) {
  const { community, id } = await params
  if (!VALID.includes(community as Community)) {
    notFound()
  }
  const session = await getSession()
  if (!session) {
    redirect(`/login?next=/community/${community}/forum/${id}`)
  }
  const c = community as Community
  if (!canAccessCommunity(session, c)) {
    redirect("/")
  }

  return (
    <ThreadPageClient
      community={c}
      postId={id}
      meId={session.sub}
      canModerate={canModerate(session, c)}
      isAdmin={isCommunityAdmin(session, c)}
    />
  )
}
