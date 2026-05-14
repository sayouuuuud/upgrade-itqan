"use client"

// Shared client component used by both the discussion forum view and the
// consultations (Q&A) view. It owns the post list, the create-post dialog,
// and a thread-detail panel. The thread detail is delegated to ForumThread
// to keep this file readable.

import { useEffect, useMemo, useState } from "react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowRight,
  Eye,
  Lock,
  MessageSquare,
  Pin,
  Plus,
  Search,
  User as UserIcon,
  EyeOff,
  CheckCircle2,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useToast } from "@/hooks/use-toast"
import { MarkdownEditor } from "./markdown-editor"
import { ForumThread } from "./forum-thread"
import {
  ACADEMY_FORUM_CATEGORIES,
  CATEGORY_LABELS_AR,
  MAQRAA_FORUM_CATEGORIES,
} from "@/lib/community/types"
import type {
  Community,
  ForumPost,
  PostType,
} from "@/lib/community/types"

interface ForumBoardProps {
  community: Community
  postType: PostType
}

const CATEGORIES_BY_COMMUNITY = {
  academy: ACADEMY_FORUM_CATEGORIES,
  maqraa: MAQRAA_FORUM_CATEGORIES,
} as const

export function ForumBoard({ community, postType }: ForumBoardProps) {
  const { locale } = useI18n()
  const { toast } = useToast()
  const isAr = locale === "ar"

  const categories = CATEGORIES_BY_COMMUNITY[community]
  const labels = (id: string) =>
    isAr ? CATEGORY_LABELS_AR[id] || id : id

  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [activePostId, setActivePostId] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [newCategory, setNewCategory] = useState<string>(categories[0])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, community, postType])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        community,
        post_type: postType,
      })
      if (category !== "all") params.set("category", category)
      if (search.trim()) params.set("search", search.trim())
      const res = await fetch(`/api/community/forum?${params}`)
      const data = await res.json()
      if (res.ok) setPosts(data.posts || [])
      else
        toast({
          title: isAr ? "خطأ" : "Error",
          description: data.error,
          variant: "destructive",
        })
    } catch {
      toast({
        title: isAr ? "خطأ في الشبكة" : "Network error",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/community/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          community,
          post_type: postType,
          title: newTitle.trim(),
          content: newContent.trim(),
          category: newCategory,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: isAr ? "تم النشر" : "Posted",
        })
        setIsCreateOpen(false)
        setNewTitle("")
        setNewContent("")
        fetchPosts()
      } else {
        toast({
          title: isAr ? "خطأ" : "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } finally {
      setCreating(false)
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return posts
    const q = search.toLowerCase()
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
    )
  }, [posts, search])

  if (activePostId) {
    return (
      <ForumThread
        postId={activePostId}
        community={community}
        onBack={() => {
          setActivePostId(null)
          fetchPosts()
        }}
      />
    )
  }

  const isQna = postType === "qna"
  const title = isAr
    ? isQna
      ? "الاستشارات العامة"
      : "منتدى النقاش"
    : isQna
      ? "General Consultations"
      : "Discussion Forum"
  const subtitle = isAr
    ? isQna
      ? "اطرح سؤالك ويرد عليه أعضاء المجتمع"
      : "شارك تجاربك واسأل واقترح"
    : isQna
      ? "Ask anything; community members answer"
      : "Share, discuss, ask"

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-1" />
              {isAr
                ? isQna
                  ? "اطرح سؤال"
                  : "موضوع جديد"
                : isQna
                  ? "Ask"
                  : "New topic"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isAr
                  ? isQna
                    ? "طرح سؤال جديد"
                    : "موضوع جديد"
                  : isQna
                    ? "New question"
                    : "New topic"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder={
                  isAr ? "عنوان واضح ومحدد" : "Clear, specific title"
                }
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={255}
              />
              <Select value={newCategory} onValueChange={setNewCategory}>
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
              <MarkdownEditor
                value={newContent}
                onChange={setNewContent}
                placeholder={
                  isAr
                    ? "اشرح موضوعك بالتفصيل…"
                    : "Describe your topic in detail…"
                }
                rows={10}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={creating}
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  creating || !newTitle.trim() || !newContent.trim()
                }
              >
                {creating
                  ? isAr
                    ? "جارٍ النشر…"
                    : "Posting…"
                  : isAr
                    ? "نشر"
                    : "Post"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث…" : "Search…"}
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
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
            {isAr ? "لا توجد منشورات بعد" : "No posts yet"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePostId(p.id)}
              className="block w-full text-right"
            >
              <Card
                className={`hover:border-primary/40 transition-colors ${
                  p.is_hidden ? "opacity-60" : ""
                }`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.author_avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.author_avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {p.is_pinned && (
                          <Pin className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        {p.is_locked && (
                          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        {p.is_hidden && (
                          <EyeOff className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        {p.best_reply_id && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        <h3 className="font-bold text-foreground truncate">
                          {p.title}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {p.content}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                        <span className="font-medium text-foreground/80">
                          {p.author_name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {labels(p.category)}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {p.replies_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {p.views_count}
                        </span>
                        <span className="ml-auto">
                          {new Date(
                            p.last_reply_at || p.created_at
                          ).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 text-muted-foreground self-center ${
                        isAr ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
