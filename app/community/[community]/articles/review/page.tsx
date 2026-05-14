import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { canPublishArticle } from "@/lib/community/permissions"
import { ArticleReviewQueue } from "@/components/community/article-review-queue"
import type { Community } from "@/lib/community/types"

export default async function ArticleReviewPage({
  params,
}: {
  params: Promise<{ community: string }>
}) {
  const { community } = await params
  const session = await getSession()
  if (!session || !canPublishArticle(session, community as Community)) {
    redirect(`/community/${community}/articles`)
  }
  return <ArticleReviewQueue community={community as Community} />
}
