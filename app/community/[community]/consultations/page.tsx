import { ForumBoard } from "@/components/community/forum-board"
import type { Community } from "@/lib/community/types"

export default async function ConsultationsPage({
  params,
}: {
  params: Promise<{ community: string }>
}) {
  const { community } = await params
  return <ForumBoard community={community as Community} postType="qna" />
}
