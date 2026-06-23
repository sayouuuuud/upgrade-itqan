'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Award, CalendarDays, CheckCircle2, ClipboardCheck, Edit2, Filter, Loader2,
  Medal, Plus, Search, Sparkles, Target, Trash2, Trophy, Users, X, Play, Send, ArrowLeft, Clock,
} from 'lucide-react'
import { Gavel } from 'lucide-react'
import { CardListSkeleton } from '@/components/ui/skeletons'
import MediaViewer from '@/components/media-viewer'
import { cn } from '@/lib/utils'
import { JudgesManager } from '@/components/competitions/judges-manager'
import { StageBuilder, type StageDraft } from '@/components/competitions/stage-builder'
import { StageManager } from '@/components/competitions/stage-manager'
import { useI18n } from '@/lib/i18n/context'

interface Entry {
  id: string; student_name: string; student_email: string; submission_url: string | null; notes: string | null;
  verses_count: number; score: number | null; feedback: string | null; status: string; submitted_at: string;
  evaluated_at: string | null; tajweed_scores: Record<string, number> | null;
}

interface Competition {
  id: string; title: string; description: string | null; type: string; start_date: string; end_date: string;
  status: string; max_participants: number | null; prizes_description: string | null; rules?: string | null;
  tajweed_rules?: string[] | null; badge_key?: string | null; points_multiplier?: number | string | null;
  points_first?: number | null; points_second?: number | null; points_third?: number | null;
  min_verses?: number | null; is_featured?: boolean; certificate_enabled?: boolean | null;
  award_top_n?: number | null; certificate_template_id?: string | null; winner_name?: string | null;
  entries_count?: number; evaluated_count?: number; average_score?: number;
}

type CompetitionForm = {
  title: string; description: string; type: string; start_date: string; end_date: string;
  max_participants: number; prizes_description: string; rules: string; tajweed_rules: string;
  badge_key: string; points_multiplier: number; points_first: number; points_second: number;
  points_third: number; min_verses: number; is_featured: boolean; certificate_enabled: boolean;
  award_top_n: number; certificate_template_id: string;
}

function formatDate(value: string, dateLocale: string) {
  return new Date(value).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })
}

function getProgress(comp: Competition) {
  if (!comp.max_participants) return 0
  return Math.min(100, Math.round(((comp.entries_count || 0) / comp.max_participants) * 100))
}

export default function AdminCompetitionsPage() {
  const { t, locale } = useI18n()
  const a = t.academyAdmin
  const dateLocale = locale === 'ar' ? 'ar-EG' : 'en-US'

  const TAJWEED_RULES = [
    { key: 'idgham', label: a.compIdgham }, { key: 'ikhfa', label: a.compIkhfa },
    { key: 'iqlab', label: a.compIqlab }, { key: 'izhar', label: a.compIzhar },
    { key: 'madd', label: a.compMadd }, { key: 'qalqala', label: a.compQalqala },
    { key: 'ghunna', label: a.compGhunna }, { key: 'tafkhim_tarqiq', label: a.compTafkhim },
    { key: 'waqf', label: a.compWaqf }, { key: 'makharij', label: a.compMakharij },
  ]

  const TYPE_CONFIG: Record<string, { label: string; hint: string; badge: string; color: string; icon: typeof Trophy }> = {
    monthly: { label: a.compTypeMonthly, hint: a.compTypeMonthlyHint, badge: 'star_of_halaqah', color: 'from-amber-500 to-orange-500', icon: Trophy },
    ramadan: { label: a.compTypeRamadan, hint: a.compTypeRamadanHint, badge: 'ramadan_badge', color: 'from-emerald-500 to-teal-500', icon: Sparkles },
    tajweed: { label: a.compTypeTajweed, hint: a.compTypeTajweedHint, badge: 'tajweed_master', color: 'from-violet-500 to-purple-500', icon: ClipboardCheck },
    memorization: { label: a.compTypeMemorization, hint: a.compTypeMemorizationHint, badge: 'hafiz_juz_amma', color: 'from-blue-500 to-cyan-500', icon: Target },
    weekly: { label: a.compTypeWeekly, hint: a.compTypeWeeklyHint, badge: 'star_of_halaqah', color: 'from-sky-500 to-blue-500', icon: Medal },
    special: { label: a.compTypeSpecial, hint: a.compTypeSpecialHint, badge: 'star_of_halaqah', color: 'from-rose-500 to-pink-500', icon: Award },
  }

  const STATUSES: Record<string, { label: string; className: string }> = {
    upcoming: { label: a.compStatusUpcoming, className: 'bg-blue-50 text-blue-700 border-blue-100' },
    active: { label: a.compStatusActive, className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    ended: { label: a.compStatusEnded, className: 'bg-slate-100 text-slate-600 border-slate-200' },
    cancelled: { label: a.compStatusCancelled, className: 'bg-red-50 text-red-700 border-red-100' },
  }

  const emptyForm: CompetitionForm = { title: '', description: '', type: 'monthly', start_date: '', end_date: '', max_participants: 100, prizes_description: '', rules: '', tajweed_rules: '', badge_key: 'star_of_halaqah', points_multiplier: 2, points_first: 500, points_second: 300, points_third: 150, min_verses: 0, is_featured: false, certificate_enabled: false, award_top_n: 10, certificate_template_id: '' }

  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Competition | null>(null)
  const [form, setForm] = useState<CompetitionForm>(emptyForm)
  // Stage drafts for the creation modal. Empty = a single implicit round
  // (classic single-stage competition). 2+ = an elimination bracket.
  const [stages, setStages] = useState<StageDraft[]>([])
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [judgesComp, setJudgesComp] = useState<Competition | null>(null)
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)
  const [evalForm, setEvalForm] = useState<{ score: number; tajweed_scores: Record<string, number>; feedback: string; mark_as_winner: boolean }>({ score: 0, tajweed_scores: {}, feedback: '', mark_as_winner: false })
  const [submittingEval, setSubmittingEval] = useState(false)

  const fetchEntries = async (comp: Competition) => {
    setSelectedComp(comp); setLoadingEntries(true)
    try { const res = await fetch(`/api/academy/competitions/${comp.id}/entries`); if (res.ok) { const data = await res.json(); setEntries(data.data || data.entries || []) } }
    catch (e) { console.error(e) } finally { setLoadingEntries(false) }
  }

  const startEval = (entry: Entry) => {
    setEvaluatingId(entry.id)
    const scores: Record<string, number> = {}
    TAJWEED_RULES.forEach(r => { scores[r.key] = entry.tajweed_scores?.[r.key] || 0 })
    setEvalForm({ score: entry.score || 0, tajweed_scores: selectedComp?.type === 'tajweed' ? scores : {}, feedback: entry.feedback || '', mark_as_winner: false })
  }

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!evaluatingId || !selectedComp) return
    setSubmittingEval(true)
    try {
      let finalScore = evalForm.score
      if (selectedComp.type === 'tajweed') { const vals = Object.values(evalForm.tajweed_scores); finalScore = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0 }
      const res = await fetch(`/api/academy/admin/competitions/${selectedComp.id}/entries/${evaluatingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score: finalScore, tajweed_scores: evalForm.tajweed_scores, feedback: evalForm.feedback, mark_as_winner: evalForm.mark_as_winner }) })
      if (res.ok) { setEvaluatingId(null); fetchEntries(selectedComp); fetchCompetitions() }
      else { const d = await res.json(); alert(d.error || a.compError) }
    } finally { setSubmittingEval(false) }
  }

  const fetchCompetitions = async () => {
    setLoading(true)
    try { const params = new URLSearchParams(); if (typeFilter !== 'all') params.set('type', typeFilter); if (statusFilter !== 'all') params.set('status', statusFilter); const res = await fetch(`/api/academy/admin/competitions?${params.toString()}`); if (res.ok) { const data = await res.json(); setCompetitions(Array.isArray(data) ? data : data.data || []) } }
    catch (error) { console.error('Failed to fetch competitions:', error) } finally { setLoading(false) }
  }

  useEffect(() => { fetchCompetitions() }, [typeFilter, statusFilter])

  const stats = useMemo(() => ({ total: competitions.length, active: competitions.filter((item) => item.status === 'active').length, entries: competitions.reduce((sum, item) => sum + (item.entries_count || 0), 0), evaluated: competitions.reduce((sum, item) => sum + (item.evaluated_count || 0), 0) }), [competitions])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return competitions
    return competitions.filter((item) => [item.title, item.description, TYPE_CONFIG[item.type]?.label].filter(Boolean).some((value) => value!.toLowerCase().includes(term)))
  }, [competitions, search])

  const openAdd = (type = 'monthly') => { const config = TYPE_CONFIG[type]; setEditItem(null); setStages([]); setForm({ ...emptyForm, type, badge_key: config.badge, points_multiplier: ['monthly', 'ramadan', 'tajweed'].includes(type) ? 2 : 1 }); setShowModal(true) }
  const openEdit = (comp: Competition) => { const config = TYPE_CONFIG[comp.type] || TYPE_CONFIG.monthly; setEditItem(comp); setForm({ title: comp.title, description: comp.description || '', type: comp.type || 'monthly', start_date: comp.start_date ? comp.start_date.slice(0, 10) : '', end_date: comp.end_date ? comp.end_date.slice(0, 10) : '', max_participants: comp.max_participants || 100, prizes_description: comp.prizes_description || '', rules: comp.rules || '', tajweed_rules: Array.isArray(comp.tajweed_rules) ? comp.tajweed_rules.join(', ') : '', badge_key: comp.badge_key || config.badge, points_multiplier: Number(comp.points_multiplier || 2), points_first: Number(comp.points_first ?? 500), points_second: Number(comp.points_second ?? 300), points_third: Number(comp.points_third ?? 150), min_verses: comp.min_verses || 0, is_featured: Boolean(comp.is_featured), certificate_enabled: Boolean(comp.certificate_enabled), award_top_n: Number(comp.award_top_n || 10), certificate_template_id: comp.certificate_template_id || '' }); setShowModal(true) }

  const updateType = (type: string) => { const config = TYPE_CONFIG[type] || TYPE_CONFIG.monthly; setForm({ ...form, type, badge_key: config.badge, points_multiplier: ['monthly', 'ramadan', 'tajweed'].includes(type) ? 2 : 1 }) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.title || !form.start_date || !form.end_date) return; setSaving(true)
    try { const url = editItem ? `/api/academy/admin/competitions/${editItem.id}` : '/api/academy/admin/competitions'; const method = editItem ? 'PATCH' : 'POST'; const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, tajweed_rules: form.tajweed_rules.split(',').map((item) => item.trim()).filter(Boolean), certificate_template_id: form.certificate_template_id || null, award_top_n: form.certificate_enabled ? Number(form.award_top_n) || 10 : null, points_first: Number(form.points_first) >= 0 ? Number(form.points_first) : 500, points_second: Number(form.points_second) >= 0 ? Number(form.points_second) : 300, points_third: Number(form.points_third) >= 0 ? Number(form.points_third) : 150, stages: editItem ? undefined : stages }) }); if (res.ok) { setShowModal(false); fetchCompetitions() } else { const data = await res.json().catch(() => null); alert(data?.error || a.compSaveError) } }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => { if (!confirm(a.compDeleteConfirm)) return; setDeletingId(id); try { const res = await fetch(`/api/academy/admin/competitions/${id}`, { method: 'DELETE' }); if (res.ok) fetchCompetitions(); else alert(a.compCannotDelete) } finally { setDeletingId(null) } }

  if (selectedComp) {
    const pendingCount = entries.filter(e => e.status === 'pending' && e.submission_url).length
    const evaluatedCount = entries.filter(e => e.status !== 'pending').length
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedComp(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" />{a.compBackToList}</button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">{selectedComp.title}</h1>
            <p className="text-muted-foreground mt-1">{a.compReviewEntries}</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2 text-center">
              <span className="text-2xl font-black text-amber-600">{pendingCount}</span>
              <p className="text-xs text-amber-700 dark:text-amber-400">{a.compPendingJudging}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2 text-center">
              <span className="text-2xl font-black text-emerald-600">{evaluatedCount}</span>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">{a.compEvaluatedEntries}</p>
            </div>
          </div>
        </div>
        <StageManager
          competitionId={selectedComp.id}
          basePath={`/api/academy/admin/competitions/${selectedComp.id}`}
          onChanged={() => { fetchCompetitions(); fetchEntries(selectedComp) }}
        />
        {loadingEntries ? <CardListSkeleton rows={3} /> : entries.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-2xl p-16 text-center"><Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" /><p className="font-bold text-muted-foreground">{a.compNoEntries}</p></div>
        ) : (
          <div className="space-y-4">
            {entries.map(entry => (
              <div key={entry.id} className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{entry.student_name}</h3>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', entry.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : entry.status === 'winner' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400')}>
                        {entry.status === 'pending' ? a.compPendingStatus : entry.status === 'winner' ? `${a.compWinnerStatus} 🏆` : a.compEvaluatedStatus}
                      </span>
                    </div>
                    {entry.student_email && <p className="text-sm text-muted-foreground">{entry.student_email}</p>}
                    {entry.verses_count > 0 && <p className="text-sm text-muted-foreground mt-1">{a.compVerses.replace('{count}', String(entry.verses_count))}</p>}
                    {entry.notes && <p className="text-sm text-muted-foreground mt-1">{a.compNotes} {entry.notes}</p>}
                    {entry.submission_url && <div className="mt-3"><MediaViewer url={entry.submission_url} /></div>}
                    {entry.score !== null && <div className="mt-2 flex items-center gap-2"><span className="text-sm font-medium">{a.compScore}</span><span className="text-xl font-black text-amber-600">{Math.round(entry.score)}/100</span></div>}
                    {entry.feedback && <p className="text-sm text-muted-foreground mt-1">{a.compNotes} {entry.feedback}</p>}
                  </div>
                  {entry.submission_url && <button onClick={() => startEval(entry)} className="shrink-0 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">{entry.status === 'pending' ? a.compJudge : a.compRejudge}</button>}
                </div>
                {evaluatingId === entry.id && (
                  <form onSubmit={handleEvaluate} className="border-t border-border pt-4 space-y-4">
                    {selectedComp.type === 'tajweed' ? (
                      <div><p className="text-sm font-bold mb-3">{a.compTajweedEval}</p>
                        <div className="grid grid-cols-2 gap-3">{TAJWEED_RULES.map(r => (<div key={r.key} className="flex items-center gap-2"><label className="text-sm flex-1">{r.label}</label><input type="number" min={0} max={10} step={0.5} value={evalForm.tajweed_scores[r.key] || 0} onChange={e => setEvalForm(prev => ({ ...prev, tajweed_scores: { ...prev.tajweed_scores, [r.key]: parseFloat(e.target.value) || 0 } }))} className="w-20 px-2 py-1.5 rounded-lg border border-border bg-background text-center text-sm outline-none focus:ring-2 focus:ring-amber-500" /></div>))}</div>
                      </div>
                    ) : (
                      <div><label className="text-sm font-bold block mb-1">{a.compScoreOutOf100}</label><input type="number" min={0} max={100} value={evalForm.score} onChange={e => setEvalForm(prev => ({ ...prev, score: parseFloat(e.target.value) || 0 }))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-amber-500" /></div>
                    )}
                    <div><label className="text-sm font-bold block mb-1">{a.compJudgeNotes}</label><textarea value={evalForm.feedback} onChange={e => setEvalForm(prev => ({ ...prev, feedback: e.target.value }))} rows={3} placeholder={a.compJudgeNotesPlaceholder} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm resize-none outline-none focus:ring-2 focus:ring-amber-500" /></div>
                    <label className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl cursor-pointer">
                      <input type="checkbox" checked={evalForm.mark_as_winner} onChange={e => setEvalForm(prev => ({ ...prev, mark_as_winner: e.target.checked }))} className="w-4 h-4 accent-amber-600" />
                      <span className="text-sm font-bold text-amber-800 dark:text-amber-300">{a.compDeclareWinner}</span>
                    </label>
                    <div className="flex gap-3">
                      <button type="submit" disabled={submittingEval} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-60 transition">{submittingEval ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{a.compSaveJudgment}</button>
                      <button type="button" onClick={() => setEvaluatingId(null)} className="px-4 py-2.5 bg-muted text-foreground rounded-xl font-bold text-sm hover:bg-muted/80 transition">{t.cancel}</button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#132f4c] via-[#165f46] to-[#d97706] p-8 text-white shadow-xl">
        <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold backdrop-blur"><Sparkles className="h-4 w-4" /> {a.compTitle}</div>
            <h1 className="text-3xl font-black lg:text-4xl">{a.compManagement}</h1>
            <p className="text-sm leading-7 text-white/80 lg:text-base">{a.compDesc}</p>
          </div>
          <button onClick={() => openAdd('monthly')} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-[#165f46] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"><Plus className="h-5 h-5" /> {a.compNew}</button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard title={a.compAll} value={stats.total} icon={Trophy} tone="amber" />
        <StatCard title={a.compActive} value={stats.active} icon={CheckCircle2} tone="emerald" />
        <StatCard title={a.compTotalEntries} value={stats.entries} icon={Users} tone="blue" />
        <StatCard title={a.compEvaluated} value={stats.evaluated} icon={ClipboardCheck} tone="purple" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {Object.entries(TYPE_CONFIG).filter(([type]) => ['monthly', 'ramadan', 'tajweed'].includes(type)).map(([type, config]) => {
          const Icon = config.icon
          return (
            <button key={type} onClick={() => openAdd(type)} className="group overflow-hidden rounded-2xl border border-border bg-card text-right shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className={`h-2 bg-gradient-to-l ${config.color}`} />
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3"><div className={`rounded-2xl bg-gradient-to-l ${config.color} p-3 text-white shadow-md`}><Icon className="h-6 w-6" /></div><Plus className="h-5 w-5 text-muted-foreground transition group-hover:text-foreground" /></div>
                <div><h3 className="font-black">{config.label}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{config.hint}</p></div>
              </div>
            </button>
          )
        })}
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-xl font-black">{a.compListTitle}</h2><p className="text-sm text-muted-foreground">{a.compListDesc}</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={a.compSearchPlaceholder} className="w-full rounded-xl border border-border bg-background py-2.5 pe-9 ps-3 text-sm outline-none transition focus:ring-2 focus:ring-amber-500 sm:w-64" /></div>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"><option value="all">{a.compAllTypes}</option>{Object.entries(TYPE_CONFIG).map(([type, config]) => <option key={type} value={type}>{config.label}</option>)}</select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"><option value="all">{a.compAllStatuses}</option>{Object.entries(STATUSES).map(([status, item]) => <option key={status} value={status}>{item.label}</option>)}</select>
          </div>
        </div>
        {loading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div> : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center"><Filter className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" /><p className="font-bold">{a.compNoMatching}</p><p className="mt-1 text-sm text-muted-foreground">{a.compNoMatchingDesc}</p></div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map((comp) => { const config = TYPE_CONFIG[comp.type] || TYPE_CONFIG.monthly; const Icon = config.icon; const status = STATUSES[comp.status] || STATUSES.upcoming; const progress = getProgress(comp)
              return (
                <article key={comp.id} className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition hover:shadow-md">
                  <div className={`h-1.5 bg-gradient-to-l ${config.color}`} />
                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <div className={`shrink-0 rounded-2xl bg-gradient-to-l ${config.color} p-3 text-white shadow-sm`}><Icon className="h-5 w-5" /></div>
                        <div className="min-w-0"><div className="mb-1 flex flex-wrap items-center gap-2"><h3 className="truncate text-lg font-black">{comp.title}</h3><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span></div><p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{comp.description || config.hint}</p></div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button onClick={() => openEdit(comp)} className="rounded-xl p-2 text-blue-600 transition hover:bg-blue-50"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(comp.id)} disabled={deletingId === comp.id} className="rounded-xl p-2 text-red-500 transition hover:bg-red-50">{deletingId === comp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 h-4" />}</button>
                      </div>
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                      <InfoPill icon={CalendarDays} label={a.compDuration} value={`${formatDate(comp.start_date, dateLocale)} - ${formatDate(comp.end_date, dateLocale)}`} />
                      <InfoPill icon={Users} label={a.compEntries} value={`${comp.entries_count || 0}/${comp.max_participants || '∞'}`} />
                      <InfoPill icon={Award} label={a.compPrize} value={`×${comp.points_multiplier || 1} + ${comp.badge_key || config.badge}`} />
                    </div>
                    <div><div className="mb-2 flex items-center justify-between text-xs text-muted-foreground"><span>{a.compEnrollmentRate}</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full bg-gradient-to-l ${config.color}`} style={{ width: `${progress}%` }} /></div></div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted px-3 py-1">{a.compEvaluatedCount.replace('{count}', String(comp.evaluated_count || 0))}</span>
                      <span className="rounded-full bg-muted px-3 py-1">{a.compAvgScore.replace('{score}', String(Math.round(comp.average_score || 0)))}</span>
                      {comp.winner_name && <span className="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700">{a.compWinner.replace('{name}', comp.winner_name)}</span>}
                      {comp.min_verses ? <span className="rounded-full bg-muted px-3 py-1">{a.compMinVerses.replace('{count}', String(comp.min_verses))}</span> : null}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => fetchEntries(comp)} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border rounded-xl text-sm font-bold hover:bg-muted/50 transition-colors"><ClipboardCheck className="h-4 w-4" />{a.compViewEntries}</button>
                      <button onClick={() => setJudgesComp(comp)} className="flex items-center justify-center gap-2 py-2.5 px-4 border border-border rounded-xl text-sm font-bold hover:bg-muted/50 transition-colors"><Gavel className="h-4 w-4" />{a.compJudges}</button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {judgesComp && <JudgesManager apiBase="/api/academy/admin/competitions" competition={{ id: judgesComp.id, title: judgesComp.title }} accent="emerald" onClose={() => setJudgesComp(null)} />}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={(event) => event.target === event.currentTarget && setShowModal(false)}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 p-6 backdrop-blur">
              <div><h3 className="text-xl font-black">{editItem ? a.compEditCompetition : a.compCreateNew}</h3><p className="mt-1 text-sm text-muted-foreground">{a.compFormHint}</p></div>
              <button onClick={() => setShowModal(false)} className="rounded-xl p-2 transition hover:bg-muted"><X className="h-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="grid gap-3 md:grid-cols-3">
                {Object.entries(TYPE_CONFIG).filter(([type]) => ['monthly', 'ramadan', 'tajweed'].includes(type)).map(([type, config]) => (
                  <button key={type} type="button" onClick={() => updateType(type)} className={`rounded-2xl border p-4 text-right transition ${form.type === type ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-border hover:bg-muted/60'}`}><p className="font-black">{config.label}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{config.hint}</p></button>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={a.compName} required><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={a.compNamePlaceholder} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" /></Field>
                <Field label={a.compType}><select value={form.type} onChange={(event) => updateType(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500">{Object.entries(TYPE_CONFIG).map(([type, config]) => <option key={type} value={type}>{config.label}</option>)}</select></Field>
              </div>
              <Field label={a.compShortDesc}><textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={a.compShortDescPlaceholder} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500 resize-none" /></Field>
              <div className="grid gap-4 md:grid-cols-4">
                <Field label={a.compStartDate} required><input required type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" /></Field>
                <Field label={a.compEndDate} required><input required type="date" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" /></Field>
                <Field label={a.compMaxParticipants}><input type="number" min={1} value={form.max_participants} onChange={(event) => setForm({ ...form, max_participants: Number(event.target.value) })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" /></Field>
                <Field label={a.compMinVersesLabel}><input type="number" min={0} value={form.min_verses} onChange={(event) => setForm({ ...form, min_verses: Number(event.target.value) })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" /></Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={a.compBadge}><select value={form.badge_key} onChange={(event) => setForm({ ...form, badge_key: event.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500"><option value="star_of_halaqah">{a.compBadgeStar}</option><option value="ramadan_badge">{a.compBadgeRamadan}</option><option value="tajweed_master">{a.compBadgeTajweed}</option><option value="hafiz_juz_amma">{a.compBadgeHafiz}</option></select></Field>
                <Field label={a.compPointsMultiplier}><input type="number" min={1} step="0.5" value={form.points_multiplier} onChange={(event) => setForm({ ...form, points_multiplier: Number(event.target.value) })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" /></Field>
              </div>
              <div><p className="mb-2 text-sm font-medium text-foreground">{a.compPlacesPoints}</p><div className="grid gap-4 md:grid-cols-3"><Field label={a.compPointsFirst}><input type="number" min={0} value={form.points_first} onChange={(event) => setForm({ ...form, points_first: Number(event.target.value) })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" /></Field><Field label={a.compPointsSecond}><input type="number" min={0} value={form.points_second} onChange={(event) => setForm({ ...form, points_second: Number(event.target.value) })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" /></Field><Field label={a.compPointsThird}><input type="number" min={0} value={form.points_third} onChange={(event) => setForm({ ...form, points_third: Number(event.target.value) })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" /></Field></div></div>
              <Field label={a.compTajweedRules}><input value={form.tajweed_rules} onChange={(event) => setForm({ ...form, tajweed_rules: event.target.value })} placeholder={a.compTajweedRulesPlaceholder} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" /></Field>
              <Field label={a.compCompetitionRules}><textarea rows={3} value={form.rules} onChange={(event) => setForm({ ...form, rules: event.target.value })} placeholder={a.compRulesPlaceholder} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500 resize-none" /></Field>
              <Field label={a.compPrizes}><textarea rows={2} value={form.prizes_description} onChange={(event) => setForm({ ...form, prizes_description: event.target.value })} placeholder={a.compPrizesPlaceholder} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500 resize-none" /></Field>
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 text-sm font-bold"><input type="checkbox" checked={form.is_featured} onChange={(event) => setForm({ ...form, is_featured: event.target.checked })} className="h-4 w-4 accent-amber-600" />{a.compFeatureCompetition}</label>
              <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={form.certificate_enabled} onChange={(event) => setForm({ ...form, certificate_enabled: event.target.checked })} className="h-4 w-4 accent-amber-600" /><Award className="h-4 w-4 text-amber-700" />{a.compIssueCertificates}</label>
                {form.certificate_enabled && (<div className="grid gap-3 sm:grid-cols-2"><Field label={a.compTopNWinners}><input type="number" min={1} max={1000} value={form.award_top_n} onChange={(event) => setForm({ ...form, award_top_n: Number(event.target.value) })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" /></Field><Field label={a.compCertificateTemplate}><input type="text" placeholder={a.compTemplatePlaceholder} value={form.certificate_template_id} onChange={(event) => setForm({ ...form, certificate_template_id: event.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500 font-mono" /></Field></div>)}
                <p className="text-xs text-amber-800 leading-relaxed">{a.compCertificateNote}</p>
              </div>
              {!editItem && <StageBuilder stages={stages} onChange={setStages} />}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-border py-3 font-bold transition hover:bg-muted">{t.cancel}</button>
                <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 font-bold text-white transition hover:bg-amber-700 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 h-4" />}{editItem ? a.compSaveChanges : a.compCreateCompetition}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon: Icon, tone }: { title: string; value: number; icon: typeof Trophy; tone: 'amber' | 'emerald' | 'blue' | 'purple' }) {
  const tones = { amber: 'bg-amber-50 text-amber-700', emerald: 'bg-emerald-50 text-emerald-700', blue: 'bg-blue-50 text-blue-700', purple: 'bg-purple-50 text-purple-700' }
  return (<div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-3xl font-black">{value}</p></div><div className={`rounded-2xl p-3 ${tones[tone]}`}><Icon className="h-6 w-6" /></div></div></div>)
}

function InfoPill({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (<div className="rounded-2xl bg-muted/60 p-3"><div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div><p className="truncate font-bold">{value}</p></div>)
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (<label className="block space-y-1.5 text-sm font-bold"><span>{label} {required && <span className="text-red-500">*</span>}</span>{children}</label>)
}
