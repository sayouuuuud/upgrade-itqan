import { ForumBoard } from "@/components/community/forum-board"
import type { Community } from "@/lib/community/types"

export default async function ForumPage({
  params,
}: {
  params: Promise<{ community: string }>
}) {
  const { community } = await params
  return <ForumBoard community={community as Community} postType="discussion" />
}
