"use client"

// Client-side wrapper for the thread detail route. We split this out of the
// server page because ThreadView (and the surrounding ForumShell) need
// React hooks.

import { useState } from "react"
import { ForumShell } from "./forum-shell"
import { ThreadView } from "./thread-view"
import type { Community } from "@/lib/community/types"

interface ThreadPageClientProps {
  community: Community
  postId: string
  meId: string
  canModerate: boolean
  isAdmin: boolean
}

export function ThreadPageClient({
  community,
  postId,
  meId,
  canModerate,
  isAdmin,
}: ThreadPageClientProps) {
  // We don't actually use category/postType here — the sidebar links go to
  // /forum, and the thread view doesn't depend on them. Keep them in state
  // so the sidebar renders the highlight cleanly.
  const [postType] = useState<"discussion" | "qna">("discussion")
  const [category, setCategory] = useState("all")

  return (
    <ForumShell
      community={community}
      postType={postType}
      category={category}
      onCategoryChange={(c) => {
        setCategory(c)
        // Navigating away from the thread when a category is clicked feels
        // natural (Reddit behaviour). We use plain location to avoid
        // shipping next/router everywhere.
        if (typeof window !== "undefined") {
          window.location.href = `/community/${community}/forum?category=${encodeURIComponent(
            c
          )}`
        }
      }}
      canModerate={canModerate}
      isAdmin={isAdmin}
    >
      <ThreadView
        community={community}
        postId={postId}
        meId={meId}
        capabilities={{ isModerator: canModerate, isAdmin }}
      />
    </ForumShell>
  )
}
