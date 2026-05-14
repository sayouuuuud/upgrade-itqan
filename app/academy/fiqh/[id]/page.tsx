'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Library, Loader2, CheckCircle2, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface Q {
  id: string
  title: string | null
  question: string
  answer: string | null
  category_name_ar: string | null
  is_anonymous: boolean
  is_published: boolean
  status: string
  asker_name: string | null
  officer_name: string | null
  asked_at: string
  answered_at: string | null
  published_at: string | null
  views_count: number
}

export default function PublicFiqhDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight

  const [question, setQuestion] = useState<Q | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/academy/fiqh/${id}?public=1`)
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'لا يمكن عرض السؤال')
        } else {
          setQuestion(data.question)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (error || !question) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            {error || (isAr ? 'لم يُعثر على السؤال.' : 'Not found.')}
            <div className="mt-4">
              <Link href="/academy/fiqh" className="text-primary hover:underline">
                {isAr ? 'العودة للمكتبة' : 'Back to library'}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      <Link href="/academy/fiqh" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ChevronIcon className="w-4 h-4" />
        <Library className="w-4 h-4 mx-1" />
        {isAr ? 'المكتبة العامة' : 'Public library'}
      </Link>

      <Card className="rounded-3xl">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {question.category_name_ar && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                {question.category_name_ar}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
              <Eye className="w-3 h-3" /> {question.views_count}
            </span>
          </div>
          {question.title && <h1 className="text-3xl font-black">{question.title}</h1>}
          <div className="text-sm text-muted-foreground">
            {isAr ? 'السائل:' : 'Asked by:'}{' '}
            <span className="font-bold text-foreground">
              {question.is_anonymous ? (isAr ? 'مجهول' : 'Anonymous') : question.asker_name || '—'}
            </span>
            {question.officer_name && (
              <span className="ms-3">
                {isAr ? 'المسؤول:' : 'Officer:'}{' '}
                <span className="font-bold text-foreground">{question.officer_name}</span>
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap leading-loose mt-2 text-lg">{question.question}</p>
        </CardContent>
      </Card>

      {question.answer && (
        <Card className="rounded-3xl border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-5 h-5" />
              {isAr ? 'الإجابة الرسمية' : 'Official answer'}
            </div>
            <p className="whitespace-pre-wrap leading-loose">{question.answer}</p>
            {question.answered_at && (
              <div className="text-xs text-muted-foreground">
                {new Date(question.answered_at).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
