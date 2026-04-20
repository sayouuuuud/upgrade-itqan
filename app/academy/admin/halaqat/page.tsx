'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Edit2, X, Loader2, Video, Link } from 'lucide-react'

interface Halaqa {
  id: string
  name: string
  description: string
  teacher_id: string
  gender: string
  max_students: number
  meeting_link: string
  is_active: boolean
  created_at: string
}

interface Teacher {
  id: string
  name: string
}

const emptyForm = { name: '', description: '', teacher_id: '', gender: 'both', max_students: 20, meeting_link: '' }

export default function AdminHalaqatPage() {
  const [halaqat, setHalaqat] = useState<Halaqa[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Halaqa | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [halaqaRes, teachersRes] = await Promise.all([
        fetch('/api/academy/admin/halaqat'),
        fetch('/api/academy/admin/teachers')
      ])
      if (halaqaRes.ok) {
        const data = await halaqaRes.json()
        setHalaqat(Array.isArray(data) ? data : data.data || [])
      }
      if (teachersRes.ok) {
        const data = await teachersRes.json()
        setTeachers((Array.isArray(data) ? data : data.data || []).map((t: any) => ({ id: t.id, name: t.name })))
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (h: Halaqa) => {
    setEditItem(h)
    setForm({ name: h.name, description: h.description || '', teacher_id: h.teacher_id || '', gender: h.gender || 'both', max_students: h.max_students || 20, meeting_link: h.meeting_link || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    try {
      const url = editItem ? `/api/academy/admin/halaqat/${editItem.id}` : '/api/academy/admin/halaqat'
      const method = editItem ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setShowModal(false)
        fetchData()
      } else {
        alert('حدث خطأ في الحفظ')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الحلقة؟')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/academy/admin/halaqat/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
      else alert('لا يمكن الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  const genderLabels: Record<string, string> = { male: 'ذكور', female: 'إناث', both: 'مختلط' }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            الحلقات التعليمية
          </h1>
          <p className="text-muted-foreground mt-1">إجمالي: {halaqat.length} حلقة</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> حلقة جديدة
        </button>
      </div>

      {halaqat.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Users className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium mb-4">لا توجد حلقات بعد</p>
          <button onClick={openAdd} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4 inline ml-1" /> أضف أول حلقة
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {halaqat.map((h) => (
            <div key={h.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg flex-1 ml-2">{h.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {h.is_active !== false ? 'نشطة' : 'متوقفة'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{h.description}</p>
              <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
                <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">{genderLabels[h.gender] || h.gender}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> الحد: {h.max_students}</span>
              </div>
              {h.meeting_link && (
                <a href={h.meeting_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline mb-3">
                  <Video className="w-3.5 h-3.5" /> رابط الاجتماع
                </a>
              )}
              <div className="flex gap-2">
                <button onClick={() => openEdit(h)} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> تعديل
                </button>
                <button onClick={() => handleDelete(h.id)} disabled={deletingId === h.id}
                  className="flex items-center justify-center py-2 px-3 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  {deletingId === h.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="text-lg font-bold">{editItem ? 'تعديل الحلقة' : 'إضافة حلقة جديدة'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold block mb-1.5">اسم الحلقة <span className="text-red-500">*</span></label>
                <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: حلقة تحفيظ الجزء الأول"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5">الوصف</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="تفاصيل الحلقة..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              {teachers.length > 0 && (
                <div>
                  <label className="text-sm font-bold block mb-1.5">المدرس</label>
                  <select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">اختر مدرساً</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold block mb-1.5">الجنس</label>
                  <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="both">مختلط</option>
                    <option value="male">ذكور فقط</option>
                    <option value="female">إناث فقط</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1.5">الحد الأقصى</label>
                  <input type="number" min={1} max={500} value={form.max_students} onChange={e => setForm({ ...form, max_students: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5">رابط الاجتماع (Zoom/Meet)</label>
                <input type="url" value={form.meeting_link} onChange={e => setForm({ ...form, meeting_link: e.target.value })} placeholder="https://zoom.us/j/..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg font-bold hover:bg-muted transition-colors">إلغاء</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editItem ? 'حفظ التعديلات' : 'إضافة الحلقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
