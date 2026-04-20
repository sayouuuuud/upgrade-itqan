'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, BookOpen, X, Loader2 } from 'lucide-react'

interface Path {
  id: string
  title: string
  description: string
  subject: string
  level: string
  is_published: boolean
  total_courses: number
  estimated_hours: number
}

const SUBJECTS = [
  { value: 'quran', label: 'القرآن الكريم' },
  { value: 'tajweed', label: 'التجويد' },
  { value: 'fiqh', label: 'الفقه' },
  { value: 'aqeedah', label: 'العقيدة' },
  { value: 'seerah', label: 'السيرة النبوية' },
  { value: 'tafseer', label: 'التفسير' },
  { value: 'arabic', label: 'اللغة العربية' },
  { value: 'general', label: 'عام' },
]
const LEVELS = [
  { value: 'beginner', label: 'مبتدئ' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced', label: 'متقدم' },
]

const emptyForm = { title: '', description: '', subject: 'quran', level: 'beginner', estimated_hours: 0 }

export default function AdminPathsPage() {
  const [paths, setPaths] = useState<Path[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Path | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPaths = async () => {
    try {
      const res = await fetch('/api/academy/admin/paths')
      if (res.ok) {
        const data = await res.json()
        setPaths(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch paths:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPaths() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (path: Path) => {
    setEditItem(path)
    setForm({ title: path.title, description: path.description || '', subject: path.subject || 'quran', level: path.level || 'beginner', estimated_hours: path.estimated_hours || 0 })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) return
    setSaving(true)
    try {
      const url = editItem ? `/api/academy/admin/paths/${editItem.id}` : '/api/academy/admin/paths'
      const method = editItem ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setShowModal(false)
        fetchPaths()
      } else {
        alert('حدث خطأ في الحفظ')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المسار؟')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/academy/admin/paths/${id}`, { method: 'DELETE' })
      if (res.ok) fetchPaths()
      else alert('لا يمكن الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  const getSubjectLabel = (val: string) => SUBJECTS.find(s => s.value === val)?.label || val
  const getLevelLabel = (val: string) => LEVELS.find(l => l.value === val)?.label || val

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-purple-600" />
            مسارات التعلم
          </h1>
          <p className="text-muted-foreground mt-1">إجمالي: {paths.length} مسار</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          مسار جديد
        </button>
      </div>

      {paths.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <BookOpen className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium mb-4">لا توجد مسارات تعليمية بعد</p>
          <button onClick={openAdd} className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors">
            <Plus className="w-4 h-4 inline ml-1" /> أضف أول مسار
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((path) => (
            <div key={path.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg flex-1 ml-2">{path.title}</h3>
                <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full font-medium shrink-0">
                  {getLevelLabel(path.level)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{path.description}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="bg-muted px-2 py-0.5 rounded-full">{getSubjectLabel(path.subject)}</span>
                <span>{path.total_courses || 0} دورة</span>
                {path.estimated_hours > 0 && <span>{path.estimated_hours} ساعة</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(path)} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> تعديل
                </button>
                <button
                  onClick={() => handleDelete(path.id)}
                  disabled={deletingId === path.id}
                  className="flex items-center justify-center py-2 px-3 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  {deletingId === path.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
              <h3 className="text-lg font-bold">{editItem ? 'تعديل المسار' : 'إضافة مسار جديد'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold block mb-1.5">اسم المسار <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: مسار تعلم التجويد من الصفر"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5">الوصف</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="وصف مختصر للمسار..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold block mb-1.5">التخصص</label>
                  <select
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1.5">المستوى</label>
                  <select
                    value={form.level}
                    onChange={e => setForm({ ...form, level: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5">الساعات التقديرية</label>
                <input
                  type="number"
                  min={0}
                  value={form.estimated_hours}
                  onChange={e => setForm({ ...form, estimated_hours: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg font-bold hover:bg-muted transition-colors">
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editItem ? 'حفظ التعديلات' : 'إضافة المسار'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
