"use client"

// Top-level community forum view. Wraps ForumShell (3-column layout) +
// ForumFeed (center column). Used by both the public forum page and the
// consultations (Q&A) page.

import { useEffect, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ForumShell } from "./forum-shell"
import { ForumFeed } from "./forum-feed"
import type { Community, PostType } from "@/lib/community/types"

interface ForumBoardProps {
  community: Community
  postType?: PostType
  /** Show the discussion/qna switcher in the sidebar. */
  showPostTypeSwitcher?: boolean
  /** Tag the page as the admin browse view (passes extra UI affordances). */
  isAdminView?: boolean
}

interface MeResponse {
  user?: {
    id: string
    role: string
  }
}

export function ForumBoard({
  community,
  postType: initialPostType = "discussion",
  showPostTypeSwitcher,
  isAdminView,
}: ForumBoardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [postType, setPostType] = useState<PostType>(initialPostType)
  const [category, setCategory] = useState<string>(
    searchParams?.get("category") || "all"
  )
  const [capabilities, setCapabilities] = useState({
    isModerator: false,
    isAdmin: false,
  })

  useEffect(() => {
    fetch(`/api/auth/me`)
      .then((r) => r.json())
      .then((data: MeResponse) => {
        const role = data?.user?.role
        const mod = !!role && (
          role === "admin" ||
          role.includes("supervisor") ||
          role === "academy_admin"
        )
        const admin = !!role && (
          role === "admin" ||
          role === "academy_admin" ||
          (community === "maqraa" && role === "reciter_supervisor")
        )
        setCapabilities({ isModerator: mod, isAdmin: admin })
      })
      .catch(() => undefined)
  }, [community])

  // Keep ?category= in the URL so admins / mods can deep-link.
  useEffect(() => {
    const sp = new URLSearchParams(searchParams?.toString() || "")
    if (category && category !== "all") sp.set("category", category)
    else sp.delete("category")
    const query = sp.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  return (
    <ForumShell
      community={community}
      postType={postType}
      category={category}
      onCategoryChange={setCategory}
      onPostTypeChange={showPostTypeSwitcher ? setPostType : undefined}
      canModerate={capabilities.isModerator}
      isAdmin={capabilities.isAdmin || !!isAdminView}
      onPostCreated={() => {
        // Force the feed to reload by toggling a no-op state. We re-mount
        // the feed by setting category to itself, which triggers its reload.
        setCategory((c) => (c === "all" ? "all" : c))
      }}
    >
      <ForumFeed
        community={community}
        postType={postType}
        category={category}
      />
    </ForumShell>
  )
}
