'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Plus, Trash2, Edit2, CheckCircle, X, Loader2, Clock } from 'lucide-react'

interface FiqhQuestion {
  id: string
  question: string
  answer: string
  category: string
  is_published: boolean
  asked_at: string
  answered_at: string
}

const CATEGORIES = [
  { value: 'taharah', label: 'الطهارة' },
  { value: 'salah', label: 'الصلاة' },
  { value: 'sawm', label: 'الصيام' },
  { value: 'zakat', label: 'الزكاة' },
  { value: 'hajj', label: 'الحج' },
  { value: 'muamalat', label: 'المعاملات' },
  { value: 'nikah', label: 'النكاح' },
  { value: 'general', label: 'عام' },
  { value: 'other', label: 'أخرى' },
]

const emptyForm = { question: '', answer: '', category: 'general', is_published: false }

export default function AdminFiqhPage() {
  const [questions, setQuestions] = useState<FiqhQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<FiqhQuestion | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/academy/admin/fiqh')
      if (res.ok) {
        const data = await res.json()
        setQuestions(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch fiqh questions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQuestions() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (q: FiqhQuestion) => {
    setEditItem(q)
    setForm({ question: q.question, answer: q.answer || '', category: q.category || 'general', is_published: q.is_published || false })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.question) return
    setSaving(true)
    try {
      const url = editItem ? `/api/academy/admin/fiqh/${editItem.id}` : '/api/academy/admin/fiqh'
      const method = editItem ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setShowModal(false)
        fetchQuestions()
      } else {
        alert('حدث خطأ في الحفظ')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/academy/admin/fiqh/${id}`, { method: 'DELETE' })
      if (res.ok) fetchQuestions()
      else alert('لا يمكن الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-teal-600" />
            أسئلة الفقه
          </h1>
          <p className="text-muted-foreground mt-1">إجمالي: {questions.length} سؤال</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          إضافة سؤال
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <MessageSquare className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium mb-4">لا توجد أسئلة فقهية بعد</p>
          <button onClick={openAdd} className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors">
            <Plus className="w-4 h-4 inline ml-1" /> أضف أول سؤال
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full font-medium">
                      {CATEGORIES.find(c => c.value === q.category)?.label || q.category}
                    </span>
                    {q.is_published ? (
                      <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> مجاب ومنشور
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> معلق
                      </span>
                    )}
                  </div>
                  <p className="font-bold mb-2">{q.question}</p>
                  {q.answer && (
                    <div className="mt-2 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-100 dark:border-teal-800/50">
                      <p className="text-sm text-teal-800 dark:text-teal-300 line-clamp-2">{q.answer}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(q)} className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={deletingId === q.id}
                    className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500"
                  >
                    {deletingId === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="text-lg font-bold">{editItem ? 'تعديل السؤال' : 'إضافة سؤال فقهي'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold block mb-1.5">السؤال <span className="text-red-500">*</span></label>
                <textarea required rows={3} value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="اكتب السؤال الفقهي هنا..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5">التصنيف</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5">الإجابة</label>
                <textarea rows={5} value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} placeholder="اكتب الإجابة الشرعية هنا..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })}
                  className="w-4 h-4 accent-teal-600 rounded" />
                <span className="text-sm font-medium">نشر السؤال والإجابة للطلاب</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg font-bold hover:bg-muted transition-colors">إلغاء</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editItem ? 'حفظ التعديلات' : 'إضافة السؤال'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
