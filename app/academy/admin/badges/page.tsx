'use client'

import { useState, useEffect } from 'react'
import { Award, Plus, Trash2, Edit2, X, Loader2, Star } from 'lucide-react'

interface Badge {
  id: string
  badge_type: string
  badge_name: string
  badge_description: string
  badge_icon: string
  points_required: number
  is_active: boolean
  created_at: string
}

const TYPES = [
  { value: 'achievement', label: 'إنجاز' },
  { value: 'completion', label: 'إتمام' },
  { value: 'streak', label: 'استمرارية' },
  { value: 'excellence', label: 'تميز' },
  { value: 'participation', label: 'مشاركة' },
  { value: 'special', label: 'خاصة' },
]

const ICONS = ['🏆', '⭐', '🌟', '🎖️', '🥇', '🏅', '📜', '💎', '🎯', '🚀', '🌙', '📖']

const emptyForm = { badge_type: 'achievement', badge_name: '', badge_description: '', badge_icon: '🏆', points_required: 0 }

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Badge | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchBadges = async () => {
    try {
      const res = await fetch('/api/academy/admin/badges')
      if (res.ok) {
        const data = await res.json()
        setBadges(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch badges:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBadges() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (b: Badge) => {
    setEditItem(b)
    setForm({ badge_type: b.badge_type, badge_name: b.badge_name, badge_description: b.badge_description || '', badge_icon: b.badge_icon || '🏆', points_required: b.points_required || 0 })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.badge_name) return
    setSaving(true)
    try {
      const url = editItem ? `/api/academy/admin/badges/${editItem.id}` : '/api/academy/admin/badges'
      const method = editItem ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setShowModal(false)
        fetchBadges()
      } else {
        alert('حدث خطأ في الحفظ')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشارة؟')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/academy/admin/badges/${id}`, { method: 'DELETE' })
      if (res.ok) fetchBadges()
      else alert('لا يمكن الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-7 h-7 text-yellow-600" />
            الشارات والأوسمة
          </h1>
          <p className="text-muted-foreground mt-1">إجمالي: {badges.length} شارة</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> شارة جديدة
        </button>
      </div>

      {badges.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Award className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium mb-4">لا توجد شارات بعد</p>
          <button onClick={openAdd} className="px-6 py-2.5 bg-yellow-600 text-white rounded-lg font-bold hover:bg-yellow-700 transition-colors">
            <Plus className="w-4 h-4 inline ml-1" /> أنشئ أول شارة
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {badges.map((b) => (
            <div key={b.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow text-center">
              <div className="text-5xl mb-3">{b.badge_icon || '🏆'}</div>
              <h3 className="font-bold mb-1">{b.badge_name}</h3>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{b.badge_description}</p>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full font-medium">
                  {TYPES.find(t => t.value === b.badge_type)?.label || b.badge_type}
                </span>
                {b.points_required > 0 && (
                  <span className="text-xs flex items-center gap-0.5 text-muted-foreground">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {b.points_required}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(b)} className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors">
                  <Edit2 className="w-3 h-3" /> تعديل
                </button>
                <button onClick={() => handleDelete(b.id)} disabled={deletingId === b.id}
                  className="flex items-center justify-center py-1.5 px-2.5 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  {deletingId === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="text-lg font-bold">{editItem ? 'تعديل الشارة' : 'إضافة شارة جديدة'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold block mb-1.5">الأيقونة</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setForm({ ...form, badge_icon: icon })}
                      className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${form.badge_icon === icon ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'border-border hover:border-muted-foreground'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5">اسم الشارة <span className="text-red-500">*</span></label>
                <input required type="text" value={form.badge_name} onChange={e => setForm({ ...form, badge_name: e.target.value })} placeholder="مثال: حافظ الجزء الأول"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5">الوصف</label>
                <textarea rows={2} value={form.badge_description} onChange={e => setForm({ ...form, badge_description: e.target.value })} placeholder="وصف الشارة وشروط الحصول عليها..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold block mb-1.5">النوع</label>
                  <select value={form.badge_type} onChange={e => setForm({ ...form, badge_type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-yellow-500">
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1.5">النقاط المطلوبة</label>
                  <input type="number" min={0} value={form.points_required} onChange={e => setForm({ ...form, points_required: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg font-bold hover:bg-muted transition-colors">إلغاء</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editItem ? 'حفظ التعديلات' : 'إضافة الشارة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
