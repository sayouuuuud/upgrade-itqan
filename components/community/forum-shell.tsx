"use client"

// The 3-column Reddit-style layout used by the forum browse pages.
// Center slot is provided by the caller (feed or thread). Side rails
// render their own data.

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { ForumSidebar } from "./forum-sidebar"
import { ForumRightRail } from "./forum-right-rail"
import { PostCreateDialog } from "./post-create-dialog"
import type {
  Community,
  ForumPost,
  PostType,
} from "@/lib/community/types"

interface ForumShellProps {
  community: Community
  postType: PostType
  category: string
  onCategoryChange: (c: string) => void
  onPostTypeChange?: (t: PostType) => void
  canModerate?: boolean
  isAdmin?: boolean
  onPostCreated?: (post: ForumPost) => void
  /** Center column content. */
  children: React.ReactNode
}

export function ForumShell({
  community,
  postType,
  category,
  onCategoryChange,
  onPostTypeChange,
  canModerate,
  isAdmin,
  onPostCreated,
  children,
}: ForumShellProps) {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_300px] gap-4">
      <ForumSidebar
        community={community}
        postType={postType}
        category={category}
        onCategory={onCategoryChange}
        onPostTypeChange={onPostTypeChange}
        onCreate={() => setCreateOpen(true)}
        canModerate={canModerate}
        isAdmin={isAdmin}
      />

      <main className="min-w-0">{children}</main>

      <div className="hidden lg:block">
        <ForumRightRail community={community} />
      </div>

      <PostCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        community={community}
        defaultPostType={postType}
        onCreated={(p) => onPostCreated?.(p)}
      />
    </div>
  )
}

export function ForumShellCard({ children }: { children: React.ReactNode }) {
  return <Card className="p-4">{children}</Card>
}
