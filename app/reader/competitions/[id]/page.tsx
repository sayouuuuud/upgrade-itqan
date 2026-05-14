'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, Play, CheckCircle, Clock, Star, Send, Trophy, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Competition {
  id: string
  title: string
  type: string
  status: string
  tajweed_rules: string[] | null
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
  evaluator_name: string | null
}

const TAJWEED_RULES = [
  { key: 'idgham', label: 'الإدغام' },
  { key: 'ikhfa', label: 'الإخفاء' },
  { key: 'iqlab', label: 'الإقلاب' },
  { key: 'izhar', label: 'الإظهار' },
  { key: 'madd', label: 'المدود' },
  { key: 'qalqala', label: 'القلقلة' },
  { key: 'ghunna', label: 'الغنة' },
  { key: 'tafkhim_tarqiq', label: 'التفخيم والترقيق' },
  { key: 'waqf', label: 'الوقف والابتداء' },
  { key: 'makharij', label: 'مخارج الحروف' },
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
    const rules = competition?.tajweed_rules || TAJWEED_RULES.map(r => r.key)
    rules.forEach(r => { initialScores[r] = entry.tajweed_scores?.[r] || 0 })
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
        finalScore = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10 : 0
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
        alert(data.error || 'حدث خطأ')
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">المسابقة غير موجودة</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/reader/competitions" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowRight className="w-4 h-4" />
        العودة للمسابقات
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{competition.title}</h1>
          <p className="text-muted-foreground mt-1">تقييم مشاركات الطلاب</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2 text-center">
            <span className="text-2xl font-bold text-amber-600">{pendingCount}</span>
            <p className="text-xs text-amber-700 dark:text-amber-400">بانتظار التقييم</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2 text-center">
            <span className="text-2xl font-bold text-green-600">{evaluatedCount}</span>
            <p className="text-xs text-green-700 dark:text-green-400">تم تقييمها</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'evaluated'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === f ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {f === 'all' ? `الكل (${entries.length})` : f === 'pending' ? `بانتظار (${pendingCount})` : `تم التقييم (${evaluatedCount})`}
          </button>
        ))}
      </div>

      {/* Entries */}
      {filteredEntries.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">لا توجد مشاركات {filter === 'pending' ? 'بانتظار التقييم' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map(entry => (
            <div key={entry.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{entry.student_name}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      entry.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      entry.status === 'winner' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    )}>
                      {entry.status === 'pending' ? 'قيد التقييم' : entry.status === 'winner' ? 'فائز 🏆' : 'تم التقييم'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{entry.student_email}</p>

                  {entry.submission_url && (
                    <a href={entry.submission_url} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1 mt-2 text-sm text-emerald-600 hover:underline">
                      <Play className="w-4 h-4" /> استمع للتلاوة
                    </a>
                  )}

                  {entry.verses_count > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">عدد الآيات: {entry.verses_count}</p>
                  )}
                  {entry.notes && (
                    <p className="text-sm text-muted-foreground mt-1">ملاحظات الطالب: {entry.notes}</p>
                  )}

                  {entry.score !== null && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-medium">الدرجة:</span>
                      <span className="text-lg font-bold text-amber-600">{entry.score}</span>
                      {entry.evaluator_name && (
                        <span className="text-xs text-muted-foreground">— بواسطة {entry.evaluator_name}</span>
                      )}
                    </div>
                  )}
                  {entry.feedback && (
                    <p className="text-sm mt-1 text-muted-foreground">الملاحظات: {entry.feedback}</p>
                  )}
                </div>

                <div>
                  {entry.submission_url && (
                    <button
                      onClick={() => startEvaluate(entry)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                      {entry.status === 'pending' ? 'قيّم' : 'أعد التقييم'}
                    </button>
                  )}
                </div>
              </div>

              {/* Evaluation Form */}
              {evaluatingId === entry.id && (
                <form onSubmit={handleEvaluate} className="mt-4 pt-4 border-t border-border space-y-4">
                  {competition.type === 'tajweed' ? (
                    <div>
                      <p className="text-sm font-medium mb-3">تقييم أحكام التجويد (من 10):</p>
                      <div className="grid grid-cols-2 gap-3">
                        {(competition.tajweed_rules || TAJWEED_RULES.map(r => r.key)).map(ruleKey => {
                          const ruleLabel = TAJWEED_RULES.find(r => r.key === ruleKey)?.label || ruleKey
                          return (
                            <div key={ruleKey} className="flex items-center gap-2">
                              <label className="text-sm flex-1">{ruleLabel}</label>
                              <input
                                type="number"
                                min={0}
                                max={10}
                                step={0.5}
                                value={evalForm.tajweed_scores[ruleKey] || 0}
                                onChange={e => setEvalForm(prev => ({
                                  ...prev,
                                  tajweed_scores: { ...prev.tajweed_scores, [ruleKey]: parseFloat(e.target.value) || 0 },
                                }))}
                                className="w-20 px-2 py-1.5 rounded-lg border border-border bg-background text-center"
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1">الدرجة (من 100)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={evalForm.score}
                        onChange={e => setEvalForm(prev => ({ ...prev, score: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">ملاحظات التقييم</label>
                    <textarea
                      value={evalForm.feedback}
                      onChange={e => setEvalForm(prev => ({ ...prev, feedback: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background min-h-[80px] resize-y"
                      placeholder="أضف ملاحظاتك على التلاوة..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin inline-block ml-1" /> : <Send className="w-4 h-4 inline-block ml-1" />}
                      حفظ التقييم
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvaluatingId(null)}
                      className="px-4 py-2.5 bg-muted text-foreground rounded-xl font-bold transition-colors"
                    >
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
