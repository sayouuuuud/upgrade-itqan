'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Edit2, GraduationCap, X, Loader2, Search, CheckCircle2, Clock, XCircle, AlertCircle, RefreshCcw, Ban, Unlock, History, ChevronDown, ChevronUp } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { useI18n } from '@/lib/i18n/context'

type ApprovalStatus = 'approved' | 'pending_approval' | 'rejected' | null

interface Teacher {
  id: string; name: string; email: string; gender: string; is_active: boolean; approval_status: ApprovalStatus;
  reapply_blocked: boolean; application_status?: string | null; rejection_reason?: string | null;
  submitted_at?: string | null; rejection_count?: number; last_rejected_at?: string | null;
  rejection_dates?: string[] | null; created_at: string;
}

type StatusFilter = 'all' | 'approved' | 'pending_approval' | 'rejected'

function StatusBadge({ status, a }: { status: ApprovalStatus; a: any }) {
  if (status === 'approved') return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><CheckCircle2 className="w-3 h-3" />{a.teachersApprovalApproved}</span>
  if (status === 'pending_approval') return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"><Clock className="w-3 h-3" />{a.teachersApprovalPending}</span>
  if (status === 'rejected') return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"><XCircle className="w-3 h-3" />{a.teachersApprovalRejected}</span>
  return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{a.teachersUnknown}</span>
}

export default function AdminTeachersPage() {
  const { t, locale } = useI18n()
  const a = t.academyAdmin
  const dateLocale = locale === 'ar' ? 'ar-EG' : 'en-US'

  const emptyForm = { name: '', email: '', gender: 'male', password: '', approval_status: '' as string, is_active: true }

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Teacher | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [blockingId, setBlockingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [expandedRejections, setExpandedRejections] = useState<Set<string>>(new Set())

  const fetchTeachers = async () => {
    setFetchError(null)
    try { const res = await fetch('/api/academy/admin/teachers'); const data = await res.json().catch(() => null); if (!res.ok) { const msg = (data && (data.error || data.detail)) || a.teachersLoadError; setFetchError(typeof msg === 'string' ? msg : a.teachersLoadError); setTeachers([]); return }; setTeachers(Array.isArray(data) ? data : data?.data || []) }
    catch (error: any) { setFetchError(error?.message || a.teachersLoadError) } finally { setLoading(false) }
  }

  useEffect(() => { fetchTeachers() }, [])

  const counts = useMemo(() => { const c = { all: teachers.length, approved: 0, pending_approval: 0, rejected: 0 }; for (const t of teachers) { if (t.approval_status === 'approved') c.approved++; else if (t.approval_status === 'pending_approval') c.pending_approval++; else if (t.approval_status === 'rejected') c.rejected++ }; return c }, [teachers])

  const filteredTeachers = useMemo(() => { const q = search.trim().toLowerCase(); return teachers.filter((t) => { if (statusFilter !== 'all' && t.approval_status !== statusFilter) return false; if (!q) return true; return ((t.name || '').toLowerCase().includes(q) || (t.email || '').toLowerCase().includes(q)) }) }, [teachers, search, statusFilter])

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (teacher: Teacher) => { setEditItem(teacher); setForm({ name: teacher.name, email: teacher.email, gender: teacher.gender || 'male', password: '', approval_status: teacher.approval_status || '', is_active: teacher.is_active !== false }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try { const url = editItem ? `/api/academy/admin/teachers/${editItem.id}` : '/api/academy/admin/teachers'; const method = editItem ? 'PATCH' : 'POST'; const body = editItem ? { name: form.name, gender: form.gender, approval_status: form.approval_status || undefined, is_active: form.is_active } : form; const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (res.ok) { const json = await res.json().catch(() => null); if (editItem && json?.data) { setTeachers(prev => prev.map(t => t.id === editItem.id ? { ...t, ...json.data } : t)) } else { fetchTeachers() }; setShowModal(false) } else { const err = await res.json().catch(() => ({})); alert(err.error || a.teachersError) } }
    finally { setSaving(false) }
  }

  const handleDelete = async (teacher: Teacher) => {
    if (!confirm(a.teachersDeleteConfirm.replace('{name}', teacher.name))) return; setDeletingId(teacher.id)
    try { const res = await fetch(`/api/academy/admin/teachers/${teacher.id}`, { method: 'DELETE' }); const data = await res.json().catch(() => ({})); if (res.ok) { fetchTeachers(); if (data.archived && (data.archived.courses > 0 || data.archived.halaqat > 0)) { alert(a.teachersDeleteSuccess.replace('{courses}', String(data.archived.courses)).replace('{halaqat}', String(data.archived.halaqat))) } } else { alert(data.error || a.teachersDeleteFailed) } }
    finally { setDeletingId(null) }
  }

  const toggleReapplyBlock = async (teacher: Teacher) => {
    setBlockingId(teacher.id); const newBlocked = !teacher.reapply_blocked
    try { const res = await fetch(`/api/academy/admin/teachers/${teacher.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reapply_blocked: newBlocked }) }); if (res.ok) { setTeachers(prev => prev.map(t => t.id === teacher.id ? { ...t, reapply_blocked: newBlocked } : t)) } else { const err = await res.json().catch(() => ({})); alert(err.error || a.teachersError) } }
    finally { setBlockingId(null) }
  }

  const toggleRejectionHistory = (id: string) => { setExpandedRejections(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next }) }

  if (loading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="bg-card border border-border rounded-xl p-5 space-y-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-full shrink-0" /><div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-36" /></div></div><Skeleton className="h-5 w-12 rounded-full" /></div><Skeleton className="h-3 w-24" /><div className="flex gap-2 pt-2"><Skeleton className="h-9 flex-1 rounded-lg" /><Skeleton className="h-9 w-9 rounded-lg shrink-0" /></div></div>))}</div>

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: t.all, count: counts.all },
    { key: 'approved', label: a.teachersApprovalApproved, count: counts.approved },
    { key: 'pending_approval', label: a.teachersApprovalPending, count: counts.pending_approval },
    { key: 'rejected', label: a.teachersApprovalRejected, count: counts.rejected },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="w-7 h-7 text-emerald-600" />{a.teachersTitle}</h1>
          <p className="text-muted-foreground mt-1">{a.teachersTotal.replace('{count}', String(teachers.length))}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-sm"><Plus className="w-5 h-5" /> {a.teachersAddTeacher}</button>
      </div>
      <div className="bg-card border border-border rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (<button key={tab.key} onClick={() => setStatusFilter(tab.key)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${statusFilter === tab.key ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-background border-border text-foreground hover:bg-muted'}`}>{tab.label}<span className={`ms-2 inline-flex items-center justify-center text-xs rounded-full px-1.5 py-0.5 ${statusFilter === tab.key ? 'bg-white/20' : 'bg-muted'}`}>{tab.count}</span></button>))}
        </div>
        <div className="relative md:ms-auto md:max-w-xs w-full"><Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={a.teachersSearchPlaceholder} className="w-full pr-9 pl-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
      </div>
      {fetchError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0"><p className="font-bold text-red-900 dark:text-red-200">{a.teachersLoadError}</p><p className="text-sm text-red-800 dark:text-red-300 mt-1 break-words" dir="ltr">{fetchError}</p></div>
          <button onClick={() => { setLoading(true); fetchTeachers() }} className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg border border-red-300 dark:border-red-700"><RefreshCcw className="w-4 h-4" /> {a.teachersRetry}</button>
        </div>
      )}
      {teachers.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <GraduationCap className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium mb-4">{fetchError ? a.teachersNoData : a.teachersNoTeachersYet}</p>
          {!fetchError && <button onClick={openAdd} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors"><Plus className="w-4 h-4 inline ml-1" /> {a.teachersAddFirst}</button>}
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">{a.teachersNoMatching}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeachers.map((teacher) => {
            const isExpanded = expandedRejections.has(teacher.id)
            const hasRejectionHistory = (teacher.rejection_count ?? 0) > 0
            return (
              <div key={teacher.id} className={`bg-card border rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col gap-3 ${teacher.reapply_blocked ? 'border-orange-300 dark:border-orange-800' : 'border-border'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">{teacher.name?.charAt(0) || '?'}</div>
                    <div className="min-w-0"><p className="font-bold truncate">{teacher.name}</p><p className="text-xs text-muted-foreground truncate" dir="ltr">{teacher.email}</p></div>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${teacher.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{teacher.is_active !== false ? a.teachersActive : a.teachersInactive}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={teacher.approval_status} a={a} />
                  {teacher.reapply_blocked && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"><Ban className="w-3 h-3" /> {a.teachersBlocked}</span>}
                </div>
                {teacher.approval_status === 'rejected' && teacher.rejection_reason && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5 text-xs text-red-700 dark:text-red-300"><span className="font-bold block mb-1">{a.teachersRejectionReason}</span><span>{teacher.rejection_reason}</span></div>}
                {hasRejectionHistory && (
                  <div>
                    <button onClick={() => toggleRejectionHistory(teacher.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                      <History className="w-3.5 h-3.5 text-red-500" /><span className="font-medium text-red-600 dark:text-red-400">{a.teachersRejectionHistory.replace('{count}', String(teacher.rejection_count)).replace('{time}', (teacher.rejection_count ?? 0) === 1 ? a.teachersOnce : a.teachersTimes)}</span>
                      {teacher.last_rejected_at && <span className="text-muted-foreground mr-auto">{a.teachersLastRejection} {new Date(teacher.last_rejected_at).toLocaleDateString(dateLocale)}</span>}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 mr-auto" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {isExpanded && teacher.rejection_dates && teacher.rejection_dates.length > 0 && (
                      <div className="mt-2 space-y-1 pr-4 border-r-2 border-red-200 dark:border-red-800">
                        {teacher.rejection_dates.map((date, i) => date && <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" /><span>{a.teachersRejection.replace('{num}', String(i + 1))}:</span><span dir="ltr">{new Date(date).toLocaleString(dateLocale)}</span></div>)}
                      </div>
                    )}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">{a.teachersJoined} {new Date(teacher.created_at).toLocaleDateString(dateLocale)}</div>
                <div className="flex gap-2 mt-auto flex-wrap">
                  <button onClick={() => openEdit(teacher)} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors min-w-0"><Edit2 className="w-3.5 h-3.5" /> {a.teachersEdit}</button>
                  {teacher.approval_status === 'rejected' && (
                    <button onClick={() => toggleReapplyBlock(teacher)} disabled={blockingId === teacher.id} title={teacher.reapply_blocked ? a.teachersAllowReapply : a.teachersBlockReapply} className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-lg text-sm font-medium transition-colors ${teacher.reapply_blocked ? 'border-emerald-300 dark:border-emerald-700 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'border-orange-300 dark:border-orange-700 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}>
                      {blockingId === teacher.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : teacher.reapply_blocked ? <Unlock className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{teacher.reapply_blocked ? a.teachersAllowReapply : a.teachersBlockReapply}</span>
                    </button>
                  )}
                  <button onClick={() => handleDelete(teacher)} disabled={deletingId === teacher.id} title={a.teachersDeleteTitle} className="flex items-center justify-center gap-1.5 py-2 px-3 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    {deletingId === teacher.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold">{editItem ? a.teachersEditTitle : a.teachersAddNew}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="text-sm font-bold block mb-1.5">{a.teachersName} <span className="text-red-500">*</span></label><input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={a.teachersNamePlaceholder} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              {!editItem && (<><div><label className="text-sm font-bold block mb-1.5">{a.teachersEmail} <span className="text-red-500">*</span></label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="example@email.com" className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div><div><label className="text-sm font-bold block mb-1.5">{a.teachersPassword} <span className="text-red-500">*</span></label><input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={a.teachersPasswordPlaceholder} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div></>)}
              <div><label className="text-sm font-bold block mb-1.5">{a.teachersGender}</label><select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="male">{a.teachersMale}</option><option value="female">{a.teachersFemale}</option></select></div>
              {editItem && (<>
                <div><label className="text-sm font-bold block mb-1.5">{a.teachersApprovalStatus}</label><select value={form.approval_status} onChange={e => setForm(prev => ({ ...prev, approval_status: e.target.value }))} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="pending_approval">{a.teachersApprovalPending}</option><option value="approved">{a.teachersApprovalApproved}</option><option value="rejected">{a.teachersApprovalRejected}</option></select></div>
                <div className="flex items-center gap-3"><label className="text-sm font-bold">{a.teachersStatus}</label><button type="button" onClick={() => setForm(prev => ({ ...prev, is_active: !prev.is_active }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-1' : 'translate-x-6'}`} /></button><span className="text-sm text-muted-foreground">{form.is_active ? a.teachersActiveStatus : a.teachersInactiveStatus}</span></div>
              </>)}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg font-bold hover:bg-muted transition-colors">{a.teachersCancel}</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}{editItem ? a.teachersSaveChanges : a.teachersAddTeacherButton}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
