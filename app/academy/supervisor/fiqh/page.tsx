"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { HelpCircle, Clock, User, Filter, Eye, CheckCircle, Loader2 } from 'lucide-react'

interface FiqhQuestion {
  id: string
  question: string
  student_name: string
  category: string
  answer: string | null
  is_published: boolean
  asked_at: string
  answered_at: string | null
}

export default function SupervisorFiqhPage() {
  const [questions, setQuestions] = useState<FiqhQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('unanswered')

  useEffect(() => { fetchQuestions() }, [filter])

  async function fetchQuestions() {
    setLoading(true)
    try {
      const res = await fetch(`/api/academy/fiqh?filter=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setQuestions(data.questions || [])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const answered   = questions.filter(q => q.answer !== null).length
  const unanswered = questions.filter(q => q.answer === null).length
  const published  = questions.filter(q => q.is_published).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            الأسئلة الفقهية
          </h1>
          <p className="text-sm text-muted-foreground mt-1">مراجعة الأسئلة الواردة والإجابة عليها</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="unanswered">غير مُجابة</option>
            <option value="answered">مُجابة</option>
            <option value="all">الكل</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'غير مُجابة', value: unanswered, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'مُجابة',     value: answered,   color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'منشورة',    value: published,  color: 'text-primary' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">لا توجد أسئلة</h3>
          <p className="text-sm text-muted-foreground mt-1">لا توجد أسئلة بهذا الفلتر</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <Link
              key={q.id}
              href={`/academy/supervisor/fiqh/${q.id}`}
              className="flex items-start justify-between gap-4 bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {q.question}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {q.student_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(q.asked_at).toLocaleDateString('ar-EG')}
                  </span>
                  <span className="px-2 py-0.5 bg-muted rounded-full font-medium">{q.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                {q.answer !== null ? (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    مُجاب
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    ينتظر
                  </span>
                )}
                <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
