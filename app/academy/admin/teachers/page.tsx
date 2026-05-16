'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Edit2, GraduationCap, X, Loader2, Search, CheckCircle2, Clock, XCircle, AlertCircle, RefreshCcw } from 'lucide-react'

type ApprovalStatus = 'approved' | 'pending_approval' | 'rejected' | null

interface Teacher {
  id: string
  name: string
  email: string
  gender: string
  is_active: boolean
  approval_status: ApprovalStatus
  application_status?: 'pending' | 'approved' | 'rejected' | 'draft' | null
  rejection_reason?: string | null
  submitted_at?: string | null
  created_at: string
}

const emptyForm = { name: '', email: '', gender: 'male', password: '' }

type StatusFilter = 'all' | 'approved' | 'pending_approval' | 'rejected'

const STATUS_LABELS: Record<Exclude<ApprovalStatus, null> | 'unknown', string> = {
  approved: 'موافق عليه',
  pending_approval: 'بانتظار الموافقة',
  rejected: 'مرفوض',
  unknown: 'غير محدد',
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
        <CheckCircle2 className="w-3 h-3" />
        {STATUS_LABELS.approved}
      </span>
    )
  }
  if (status === 'pending_approval') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
        <Clock className="w-3 h-3" />
        {STATUS_LABELS.pending_approval}
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
        <XCircle className="w-3 h-3" />
        {STATUS_LABELS.rejected}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {STATUS_LABELS.unknown}
    </span>
  )
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Teacher | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchTeachers = async () => {
    setFetchError(null)
    try {
      const res = await fetch('/api/academy/admin/teachers')
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const msg =
          (data && (data.error || data.detail)) ||
          `فشل تحميل بيانات المدرسين (${res.status})`
        setFetchError(typeof msg === 'string' ? msg : 'فشل تحميل بيانات المدرسين')
        setTeachers([])
        return
      }
      setTeachers(Array.isArray(data) ? data : data?.data || [])
    } catch (error: any) {
      console.error('Failed to fetch teachers:', error)
      setFetchError(error?.message || 'تعذّر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTeachers() }, [])

  const counts = useMemo(() => {
    const c = { all: teachers.length, approved: 0, pending_approval: 0, rejected: 0 }
    for (const t of teachers) {
      if (t.approval_status === 'approved') c.approved++
      else if (t.approval_status === 'pending_approval') c.pending_approval++
      else if (t.approval_status === 'rejected') c.rejected++
    }
    return c
  }, [teachers])

  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return teachers.filter((t) => {
      if (statusFilter !== 'all' && t.approval_status !== statusFilter) return false
      if (!q) return true
      return (
        (t.name || '').toLowerCase().includes(q) ||
        (t.email || '').toLowerCase().includes(q)
      )
    })
  }, [teachers, search, statusFilter])

  const openAdd = () => {
    setEditItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (teacher: Teacher) => {
    setEditItem(teacher)
    setForm({ name: teacher.name, email: teacher.email, gender: teacher.gender || 'male', password: '' })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editItem ? `/api/academy/admin/teachers/${editItem.id}` : '/api/academy/admin/teachers'
      const method = editItem ? 'PATCH' : 'POST'
      const body = editItem
        ? { name: form.name, gender: form.gender }
        : form
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        setShowModal(false)
        fetchTeachers()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'حدث خطأ')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (teacher: Teacher) => {
    const ok = confirm(
      `سيتم حذف المدرس "${teacher.name}" نهائياً من قاعدة البيانات (لا يمكن التراجع).\nهل تريد المتابعة؟`
    )
    if (!ok) return
    setDeletingId(teacher.id)
    try {
      const res = await fetch(`/api/academy/admin/teachers/${teacher.id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchTeachers()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'لا يمكن الحذف')
      }
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'الكل', count: counts.all },
    { key: 'approved', label: STATUS_LABELS.approved, count: counts.approved },
    { key: 'pending_approval', label: STATUS_LABELS.pending_approval, count: counts.pending_approval },
    { key: 'rejected', label: STATUS_LABELS.rejected, count: counts.rejected },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-emerald-600" />
            إدارة المدرسين
          </h1>
          <p className="text-muted-foreground mt-1">إجمالي: {teachers.length} مدرس</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          إضافة مدرس
        </button>
      </div>

      {/* Filters & search */}
      <div className="bg-card border border-border rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                statusFilter === tab.key
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-background border-border text-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
              <span className={`ms-2 inline-flex items-center justify-center text-xs rounded-full px-1.5 py-0.5 ${
                statusFilter === tab.key ? 'bg-white/20' : 'bg-muted'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative md:ms-auto md:max-w-xs w-full">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو البريد..."
            className="w-full pr-9 pl-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Error banner */}
      {fetchError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-red-900 dark:text-red-200">تعذّر تحميل قائمة المدرسين</p>
            <p className="text-sm text-red-800 dark:text-red-300 mt-1 break-words" dir="ltr">
              {fetchError}
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); fetchTeachers() }}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg border border-red-300 dark:border-red-700"
          >
            <RefreshCcw className="w-4 h-4" /> إعادة المحاولة
          </button>
        </div>
      )}

      {/* Grid */}
      {teachers.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <GraduationCap className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium mb-4">
            {fetchError ? 'لا توجد بيانات لعرضها — راجع الخطأ بالأعلى' : 'لا يوجد مدرسون بعد'}
          </p>
          {!fetchError && (
            <button onClick={openAdd} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors">
              <Plus className="w-4 h-4 inline ml-1" /> أضف أول مدرس
            </button>
          )}
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
          لا يوجد مدرسون مطابقون للبحث أو الفلتر الحالي.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    {teacher.name?.charAt(0) || '؟'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{teacher.name}</p>
                    <p className="text-xs text-muted-foreground truncate" dir="ltr">{teacher.email}</p>
                  </div>
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${teacher.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {teacher.is_active !== false ? 'نشط' : 'معطل'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={teacher.approval_status} />
                {teacher.approval_status === 'rejected' && teacher.rejection_reason && (
                  <span
                    className="text-xs text-red-600 dark:text-red-300 truncate max-w-full"
                    title={teacher.rejection_reason}
                  >
                    سبب الرفض: {teacher.rejection_reason}
                  </span>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                انضم: {new Date(teacher.created_at).toLocaleDateString('ar-EG')}
              </div>
              <div className="flex gap-2 mt-auto">
                <button onClick={() => openEdit(teacher)} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> تعديل
                </button>
                <button
                  onClick={() => handleDelete(teacher)}
                  disabled={deletingId === teacher.id}
                  title="حذف نهائي من قاعدة البيانات"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  {deletingId === teacher.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold">{editItem ? 'تعديل بيانات المدرس' : 'إضافة مدرس جديد'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold block mb-1.5">الاسم <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="الاسم الكامل للمدرس"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {!editItem && (
                <>
                  <div>
                    <label className="text-sm font-bold block mb-1.5">البريد الإلكتروني <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="example@email.com"
                      className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold block mb-1.5">كلمة المرور <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="كلمة مرور قوية"
                      className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="text-sm font-bold block mb-1.5">الجنس</label>
                <select
                  value={form.gender}
                  onChange={e => setForm({ ...form, gender: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
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
                  {editItem ? 'حفظ التعديلات' : 'إضافة المدرس'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
