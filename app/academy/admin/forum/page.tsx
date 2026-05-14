'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit2, Trash2, MessageSquare, ThumbsUp, Eye, Pin, Loader2 } from 'lucide-react'

interface ForumPost {
  id: string
  title: string
  content: string
  category: string
  author_name: string | null
  replies_count: number
  likes_count: number | null
  views_count: number | null
  is_pinned: boolean
  created_at: string
}

const CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'general', label: 'نقاش عام' },
  { id: 'quran', label: 'القرآن' },
  { id: 'fiqh', label: 'الفقه' },
  { id: 'advice', label: 'نصائح' },
  { id: 'questions', label: 'أسئلة' },
  { id: 'announcements', label: 'إعلانات' },
  { id: 'articles', label: 'مقالات تعليمية' },
  { id: 'guidance', label: 'إرشادات' },
]

export default function AdminForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (category && category !== 'all') params.set('category', category)
      const res = await fetch(`/api/academy/admin/forum?${params}`)
      if (res.ok) {
        const json = await res.json() as { data?: ForumPost[] }
        setPosts(json.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch forum posts:', error)
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts()
  }, [fetchPosts])

  const categoryLabel = (id: string) => {
    const c = CATEGORIES.find(x => x.id === id)
    return c ? c.label : id
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">إدارة المنتدى</h1>
      </div>

      {/* Category filter */}
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

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.is_pinned && <Pin className="w-3.5 h-3.5 text-primary" />}
                        <h3 className="font-semibold">{post.title}</h3>
                        <Badge variant="outline">{categoryLabel(post.category)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground pt-2 flex-wrap">
                        <span>بواسطة: {post.author_name || 'غير معروف'}</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {post.replies_count || 0} رد
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.views_count || 0} مشاهدة
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {post.likes_count || 0} إعجاب
                        </span>
                        <span>{new Date(post.created_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {posts.length === 0 && (
            <Card className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">لا توجد مواضيع في المنتدى</p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
