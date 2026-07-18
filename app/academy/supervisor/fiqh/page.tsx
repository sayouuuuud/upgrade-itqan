"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { HelpCircle, Clock, User, Filter, Eye, CheckCircle, Loader2, MessageSquare, AlertCircle, Sparkles } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

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
  const { t } = useI18n()
  const academy = (t as any).academy as Record<string, string> | undefined
  const a = t.admin
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
    <div className="space-y-8 max-w-5xl mx-auto relative min-h-screen" dir="rtl">
      
      {/* Decorative Background */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full filter blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-rose-500/5 rounded-full filter blur-[100px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="bg-card/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] p-8 shadow-2xl shadow-black/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-primary/20 to-rose-500/20 flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shrink-0">
              <HelpCircle className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2 flex items-center gap-3">
{a.svfFiqhTitle}
                <Sparkles className="w-6 h-6 text-amber-500" />
              </h1>
              <p className="text-muted-foreground font-medium max-w-lg">
                {a.svfFiqhDesc}
              </p>
            </div>
          </div>
          
          <div className="w-full md:w-auto mt-4 md:mt-0 flex items-center gap-2 bg-muted/40 backdrop-blur-sm p-2 rounded-2xl border border-white/10 shadow-inner">
            <Filter className="w-4 h-4 text-muted-foreground mr-2" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-foreground focus:outline-none focus:ring-0 cursor-pointer pr-8"
            >
              <option value="unanswered">{a.svfUnansweredFilter}</option>
              <option value="answered">{a.svfAnsweredFilter}</option>
              <option value="all">{a.svfAllFilter}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid (Bento Style) */}
      <div className="grid grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
        {[
    { label: a.svfAwaitingAnswer, value: unanswered, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: a.svfAnswered,     value: answered,   color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: a.svfPublishedPublic,    value: published,  color: 'text-primary', bg: 'bg-primary/10' },
        ].map(stat => (
          <div key={stat.label} className="group bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[32px] p-6 hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 overflow-hidden relative shadow-lg shadow-black/5 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-50 pointer-events-none" />
            <div className={`absolute top-0 left-0 w-32 h-32 bg-gradient-to-br ${stat.bg} opacity-50 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700`} />
            
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              <p className={`text-5xl font-black tracking-tight drop-shadow-sm ${stat.color}`}>{stat.value}</p>
              <p className="text-xs font-bold text-muted-foreground mt-3 uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* List Area */}
      <div className="bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[40px] overflow-hidden shadow-xl shadow-black/5 relative min-h-[400px]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
        
        <div className="p-6 border-b border-white/10 dark:border-white/5 bg-white/5 dark:bg-black/5 relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner border border-primary/20">
                    <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-black text-xl text-foreground">{a.svfFiqhInbox}</h3>
            </div>
            <span className="text-sm font-bold text-muted-foreground bg-muted/50 px-4 py-1.5 rounded-lg border border-border">
                {questions.length} {a.svfQuestionsUnit}
            </span>
        </div>

        <div className="p-6 relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
              <p className="text-sm font-bold text-muted-foreground animate-pulse">{a.svfLoadingInbox}</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-500/20">
                <CheckCircle className="w-10 h-10 text-emerald-500 opacity-80" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-2">{a.svfEmptyInbox}</h3>
              <p className="text-muted-foreground font-medium">{a.svfNoMatchingQuestions}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {questions.map(q => (
                <Link
                  key={q.id}
                  href={`/academy/supervisor/fiqh/${q.id}`}
                  className="group bg-white/40 dark:bg-black/20 hover:bg-card border border-white/20 dark:border-white/5 rounded-[24px] p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden flex flex-col md:flex-row items-center gap-6"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/[0.02] to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                  
                  <div className="flex-1 min-w-0 text-center md:text-right relative z-10 w-full">
                    <p className="font-black text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-relaxed mb-4">
                      {q.question}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
                      <span className="flex items-center gap-1.5 font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border shadow-sm">
                        <User className="w-4 h-4 opacity-70" />
                        {q.student_name}
                      </span>
                      <span className="flex items-center gap-1.5 font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border shadow-sm">
                        <Clock className="w-4 h-4 opacity-70" />
                        {new Date(q.asked_at).toLocaleDateString('ar-EG')}
                      </span>
                      <span className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg font-black shadow-sm">
                        {q.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-3 shrink-0 relative z-10 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-border">
                    {q.answer !== null ? (
                      <span className="w-full text-center px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                        {a.svfAnsweredLabel}
                      </span>
                    ) : (
                      <span className="w-full text-center flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-sm">
                        <AlertCircle className="w-3.5 h-3.5" /> {a.svfPendingLabel}
                      </span>
                    )}
                    <span className="w-full text-center px-6 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all font-bold text-sm shadow-sm flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" /> {a.svfViewQuestion}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
