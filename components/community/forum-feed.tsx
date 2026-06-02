"use client"

// Center column of the forum. Handles sort selector, search, post fetch
// and pagination. Wraps PostCard.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Flame,
  Search,
  Sparkles,
  TrendingUp,
  Clock,
  HelpCircle,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { PostCard } from "./post-card"
import {
  type Community,
  type ForumPost,
  type PostType,
  type SortKey,
} from "@/lib/community/types"

interface ForumFeedProps {
  community: Community
  postType: PostType
  category: string
  hrefBase?: string
  /** Optional list to render instead of fetching (used by admin browse) */
  externalPosts?: ForumPost[]
  /** When fetching, append this query string (used by admin view) */
  extraQuery?: string
  /** Bump this number to force a reload (e.g. after creating a post). */
  reloadKey?: number
  /** When set, only fetch posts authored by this user id. */
  authorId?: string
}

const SORTS: { id: SortKey; icon: typeof Flame; label_ar: string; label_en: string }[] =
  [
    { id: "hot", icon: Flame, label_ar: "الأكثر تفاعلًا", label_en: "Hot" },
    { id: "new", icon: Clock, label_ar: "الأحدث", label_en: "New" },
    { id: "top", icon: TrendingUp, label_ar: "الأعلى", label_en: "Top" },
    {
      id: "unanswered",
      icon: HelpCircle,
      label_ar: "بلا إجابة",
      label_en: "Unanswered",
    },
  ]

export interface ForumFeedHandle {
  reload: () => void
  prepend: (post: ForumPost) => void
}

export function ForumFeed({
  community,
  postType,
  category,
  hrefBase,
  externalPosts,
  extraQuery,
  reloadKey,
  authorId,
}: ForumFeedProps) {
  const { locale } = useI18n()
  const isAr = locale === "ar"

  const [sort, setSort] = useState<SortKey>("hot")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [posts, setPosts] = useState<ForumPost[]>(externalPosts ?? [])
  const [loading, setLoading] = useState(!externalPosts)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [search])

  const params = useMemo(() => {
    const sp = new URLSearchParams()
    sp.set("community", community)
    sp.set("post_type", postType)
    sp.set("sort", sort)
    if (category && category !== "all") sp.set("category", category)
    if (debouncedSearch) sp.set("search", debouncedSearch)
    if (authorId) sp.set("author_id", authorId)
    sp.set("page", String(page))
    sp.set("page_size", "20")
    if (extraQuery) {
      for (const [k, v] of new URLSearchParams(extraQuery)) sp.set(k, v)
    }
    return sp.toString()
  }, [community, postType, sort, category, debouncedSearch, page, extraQuery, authorId])

  const load = useCallback(async () => {
    if (externalPosts) return
    setLoading(true)
    try {
      const res = await fetch(`/api/community/forum?${params}`)
      const data = await res.json()
      const next = data.posts ?? []
      setPosts((prev) => (page === 1 ? next : [...prev, ...next]))
      setHasMore(next.length === 20)
    } finally {
      setLoading(false)
    }
    // reloadKey is intentionally a dependency so a bump forces a refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPosts, params, page, reloadKey])

  useEffect(() => {
    if (externalPosts) {
      setPosts(externalPosts)
      return
    }
    setPage(1)
  }, [community, postType, category, sort, debouncedSearch, externalPosts, reloadKey, authorId])

  useEffect(() => {
    if (!externalPosts) load()
  }, [load, externalPosts])

  const replaceOne = (next: ForumPost) =>
    setPosts((prev) => prev.map((p) => (p.id === next.id ? next : p)))

  return (
    <div className="space-y-3">
      {/* search + sort bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث في المنتدى…" : "Search the forum…"}
            className="pr-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-card overflow-x-auto">
          {SORTS.map(({ id, icon: Icon, label_ar, label_en }) => {
            const active = sort === id
            return (
              <button
                key={id}
                onClick={() => setSort(id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                  active
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {isAr ? label_ar : label_en}
              </button>
            )
          })}
        </div>
      </div>

      {/* posts */}
      {loading && posts.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
          <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <div className="font-semibold mb-1">
            {isAr ? "لا توجد منشورات بعد" : "No posts yet"}
          </div>
          <div className="text-sm text-muted-foreground">
            {isAr
              ? "كن أول من ينشر في هذا القسم"
              : "Be the first to post in this section"}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              community={community}
              hrefBase={hrefBase}
              onChange={replaceOne}
            />
          ))}
        </div>
      )}

      {!externalPosts && hasMore && posts.length > 0 && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
          >
            {loading
              ? isAr ? "جارٍ التحميل…" : "Loading…"
              : isAr ? "تحميل المزيد" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  )
}
