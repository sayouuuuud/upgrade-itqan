"use client"

// Reddit-style post card: vote arrow on the leading edge, then meta line,
// then title + excerpt, then engagement footer. Used in the forum feed.

import Link from "next/link"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  ArrowBigUp,
  CheckCircle2,
  EyeOff,
  HelpCircle,
  Lock,
  MessageSquare,
  Pin,
  User as UserIcon,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useToast } from "@/hooks/use-toast"
import {
  CATEGORY_LABELS_AR,
  CATEGORY_LABELS_EN,
  type Community,
  type ForumPost,
} from "@/lib/community/types"

interface PostCardProps {
  post: ForumPost
  community: Community
  hrefBase?: string
  onChange?: (next: ForumPost) => void
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

function authorBadge(role: string | undefined, isAr: boolean): string | null {
  if (!role) return null
  if (role === "admin") return isAr ? "مدير" : "Admin"
  if (role === "academy_admin") return isAr ? "إدارة" : "Admin"
  if (role === "teacher") return isAr ? "مدرّس" : "Teacher"
  if (role === "reader") return isAr ? "مقرئ" : "Reader"
  if (role === "reciter_supervisor" || role === "student_supervisor")
    return isAr ? "مشرف" : "Supervisor"
  if (role.includes("supervisor")) return isAr ? "مشرف" : "Supervisor"
  if (role === "parent") return isAr ? "وليّ أمر" : "Parent"
  return null
}

export function PostCard({ post, community, hrefBase, onChange }: PostCardProps) {
  const { locale } = useI18n()
  const { toast } = useToast()
  const isAr = locale === "ar"
  const [voting, setVoting] = useState(false)

  const base = hrefBase ?? `/community/${community}/forum`
  const href = `${base}/${post.id}`

  const labels = (id: string) =>
    isAr ? CATEGORY_LABELS_AR[id] || id : CATEGORY_LABELS_EN[id] || id

  const onVote = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (voting) return
    setVoting(true)
    const prevLiked = post.liked_by_me
    const prevCount = post.upvotes_count
    onChange?.({
      ...post,
      liked_by_me: !prevLiked,
      upvotes_count: prevCount + (prevLiked ? -1 : 1),
    })
    try {
      const res = await fetch(`/api/community/forum/${post.id}/like`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        // rollback
        onChange?.({
          ...post,
          liked_by_me: prevLiked,
          upvotes_count: prevCount,
        })
        toast({ title: data.error || "خطأ", variant: "destructive" })
      } else {
        onChange?.({
          ...post,
          liked_by_me: data.liked,
          upvotes_count: data.upvotes_count,
        })
      }
    } catch {
      onChange?.({
        ...post,
        liked_by_me: prevLiked,
        upvotes_count: prevCount,
      })
    } finally {
      setVoting(false)
    }
  }

  const roleBadge = authorBadge(post.author_role, isAr)

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-card/70 transition-colors"
    >
      <div className="flex gap-2 p-3 sm:p-4">
        {/* vote rail */}
        <button
          type="button"
          onClick={onVote}
          disabled={voting}
          className={`flex flex-col items-center justify-start gap-0.5 rounded-md px-1.5 py-2 shrink-0 transition-colors ${
            post.liked_by_me
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          aria-label={isAr ? "تصويت" : "Upvote"}
        >
          <ArrowBigUp
            className={`w-5 h-5 ${
              post.liked_by_me ? "fill-primary text-primary" : ""
            }`}
          />
          <span className="text-xs font-semibold tabular-nums">
            {post.upvotes_count || 0}
          </span>
        </button>

        {/* body */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* meta */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <Badge variant="outline" className="font-normal h-5 px-1.5">
              {labels(post.category)}
            </Badge>
            {post.post_type === "qna" && (
              <Badge
                variant="secondary"
                className="font-normal h-5 px-1.5 gap-0.5"
              >
                <HelpCircle className="w-3 h-3" />
                {isAr ? "سؤال" : "Q&A"}
              </Badge>
            )}
            {post.is_pinned && (
              <span className="inline-flex items-center gap-0.5 text-amber-600">
                <Pin className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isAr ? "مثبّت" : "Pinned"}
                </span>
              </span>
            )}
            {post.is_locked && (
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            {post.is_hidden && (
              <span className="inline-flex items-center gap-0.5 text-rose-600">
                <EyeOff className="w-3.5 h-3.5" />
                <span>{isAr ? "مخفي" : "Hidden"}</span>
              </span>
            )}
            {post.best_reply_id && (
              <span className="inline-flex items-center gap-0.5 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isAr ? "تمت الإجابة" : "Answered"}
                </span>
              </span>
            )}
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-muted overflow-hidden inline-flex items-center justify-center">
                {post.author_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.author_avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-2.5 h-2.5" />
                )}
              </span>
              <span className="font-medium text-foreground/80 truncate max-w-[8rem]">
                {post.author_name}
              </span>
            </span>
            {roleBadge && (
              <Badge variant="secondary" className="font-normal h-5 px-1.5">
                {roleBadge}
              </Badge>
            )}
            <span>•</span>
            <span>{timeAgo(post.created_at, isAr)}</span>
          </div>

          {/* title */}
          <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary leading-snug">
            {post.title}
          </h3>

          {/* excerpt */}
          {post.content && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {post.content}
            </p>
          )}

          {/* tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {post.tags.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* engagement footer */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {post.replies_count}{" "}
              <span className="hidden sm:inline">
                {isAr ? "تعليق" : "comments"}
              </span>
            </span>
            <span>{post.views_count} {isAr ? "مشاهدة" : "views"}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
