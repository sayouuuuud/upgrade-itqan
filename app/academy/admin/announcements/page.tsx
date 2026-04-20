'use client'

import { useState, useEffect } from 'react'
import { Bell, Plus, Trash2, Edit2, X, Loader2, Users } from 'lucide-react'

interface Announcement {
  id: string
  title_ar: string
  content_ar: string
  target_audience: string
  priority: string
  is_published: boolean
  created_at: string
}

const AUDIENCES = [
  { value: 'all', label: 'الجميع' },
  { value: 'students', label: 'الطلاب' },
  { value: 'teachers', label: 'المدرسون' },
  { value: 'parents', label: 'أولياء الأمور' },
]

const PRIORITIES = [
  { value: 'low', label: 'منخفضة', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  { value: 'normal', label: 'عادية', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'high', label: 'عالية', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'urgent', label: 'عاجلة', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
]

const emptyForm = { title_ar: '', content_ar: '', target_audience: 'all', priority: 'normal', is_published: false }

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Announcement | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/academy/admin/announcements')
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAnnouncements() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (a: Announcement) => {
    setEditItem(a)
    setForm({ title_ar: a.title_ar, content_ar: a.content_ar || '', target_audience: a.target_audience || 'all', priority: a.priority || 'normal', is_published: a.is_published || false })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title_ar || !form.content_ar) return
    setSaving(true)
    try {
      const url = editItem ? `/api/academy/admin/announcements/${editItem.id}` : '/api/academy/admin/announcements'
      const method = editItem ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setShowModal(false)
        fetchAnnouncements()
      } else {
        alert('حدث خطأ في الحفظ')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/academy/admin/announcements/${id}`, { method: 'DELETE' })
      if (res.ok) fetchAnnouncements()
      else alert('لا يمكن الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-7 h-7 text-rose-600" />
            الإعلانات
          </h1>
          <p className="text-muted-foreground mt-1">إجمالي: {announcements.length} إعلان</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> إعلان جديد
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Bell className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium mb-4">لا توجد إعلانات بعد</p>
          <button onClick={openAdd} className="px-6 py-2.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors">
            <Plus className="w-4 h-4 inline ml-1" /> أضف أول إعلان
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const pr = PRIORITIES.find(p => p.value === a.priority) || PRIORITIES[1]
            return (
              <div key={a.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold">{a.title_ar}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pr.cls}`}>{pr.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {a.is_published ? 'منشور' : 'مسودة'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{a.content_ar}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{AUDIENCES.find(au => au.value === a.target_audience)?.label || a.target_audience}</span>
                      <span>{new Date(a.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(a)} className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(a.id)} disabled={deletingId === a.id}
                      className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500">
                      {deletingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="text-lg font-bold">{editItem ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold block mb-1.5">عنوان الإعلان <span className="text-red-500">*</span></label>
                <input required type="text" value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} placeholder="عنوان واضح ومختصر"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5">محتوى الإعلان <span className="text-red-500">*</span></label>
                <textarea required rows={4} value={form.content_ar} onChange={e => setForm({ ...form, content_ar: e.target.value })} placeholder="تفاصيل الإعلان..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold block mb-1.5">الجمهور المستهدف</label>
                  <select value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-rose-500">
                    {AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1.5">الأولوية</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-rose-500">
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4 accent-rose-600 rounded" />
                <span className="text-sm font-medium">نشر الإعلان فوراً</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg font-bold hover:bg-muted transition-colors">إلغاء</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editItem ? 'حفظ التعديلات' : 'إضافة الإعلان'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
