'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Users, Search, MessageSquare, Plus, Loader2, Pin, ArrowRight,
  User as UserIcon, BookOpen, Lightbulb,
} from 'lucide-react'

interface Post {
  id: string
  title: string
  content: string
  category: string
  is_pinned: boolean
  replies_count: number
  views_count: number
  created_at: string
  author_name: string
  author_avatar: string | null
}

interface Reply {
  id: string
  content: string
  created_at: string
  author_name: string
  author_role: string
  author_avatar: string | null
}

const CATEGORIES = [
  { id: 'all', label: 'الكل', icon: Users },
  { id: 'articles', label: 'مقالات تعليمية', icon: BookOpen },
  { id: 'guidance', label: 'إرشادات', icon: Lightbulb },
  { id: 'general', label: 'نقاش عام', icon: MessageSquare },
  { id: 'questions', label: 'أسئلة', icon: Search },
  { id: 'announcements', label: 'إعلانات', icon: Pin },
]

export default function TeacherForumPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')

  const [activePostId, setActivePostId] = useState<string | null>(null)
  const [activePost, setActivePost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loadingPost, setLoadingPost] = useState(false)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('articles')
  const [creating, setCreating] = useState(false)

  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/academy/forum?category=${category}`)
      const data = await res.json() as { posts?: Post[] }
      if (res.ok) setPosts(data.posts || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts()
  }, [fetchPosts])

  const fetchSinglePost = async (id: string) => {
    setLoadingPost(true)
    try {
      const res = await fetch(`/api/academy/forum/${id}`)
      const data = await res.json() as { post?: Post; replies?: Reply[] }
      if (res.ok) {
        setActivePost(data.post || null)
        setReplies(data.replies || [])
      }
    } catch {
      // ignore
    } finally {
      setLoadingPost(false)
    }
  }

  const handleOpenPost = (post: Post) => {
    setActivePostId(post.id)
    fetchSinglePost(post.id)
  }

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/academy/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newContent, category: newCategory })
      })
      if (res.ok) {
        setIsCreateOpen(false)
        setNewTitle('')
        setNewContent('')
        setNewCategory('articles')
        fetchPosts()
      }
    } finally {
      setCreating(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !activePostId) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/academy/forum/${activePostId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText })
      })
      const data = await res.json() as { reply?: Reply }
      const reply = data.reply
      if (res.ok && reply) {
        setReplies(prev => [...prev, reply])
        setReplyText('')
      }
    } finally {
      setSendingReply(false)
    }
  }

  const categoryLabel = (id: string) => {
    const c = CATEGORIES.find(x => x.id === id)
    return c ? c.label : id
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ar-EG', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  if (activePostId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12" dir="rtl">
        <Button variant="ghost" onClick={() => setActivePostId(null)} className="mb-2">
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للمنتدى
        </Button>

        {loadingPost ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : activePost && (
          <div className="space-y-6">
            <Card className="border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                    {activePost.author_name?.[0]}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-foreground">{activePost.title}</h2>
                      <span className="text-xs text-muted-foreground">{formatTime(activePost.created_at)}</span>
                    </div>
                    <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-0.5 text-xs font-bold">
                      {categoryLabel(activePost.category)}
                    </span>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{activePost.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Replies */}
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              الردود ({replies.length})
            </h3>

            {replies.map(r => (
              <Card key={r.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                      {r.author_name?.[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">{r.author_name}</span>
                        {r.author_role === 'teacher' && (
                          <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-bold">معلم</span>
                        )}
                        <span className="text-xs text-muted-foreground">{formatTime(r.created_at)}</span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{r.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Reply box */}
            <Card className="border-border">
              <CardContent className="p-4">
                <Textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="اكتب ردًّا..."
                  className="resize-none mb-3"
                />
                <Button onClick={handleSendReply} disabled={!replyText.trim() || sendingReply} size="sm">
                  {sendingReply ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null}
                  إرسال الرد
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            المنتدى والمقالات
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            انشر مقالات تعليمية وإرشادات، وتفاعل مع الطلاب والزملاء.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2"
        >
          <Plus className="w-4 h-4" />
          مقال / موضوع جديد
        </Button>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-1 flex-wrap bg-muted/50 border border-border rounded-xl p-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              category === cat.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : posts.length === 0 ? (
        <Card className="text-center py-16">
          <BookOpen className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground font-bold">لا توجد مواضيع في هذا التصنيف</p>
          <p className="text-muted-foreground text-sm mt-1">كن أول من ينشر مقالًا تعليميًا!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <Card
              key={post.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
              onClick={() => handleOpenPost(post)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                    {post.author_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {post.is_pinned && <Pin className="w-3.5 h-3.5 text-primary" />}
                      <h3 className="font-bold text-foreground truncate">{post.title}</h3>
                      <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap">
                        {categoryLabel(post.category)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.content}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" />{post.author_name}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.replies_count || 0} رد</span>
                      <span>{formatTime(post.created_at)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>نشر مقال / موضوع جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-bold text-foreground">العنوان</label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="عنوان المقال أو الموضوع..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-foreground">التصنيف</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full border-border bg-card p-2 rounded-md border focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="articles">مقالات تعليمية</option>
                <option value="guidance">إرشادات</option>
                <option value="general">نقاش عام</option>
                <option value="questions">أسئلة</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-foreground">المحتوى</label>
              <Textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={8}
                placeholder="اكتب المقال أو الإرشاد التعليمي هنا..."
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse sm:justify-start">
            <Button onClick={handleCreatePost} disabled={!newTitle.trim() || !newContent.trim() || creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'نشر'}
            </Button>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
