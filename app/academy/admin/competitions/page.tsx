'use client'

import { useState, useEffect } from 'react'
import { Trophy, Plus, Trash2, Edit2, X, Loader2, Users } from 'lucide-react'

interface Competition {
  id: string
  title: string
  description: string
  type: string
  start_date: string
  end_date: string
  status: string
  max_participants: number
  prizes_description: string
}

const TYPES = [
  { value: 'monthly', label: 'شهري' },
  { value: 'ramadan', label: 'رمضان' },
  { value: 'tajweed', label: 'التجويد' },
  { value: 'memorization', label: 'الحفظ' },
  { value: 'weekly', label: 'أسبوعي' },
  { value: 'special', label: 'خاص' },
]

const emptyForm = {
  title: '',
  description: '',
  type: 'monthly',
  start_date: '',
  end_date: '',
  max_participants: 100,
  prizes_description: '',
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  upcoming: { label: 'قادمة', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  active: { label: 'نشطة', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  ended: { label: 'منتهية', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  cancelled: { label: 'ملغاة', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export default function AdminCompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Competition | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchCompetitions = async () => {
    try {
      const res = await fetch('/api/academy/admin/competitions')
      if (res.ok) {
        const data = await res.json()
        setCompetitions(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch competitions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCompetitions() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (comp: Competition) => {
    setEditItem(comp)
    setForm({
      title: comp.title,
      description: comp.description || '',
      type: comp.type || 'monthly',
      start_date: comp.start_date ? comp.start_date.slice(0, 10) : '',
      end_date: comp.end_date ? comp.end_date.slice(0, 10) : '',
      max_participants: comp.max_participants || 100,
      prizes_description: comp.prizes_description || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.start_date || !form.end_date) return
    setSaving(true)
    try {
      const url = editItem ? `/api/academy/admin/competitions/${editItem.id}` : '/api/academy/admin/competitions'
      const method = editItem ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setShowModal(false)
        fetchCompetitions()
      } else {
        alert('حدث خطأ في الحفظ')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المسابقة؟')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/academy/admin/competitions/${id}`, { method: 'DELETE' })
      if (res.ok) fetchCompetitions()
      else alert('لا يمكن الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-600" />
            المسابقات
          </h1>
          <p className="text-muted-foreground mt-1">إجمالي: {competitions.length} مسابقة</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          مسابقة جديدة
        </button>
      </div>

      {competitions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Trophy className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium mb-4">لا توجد مسابقات بعد</p>
          <button onClick={openAdd} className="px-6 py-2.5 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-colors">
            <Plus className="w-4 h-4 inline ml-1" /> أنشئ أول مسابقة
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {competitions.map((comp) => {
            const st = statusLabel[comp.status] || statusLabel.upcoming
            return (
              <div key={comp.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{comp.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{comp.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span>{TYPES.find(t => t.value === comp.type)?.label || comp.type}</span>
                      {comp.start_date && <span>من: {new Date(comp.start_date).toLocaleDateString('ar-EG')}</span>}
                      {comp.end_date && <span>إلى: {new Date(comp.end_date).toLocaleDateString('ar-EG')}</span>}
                      {comp.max_participants && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {comp.max_participants}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(comp)} className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(comp.id)}
                      disabled={deletingId === comp.id}
                      className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500"
                    >
                      {deletingId === comp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="text-lg font-bold">{editItem ? 'تعديل المسابقة' : 'إنشاء مسابقة جديدة'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold block mb-1.5">اسم المسابقة <span className="text-red-500">*</span></label>
                <input required type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثال: مسابقة القرآن الرمضانية"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5">الوصف</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="تفاصيل المسابقة..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold block mb-1.5">النوع</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-500">
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1.5">الحد الأقصى للمشاركين</label>
                  <input type="number" min={1} value={form.max_participants} onChange={e => setForm({ ...form, max_participants: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold block mb-1.5">تاريخ البداية <span className="text-red-500">*</span></label>
                  <input required type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1.5">تاريخ النهاية <span className="text-red-500">*</span></label>
                  <input required type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5">الجوائز</label>
                <textarea rows={2} value={form.prizes_description} onChange={e => setForm({ ...form, prizes_description: e.target.value })} placeholder="وصف الجوائز..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg font-bold hover:bg-muted transition-colors">إلغاء</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editItem ? 'حفظ التعديلات' : 'إنشاء المسابقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
