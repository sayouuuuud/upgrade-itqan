"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  HelpCircle, CheckCircle, Clock, Globe,
  TrendingUp, ArrowLeft, Loader2, User, BarChart3,
  ShieldCheck, ArrowRight, Sparkles, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

interface Stats {
  total: number
  unanswered: number
  answered: number
  published: number
}

interface RecentQuestion {
  id: string
  question: string
  asker_name: string | null
  is_anonymous: boolean
  category_name_ar: string | null
  answer: string | null
  is_published: boolean
  asked_at: string
}

export default function FiqhSupervisorDashboard() {
  const { t } = useI18n()
  const academy = (t as any).academy as Record<string, string> | undefined
  const a = t.admin
  const [stats, setStats] = useState<Stats>({ total: 0, unanswered: 0, answered: 0, published: 0 })
  const [recent, setRecent] = useState<RecentQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [supervisorName, setSupervisorName] = useState<string>('')

  useEffect(() => {
    async function load() {
      try {
        const [inboxRes, meRes] = await Promise.all([
          fetch('/api/academy/fiqh?view=inbox&status=all'),
          fetch('/api/auth/me'),
        ])
        if (inboxRes.ok) {
          const d = await inboxRes.json()
          const qs: RecentQuestion[] = d.questions || []
          const c = d.counts || {}
          const total = c.all ?? qs.length
          const open = c.open ?? 0
          setStats({
            total,
            unanswered: open,
            answered:   Math.max(total - open, 0),
            published:  c.published ?? 0,
          })
          setRecent(qs.slice(0, 5))
        }
        if (meRes.ok) {
          const d = await meRes.json()
          setSupervisorName(d.user?.name || '')
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const answerRate = stats.total > 0 ? Math.round((stats.answered / stats.total) * 100) : 0

  const statCards = [
    { label: a.fsqTotalQuestionsShort, value: stats.total, icon: HelpCircle, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', shadow: 'shadow-primary/10' },
    { label: a.fsqAwaitingAnswer, value: stats.unanswered, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', shadow: 'shadow-amber-500/10' },
    { label: a.fsqAnswered, value: stats.answered, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', shadow: 'shadow-emerald-500/10' },
    { label: a.fsqPublished, value: stats.published, icon: Globe, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', shadow: 'shadow-blue-500/10' },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto relative min-h-screen">
      {/* Decorative Background Effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full filter blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full filter blur-[100px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] p-8 shadow-2xl shadow-black/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-2 shadow-inner">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-bold tracking-wide uppercase">{a.fsqDashboard}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight flex flex-col gap-2">
            {a.fsqWelcome} 
            <span>
              {supervisorName || a.fsqWelcomeName}
            </span>
          </h1>
          <p className="text-muted-foreground/80 font-medium max-w-2xl text-lg leading-relaxed">
            {a.fsqDashboardDesc}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-card/30 backdrop-blur-xl rounded-[40px] border border-white/10 shadow-xl">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <Loader2 className="absolute inset-0 m-auto w-8 h-8 animate-spin text-primary opacity-50" />
          </div>
          <p className="text-lg font-bold text-muted-foreground animate-pulse">{a.fsqLoadingDashboard}</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Stats Grid (Bento Style) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map(({ label, value, icon: Icon, color, bg, border, shadow }) => (
              <div 
                key={label} 
                className={cn(
                  "relative group bg-card/60 backdrop-blur-xl border rounded-[32px] p-6 hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 overflow-hidden cursor-default",
                  border, shadow
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-50 pointer-events-none" />
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${bg} opacity-50 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700`} />
                
                <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                  <div className="flex items-center justify-between">
                    <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform duration-500`}>
                      <Icon className={`w-7 h-7 ${color}`} />
                    </div>
                  </div>
                  <div>
                    <p className={`text-5xl font-black tracking-tighter ${color} drop-shadow-sm`}>{value}</p>
                    <p className="text-sm text-muted-foreground mt-2 font-bold uppercase tracking-widest">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Answer Rate Bar */}
            <div className="lg:col-span-1 flex flex-col space-y-6">
              <div className="bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[40px] p-8 shadow-xl shadow-black/5 flex-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent opacity-50 pointer-events-none" />
                
                <div className="flex items-center gap-3 mb-8 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-lg font-black text-foreground">{a.fsqCompletionRate}</span>
                </div>
                
                <div className="flex items-end justify-between mb-4 relative z-10">
                  <span className="text-6xl font-black text-primary tracking-tighter drop-shadow-md">
                    {answerRate}%
                  </span>
                  <span className="text-sm font-bold text-muted-foreground mb-2">
                    {stats.answered} / {stats.total} {a.fsqQuestionsUnit}
                  </span>
                </div>
                
                <div className="bg-muted/50 rounded-full h-4 overflow-hidden relative z-10 p-0.5 border border-border shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${answerRate}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-500" />
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:16px_16px] animate-[slide_1s_linear_infinite]" />
                  </div>
                </div>
                
                <div className="mt-8 relative z-10 bg-primary/5 border border-primary/10 rounded-3xl p-5">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-primary/80 font-bold leading-relaxed">
                    {answerRate >= 90 ? a.fsqExcellentPerformance
                     : answerRate >= 50 ? a.fsqGoodPerformance
                     : a.fsqNeedsAttention}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Questions */}
            <div className="lg:col-span-2">
              <div className="bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[40px] overflow-hidden shadow-xl shadow-black/5 h-full flex flex-col relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000 pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-8 py-6 border-b border-white/10 dark:border-white/5 bg-white/5 dark:bg-black/5 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
                      <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h2 className="font-black text-foreground text-xl">{a.fsqLatestQuestions}</h2>
                      <p className="text-xs font-semibold text-muted-foreground mt-1">{a.fsqLatestQuestionsDesc}</p>
                    </div>
                  </div>
                  
                  <Link
                    href="/academy/fiqh-supervisor/questions"
                    className="mt-4 sm:mt-0 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 px-6 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 group/btn"
                  >
                    {a.fsqViewInbox}
                    <ArrowLeft className="w-4 h-4 group-hover/btn:-translate-x-1 transition-transform" />
                  </Link>
                </div>
                
                <div className="flex-1 divide-y divide-border/50 relative z-10">
                  {recent.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center h-full">
                      <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/10">
                        <CheckCircle className="w-8 h-8 text-muted-foreground opacity-50" />
                      </div>
<p className="text-lg font-black text-foreground">{a.fsqNoQuestionsYet}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {a.fsqNoQuestionsDesc}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {recent.map((q, idx) => (
                        <Link
                          key={q.id}
                          href={`/academy/fiqh-supervisor/questions/${q.id}`}
                          className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/40 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-white/5 border border-white/20 dark:border-white/5 p-5 rounded-[24px] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group/item"
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover/item:scale-110 transition-transform ${
                            q.answer !== null ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'
                          }`}>
                            {q.answer !== null ? (
                              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-base font-bold text-foreground line-clamp-1 group-hover/item:text-primary transition-colors leading-relaxed">
                              {q.question}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-bold text-muted-foreground">
                              <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg border border-border">
                                <User className="w-3 h-3" />
                                {q.is_anonymous ? a.fsqAnonymous : q.asker_name || '—'}
                              </span>
                              {q.category_name_ar && (
                                <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg border border-primary/20 flex items-center gap-1.5">
                                  <Globe className="w-3 h-3" />
                                  {q.category_name_ar}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex sm:flex-col justify-between items-center sm:items-end gap-2 shrink-0">
                            <span className={`px-4 py-1.5 text-[11px] font-black rounded-xl border uppercase tracking-widest ${
                              q.answer !== null
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                            }`}>
                              {q.answer !== null ? a.fsqAnsweredLabel : a.fsqPendingLabel}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold px-2">
                              {new Date(q.asked_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
