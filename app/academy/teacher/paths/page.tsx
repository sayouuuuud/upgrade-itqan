'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Edit2, BookOpen, X, Loader2, BarChart3 } from 'lucide-react'

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
  { value: 'tajweed', label: 'التجويد والمقرأة' },
  { value: 'fiqh', label: 'الفقه الإسلامي' },
  { value: 'aqeedah', label: 'العقيدة الإسلامية' },
  { value: 'seerah', label: 'السيرة النبوية' },
  { value: 'tafsir', label: 'التفسير وعلوم القرآن' },
]
const LEVELS = [
  { value: 'beginner', label: 'مبتدئ' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced', label: 'متقدم' },
]

const emptyForm = { title: '', description: '', subject: 'tajweed', level: 'beginner', estimated_hours: 0 }

export default function TeacherPathsPage() {
  const [paths, setPaths] = useState<Path[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Path | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPaths = async () => {
    try {
      const res = await fetch('/api/academy/teacher/paths')
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
    setForm({ title: path.title, description: path.description || '', subject: path.subject || 'tajweed', level: path.level || 'beginner', estimated_hours: path.estimated_hours || 0 })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) return
    setSaving(true)
    try {
      const url = editItem ? `/api/academy/teacher/paths/${editItem.id}` : '/api/academy/teacher/paths'
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
      const res = await fetch(`/api/academy/teacher/paths/${id}`, { method: 'DELETE' })
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-emerald-600" />
            المسارات التعليمية المسؤولة
          </h1>
          <p className="text-muted-foreground mt-1">تتم إدارة ومتابعة إحصائيات هذه المسارات من قبلك.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          مسار جديد
        </button>
      </div>

      {paths.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <BookOpen className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium mb-4">لا توجد مسارات تعليمية بعد</p>
          <button onClick={openAdd} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors">
            <Plus className="w-4 h-4 inline ml-1" /> أضف أول مسار
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((path) => (
            <div key={path.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-lg leading-snug line-clamp-1">{path.title}</h3>
                  <span className="text-xs px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-medium shrink-0 border border-emerald-500/20">
                    {getLevelLabel(path.level)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{path.description}</p>
                
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-5">
                  <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{getSubjectLabel(path.subject)}</span>
                  <span className="bg-muted px-2 py-0.5 rounded">{path.total_courses || 0} دورة</span>
                  {path.estimated_hours > 0 && <span className="bg-muted px-2 py-0.5 rounded">{path.estimated_hours} ساعة</span>}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border/50">
                <Link 
                  href={`/academy/teacher/paths/${path.id}`} 
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  <BarChart3 className="w-4 h-4" /> عرض الإحصائيات
                </Link>
                <button 
                  onClick={() => openEdit(path)} 
                  className="flex items-center justify-center p-2 border border-border hover:bg-accent hover:text-accent-foreground rounded-xl transition-colors"
                  title="تعديل المسار"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(path.id)}
                  disabled={deletingId === path.id}
                  className="flex items-center justify-center p-2 border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors disabled:opacity-50"
                  title="حذف المسار"
                >
                  {deletingId === path.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold">{editItem ? 'تعديل المسار الأكاديمي' : 'إضافة مسار أكاديمي جديد'}</h3>
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
                  placeholder="مثال: مسار الفقه المالكي للمبتدئين"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5">الوصف</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="وصف مختصر لأهداف المسار ومحتواه..."
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
                  <label className="text-sm font-bold block mb-1.5">المستوى</label>
                  <select
                    value={form.level}
                    onChange={e => setForm({ ...form, level: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5">الساعات التقديرية للدراسة</label>
                <input
                  type="number"
                  min={0}
                  value={form.estimated_hours}
                  onChange={e => setForm({ ...form, estimated_hours: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg font-bold hover:bg-muted transition-colors">
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
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
