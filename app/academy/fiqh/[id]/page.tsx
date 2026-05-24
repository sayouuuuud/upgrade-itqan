'use client'

import { useCallback, useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Library,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  XCircle,
  Send,
  MessageCircle,
  ShieldCheck,
  EyeOff,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

interface Q {
  id: string
  title: string | null
  question: string
  answer: string | null
  category_name_ar: string | null
  category_name_en: string | null
  category_slug: string | null
  is_anonymous: boolean
  is_published: boolean
  status: string
  publish_consent: string
  asker_name: string | null
  asker_avatar: string | null
  assigned_to_name: string | null
  answered_by_name: string | null
  asked_at: string
  answered_at: string | null
  published_at: string | null
  views_count: number
  asked_by: string | null
}

interface Message {
  id: string
  sender_id: string
  sender_role: string
  sender_name: string | null
  sender_avatar: string | null
  content: string
  created_at: string
}

interface Me {
  id: string
  role: string
}

const STATUS_TONE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  assigned: 'bg-sky-100 text-sky-900 border-sky-200',
  in_progress: 'bg-indigo-100 text-indigo-900 border-indigo-200',
  awaiting_consent: 'bg-orange-100 text-orange-900 border-orange-200',
  published: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  declined: 'bg-slate-100 text-slate-700 border-slate-200',
  closed: 'bg-slate-100 text-slate-700 border-slate-200',
}

const STATUS_LABEL_AR: Record<string, string> = {
  pending: 'في الانتظار',
  assigned: 'تم التعيين',
  in_progress: 'قيد المراجعة',
  awaiting_consent: 'بانتظار الموافقة',
  published: 'منشور',
  declined: 'لم يُنشر',
  closed: 'مغلق',
}

export default function FiqhDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight

  const [question, setQuestion] = useState<Q | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [qRes, meRes] = await Promise.all([
        fetch(`/api/academy/fiqh/${id}`),
        fetch('/api/auth/me'),
      ])
      const qData = await qRes.json().catch(() => ({}))
      if (!qRes.ok) {
        setError(qData?.error || (isAr ? 'لا يمكن عرض السؤال' : 'Cannot view'))
        setQuestion(null)
      } else {
        setQuestion(qData.question)
      }
      if (meRes.ok) {
        const meData = await meRes.json()
        if (meData?.user) setMe({ id: meData.user.id, role: meData.user.role })
      }
    } finally {
      setLoading(false)
    }
  }, [id, isAr])

  useEffect(() => {
    load()
  }, [load])

  const isAsker = !!me && !!question && me.id === question.asked_by
  const isStaff =
    !!me &&
    ['admin', 'academy_admin', 'fiqh_supervisor', 'supervisor'].includes(me.role)
  const canSeeThread = isAsker || isStaff

  // Load messages if the viewer can see the thread
  const loadMessages = useCallback(async () => {
    if (!canSeeThread) return
    const res = await fetch(`/api/academy/fiqh/${id}/messages`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages || [])
    }
  }, [canSeeThread, id])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  async function sendMessage() {
    if (!newMsg.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/academy/fiqh/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMsg.trim() }),
      })
      if (res.ok) {
        setNewMsg('')
        loadMessages()
        load()
      }
    } finally {
      setSending(false)
    }
  }

  async function respondConsent(decision: 'grant' | 'deny', anonymous?: boolean) {
    const res = await fetch(`/api/academy/fiqh/${id}/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, anonymous }),
    })
    if (res.ok) load()
  }

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
          <CardContent className="p-12 text-center text-muted-foreground space-y-3">
            <p>{error || (isAr ? 'لم يُعثر على السؤال.' : 'Not found.')}</p>
            <Link href="/academy/fiqh" className="text-primary hover:underline">
              {isAr ? 'العودة للمكتبة' : 'Back to library'}
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      <Link
        href="/academy/fiqh"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronIcon className="w-4 h-4" />
        <Library className="w-4 h-4 mx-1" />
        {isAr ? 'المكتبة الفقهية' : 'Fiqh Library'}
      </Link>

      {/* Question card */}
      <Card className="rounded-3xl">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {question.category_name_ar && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                {isAr
                  ? question.category_name_ar
                  : question.category_name_en || question.category_name_ar}
              </span>
            )}
            <span
              className={cn(
                'text-[11px] px-2 py-0.5 rounded-full border font-semibold',
                STATUS_TONE[question.status] || 'bg-muted text-muted-foreground border-border'
              )}
            >
              {STATUS_LABEL_AR[question.status] || question.status}
            </span>
            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
              <Eye className="w-3 h-3" /> {question.views_count}
            </span>
          </div>
          {question.title && <h1 className="text-3xl font-black">{question.title}</h1>}
          <div className="text-sm text-muted-foreground">
            {isAr ? 'السائل:' : 'Asked by:'}{' '}
            <span className="font-bold text-foreground">
              {question.is_anonymous
                ? isAr
                  ? 'سائل مجهول'
                  : 'Anonymous'
                : question.asker_name || '—'}
            </span>
            {question.assigned_to_name && (
              <span className="ms-3">
                {isAr ? 'المسؤول:' : 'Officer:'}{' '}
                <span className="font-bold text-foreground">{question.assigned_to_name}</span>
              </span>
            )}
            <span className="ms-3">
              {new Date(question.asked_at).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <p className="whitespace-pre-wrap leading-loose mt-2 text-lg">{question.question}</p>
        </CardContent>
      </Card>

      {/* Answer card */}
      {question.answer && (
        <Card className="rounded-3xl border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-5 h-5" />
              {isAr ? 'الإجابة الرسمية' : 'Official answer'}
              {question.answered_by_name && (
                <span className="text-sm font-normal text-muted-foreground">
                  — {question.answered_by_name}
                </span>
              )}
            </div>
            <p className="whitespace-pre-wrap leading-loose">{question.answer}</p>
            {question.answered_at && (
              <div className="text-xs text-muted-foreground">
                {new Date(question.answered_at).toLocaleString(
                  isAr ? 'ar-EG' : 'en-US',
                  { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Consent request box (only the asker sees it) */}
      {isAsker && question.status === 'awaiting_consent' && question.answer && (
        <Card className="rounded-3xl border-amber-300 bg-amber-50/60 dark:bg-amber-950/30">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
              <Clock className="w-5 h-5" />
              {isAr ? 'هل توافق على نشر سؤالك وإجابته؟' : 'Allow publication?'}
            </div>
            <p className="text-sm text-amber-900/80 dark:text-amber-100/80 leading-relaxed">
              {isAr
                ? 'موافقتك ستجعل السؤال والإجابة جزءاً من المكتبة الفقهية ليستفيد منها الجميع. يمكنك اختيار نشره مجهول الهوية.'
                : 'Granting consent will make this Q&A part of the public Fiqh library so others can benefit. You may choose anonymous publishing.'}
            </p>
            <ConsentControls
              isAr={isAr}
              defaultAnonymous={question.is_anonymous}
              onGrant={(anon) => respondConsent('grant', anon)}
              onDeny={() => respondConsent('deny')}
            />
          </CardContent>
        </Card>
      )}

      {/* Staff visibility on closed-with-answer (per product spec) */}
      {isStaff && (question.status === 'closed' || question.status === 'declined') &&
        question.answer && (
          <Card className="rounded-3xl border-slate-300 bg-slate-50/60">
            <CardContent className="p-5 text-sm text-slate-700">
              <div className="flex items-center gap-2 font-bold mb-1">
                <ShieldCheck className="w-4 h-4" />
                {isAr ? 'ملاحظة إدارية' : 'Admin note'}
              </div>
              <p>
                {isAr
                  ? 'هذه الإجابة لم يوافق السائل على نشرها للجمهور. ما زال بإمكان الإدارة الاطلاع عليها للمتابعة.'
                  : 'The asker did not consent to publishing. Staff can still review.'}
              </p>
            </CardContent>
          </Card>
        )}

      {/* Conversation thread for asker + staff */}
      {canSeeThread && (
        <Card className="rounded-3xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold">
              <MessageCircle className="w-5 h-5 text-primary" />
              {isAr ? 'المحادثة' : 'Conversation'}
              {question.is_anonymous && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  {isAr ? 'مجهول' : 'Anonymous'}
                </span>
              )}
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isAr
                    ? 'لا توجد رسائل بعد. ابدأ المحادثة إذا احتجت توضيحاً.'
                    : 'No messages yet. Start the conversation if you need clarification.'}
                </p>
              ) : (
                messages.map((m) => {
                  const mine = me?.id === m.sender_id
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'flex',
                        mine ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                          mine
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        )}
                      >
                        <div className="text-[10px] opacity-80 mb-1">
                          {m.sender_name || m.sender_role}
                        </div>
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="flex items-end gap-2">
              <Textarea
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                rows={2}
                placeholder={isAr ? 'اكتب رسالتك...' : 'Write a message...'}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={sending || !newMsg.trim()}>
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ConsentControls({
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
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={anon}
          onChange={(e) => setAnon(e.target.checked)}
          className="rounded"
        />
        <span>{isAr ? 'انشر باسم "سائل مجهول"' : 'Publish anonymously'}</span>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => onGrant(anon)}>
          <CheckCircle2 className="w-4 h-4 me-1.5" />
          {isAr ? 'موافق على النشر' : 'Allow publication'}
        </Button>
        <Button variant="outline" onClick={onDeny}>
          <XCircle className="w-4 h-4 me-1.5" />
          {isAr ? 'رفض النشر' : 'Decline'}
        </Button>
      </div>
    </div>
  )
}
