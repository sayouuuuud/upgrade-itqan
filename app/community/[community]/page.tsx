import { redirect } from "next/navigation"

export default async function CommunityIndex({
  params,
}: {
  params: Promise<{ community: string }>
}) {
  const { community } = await params
  redirect(`/community/${community}/forum`)
}
