"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowRight,
  CheckCircle2,
  EyeOff,
  Flag,
  Heart,
  Lock,
  MoreHorizontal,
  Pin,
  ShieldAlert,
  Trash2,
  User as UserIcon,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useToast } from "@/hooks/use-toast"
import { MarkdownView } from "./markdown-view"
import { MarkdownEditor } from "./markdown-editor"
import {
  CATEGORY_LABELS_AR,
  REPORT_REASONS,
} from "@/lib/community/types"
import type {
  Community,
  ForumPost,
  ForumReply,
} from "@/lib/community/types"

interface ForumThreadProps {
  postId: string
  community: Community
  onBack: () => void
}

type Capabilities = {
  isAuthor: boolean
  isModerator: boolean
}

export function ForumThread({ postId, community, onBack }: ForumThreadProps) {
  const { locale } = useI18n()
  const { toast } = useToast()
  const isAr = locale === "ar"

  const [post, setPost] = useState<ForumPost | null>(null)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [me, setMe] = useState<{ id: string; role: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  const [reportTarget, setReportTarget] =
    useState<{ type: "post" | "reply"; id: string } | null>(null)
  const [reportReason, setReportReason] = useState("spam")
  const [reportDetails, setReportDetails] = useState("")
  const [submittingReport, setSubmittingReport] = useState(false)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  const load = async () => {
    setLoading(true)
    try {
      const [postRes, meRes] = await Promise.all([
        fetch(`/api/community/forum/${postId}`),
        fetch(`/api/auth/me`),
      ])
      const postData = await postRes.json()
      if (postRes.ok) {
        setPost(postData.post)
        setReplies(postData.replies || [])
      } else {
        toast({ title: postData.error, variant: "destructive" })
        onBack()
        return
      }
      const meData = await meRes.json()
      if (meRes.ok && meData.user) {
        setMe({ id: meData.user.id, role: meData.user.role })
      }
    } finally {
      setLoading(false)
    }
  }

  const capabilities: Capabilities = useMemo(() => {
    if (!me || !post) return { isAuthor: false, isModerator: false }
    const isAuthor = me.id === post.author_id
    const isModerator =
      me.role === "admin" ||
      (community === "academy" &&
        ["academy_admin", "student_supervisor"].includes(me.role)) ||
      (community === "maqraa" &&
        ["reciter_supervisor", "student_supervisor"].includes(me.role))
    return { isAuthor, isModerator }
  }, [me, post, community])

  const sendReply = async () => {
    if (!replyText.trim()) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/community/forum/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.reply) {
        setReplies((prev) => [...prev, data.reply])
        setReplyText("")
      } else {
        toast({ title: data.error, variant: "destructive" })
      }
    } finally {
      setSendingReply(false)
    }
  }

  const toggleLike = async (replyId: string) => {
    const target = replies.find((r) => r.id === replyId)
    if (!target) return
    // optimistic
    setReplies((prev) =>
      prev.map((r) =>
        r.id === replyId
          ? {
              ...r,
              liked_by_me: !r.liked_by_me,
              likes_count: r.likes_count + (r.liked_by_me ? -1 : 1),
            }
          : r
      )
    )
    try {
      const res = await fetch(
        `/api/community/forum/replies/${replyId}/like`,
        { method: "POST" }
      )
      if (!res.ok) {
        // rollback
        setReplies((prev) =>
          prev.map((r) =>
            r.id === replyId
              ? {
                  ...r,
                  liked_by_me: target.liked_by_me,
                  likes_count: target.likes_count,
                }
              : r
          )
        )
      }
    } catch {
      // ignore
    }
  }

  const setBestAnswer = async (replyId: string | null) => {
    try {
      const res = await fetch(
        `/api/community/forum/${postId}/best-answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reply_id: replyId }),
        }
      )
      if (res.ok) {
        setReplies((prev) =>
          prev.map((r) => ({
            ...r,
            is_best_answer: r.id === replyId,
          }))
        )
        if (post) setPost({ ...post, best_reply_id: replyId })
        toast({
          title: replyId
            ? isAr
              ? "تم اختيار الإجابة"
              : "Best answer set"
            : isAr
              ? "أُلغي الاختيار"
              : "Cleared",
        })
      } else {
        const data = await res.json()
        toast({ title: data.error, variant: "destructive" })
      }
    } catch {
      // ignore
    }
  }

  const deleteReply = async (replyId: string) => {
    if (!confirm(isAr ? "حذف الرد؟" : "Delete reply?")) return
    const res = await fetch(`/api/community/forum/replies/${replyId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setReplies((prev) => prev.filter((r) => r.id !== replyId))
    }
  }

  const deletePost = async () => {
    if (!post) return
    if (!confirm(isAr ? "حذف الموضوع نهائيًا؟" : "Delete topic?")) return
    const res = await fetch(`/api/community/forum/${post.id}`, {
      method: "DELETE",
    })
    if (res.ok) onBack()
  }

  const moderationAction = async (
    action: "pin" | "unpin" | "lock" | "unlock" | "hide" | "unhide"
  ) => {
    if (!post) return
    let reason: string | null = null
    if (action === "hide") {
      reason = window.prompt(isAr ? "سبب الإخفاء (اختياري)" : "Reason (optional)") || ""
    }
    const res = await fetch(
      `/api/community/forum/${post.id}/moderation`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      }
    )
    if (res.ok) load()
  }

  const submitReport = async () => {
    if (!reportTarget) return
    setSubmittingReport(true)
    try {
      const res = await fetch(`/api/community/forum/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: reportTarget.type,
          target_id: reportTarget.id,
          reason: reportReason,
          details: reportDetails.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: isAr ? "تم إرسال البلاغ" : "Report sent",
          description: isAr
            ? "سيتم مراجعته من قبل المشرفين"
            : "Moderators will review it",
        })
        setReportTarget(null)
        setReportDetails("")
        setReportReason("spam")
      } else {
        toast({ title: data.error, variant: "destructive" })
      }
    } finally {
      setSubmittingReport(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        {isAr ? "جارٍ التحميل…" : "Loading…"}
      </div>
    )
  }
  if (!post) return null

  const labels = (id: string) => (isAr ? CATEGORY_LABELS_AR[id] || id : id)

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <Button variant="ghost" onClick={onBack}>
        <ArrowRight className={`w-4 h-4 ml-1 ${isAr ? "" : "rotate-180"}`} />
        {isAr ? "رجوع" : "Back"}
      </Button>

      <Card className={post.is_hidden ? "opacity-70" : ""}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {post.author_avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author_avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {post.is_pinned && <Pin className="w-4 h-4 text-amber-500" />}
                {post.is_locked && (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
                {post.is_hidden && (
                  <EyeOff className="w-4 h-4 text-rose-500" />
                )}
                <h1 className="text-2xl font-bold">{post.title}</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-wrap">
                <span className="font-medium text-foreground/80">
                  {post.author_name}
                </span>
                <span>•</span>
                <span>
                  {new Date(post.created_at).toLocaleString(
                    isAr ? "ar-EG" : "en-US"
                  )}
                </span>
                <Badge variant="secondary">{labels(post.category)}</Badge>
              </div>
              <MarkdownView
                content={post.content}
                className="prose prose-sm dark:prose-invert max-w-none"
              />
              {post.is_hidden && post.hidden_reason && (
                <div className="mt-3 rounded-md bg-rose-500/10 text-rose-600 text-sm p-2">
                  {isAr ? "سبب الإخفاء: " : "Hidden reason: "}
                  {post.hidden_reason}
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isAr ? "start" : "end"}>
                {capabilities.isModerator && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        moderationAction(post.is_pinned ? "unpin" : "pin")
                      }
                    >
                      <Pin className="w-4 h-4 ml-2" />
                      {post.is_pinned
                        ? isAr ? "إلغاء التثبيت" : "Unpin"
                        : isAr ? "تثبيت" : "Pin"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        moderationAction(post.is_locked ? "unlock" : "lock")
                      }
                    >
                      <Lock className="w-4 h-4 ml-2" />
                      {post.is_locked
                        ? isAr ? "إعادة الفتح" : "Unlock"
                        : isAr ? "إغلاق" : "Lock"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        moderationAction(post.is_hidden ? "unhide" : "hide")
                      }
                    >
                      <EyeOff className="w-4 h-4 ml-2" />
                      {post.is_hidden
                        ? isAr ? "إظهار" : "Unhide"
                        : isAr ? "إخفاء" : "Hide"}
                    </DropdownMenuItem>
                  </>
                )}
                {(capabilities.isAuthor || capabilities.isModerator) && (
                  <DropdownMenuItem
                    onClick={deletePost}
                    className="text-rose-600"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    {isAr ? "حذف" : "Delete"}
                  </DropdownMenuItem>
                )}
                {!capabilities.isAuthor && (
                  <DropdownMenuItem
                    onClick={() =>
                      setReportTarget({ type: "post", id: post.id })
                    }
                  >
                    <Flag className="w-4 h-4 ml-2" />
                    {isAr ? "إبلاغ" : "Report"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <h3 className="font-bold px-1">
        {isAr ? "الردود" : "Replies"} ({replies.length})
      </h3>

      <div className="space-y-3">
        {replies.map((r) => (
          <Card
            key={r.id}
            className={r.is_best_answer ? "border-emerald-500/50 bg-emerald-500/5" : ""}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {r.author_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.author_avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm mb-1 flex-wrap">
                    <span className="font-semibold">{r.author_name}</span>
                    {r.is_best_answer && (
                      <Badge className="bg-emerald-500 text-white">
                        <CheckCircle2 className="w-3 h-3 ml-1" />
                        {isAr ? "أفضل إجابة" : "Best answer"}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(r.created_at).toLocaleString(
                        isAr ? "ar-EG" : "en-US"
                      )}
                    </span>
                  </div>
                  <MarkdownView
                    content={r.content}
                    className="prose prose-sm dark:prose-invert max-w-none"
                  />

                  <div className="flex items-center gap-1 mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleLike(r.id)}
                      className={r.liked_by_me ? "text-rose-500" : ""}
                    >
                      <Heart
                        className={`w-4 h-4 ml-1 ${
                          r.liked_by_me ? "fill-rose-500" : ""
                        }`}
                      />
                      {r.likes_count}
                    </Button>

                    {(capabilities.isAuthor ||
                      capabilities.isModerator) &&
                      post.post_type === "qna" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setBestAnswer(r.is_best_answer ? null : r.id)
                          }
                          className={
                            r.is_best_answer ? "text-emerald-600" : ""
                          }
                        >
                          <CheckCircle2 className="w-4 h-4 ml-1" />
                          {r.is_best_answer
                            ? isAr ? "إلغاء كأفضل إجابة" : "Unset best"
                            : isAr ? "اختر كأفضل إجابة" : "Mark best"}
                        </Button>
                      )}

                    <div className="ml-auto flex items-center gap-1">
                      {(capabilities.isModerator ||
                        (me && me.id === r.author_id)) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteReply(r.id)}
                          className="text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      {me && me.id !== r.author_id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setReportTarget({ type: "reply", id: r.id })
                          }
                        >
                          <Flag className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {post.is_locked ? (
        <Card>
          <CardContent className="p-4 text-center text-muted-foreground">
            <ShieldAlert className="w-5 h-5 inline ml-1" />
            {isAr
              ? "هذا الموضوع مغلق ولا يقبل ردود"
              : "This topic is locked"}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              placeholder={isAr ? "اكتب ردك…" : "Write your reply…"}
            />
            <div className="flex justify-end">
              <Button
                onClick={sendReply}
                disabled={sendingReply || !replyText.trim()}
              >
                {sendingReply
                  ? isAr ? "جارٍ الإرسال…" : "Sending…"
                  : isAr ? "نشر الرد" : "Post reply"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!reportTarget}
        onOpenChange={(o) => !o && setReportTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "الإبلاغ عن محتوى" : "Report content"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                {isAr ? "السبب" : "Reason"}
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full border border-border rounded-md bg-background px-3 py-2 text-sm"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {isAr ? r.label_ar : r.value}
                  </option>
                ))}
              </select>
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
