'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Award, CalendarDays, CheckCircle2, ClipboardCheck,
  Edit2, Filter, Loader2, Medal, Plus, Search,
  Sparkles, Target, Trash2, Trophy, Users, X,
  BookOpen, Star, Play, Send, ArrowLeft, BarChart3, Clock
} from 'lucide-react'
import { Gavel } from 'lucide-react'
import { CardListSkeleton } from '@/components/ui/skeletons'
import { cn } from '@/lib/utils'
import MediaViewer from '@/components/media-viewer'
import { JudgesManager } from '@/components/competitions/judges-manager'

interface Competition {
  id: string
  title: string
  description: string | null
  type: string
  start_date: string
  end_date: string
  status: string
  max_participants: number | null
  prizes_description: string | null
  rules?: string | null
  tajweed_rules?: string[] | null
  badge_key?: string | null
  points_multiplier?: number | string | null
  min_verses?: number | null
  is_featured?: boolean
  certificate_enabled?: boolean | null
  award_top_n?: number | null
  certificate_template_id?: string | null
  winner_name?: string | null
  entries_count?: number
  pending_count?: number
  evaluated_count?: number
  average_score?: number
  created_by_name?: string | null
}

interface Entry {
  id: string
  student_name: string
  student_email: string
  submission_url: string | null
  notes: string | null
  verses_count: number
  score: number | null
  feedback: string | null
  status: string
  submitted_at: string
  evaluated_at: string | null
  tajweed_scores: Record<string, number> | null
}

type CompetitionForm = {
  title: string; description: string; type: string
  start_date: string; end_date: string; max_participants: number
  prizes_description: string; rules: string; tajweed_rules: string
  badge_key: string; points_multiplier: number; min_verses: number; is_featured: boolean
  certificate_enabled: boolean; award_top_n: number; certificate_template_id: string;
}

const TYPE_CONFIG: Record<string, { label: string; hint: string; badge: string; gradient: string; icon: typeof Trophy }> = {
  monthly:     { label: 'شهرية',   hint: 'مسابقة تلاوة شهرية يحكمها القراء',         badge: 'star_of_halaqah', gradient: 'from-amber-500 to-orange-500',   icon: Trophy },
  ramadan:     { label: 'رمضان',   hint: 'مسابقة رمضانية للحفظ والتلاوة',            badge: 'ramadan_badge',   gradient: 'from-emerald-500 to-teal-500',   icon: Sparkles },
  tajweed:     { label: 'تجويد',   hint: 'تقييم تطبيق أحكام التجويد من القراء',     badge: 'tajweed_master',  gradient: 'from-violet-500 to-purple-500',  icon: ClipboardCheck },
  memorization:{ label: 'حفظ',     hint: 'قياس الحفظ بعدد الآيات',                  badge: 'hafiz_juz_amma',  gradient: 'from-blue-500 to-cyan-500',      icon: Target },
  weekly:      { label: 'أسبوعية', hint: 'تحدي أسبوعي سريع',                        badge: 'star_of_halaqah', gradient: 'from-sky-500 to-blue-500',       icon: Medal },
  special:     { label: 'خاصة',    hint: 'مسابقة مخصصة',                             badge: 'star_of_halaqah', gradient: 'from-rose-500 to-pink-500',      icon: Award },
}

const STATUSES: Record<string, { label: string; className: string }> = {
  upcoming: { label: 'قادمة',   className: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300' },
  active:   { label: 'نشطة',    className: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300' },
  ended:    { label: 'منتهية', className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400' },
  cancelled:{ label: 'ملغاة',  className: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300' },
}

const TAJWEED_RULES = [
  { key: 'idgham', label: 'الإدغام' }, { key: 'ikhfa', label: 'الإخفاء' },
  { key: 'iqlab', label: 'الإقلاب' }, { key: 'izhar', label: 'الإظهار' },
  { key: 'madd', label: 'المدود' }, { key: 'qalqala', label: 'القلقلة' },
  { key: 'ghunna', label: 'الغنة' }, { key: 'tafkhim_tarqiq', label: 'التفخيم والترقيق' },
  { key: 'waqf', label: 'الوقف والابتداء' }, { key: 'makharij', label: 'مخارج الحروف' },
]

const emptyForm: CompetitionForm = {
  title: '', description: '', type: 'monthly', start_date: '', end_date: '',
  max_participants: 100, prizes_description: '', rules: '', tajweed_rules: '',
  badge_key: 'star_of_halaqah', points_multiplier: 1, min_verses: 0, is_featured: false,
  certificate_enabled: false, award_top_n: 10, certificate_template_id: '',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminLibraryCompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Competition | null>(null)
  const [form, setForm] = useState<CompetitionForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [judgesComp, setJudgesComp] = useState<Competition | null>(null)
  // Entries view
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)
  const [evalForm, setEvalForm] = useState<{ score: number; tajweed_scores: Record<string, number>; feedback: string; mark_as_winner: boolean }>({ score: 0, tajweed_scores: {}, feedback: '', mark_as_winner: false })
  const [submittingEval, setSubmittingEval] = useState(false)

  const fetchCompetitions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/admin/competitions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCompetitions(data.data || [])
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const fetchEntries = async (comp: Competition) => {
    setSelectedComp(comp)
    setLoadingEntries(true)
    try {
      const res = await fetch(`/api/admin/competitions/${comp.id}/entries`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries || [])
      }
    } catch (e) { console.error(e) } finally { setLoadingEntries(false) }
  }

  useEffect(() => { fetchCompetitions() }, [typeFilter, statusFilter])

  const stats = useMemo(() => ({
    total: competitions.length,
    active: competitions.filter(c => c.status === 'active').length,
    entries: competitions.reduce((s, c) => s + (c.entries_count || 0), 0),
    pending: competitions.reduce((s, c) => s + (c.pending_count || 0), 0),
  }), [competitions])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return competitions
    return competitions.filter(c =>
      [c.title, c.description, TYPE_CONFIG[c.type]?.label].filter(Boolean).some(v => v!.toLowerCase().includes(term))
    )
  }, [competitions, search])

  const openAdd = (type = 'monthly') => {
    const config = TYPE_CONFIG[type]
    setEditItem(null)
    setForm({ ...emptyForm, type, badge_key: config.badge })
    setShowModal(true)
  }

  const openEdit = (comp: Competition) => {
    setEditItem(comp)
    setForm({
      title: comp.title, description: comp.description || '',
      type: comp.type || 'monthly',
      start_date: comp.start_date ? comp.start_date.slice(0, 10) : '',
      end_date: comp.end_date ? comp.end_date.slice(0, 10) : '',
      max_participants: comp.max_participants || 100,
      prizes_description: comp.prizes_description || '',
      rules: comp.rules || '',
      tajweed_rules: Array.isArray(comp.tajweed_rules) ? comp.tajweed_rules.join(', ') : '',
      badge_key: comp.badge_key || 'star_of_halaqah',
      points_multiplier: Number(comp.points_multiplier || 1),
      min_verses: comp.min_verses || 0,
      is_featured: Boolean(comp.is_featured),
      certificate_enabled: Boolean(comp.certificate_enabled),
      award_top_n: Number(comp.award_top_n || 10),
      certificate_template_id: comp.certificate_template_id || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.start_date || !form.end_date) return
    setSaving(true)
    try {
      const url = editItem ? `/api/admin/competitions/${editItem.id}` : '/api/admin/competitions'
      const method = editItem ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tajweed_rules: form.tajweed_rules.split(',').map(s => s.trim()).filter(Boolean),
          certificate_template_id: form.certificate_template_id || null,
          award_top_n: form.certificate_enabled ? Number(form.award_top_n) || 10 : null,
        }),
      })
      if (res.ok) { setShowModal(false); fetchCompetitions() }
      else { const d = await res.json().catch(() => null); alert(d?.error || 'حدث خطأ') }
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المسابقة؟')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/competitions/${id}`, { method: 'DELETE' })
      if (res.ok) fetchCompetitions(); else alert('لا يمكن الحذف')
    } finally { setDeletingId(null) }
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
      if (selectedComp.type === 'tajweed') {
        const vals = Object.values(evalForm.tajweed_scores)
        finalScore = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0
      }
      const res = await fetch(`/api/admin/competitions/${selectedComp.id}/entries/${evaluatingId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: finalScore, tajweed_scores: evalForm.tajweed_scores, feedback: evalForm.feedback, mark_as_winner: evalForm.mark_as_winner }),
      })
      if (res.ok) { setEvaluatingId(null); fetchEntries(selectedComp) }
      else { const d = await res.json(); alert(d.error || 'حدث خطأ') }
    } finally { setSubmittingEval(false) }
  }

  // ── Entries View ──
  if (selectedComp) {
    const pendingCount = entries.filter(e => e.status === 'pending' && e.submission_url).length
    const evaluatedCount = entries.filter(e => e.status !== 'pending').length
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedComp(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          العودة لقائمة المسابقات
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">{selectedComp.title}</h1>
            <p className="text-muted-foreground mt-1">مراجعة وتحكيم مشاركات الطلاب</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2 text-center">
              <span className="text-2xl font-black text-amber-600">{pendingCount}</span>
              <p className="text-xs text-amber-700 dark:text-amber-400">بانتظار التحكيم</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2 text-center">
              <span className="text-2xl font-black text-emerald-600">{evaluatedCount}</span>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">تم تحكيمها</p>
            </div>
          </div>
        </div>

        {loadingEntries ? (
          <CardListSkeleton rows={3} />
        ) : entries.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-2xl p-16 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="font-bold text-muted-foreground">لا توجد مشاركات بعد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map(entry => (
              <div key={entry.id} className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{entry.student_name}</h3>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        entry.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        entry.status === 'winner'  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      )}>
                        {entry.status === 'pending' ? 'قيد الانتظار' : entry.status === 'winner' ? 'فائز 🏆' : 'تم التحكيم'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.student_email}</p>
                    {entry.verses_count > 0 && <p className="text-sm text-muted-foreground mt-1">الآيات: {entry.verses_count}</p>}
                    {entry.notes && <p className="text-sm text-muted-foreground mt-1">ملاحظات: {entry.notes}</p>}
                    {entry.submission_url && (
                      <div className="mt-3">
                        <MediaViewer url={entry.submission_url} />
                      </div>
                    )}
                    {entry.score !== null && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-medium">الدرجة:</span>
                        <span className="text-xl font-black text-amber-600">{Math.round(entry.score)}/100</span>
                      </div>
                    )}
                    {entry.feedback && <p className="text-sm text-muted-foreground mt-1">ملاحظات: {entry.feedback}</p>}
                  </div>
                  {entry.submission_url && (
                    <button onClick={() => startEval(entry)}
                      className="shrink-0 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
                      {entry.status === 'pending' ? 'حكّم' : 'أعد التحكيم'}
                    </button>
                  )}
                </div>

                {evaluatingId === entry.id && (
                  <form onSubmit={handleEvaluate} className="border-t border-border pt-4 space-y-4">
                    {selectedComp.type === 'tajweed' ? (
                      <div>
                        <p className="text-sm font-bold mb-3">تقييم أحكام التجويد (من 10):</p>
                        <div className="grid grid-cols-2 gap-3">
                          {TAJWEED_RULES.map(r => (
                            <div key={r.key} className="flex items-center gap-2">
                              <label className="text-sm flex-1">{r.label}</label>
                              <input type="number" min={0} max={10} step={0.5}
                                value={evalForm.tajweed_scores[r.key] || 0}
                                onChange={e => setEvalForm(prev => ({ ...prev, tajweed_scores: { ...prev.tajweed_scores, [r.key]: parseFloat(e.target.value) || 0 } }))}
                                className="w-20 px-2 py-1.5 rounded-lg border border-border bg-background text-center text-sm" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm font-bold block mb-1">الدرجة (من 100)</label>
                        <input type="number" min={0} max={100} value={evalForm.score}
                          onChange={e => setEvalForm(prev => ({ ...prev, score: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm" />
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-bold block mb-1">ملاحظات التحكيم</label>
                      <textarea value={evalForm.feedback} onChange={e => setEvalForm(prev => ({ ...prev, feedback: e.target.value }))}
                        rows={3} placeholder="ملاحظاتك على التلاوة..."
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm resize-none" />
                    </div>

                    <label className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl cursor-pointer">
                      <input type="checkbox" checked={evalForm.mark_as_winner}
                        onChange={e => setEvalForm(prev => ({ ...prev, mark_as_winner: e.target.checked }))}
                        className="w-4 h-4 accent-amber-600" />
                      <span className="text-sm font-bold text-amber-800 dark:text-amber-300">🏆 إعلان هذا الطالب فائزاً</span>
                    </label>

                    <div className="flex gap-3">
                      <button type="submit" disabled={submittingEval}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-60">
                        {submittingEval ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        حفظ التحكيم
                      </button>
                      <button type="button" onClick={() => setEvaluatingId(null)}
                        className="px-4 py-2.5 bg-muted text-foreground rounded-xl font-bold text-sm">
                        إلغاء
                      </button>
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

  // ── Main List View ──
  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a2e4a] via-[#1e5f46] to-[#b45309] p-8 text-white shadow-xl">
        <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-bold backdrop-blur">
              <BookOpen className="h-4 w-4" /> مسابقات المقرأة
            </div>
            <h1 className="text-3xl font-black lg:text-4xl">إدارة مسابقات المقرأة</h1>
            <p className="text-sm text-white/80 leading-7">
              أنشئ مسابقات تلاوة وتجويد وحفظ خاصة بطلاب المقرأة. تابع المشاركات وتحكيم القراء، وأعلن الفائزين لمنحهم النقاط والشارات.
            </p>
          </div>
          <button onClick={() => openAdd('monthly')}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-[#1e5f46] shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition">
            <Plus className="h-5 w-5" /> مسابقة جديدة
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-4">
        {[
          { title: 'كل المسابقات', value: stats.total, icon: Trophy, tone: 'amber' },
          { title: 'نشطة الآن', value: stats.active, icon: CheckCircle2, tone: 'emerald' },
          { title: 'إجمالي المشاركات', value: stats.entries, icon: Users, tone: 'blue' },
          { title: 'بانتظار التحكيم', value: stats.pending, icon: Clock, tone: 'orange' },
        ].map(({ title, value, icon: Icon, tone }) => (
          <div key={title} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="mt-2 text-3xl font-black">{value}</p>
              </div>
              <div className={cn('rounded-2xl p-3',
                tone === 'amber' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                tone === 'emerald' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                tone === 'blue' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
              )}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Quick add */}
      <section className="grid gap-4 lg:grid-cols-3">
        {Object.entries(TYPE_CONFIG).filter(([t]) => ['monthly', 'tajweed', 'memorization'].includes(t)).map(([type, config]) => {
          const Icon = config.icon
          return (
            <button key={type} onClick={() => openAdd(type)}
              className="group overflow-hidden rounded-2xl border border-border bg-card text-right shadow-sm hover:-translate-y-1 hover:shadow-lg transition">
              <div className={`h-2 bg-gradient-to-l ${config.gradient}`} />
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`rounded-2xl bg-gradient-to-l ${config.gradient} p-3 text-white shadow-md`}><Icon className="h-5 w-5" /></div>
                  <Plus className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition" />
                </div>
                <div>
                  <h3 className="font-black">{config.label}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{config.hint}</p>
                </div>
              </div>
            </button>
          )
        })}
      </section>

      {/* Competition List */}
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black">قائمة المسابقات</h2>
            <p className="text-sm text-muted-foreground">انقر على مسابقة لعرض مشاركاتها وتحكيمها</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث..."
                className="w-full rounded-xl border border-border bg-background py-2.5 pe-9 ps-3 text-sm outline-none focus:ring-2 focus:ring-primary sm:w-56" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
              <option value="all">كل الأنواع</option>
              {Object.entries(TYPE_CONFIG).map(([t, c]) => <option key={t} value={t}>{c.label}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
              <option value="all">كل الحالات</option>
              {Object.entries(STATUSES).map(([s, c]) => <option key={s} value={s}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
            <Filter className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="font-bold">لا توجد مسابقات مطابقة</p>
            <p className="mt-1 text-sm text-muted-foreground">أنشئ مسابقة جديدة لطلاب المقرأة.</p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map(comp => {
              const config = TYPE_CONFIG[comp.type] || TYPE_CONFIG.monthly
              const Icon = config.icon
              const status = STATUSES[comp.status] || STATUSES.upcoming
              return (
                <article key={comp.id} className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm hover:shadow-md transition">
                  <div className={`h-1.5 bg-gradient-to-l ${config.gradient}`} />
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <div className={`shrink-0 rounded-2xl bg-gradient-to-l ${config.gradient} p-3 text-white shadow-sm`}><Icon className="h-5 w-5" /></div>
                        <div className="min-w-0">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-black">{comp.title}</h3>
                            <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-bold', status.className)}>{status.label}</span>
                            {(comp.pending_count || 0) > 0 && (
                              <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-0.5 text-xs font-bold">
                                {comp.pending_count} بانتظار التحكيم
                              </span>
                            )}
                          </div>
                          <p className="line-clamp-2 text-sm text-muted-foreground leading-6">{comp.description || config.hint}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button onClick={() => openEdit(comp)} className="rounded-xl p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(comp.id)} disabled={deletingId === comp.id} className="rounded-xl p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                          {deletingId === comp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                      <div className="rounded-2xl bg-muted/60 p-3">
                        <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> المدة</div>
                        <p className="truncate font-bold text-xs">{formatDate(comp.start_date)} — {formatDate(comp.end_date)}</p>
                      </div>
                      <div className="rounded-2xl bg-muted/60 p-3">
                        <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> المشاركات</div>
                        <p className="truncate font-bold">{comp.entries_count || 0} / {comp.max_participants || '∞'}</p>
                      </div>
                      <div className="rounded-2xl bg-muted/60 p-3">
                        <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground"><BarChart3 className="h-3.5 w-3.5" /> التحكيم</div>
                        <p className="truncate font-bold">{comp.evaluated_count || 0} تم</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-4 sm:flex-row">
                      <button
                        onClick={() => fetchEntries(comp)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border rounded-xl text-sm font-bold hover:bg-muted/50 transition-colors"
                      >
                        <ClipboardCheck className="h-4 w-4" />
                        عرض المشاركات وتحكيمها
                      </button>
                      <button
                        onClick={() => setJudgesComp(comp)}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 border border-border rounded-xl text-sm font-bold hover:bg-muted/50 transition-colors"
                      >
                        <Gavel className="h-4 w-4" />
                        المحكّمون
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* Judges Manager */}
      {judgesComp && (
        <JudgesManager
          apiBase="/api/admin/competitions"
          competition={{ id: judgesComp.id, title: judgesComp.title }}
          accent="primary"
          onClose={() => setJudgesComp(null)}
        />
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 p-6 backdrop-blur">
              <div>
                <h3 className="text-xl font-black">{editItem ? 'تعديل المسابقة' : 'مسابقة جديدة للمقرأة'}</h3>
                <p className="mt-1 text-sm text-muted-foreground">هذه المسابقة خاصة بطلاب المقرأة فقط</p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-xl p-2 hover:bg-muted transition"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {/* Type selector */}
              <div className="grid gap-3 sm:grid-cols-3">
                {Object.entries(TYPE_CONFIG).filter(([t]) => ['monthly', 'tajweed', 'memorization'].includes(t)).map(([type, config]) => (
                  <button key={type} type="button" onClick={() => setForm(p => ({ ...p, type, badge_key: config.badge }))}
                    className={cn('rounded-2xl border p-4 text-right transition', form.type === type ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/50')}>
                    <p className="font-black">{config.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-5">{config.hint}</p>
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm font-bold">
                  <span>اسم المسابقة <span className="text-red-500">*</span></span>
                  <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="مثال: مسابقة التلاوة الشهرية" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
                </label>
                <label className="block space-y-1.5 text-sm font-bold">
                  <span>نوع المسابقة</span>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value, badge_key: TYPE_CONFIG[e.target.value]?.badge || 'star_of_halaqah' }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
                    {Object.entries(TYPE_CONFIG).map(([t, c]) => <option key={t} value={t}>{c.label}</option>)}
                  </select>
                </label>
              </div>

              <label className="block space-y-1.5 text-sm font-bold">
                <span>وصف مختصر</span>
                <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="اشرح المطلوب من الطالب..." className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-primary" />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'تاريخ البداية *', key: 'start_date', type: 'date', required: true },
                  { label: 'تاريخ النهاية *', key: 'end_date', type: 'date', required: true },
                  { label: 'الحد الأقصى للمشاركين', key: 'max_participants', type: 'number' },
                  { label: 'الحد الأدنى للآيات', key: 'min_verses', type: 'number' },
                ].map(({ label, key, type, required }) => (
                  <label key={key} className="block space-y-1.5 text-sm font-bold">
                    <span>{label}</span>
                    <input required={required} type={type} min={type === 'number' ? 0 : undefined}
                      value={(form as any)[key]}
                      onChange={e => setForm(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
                  </label>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm font-bold">
                  <span>الشارة للفائز</span>
                  <select value={form.badge_key} onChange={e => setForm(p => ({ ...p, badge_key: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
                    <option value="star_of_halaqah">نجم الحلقة</option>
                    <option value="ramadan_badge">شارة رمضان</option>
                    <option value="tajweed_master">متقن التجويد</option>
                    <option value="hafiz_juz_amma">حافظ جزء عمّ</option>
                  </select>
                </label>
                <label className="block space-y-1.5 text-sm font-bold">
                  <span>مضاعف النقاط</span>
                  <input type="number" min={1} step={0.5} value={form.points_multiplier}
                    onChange={e => setForm(p => ({ ...p, points_multiplier: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
                </label>
              </div>

              <label className="block space-y-1.5 text-sm font-bold">
                <span>الجوائز</span>
                <textarea rows={2} value={form.prizes_description} onChange={e => setForm(p => ({ ...p, prizes_description: e.target.value }))}
                  placeholder="شارة + نقاط + تكريم..." className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-primary" />
              </label>

              <label className="block space-y-1.5 text-sm font-bold">
                <span>قواعد المسابقة</span>
                <textarea rows={3} value={form.rules} onChange={e => setForm(p => ({ ...p, rules: e.target.value }))}
                  placeholder="الشروط وطريقة الاشتراك والتحكيم..." className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-primary" />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 text-sm font-bold cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))} className="h-4 w-4 accent-primary" />
                إبرا�� المسابقة للطلاب في الواجهة
              </label>

              <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.certificate_enabled}
                    onChange={(event) => setForm({ ...form, certificate_enabled: event.target.checked })}
                    className="h-4 w-4 accent-amber-600"
                  />
                  <Award className="h-4 w-4 text-amber-700" />
                  إصدار شهادات للفائزين
                </label>
                {form.certificate_enabled && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1.5 text-sm font-bold">
                      <span>عدد الفائزين المستحقين للشهادة (Top N)</span>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={form.award_top_n}
                        onChange={(event) => setForm({ ...form, award_top_n: Number(event.target.value) })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                      />
                    </label>
                    <label className="block space-y-1.5 text-sm font-bold">
                      <span>قالب الشهادة (اختياري)</span>
                      <input
                        type="text"
                        placeholder="UUID القالب — اتركه فارغًا للاستخدام الافتراضي"
                        value={form.certificate_template_id}
                        onChange={(event) => setForm({ ...form, certificate_template_id: event.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary font-mono"
                      />
                    </label>
                  </div>
                )}
                <p className="text-xs text-amber-800 leading-relaxed">
                  عند انتهاء المسابقة، اضغط زر "إصدار شهادات أفضل N" في كرت المسابقة لتوليد طلبات شهادات
                  للطلاب الأفضل ترتيبًا.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-border py-3 font-bold hover:bg-muted transition">إلغاء</button>
                <button type="submit" disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
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
