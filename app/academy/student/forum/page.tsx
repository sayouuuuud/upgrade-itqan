'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Users, Search, MessageSquare, Plus, Loader2, Pin, ArrowRight, User as UserIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

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

export default function StudentForumPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
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
  const [newCategory, setNewCategory] = useState('general')
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
      const data = await res.json()
      if (res.ok) {
        setActivePost(data.post)
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
      const data = await res.json()
      if (res.ok && data.reply) {
        setReplies(prev => [...prev, data.reply])
        setReplyText('')
      }
    } finally {
      setSendingReply(false)
    }
  }

  const categories = [
    { id: 'all', label: isAr ? 'الكل' : 'All' },
    { id: 'general', label: isAr ? 'نقاش عام' : 'General' },
    { id: 'questions', label: isAr ? 'أسئلة ومساعدة' : 'Questions' },
    { id: 'announcements', label: isAr ? 'إعلانات' : 'Announcements' },
    { id: 'articles', label: isAr ? 'مقالات تعليمية' : 'Articles' },
    { id: 'guidance', label: isAr ? 'إرشادات' : 'Guidance' },
  ]

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  if (activePostId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12" dir={isAr ? "rtl" : "ltr"}>
        <Button variant="ghost" onClick={() => setActivePostId(null)} className="mb-2">
          {isAr ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowRight className="w-4 h-4 mr-2 rotate-180" />}
          {isAr ? "العودة للمنتدى" : "Back to Forum"}
        </Button>

        {loadingPost ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : activePost && (
          <div className="space-y-6">
            <Card className="border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    {activePost.author_avatar ? (
                      <img src={activePost.author_avatar} alt="..." className="w-full h-full rounded-full object-cover" />
                    ) : <UserIcon className="w-6 h-6 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground mb-1">{activePost.title}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <span className="font-medium text-foreground/80">{activePost.author_name}</span>
                      <span>•</span>
                      <span>{formatTime(activePost.created_at)}</span>
                      <span>•</span>
                      <span className="bg-muted px-2 py-0.5 rounded-md text-xs">{activePost.category}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{activePost.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <h3 className="font-bold text-lg px-2">{isAr ? "الردود" : "Replies"} ({replies.length})</h3>

            <div className="space-y-4">
              {replies.map((reply) => (
                <Card key={reply.id} className={`border-border ${reply.author_role === 'teacher' || reply.author_role === 'academy_admin' ? 'border-primary/30 shadow-primary/5 bg-primary/5' : 'shadow-sm'}`}>
                  <CardContent className="p-5 flex gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      {reply.author_avatar ? (
                        <img src={reply.author_avatar} alt="..." className="w-full h-full rounded-full object-cover" />
                      ) : <UserIcon className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{reply.author_name}</span>
                          {(reply.author_role === 'teacher' || reply.author_role === 'academy_admin') && (
                            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm font-bold">
                              {isAr ? "إدارة / أستاذ" : "Staff"}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatTime(reply.created_at)}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-foreground/85 leading-relaxed">{reply.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card className="border-border shadow-sm border-primary/20 mt-8">
                <CardContent className="p-4 flex gap-3 flex-col sm:flex-row">
                  <Textarea
                    placeholder={isAr ? "اكتب ردك هنا..." : "Write a reply..."}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 min-h-[80px]"
                  />
                  <Button onClick={handleSendReply} disabled={!replyText.trim() || sendingReply} className="sm:self-end h-10">
                    {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "إرسال الرد" : "Send Reply")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            {isAr ? "منتدى الطلاب" : "Student Forum"}
          </h1>
          <p className="text-muted-foreground font-medium">
            {isAr ? "شارك أسئلتك، مناقشاتك وتبادل الفوائد مع زملائك والأساتذة." : "Share questions, discussions, and exchange benefits with your peers and teachers."}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          {isAr ? "موضوع جديد" : "New Topic"}
        </Button>
      </div>

      <div className="flex gap-2 p-1 bg-muted rounded-xl overflow-x-auto custom-scrollbar border border-border">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${category === cat.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : posts.length === 0 ? (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-bold text-foreground mb-1">{isAr ? "لا توجد مواضيع هنا" : "No topics here"}</p>
              <p className="text-sm text-muted-foreground">{isAr ? "كن أول من يبدأ النقاش!" : "Be the first to start a discussion!"}</p>
            </CardContent>
          </Card>
        ) : (
          posts.map(post => (
            <Card key={post.id} onClick={() => handleOpenPost(post)} className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${post.is_pinned ? 'bg-primary/5 border-primary/30' : ''}`}>
              <CardContent className="p-4 sm:p-5 flex gap-4 items-start">
                <div className="w-10 h-10 bg-muted rounded-full flex shrink-0 items-center justify-center">
                  <UserIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {post.is_pinned && <Pin className="w-3.5 h-3.5 fill-primary text-primary" />}
                    <h3 className="font-bold text-base text-foreground truncate">{post.title}</h3>
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-sm">{post.category}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{post.content}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
                    <span className="text-foreground/70">{post.author_name}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {post.replies_count} {isAr ? "رد" : "reply"}</span>
                    <span>{formatTime(post.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px] border-border bg-card">
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة موضوع جديد" : "Add New Topic"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4" dir={isAr ? "rtl" : "ltr"}>
            <div className="space-y-1">
              <label className="text-sm font-bold text-foreground">{isAr ? "عنوان الموضوع" : "Topic Title"}</label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={isAr ? "اكتب عنواناً مناسباً ومختصراً..." : "Write a suitable brief title..."} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-foreground">{isAr ? "التصنيف" : "Category"}</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full border-border bg-card p-2 rounded-md border focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="general">{isAr ? 'نقاش عام' : 'General'}</option>
                <option value="questions">{isAr ? 'أسئلة ومساعدة' : 'Questions'}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-foreground">{isAr ? "المحتوى" : "Content"}</label>
              <Textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={6}
                placeholder={isAr ? "اكتب تفاصيل الموضوع هنا..." : "Write topic details here..."}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse sm:justify-start">
            <Button onClick={handleCreatePost} disabled={!newTitle.trim() || !newContent.trim() || creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "نشر الموضوع" : "Publish Topic")}
            </Button>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
