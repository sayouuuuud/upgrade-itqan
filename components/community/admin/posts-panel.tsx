"use client"

// Admin panel: bulk-action table of forum posts.

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  EyeOff,
  Eye,
  Lock,
  LockOpen,
  Pin,
  PinOff,
  CheckCircle2,
  Trash2,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useToast } from "@/hooks/use-toast"
import {
  ACADEMY_FORUM_CATEGORIES,
  CATEGORY_LABELS_AR,
  CATEGORY_LABELS_EN,
  MAQRAA_FORUM_CATEGORIES,
  type Community,
  type ForumPost,
} from "@/lib/community/types"

const CATEGORIES_BY_COMMUNITY = {
  academy: ACADEMY_FORUM_CATEGORIES,
  maqraa: MAQRAA_FORUM_CATEGORIES,
} as const

interface PostsPanelProps {
  community: Community
}

interface AdminPost extends ForumPost {
  author_email: string
}

type StatusFilter = "all" | "visible" | "hidden" | "pending" | "pinned" | "locked"

export function PostsPanel({ community }: PostsPanelProps) {
  const { locale } = useI18n()
  const { toast } = useToast()
  const isAr = locale === "ar"

  const [status, setStatus] = useState<StatusFilter>("all")
  const [category, setCategory] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [author, setAuthor] = useState("")
  const [page, setPage] = useState(1)
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [counters, setCounters] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)

  const categories = CATEGORIES_BY_COMMUNITY[community]
  const labels = (id: string) =>
    isAr ? CATEGORY_LABELS_AR[id] || id : CATEGORY_LABELS_EN[id] || id

  const load = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())
    try {
      const sp = new URLSearchParams({
        community,
        status,
        page: String(page),
        page_size: "30",
      })
      if (category !== "all") sp.set("category", category)
      if (search.trim()) sp.set("search", search.trim())
      if (author.trim()) sp.set("author", author.trim())
      const res = await fetch(`/api/community/admin/posts?${sp.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setPosts(data.posts || [])
        const next: Record<string, number> = {}
        for (const c of data.counters || []) next[c.status] = Number(c.count)
        setCounters(next)
      } else {
        toast({ title: data.error, variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }, [community, status, page, category, search, author, toast])

  useEffect(() => {
    load()
  }, [load])

  const toggleAll = () => {
    if (selected.size === posts.length) setSelected(new Set())
    else setSelected(new Set(posts.map((p) => p.id)))
  }
  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const doAction = async (action: string) => {
    if (selected.size === 0) return
    if (action === "delete" && !confirm(isAr
      ? `حذف ${selected.size} منشور؟ هذا الإجراء نهائي.`
      : `Delete ${selected.size} posts? This is permanent.`))
      return
    setActing(true)
    try {
      const res = await fetch("/api/community/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          community,
          ids: Array.from(selected),
          action,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: isAr ? "تم" : "Done" })
        load()
      } else {
        toast({ title: data.error, variant: "destructive" })
      }
    } finally {
      setActing(false)
    }
  }

  const statusTabs: { id: StatusFilter; label_ar: string; label_en: string }[] = useMemo(
    () => [
      { id: "all", label_ar: "الكل", label_en: "All" },
      { id: "visible", label_ar: "ظاهر", label_en: "Visible" },
      { id: "hidden", label_ar: "مخفي", label_en: "Hidden" },
      { id: "pending", label_ar: "قيد المراجعة", label_en: "Pending" },
      { id: "pinned", label_ar: "مثبّت", label_en: "Pinned" },
      { id: "locked", label_ar: "مغلق", label_en: "Locked" },
    ],
    []
  )

  return (
    <div className="space-y-3">
      {/* status tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border p-1 bg-card">
        {statusTabs.map((t) => {
          const active = status === t.id
          const count = counters[t.id]
          return (
            <button
              key={t.id}
              onClick={() => {
                setStatus(t.id)
                setPage(1)
              }}
              className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap inline-flex items-center gap-1.5 ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {isAr ? t.label_ar : t.label_en}
              {t.id !== "all" && count !== undefined && (
                <Badge variant={active ? "secondary" : "outline"} className="h-5 px-1.5 font-normal">
                  {count}
                </Badge>
              )}
            </button>
          )
        })}
      </div>

      {/* filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Input
          placeholder={isAr ? "ابحث في العنوان والمحتوى…" : "Search title/content…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1)
              load()
            }
          }}
        />
        <Input
          placeholder={isAr ? "اسم الكاتب أو بريده…" : "Author name or email…"}
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1)
              load()
            }
          }}
        />
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1) }}>
          <SelectTrigger>
            <SelectValue placeholder={isAr ? "كل الأقسام" : "All categories"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "كل الأقسام" : "All categories"}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{labels(c)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* bulk action bar */}
      {selected.size > 0 && (
        <div className="rounded-lg border border-border bg-card p-2 flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium px-2">
            {isAr ? `محدد: ${selected.size}` : `Selected: ${selected.size}`}
          </span>
          <Button size="sm" variant="outline" onClick={() => doAction("hide")} disabled={acting}>
            <EyeOff className="w-3.5 h-3.5 ml-1" />
            {isAr ? "إخفاء" : "Hide"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => doAction("unhide")} disabled={acting}>
            <Eye className="w-3.5 h-3.5 ml-1" />
            {isAr ? "إظهار" : "Unhide"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => doAction("pin")} disabled={acting}>
            <Pin className="w-3.5 h-3.5 ml-1" />
            {isAr ? "تثبيت" : "Pin"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => doAction("unpin")} disabled={acting}>
            <PinOff className="w-3.5 h-3.5 ml-1" />
            {isAr ? "إلغاء التثبيت" : "Unpin"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => doAction("lock")} disabled={acting}>
            <Lock className="w-3.5 h-3.5 ml-1" />
            {isAr ? "إغلاق" : "Lock"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => doAction("unlock")} disabled={acting}>
            <LockOpen className="w-3.5 h-3.5 ml-1" />
            {isAr ? "فتح" : "Unlock"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => doAction("approve")} disabled={acting}>
            <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
            {isAr ? "اعتماد" : "Approve"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => doAction("delete")}
            disabled={acting}
            className="text-rose-500 border-rose-500/30"
          >
            <Trash2 className="w-3.5 h-3.5 ml-1" />
            {isAr ? "حذف" : "Delete"}
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox
                  checked={selected.size > 0 && selected.size === posts.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>{isAr ? "المنشور" : "Post"}</TableHead>
              <TableHead>{isAr ? "القسم" : "Category"}</TableHead>
              <TableHead>{isAr ? "الكاتب" : "Author"}</TableHead>
              <TableHead className="text-center">↑</TableHead>
              <TableHead className="text-center">💬</TableHead>
              <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {isAr ? "جارٍ التحميل…" : "Loading…"}
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {isAr ? "لا توجد منشورات" : "No posts"}
                </TableCell>
              </TableRow>
            ) : (
              posts.map((p) => (
                <TableRow key={p.id} data-selected={selected.has(p.id)}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={() => toggleOne(p.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/community/${community}/forum/${p.id}`}
                      target="_blank"
                      className="font-medium hover:underline line-clamp-1"
                    >
                      {p.title}
                    </Link>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {p.content}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {labels(p.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{p.author_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.author_email}
                    </div>
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-sm">
                    {p.upvotes_count || 0}
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-sm">
                    {p.replies_count || 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.is_hidden && <Badge variant="destructive" className="font-normal h-5 px-1.5">{isAr ? "مخفي" : "Hidden"}</Badge>}
                      {!p.is_approved && <Badge variant="secondary" className="font-normal h-5 px-1.5">{isAr ? "بانتظار" : "Pending"}</Badge>}
                      {p.is_pinned && <Badge className="font-normal h-5 px-1.5 bg-amber-500 hover:bg-amber-500">{isAr ? "مثبّت" : "Pinned"}</Badge>}
                      {p.is_locked && <Badge variant="outline" className="font-normal h-5 px-1.5">{isAr ? "مغلق" : "Locked"}</Badge>}
                      {!p.is_hidden && p.is_approved && !p.is_pinned && !p.is_locked && (
                        <Badge variant="outline" className="font-normal h-5 px-1.5">{isAr ? "ظاهر" : "Visible"}</Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          {isAr ? "السابق" : "Previous"}
        </Button>
        <span className="text-sm text-muted-foreground self-center">
          {isAr ? `صفحة ${page}` : `Page ${page}`}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={posts.length < 30 || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          {isAr ? "التالي" : "Next"}
        </Button>
      </div>
    </div>
  )
}
