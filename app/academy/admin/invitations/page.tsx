'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Mail, CheckCircle, X, Loader2, Send, Clock, Users } from 'lucide-react'

interface Invitation {
  id: string
  email: string
  status: 'pending' | 'accepted' | 'expired'
  role_to_assign: string
  invited_by_name?: string
  created_at: string
  accepted_at?: string
  expires_at?: string
}

const emptyForm = { email: '', role: 'student' }

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'expired'>('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchInvitations = async () => {
    try {
      const res = await fetch('/api/academy/admin/invitations')
      if (res.ok) {
        const data = await res.json()
        setInvitations(Array.isArray(data) ? data : data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch invitations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInvitations() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/academy/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok) {
        setShowModal(false)
        setForm(emptyForm)
        fetchInvitations()
      } else {
        setError(data.error || 'حدث خطأ في الإرسال')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدعوة؟')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/academy/admin/invitations/${id}`, { method: 'DELETE' })
      if (res.ok) fetchInvitations()
      else alert('فشل الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  const handleResend = async (id: string) => {
    setResendingId(id)
    try {
      const res = await fetch(`/api/academy/admin/invitations/${id}/resend`, { method: 'POST' })
      if (res.ok) {
        alert('تم إعادة إرسال الدعوة بنجاح ✅')
        fetchInvitations()
      } else {
        alert('فشل إعادة الإرسال')
      }
    } finally {
      setResendingId(null)
    }
  }

  const filteredInvitations = invitations.filter(i =>
    filter === 'all' ? true : i.status === filter
  )

  const stats = {
    all: invitations.length,
    pending: invitations.filter(i => i.status === 'pending').length,
    accepted: invitations.filter(i => i.status === 'accepted').length,
    expired: invitations.filter(i => i.status === 'expired').length,
  }

  const statusStyles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  const statusLabel: Record<string, string> = {
    pending: 'معلقة', accepted: 'مقبولة', expired: 'منتهية'
  }
  const roleLabel: Record<string, string> = {
    student: 'طالب', teacher: 'مدرس', academy_admin: 'مدير أكاديمية', parent: 'ولي أمر'
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-7 h-7 text-indigo-600" />
            الدعوات
          </h1>
          <p className="text-muted-foreground mt-1">إجمالي: {invitations.length} دعوة</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setForm(emptyForm); setError('') }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" /> دعوة جديدة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([['all', 'الكل', 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700'],
          ['pending', 'معلقة', 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700'],
          ['accepted', 'مقبولة', 'bg-green-50 dark:bg-green-900/20 text-green-700'],
          ['expired', 'منتهية', 'bg-red-50 dark:bg-red-900/20 text-red-700']] as const).map(([key, label, cls]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`p-3 rounded-xl text-center font-medium transition-all border-2 ${filter === key ? 'border-indigo-500' : 'border-transparent'} ${cls}`}>
            <div className="text-2xl font-bold">{stats[key]}</div>
            <div className="text-sm">{label}</div>
          </button>
        ))}
      </div>

      {/* List */}
      {filteredInvitations.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Mail className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium mb-4">لا توجد دعوات</p>
          <button onClick={() => setShowModal(true)}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4 inline ml-1" /> أرسل أول دعوة
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvitations.map((inv) => (
            <div key={inv.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-base">{inv.email}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[inv.status]}`}>
                      {statusLabel[inv.status]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium">
                      {roleLabel[inv.role_to_assign as keyof typeof roleLabel] || inv.role_to_assign}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {inv.invited_by_name && (
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> أُرسلت بواسطة: {inv.invited_by_name}</span>
                    )}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(inv.created_at).toLocaleDateString('ar-EG')}</span>
                    {inv.status === 'accepted' && inv.accepted_at && (
                      <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3 h-3" /> قُبلت في: {new Date(inv.accepted_at).toLocaleDateString('ar-EG')}</span>
                    )}
                    {inv.expires_at && inv.status === 'pending' && (
                      <span className="flex items-center gap-1 text-orange-500">تنتهي: {new Date(inv.expires_at).toLocaleDateString('ar-EG')}</span>
                    )}
                  </div>
                </div>
                {inv.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleResend(inv.id)}
                      disabled={resendingId === inv.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                    >
                      {resendingId === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      إعادة إرسال
                    </button>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      disabled={deletingId === inv.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      {deletingId === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      حذف
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold flex items-center gap-2"><Mail className="w-5 h-5 text-indigo-600" /> إرسال دعوة جديدة</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold block mb-1.5">البريد الإلكتروني <span className="text-red-500">*</span></label>
                <input
                  required type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="example@email.com"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5">الدور</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="student">طالب</option>
                  <option value="teacher">مدرس</option>
                  <option value="parent">ولي أمر</option>
                  <option value="academy_admin">مدير أكاديمية</option>
                </select>
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-border rounded-lg font-bold hover:bg-muted transition-colors">
                  إلغاء
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  إرسال الدعوة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
