"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, XCircle, FileText, User, Phone, Globe, GraduationCap, Clock, BookOpen, Trash2, Mic, AlertCircle, Loader2, Calendar } from "lucide-react"
import AdminAudioPlayer from "@/components/admin/audio-player"
import AdminPdfViewer from "@/components/admin/pdf-viewer"
import { Skeleton } from "@/components/ui/skeleton"
import { useI18n } from "@/lib/i18n/context"

type App = { id: string; user_id: string; name: string; email: string; qualifications: string | Record<string, any>; responses: Record<string, any> | null; cv_url: string | null; cv_file_url: string | null; certificate_file_url: string | null; audio_url: string | null; status: string; created_at: string; submitted_at: string | null; rejection_reason: string | null; rejection_count: number }
type Question = { id: string; label: string; type: string; sort_order: number }

function StatusBadge({ status, a }: { status: string; a: any }) {
  const cfg = status === "pending" ? { label: a.taPending, cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" } : status === "approved" ? { label: a.taApproved, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" } : status === "rejected" ? { label: a.taRejected, cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" } : { label: a.libDraft, cls: "bg-muted text-muted-foreground" }
  return <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${cfg.cls}`}>{cfg.label}</span>
}

export default function TeacherApplicationsPage() {
  const { t, locale } = useI18n()
  const a = t.academyAdmin
  const dateLocale = locale === 'ar' ? 'ar-EG' : 'en-US'

  const [apps, setApps] = useState<App[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending")
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [processing, setProcessing] = useState(false)

  const fetchData = async () => {
    try {
      const [ap, q] = await Promise.all([
        fetch("/api/academy/admin/teacher-applications"),
        fetch("/api/admin/application-questions?role=teacher"),
      ])
      if (ap.ok) {
        const j = await ap.json()
        setApps(j.data || [])
        if (!selectedId && j.data?.length) setSelectedId(j.data[0].id)
      }
      if (q.ok) {
        const j = await q.json()
        setQuestions(j.data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = apps.filter(ap => filter === "all" ? true : ap.status === filter)
  const counts = { all: apps.length, pending: apps.filter(ap => ap.status === "pending").length, approved: apps.filter(ap => ap.status === "approved").length, rejected: apps.filter(ap => ap.status === "rejected").length }
  const selected = apps.find(ap => ap.id === selectedId) || null

  const approve = async (id: string) => {
    if (!confirm(a.taApproveConfirm)) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/academy/admin/teacher-applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      })
      if (res.ok) await fetchData()
      else alert(a.taError)
    } finally {
      setProcessing(false)
    }
  }

  const submitReject = async () => {
    if (!rejectingId) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/academy/admin/teacher-applications/${rejectingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", rejection_reason: rejectionReason }),
      })
      if (res.ok) {
        setRejectingId(null)
        setRejectionReason("")
        await fetchData()
      } else {
        alert(a.taError)
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(a.taDeleteConfirm)) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/academy/admin/teacher-applications/${id}`, { method: "DELETE" })
      if (res.ok) {
        // Optimistically drop the row so the applicant disappears from the list
        // immediately, then refetch to stay in sync with the server.
        setApps(prev => prev.filter(ap => ap.id !== id))
        setSelectedId(null)
        await fetchData()
      } else {
        // Previously failures were swallowed silently, so the applicant stayed
        // visible with no explanation. Surface the server error instead.
        let msg = a.taError
        try {
          const body = await res.json()
          if (body?.error) msg = `${a.taError}: ${body.error}`
        } catch { /* non-JSON error body */ }
        alert(msg)
      }
    } catch (err) {
      console.error("[v0] teacher application delete failed:", err)
      alert(a.taError)
    } finally {
      setProcessing(false)
    }
  }

  const parseQuals = (raw: any): Record<string, any> => {
    if (!raw) return {}
    if (typeof raw === "string") {
      try { return JSON.parse(raw) } catch { return {} }
    }
    return raw
  }

  if (loading) return <div className="space-y-6 animate-pulse"><div className="flex items-center justify-between flex-wrap gap-3"><Skeleton className="h-8 w-48" /></div><div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6"><div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-4 bg-card border border-border rounded-xl space-y-3"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-40" /></div>)}</div><div className="space-y-5 bg-card border border-border rounded-xl p-6"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-48" /></div></div></div>

  const filterTabs = [
    { key: "pending" as const, label: a.taPending },
    { key: "approved" as const, label: a.taApproved },
    { key: "rejected" as const, label: a.taRejected },
    { key: "all" as const, label: a.taAll },
  ]

  const qualLabels: Record<string, string> = { phone: a.taPhone, nationality: a.taNationality, qualification: a.taQualification, years_of_experience: a.taExperience, teaching_subjects: a.taSubjects }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{a.taTitle}</h1>
        <div className="flex gap-2 text-xs">
          {filterTabs.map(k => <button key={k.key} onClick={() => setFilter(k.key)} className={`px-3 py-1.5 rounded-full font-bold transition-colors ${filter === k.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{k.label}<span className="mr-1.5 opacity-80">({counts[k.key]})</span></button>)}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-2 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto pr-1">
          {filtered.length === 0 && <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">{a.taNoApplications}</div>}
          {filtered.map(ap => (
            <button key={ap.id} onClick={() => setSelectedId(ap.id)} className={`w-full text-right p-3 rounded-xl border-2 transition-all ${selectedId === ap.id ? "bg-primary/5 border-primary shadow-sm" : "bg-card border-border hover:border-primary/30"}`}>
              <div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1"><h3 className="font-bold truncate">{ap.name}</h3><p className="text-xs text-muted-foreground truncate">{ap.email}</p></div><StatusBadge status={ap.status} a={a} /></div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(ap.created_at).toLocaleDateString(dateLocale)}</p>
            </button>
          ))}
        </div>
        <div className="space-y-5">
          {!selected ? <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">{a.taSelectApplication}</div> : (
            <>
              <div className="bg-card border border-border rounded-xl p-5 flex items-start justify-between flex-wrap gap-4">
                <div className="flex gap-4 items-start min-w-0">
                  <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0"><User className="w-7 h-7" /></div>
                  <div className="min-w-0"><h2 className="font-bold text-xl">{selected.name}</h2><p className="text-sm text-muted-foreground">{selected.email}</p><div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground"><StatusBadge status={selected.status} a={a} />{selected.rejection_count > 0 && <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />{a.taRejectionCount.replace('{count}', String(selected.rejection_count))}</span>}</div></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.status === "pending" && (<><button disabled={processing} onClick={() => approve(selected.id)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {a.taApprove}</button><button disabled={processing} onClick={() => { setRejectingId(selected.id); setRejectionReason("") }} className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 text-red-700 font-bold rounded-lg flex items-center gap-2"><XCircle className="w-4 h-4" /> {a.taReject}</button></>)}
                  <button disabled={processing} onClick={() => handleDelete(selected.id)} className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {(() => { const qual = parseQuals(selected.qualifications); const items: { icon: any; label: string; v: any }[] = []; Object.entries(qualLabels).forEach(([k, label]) => { if (qual[k]) items.push({ icon: k === 'phone' ? Phone : k === 'nationality' ? Globe : k === 'qualification' ? GraduationCap : k === 'years_of_experience' ? Clock : BookOpen, label, v: qual[k] }) }); if (items.length === 0) return null; return <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">{items.map((it, i) => <div key={i} className="flex items-center gap-2 text-sm"><it.icon className="w-4 h-4 text-muted-foreground shrink-0" /><span className="text-muted-foreground">{it.label}:</span><span className="font-bold truncate">{String(it.v)}</span></div>)}</div> })()}
              {selected.audio_url && <div className="space-y-2"><h3 className="text-sm font-bold flex items-center gap-2"><Mic className="w-4 h-4 text-blue-600" /> {a.taAudioTest}</h3><AdminAudioPlayer src={selected.audio_url} label={a.taApplicantRecording} /></div>}
              {(selected.cv_file_url || selected.cv_url || selected.certificate_file_url) && <div className="space-y-2"><h3 className="text-sm font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-rose-600" /> {a.taDocuments}</h3><AdminPdfViewer src={selected.cv_file_url || selected.cv_url || selected.certificate_file_url || ""} label={a.taCvCertificates} /></div>}
              {selected.responses && Object.keys(selected.responses).length > 0 && <div className="space-y-3"><h3 className="text-sm font-bold">{a.taFormResponses}</h3><div className="bg-card border border-border rounded-xl p-5 space-y-3">{questions.filter(q => q.type !== "audio" && q.type !== "file").map(q => { const v = selected.responses?.[q.id]; if (!v) return null; return <div key={q.id} className="border-b border-border last:border-0 pb-3 last:pb-0"><p className="text-xs font-bold text-muted-foreground">{q.label}</p><p className="text-sm mt-1 whitespace-pre-wrap">{String(v)}</p></div> })}</div></div>}
              {selected.status === "rejected" && selected.rejection_reason && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"><p className="text-xs font-bold text-red-700 mb-1">{a.taPreviousRejectionReason}</p><p className="text-sm text-red-900 dark:text-red-200 whitespace-pre-wrap">{selected.rejection_reason}</p></div>}
            </>
          )}
        </div>
      </div>
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !processing && setRejectingId(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600"><XCircle className="w-5 h-5" /><h2 className="font-bold text-lg">{a.taRejectTitle}</h2></div>
            <p className="text-sm text-muted-foreground">{a.taRejectDesc}</p>
            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={4} placeholder={a.taRejectPlaceholder} className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none resize-y" />
            <div className="flex gap-2">
              <button onClick={() => setRejectingId(null)} disabled={processing} className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl font-bold">{t.cancel}</button>
              <button onClick={submitReject} disabled={processing} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2">{processing && <Loader2 className="w-4 h-4 animate-spin" />}{a.taConfirmReject}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
