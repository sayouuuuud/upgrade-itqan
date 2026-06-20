'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Clock,
  User,
  Eye,
  Loader2,
  Search,
  CheckCircle2,
  ShieldCheck,
  Archive,
  Filter,
  ArrowUpRight,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  title: string | null
  question: string
  answer: string | null
  status: string
  publish_consent: string
  is_published: boolean
  is_anonymous: boolean
  views_count: number
  asked_at: string
  answered_at: string | null
  published_at: string | null
  asker_name: string | null
  assigned_to: string | null
  assigned_to_name: string | null
  answered_by_name: string | null
  category_name_ar: string | null
  category_slug: string | null
}

type Tab = 'open' | 'awaiting' | 'published' | 'closed'

const TABS: { id: Tab; label: string; bucket: string; icon: any; color: string }[] = [
  { id: 'open', label: 'تنتظر الرد', bucket: 'open', icon: Clock, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { id: 'awaiting', label: 'بانتظار موافقة السائل', bucket: 'awaiting_consent', icon: User, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  { id: 'published', label: 'منشورة', bucket: 'published', icon: Eye, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'closed', label: 'مغلقة', bucket: 'closed', icon: Archive, color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' },
]

export default function FiqhSupervisorInboxPage() {
  const [tab, setTab] = useState<Tab>('open')
  const [questions, setQuestions] = useState<Question[]>([])
  const [counts, setCounts] = useState<Record<Tab, number>>({
    open: 0,
    awaiting: 0,
    published: 0,
    closed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const activeBucket = useMemo(
    () => TABS.find((t) => t.id === tab)?.bucket || '',
    [tab]
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const sp = new URLSearchParams({ view: 'inbox', status: activeBucket })
      if (searchDebounced) sp.set('q', searchDebounced)
      const res = await fetch(`/api/academy/fiqh?${sp.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setQuestions(data.questions || [])
        if (data.counts) {
          setCounts({
            open: data.counts.open ?? 0,
            awaiting: data.counts.awaiting_consent ?? 0,
            published: data.counts.published ?? 0,
            closed: data.counts.closed ?? 0,
          })
        }
      } else {
        setQuestions([])
      }
    } finally {
      setLoading(false)
    }
  }, [activeBucket, searchDebounced])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-8 max-w-6xl mx-auto relative min-h-screen" dir="rtl">
      
      {/* Decorative Background */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full filter blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full filter blur-[100px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="bg-card/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] p-8 shadow-2xl shadow-black/5 relative overflow-hidden group flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <h1 className="text-3xl md:text-4xl font-black text-foreground flex items-center gap-4 tracking-tight">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center border border-primary/20 shadow-inner">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            صندوق الأسئلة الفقهية
          </h1>
          <p className="text-muted-foreground/80 font-medium max-w-xl text-lg pr-2">
            {counts.open > 0
              ? `لديك ${counts.open} سؤال ينتظر مراجعتك واجابتك.`
              : 'صندوق الوارد نظيف، لا توجد أسئلة جديدة في انتظارك حالياً.'}
          </p>
        </div>
        
        <Link
          href="/academy/fiqh"
          className="relative z-10 shrink-0 inline-flex items-center justify-center gap-2 px-8 py-4 bg-muted/50 hover:bg-card border-2 border-border hover:border-primary/30 text-foreground font-black text-sm uppercase tracking-widest rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group/btn"
        >
          <BookOpen className="w-5 h-5 text-primary group-hover/btn:scale-110 transition-transform" />
          المكتبة العامة
        </Link>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/60 backdrop-blur-xl p-4 rounded-[32px] border border-white/20 dark:border-white/5 shadow-lg shadow-black/5">
        
        {/* Custom Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar w-full lg:w-auto">
          {TABS.map((t) => {
            const active = tab === t.id
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative shrink-0 px-6 py-3 rounded-2xl text-sm font-black transition-all duration-300 flex items-center gap-3 group overflow-hidden',
                  active
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-100'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground scale-95 hover:scale-100'
                )}
              >
                {active && <div className="absolute inset-0 bg-white/20 dark:bg-white/10 animate-pulse-slow" />}
                <Icon className={cn("w-4 h-4 relative z-10 transition-transform group-hover:scale-110", active ? "text-primary-foreground" : "text-muted-foreground")} />
                <span className="relative z-10 whitespace-nowrap">{t.label}</span>
                <span
                  className={cn(
                    'relative z-10 text-[11px] px-2 py-0.5 rounded-lg font-black transition-colors',
                    active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground border border-border'
                  )}
                >
                  {counts[t.id]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-80 shrink-0">
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="ابحث في الأسئلة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-12 py-3.5 bg-background border-2 border-border hover:border-primary/30 focus:border-primary rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* List Container */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="p-4 bg-card rounded-2xl border shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <p className="text-sm font-bold text-muted-foreground animate-pulse">جاري تحميل الأسئلة...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-card/40 backdrop-blur-md border-2 border-dashed border-border rounded-[40px] p-24 text-center shadow-none flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in-95 duration-500">
            {tab === 'open' ? (
              <>
                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-2">لا توجد أسئلة في انتظارك</h3>
                <p className="text-muted-foreground font-bold max-w-sm mx-auto">
                  لقد أنجزت كل عملك! ستظهر هنا الأسئلة الجديدة المسندة إليك فور إضافتها.
                </p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-border">
                  <Archive className="w-10 h-10 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-2">الصندوق فارغ</h3>
                <p className="text-muted-foreground font-bold max-w-sm mx-auto">لا توجد أسئلة تطابق التصنيف الحالي.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {questions.map((q) => (
              <Link
                key={q.id}
                href={`/academy/fiqh-supervisor/questions/${q.id}`}
                className="group flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[32px] p-6 sm:p-8 hover:bg-card/80 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Decorative hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/[0.03] to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                
                <div className="flex-1 min-w-0 space-y-4 relative z-10">
                  <div className="flex items-center gap-3 flex-wrap">
                    {q.category_name_ar && (
                      <span className="text-xs px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-black border border-primary/20 shadow-sm uppercase tracking-widest">
                        {q.category_name_ar}
                      </span>
                    )}
                    <StatusPill status={q.status} />
                  </div>
                  
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-tight mb-2">
                      {q.title || (q.question.length > 80 ? q.question.slice(0, 80) + '...' : q.question)}
                    </h3>
                    <p className="text-base text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                      {q.question}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
                      <User className="w-3.5 h-3.5" />
                      {q.is_anonymous ? 'سائل مجهول' : q.asker_name || '—'}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(q.asked_at).toLocaleDateString('ar-EG', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    {q.is_published && (
                      <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <Eye className="w-3.5 h-3.5" />
                        {q.views_count || 0} مشاهدة
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side CTA */}
                <div className="shrink-0 flex items-center justify-end relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-muted group-hover:bg-primary group-hover:text-primary-foreground text-muted-foreground flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-inner group-hover:shadow-primary/30">
                    <ArrowUpRight className="w-5 h-5 -rotate-45" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const labels: Record<string, { ar: string; tone: string }> = {
    pending: { ar: 'في الانتظار', tone: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30' },
    assigned: { ar: 'مُسند إليك', tone: 'bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30' },
    in_progress: {
      ar: 'قيد العمل',
      tone: 'bg-indigo-100 text-indigo-900 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30',
    },
    awaiting_consent: {
      ar: 'بانتظار الموافقة',
      tone: 'bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
    },
    published: {
      ar: 'منشور',
      tone: 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
    },
    declined: { ar: 'رفض النشر', tone: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30' },
    closed: { ar: 'مغلق', tone: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30' },
  }
  const l = labels[status] || { ar: status, tone: 'bg-muted text-muted-foreground border-border' }
  return (
    <span
      className={cn(
        'text-xs px-3 py-1.5 rounded-xl border font-black uppercase tracking-widest',
        l.tone
      )}
    >
      {l.ar}
    </span>
  )
}
