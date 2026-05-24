"use client"

// Single thread page: header (vote rail + title + meta), original post body,
// nested comment tree, reply composer.

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowBigUp,
  ArrowRight,
  CheckCircle2,
  EyeOff,
  Flag,
  HelpCircle,
  Lock,
  MessageSquare,
  Pin,
  Trash2,
  User as UserIcon,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/context"
import { useToast } from "@/hooks/use-toast"
import { MarkdownView } from "./markdown-view"
import { CommentTree } from "./comment-tree"
import {
  CATEGORY_LABELS_AR,
  CATEGORY_LABELS_EN,
  REPORT_REASONS,
  type Community,
  type ForumPost,
  type ForumReply,
} from "@/lib/community/types"

interface ThreadViewProps {
  community: Community
  postId: string
  meId: string | null
  capabilities: {
    isModerator: boolean
    isAdmin: boolean
    canPublish?: boolean
  }
}

function timeAgo(iso: string, isAr: boolean): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return isAr ? "الآن" : "now"
  if (m < 60) return isAr ? `قبل ${m} د` : `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return isAr ? `قبل ${h} س` : `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 30) return isAr ? `قبل ${days} يوم` : `${days}d ago`
  return d.toLocaleDateString(isAr ? "ar-EG" : "en-US")
}

export function ThreadView({
  community,
  postId,
  meId,
  capabilities,
}: ThreadViewProps) {
  const { locale } = useI18n()
  const router = useRouter()
  const { toast } = useToast()
  const isAr = locale === "ar"

  const [post, setPost] = useState<ForumPost | null>(null)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState("")
  const [sending, setSending] = useState(false)
  const [reportTarget, setReportTarget] = useState<
    { type: "post" | "reply"; id: string } | null
  >(null)
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0].value)
  const [reportDetails, setReportDetails] = useState("")
  const [submittingReport, setSubmittingReport] = useState(false)
  const [voting, setVoting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/community/forum/${postId}`)
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: data.error || (isAr ? "خطأ" : "Error"),
          variant: "destructive",
        })
        return
      }
      setPost(data.post)
      setReplies(data.replies || [])
    } finally {
      setLoading(false)
    }
  }, [postId, toast, isAr])

  useEffect(() => {
    load()
  }, [load])

  if (loading || !post) {
    return (
      <Card className="p-10 text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 mx-auto animate-spin" />
      </Card>
    )
  }

  const labels = (id: string) =>
    isAr ? CATEGORY_LABELS_AR[id] || id : CATEGORY_LABELS_EN[id] || id

  const isAuthor = meId && post.author_id === meId
  const canDeletePost = capabilities.isModerator || isAuthor
  const canSelectBest =
    post.post_type === "qna" && !post.is_locked &&
    (isAuthor || capabilities.isModerator)

  const onVote = async () => {
    if (voting) return
    setVoting(true)
    const prevLiked = post.liked_by_me
    const prevCount = post.upvotes_count
    setPost({
      ...post,
      liked_by_me: !prevLiked,
      upvotes_count: prevCount + (prevLiked ? -1 : 1),
    })
    try {
      const res = await fetch(`/api/community/forum/${postId}/like`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        setPost({ ...post, liked_by_me: prevLiked, upvotes_count: prevCount })
        toast({
          title: data.error || (isAr ? "خطأ" : "Error"),
          variant: "destructive",
        })
      } else {
        setPost({
          ...post,
          liked_by_me: data.liked,
          upvotes_count: data.upvotes_count,
        })
      }
    } catch {
      setPost({ ...post, liked_by_me: prevLiked, upvotes_count: prevCount })
    } finally {
      setVoting(false)
    }
  }

  const sendReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/community/forum/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setReplies((prev) => [...prev, data.reply])
        setReplyText("")
      } else {
        toast({
          title: data.error || (isAr ? "خطأ" : "Error"),
          variant: "destructive",
        })
      }
    } finally {
      setSending(false)
    }
  }

  const deletePost = async () => {
    if (!confirm(isAr ? "حذف هذا المنشور؟" : "Delete this post?")) return
    const res = await fetch(`/api/community/forum/${postId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      router.push(`/community/${community}/forum`)
    } else {
      const data = await res.json()
      toast({
        title: data.error || (isAr ? "تعذّر الحذف" : "Failed"),
        variant: "destructive",
      })
    }
  }

  const moderationAction = async (action: string) => {
    const res = await fetch(`/api/community/forum/${postId}/moderation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    if (res.ok) {
      setPost((p) => (p ? { ...p, ...data.post } : p))
      toast({ title: isAr ? "تم" : "Done" })
    } else {
      toast({
        title: data.error || (isAr ? "خطأ" : "Error"),
        variant: "destructive",
      })
    }
  }

  const submitReport = async () => {
    if (!reportTarget) return
    setSubmittingReport(true)
    try {
      const res = await fetch("/api/community/forum/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          community,
          target_type: reportTarget.type,
          target_id: reportTarget.id,
          reason: reportReason,
          details: reportDetails.trim() || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: isAr ? "تم إرسال البلاغ" : "Report submitted" })
        setReportTarget(null)
        setReportReason(REPORT_REASONS[0].value)
        setReportDetails("")
      } else {
        toast({
          title: data.error || (isAr ? "خطأ" : "Error"),
          variant: "destructive",
        })
      }
    } finally {
      setSubmittingReport(false)
    }
  }

  return (
    <div className="space-y-4">
      <Link
        href={`/community/${community}/forum`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        {isAr ? "العودة للمنتدى" : "Back to forum"}
      </Link>

      <Card className="p-0 overflow-hidden">
        <div className="flex gap-2 p-4 sm:p-5">
          <button
            onClick={onVote}
            disabled={voting || post.is_locked}
            className={`flex flex-col items-center justify-start gap-0.5 rounded-md px-2 py-2 shrink-0 transition-colors ${
              post.liked_by_me
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <ArrowBigUp
              className={`w-6 h-6 ${
                post.liked_by_me ? "fill-primary text-primary" : ""
              }`}
            />
            <span className="text-sm font-bold tabular-nums">
              {post.upvotes_count || 0}
            </span>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              <Badge variant="outline" className="font-normal h-5 px-1.5">
                {labels(post.category)}
              </Badge>
              {post.post_type === "qna" && (
                <Badge variant="secondary" className="font-normal h-5 px-1.5 gap-0.5">
                  <HelpCircle className="w-3 h-3" />
                  {isAr ? "سؤال" : "Q&A"}
                </Badge>
              )}
              {post.is_pinned && (
                <Badge className="font-normal h-5 px-1.5 bg-amber-500 hover:bg-amber-500">
                  <Pin className="w-3 h-3 ml-0.5" />
                  {isAr ? "مثبّت" : "Pinned"}
                </Badge>
              )}
              {post.is_locked && (
                <Badge variant="secondary" className="font-normal h-5 px-1.5">
                  <Lock className="w-3 h-3 ml-0.5" />
                  {isAr ? "مغلق" : "Locked"}
                </Badge>
              )}
              {post.is_hidden && (
                <Badge variant="destructive" className="font-normal h-5 px-1.5">
                  <EyeOff className="w-3 h-3 ml-0.5" />
                  {isAr ? "مخفي" : "Hidden"}
                </Badge>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold mt-2 leading-tight">
              {post.title}
            </h1>

            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-muted overflow-hidden inline-flex items-center justify-center">
                {post.author_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.author_avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-3 h-3" />
                )}
              </span>
              <span className="font-medium text-foreground/85">
                {post.author_name}
              </span>
              <span>•</span>
              <span>{timeAgo(post.created_at, isAr)}</span>
              <span>•</span>
              <span>
                {post.views_count} {isAr ? "مشاهدة" : "views"}
              </span>
            </div>

            <div className="mt-4">
              <MarkdownView content={post.content} />
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-3">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center gap-1 flex-wrap text-xs">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="w-3.5 h-3.5" />
                {post.replies_count}{" "}
                {isAr ? "تعليق" : "comments"}
              </span>

              {canDeletePost && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={deletePost}
                  className="text-rose-500 h-7"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isAr ? "حذف" : "Delete"}
                </Button>
              )}

              {meId && meId !== post.author_id && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7"
                  onClick={() =>
                    setReportTarget({ type: "post", id: post.id })
                  }
                >
                  <Flag className="w-3.5 h-3.5" />
                  {isAr ? "إبلاغ" : "Report"}
                </Button>
              )}

              {capabilities.isModerator && (
                <div className="ml-auto flex flex-wrap items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7"
                    onClick={() =>
                      moderationAction(post.is_pinned ? "unpin" : "pin")
                    }
                  >
                    <Pin className="w-3.5 h-3.5" />
                    {post.is_pinned
                      ? isAr ? "إلغاء التثبيت" : "Unpin"
                      : isAr ? "تثبيت" : "Pin"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7"
                    onClick={() =>
                      moderationAction(post.is_locked ? "unlock" : "lock")
                    }
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {post.is_locked
                      ? isAr ? "فتح" : "Unlock"
                      : isAr ? "إغلاق" : "Lock"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7"
                    onClick={() =>
                      moderationAction(post.is_hidden ? "unhide" : "hide")
                    }
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    {post.is_hidden
                      ? isAr ? "إظهار" : "Unhide"
                      : isAr ? "إخفاء" : "Hide"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          {isAr ? "التعليقات" : "Comments"} ({replies.length})
        </h2>

        <CommentTree
          postId={postId}
          replies={replies}
          meId={meId}
          postAuthorId={post.author_id}
          bestReplyId={post.best_reply_id}
          isLocked={post.is_locked}
          canModerate={capabilities.isModerator}
          canSelectBestAnswer={canSelectBest}
          onChange={setReplies}
          onSetBest={(rid) =>
            setPost((p) => (p ? { ...p, best_reply_id: rid } : p))
          }
          onReport={setReportTarget}
        />
      </div>

      {post.is_locked ? (
        <Card className="p-4 text-center text-muted-foreground">
          <Lock className="w-4 h-4 inline ml-1" />
          {isAr ? "هذا الموضوع مغلق ولا يقبل ردود" : "This topic is locked"}
        </Card>
      ) : meId ? (
        <Card className="p-4">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={isAr ? "أضف تعليقًا…" : "Add a comment…"}
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <Button
              onClick={sendReply}
              disabled={sending || !replyText.trim()}
            >
              {sending
                ? isAr ? "جارٍ النشر…" : "Posting…"
                : isAr ? "نشر التعليق" : "Post comment"}
            </Button>
          </div>
        </Card>
      ) : null}

      <Dialog
        open={!!reportTarget}
        onOpenChange={(o) => !o && setReportTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAr ? "الإبلاغ عن محتوى" : "Report content"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                {isAr ? "السبب" : "Reason"}
              </label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {isAr ? r.label_ar : r.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                {isAr ? "تفاصيل (اختياري)" : "Details (optional)"}
              </label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReportTarget(null)}
              disabled={submittingReport}
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={submitReport} disabled={submittingReport}>
              {submittingReport
                ? isAr ? "جارٍ الإرسال…" : "Sending…"
                : isAr ? "إرسال البلاغ" : "Send report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
