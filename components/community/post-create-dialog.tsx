"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { Sparkles, MessageSquare } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useToast } from "@/hooks/use-toast"
import { MarkdownEditor } from "./markdown-editor"
import {
  ACADEMY_FORUM_CATEGORIES,
  CATEGORY_LABELS_AR,
  CATEGORY_LABELS_EN,
  MAQRAA_FORUM_CATEGORIES,
  type Community,
  type ForumPost,
  type PostType,
} from "@/lib/community/types"

interface PostCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  community: Community
  defaultPostType?: PostType
  onCreated?: (post: ForumPost) => void
}

const CATEGORIES_BY_COMMUNITY = {
  academy: ACADEMY_FORUM_CATEGORIES,
  maqraa: MAQRAA_FORUM_CATEGORIES,
} as const

export function PostCreateDialog({
  open,
  onOpenChange,
  community,
  defaultPostType = "discussion",
  onCreated,
}: PostCreateDialogProps) {
  const { locale } = useI18n()
  const { toast } = useToast()
  const isAr = locale === "ar"

  const categories = CATEGORIES_BY_COMMUNITY[community]

  const [postType, setPostType] = useState<PostType>(defaultPostType)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState<string>(categories[0])
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  const label = (id: string) =>
    isAr ? CATEGORY_LABELS_AR[id] || id : CATEGORY_LABELS_EN[id] || id

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "")
    if (!t) return
    if (tags.includes(t)) return
    if (tags.length >= 10) return
    setTags([...tags, t])
    setTagInput("")
  }

  const reset = () => {
    setTitle("")
    setContent("")
    setTags([])
    setTagInput("")
    setCategory(categories[0])
    setPostType(defaultPostType)
  }

  const submit = async () => {
    if (!title.trim() || !content.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/community/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          community,
          post_type: postType,
          title: title.trim(),
          content: content.trim(),
          category,
          tags,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: isAr ? "تم النشر" : "Posted" })
        onCreated?.(data.post)
        reset()
        onOpenChange(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isAr ? "إنشاء منشور جديد" : "Create new post"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={postType} onValueChange={(v) => setPostType(v as PostType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="discussion" className="gap-1.5">
              <MessageSquare className="w-4 h-4" />
              {isAr ? "نقاش" : "Discussion"}
            </TabsTrigger>
            <TabsTrigger value="qna" className="gap-1.5">
              <Sparkles className="w-4 h-4" />
              {isAr ? "سؤال / استشارة" : "Q&A"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={postType} className="space-y-3 mt-4">
            <Input
              placeholder={
                postType === "qna"
                  ? isAr
                    ? "اكتب سؤالك بوضوح"
                    : "Ask a clear question"
                  : isAr
                    ? "عنوان واضح ومحدد"
                    : "Clear, specific title"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
            />

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue
                  placeholder={isAr ? "اختر الفئة" : "Select category"}
                />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {label(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder={
                postType === "qna"
                  ? isAr
                    ? "اشرح خلفية سؤالك وما جربته…"
                    : "Add context, what you tried…"
                  : isAr
                    ? "اشرح موضوعك بالتفصيل…"
                    : "Describe your topic in detail…"
              }
              rows={9}
            />

            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">
                {isAr ? "وسوم (اختياري)" : "Tags (optional)"}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/15"
                  >
                    #{t} ×
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={isAr ? "أضف وسمًا واضغط Enter" : "Add tag"}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  {isAr ? "إضافة" : "Add"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={submit}
            disabled={creating || !title.trim() || !content.trim()}
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
  )
}
