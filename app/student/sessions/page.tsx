"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Video, CalendarDays, Clock, ExternalLink, MessageSquare, Loader2, Send, X, CalendarClock, Info, ShieldCheck } from "lucide-react"
import { SessionsListSkeleton } from "@/components/ui/skeletons"
import { useI18n } from "@/lib/i18n/context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Booking = {
  id: string
  slot_start: string
  slot_end: string
  status: string
  meeting_link: string | null
  reader_name: string
  reader_id: string
}

type RescheduleRequest = {
  id: string
  requested_by_role: string
  proposed_slot_start: string
  proposed_slot_end: string
  status: string
  created_at: string
  requester_name: string
}

export default function StudentSessionsPage() {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingRequests, setPendingRequests] = useState<Record<string, RescheduleRequest[]>>({})
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Reschedule state
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null)
  const [proposedDate, setProposedDate] = useState("")
  const [proposedTime, setProposedTime] = useState("")
  const [submittingReschedule, setSubmittingReschedule] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/bookings")
        const d = await r.json()
        const bks: Booking[] = d.bookings || []
        setBookings(bks)

        const active = bks.filter(b => b.status !== "completed" && b.status !== "cancelled")
        const reqsMap: Record<string, RescheduleRequest[]> = {}
        await Promise.all(active.map(async (b) => {
          try {
            const res = await fetch(`/api/bookings/${b.id}/reschedule`)
            if (res.ok) {
              const rd = await res.json()
              const pending = (rd.requests || []).filter((req: RescheduleRequest) => req.status === "pending")
              if (pending.length > 0) reqsMap[b.id] = pending
            }
          } catch { }
        }))
        setPendingRequests(reqsMap)
      } catch { }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const STATUS = useMemo(() => ({
    confirmed: { label: t.student.statusBooked, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 ring-emerald-500/10" },
    completed: { label: t.student.statusCompleted, color: "bg-muted text-muted-foreground border-border ring-muted/50" },
    cancelled: { label: t.student.statusCancelled, color: "bg-destructive/10 text-destructive border-destructive/20 ring-destructive/10" },
    pending: { label: t.student.statusPending, color: "bg-accent/10 text-accent border-accent/20 ring-accent/10" },
    rescheduled: { label: isAr ? "مُعاد جدولته" : "Rescheduled", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 ring-blue-500/10" },
  }), [t, isAr])

  const handleCancel = async (id: string) => {
    if (!confirm(isAr ? "هل أنت متأكد من إلغاء الجلسة؟" : "Are you sure you want to cancel this session?")) return
    setCancellingId(id)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" } : b))
      }
    } catch { } finally {
      setCancellingId(null)
    }
  }

  const handleRescheduleSubmit = async () => {
    if (!rescheduleBooking || !proposedDate || !proposedTime) return
    setSubmittingReschedule(true)
    try {
      const proposedSlotStart = new Date(`${proposedDate}T${proposedTime}`).toISOString()
      const proposedSlotEnd = new Date(new Date(`${proposedDate}T${proposedTime}`).getTime() + 30 * 60000).toISOString()

      const res = await fetch(`/api/bookings/${rescheduleBooking.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposedSlotStart, proposedSlotEnd }),
      })
      if (res.ok) {
        alert(isAr ? "تم إرسال طلب التعديل. سيتم إشعارك بعد رد المقرئ." : "Reschedule request sent. You'll be notified when the reader responds.")
        setRescheduleBooking(null)
        setProposedDate("")
        setProposedTime("")
      } else {
        const d = await res.json()
        alert(d.error || "Error")
      }
    } finally { setSubmittingReschedule(false) }
  }

  const handleRespondToReaderRequest = async (bookingId: string, reqId: string, action: "accept" | "reject") => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/reschedule/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        if (action === "accept") {
          const refreshed = await fetch("/api/bookings")
          if (refreshed.ok) {
            const data = await refreshed.json()
            setBookings(data.bookings || [])
          }
          alert(isAr ? "تم قبول التعديل وتحديث الموعد." : "Reschedule accepted.")
        } else {
          alert(isAr
            ? "تم رفض الطلب. يمكنك التواصل مع الدعم لطلب تغيير المقرئ."
            : "Request rejected. You can contact support to request a different reader.")
        }
        setPendingRequests(prev => {
          const next = { ...prev }
          delete next[bookingId]
          return next
        })
      }
    } catch { alert("Error") }
  }

  return (
    <div className="max-w-4xl max-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">{t.student.mySessions}</h1>
        <p className="text-muted-foreground">{t.student.mySessionsDesc}</p>
      </div>

      {loading ? (
        <SessionsListSkeleton />
      ) : bookings.length === 0 ? (
        <div className="bg-card border border-border rounded-[2rem] py-24 text-center shadow-sm">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Video className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">{t.student.noSessionsYet}</h3>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            {isAr ? "لم تقم بحجز أي جلسات تصحيح بعد. ابدأ بحجز جلستك الأولى الآن لتصحيح تلاوتك." : "You haven't booked any correction sessions yet. Book your first session now to perfect your recitation."}
          </p>
          <Link href="/student/booking" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-black/10">
            <CalendarClock className="w-5 h-5" />
            {isAr ? "احجز جلسة جديدة" : "Book New Session"}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {bookings.map(b => {
            const st = STATUS[b.status as keyof typeof STATUS] || STATUS.pending
            const isExpanded = expandedId === b.id
            const isCancelled = b.status === "cancelled"
            const isCompleted = b.status === "completed"
            const isActive = !isCancelled && !isCompleted
            const pendingReqs = pendingRequests[b.id] || []

            return (
              <div key={b.id} className={`bg-card border rounded-3xl overflow-hidden transition-all duration-300
                ${isExpanded ? 'border-primary/20 shadow-xl shadow-black/5' : 'border-border shadow-sm hover:border-primary/20 hover:shadow-md'}`}>

                {/* Card Header (Clickable) */}
                <div
                  className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 cursor-pointer bg-card relative overflow-hidden"
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                >
                  {/* Status indicator line */}
                  <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${st.color.split(' ')[0]}`} />

                  <div className="flex items-center gap-5 z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border 
                      ${isActive ? 'bg-primary/5 border-primary/10' : 'bg-muted border-border'}`}>
                      {isActive ? <Video className="w-6 h-6 text-primary" /> : <CalendarClock className="w-6 h-6 text-muted-foreground/40" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-foreground">{b.reader_name || t.student.certifiedReaderFallback}</h3>
                        {!b.reader_name && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent">
                            <ShieldCheck className="w-3 h-3" />
                            {isAr ? "معتمد" : "Certified"}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded-lg">
                          <CalendarDays className="w-4 h-4 text-accent" />
                          {new Date(b.slot_start).toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded-lg">
                          <Clock className="w-4 h-4 text-primary/60" />
                          {new Date(b.slot_start).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                          {" - "}
                          {new Date(b.slot_end).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-xl text-xs font-bold border ring-4 z-10 inline-flex items-center justify-center self-start md:self-auto ${st.color}`}>
                    {st.label}
                  </span>
                </div>

                {/* Pending Reschedule Request from Reader */}
                {pendingReqs.length > 0 && (
                  <div className="mx-6 md:mx-8 mb-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5 shadow-inner">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarClock className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                      <p className="text-sm font-bold text-amber-900 dark:text-amber-100">{isAr ? "طلب تعديل موعد من المقرئ:" : "Reschedule request from reader:"}</p>
                    </div>
                    {pendingReqs.map(req => (
                      <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-xl border border-amber-500/20">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 opacity-70" />
                          {new Date(req.proposed_slot_start).toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "long", month: "long", day: "numeric" })}
                          <span className="mx-1 opacity-50">•</span>
                          {new Date(req.proposed_slot_start).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleRespondToReaderRequest(b.id, req.id, "accept")}
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
                          >
                            {isAr ? "قبول وتأكيد" : "Accept"}
                          </button>
                          <button
                            onClick={() => handleRespondToReaderRequest(b.id, req.id, "reject")}
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-card text-muted-foreground border border-border rounded-xl text-xs font-bold hover:bg-muted transition-colors"
                          >
                            {isAr ? "رفض الطلب" : "Reject"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expanded Content Details */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 p-6 md:p-8 space-y-8 animate-in slide-in-from-top-2 fade-in duration-200">

                    {/* Actions and Meeting Link Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Meeting Section */}
                      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm space-y-3">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t.student.sessionLinkLabel}</h4>
                        {isActive && (
                          <a
                            href={`/student/sessions/${b.id}/live`}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-900/20"
                          >
                            <Video className="w-5 h-5" />
                            انضم للجلسة المباشرة (داخل المنصة)
                          </a>
                        )}
                        {b.meeting_link ? (
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">
                              {isAr ? "رابط الجلسة جاهز. الرجاء الانضمام في الموعد المحدد." : "The session link is ready. Please join at the scheduled time."}
                            </p>
                            <a
                              href={b.meeting_link.startsWith('http') ? b.meeting_link : `https://${b.meeting_link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-black/10"
                            >
                              <Video className="w-5 h-5" />
                              {t.student.joinSessionBtn}
                              <ExternalLink className="w-4 h-4 opacity-70 ml-1 rtl:mr-1 rtl:ml-0" />
                            </a>
                          </div>
                        ) : (
                          <div className="flex gap-3 items-start bg-accent/10 rounded-xl p-4 border border-accent/20">
                            <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-accent leading-relaxed">
                              {isActive ? t.student.linkPendingMsg : (isAr ? 'الجلسة غير نشطة ولن يتم إنشاء رابط لها.' : 'Session is inactive. No link will be generated.')}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Controls Section */}
                      {isActive && (
                        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm space-y-3 flex flex-col justify-center">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{isAr ? "التحكم في الجلسة" : "Session Controls"}</h4>
                          <div className="flex flex-col gap-3">
                            <Link
                              href={`/student/chat?with=${b.reader_id}`}
                              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-accent/20 bg-card text-foreground px-6 py-3 text-sm font-bold hover:border-accent hover:bg-accent/10 transition-all"
                            >
                              <MessageSquare className="w-5 h-5 text-accent" />
                              {isAr ? "تواصل مع المقرئ في شات خاص" : "Chat privately with Reader"}
                            </Link>

                            <div className="flex gap-3">
                              <button
                                onClick={() => setRescheduleBooking(b)}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-card text-muted-foreground px-4 py-3 text-sm font-bold hover:bg-muted transition-all font-medium"
                              >
                                <CalendarClock className="w-4 h-4 opacity-70" />
                                {isAr ? "تعديل الموعد" : "Reschedule"}
                              </button>
                              <button
                                onClick={() => handleCancel(b.id)}
                                disabled={cancellingId === b.id}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-destructive/10 bg-destructive/5 text-destructive px-4 py-3 text-sm font-bold hover:bg-destructive/10 hover:border-destructive/20 transition-all disabled:opacity-50"
                              >
                                {cancellingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                {isAr ? "إلغاء الجلسة" : "Cancel"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Integrated Comment Box */}
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-primary" />
                        </div>
                        <h4 className="text-sm font-bold text-foreground">{t.student.commentLabel || t.student.chat}</h4>
                      </div>
                      <CommentBox bookingId={b.id} />
                    </div>

                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleBooking} onOpenChange={() => setRescheduleBooking(null)}>
        <DialogContent className="max-w-md p-6 rounded-[2rem]">
          <DialogHeader className="mb-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <CalendarClock className="w-6 h-6 text-accent" />
            </div>
            <DialogTitle className="text-xl font-bold">{isAr ? "اقتراح تعديل الموعد" : "Request Reschedule"}</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              {isAr
                ? `سيتم إرسال اقتراحك للمقرئ (${rescheduleBooking?.reader_name}) للموافقة عليه.`
                : `Your proposal will be sent to the reader (${rescheduleBooking?.reader_name}) for approval.`}
            </DialogDescription>
          </DialogHeader>

          {rescheduleBooking && (
            <div className="space-y-5 py-4">
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-foreground block">{isAr ? "التاريخ الجديد" : "New Date"}</label>
                <input
                  type="date"
                  value={proposedDate}
                  onChange={e => setProposedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full h-14 border border-border rounded-2xl px-4 text-foreground bg-muted/30 focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-foreground block">{isAr ? "الوقت الجديد" : "New Time"}</label>
                <input
                  type="time"
                  value={proposedTime}
                  onChange={e => setProposedTime(e.target.value)}
                  className="w-full h-14 border border-border rounded-2xl px-4 text-foreground bg-muted/30 focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                />
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed font-medium">
                  {isAr
                    ? "لن يتم تأكيد الموعد الجديد إلا بعد موافقة المقرئ عليه. في حال الرفض، سيبقى الموعد القديم فعالاً."
                    : "The new time won't be confirmed until the reader approves it. If rejected, the old time remains active."}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" className="h-12 rounded-xl font-bold border-border" onClick={() => setRescheduleBooking(null)}>{isAr ? "إلغاء التعديل" : "Cancel"}</Button>
            <Button
              onClick={handleRescheduleSubmit}
              disabled={!proposedDate || !proposedTime || submittingReschedule}
              className="h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              {submittingReschedule ? <Loader2 className="w-5 h-5 animate-spin mx-2" /> : (isAr ? "إرسال الاقتراح للمقرئ" : "Send Proposal")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CommentBox({ bookingId }: { bookingId: string }) {
  const { t, locale } = useI18n()
  const [comments, setComments] = useState<Array<{ id: string; author_name: string; comment_text: string; created_at: string }>>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}/comments`)
      .then(r => r.ok ? r.json() : { comments: [] })
      .then(d => setComments(d.comments || []))
      .catch(() => { })
  }, [bookingId])

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (res.ok) {
        const d = await res.json()
        setComments(p => [...p, d.comment])
        setText("")
      }
    } finally { setSending(false) }
  }

  return (
    <div className="space-y-4">
      {comments.length > 0 && (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {comments.map((c, i) => (
            <div key={c.id} className="bg-muted/30 border border-border rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-foreground bg-card px-2.5 py-1 rounded-lg border border-border shadow-sm">{c.author_name}</span>
                <span className="text-[10px] font-medium text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3 inline-block mr-1 rtl:ml-1 rtl:mr-0 opacity-50" />
                  {new Date(c.created_at).toLocaleString(locale === "ar" ? "ar-SA" : "en-US", { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-sm text-foreground mb-2 leading-relaxed font-medium mt-1">{c.comment_text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="relative group">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder={t.student.writeCommentPlaceholder}
          className="w-full border-2 border-border bg-muted/30 rounded-2xl pl-16 pr-6 rtl:pr-16 rtl:pl-6 py-4 text-sm text-foreground focus:bg-card focus:ring-4 focus:ring-primary/5 focus:border-primary placeholder:text-muted-foreground transition-all font-medium"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="absolute left-3 top-3 bottom-3 rtl:right-3 rtl:left-auto px-4 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground transition-all group-focus-within:shadow-lg shadow-black/10"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rtl:rotate-180" />}
        </button>
      </div>
    </div>
  )
}
