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

const TABS: { id: Tab; label: string; bucket: string }[] = [
  { id: 'open', label: 'تنتظر الرد', bucket: 'open' },
  { id: 'awaiting', label: 'بانتظار موافقة السائل', bucket: 'awaiting_consent' },
  { id: 'published', label: 'منشورة', bucket: 'published' },
  { id: 'closed', label: 'مغلقة', bucket: 'closed' },
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
    <div className="space-y-6 max-w-5xl" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            صندوق الأسئلة الفقهية
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {counts.open > 0
              ? `${counts.open} سؤال ينتظر إجابتك`
              : 'لا توجد أسئلة جديدة'}
          </p>
        </div>
        <Link
          href="/academy/fiqh"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          عرض المكتبة العامة ↗
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'px-4 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px whitespace-nowrap inline-flex items-center gap-2',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                    active ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  {counts[t.id]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="ابحث في الأسئلة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          {tab === 'open' ? (
            <>
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-base font-bold">لا توجد أسئلة في انتظارك</h3>
              <p className="text-sm text-muted-foreground mt-1">
                ستظهر هنا الأسئلة الجديدة المسندة إليك
              </p>
            </>
          ) : (
            <>
              <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base font-bold">لا توجد أسئلة</h3>
              <p className="text-sm text-muted-foreground mt-1">لا توجد عناصر في هذا التبويب</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {questions.map((q) => (
            <Link
              key={q.id}
              href={`/academy/fiqh-supervisor/questions/${q.id}`}
              className="block bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {q.category_name_ar && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                        {q.category_name_ar}
                      </span>
                    )}
                    <StatusPill status={q.status} />
                  </div>
                  <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-relaxed">
                    {q.title || q.question.slice(0, 100) + (q.question.length > 100 ? '…' : '')}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {q.question}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {q.is_anonymous ? 'سائل مجهول' : q.asker_name || '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(q.asked_at).toLocaleDateString('ar-EG')}
                    </span>
                    {q.is_published && (
                      <span className="flex items-center gap-1 text-emerald-700">
                        <Eye className="w-3 h-3" />
                        {q.views_count || 0}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const labels: Record<string, { ar: string; tone: string }> = {
    pending: { ar: 'في الانتظار', tone: 'bg-amber-100 text-amber-900 border-amber-200' },
    assigned: { ar: 'مُسند إليك', tone: 'bg-sky-100 text-sky-900 border-sky-200' },
    in_progress: {
      ar: 'قيد العمل',
      tone: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    },
    awaiting_consent: {
      ar: 'بانتظار الموافقة',
      tone: 'bg-orange-100 text-orange-900 border-orange-200',
    },
    published: {
      ar: 'منشور',
      tone: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    },
    declined: { ar: 'رفض النشر', tone: 'bg-slate-100 text-slate-700 border-slate-200' },
    closed: { ar: 'مغلق', tone: 'bg-slate-100 text-slate-700 border-slate-200' },
  }
  const l = labels[status] || { ar: status, tone: 'bg-muted text-muted-foreground border-border' }
  return (
    <span
      className={cn(
        'text-[11px] px-2 py-0.5 rounded-full border font-semibold',
        l.tone
      )}
    >
      {l.ar}
    </span>
  )
}
