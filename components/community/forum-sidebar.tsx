"use client"

// Left rail for the Reddit-style forum. Shows the community badge,
// "Create post" CTA, the category filter list and a couple of quick links
// (rules, all posts, my posts).

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Hash,
  MessageSquare,
  Plus,
  Sparkles,
  ShieldCheck,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import {
  ACADEMY_FORUM_CATEGORIES,
  CATEGORY_LABELS_AR,
  CATEGORY_LABELS_EN,
  MAQRAA_FORUM_CATEGORIES,
  type Community,
  type PostType,
} from "@/lib/community/types"

const CATEGORIES_BY_COMMUNITY = {
  academy: ACADEMY_FORUM_CATEGORIES,
  maqraa: MAQRAA_FORUM_CATEGORIES,
} as const

interface ForumSidebarProps {
  community: Community
  postType: PostType
  category: string
  categoriesCount?: Array<{ category: string; count: string }>
  onCategory: (c: string) => void
  onCreate: () => void
  onPostTypeChange?: (t: PostType) => void
  canModerate?: boolean
  isAdmin?: boolean
}

export function ForumSidebar({
  community,
  postType,
  category,
  categoriesCount,
  onCategory,
  onCreate,
  onPostTypeChange,
  canModerate,
  isAdmin,
}: ForumSidebarProps) {
  const { locale } = useI18n()
  const isAr = locale === "ar"

  const categories = CATEGORIES_BY_COMMUNITY[community]
  const labels = (id: string) =>
    isAr ? CATEGORY_LABELS_AR[id] || id : CATEGORY_LABELS_EN[id] || id

  const countFor = (c: string): number => {
    const row = categoriesCount?.find((x) => x.category === c)
    return row ? Number(row.count) : 0
  }

  return (
    <aside className="space-y-4">
      <Button className="w-full justify-start" onClick={onCreate}>
        <Plus className="w-4 h-4" />
        {isAr ? "إنشاء منشور جديد" : "Create post"}
      </Button>

      {onPostTypeChange && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => onPostTypeChange("discussion")}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
              postType === "discussion"
                ? "bg-primary/10 text-primary font-semibold"
                : "hover:bg-muted text-foreground"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {isAr ? "النقاش" : "Discussion"}
          </button>
          <button
            onClick={() => onPostTypeChange("qna")}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm border-t border-border transition-colors ${
              postType === "qna"
                ? "bg-primary/10 text-primary font-semibold"
                : "hover:bg-muted text-foreground"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {isAr ? "الاستشارات والسؤال والجواب" : "Q&A"}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 border-b border-border">
          <Hash className="w-3.5 h-3.5" />
          {isAr ? "الأقسام" : "Categories"}
        </div>
        <ul className="py-1">
          <li>
            <button
              onClick={() => onCategory("all")}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-sm transition-colors ${
                category === "all"
                  ? "bg-primary/10 text-primary font-semibold"
                  : "hover:bg-muted"
              }`}
            >
              <span>{isAr ? "كل الأقسام" : "All categories"}</span>
              {categoriesCount && (
                <Badge variant="secondary" className="h-5 px-1.5 font-normal">
                  {categoriesCount.reduce((s, c) => s + Number(c.count), 0)}
                </Badge>
              )}
            </button>
          </li>
          {categories.map((c) => (
            <li key={c}>
              <button
                onClick={() => onCategory(c)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-sm transition-colors ${
                  category === c
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-muted"
                }`}
              >
                <span>{labels(c)}</span>
                {categoriesCount && (
                  <Badge variant="secondary" className="h-5 px-1.5 font-normal">
                    {countFor(c)}
                  </Badge>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {(canModerate || isAdmin) && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 border-b border-border">
            <ShieldCheck className="w-3.5 h-3.5" />
            {isAr ? "إدارة" : "Moderation"}
          </div>
          <ul className="py-1 text-sm">
            {canModerate && (
              <li>
                <a
                  href={`/community/${community}/moderation`}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isAr ? "قائمة البلاغات" : "Reports queue"}
                </a>
              </li>
            )}
            {isAdmin && (
              <>
                <li>
                  <a
                    href={`/community/${community}/admin`}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {isAr ? "تصفّح المنتدى (إدارة)" : "Admin browse"}
                  </a>
                </li>
                <li>
                  <a
                    href={`/community/${community}/admin/manage`}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {isAr ? "التحكم الكامل" : "Full control"}
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 border-b border-border">
          <BookOpen className="w-3.5 h-3.5" />
          {isAr ? "المقالات والإرشادات" : "Articles & Guides"}
        </div>
        <a
          href={`/community/${community}/articles`}
          className="flex items-center justify-between px-3 py-2 text-sm hover:bg-muted"
        >
          {isAr ? "تصفح المقالات" : "Browse articles"}
          <span className="text-xs text-muted-foreground">→</span>
        </a>
      </div>
    </aside>
  )
}
