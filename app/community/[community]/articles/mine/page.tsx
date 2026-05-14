import { ArticleMine } from "@/components/community/article-mine"
import type { Community } from "@/lib/community/types"

export default async function MyArticlesPage({
  params,
}: {
  params: Promise<{ community: string }>
}) {
  const { community } = await params
  return <ArticleMine community={community as Community} />
}
