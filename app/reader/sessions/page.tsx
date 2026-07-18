"use client"
import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
  Plus, Send, Link2, Video, VideoOff, Copy, Check, Loader2,
  MessageSquare, Calendar, Clock, ChevronDown, Sparkles, AlertCircle, ArrowUpRight, PlayCircle
} from "lucide-react"
import { ReaderRecordingsPanel } from "@/components/reader/recordings-panel"
import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton"

type Booking = {
  id: string
  student_id: string
  student_name: string
  student_email: string
  reader_id: string
  reader_name: string
  slot_start: string
  slot_end: string
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show" | "rescheduled"
  meeting_link: string | null
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

export default function ReaderSessionsPage() {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const [sessions, setSessions] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed" | "pending">("all")
  const [meetingLinks, setMeetingLinks] = useState<Record<string, string>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [savingLink, setSavingLink] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [view, setView] = useState<"sessions" | "recordings">("sessions")

  // Reschedule dialog state
  const [rescheduleSession, setRescheduleSession] = useState<Booking | null>(null)
  const [proposedDate, setProposedDate] = useState("")
  const [proposedTime, setProposedTime] = useState("")
  const [submittingReschedule, setSubmittingReschedule] = useState(false)

  // Pending reschedule requests (from student) state
  const [pendingRequests, setPendingRequests] = useState<Record<string, RescheduleRequest[]>>({})

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/bookings")
        if (res.ok) {
          const data = await res.json()
          const bookings: Booking[] = data.bookings || []
          setSessions(bookings)

          // Fetch pending reschedule requests for active sessions
          const active = bookings.filter(b => b.status !== "completed" && b.status !== "cancelled")
          const reqsMap: Record<string, RescheduleRequest[]> = {}
          await Promise.all(active.map(async (b) => {
            try {
              const r = await fetch(`/api/bookings/${b.id}/reschedule`)
              if (r.ok) {
                const d = await r.json()
                const pending = (d.requests || []).filter((req: RescheduleRequest) => req.status === "pending")
                if (pending.length > 0) reqsMap[b.id] = pending
              }
            } catch { }
          }))
          setPendingRequests(reqsMap)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [])

  const filtered = sessions.filter((s) => {
    if (filter === "upcoming") return s.status === "confirmed"
    if (filter === "completed") return s.status === "completed"
    if (filter === "pending") return !s.meeting_link && s.status !== "completed"
    return true
  })

  const handleCopy = (id: string, link: string) => {
    navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSaveLink = async (id: string) => {
    const link = meetingLinks[id]
    if (!link) return
    setSavingLink(id)
    try {
      const res = await fetch(`/api/bookings/${id}/meeting-link`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingLink: link }),
      })
      if (res.ok) {
        setSessions(sessions.map(s => s.id === id ? { ...s, meeting_link: link } : s))
      } else {
        alert(t.reader.saveLinkError)
      }
    } catch {
      alert(t.student.serverError)
    } finally {
      setSavingLink(null)
    }
  }

  const handleToggleStatus = async (id: string, isCompleted: boolean) => {
    const targetStatus = isCompleted ? "confirmed" : "completed"
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      })
      if (res.ok) {
        setSessions(sessions.map(s => s.id === id ? { ...s, status: targetStatus } : s))
      }
    } catch {
      console.error("Failed to update status")
    }
  }

  const handleRescheduleSubmit = async () => {
    if (!rescheduleSession || !proposedDate || !proposedTime) return
    setSubmittingReschedule(true)
    try {
      const proposedSlotStart = new Date(`${proposedDate}T${proposedTime}`).toISOString()
      const proposedSlotEnd = new Date(new Date(`${proposedDate}T${proposedTime}`).getTime() + 30 * 60000).toISOString()

      const res = await fetch(`/api/bookings/${rescheduleSession.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposedSlotStart, proposedSlotEnd }),
      })
      if (res.ok) {
        alert('')
        setRescheduleSession(null)
        setProposedDate("")
        setProposedTime("")
      } else {
        const d = await res.json()
        alert(d.error || (''))
      }
    } finally {
      setSubmittingReschedule(false)
    }
  }

  const handleRespondToStudentRequest = async (bookingId: string, reqId: string, action: "accept" | "reject") => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/reschedule/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        if (action === "accept") {
          // Refresh sessions to get new slot_start
          const refreshed = await fetch("/api/bookings")
          if (refreshed.ok) {
            const data = await refreshed.json()
            setSessions(data.bookings || [])
          }
        }
        setPendingRequests(prev => {
          const next = { ...prev }
          delete next[bookingId]
          return next
        })
        alert(action === "accept" 
          ? ('') 
          : (''))
      }
    } catch {
      alert('')
    }
  }

  const avatarColors = [
    "bg-gradient-to-br from-sky-400/20 to-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    "bg-gradient-to-br from-emerald-400/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    "bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
    "bg-gradient-to-br from-purple-400/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30",
  ]

  const filterButtons = [
    { key: "all" as const, label: '' },
    { key: "upcoming" as const, label: '' },
    { key: "completed" as const, label: '' },
    { key: "pending" as const, label: '' },
  ]

  const STATUS = {
    confirmed: { label: '', color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 ring-emerald-500/10", dot: "bg-emerald-500" },
    completed: { label: '', color: "bg-muted text-muted-foreground border-border ring-muted/50", dot: "bg-muted-foreground" },
    cancelled: { label: '', color: "bg-destructive/10 text-destructive border-destructive/20 ring-destructive/10", dot: "bg-destructive" },
    pending: { label: '', color: "bg-[#D4A843]/10 text-[#D4A843] border-[#D4A843]/30 ring-[#D4A843]/10", dot: "bg-[#D4A843]" },
    rescheduled: { label: '', color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 ring-sky-500/10", dot: "bg-sky-500" },
  }

  return (
    <div className="space-y-8 pb-12" dir={isAr ? "rtl" : "ltr"}>
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0B3D2E] via-[#0f543f] to-[#0a2920] p-8 md:p-12 shadow-2xl shadow-[#0B3D2E]/20 text-white">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-20 blur-[80px]">
          <div className="w-[300px] h-[300px] rounded-full bg-[#D4A843]" />
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 opacity-20 blur-[60px]">
          <div className="w-[250px] h-[250px] rounded-full bg-emerald-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-[#D4A843]" />
              <span className="text-white/90">{''}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {t.reader.sessionManagementTitle}
            </h1>
            <p className="text-white/80 text-lg max-w-xl leading-relaxed">
              {t.reader.sessionManagementDesc}
            </p>
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 text-center min-w-[120px]">
              <div className="text-3xl font-black text-white">{filtered.length}</div>
              <div className="text-xs font-medium text-white/70 mt-1 uppercase tracking-wider">{''}</div>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs: Sessions / Recordings */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-muted/50 rounded-2xl border border-border max-w-fit shadow-sm">
        <button
          onClick={() => setView("sessions")}
          className={`flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-300 ${view === "sessions"
            ? "bg-[#0B3D2E] text-white shadow-md shadow-[#0B3D2E]/20"
            : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
        >
          <Calendar className="w-4 h-4" />
          {''}
        </button>
        <button
          onClick={() => setView("recordings")}
          className={`flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-300 ${view === "recordings"
            ? "bg-[#0B3D2E] text-white shadow-md shadow-[#0B3D2E]/20"
            : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
        >
          <PlayCircle className="w-4 h-4" />
          {''}
        </button>
      </div>

      {view === "recordings" ? (
        <ReaderRecordingsPanel />
      ) : (
      <>
      {/* Elegant Filter Segment */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-muted/50 rounded-2xl border border-border max-w-fit shadow-sm">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`relative flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-300 ${filter === btn.key
              ? "bg-[#0B3D2E] text-white shadow-md shadow-[#0B3D2E]/20"
              : "text-muted-foreground hover:text-foreground hover:bg-card"
              }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Cards List */}
      {loading ? (
        <PageLoadingSkeleton />
      ) : filtered.length === 0 ? (
        <div className="bg-card/50 backdrop-blur-xl border border-border rounded-[2.5rem] py-32 text-center shadow-lg shadow-black/5 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Calendar className="w-12 h-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">{t.reader.noSessionsFound}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">{''}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filtered.map((session, idx) => {
            const st = STATUS[session.status as keyof typeof STATUS] || STATUS.pending
            const isExpanded = expandedId === session.id
            const isCancelled = session.status === "cancelled"
            const isCompleted = session.status === "completed"
            const isActive = !isCancelled && !isCompleted
            const hasLink = !!session.meeting_link
            const pendingReqs = pendingRequests[session.id] || []

            return (
              <div key={session.id} className={`group relative bg-card/80 backdrop-blur-sm border rounded-[2rem] transition-all duration-500 ease-out
                ${isExpanded ? 'border-[#0B3D2E]/30 shadow-2xl shadow-[#0B3D2E]/10 z-10 scale-[1.01]' : 'border-border shadow-sm hover:border-[#0B3D2E]/20 hover:shadow-xl hover:-translate-y-1'}`}>
                
                {/* Status indicator line */}
                <div className={`absolute top-0 bottom-0 left-0 w-2 rounded-l-[2rem] transition-colors duration-500 ${st.color.split(' ')[0]} ${isExpanded ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />

                {/* Card Header (Clickable) */}
                <div
                  className={`p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer relative z-10 transition-all ${isCompleted ? 'grayscale-[0.4] opacity-80 hover:grayscale-0 hover:opacity-100' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                >
                  <div className="flex items-center gap-6 ml-2">
                    <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center shrink-0 border-2 font-black text-2xl shadow-sm transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3
                      ${isActive ? avatarColors[idx % avatarColors.length] : 'bg-muted border-border text-muted-foreground'}`}>
                      {(session.student_name || ('')).charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-[#0B3D2E] transition-colors">{session.student_name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${st.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot} animate-pulse`} />
                          {st.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground font-medium">
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-xl border border-border/50">
                          <Calendar className="w-4 h-4 text-[#D4A843]" />
                          {new Date(session.slot_start).toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </span>
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-xl border border-border/50">
                          <Clock className="w-4 h-4 text-[#0B3D2E] dark:text-[#D4A843]/60" />
                          {new Date(session.slot_start).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                          {" - "}
                          {new Date(session.slot_end).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 self-end md:self-auto">
                     {!hasLink && isActive && session.status !== "pending" && (
                       <div className="px-4 py-2 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                         <AlertCircle className="w-4 h-4" />
                         {''}
                       </div>
                     )}
                    <a
                      href={`/reader/sessions/${session.id}`}
                      onClick={(e) => e.stopPropagation()}
                      title={''}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
                    >
                      <ArrowUpRight className="w-5 h-5" />
                    </a>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-primary/10 text-primary' : 'group-hover:bg-primary/5 group-hover:text-primary'}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Pending Reschedule Request from Student */}
                {pendingReqs.length > 0 && (
                  <div className="mx-6 md:mx-8 mb-6 relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 rounded-[1.5rem] p-6 shadow-inner animate-in fade-in slide-in-from-top-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-amber-500/20 rounded-xl">
                           <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                        </div>
                        <p className="text-base font-bold text-amber-900 dark:text-amber-100">{''}</p>
                      </div>
                      {pendingReqs.map(req => (
                        <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white/60 dark:bg-black/20 backdrop-blur-md p-5 rounded-2xl border border-amber-500/20 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium mb-1">{''}</p>
                              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                {new Date(req.proposed_slot_start).toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "long", month: "long", day: "numeric" })}
                                <span className="text-amber-500">•</span>
                                {new Date(req.proposed_slot_start).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3 w-full md:w-auto">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRespondToStudentRequest(session.id, req.id, "accept"); }}
                              className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all hover:-translate-y-0.5"
                            >
                              {''}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRespondToStudentRequest(session.id, req.id, "reject"); }}
                              className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-card text-muted-foreground border border-border rounded-xl text-sm font-bold hover:bg-muted hover:text-foreground transition-all"
                            >
                              {''}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expanded Content Details */}
                {isExpanded && (
                  <div className="border-t border-border/50 bg-gradient-to-b from-muted/10 to-transparent p-6 md:p-8 space-y-8 animate-in slide-in-from-top-4 fade-in duration-300 relative z-0">

                    {/* Grid for Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                      {/* Meeting Link Section */}
                      <div className="bg-card/50 backdrop-blur-md p-6 rounded-[1.5rem] border border-border shadow-sm flex flex-col group/link hover:border-primary/20 transition-colors">
                        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-primary" />
                          {t.reader.meetingLinkLabel}
                        </h4>
                        
                        <div className="flex-1 flex flex-col justify-center gap-4">
                          {isActive && (
                            <a
                              href={`/reader/sessions/${session.id}/live`}
                              className="w-full relative overflow-hidden flex items-center justify-center gap-3 bg-[#0B3D2E] hover:bg-[#082e23] text-white px-6 py-4 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-[#0B3D2E]/20 hover:-translate-y-0.5 group/btn"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                              <Video className="w-5 h-5" />
                              {''}
                            </a>
                          )}
                          
                          {isActive && <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground uppercase tracking-widest"><div className="h-px bg-border flex-1" />{''}<div className="h-px bg-border flex-1" /></div>}

                          {isCompleted ? (
                            <div className="flex items-center gap-4 bg-muted/50 rounded-2xl p-5 border border-border/50">
                              <div className="p-3 bg-muted rounded-xl">
                                <VideoOff className="w-5 h-5 text-muted-foreground shrink-0" />
                              </div>
                              <p className="text-sm font-bold text-muted-foreground">{t.reader.linkExpired}</p>
                            </div>
                          ) : hasLink ? (
                            <div className="space-y-4">
                              <div className="flex items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-2 pr-4 rtl:pr-2 rtl:pl-4 focus-within:ring-2 ring-emerald-500/20 transition-all">
                                <div className="p-2.5 bg-emerald-500/10 rounded-xl mr-3 rtl:mr-0 rtl:ml-3">
                                  <Video className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                </div>
                                <input
                                  className="w-full border-none bg-transparent p-0 text-sm font-bold text-emerald-700 dark:text-emerald-400 focus:ring-0 focus:outline-none"
                                  readOnly
                                  value={session.meeting_link || ""}
                                />
                                <button
                                  className="rounded-xl p-2.5 border border-emerald-500/20 bg-white dark:bg-card hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 transition-colors shadow-sm"
                                  onClick={() => handleCopy(session.id, session.meeting_link || "")}
                                >
                                  {copiedId === session.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                              <a
                                href={session.meeting_link!.startsWith('http') ? session.meeting_link! : `https://${session.meeting_link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-card border-2 border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-6 py-4 rounded-2xl text-sm font-bold transition-all shadow-sm"
                              >
                                {''}
                              </a>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              <div className="flex w-full items-center rounded-2xl border-2 border-border bg-card px-4 py-2.5 focus-within:border-[#0B3D2E] focus-within:ring-4 focus-within:ring-[#0B3D2E]/10 transition-all shadow-sm">
                                <Link2 className="w-5 h-5 text-muted-foreground mr-3 rtl:mr-0 rtl:ml-3" />
                                <input
                                  className="w-full h-10 border-none bg-transparent p-0 text-sm placeholder:text-muted-foreground focus:ring-0 focus:outline-none text-foreground font-semibold"
                                  placeholder={t.reader.pasteMeetingLinkPlaceholder}
                                  value={meetingLinks[session.id] || ""}
                                  onChange={(e) => setMeetingLinks({ ...meetingLinks, [session.id]: e.target.value })}
                                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveLink(session.id) }}
                                />
                              </div>
                              <button
                                onClick={() => handleSaveLink(session.id)}
                                disabled={!meetingLinks[session.id] || savingLink === session.id}
                                className="w-full h-12 rounded-2xl bg-[#0B3D2E] text-white font-bold hover:bg-[#082e23] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5"
                              >
                                {savingLink === session.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                {''}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Controls Section */}
                      <div className="bg-card/50 backdrop-blur-md p-6 rounded-[1.5rem] border border-border shadow-sm flex flex-col group/controls hover:border-primary/20 transition-colors">
                        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          {''}
                        </h4>
                        <div className="flex-1 flex flex-col justify-center gap-4">
                          <a
                            href={isCompleted ? undefined : `/reader/chat?with=${session.student_id}`}
                            className={`w-full flex items-center justify-center gap-3 rounded-2xl border-2 px-6 py-4 text-sm font-bold transition-all ${isCompleted
                              ? "border-transparent bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
                              : "border-[#D4A843]/30 bg-gradient-to-r from-[#D4A843]/5 to-transparent text-foreground hover:border-[#D4A843] shadow-sm hover:shadow-md hover:-translate-y-0.5"
                              }`}
                          >
                            <MessageSquare className={`w-5 h-5 ${isCompleted ? 'text-muted-foreground' : 'text-[#D4A843]'}`} />
                            {t.reader.contactBtn}
                          </a>

                          <div className="flex gap-4">
                            {!isCompleted && session.status !== "cancelled" && (
                              <button
                                onClick={() => setRescheduleSession(session)}
                                className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card text-muted-foreground px-4 py-4 text-sm font-bold hover:bg-muted hover:text-foreground transition-all"
                              >
                                <Calendar className="w-4 h-4" />
                                {''}
                              </button>
                            )}
                          </div>
                          
                          <div className={`mt-auto p-4 rounded-2xl border-2 transition-colors ${isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/30 border-border'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${isCompleted ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                                  <Check className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="block text-sm font-bold text-foreground">{''}</span>
                                  <span className="block text-xs font-medium text-muted-foreground mt-0.5">{''}</span>
                                </div>
                              </div>
                              <Switch
                                checked={isCompleted}
                                onCheckedChange={() => handleToggleStatus(session.id, isCompleted)}
                                className="data-[state=checked]:bg-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Comment Box */}
                    <div className="bg-card/50 backdrop-blur-md p-6 md:p-8 rounded-[1.5rem] border border-border shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                          <MessageSquare className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-foreground">{''}</h4>
                          <p className="text-xs font-medium text-muted-foreground mt-1">{''}</p>
                        </div>
                      </div>
                      <CommentBox bookingId={session.id} locale={locale} />
                    </div>

                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      </>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleSession} onOpenChange={() => setRescheduleSession(null)}>
        <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-border/50 shadow-2xl">
          <div className="bg-gradient-to-br from-card to-muted/20 p-6 md:p-8">
            <DialogHeader className="mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-xl font-bold">{''}</DialogTitle>
            </DialogHeader>
            {rescheduleSession && (
              <div className="space-y-5">
                <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                    {(rescheduleSession.student_name || ('')).charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{''}</p>
                    <p className="text-sm font-bold text-foreground">{rescheduleSession.student_name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> {''}
                    </label>
                    <input
                      type="date"
                      value={proposedDate}
                      onChange={e => setProposedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full h-12 border-2 border-border bg-card rounded-xl px-4 text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> {''}
                    </label>
                    <input
                      type="time"
                      value={proposedTime}
                      onChange={e => setProposedTime(e.target.value)}
                      className="w-full h-12 border-2 border-border bg-card rounded-xl px-4 text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    />
                  </div>
                </div>
                
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-200 leading-relaxed">
                    {''}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter className="mt-8 gap-3 sm:gap-0">
              <Button variant="ghost" className="rounded-xl font-bold hover:bg-muted" onClick={() => setRescheduleSession(null)}>{''}</Button>
              <Button
                onClick={handleRescheduleSubmit}
                disabled={!proposedDate || !proposedTime || submittingReschedule}
                className="rounded-xl bg-[#0B3D2E] text-white font-bold hover:bg-[#082e23] px-8 h-11"
              >
                {submittingReschedule ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {''}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CommentBox({ bookingId, locale }: { bookingId: string, locale: string }) {
  const { t } = useI18n()
  const reader = (t as any).reader as Record<string, string> | undefined
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

  const isAr = locale === "ar"

  return (
    <div className="space-y-6">
      {comments.length > 0 && (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-2">
          {comments.map((c, i) => (
            <div key={c.id} className="group flex flex-col bg-card border border-border/50 rounded-[1.5rem] rounded-tl-sm p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                    {c.author_name.charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-foreground">{c.author_name}</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full group-hover:bg-muted transition-colors">
                  <Clock className="w-3 h-3" />
                  {new Date(c.created_at).toLocaleString(locale === "ar" ? "ar-SA" : "en-US", { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed font-medium pl-8 rtl:pl-0 rtl:pr-8">{c.comment_text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="relative group/input mt-4">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500" />
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder={''}
          className="relative w-full border-2 border-border bg-card rounded-2xl pl-16 pr-6 rtl:pr-16 rtl:pl-6 py-4 text-sm font-medium text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground transition-all shadow-sm outline-none"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="absolute left-2.5 top-2.5 bottom-2.5 rtl:right-2.5 rtl:left-auto px-5 bg-[#0B3D2E] text-white rounded-xl text-sm font-bold hover:bg-[#082e23] disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0 shadow-md shadow-[#0B3D2E]/20"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              <span className="hidden sm:inline">{''}</span>
              <Send className="w-4 h-4 rtl:rotate-180" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
