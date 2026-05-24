"use client"

// Recursive nested comment thread, Reddit-style with collapsible branches
// and threaded indentation lines.

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Flag,
  Heart,
  MessageSquare,
  Trash2,
  User as UserIcon,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useToast } from "@/hooks/use-toast"
import { MarkdownView } from "./markdown-view"
import type { ForumReply } from "@/lib/community/types"

export interface CommentTreeProps {
  postId: string
  replies: ForumReply[]
  meId: string | null
  postAuthorId: string
  bestReplyId: string | null
  isLocked: boolean
  canModerate: boolean
  canSelectBestAnswer: boolean
  onChange: (next: ForumReply[]) => void
  onSetBest: (replyId: string | null) => void
  onReport: (target: { type: "reply"; id: string }) => void
}

interface ReplyNode extends ForumReply {
  children: ReplyNode[]
}

function buildTree(replies: ForumReply[]): ReplyNode[] {
  const byId = new Map<string, ReplyNode>()
  for (const r of replies) byId.set(r.id, { ...r, children: [] })
  const roots: ReplyNode[] = []
  for (const node of byId.values()) {
    if (node.parent_reply_id && byId.has(node.parent_reply_id)) {
      byId.get(node.parent_reply_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  // sort: best answer first at root level, then by created_at ascending
  const sortChildren = (nodes: ReplyNode[]) => {
    nodes.sort((a, b) => {
      if (a.is_best_answer && !b.is_best_answer) return -1
      if (!a.is_best_answer && b.is_best_answer) return 1
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
    nodes.forEach((n) => sortChildren(n.children))
  }
  sortChildren(roots)
  return roots
}

function timeAgo(iso: string, isAr: boolean): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return isAr ? "الآن" : "now"
  if (m < 60) return isAr ? `قبل ${m} د` : `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return isAr ? `قبل ${h} س` : `${h}h`
  const days = Math.floor(h / 24)
  if (days < 30) return isAr ? `قبل ${days} يوم` : `${days}d`
  return d.toLocaleDateString(isAr ? "ar-EG" : "en-US")
}

export function CommentTree(props: CommentTreeProps) {
  const tree = buildTree(props.replies)
  return (
    <div className="space-y-3">
      {tree.map((node) => (
        <CommentNode key={node.id} node={node} depth={0} {...props} />
      ))}
    </div>
  )
}

interface CommentNodeProps extends CommentTreeProps {
  node: ReplyNode
  depth: number
}

function CommentNode({
  node,
  depth,
  postId,
  meId,
  postAuthorId,
  bestReplyId,
  isLocked,
  canModerate,
  canSelectBestAnswer,
  replies,
  onChange,
  onSetBest,
  onReport,
}: CommentNodeProps) {
  const { locale } = useI18n()
  const { toast } = useToast()
  const isAr = locale === "ar"

  const [collapsed, setCollapsed] = useState(false)
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [sending, setSending] = useState(false)

  const isAuthor = meId && node.author_id === meId
  const canDelete = canModerate || isAuthor

  const toggleLike = async () => {
    const wasLiked = !!node.liked_by_me
    const next = replies.map((r) =>
      r.id === node.id
        ? {
            ...r,
            liked_by_me: !wasLiked,
            likes_count: r.likes_count + (wasLiked ? -1 : 1),
          }
        : r
    )
    onChange(next)
    try {
      const res = await fetch(`/api/community/forum/replies/${node.id}/like`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        onChange(replies) // rollback
        toast({
          title: data.error || (isAr ? "خطأ" : "Error"),
          variant: "destructive",
        })
      }
    } catch {
      onChange(replies)
    }
  }

  const submitReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/community/forum/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyText.trim(),
          parent_reply_id: node.id,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        onChange([...replies, data.reply as ForumReply])
        setReplyText("")
        setReplying(false)
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

  const removeReply = async () => {
    if (!confirm(isAr ? "حذف هذا الرد؟" : "Delete this comment?")) return
    try {
      const res = await fetch(`/api/community/forum/replies/${node.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        // Walk descendants and exclude them too
        const remove = new Set<string>([node.id])
        let changed = true
        while (changed) {
          changed = false
          for (const r of replies) {
            if (r.parent_reply_id && remove.has(r.parent_reply_id) && !remove.has(r.id)) {
              remove.add(r.id)
              changed = true
            }
          }
        }
        onChange(replies.filter((r) => !remove.has(r.id)))
      } else {
        const d = await res.json()
        toast({
          title: d.error || (isAr ? "تعذّر الحذف" : "Failed"),
          variant: "destructive",
        })
      }
    } catch {
      // ignore
    }
  }

  const toggleBest = async () => {
    const targetId = node.is_best_answer ? null : node.id
    try {
      const res = await fetch(
        `/api/community/forum/${postId}/best-answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reply_id: targetId }),
        }
      )
      const data = await res.json()
      if (res.ok) {
        onSetBest(targetId)
        const next = replies.map((r) => ({
          ...r,
          is_best_answer: r.id === targetId,
        }))
        onChange(next)
      } else {
        toast({
          title: data.error || (isAr ? "خطأ" : "Error"),
          variant: "destructive",
        })
      }
    } catch {
      // ignore
    }
  }

  const indent = Math.min(depth, 8)

  return (
    <div
      className={`relative ${indent > 0 ? "pr-3 border-r-2 border-border" : ""}`}
      style={{
        marginRight: indent > 0 && isAr ? indent * 12 : undefined,
        marginLeft: indent > 0 && !isAr ? indent * 12 : undefined,
      }}
    >
      <div
        className={`rounded-lg p-3 ${
          node.is_best_answer
            ? "bg-emerald-500/5 border border-emerald-500/30"
            : "border border-border bg-card"
        }`}
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-muted"
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <span className="w-5 h-5 rounded-full bg-muted overflow-hidden inline-flex items-center justify-center">
            {node.author_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={node.author_avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-3 h-3" />
            )}
          </span>
          <span className="font-medium text-foreground/85">
            {node.author_name}
          </span>
          {node.author_id === postAuthorId && (
            <Badge variant="outline" className="h-4 px-1 text-[10px]">
              {isAr ? "كاتب الموضوع" : "OP"}
            </Badge>
          )}
          {node.is_best_answer && (
            <Badge className="h-4 px-1.5 text-[10px] bg-emerald-500 hover:bg-emerald-500">
              <CheckCircle2 className="w-3 h-3 ml-0.5" />
              {isAr ? "إجابة مختارة" : "Best answer"}
            </Badge>
          )}
          <span>•</span>
          <span>{timeAgo(node.created_at, isAr)}</span>
        </div>

        {!collapsed && (
          <>
            <div className="mt-2 pr-7">
              <MarkdownView content={node.content} />
            </div>

            <div className="mt-1 pr-5 flex items-center gap-1 text-xs">
              <button
                onClick={toggleLike}
                disabled={!meId}
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors ${
                  node.liked_by_me
                    ? "text-rose-500"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    node.liked_by_me ? "fill-rose-500" : ""
                  }`}
                />
                <span>{node.likes_count || 0}</span>
              </button>

              {!isLocked && meId && (
                <button
                  onClick={() => setReplying(!replying)}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-muted-foreground hover:bg-muted"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {isAr ? "رد" : "Reply"}
                </button>
              )}

              {canSelectBestAnswer && !node.parent_reply_id && (
                <button
                  onClick={toggleBest}
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors ${
                    node.is_best_answer
                      ? "text-emerald-600"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {node.is_best_answer
                    ? isAr
                      ? "إلغاء"
                      : "Unmark"
                    : isAr
                      ? "أفضل إجابة"
                      : "Mark best"}
                </button>
              )}

              {canDelete && (
                <button
                  onClick={removeReply}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-rose-500 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {meId && meId !== node.author_id && (
                <button
                  onClick={() => onReport({ type: "reply", id: node.id })}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-muted-foreground hover:bg-muted ml-auto"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {replying && (
              <div className="mt-2 pr-5 space-y-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={isAr ? "اكتب ردك…" : "Write a reply…"}
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplying(false)
                      setReplyText("")
                    }}
                    disabled={sending}
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={submitReply}
                    disabled={sending || !replyText.trim()}
                  >
                    {sending
                      ? isAr ? "جارٍ النشر…" : "Posting…"
                      : isAr ? "نشر" : "Post"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!collapsed && node.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <CommentNode
              key={child.id}
              node={child}
              depth={depth + 1}
              postId={postId}
              meId={meId}
              postAuthorId={postAuthorId}
              bestReplyId={bestReplyId}
              isLocked={isLocked}
              canModerate={canModerate}
              canSelectBestAnswer={canSelectBestAnswer}
              replies={replies}
              onChange={onChange}
              onSetBest={onSetBest}
              onReport={onReport}
            />
          ))}
        </div>
      )}
    </div>
  )
}
