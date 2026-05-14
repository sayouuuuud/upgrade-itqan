import { ArticleList } from "@/components/community/article-list"
import type { Community } from "@/lib/community/types"

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ community: string }>
}) {
  const { community } = await params
  return <ArticleList community={community as Community} />
}
