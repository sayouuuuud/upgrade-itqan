"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { HelpCircle, Clock, User, Filter, Eye, CheckCircle, Loader2, Search } from 'lucide-react'

interface FiqhQuestion {
  id: string
  question: string
  student_name: string
  category: string
  answer: string | null
  is_published: boolean
  asked_at: string
}

export default function FiqhSupervisorQuestionsPage() {
  const [questions, setQuestions] = useState<FiqhQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('unanswered')
  const [search, setSearch] = useState('')

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

  const filtered = search.trim()
    ? questions.filter(q =>
        q.question.includes(search) ||
        q.student_name.includes(search) ||
        q.category.includes(search)
      )
    : questions

  const unansweredCount = questions.filter(q => q.answer === null).length

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          الأسئلة والإجابات
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {unansweredCount > 0
            ? `${unansweredCount} سؤال ينتظر إجابتك`
            : 'جميع الأسئلة تمت الإجابة عليها'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث في الأسئلة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-xl p-1 shrink-0">
          {[
            { value: 'unanswered', label: 'تنتظر' },
            { value: 'answered',   label: 'مُجابة' },
            { value: 'all',        label: 'الكل' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                filter === tab.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-base font-bold text-foreground">لا توجد أسئلة</h3>
          <p className="text-sm text-muted-foreground mt-1">لا توجد أسئلة تطابق هذا الفلتر</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(q => (
            <Link
              key={q.id}
              href={`/academy/fiqh-supervisor/questions/${q.id}`}
              className="flex items-start justify-between gap-4 bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-relaxed">
                  {q.question}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-muted-foreground">
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
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                  q.answer !== null
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                }`}>
                  {q.answer !== null ? 'مُجاب' : 'ينتظر'}
                </span>
                <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
