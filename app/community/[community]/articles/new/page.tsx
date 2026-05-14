import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { canAuthorArticle } from "@/lib/community/permissions"
import { ArticleEditor } from "@/components/community/article-editor"
import type { Community } from "@/lib/community/types"

export default async function NewArticlePage({
  params,
}: {
  params: Promise<{ community: string }>
}) {
  const { community } = await params
  const session = await getSession()
  if (!session) redirect("/login")
  if (!canAuthorArticle(session, community as Community)) {
    redirect(`/community/${community}/articles`)
  }
  return <ArticleEditor community={community as Community} />
}
