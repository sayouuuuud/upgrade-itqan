"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/context"
import { useToast } from "@/hooks/use-toast"
import { MarkdownEditor } from "./markdown-editor"
import {
  ACADEMY_ARTICLE_CATEGORIES,
  CATEGORY_LABELS_AR,
  MAQRAA_ARTICLE_CATEGORIES,
} from "@/lib/community/types"
import type {
  Article,
  ArticleCategory,
  Community,
} from "@/lib/community/types"

interface ArticleEditorProps {
  community: Community
  articleId?: string // edit mode when provided
}

export function ArticleEditor({ community, articleId }: ArticleEditorProps) {
  const router = useRouter()
  const { locale } = useI18n()
  const { toast } = useToast()
  const isAr = locale === "ar"

  const categories =
    community === "academy"
      ? ACADEMY_ARTICLE_CATEGORIES
      : MAQRAA_ARTICLE_CATEGORIES
  const labels = (id: string) => (isAr ? CATEGORY_LABELS_AR[id] || id : id)

  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState<ArticleCategory>(categories[0])
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [tags, setTags] = useState("")
  const [status, setStatus] = useState<string>("draft")
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(!!articleId)
  const [rejectedReason, setRejectedReason] = useState<string | null>(null)
  const [savedArticle, setSavedArticle] = useState<Article | null>(null)

  useEffect(() => {
    if (articleId) loadArticle(articleId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId])

  const loadArticle = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/community/articles/${id}`)
      const data = await res.json()
      if (!res.ok) {
        toast({ title: data.error, variant: "destructive" })
        router.push(`/community/${community}/articles/mine`)
        return
      }
      const a: Article = data.article
      setTitle(a.title)
      setExcerpt(a.excerpt || "")
      setContent(a.content)
      setCategory(a.category as ArticleCategory)
      setCoverImageUrl(a.cover_image_url || "")
      setTags((a.tags || []).join(", "))
      setStatus(a.status)
      setRejectedReason(a.rejected_reason || null)
      setSavedArticle(a)
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: isAr ? "العنوان والمحتوى مطلوبان" : "Title and content required",
        variant: "destructive",
      })
      return
    }
    setSaving(true)
    try {
      const body = {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || undefined,
        category,
        cover_image_url: coverImageUrl.trim() || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      }
      let res: Response
      if (savedArticle) {
        res = await fetch(`/api/community/articles/${savedArticle.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch(`/api/community/articles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, community }),
        })
      }
      const data = await res.json()
      if (res.ok) {
        toast({ title: isAr ? "تم الحفظ" : "Saved" })
        setSavedArticle(data.article)
        if (data.article.status) setStatus(data.article.status)
        if (!articleId) {
          router.replace(`/community/${community}/articles/edit/${data.article.id}`)
        }
      } else {
        toast({ title: data.error, variant: "destructive" })
      }
    } finally {
      setSaving(false)
    }
  }

  const submitForReview = async () => {
    if (!savedArticle) {
      toast({
        title: isAr ? "احفظ المسودة أولًا" : "Save the draft first",
        variant: "destructive",
      })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(
        `/api/community/articles/${savedArticle.id}/workflow`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "submit" }),
        }
      )
      const data = await res.json()
      if (res.ok) {
        toast({
          title: isAr ? "أرسلت للمراجعة" : "Submitted for review",
          description: isAr
            ? "ستتم مراجعة المقال من قبل المشرفين"
            : "Reviewers will look at it shortly",
        })
        router.push(`/community/${community}/articles/mine`)
      } else {
        toast({ title: data.error, variant: "destructive" })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        {isAr ? "جارٍ التحميل…" : "Loading…"}
      </div>
    )
  }

  const readOnly = !!savedArticle &&
    !["draft", "rejected"].includes(status)

  return (
    <div className="max-w-3xl mx-auto space-y-4" dir={isAr ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold">
          {savedArticle
            ? isAr ? "تعديل المقال" : "Edit article"
            : isAr ? "كتابة مقال جديد" : "Write new article"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAr
            ? "احفظ كمسودة أولًا، ثم أرسلها للمراجعة قبل النشر."
            : "Save as a draft first, then submit for review."}
        </p>
      </div>

      {rejectedReason && status === "rejected" && (
        <Card className="border-rose-500/40 bg-rose-500/5">
          <CardContent className="p-4">
            <h4 className="font-semibold text-rose-700">
              {isAr ? "ملاحظات الرفض" : "Rejection notes"}
            </h4>
            <p className="text-sm mt-1">{rejectedReason}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {isAr
                ? "بعد التعديل سيعود المقال للمسودة."
                : "Editing will move it back to draft."}
            </p>
          </CardContent>
        </Card>
      )}

      {status === "pending_review" && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 text-sm">
            {isAr
              ? "المقال قيد المراجعة. لا يمكن تعديله الآن."
              : "Article is awaiting review."}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
          <Input
            placeholder={isAr ? "عنوان المقال" : "Article title"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={readOnly}
            maxLength={255}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ArticleCategory)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {labels(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder={isAr ? "وسوم مفصولة بفواصل" : "Comma-separated tags"}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={readOnly}
            />
          </div>

          <Input
            placeholder={isAr ? "رابط صورة الغلاف (اختياري)" : "Cover image URL (optional)"}
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            disabled={readOnly}
          />

          <Textarea
            placeholder={isAr ? "نص تمهيدي قصير (سيظهر في القائمة)" : "Short excerpt"}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            disabled={readOnly}
            rows={2}
          />

          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder={
              isAr ? "اكتب مقالك هنا بصيغة Markdown…" : "Write your article…"
            }
            rows={18}
          />

          {!readOnly && (
            <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={saving || submitting}
              >
                {saving
                  ? isAr ? "جارٍ الحفظ…" : "Saving…"
                  : isAr ? "حفظ المسودة" : "Save draft"}
              </Button>
              <Button onClick={submitForReview} disabled={submitting || !savedArticle}>
                {submitting
                  ? isAr ? "جارٍ الإرسال…" : "Submitting…"
                  : isAr ? "إرسال للمراجعة" : "Submit for review"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
