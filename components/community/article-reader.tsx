"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowRight,
  Clock,
  Heart,
  MessageCircle,
  Trash2,
  User as UserIcon,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useToast } from "@/hooks/use-toast"
import { MarkdownView } from "./markdown-view"
import { CATEGORY_LABELS_AR } from "@/lib/community/types"
import type {
  Article,
  ArticleComment,
  Community,
} from "@/lib/community/types"

interface ArticleReaderProps {
  community: Community
  slug: string
}

export function ArticleReader({ community, slug }: ArticleReaderProps) {
  const { locale } = useI18n()
  const { toast } = useToast()
  const router = useRouter()
  const isAr = locale === "ar"

  const [article, setArticle] = useState<Article | null>(null)
  const [comments, setComments] = useState<ArticleComment[]>([])
  const [me, setMe] = useState<{ id: string; role: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const load = async () => {
    setLoading(true)
    try {
      const articleRes = await fetch(
        `/api/community/articles/${encodeURIComponent(slug)}`
      )
      const articleData = await articleRes.json()
      if (!articleRes.ok) {
        toast({ title: articleData.error, variant: "destructive" })
        router.push(`/community/${community}/articles`)
        return
      }
      setArticle(articleData.article)

      const commentsRes = await fetch(
        `/api/community/articles/${articleData.article.id}/comments`
      )
      const commentsData = await commentsRes.json()
      if (commentsRes.ok) setComments(commentsData.comments || [])

      const meRes = await fetch(`/api/auth/me`)
      const meData = await meRes.json()
      if (meRes.ok && meData.user) setMe({ id: meData.user.id, role: meData.user.role })
    } finally {
      setLoading(false)
    }
  }

  const toggleLike = async () => {
    if (!article) return
    const prev = { liked: article.liked_by_me, count: article.likes_count }
    setArticle({
      ...article,
      liked_by_me: !prev.liked,
      likes_count: prev.count + (prev.liked ? -1 : 1),
    })
    const res = await fetch(`/api/community/articles/${article.id}/like`, {
      method: "POST",
    })
    if (!res.ok) {
      setArticle({ ...article, liked_by_me: prev.liked, likes_count: prev.count })
    }
  }

  const postComment = async () => {
    if (!article || !commentText.trim()) return
    setPosting(true)
    try {
      const res = await fetch(
        `/api/community/articles/${article.id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: commentText.trim() }),
        }
      )
      const data = await res.json()
      if (res.ok && data.comment) {
        setComments((prev) => [...prev, data.comment])
        setCommentText("")
      } else {
        toast({ title: data.error, variant: "destructive" })
      }
    } finally {
      setPosting(false)
    }
  }

  const deleteComment = async (id: string) => {
    if (!article) return
    if (!confirm(isAr ? "حذف التعليق؟" : "Delete comment?")) return
    const res = await fetch(
      `/api/community/articles/${article.id}/comments/${id}`,
      { method: "DELETE" }
    )
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id))
  }

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        {isAr ? "جارٍ التحميل…" : "Loading…"}
      </div>
    )
  }
  if (!article) return null

  const labels = (id: string) => (isAr ? CATEGORY_LABELS_AR[id] || id : id)

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <Link href={`/community/${community}/articles`}>
        <Button variant="ghost">
          <ArrowRight className={`w-4 h-4 ml-1 ${isAr ? "" : "rotate-180"}`} />
          {isAr ? "كل المقالات" : "All articles"}
        </Button>
      </Link>

      {article.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.cover_image_url}
          alt=""
          className="w-full max-h-72 object-cover rounded-xl"
        />
      )}

      <div className="space-y-3">
        <Badge variant="secondary">{labels(article.category)}</Badge>
        <h1 className="text-3xl font-bold leading-tight">{article.title}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <UserIcon className="w-4 h-4" />
            {article.author_name}
          </span>
          {article.published_at && (
            <span>
              {new Date(article.published_at).toLocaleDateString(
                isAr ? "ar-EG" : "en-US",
                { dateStyle: "long" }
              )}
            </span>
          )}
          {article.reading_minutes && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {article.reading_minutes} {isAr ? "د قراءة" : "min read"}
            </span>
          )}
        </div>
      </div>

      <MarkdownView
        content={article.content}
        className="prose dark:prose-invert max-w-none"
      />

      <div className="flex items-center gap-4 pt-2 border-t border-border">
        <Button
          variant="outline"
          onClick={toggleLike}
          className={article.liked_by_me ? "text-rose-500" : ""}
        >
          <Heart
            className={`w-4 h-4 ml-1 ${article.liked_by_me ? "fill-rose-500" : ""}`}
          />
          {article.likes_count}
        </Button>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <MessageCircle className="w-4 h-4" />
          {comments.length}
        </span>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-bold">{isAr ? "التعليقات" : "Comments"}</h3>

          {me && (
            <div className="space-y-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                placeholder={isAr ? "اكتب تعليقًا…" : "Write a comment…"}
              />
              <div className="flex justify-end">
                <Button
                  onClick={postComment}
                  disabled={posting || !commentText.trim()}
                >
                  {posting
                    ? isAr ? "جارٍ النشر…" : "Posting…"
                    : isAr ? "نشر" : "Post"}
                </Button>
              </div>
            </div>
          )}

          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {isAr ? "كن أول من يعلق" : "Be the first to comment"}
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {c.author_avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.author_avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">{c.author_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleString(
                          isAr ? "ar-EG" : "en-US"
                        )}
                      </span>
                      {me && me.id === c.author_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto h-7 w-7 text-rose-600"
                          onClick={() => deleteComment(c.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap mt-0.5">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
