'use client'

// Lightweight i18n fallback shim: `t.addedTranslations_2026?.[key]` always
// resolves to undefined, so every call falls back to the inline Arabic literal.
// Mirrors the pattern used by the sibling student competition pages.
const t: any = new Proxy({}, { get: () => new Proxy({}, { get: () => undefined }) })

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { PageLoadingSkeleton } from '@/components/ui/page-loading-skeleton'
import { ArrowRight, Loader2, Play, CheckCircle, Clock, Star, Send, Trophy, Award, Medal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import MediaViewer from '@/components/media-viewer'

interface Competition {
  id: string
  title: string
  type: string
  status: string
  tajweed_rules: string[] | null
}

interface RankPreviewRow {
  entry_id: string
  student_id: string
  student_name: string | null
  score: number | null
  rank: number
  is_winner: boolean
}

interface Entry {
  id: string
  student_name: string
  student_email: string
  submission_url: string | null
  notes: string | null
  score: number | null
  status: string
  feedback: string | null
  tajweed_scores: Record<string, number>
  verses_count: number
  submitted_at: string
  evaluated_at: string | null
  evaluated_by_name: string | null
  judge_count?: number
  rank: number | null
}

const TAJWEED_RULES = [
  { key: 'idgham', label: (t.addedTranslations_2026?.['الإدغام'] || 'الإدغام') },
  { key: 'ikhfa', label: (t.addedTranslations_2026?.['الإخفاء'] || 'الإخفاء') },
  { key: 'iqlab', label: (t.addedTranslations_2026?.['الإقلاب'] || 'الإقلاب') },
  { key: 'izhar', label: (t.addedTranslations_2026?.['الإظهار'] || 'الإظهار') },
  { key: 'madd', label: (t.addedTranslations_2026?.['المدود'] || 'المدود') },
  { key: 'qalqala', label: (t.addedTranslations_2026?.['القلقلة'] || 'القلقلة') },
  { key: 'ghunna', label: (t.addedTranslations_2026?.['الغنة'] || 'الغنة') },
  { key: 'tafkhim_tarqiq', label: (t.addedTranslations_2026?.['التفخيم والترقيق'] || 'التفخيم والترقيق') },
  { key: 'waqf', label: (t.addedTranslations_2026?.['الوقف والابتداء'] || 'الوقف والابتداء') },
  { key: 'makharij', label: (t.addedTranslations_2026?.['مخارج الحروف'] || 'مخارج الحروف') },
]

export default function ReaderCompetitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  

  const { id } = use(params)
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)
  const [evalForm, setEvalForm] = useState<{
    score: number
    tajweed_scores: Record<string, number>
    feedback: string
  }>({ score: 0, tajweed_scores: {}, feedback: '' })
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'evaluated'>('all')
  const [resultsPreview, setResultsPreview] = useState<{ ready: boolean; pending: number; topN: number; ranking: RankPreviewRow[] } | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [finalizing, setFinalizing] = useState(false)

  const openResults = async () => {
    setShowResults(true)
    setLoadingPreview(true)
    try {
      const res = await fetch(`/api/reader/competitions/${id}/finalize`)
      if (res.ok) setResultsPreview(await res.json())
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingPreview(false)
    }
  }

  const confirmResults = async () => {
    setFinalizing(true)
    try {
      const res = await fetch(`/api/reader/competitions/${id}/finalize`, { method: 'POST' })
      if (res.ok) {
        setShowResults(false)
        setResultsPreview(null)
        loadData()
      } else {
        const data = await res.json()
        alert(data.error || (t.addedTranslations_2026?.['حدث خطأ أثناء اعتماد النتائج'] || 'حدث خطأ أثناء اعتماد النتائج'))
      }
    } finally {
      setFinalizing(false)
    }
  }

  const loadData = async () => {
    try {
      const res = await fetch(`/api/reader/competitions/${id}/entries`)
      if (res.ok) {
        const json = await res.json()
        setCompetition(json.competition || null)
        setEntries(json.entries || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [id])

  const startEvaluate = (entry: Entry) => {
    setEvaluatingId(entry.id)
    const initialScores: Record<string, number> = {}
    TAJWEED_RULES.forEach(r => { initialScores[r.key] = entry.tajweed_scores?.[r.key] || 0 })
    setEvalForm({
      score: entry.score || 0,
      tajweed_scores: competition?.type === 'tajweed' ? initialScores : {},
      feedback: entry.feedback || '',
    })
  }

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!evaluatingId) return
    setSubmitting(true)
    try {
      let finalScore = evalForm.score
      if (competition?.type === 'tajweed' && Object.keys(evalForm.tajweed_scores).length > 0) {
        const values = Object.values(evalForm.tajweed_scores)
        // Each rule is scored out of 10; the average (0-10) is scaled to a /100 final score
        // so tajweed entries use the same scale as every other competition type.
        finalScore = values.reduce((a, b) => a + b, 0)
      }

      const res = await fetch(`/api/reader/competitions/entries/${evaluatingId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: finalScore,
          tajweed_scores: evalForm.tajweed_scores,
          feedback: evalForm.feedback,
        }),
      })

      if (res.ok) {
        setEvaluatingId(null)
        loadData()
      } else {
        const data = await res.json()
        alert(data.error || (t.addedTranslations_2026?.['حدث خطأ'] || 'حدث خطأ'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const filteredEntries = entries.filter(e => {
    if (filter === 'pending') return e.status === 'pending' && e.submission_url
    if (filter === 'evaluated') return e.status !== 'pending'
    return true
  })

  const pendingCount = entries.filter(e => e.status === 'pending' && e.submission_url).length
  const evaluatedCount = entries.filter(e => e.status !== 'pending').length

  if (loading) {
    return <PageLoadingSkeleton />
  }

  if (!competition) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{(t.addedTranslations_2026?.['لم يتم العثور على المسابقة.'] || 'لم يتم العثور على المسابقة.')}</p>
        <Link href="/reader/competitions" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline mt-4">
          <ArrowRight className="w-4 h-4" />
          {(t.addedTranslations_2026?.['العودة للمسابقات'] || 'العودة للمسابقات')}
                        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Back */}
      <Link href="/reader/competitions" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2">
        <ArrowRight className="w-4 h-4" />
        {(t.addedTranslations_2026?.['العودة للمسابقات'] || 'العودة للمسابقات')}
                    </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{competition.title}</h1>
          <p className="text-muted-foreground mt-2">{(t.addedTranslations_2026?.['مراجعة وتقييم مشاركات الطلاب في هذه المسابقة.'] || 'مراجعة وتقييم مشاركات الطلاب في هذه المسابقة.')}</p>
          {competition.status === 'ended' && (
            <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200/60 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/50 px-3 py-1 rounded-full">
              <Trophy className="w-3.5 h-3.5" /> {(t.addedTranslations_2026?.['تم اعتماد النتائج'] || 'تم اعتماد النتائج')}
                                      </span>
          )}
        </div>
        <div className="flex flex-col items-stretch gap-3">
          <div className="flex gap-4">
            <div className="flex flex-col items-center justify-center bg-card border border-border/50 shadow-sm rounded-xl px-6 py-3 min-w-[120px]">
              <span className="text-3xl font-bold text-amber-600 dark:text-amber-500">{pendingCount}</span>
              <span className="text-xs font-medium text-muted-foreground mt-1">{(t.addedTranslations_2026?.['بانتظار التقييم'] || 'بانتظار التقييم')}</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-card border border-border/50 shadow-sm rounded-xl px-6 py-3 min-w-[120px]">
              <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">{evaluatedCount}</span>
              <span className="text-xs font-medium text-muted-foreground mt-1">{(t.addedTranslations_2026?.['تم التقييم'] || 'تم التقييم')}</span>
            </div>
          </div>
          {/* Finalize: enabled once at least one entry is evaluated. */}
          {evaluatedCount > 0 && (
            <button
              onClick={openResults}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm hover:shadow"
            >
              <Trophy className="w-4 h-4" />
              {competition.status === 'ended' ? (t.addedTranslations_2026?.['مراجعة / إعادة اعتماد النتائج'] || 'مراجعة / إعادة اعتماد النتائج') : 'اعتماد النتائج وإعلان الفائزين'}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="inline-flex items-center p-1 bg-muted/50 rounded-lg border border-border/50">
        {(['all', 'pending', 'evaluated'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-5 py-2 rounded-md text-sm font-medium transition-all duration-200",
              filter === f 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            {f === 'all' ? `الكل (${entries.length})` : f === 'pending' ? `بانتظار (${pendingCount})` : `تم التقييم (${evaluatedCount})`}
          </button>
        ))}
      </div>

      {/* Entries */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-card/50 border border-dashed border-border rounded-xl">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">{(t.addedTranslations_2026?.['لا توجد مشاركات'] || 'لا توجد مشاركات')}</h3>
          <p className="text-muted-foreground text-sm">
            {filter === 'pending' ? (t.addedTranslations_2026?.['لا توجد مشاركات بانتظار التقييم حالياً.'] || 'لا توجد مشاركات بانتظار التقييم حالياً.') : 'لم يتم العثور على أي مشاركات تطابق بحثك.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredEntries.map(entry => (
            <div key={entry.id} className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
              {/* Card Header */}
              <div className="p-5 border-b border-border/40 bg-muted/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {entry.student_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{entry.student_name}</h3>
                    <p className="text-sm text-muted-foreground" dir="ltr">{entry.student_email}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border shadow-sm",
                  entry.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50' :
                  entry.status === 'winner' ? 'bg-yellow-50 text-yellow-700 border-yellow-200/50 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/50' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
                )}>
                  {entry.status === 'pending' ? (t.addedTranslations_2026?.['قيد التقييم'] || 'قيد التقييم') : entry.status === 'winner' ? (t.addedTranslations_2026?.['فائز 🏆'] || 'فائز 🏆') : 'تم التقييم'}
                </span>
              </div>

              {/* Card Content */}
              <div className="p-5 space-y-5">
                {entry.submission_url && (
                  <div className="bg-muted/20 rounded-lg p-2 border border-border/50 max-w-2xl">
                    <MediaViewer url={entry.submission_url} />
                  </div>
                )}

                <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
                  {entry.verses_count > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-semibold text-foreground">{(t.addedTranslations_2026?.['عدد الآيات:'] || 'عدد الآيات:')}</span> 
                      <span className="bg-muted px-2 py-0.5 rounded-md">{entry.verses_count}</span>
                    </div>
                  )}
                  {entry.notes && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-semibold text-foreground">{(t.addedTranslations_2026?.['ملاحظات الطالب:'] || 'ملاحظات الطالب:')}</span> 
                      <span>{entry.notes}</span>
                    </div>
                  )}
                </div>

                {entry.score !== null && (
                  <div className="bg-muted/30 rounded-xl p-5 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{(t.addedTranslations_2026?.['الدرجة الن��ائية'] || 'الدرجة النهائية')}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-foreground">{entry.score}</span>
                          <span className="text-sm text-muted-foreground">/ 100</span>
                        </div>
                      </div>
                      {entry.rank !== null && entry.rank <= 3 && (
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0",
                          entry.rank === 1 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          entry.rank === 2 ? "bg-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300" :
                          "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        )}>
                          <Medal className="w-3.5 h-3.5" />
                          {entry.rank === 1 ? (t.addedTranslations_2026?.['المركز الأول'] || 'المركز الأول') : entry.rank === 2 ? (t.addedTranslations_2026?.['المركز الثاني'] || 'المركز الثاني') : 'المركز الثالث'}
                        </span>
                      )}
                    </div>
                    
                    {entry.feedback && (
                      <div className="flex-1 sm:border-r border-border/50 sm:pr-4">
                        <p className="text-sm font-medium text-foreground mb-1">{(t.addedTranslations_2026?.['الملاحظات التوجيهية:'] || 'الملاحظات التوجيهية:')}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{entry.feedback}</p>
                      </div>
                    )}
                    
                    {(entry.judge_count ?? 0) > 1 ? (
                      <div className="text-xs text-muted-foreground bg-background px-3 py-1.5 rounded-md border border-border/50 text-center shrink-0">
                        {(t.addedTranslations_2026?.['متوسط درجات'] || 'متوسط درجات')} <span className="font-medium text-foreground">{entry.judge_count}</span> {(t.addedTranslations_2026?.['محكّمين'] || 'محكّمين')}
                      </div>
                    ) : entry.evaluated_by_name ? (
                      <div className="text-xs text-muted-foreground bg-background px-3 py-1.5 rounded-md border border-border/50 text-center shrink-0">
                        {(t.addedTranslations_2026?.['المُقيّم:'] || 'المُقيّم:')} <span className="font-medium text-foreground">{entry.evaluated_by_name}</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              {entry.submission_url && !evaluatingId && (
                <div className="p-5 pt-0 flex justify-end border-t border-border/40 mt-4 bg-muted/5">
                  <button
                    onClick={() => startEvaluate(entry)}
                    className={cn(
                      "mt-4 px-6 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105 shadow-sm",
                      entry.status === 'pending' 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80"
                    )}
                  >
                    {entry.status === 'pending' ? (t.addedTranslations_2026?.['بدء التقييم'] || 'بدء التقييم') : 'تعديل التقييم'}
                  </button>
                </div>
              )}

              {/* Evaluation Form */}
              {evaluatingId === entry.id && (
                <div className="p-6 border-t border-border bg-muted/10">
                  <form onSubmit={handleEvaluate} className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-border/50">
                      <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        {(t.addedTranslations_2026?.['نموذج التقييم'] || 'نموذج التقييم')}
                                                            </h4>
                    </div>
                    
                    {competition.type === 'tajweed' ? (
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-foreground bg-primary/10 text-primary px-3 py-1 rounded-md w-fit">{(t.addedTranslations_2026?.['تقييم أحكام التجويد (من 10)'] || 'تقييم أحكام التجويد (من 10)')}</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {TAJWEED_RULES.map(r => (
                              <div key={r.key} className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 bg-background hover:border-primary/30 transition-colors shadow-sm">
                                <label className="text-sm font-semibold text-muted-foreground">{r.label}</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={10}
                                  step={0.5}
                                  value={evalForm.tajweed_scores[r.key] || 0}
                                  onChange={e => setEvalForm(prev => ({
                                    ...prev,
                                    tajweed_scores: { ...prev.tajweed_scores, [r.key]: parseFloat(e.target.value) || 0 },
                                  }))}
                                  className="w-20 px-3 py-1.5 text-sm font-bold rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-center transition-all"
                                />
                              </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 max-w-xs">
                        <label className="block text-sm font-bold text-foreground">{(t.addedTranslations_2026?.['الدرجة النهائية (من 100)'] || 'الدرجة النهائية (من 100)')}</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={evalForm.score}
                          onChange={e => setEvalForm(prev => ({ ...prev, score: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xl font-bold shadow-sm"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-foreground">{(t.addedTranslations_2026?.['الملاحظات التوجيهية للطالب'] || 'الملاحظات التوجيهية للطالب')}</label>
                      <textarea
                        value={evalForm.feedback}
                        onChange={e => setEvalForm(prev => ({ ...prev, feedback: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                        placeholder={(t.addedTranslations_2026?.['أضف ملاحظاتك البناءة للطالب هنا لتساعده على التطور...'] || 'أضف ملاحظاتك البناءة للطالب هنا لتساعده على التطور...')}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setEvaluatingId(null)}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {(t.addedTranslations_2026?.['إلغاء'] || 'إلغاء')}
                                                            </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center min-w-[140px] px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-2" />}
                        {(t.addedTranslations_2026?.['حفظ التقييم'] || 'حفظ التقييم')}
                                                            </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Results / finalize modal */}
      {showResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !finalizing && setShowResults(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border/60">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                {(t.addedTranslations_2026?.['اعتماد نتائج المسابقة'] || 'اعتماد نتائج المسابقة')}
                                            </h3>
              <button onClick={() => !finalizing && setShowResults(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              {loadingPreview ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : !resultsPreview || resultsPreview.ranking.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">{(t.addedTranslations_2026?.['لا توجد مشاركات مُقيّمة بعد لاعتماد نتائجها.'] || 'لا توجد مشاركات مُقيّمة بعد لاعتماد نتائجها.')}</p>
              ) : (
                <div className="space-y-4">
                  {resultsPreview.pending > 0 && (
                    <div className="flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50 rounded-lg p-3">
                      <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{(t.addedTranslations_2026?.['يوجد'] || 'يوجد')} {resultsPreview.pending} {(t.addedTranslations_2026?.['مشاركة لم تُقيَّم بعد. يمكنك الاعتماد الآن وستُحتسب المُقيَّمة فقط، أو إكمال التقييم أولاً.'] || 'مشاركة لم تُقيَّم بعد. يمكنك الاعتماد الآن وستُحتسب المُقيَّمة فقط، أو إكمال التقييم أولاً.')}</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {(t.addedTranslations_2026?.['سيتم ترتيب المشاركات حسب الدرجة، وإعلان أفضل'] || 'سيتم ترتيب المشاركات حسب الدرجة، وإعلان أفضل')} <span className="font-bold text-foreground">{resultsPreview.topN}</span> {(t.addedTranslations_2026?.['كفائزين ومنحهم النقاط.'] || 'كفائزين ومنحهم النقاط.')}
                                                                </p>
                  <div className="space-y-2">
                    {resultsPreview.ranking.map(row => (
                      <div key={row.entry_id} className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border p-3",
                        row.is_winner ? "border-primary/40 bg-primary/5" : "border-border/50 bg-muted/20"
                      )}>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                            row.rank === 1 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                            row.rank === 2 ? "bg-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300" :
                            row.rank === 3 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {row.rank}
                          </span>
                          <span className="text-sm font-medium text-foreground">{row.student_name || (t.addedTranslations_2026?.['طالب'] || 'طالب')}</span>
                          {row.is_winner && <Medal className="w-4 h-4 text-primary" />}
                        </div>
                        <span className="text-sm font-bold text-foreground">{row.score} <span className="text-xs font-normal text-muted-foreground">/ 100</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-border/60">
              <button
                onClick={() => setShowResults(false)}
                disabled={finalizing}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
              >
                {(t.addedTranslations_2026?.['إلغاء'] || 'إلغاء')}
                                            </button>
              <button
                onClick={confirmResults}
                disabled={finalizing || loadingPreview || !resultsPreview || resultsPreview.ranking.length === 0}
                className="inline-flex items-center justify-center gap-2 min-w-[160px] px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {finalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                {(t.addedTranslations_2026?.['تأكيد واعتماد النتائج'] || 'تأكيد واعتماد النتائج')}
                                            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
