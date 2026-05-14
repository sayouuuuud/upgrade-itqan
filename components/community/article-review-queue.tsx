"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/lib/i18n/context"
import { useToast } from "@/hooks/use-toast"
import { MarkdownView } from "./markdown-view"
import {
  CATEGORY_LABELS_AR,
} from "@/lib/community/types"
import type {
  Article,
  Community,
} from "@/lib/community/types"

interface ArticleReviewQueueProps {
  community: Community
}

interface QueueArticle extends Article {
  author_name: string
  author_avatar: string | null
}

export function ArticleReviewQueue({ community }: ArticleReviewQueueProps) {
  const { locale } = useI18n()
  const { toast } = useToast()
  const isAr = locale === "ar"

  const [items, setItems] = useState<QueueArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<QueueArticle | null>(null)
  const [activeContent, setActiveContent] = useState<string | null>(null)
  const [acting, setActing] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [community])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/community/articles/review-queue?community=${community}`
      )
      const data = await res.json()
      if (res.ok) setItems(data.articles || [])
    } finally {
      setLoading(false)
    }
  }

  const openArticle = async (a: QueueArticle) => {
    setActive(a)
    setActiveContent(null)
    const res = await fetch(`/api/community/articles/${a.id}`)
    const data = await res.json()
    if (res.ok) setActiveContent(data.article.content)
  }

  const action = async (act: "publish" | "reject", reason?: string) => {
    if (!active) return
    setActing(true)
    try {
      const res = await fetch(
        `/api/community/articles/${active.id}/workflow`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: act, reason }),
        }
      )
      const data = await res.json()
      if (res.ok) {
        toast({
          title:
            act === "publish"
              ? isAr ? "تم النشر" : "Published"
              : isAr ? "تم الرفض" : "Rejected",
        })
        setActive(null)
        setRejectOpen(false)
        setRejectReason("")
        load()
      } else {
        toast({ title: data.error, variant: "destructive" })
      }
    } finally {
      setActing(false)
    }
  }

  const labels = (id: string) => (isAr ? CATEGORY_LABELS_AR[id] || id : id)

  return (
    <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold">
          {isAr ? "مراجعة المقالات" : "Article review queue"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAr
            ? "المقالات بانتظار الموافقة قبل النشر."
            : "Articles awaiting publication approval."}
        </p>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">
          {isAr ? "جارٍ التحميل…" : "Loading…"}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {isAr ? "لا توجد مقالات للمراجعة" : "Queue is empty"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold truncate">{a.title}</h3>
                      <Badge variant="secondary">{labels(a.category)}</Badge>
                    </div>
                    {a.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {a.excerpt}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {a.author_name} ·{" "}
                      {new Date(a.updated_at).toLocaleDateString(
                        isAr ? "ar-EG" : "en-US"
                      )}
                    </div>
                  </div>
                  <Button onClick={() => openArticle(a)}>
                    {isAr ? "افتح للمراجعة" : "Review"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{active?.title}</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {active.author_name} · {labels(active.category)} ·{" "}
                {active.reading_minutes} {isAr ? "د قراءة" : "min"}
              </div>
              <div className="border border-border rounded-md p-4 bg-card">
                {activeContent === null ? (
                  <div className="text-muted-foreground text-sm">
                    {isAr ? "جارٍ تحميل المحتوى…" : "Loading content…"}
                  </div>
                ) : (
                  <MarkdownView
                    content={activeContent}
                    className="prose dark:prose-invert max-w-none"
                  />
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setActive(null)}
              disabled={acting}
            >
              {isAr ? "إغلاق" : "Close"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setRejectOpen(true)}
              disabled={acting}
            >
              {isAr ? "رفض" : "Reject"}
            </Button>
            <Button onClick={() => action("publish")} disabled={acting}>
              {acting ? "…" : isAr ? "اعتماد ونشر" : "Approve & publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAr ? "سبب الرفض" : "Rejection reason"}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            placeholder={
              isAr
                ? "اشرح للمؤلف ما يحتاج للتعديل"
                : "Explain what the author should fix"
            }
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={acting}
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => action("reject", rejectReason.trim() || undefined)}
              disabled={acting}
            >
              {isAr ? "إرسال الرفض" : "Send rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
