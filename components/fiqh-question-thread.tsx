'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Loader2,
  Send,
  ShieldCheck,
  X,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Library,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface Q {
  id: string
  title: string | null
  question: string
  answer: string | null
  category_id: string | null
  category_slug: string | null
  category_name_ar: string | null
  status: string
  publish_consent: string
  is_anonymous: boolean
  is_published: boolean
  asked_by: string
  assigned_to: string | null
  asker_name: string | null
  officer_name: string | null
  asked_at: string
  answered_at: string | null
}

interface Msg {
  id: string
  sender_id: string
  sender_role: string
  content: string
  is_read: boolean
  created_at: string
  sender_name: string
  sender_avatar: string | null
}

const STATUS_LABELS: Record<string, { ar: string; cls: string }> = {
  pending: { ar: 'في الانتظار', cls: 'bg-amber-100 text-amber-700' },
  assigned: { ar: 'لدى المسؤول', cls: 'bg-blue-100 text-blue-700' },
  in_progress: { ar: 'محادثة جارية', cls: 'bg-blue-100 text-blue-700' },
  awaiting_consent: { ar: 'بحاجة لموافقتك', cls: 'bg-purple-100 text-purple-700' },
  published: { ar: 'منشور', cls: 'bg-emerald-100 text-emerald-700' },
  closed: { ar: 'مغلق', cls: 'bg-slate-100 text-slate-700' },
  declined: { ar: 'مرفوض', cls: 'bg-red-100 text-red-700' },
}

interface Props {
  questionId: string
  /** 'asker' = student/parent/teacher views own question; 'officer' = officer answering */
  perspective: 'asker' | 'officer'
  backHref: string
}

export default function FiqhQuestionThread({ questionId, perspective, backHref }: Props) {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight

  const [question, setQuestion] = useState<Q | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)
  const [composer, setComposer] = useState('')
  const [sending, setSending] = useState(false)

  // Officer answer composer
  const [answerDraft, setAnswerDraft] = useState('')
  const [submittingAnswer, setSubmittingAnswer] = useState(false)

  // Asker consent state
  const [consentAnonymous, setConsentAnonymous] = useState(false)
  const [submittingConsent, setSubmittingConsent] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/academy/fiqh/${questionId}`)
      const data = await res.json()
      if (res.ok) {
        setQuestion(data.question)
        setMessages(data.messages || [])
        if (data.question?.is_anonymous) setConsentAnonymous(true)
      }
    } finally {
      setLoading(false)
    }
  }, [questionId])

  useEffect(() => {
    load()
  }, [load])

  const sendMessage = async () => {
    if (!composer.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/academy/fiqh/${questionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: composer.trim() }),
      })
      if (res.ok) {
        setComposer('')
        await load()
      }
    } finally {
      setSending(false)
    }
  }

  const submitAnswer = async () => {
    if (answerDraft.trim().length < 10) return
    setSubmittingAnswer(true)
    try {
      const res = await fetch(`/api/academy/fiqh/${questionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answerDraft.trim() }),
      })
      if (res.ok) {
        setAnswerDraft('')
        await load()
      }
    } finally {
      setSubmittingAnswer(false)
    }
  }

  const submitConsent = async (decision: 'grant' | 'deny') => {
    setSubmittingConsent(true)
    try {
      const res = await fetch(`/api/academy/fiqh/${questionId}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, anonymous: consentAnonymous }),
      })
      if (res.ok) await load()
    } finally {
      setSubmittingConsent(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!question) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            {isAr ? 'لم يُعثر على السؤال أو لا تملك صلاحية الوصول.' : 'Question not found or no access.'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = STATUS_LABELS[question.status] || { ar: question.status, cls: 'bg-slate-100 text-slate-700' }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ChevronIcon className="w-4 h-4" />
        {isAr ? 'العودة' : 'Back'}
      </Link>

      <Card className="rounded-3xl">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {question.category_name_ar && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                {question.category_name_ar}
              </span>
            )}
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${status.cls}`}>{status.ar}</span>
            {question.is_anonymous && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {isAr ? 'مجهول' : 'Anonymous'}
              </span>
            )}
          </div>
          {question.title && <h1 className="text-2xl font-black">{question.title}</h1>}
          <div className="text-sm text-muted-foreground">
            {isAr ? 'السائل:' : 'Asked by:'}{' '}
            <span className="font-bold text-foreground">
              {question.is_anonymous && perspective === 'asker' ? 'أنت' : question.asker_name || (isAr ? 'مجهول' : 'Anonymous')}
            </span>
            {question.officer_name && (
              <span className="ms-3">
                {isAr ? 'المسؤول:' : 'Officer:'}{' '}
                <span className="font-bold text-foreground">{question.officer_name}</span>
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap leading-loose mt-2">{question.question}</p>
        </CardContent>
      </Card>

      {question.answer && (
        <Card className="rounded-3xl border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-6 space-y-2">
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

      {/* Asker consent UI */}
      {perspective === 'asker' && question.status === 'awaiting_consent' && (
        <Card className="rounded-3xl border-purple-300 bg-purple-50 dark:bg-purple-950/20">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
              {isAr ? 'موافقتك على النشر' : 'Publication consent'}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? 'هل توافق على نشر سؤالك والإجابة في المكتبة العامة لينتفع بها الآخرون؟ يمكنك اختيار النشر باسمك أو بدون اسم.'
                : 'Do you consent to publishing this Q&A in the public library? You can publish anonymously.'}
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={consentAnonymous}
                onCheckedChange={(v) => setConsentAnonymous(!!v)}
              />
              <span className="text-sm">
                {isAr ? 'انشر بدون إظهار اسمي' : 'Publish anonymously'}
              </span>
            </label>
            <div className="flex gap-2">
              <Button
                onClick={() => submitConsent('grant')}
                disabled={submittingConsent}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submittingConsent ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <CheckCircle2 className="w-4 h-4 me-2" />
                    {isAr ? 'أوافق على النشر' : 'I consent'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => submitConsent('deny')}
                disabled={submittingConsent}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <X className="w-4 h-4 me-2" />
                {isAr ? 'لا أوافق' : 'Decline'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Officer answer composer */}
      {perspective === 'officer' && !question.answer && (
        <Card className="rounded-3xl">
          <CardContent className="p-6 space-y-3">
            <div className="font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {isAr ? 'كتابة الإجابة الرسمية' : 'Write official answer'}
            </div>
            <Textarea
              value={answerDraft}
              onChange={(e) => setAnswerDraft(e.target.value)}
              placeholder={isAr ? 'اكتب إجابتك الفقهية المفصلة...' : 'Write your detailed fiqh answer...'}
              rows={6}
            />
            <div className="text-xs text-muted-foreground">
              {isAr
                ? 'بعد الإرسال، سيُطلب من السائل الموافقة على نشر السؤال والإجابة في المكتبة العامة.'
                : 'After submitting, the asker will be asked for publish consent.'}
            </div>
            <Button onClick={submitAnswer} disabled={submittingAnswer || answerDraft.trim().length < 10}>
              {submittingAnswer ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Send className="w-4 h-4 me-2" />
                  {isAr ? 'إرسال الإجابة' : 'Submit answer'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Conversation thread */}
      <Card className="rounded-3xl">
        <CardContent className="p-6 space-y-3">
          <div className="font-bold">
            {isAr ? 'المحادثة مع المسؤول' : 'Conversation'}
          </div>
          {messages.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {isAr ? 'لا توجد رسائل بعد. يمكنك بدء المحادثة لطلب توضيح.' : 'No messages yet.'}
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {messages.map((m) => {
                const mineSide =
                  perspective === 'asker' ? m.sender_role === 'asker' : m.sender_role === 'officer'
                return (
                  <div key={m.id} className={`flex ${mineSide ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] p-3 rounded-2xl ${
                        mineSide ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                      }`}
                    >
                      <div className="text-[11px] opacity-70 mb-1 font-bold">
                        {m.sender_name}
                      </div>
                      <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                      <div className="text-[10px] opacity-70 mt-1">
                        {new Date(m.created_at).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {question.status !== 'closed' && question.status !== 'published' && (
            <div className="flex gap-2 border-t pt-3">
              <Input
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder={isAr ? 'اكتب رسالة (للاستفسار / التوضيح)' : 'Type a message...'}
              />
              <Button onClick={sendMessage} disabled={sending || !composer.trim()}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {question.is_published && (
        <Link
          href={`/academy/fiqh/${question.id}`}
          className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
        >
          <Library className="w-4 h-4" />
          {isAr ? 'عرض في المكتبة العامة' : 'View in public library'}
        </Link>
      )}
    </div>
  )
}
