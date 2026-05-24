'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Library,
  Search,
  Loader2,
  BookOpen,
  Eye,
  Plus,
  MessageCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ShieldCheck,
  EyeOff,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
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
  assigned_to_name: string | null
  answered_by_name: string | null
  category_name_ar: string | null
  category_name_en: string | null
  category_slug: string | null
}

interface Category {
  id: string
  slug: string
  name_ar: string
  name_en: string | null
}

type Tab = 'library' | 'mine' | 'ask'

const STATUS_LABELS: Record<string, { ar: string; en: string; tone: string }> = {
  pending: {
    ar: 'في الانتظار',
    en: 'Pending',
    tone: 'bg-amber-100 text-amber-900 border-amber-200',
  },
  assigned: {
    ar: 'تم التعيين',
    en: 'Assigned',
    tone: 'bg-sky-100 text-sky-900 border-sky-200',
  },
  in_progress: {
    ar: 'قيد المراجعة',
    en: 'In review',
    tone: 'bg-indigo-100 text-indigo-900 border-indigo-200',
  },
  answered: {
    ar: 'تمت الإجابة',
    en: 'Answered',
    tone: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  },
  awaiting_consent: {
    ar: 'في انتظار موافقتك',
    en: 'Awaiting your consent',
    tone: 'bg-orange-100 text-orange-900 border-orange-200',
  },
  published: {
    ar: 'منشور في المكتبة',
    en: 'Published',
    tone: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  },
  declined: {
    ar: 'رفضت النشر',
    en: 'Publication declined',
    tone: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  closed: {
    ar: 'مغلق',
    en: 'Closed',
    tone: 'bg-slate-100 text-slate-700 border-slate-200',
  },
}

function StatusBadge({ status, isAr }: { status: string; isAr: boolean }) {
  const meta = STATUS_LABELS[status] || {
    ar: status,
    en: status,
    tone: 'bg-muted text-muted-foreground border-border',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-semibold',
        meta.tone
      )}
    >
      {isAr ? meta.ar : meta.en}
    </span>
  )
}

export default function FiqhLibraryPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const sp = useSearchParams()
  const initialTab = (sp?.get('tab') as Tab) || 'library'
  const [tab, setTab] = useState<Tab>(
    initialTab === 'mine' || initialTab === 'ask' || initialTab === 'library'
      ? initialTab
      : 'library'
  )
  const [me, setMe] = useState<{ id: string; name: string; role: string } | null>(null)

  // Library data
  const [library, setLibrary] = useState<Question[]>([])
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingLib, setLoadingLib] = useState(true)

  // My questions
  const [mine, setMine] = useState<Question[]>([])
  const [loadingMine, setLoadingMine] = useState(false)
  const [mineError, setMineError] = useState<string | null>(null)

  // Ask form
  const [askCategory, setAskCategory] = useState<string>('')
  const [askTitle, setAskTitle] = useState('')
  const [askBody, setAskBody] = useState('')
  const [askAnonymous, setAskAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  // Bootstrap: categories + me
  useEffect(() => {
    fetch('/api/academy/fiqh/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {})
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) {
          setMe({
            id: d.user.id,
            name: d.user.name,
            role: d.user.role,
          })
        }
      })
      .catch(() => {})
  }, [])

  // Load library when filters change
  const loadLibrary = useCallback(async () => {
    setLoadingLib(true)
    try {
      const params = new URLSearchParams({ view: 'library' })
      if (activeCat) params.set('category', activeCat)
      if (searchDebounced) params.set('q', searchDebounced)
      const res = await fetch(`/api/academy/fiqh?${params.toString()}`)
      const data = await res.json()
      if (res.ok) setLibrary(data.questions || [])
      else setLibrary([])
    } finally {
      setLoadingLib(false)
    }
  }, [activeCat, searchDebounced])

  useEffect(() => {
    if (tab === 'library') loadLibrary()
  }, [tab, loadLibrary])

  // Load my questions
  const loadMine = useCallback(async () => {
    setLoadingMine(true)
    setMineError(null)
    try {
      const res = await fetch('/api/academy/fiqh?view=mine')
      const data = await res.json()
      if (res.ok) setMine(data.questions || [])
      else {
        setMineError(data.error || (isAr ? 'تعذّر التحميل' : 'Failed to load'))
        setMine([])
      }
    } catch {
      setMineError(isAr ? 'تعذّر التحميل' : 'Failed to load')
    } finally {
      setLoadingMine(false)
    }
  }, [isAr])

  useEffect(() => {
    if (tab === 'mine' && me) loadMine()
  }, [tab, me, loadMine])

  // Submit a new question
  async function submit() {
    if (!me) {
      window.location.href = '/login?next=/academy/fiqh'
      return
    }
    setSubmitError(null)
    setSubmitSuccess(null)

    if (!askCategory) {
      setSubmitError(isAr ? 'اختر تصنيف السؤال' : 'Please pick a category')
      return
    }
    if (askBody.trim().length < 10) {
      setSubmitError(
        isAr
          ? 'اكتب سؤالك بوضوح (10 أحرف على الأقل)'
          : 'Write your question more clearly (10 chars minimum)'
      )
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/academy/fiqh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: askCategory,
          title: askTitle.trim() || undefined,
          question: askBody.trim(),
          isAnonymous: askAnonymous,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSubmitError(data?.error || (isAr ? 'تعذّر الإرسال' : 'Submission failed'))
        return
      }
      setSubmitSuccess(
        isAr
          ? 'تم إرسال سؤالك بنجاح. سيتم إبلاغك عند ورود الإجابة.'
          : 'Question submitted. We will notify you when it is answered.'
      )
      setAskTitle('')
      setAskBody('')
      setAskAnonymous(false)
      setAskCategory('')
      // Refresh mine in the background so the new question shows up if they switch tabs.
      loadMine()
    } finally {
      setSubmitting(false)
    }
  }

  async function respondConsent(id: string, decision: 'grant' | 'deny', anonymous?: boolean) {
    const res = await fetch(`/api/academy/fiqh/${id}/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, anonymous }),
    })
    if (res.ok) loadMine()
  }

  const TABS: { id: Tab; ar: string; en: string; icon: React.ComponentType<any>; visible: boolean }[] =
    useMemo(
      () => [
        { id: 'library', ar: 'المكتبة', en: 'Library', icon: Library, visible: true },
        { id: 'mine', ar: 'أسئلتي', en: 'My questions', icon: MessageCircle, visible: !!me },
        { id: 'ask', ar: 'اطرح سؤالاً', en: 'Ask a question', icon: Plus, visible: true },
      ],
      [me]
    )

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-bl from-primary/5 via-card to-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              {isAr ? 'مكتبة الفتاوى' : 'Fiqh Library'}
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              {isAr ? 'المكتبة الفقهية' : 'Fiqh Q&A Library'}
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {isAr
                ? 'تصفّح أسئلة فقهية أجاب عنها المسؤولون المتخصصون ووافق أصحابها على نشرها، أو اطرح سؤالك وسيصل إلى مسؤول مختص في التصنيف.'
                : 'Browse questions answered by specialized supervisors and published with the asker’s consent, or submit your own and it will reach a specialist.'}
            </p>
          </div>
          <Button
            onClick={() => setTab('ask')}
            size="lg"
            className="self-start md:self-end shrink-0"
          >
            <Plus className="w-4 h-4 me-2" />
            {isAr ? 'اطرح سؤالاً' : 'Ask a question'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.filter((t) => t.visible).map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {isAr ? t.ar : t.en}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab contents */}
      {tab === 'library' && (
        <LibraryTab
          isAr={isAr}
          loading={loadingLib}
          questions={library}
          categories={categories}
          activeCat={activeCat}
          onCategory={setActiveCat}
          search={search}
          onSearch={setSearch}
        />
      )}

      {tab === 'mine' && me && (
        <MineTab
          isAr={isAr}
          loading={loadingMine}
          questions={mine}
          error={mineError}
          onConsent={respondConsent}
        />
      )}

      {tab === 'mine' && !me && (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center space-y-3">
            <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              {isAr ? 'سجّل الدخول لعرض أسئلتك.' : 'Sign in to view your questions.'}
            </p>
            <Button asChild>
              <Link href="/login?next=/academy/fiqh">
                {isAr ? 'تسجيل الدخول' : 'Sign in'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === 'ask' && (
        <AskTab
          isAr={isAr}
          categories={categories}
          askCategory={askCategory}
          setAskCategory={setAskCategory}
          askTitle={askTitle}
          setAskTitle={setAskTitle}
          askBody={askBody}
          setAskBody={setAskBody}
          askAnonymous={askAnonymous}
          setAskAnonymous={setAskAnonymous}
          submitting={submitting}
          submitError={submitError}
          submitSuccess={submitSuccess}
          onSubmit={submit}
          isLoggedIn={!!me}
        />
      )}
    </div>
  )
}

function LibraryTab({
  isAr,
  loading,
  questions,
  categories,
  activeCat,
  onCategory,
  search,
  onSearch,
}: {
  isAr: boolean
  loading: boolean
  questions: Question[]
  categories: Category[]
  activeCat: string | null
  onCategory: (slug: string | null) => void
  search: string
  onSearch: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4 start-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={isAr ? 'ابحث في المكتبة...' : 'Search the library...'}
            className="ps-10"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <CategoryChip
          active={activeCat === null}
          label={isAr ? 'الكل' : 'All'}
          onClick={() => onCategory(null)}
        />
        {categories.map((c) => (
          <CategoryChip
            key={c.id}
            active={activeCat === c.slug}
            label={isAr ? c.name_ar : c.name_en || c.name_ar}
            onClick={() => onCategory(c.slug)}
          />
        ))}
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground space-y-2">
            <BookOpen className="w-10 h-10 mx-auto opacity-60" />
            <p>
              {search || activeCat
                ? isAr
                  ? 'لا توجد نتائج مطابقة. جرّب تعديل البحث أو التصنيف.'
                  : 'No matching results. Try a different search or filter.'
                : isAr
                ? 'المكتبة فارغة بعد. كن أول من يسأل!'
                : 'Library is empty. Be the first to ask!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {questions.map((q) => (
            <Link key={q.id} href={`/academy/fiqh/${q.id}`} className="block group">
              <Card className="rounded-2xl hover:shadow-md hover:border-primary/40 transition-all h-full">
                <CardContent className="p-5 space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {q.category_name_ar && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                        {isAr ? q.category_name_ar : q.category_name_en || q.category_name_ar}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {q.title || q.question.slice(0, 80) + (q.question.length > 80 ? '…' : '')}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {q.question}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                    <div className="truncate">
                      {q.answered_by_name && (
                        <span>
                          {isAr ? 'أجاب: ' : 'Answered by '}
                          <span className="font-semibold text-foreground">
                            {q.answered_by_name}
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Eye className="w-3 h-3" />
                      {q.views_count || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-xs px-3 py-1.5 rounded-full font-bold border transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card border-border hover:bg-muted'
      )}
    >
      {label}
    </button>
  )
}

function MineTab({
  isAr,
  loading,
  questions,
  error,
  onConsent,
}: {
  isAr: boolean
  loading: boolean
  questions: Question[]
  error: string | null
  onConsent: (id: string, decision: 'grant' | 'deny', anonymous?: boolean) => void
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }
  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-destructive">{error}</CardContent>
      </Card>
    )
  }
  if (!questions.length) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground space-y-3">
          <MessageCircle className="w-10 h-10 mx-auto opacity-60" />
          <p>
            {isAr
              ? 'لم تطرح أي سؤال بعد. ابدأ من تبويب "اطرح سؤالاً".'
              : 'You have not asked anything yet. Use the "Ask" tab to get started.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {questions.map((q) => {
        const isAwaiting = q.status === 'awaiting_consent'
        return (
          <Card key={q.id} className="rounded-2xl">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {q.category_name_ar && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                        {isAr ? q.category_name_ar : q.category_name_en || q.category_name_ar}
                      </span>
                    )}
                    <StatusBadge status={q.status} isAr={isAr} />
                    {q.is_anonymous && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                        <EyeOff className="w-3 h-3" />
                        {isAr ? 'مجهول' : 'Anonymous'}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/academy/fiqh/${q.id}`}
                    className="font-bold text-lg hover:text-primary transition-colors block"
                  >
                    {q.title || q.question.slice(0, 100) + (q.question.length > 100 ? '…' : '')}
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {q.question}
                  </p>
                </div>
                <div className="text-[11px] text-muted-foreground shrink-0">
                  {new Date(q.asked_at).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>

              {q.answer && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm leading-relaxed">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isAr ? 'الإجابة' : 'Answer'}
                    {q.answered_by_name && (
                      <span className="text-muted-foreground font-normal">
                        — {q.answered_by_name}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-4 text-foreground/80">{q.answer}</p>
                </div>
              )}

              {isAwaiting && (
                <ConsentBox
                  isAr={isAr}
                  defaultAnonymous={q.is_anonymous}
                  onGrant={(anon) => onConsent(q.id, 'grant', anon)}
                  onDeny={() => onConsent(q.id, 'deny')}
                />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function ConsentBox({
  isAr,
  defaultAnonymous,
  onGrant,
  onDeny,
}: {
  isAr: boolean
  defaultAnonymous: boolean
  onGrant: (anonymous: boolean) => void
  onDeny: () => void
}) {
  const [anon, setAnon] = useState(defaultAnonymous)
  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg p-3 space-y-2.5">
      <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold text-sm">
        <Clock className="w-4 h-4" />
        {isAr ? 'هل توافق على نشر السؤال والإجابة في المكتبة العامة؟' : 'Allow publication?'}
      </div>
      <p className="text-xs text-amber-900/80 dark:text-amber-100/80 leading-relaxed">
        {isAr
          ? 'موافقتك تجعل السؤال والإجابة مرئيين للجميع لينتفع بهما الآخرون. يمكنك اختيار النشر بدون اسمك.'
          : 'Your consent makes the Q&A visible to everyone. You can choose to publish anonymously.'}
      </p>
      <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
        <input
          type="checkbox"
          checked={anon}
          onChange={(e) => setAnon(e.target.checked)}
          className="rounded"
        />
        <span>{isAr ? 'انشر باسم "سائل مجهول"' : 'Publish anonymously'}</span>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onGrant(anon)}>
          <CheckCircle2 className="w-4 h-4 me-1.5" />
          {isAr ? 'موافق، انشر' : 'Yes, publish'}
        </Button>
        <Button size="sm" variant="outline" onClick={onDeny}>
          <XCircle className="w-4 h-4 me-1.5" />
          {isAr ? 'لا، احتفظ بسؤالي خاصاً' : 'No, keep private'}
        </Button>
      </div>
    </div>
  )
}

function AskTab({
  isAr,
  categories,
  askCategory,
  setAskCategory,
  askTitle,
  setAskTitle,
  askBody,
  setAskBody,
  askAnonymous,
  setAskAnonymous,
  submitting,
  submitError,
  submitSuccess,
  onSubmit,
  isLoggedIn,
}: {
  isAr: boolean
  categories: Category[]
  askCategory: string
  setAskCategory: (v: string) => void
  askTitle: string
  setAskTitle: (v: string) => void
  askBody: string
  setAskBody: (v: string) => void
  askAnonymous: boolean
  setAskAnonymous: (v: boolean) => void
  submitting: boolean
  submitError: string | null
  submitSuccess: string | null
  onSubmit: () => void
  isLoggedIn: boolean
}) {
  if (!isLoggedIn) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-10 text-center space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">
            {isAr
              ? 'سجّل الدخول لتطرح سؤالك على مسؤول مختص.'
              : 'Sign in to ask a specialist your fiqh question.'}
          </p>
          <Button asChild>
            <Link href="/login?next=/academy/fiqh">
              {isAr ? 'تسجيل الدخول' : 'Sign in'}
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5 md:p-6 space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-xl font-black">
            {isAr ? 'اطرح سؤالك الفقهي' : 'Ask a fiqh question'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? 'سيصل سؤالك إلى مسؤول مختص في التصنيف الذي تختاره. ستصلك إجابة مع طلب موافقتك على النشر.'
              : 'Your question will reach a specialist in the chosen category. You will receive an answer plus a consent request before publication.'}
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold">
            {isAr ? 'التصنيف' : 'Category'} <span className="text-destructive">*</span>
          </Label>
          <select
            value={askCategory}
            onChange={(e) => setAskCategory(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">{isAr ? '— اختر تصنيفاً —' : '— Pick a category —'}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {isAr ? c.name_ar : c.name_en || c.name_ar}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold">
            {isAr ? 'عنوان مختصر (اختياري)' : 'Short title (optional)'}
          </Label>
          <Input
            value={askTitle}
            maxLength={240}
            onChange={(e) => setAskTitle(e.target.value)}
            placeholder={
              isAr ? 'مثال: حكم قراءة الفاتحة خلف الإمام' : 'e.g. Reading Al-Fatiha behind the imam'
            }
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold">
            {isAr ? 'السؤال' : 'Question'} <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={askBody}
            onChange={(e) => setAskBody(e.target.value)}
            rows={6}
            placeholder={
              isAr
                ? 'اكتب سؤالك بوضوح. كلما كانت التفاصيل أكثر، كانت الإجابة أدق.'
                : 'Write your question clearly. The more detail, the better.'
            }
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
          <input
            type="checkbox"
            checked={askAnonymous}
            onChange={(e) => setAskAnonymous(e.target.checked)}
            className="rounded"
          />
          <span className="flex items-center gap-1.5">
            <EyeOff className="w-4 h-4 text-muted-foreground" />
            {isAr ? 'إرسال مجهول الهوية' : 'Submit anonymously'}
          </span>
        </label>

        {submitError && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
            {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="text-sm text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-md p-3">
            {submitSuccess}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={submitting} size="lg">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                {isAr ? 'جارٍ الإرسال...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 me-2" />
                {isAr ? 'إرسال السؤال' : 'Submit question'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
