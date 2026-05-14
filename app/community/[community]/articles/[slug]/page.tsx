import { ArticleReader } from "@/components/community/article-reader"
import type { Community } from "@/lib/community/types"

export default async function ArticleReadPage({
  params,
}: {
  params: Promise<{ community: string; slug: string }>
}) {
  const { community, slug } = await params
  return <ArticleReader community={community as Community} slug={slug} />
}
