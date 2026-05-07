"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  HelpCircle, CheckCircle, Clock, Globe,
  TrendingUp, ArrowLeft, Loader2, User, BarChart3
} from 'lucide-react'

interface Stats {
  total: number
  unanswered: number
  answered: number
  published: number
}

interface RecentQuestion {
  id: string
  question: string
  student_name: string
  category: string
  answer: string | null
  is_published: boolean
  asked_at: string
}

export default function FiqhSupervisorDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, unanswered: 0, answered: 0, published: 0 })
  const [recent, setRecent] = useState<RecentQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [supervisorName, setSupervisorName] = useState<string>('')

  useEffect(() => {
    async function load() {
      try {
        const [allRes, meRes] = await Promise.all([
          fetch('/api/academy/fiqh?filter=all'),
          fetch('/api/auth/me'),
        ])
        if (allRes.ok) {
          const d = await allRes.json()
          const qs: RecentQuestion[] = d.questions || []
          setStats({
            total:      qs.length,
            unanswered: qs.filter(q => q.answer === null).length,
            answered:   qs.filter(q => q.answer !== null).length,
            published:  qs.filter(q => q.is_published).length,
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
    { label: 'إجمالي الأسئلة',   value: stats.total,      icon: HelpCircle,   color: 'text-primary',                   bg: 'bg-primary/10' },
    { label: 'تنتظر الإجابة',    value: stats.unanswered, icon: Clock,        color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'تمت الإجابة',      value: stats.answered,   icon: CheckCircle,  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'منشورة للعموم',    value: stats.published,  icon: Globe,        color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  ]

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-black text-foreground">
          {supervisorName ? `مرحباً، ${supervisorName}` : 'لوحة التحكم'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          مشرف أسئلة الفقه — مراجعة الأسئلة الواردة من الطلاب والإجابة عليها
        </p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-5">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className={`text-3xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* Answer rate bar */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">نسبة الإجابة</span>
              </div>
              <span className="text-2xl font-black text-primary">{answerRate}%</span>
            </div>
            <div className="bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${answerRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.answered} من أصل {stats.total} سؤال تمت الإجابة عليه
            </p>
          </div>

          {/* Recent questions */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-foreground text-sm">آخر الأسئلة</h2>
              </div>
              <Link
                href="/academy/fiqh-supervisor/questions"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                عرض الكل
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recent.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  لا توجد أسئلة بعد
                </div>
              ) : recent.map(q => (
                <Link
                  key={q.id}
                  href={`/academy/fiqh-supervisor/questions/${q.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {q.question}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{q.student_name}</span>
                      <span className="px-1.5 py-0.5 bg-muted rounded-full">{q.category}</span>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 text-xs font-bold rounded-full ${
                    q.answer !== null
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                  }`}>
                    {q.answer !== null ? 'مُجاب' : 'ينتظر'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
