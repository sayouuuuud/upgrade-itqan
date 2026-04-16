"use client"

import { useState, useEffect } from 'react'
import { MessageSquare, Trash2, EyeOff, AlertTriangle, Clock, User, Filter } from 'lucide-react'

interface ForumPost {
    id: string
    title: string
    content: string
    author_name: string
    author_id: string
    category: string
    created_at: string
    is_hidden: boolean
    replies_count: number
}

export default function SupervisorForumPage() {
    const [posts, setPosts] = useState<ForumPost[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('all')
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

    useEffect(() => { fetchPosts() }, [])

    async function fetchPosts() {
        setLoading(true)
        try {
            const res = await fetch('/api/academy/forum')
            if (res.ok) {
                const data = await res.json()
                setPosts(data.posts || data.topics || [])
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    async function handleAction(postId: string, action: 'hide' | 'delete' | 'warn') {
        setActionLoadingId(postId)
        try {
            const res = await fetch(`/api/academy/forum/${postId}`, {
                method: action === 'delete' ? 'DELETE' : 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            })
            if (res.ok) fetchPosts()
        } catch (err) { console.error(err) }
        finally { setActionLoadingId(null) }
    }

    const filtered = filter === 'hidden' ? posts.filter(p => p.is_hidden) : posts

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-blue-500" />
                        إشراف المنتدى
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">مراقبة المحتوى وإدارة المخالفات</p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 bg-secondary/20 border border-border rounded-lg text-sm text-foreground">
                        <option value="all">الكل</option>
                        <option value="hidden">المخفية</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse"><div className="h-4 bg-muted rounded w-1/3 mb-3" /><div className="h-3 bg-muted rounded w-full" /></div>)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground">لا توجد منشورات</h3>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(post => (
                        <div key={post.id} className={`bg-card border rounded-xl p-5 transition-colors ${post.is_hidden ? 'border-red-200 dark:border-red-800 opacity-60' : 'border-border hover:border-blue-500/30'}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-foreground truncate">{post.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{post.content}</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author_name}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(post.created_at).toLocaleDateString('ar-EG')}</span>
                                        <span className="px-2 py-0.5 bg-muted rounded-full">{post.category}</span>
                                        <span>{post.replies_count} رد</span>
                                        {post.is_hidden && <span className="text-red-500 font-bold">مخفي</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => handleAction(post.id, 'hide')} disabled={actionLoadingId === post.id}
                                        className="p-2 rounded-lg bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 transition-colors" title="إخفاء">
                                        <EyeOff className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => { if (confirm('هل أنت متأكد من الحذف؟')) handleAction(post.id, 'delete') }} disabled={actionLoadingId === post.id}
                                        className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors" title="حذف">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => { if (confirm('إرسال تحذير لصاحب المنشور؟')) handleAction(post.id, 'warn') }} disabled={actionLoadingId === post.id}
                                        className="p-2 rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition-colors" title="تحذير">
                                        <AlertTriangle className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
