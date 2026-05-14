'use client'

import { useState, useEffect, use } from 'react'
import { Layers, Plus, Trash2, Loader2, BookOpen, Route, ArrowRight, GripVertical, X } from 'lucide-react'
import Link from 'next/link'

interface SeriesDetail {
  id: string
  title: string
  description: string
  subject: string
  teacher_name: string
  is_published: boolean
}

interface SeriesItem {
  id: string
  series_id: string
  item_type: 'course' | 'path'
  course_id: string | null
  path_id: string | null
  order_index: number
  title: string
  description: string
}

interface AvailableCourse {
  id: string
  title: string
  description: string
}

interface AvailablePath {
  id: string
  title: string
  description: string
}

export default function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [series, setSeries] = useState<SeriesDetail | null>(null)
  const [items, setItems] = useState<SeriesItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addType, setAddType] = useState<'course' | 'path'>('course')
  const [courses, setCourses] = useState<AvailableCourse[]>([])
  const [paths, setPaths] = useState<AvailablePath[]>([])
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState('')

  const fetchSeries = async () => {
    try {
      const res = await fetch(`/api/academy/admin/series/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSeries(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch series:', error)
    }
  }

  const fetchItems = async () => {
    try {
      const res = await fetch(`/api/academy/admin/series/${id}/items`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailable = async () => {
    try {
      const [coursesRes, pathsRes] = await Promise.all([
        fetch('/api/academy/admin/courses'),
        fetch('/api/academy/admin/paths')
      ])
      if (coursesRes.ok) {
        const json = await coursesRes.json()
        setCourses(Array.isArray(json) ? json : json.data || [])
      }
      if (pathsRes.ok) {
        const json = await pathsRes.json()
        setPaths(Array.isArray(json) ? json : json.data || [])
      }
    } catch {}
  }

  useEffect(() => {
    fetchSeries()
    fetchItems()
    fetchAvailable()
  }, [id])

  const handleAddItem = async () => {
    if (!selectedItemId) return
    setSaving(true)
    try {
      const body: Record<string, string> = { item_type: addType }
      if (addType === 'course') body.course_id = selectedItemId
      else body.path_id = selectedItemId

      const res = await fetch(`/api/academy/admin/series/${id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        setShowAddModal(false)
        setSelectedItemId('')
        fetchItems()
      } else {
        const err = await res.json()
        alert(err.error || 'حدث خطأ')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('هل تريد إزالة هذا العنصر من السلسلة؟')) return
    setRemovingId(itemId)
    try {
      const res = await fetch(`/api/academy/admin/series/${id}/items?itemId=${itemId}`, { method: 'DELETE' })
      if (res.ok) fetchItems()
    } finally {
      setRemovingId(null)
    }
  }

  const existingCourseIds = new Set(items.filter(i => i.item_type === 'course').map(i => i.course_id))
  const existingPathIds = new Set(items.filter(i => i.item_type === 'path').map(i => i.path_id))
  const availableCourses = courses.filter(c => !existingCourseIds.has(c.id))
  const availablePaths = paths.filter(p => !existingPathIds.has(p.id))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!series) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">السلسلة غير موجودة</p>
        <Link href="/academy/admin/series" className="text-emerald-600 hover:underline mt-2 inline-block">
          العودة للسلاسل
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/academy/admin/series" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ArrowRight className="w-4 h-4" />
            العودة للسلاسل
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-7 h-7 text-emerald-600" />
            {series.title}
          </h1>
          {series.description && (
            <p className="text-muted-foreground mt-1">{series.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            {series.teacher_name && <span>الشيخ: {series.teacher_name}</span>}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              series.is_published
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {series.is_published ? 'منشورة' : 'مسودة'}
            </span>
          </div>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setSelectedItemId(''); setAddType('course') }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          إضافة عنصر
        </button>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Layers className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium mb-2">لا توجد عناصر في هذه السلسلة</p>
          <p className="text-sm text-muted-foreground mb-4">أضف دورات أو مسارات تعليمية لهذه السلسلة</p>
          <button
            onClick={() => { setShowAddModal(true); setSelectedItemId(''); setAddType('course') }}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4 inline ml-1" /> أضف أول عنصر
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="text-muted-foreground">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold text-muted-foreground">
                {index + 1}
              </div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                item.item_type === 'course'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
              }`}>
                {item.item_type === 'course' ? <BookOpen className="w-4 h-4" /> : <Route className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{item.title || 'بدون عنوان'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.item_type === 'course' ? 'دورة' : 'مسار تعليمي'}
                </p>
              </div>
              <button
                onClick={() => handleRemoveItem(item.id)}
                disabled={removingId === item.id}
                className="p-2 border border-red-200 dark:border-red-800 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                {removingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold">إضافة عنصر للسلسلة</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Type tabs */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => { setAddType('course'); setSelectedItemId('') }}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                    addType === 'course' ? 'bg-background shadow-sm text-blue-600' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> دورة
                </button>
                <button
                  onClick={() => { setAddType('path'); setSelectedItemId('') }}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                    addType === 'path' ? 'bg-background shadow-sm text-purple-600' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Route className="w-4 h-4" /> مسار تعليمي
                </button>
              </div>

              {/* Selection */}
              <div>
                <label className="text-sm font-bold block mb-1.5">
                  اختر {addType === 'course' ? 'الدورة' : 'المسار'}
                </label>
                <select
                  value={selectedItemId}
                  onChange={e => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- اختر --</option>
                  {addType === 'course'
                    ? availableCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)
                    : availablePaths.map(p => <option key={p.id} value={p.id}>{p.title}</option>)
                  }
                </select>
                {addType === 'course' && availableCourses.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">لا توجد دورات متاحة للإضافة</p>
                )}
                {addType === 'path' && availablePaths.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">لا توجد مسارات متاحة للإضافة</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddItem}
                  disabled={saving || !selectedItemId}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  إضافة
                </button>
                <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 border border-border rounded-lg font-medium hover:bg-muted transition-colors">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
