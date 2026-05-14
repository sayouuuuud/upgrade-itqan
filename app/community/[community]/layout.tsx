import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import {
  accessibleCommunities,
  canAccessCommunity,
  canModerate,
  canPublishArticle,
} from "@/lib/community/permissions"
import { CommunityNav } from "@/components/community/community-nav"
import type { Community } from "@/lib/community/types"

const VALID: Community[] = ["academy", "maqraa"]

export default async function CommunityLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ community: string }>
}) {
  const { community } = await params
  if (!VALID.includes(community as Community)) {
    notFound()
  }

  const session = await getSession()
  if (!session) {
    redirect(`/login?next=/community/${community}`)
  }

  const c = community as Community
  if (!canAccessCommunity(session, c)) {
    redirect("/")
  }

  return (
    <>
      <CommunityNav
        community={c}
        canModerate={canModerate(session, c)}
        canReview={canPublishArticle(session, c)}
        alsoHasCommunities={accessibleCommunities(session)}
      />
      <div className="container mx-auto px-3 py-6">{children}</div>
    </>
  )
}
