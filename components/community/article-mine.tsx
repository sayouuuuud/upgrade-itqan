"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import {
  CATEGORY_LABELS_AR,
} from "@/lib/community/types"
import type {
  Article,
  Community,
} from "@/lib/community/types"

interface ArticleMineProps {
  community: Community
}

const STATUS_VARIANT: Record<string, string> = {
  draft: "bg-muted text-foreground",
  pending_review: "bg-amber-500/20 text-amber-700",
  published: "bg-emerald-500/20 text-emerald-700",
  rejected: "bg-rose-500/20 text-rose-700",
  archived: "bg-slate-500/20 text-slate-700",
}

export function ArticleMine({ community }: ArticleMineProps) {
  const { locale } = useI18n()
  const isAr = locale === "ar"

  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [community])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/community/articles/mine?community=${community}`
      )
      const data = await res.json()
      if (res.ok) setArticles(data.articles || [])
    } finally {
      setLoading(false)
    }
  }

  const statusLabel = (s: string): string => {
    if (!isAr) return s.replace("_", " ")
    return {
      draft: "مسودة",
      pending_review: "قيد المراجعة",
      published: "منشور",
      rejected: "مرفوض",
      archived: "مؤرشف",
    }[s] || s
  }

  const labels = (id: string) => (isAr ? CATEGORY_LABELS_AR[id] || id : id)

  return (
    <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {isAr ? "مقالاتي" : "My articles"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "كل المقالات التي كتبتَها، بما فيها المسودات."
              : "All your articles including drafts."}
          </p>
        </div>
        <Link href={`/community/${community}/articles/new`}>
          <Button>
            <Plus className="w-4 h-4 ml-1" />
            {isAr ? "مقال جديد" : "New article"}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">
          {isAr ? "جارٍ التحميل…" : "Loading…"}
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {isAr ? "لم تكتب مقالات بعد" : "You haven't written any articles yet"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold truncate">{a.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md ${
                        STATUS_VARIANT[a.status] || ""
                      }`}
                    >
                      {statusLabel(a.status)}
                    </span>
                    <Badge variant="secondary">{labels(a.category)}</Badge>
                  </div>
                  {a.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {a.excerpt}
                    </p>
                  )}
                  {a.rejected_reason && (
                    <p className="text-xs text-rose-600 mt-1">
                      {isAr ? "سبب الرفض: " : "Rejected: "}
                      {a.rejected_reason}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(a.updated_at).toLocaleDateString(
                      isAr ? "ar-EG" : "en-US"
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {a.status === "published" && (
                    <Link
                      href={`/community/${community}/articles/${a.slug}`}
                    >
                      <Button variant="outline" size="sm">
                        {isAr ? "عرض" : "View"}
                      </Button>
                    </Link>
                  )}
                  {["draft", "rejected"].includes(a.status) && (
                    <Link
                      href={`/community/${community}/articles/edit/${a.id}`}
                    >
                      <Button variant="outline" size="sm">
                        <Pencil className="w-3.5 h-3.5 ml-1" />
                        {isAr ? "تحرير" : "Edit"}
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
