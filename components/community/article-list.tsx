"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Clock,
  Heart,
  MessageCircle,
  Search,
  User as UserIcon,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import {
  ACADEMY_ARTICLE_CATEGORIES,
  CATEGORY_LABELS_AR,
  MAQRAA_ARTICLE_CATEGORIES,
} from "@/lib/community/types"
import type { Article, Community } from "@/lib/community/types"

interface ArticleListProps {
  community: Community
}

const CATS = {
  academy: ACADEMY_ARTICLE_CATEGORIES,
  maqraa: MAQRAA_ARTICLE_CATEGORIES,
} as const

export function ArticleList({ community }: ArticleListProps) {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const categories = CATS[community]
  const labels = (id: string) => (isAr ? CATEGORY_LABELS_AR[id] || id : id)

  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, community])

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ community })
      if (category !== "all") params.set("category", category)
      if (search.trim()) params.set("search", search.trim())
      const res = await fetch(`/api/community/articles?${params}`)
      const data = await res.json()
      if (res.ok) setArticles(data.articles || [])
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return articles
    const q = search.toLowerCase()
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.excerpt || "").toLowerCase().includes(q)
    )
  }, [articles, search])

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">
            {isAr ? "المقالات والإرشادات" : "Articles & Guides"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "محتوى تعليمي وتوعوي من المعلمين والمشرفين"
              : "Educational content from teachers and supervisors"}
          </p>
        </div>
        <Link href={`/community/${community}/articles/mine`}>
          <Button variant="outline">
            <BookOpen className="w-4 h-4 ml-1" />
            {isAr ? "مقالاتي" : "My articles"}
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث في المقالات…" : "Search articles…"}
            className="pr-10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={category === "all" ? "default" : "outline"}
            onClick={() => setCategory("all")}
          >
            {isAr ? "الكل" : "All"}
          </Button>
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "default" : "outline"}
              onClick={() => setCategory(c)}
            >
              {labels(c)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">
          {isAr ? "جارٍ التحميل…" : "Loading…"}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            {isAr ? "لا توجد مقالات منشورة بعد" : "No articles yet"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <Link
              key={a.id}
              href={`/community/${community}/articles/${a.slug}`}
            >
              <Card className="h-full hover:border-primary/40 transition-colors overflow-hidden">
                {a.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.cover_image_url}
                    alt=""
                    className="w-full h-44 object-cover"
                  />
                )}
                <CardContent className="p-4 space-y-2">
                  <Badge variant="secondary">{labels(a.category)}</Badge>
                  <h3 className="font-bold text-foreground line-clamp-2">
                    {a.title}
                  </h3>
                  {a.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {a.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5" />
                      {a.author_name}
                    </span>
                    {a.reading_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {a.reading_minutes}{" "}
                        {isAr ? "د قراءة" : "min read"}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      {a.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {a.comments_count}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
