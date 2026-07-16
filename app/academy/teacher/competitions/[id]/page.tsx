'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, CheckCircle, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import MediaViewer from '@/components/media-viewer'
import { useI18n } from "@/lib/i18n/context";

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
  evaluated_by_name: string | null
  judge_count?: number
}

const TAJWEED_RULES = [
  { key: 'idgham', label: '' },
  { key: 'ikhfa', label: '' },
  { key: 'iqlab', label: '' },
  { key: 'izhar', label: '' },
  { key: 'madd', label: '' },
  { key: 'qalqala', label: '' },
  { key: 'ghunna', label: '' },
  { key: 'tafkhim_tarqiq', label: '' },
  { key: 'waqf', label: '' },
  { key: 'makharij', label: '' },
]

export default function TeacherCompetitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t } = useI18n()
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
      const res = await fetch(`/api/academy/teacher/competitions/${id}/entries`)
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
        finalScore = values.reduce((a, b) => a + b, 0)
      }

      const res = await fetch(`/api/academy/teacher/competitions/${id}/entries/${evaluatingId}/evaluate`, {
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
        alert(data.error || '')
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{''}</p>
        <Link href="/academy/teacher/competitions" className="text-emerald-600 text-sm mt-2 inline-block">
          {''}
                        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/academy/teacher/competitions" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowRight className="w-4 h-4" />
        {''}
                    </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{competition.title}</h1>
          <p className="text-muted-foreground mt-1">{''}</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2 text-center">
            <span className="text-2xl font-bold text-amber-600">{pendingCount}</span>
            <p className="text-xs text-amber-700 dark:text-amber-400">{''}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2 text-center">
            <span className="text-2xl font-bold text-green-600">{evaluatedCount}</span>
            <p className="text-xs text-green-700 dark:text-green-400">{''}</p>
          </div>
        </div>
      </div>

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

      {filteredEntries.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">{''} {filter === 'pending' ? '' : ''}</p>
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
                      {entry.status === 'pending' ? '' : entry.status === 'winner' ? '' : ''}
                    </span>
                  </div>
                  {entry.student_email && <p className="text-sm text-muted-foreground">{entry.student_email}</p>}

                  {entry.submission_url && (
                    <div className="mt-3">
                      <MediaViewer url={entry.submission_url} />
                    </div>
                  )}

                  {entry.verses_count > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">{''} {entry.verses_count}</p>
                  )}
                  {entry.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{''} {entry.notes}</p>
                  )}

                  {entry.score !== null && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-medium">{''}</span>
                      <span className="text-lg font-bold text-amber-600">{entry.score}</span>
                      {(entry.judge_count ?? 0) > 1 ? (
                        <span className="text-xs text-muted-foreground">
                          {''} {entry.judge_count} {''}
                        </span>
                      ) : entry.evaluated_by_name ? (
                        <span className="text-xs text-muted-foreground">{''} {entry.evaluated_by_name}</span>
                      ) : null}
                    </div>
                  )}
                  {entry.feedback && (
                    <p className="text-sm mt-1 text-muted-foreground">{''} {entry.feedback}</p>
                  )}
                </div>

                <div>
                  {entry.submission_url && (
                    <button
                      onClick={() => startEvaluate(entry)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                      {entry.status === 'pending' ? '' : ''}
                    </button>
                  )}
                </div>
              </div>

              {evaluatingId === entry.id && (
                <form onSubmit={handleEvaluate} className="mt-4 pt-4 border-t border-border space-y-4">
                  {competition.type === 'tajweed' ? (
                    <div>
                      <p className="text-sm font-medium mb-3">{''}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {TAJWEED_RULES.map(r => (
                          <div key={r.key} className="flex items-center gap-2">
                            <label className="text-sm flex-1">{r.label}</label>
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
                              className="w-20 px-2 py-1.5 rounded-lg border border-border bg-background text-center"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1">{''}</label>
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
                    <label className="block text-sm font-medium mb-1">{''}</label>
                    <textarea
                      value={evalForm.feedback}
                      onChange={e => setEvalForm(prev => ({ ...prev, feedback: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background min-h-[80px] resize-y"
                      placeholder={''}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin inline-block ml-1" /> : <Send className="w-4 h-4 inline-block ml-1" />}
                      {''}
                                                      </button>
                    <button
                      type="button"
                      onClick={() => setEvaluatingId(null)}
                      className="px-4 py-2.5 bg-muted text-foreground rounded-xl font-bold transition-colors"
                    >
                      {''}
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
