import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { canModerate } from "@/lib/community/permissions"
import { ModerationQueue } from "@/components/community/moderation-queue"
import type { Community } from "@/lib/community/types"

export default async function ModerationPage({
  params,
}: {
  params: Promise<{ community: string }>
}) {
  const { community } = await params
  const session = await getSession()
  if (!session || !canModerate(session, community as Community)) {
    redirect(`/community/${community}/forum`)
  }
  return <ModerationQueue community={community as Community} />
}
