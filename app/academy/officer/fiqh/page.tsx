'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Loader2, Clock, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface Q {
  id: string
  title: string | null
  question: string
  answer: string | null
  status: string
  publish_consent: string
  is_anonymous: boolean
  asked_at: string
  answered_at: string | null
  category_name_ar: string | null
  asker_name: string | null
}

const STATUS_LABELS: Record<string, { ar: string; cls: string }> = {
  pending: { ar: 'في الانتظار', cls: 'bg-amber-100 text-amber-700' },
  assigned: { ar: 'جديد - بحاجة للإجابة', cls: 'bg-blue-100 text-blue-700' },
  in_progress: { ar: 'محادثة جارية', cls: 'bg-blue-100 text-blue-700' },
  awaiting_consent: { ar: 'بانتظار موافقة السائل', cls: 'bg-purple-100 text-purple-700' },
  published: { ar: 'منشور', cls: 'bg-emerald-100 text-emerald-700' },
  closed: { ar: 'مغلق', cls: 'bg-slate-100 text-slate-700' },
}

export default function OfficerFiqhInbox() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight
  const [questions, setQuestions] = useState<Q[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/academy/fiqh?view=inbox')
        const data = await res.json()
        if (res.ok) setQuestions(data.questions || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          {isAr ? 'الأسئلة الفقهية' : 'Fiqh Questions'}
        </div>
        <h1 className="text-3xl font-black">
          {isAr ? 'الأسئلة المُسندة إليّ' : 'Questions assigned to me'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isAr
            ? 'هنا تظهر الأسئلة الفقهية المُسندة إليك للإجابة عليها.'
            : 'Questions assigned to you appear here for review and answering.'}
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground space-y-3">
            <AlertCircle className="w-10 h-10 mx-auto opacity-60" />
            <p>{isAr ? 'لا توجد أسئلة مُسندة إليك حالياً.' : 'No questions assigned to you.'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => {
            const status = STATUS_LABELS[q.status] || { ar: q.status, cls: 'bg-slate-100 text-slate-700' }
            const isUnanswered = !q.answer
            return (
              <Link key={q.id} href={`/academy/officer/fiqh/${q.id}`}>
                <Card className={`rounded-2xl transition-colors ${isUnanswered ? 'border-primary/40 bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/30'}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {q.category_name_ar && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                              {q.category_name_ar}
                            </span>
                          )}
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${status.cls}`}>
                            {status.ar}
                          </span>
                          {q.is_anonymous && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {isAr ? 'مجهول' : 'Anonymous'}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg">
                          {q.title || q.question.slice(0, 80) + (q.question.length > 80 ? '…' : '')}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{q.question}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(q.asked_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                          {q.asker_name && (
                            <span>• {isAr ? `السائل: ${q.asker_name}` : `Asker: ${q.asker_name}`}</span>
                          )}
                        </div>
                      </div>
                      <ChevronIcon className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
