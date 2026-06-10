'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowRight, Calendar, Clock, Video, VideoOff, Link2, Check, Copy,
  MessageSquare, User, Mic, BookOpen, Save, Loader2, Sparkles, CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { ProfileSkeleton } from '@/components/ui/skeletons'

interface Booking {
  id: string
  student_id: string
  reader_id: string
  recitation_id: string | null
  slot_start: string | null
  slot_end: string | null
  scheduled_at: string | null
  duration_minutes: number | null
  status: string
  meeting_link: string | null
  meeting_platform: string | null
  notes: string | null
  reader_notes: string | null
  session_summary: string | null
  student_name: string
  student_email: string | null
  student_avatar: string | null
  surah_name: string | null
  ayah_from: number | null
  ayah_to: number | null
  recitation_status: string | null
  recitation_audio: string | null
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'قيد الانتظار', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  confirmed: { label: 'مؤكدة',        cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  completed: { label: 'مكتملة',       cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'ملغاة',        cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
}

interface Comment { id: string; author_name: string; comment_text: string; created_at: string }

export default function ReaderSessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [linkInput, setLinkInput] = useState('')
  const [savingLink, setSavingLink] = useState(false)
  const [copied, setCopied] = useState(false)
  const [summary, setSummary] = useState('')
  const [savingSummary, setSavingSummary] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/bookings/${id}`)
        if (!res.ok) {
          toast.error('تعذّر تحميل الجلسة')
          router.push('/reader/sessions')
          return
        }
        const data = await res.json()
        setBooking(data.booking)
        setSummary(data.booking.session_summary || '')
        const cRes = await fetch(`/api/bookings/${id}/comments`)
        if (cRes.ok) {
          const cData = await cRes.json()
          setComments(cData.comments || [])
        }
      } catch {
        toast.error('حدث خطأ')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  const saveLink = async () => {
    if (!linkInput.trim()) return
    setSavingLink(true)
    try {
      const res = await fetch(`/api/bookings/${id}/meeting-link`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingLink: linkInput.trim() }),
      })
      if (res.ok) {
        setBooking((b) => (b ? { ...b, meeting_link: linkInput.trim() } : b))
        setLinkInput('')
        toast.success('تم حفظ الرابط')
      } else toast.error('تعذّر حفظ الرابط')
    } finally {
      setSavingLink(false)
    }
  }

  const saveSummary = async () => {
    setSavingSummary(true)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_summary: summary }),
      })
      if (res.ok) toast.success('تم حفظ ملخص الجلسة')
      else toast.error('تعذّر الحفظ')
    } finally {
      setSavingSummary(false)
    }
  }

  const toggleCompleted = async () => {
    if (!booking) return
    const next = booking.status === 'completed' ? 'confirmed' : 'completed'
    setTogglingStatus(true)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (res.ok) {
        setBooking((b) => (b ? { ...b, status: next } : b))
        toast.success(next === 'completed' ? 'تم إنهاء الجلسة' : 'تم إعادة فتح الجلسة')
      } else toast.error('تعذّر التحديث')
    } finally {
      setTogglingStatus(false)
    }
  }

  const sendComment = async () => {
    if (!commentText.trim()) return
    setSendingComment(true)
    try {
      const res = await fetch(`/api/bookings/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText }),
      })
      if (res.ok) {
        const d = await res.json()
        setComments((p) => [...p, d.comment])
        setCommentText('')
      } else toast.error('تعذّر إرسال التعليق')
    } finally {
      setSendingComment(false)
    }
  }

  const copyLink = () => {
    if (!booking?.meeting_link) return
    navigator.clipboard.writeText(booking.meeting_link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (loading) return <ProfileSkeleton />
  if (!booking) return null

  const start = booking.slot_start || booking.scheduled_at
  const isCompleted = booking.status === 'completed'
  const isActive = booking.status === 'confirmed' || booking.status === 'pending'
  const st = STATUS[booking.status] || { label: booking.status, cls: 'bg-muted text-muted-foreground' }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6" dir="rtl">
      {/* Back */}
      <button
        onClick={() => router.push('/reader/sessions')}
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        العودة إلى الجلسات
      </button>

      {/* Header card */}
      <Card className="border-border rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-l from-emerald-500/10 to-transparent p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-2xl font-black text-emerald-700 dark:text-emerald-400 overflow-hidden">
                {booking.student_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={booking.student_avatar || "/placeholder.svg"} alt={booking.student_name} className="w-full h-full object-cover" />
                ) : (
                  (booking.student_name || 'ط').charAt(0)
                )}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-foreground text-balance">{booking.student_name}</h1>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mt-1">
                  <User className="w-3.5 h-3.5" /> جلسة تلاوة فردية
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold ${st.cls}`}>
              {isCompleted && <CheckCircle2 className="w-4 h-4" />}
              {st.label}
            </span>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-card/60 rounded-2xl p-4 border border-border/50">
              <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5" /> التاريخ</p>
              <p className="text-sm font-black text-foreground">
                {start ? new Date(start).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }) : '—'}
              </p>
            </div>
            <div className="bg-card/60 rounded-2xl p-4 border border-border/50">
              <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mb-1"><Clock className="w-3.5 h-3.5" /> الوقت</p>
              <p className="text-sm font-black text-foreground">
                {start ? new Date(start).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—'}
                {booking.duration_minutes ? ` · ${booking.duration_minutes} د` : ''}
              </p>
            </div>
            {booking.surah_name && (
              <div className="bg-card/60 rounded-2xl p-4 border border-border/50">
                <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mb-1"><BookOpen className="w-3.5 h-3.5" /> التلاوة</p>
                <p className="text-sm font-black text-foreground">
                  {booking.surah_name} {booking.ayah_from ? `(${booking.ayah_from}-${booking.ayah_to})` : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Recitation audio */}
      {booking.recitation_audio && (
        <Card className="border-border rounded-3xl">
          <CardContent className="p-6">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 mb-4">
              <Mic className="w-4 h-4 text-emerald-600" /> التسجيل المرفق
            </h3>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio controls src={booking.recitation_audio} className="w-full" />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meeting link */}
        <Card className="border-border rounded-3xl">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-600" /> رابط الجلسة
            </h3>
            {isActive && (
              <a
                href={`/reader/sessions/${booking.id}/live`}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-md"
              >
                <Video className="w-5 h-5" /> ابدأ البث المباشر داخل المنصة
              </a>
            )}
            {isCompleted ? (
              <div className="flex items-center gap-3 bg-muted/50 rounded-2xl p-4 border border-border/50">
                <VideoOff className="w-5 h-5 text-muted-foreground shrink-0" />
                <p className="text-sm font-bold text-muted-foreground">انتهت الجلسة</p>
              </div>
            ) : booking.meeting_link ? (
              <div className="flex items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-2 pr-4">
                <Video className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
                <input readOnly value={booking.meeting_link} className="w-full border-none bg-transparent p-0 text-sm font-bold text-emerald-700 dark:text-emerald-400 focus:ring-0 focus:outline-none" />
                <button onClick={copyLink} className="rounded-xl p-2 border border-emerald-500/20 bg-card hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center rounded-2xl border-2 border-border bg-card px-4 py-2.5">
                  <Link2 className="w-5 h-5 text-muted-foreground ml-2" />
                  <input
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveLink() }}
                    placeholder="الصق رابط جلسة خارجية (اختياري)"
                    className="w-full h-9 border-none bg-transparent p-0 text-sm placeholder:text-muted-foreground focus:ring-0 focus:outline-none text-foreground font-semibold"
                  />
                </div>
                <Button onClick={saveLink} disabled={!linkInput || savingLink} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {savingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} حفظ الرابط
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Management */}
        <Card className="border-border rounded-3xl">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" /> إدارة الجلسة
            </h3>
            <a
              href={`/reader/chat?with=${booking.student_id}`}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-400/30 bg-amber-400/5 text-foreground px-6 py-3.5 text-sm font-bold hover:border-amber-400 transition-all"
            >
              <MessageSquare className="w-5 h-5 text-amber-500" /> مراسلة الطالب
            </a>
            <button
              onClick={toggleCompleted}
              disabled={togglingStatus}
              className={`w-full flex items-center justify-between gap-3 rounded-2xl border-2 p-4 transition-colors ${isCompleted ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-muted/30 border-border hover:border-emerald-500/30'}`}
            >
              <div className="flex items-center gap-3 text-right">
                <div className={`p-2 rounded-full ${isCompleted ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                  {togglingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </div>
                <div>
                  <span className="block text-sm font-bold text-foreground">{isCompleted ? 'الجلسة مكتملة' : 'تأكيد اكتمال الجلسة'}</span>
                  <span className="block text-xs font-medium text-muted-foreground mt-0.5">{isCompleted ? 'اضغط للتراجع' : 'وسم الجلسة كمنتهية بنجاح'}</span>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Session summary */}
      <Card className="border-border rounded-3xl">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" /> ملخص الجلسة وملاحظاتك
          </h3>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="اكتب ملخص ما تم في الجلسة، نقاط القوة والملاحظات للطالب..."
            className="min-h-[120px] rounded-2xl resize-none"
          />
          <Button onClick={saveSummary} disabled={savingSummary} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            {savingSummary ? <Loader2 className="w-4 h-4 animate-spin ml-1.5" /> : <Save className="w-4 h-4 ml-1.5" />} حفظ الملخص
          </Button>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card className="border-border rounded-3xl">
        <CardContent className="p-6 space-y-5">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" /> التعليقات والملاحظات
          </h3>
          {comments.length > 0 && (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c.id} className="bg-muted/40 border border-border/50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                        {c.author_name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-foreground">{c.author_name}</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {new Date(c.created_at).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed font-medium">{c.comment_text}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendComment() }}
              placeholder="أضف تعليقاً..."
              className="flex-1 h-11 rounded-2xl border-2 border-border bg-card px-4 text-sm font-semibold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none text-foreground"
            />
            <Button onClick={sendComment} disabled={!commentText.trim() || sendingComment} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11">
              {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إرسال'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
