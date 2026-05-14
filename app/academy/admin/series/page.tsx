'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, Layers, X, Loader2, BookOpen, Route, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface Series {
  id: string
  title: string
  description: string
  subject: string
  teacher_id: string
  teacher_name: string
  is_published: boolean
  items_count: number
  courses_count: number
  paths_count: number
  created_at: string
}

const SUBJECTS = [
  { value: '', label: 'بدون تصنيف' },
  { value: 'quran', label: 'القرآن الكريم' },
  { value: 'tajweed', label: 'التجويد' },
  { value: 'fiqh', label: 'الفقه' },
  { value: 'aqeedah', label: 'العقيدة' },
  { value: 'seerah', label: 'السيرة النبوية' },
  { value: 'tafseer', label: 'التفسير' },
  { value: 'arabic', label: 'اللغة العربية' },
  { value: 'general', label: 'عام' },
]

const emptyForm = { title: '', description: '', subject: '', teacher_id: '' }

export default function AdminSeriesPage() {
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Series | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])

  const fetchSeries = async () => {
    try {
      const res = await fetch('/api/academy/admin/series')
      if (res.ok) {
        const data = await res.json()
        setSeriesList(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch series:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/academy/admin/teachers')
      if (res.ok) {
        const json = await res.json()
        setTeachers(json.data || [])
      }
    } catch {}
  }

  useEffect(() => {
    fetchSeries()
    fetchTeachers()
  }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (series: Series) => {
    setEditItem(series)
    setForm({
      title: series.title,
      description: series.description || '',
      subject: series.subject || '',
      teacher_id: series.teacher_id || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) return
    setSaving(true)
    try {
      const url = editItem ? `/api/academy/admin/series/${editItem.id}` : '/api/academy/admin/series'
      const method = editItem ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setShowModal(false)
        fetchSeries()
      } else {
        alert('حدث خطأ في الحفظ')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه السلسلة؟ سيتم حذف جميع الربط بالدورات والمسارات.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/academy/admin/series/${id}`, { method: 'DELETE' })
      if (res.ok) fetchSeries()
      else alert('لا يمكن الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  const togglePublish = async (series: Series) => {
    try {
      await fetch(`/api/academy/admin/series/${series.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !series.is_published })
      })
      fetchSeries()
    } catch {}
  }

  const getSubjectLabel = (val: string) => SUBJECTS.find(s => s.value === val)?.label || val || 'بدون تصنيف'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-7 h-7 text-emerald-600" />
            السلاسل التعليمية
          </h1>
          <p className="text-muted-foreground mt-1">إجمالي: {seriesList.length} سلسلة</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          سلسلة جديدة
        </button>
      </div>

      {seriesList.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Layers className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium mb-2">لا توجد سلاسل تعليمية بعد</p>
          <p className="text-sm text-muted-foreground mb-4">السلسلة تجمع دورات ومسارات مترابطة في موضوع واحد</p>
          <button onClick={openAdd} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors">
            <Plus className="w-4 h-4 inline ml-1" /> أضف أول سلسلة
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {seriesList.map((series) => (
            <div key={series.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg flex-1 ml-2">{series.title}</h3>
                <button
                  onClick={() => togglePublish(series)}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 cursor-pointer transition-colors ${
                    series.is_published
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  }`}
                >
                  {series.is_published ? 'منشورة' : 'مسودة'}
                </button>
              </div>
              {series.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{series.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span className="bg-muted px-2 py-0.5 rounded-full">{getSubjectLabel(series.subject)}</span>
                {series.teacher_name && <span className="truncate">{series.teacher_name}</span>}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {series.courses_count || 0} دورة
                </span>
                <span className="flex items-center gap-1">
                  <Route className="w-3.5 h-3.5" />
                  {series.paths_count || 0} مسار
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/academy/admin/series/${series.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> إدارة المحتوى
                </Link>
                <button onClick={() => openEdit(series)} className="flex items-center justify-center py-2 px-3 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(series.id)}
                  disabled={deletingId === series.id}
                  className="flex items-center justify-center py-2 px-3 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  {deletingId === series.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold">{editItem ? 'تعديل السلسلة' : 'إضافة سلسلة جديدة'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold block mb-1.5">اسم السلسلة <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: سلسلة تفسير القرآن الكريم"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5">الوصف</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="وصف مختصر للسلسلة..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold block mb-1.5">التخصص</label>
                  <select
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1.5">الشيخ / المدرس</label>
                  <select
                    value={form.teacher_id}
                    onChange={e => setForm({ ...form, teacher_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">اختياري</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editItem ? 'حفظ التعديلات' : 'إضافة السلسلة'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-border rounded-lg font-medium hover:bg-muted transition-colors">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
