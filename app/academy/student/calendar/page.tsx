'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Calendar as CalendarIcon, ChevronRight, ChevronLeft,
  Clock, Video, FileText, CheckCircle, BookOpen,
  Loader2, Target, BookMarked
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string
  title: string
  date: string          // YYYY-MM-DD (Riyadh TZ from server, converted to local on client)
  time: string          // HH:mm
  type: 'live_session' | 'assignment_deadline' | 'lesson'
  course: string
  course_id?: string
  link?: string
  status?: string
  scheduled_at?: string // raw UTC ISO — used by client to convert to local TZ
  meta?: Record<string, any>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert any Date to a local YYYY-MM-DD string (respects user's OS timezone) */
function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Today in local timezone as YYYY-MM-DD */
function todayLocal(): string {
  return toLocalDate(new Date())
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AcademyCalendarPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(todayLocal())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch events whenever the displayed month changes ──────────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

    fetch(`/api/academy/student/calendar/events?month=${month}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.error) {
          setError(data.error)
          return
        }
        // Convert server's scheduled_at (UTC) to the user's local timezone
        const processed: CalendarEvent[] = (data.events || []).map((ev: CalendarEvent) => {
          if (ev.scheduled_at) {
            const d = new Date(ev.scheduled_at)
            return {
              ...ev,
              date: toLocalDate(d),
              time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            }
          }
          return ev
        })
        setEvents(processed)
      })
      .catch(() => {
        if (!cancelled) setError('فشل تحميل الأحداث')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [currentDate.getFullYear(), currentDate.getMonth()])

  // ── Derived data ───────────────────────────────────────────────────────────
  const today = todayLocal()
  const getEventsForDate = (d: string) => events.filter(e => e.date === d)
  const selectedEvents   = getEventsForDate(selectedDate)
  const todayEvents      = getEventsForDate(today)
  const todaySessions    = todayEvents.filter(e => e.type === 'live_session' || e.type === 'lesson')
  const todayTasks       = todayEvents.filter(e => e.type === 'assignment_deadline')

  // ── Calendar grid data ─────────────────────────────────────────────────────
  const year = currentDate.getFullYear()
  const mon  = currentDate.getMonth()
  const daysInMonth    = new Date(year, mon + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, mon, 1).getDay() // 0=Sun

  const monthNamesAr = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                         'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  const monthNamesEn = ['January','February','March','April','May','June',
                         'July','August','September','October','November','December']
  const dayNamesAr   = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
  const dayNamesEn   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  const monthName = isAr ? monthNamesAr[mon] : monthNamesEn[mon]
  const dayNames  = isAr ? dayNamesAr : dayNamesEn

  const prevMonth = () => setCurrentDate(new Date(year, mon - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, mon + 1, 1))

  // ── Quick actions ──────────────────────────────────────────────────────────
  const markTaskDone = async (eventId: string) => {
    const taskId = eventId.replace(/^task-/, '')
    const res = await fetch(`/api/academy/student/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_done' }),
    }).catch(() => null)
    if (res?.ok) {
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, status: 'submitted' } : ev))
    }
  }

  // ── Event dot colour ───────────────────────────────────────────────────────
  const dotColour = (type: CalendarEvent['type']) =>
    type === 'live_session'         ? 'bg-blue-500'   :
    type === 'lesson'               ? 'bg-purple-500' : 'bg-red-500'

  const iconBg = (type: CalendarEvent['type']) =>
    type === 'live_session'         ? 'bg-blue-500/10 text-blue-500'    :
    type === 'lesson'               ? 'bg-purple-500/10 text-purple-500': 'bg-red-500/10 text-red-500'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Page header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <CalendarIcon className="w-4 h-4" />
            {isAr ? 'التقويم الأكاديمي' : 'Academic Calendar'}
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {isAr ? 'التقويم والمواعيد' : 'Calendar & Schedule'}
          </h1>
        </div>
      </div>

      {/* ── Top summary cards ── */}
      <div className="grid md:grid-cols-3 gap-4">

        {/* Today's sessions */}
        <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card">
          <div className="p-4 border-b border-border/50 flex items-center gap-2 bg-blue-500/5">
            <Video className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-sm">{isAr ? 'جلسات اليوم' : "Today's sessions"}</h3>
            <span className="ms-auto text-[11px] font-bold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
              {todaySessions.length}
            </span>
          </div>
          <CardContent className="p-3">
            {todaySessions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">
                {isAr ? 'لا توجد جلسات اليوم' : 'No sessions today'}
              </p>
            ) : (
              <ul className="space-y-2">
                {todaySessions.map(ev => {
                  const sessionId = ev.id.replace(/^session-/, '').replace(/^lesson-/, '')
                  return (
                    <li key={ev.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                      <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span dir="ltr" className="text-xs font-bold text-blue-500">{ev.time}</span>
                      <Link
                        href={ev.id.startsWith('session-') ? `/academy/student/sessions/${sessionId}` : '#'}
                        className="text-xs text-foreground truncate flex-1 hover:text-blue-600"
                      >
                        {ev.title}
                      </Link>
                      {ev.link && (
                        <a href={ev.link} target="_blank" rel="noreferrer"
                           className="text-[11px] font-bold text-blue-600 hover:underline shrink-0">
                          {isAr ? 'انضمام' : 'Join'}
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Today's tasks */}
        <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card">
          <div className="p-4 border-b border-border/50 flex items-center gap-2 bg-orange-500/5">
            <FileText className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-sm">{isAr ? 'مهام اليوم' : "Today's tasks"}</h3>
            <span className="ms-auto text-[11px] font-bold bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full">
              {todayTasks.length}
            </span>
          </div>
          <CardContent className="p-3">
            {todayTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">
                {isAr ? 'لا توجد مهام مستحقة اليوم' : 'No tasks due today'}
              </p>
            ) : (
              <ul className="space-y-2">
                {todayTasks.map(ev => {
                  const isDone = ev.status === 'submitted' || ev.status === 'graded'
                  return (
                    <li key={ev.id}
                        className={`flex items-center gap-2 p-2 rounded-lg ${isDone ? 'bg-emerald-500/10' : 'bg-muted/40'}`}>
                      <button
                        onClick={() => !isDone && markTaskDone(ev.id)}
                        disabled={isDone}
                        aria-label={isAr ? 'تأشير كمنجزة' : 'Mark done'}
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/40 hover:border-emerald-500'
                        }`}
                      >
                        {isDone && <CheckCircle className="w-3 h-3" />}
                      </button>
                      <span className={`text-xs flex-1 truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {ev.title.replace(/^تسليم:\s*/, '')}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ── Mobile list view ── */}
      <div className="block md:hidden space-y-4">
        <Card className="border border-border/50 shadow-sm rounded-3xl overflow-hidden bg-card">
          <div className="p-5 border-b border-border/50 flex justify-between items-center bg-muted/20">
            <h2 className="text-lg font-bold text-foreground">{monthName} {year}</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-xl bg-card border-border h-9 w-9">
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-xl bg-card border-border h-9 w-9">
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-10 text-center flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
              </div>
            ) : error ? (
              <div className="p-10 text-center text-red-500 text-sm">{error}</div>
            ) : (() => {
              const monthEvents = events
                .filter(ev => ev.date.startsWith(`${year}-${String(mon + 1).padStart(2, '0')}`))
                .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

              if (monthEvents.length === 0) return (
                <div className="p-10 text-center text-muted-foreground flex flex-col items-center">
                  <CalendarIcon className="w-10 h-10 mb-3 opacity-20" />
                  <p className="font-medium text-sm">{isAr ? 'لا توجد أحداث هذا الشهر' : 'No events this month'}</p>
                </div>
              )

              return (
                <div className="divide-y divide-border/50">
                  {monthEvents.map(ev => {
                    const evDate = new Date(ev.date + 'T12:00:00') // noon to avoid DST issues
                    return (
                      <button key={ev.id} onClick={() => setSelectedDate(ev.date)}
                              className="w-full text-start p-4 transition-colors hover:bg-muted/30">
                        <div className="flex items-start gap-3">
                          <div className={`shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center border ${
                            ev.date === today ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/40 border-border text-foreground'
                          }`}>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                              {evDate.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short' })}
                            </span>
                            <span className="text-xl font-black leading-none">{evDate.getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${iconBg(ev.type)}`}>
                                {ev.type === 'live_session'      && <Video className="w-3.5 h-3.5" />}
                                {ev.type === 'assignment_deadline' && <FileText className="w-3.5 h-3.5" />}
                                {ev.type === 'lesson'            && <BookOpen className="w-3.5 h-3.5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-foreground text-sm leading-tight truncate">{ev.title}</h4>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{ev.course}</p>
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground mt-1.5">
                                  <Clock className="w-3 h-3" />
                                  <span dir="ltr">{ev.time}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* ── Desktop: grid + detail panel ── */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Calendar grid */}
        <div className="lg:col-span-8">
          <Card className="border border-border/50 shadow-sm rounded-3xl overflow-hidden bg-card">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/20">
              <h2 className="text-2xl font-bold text-foreground">{monthName} {year}</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-xl bg-card border-border">
                  {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-xl bg-card border-border">
                  {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            <CardContent className="p-6">
              {/* Day names row */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map(d => (
                  <div key={d} className="text-center font-bold text-sm text-muted-foreground pb-2">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {/* Empty cells */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`e-${i}`} className="aspect-square" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day     = i + 1
                    const dateStr = `${year}-${String(mon + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const dayEvs  = getEventsForDate(dateStr)
                    const isSel   = selectedDate === dateStr
                    const isToday = dateStr === today

                    return (
                      <button key={day} onClick={() => setSelectedDate(dateStr)}
                              className={`aspect-square relative rounded-2xl border flex flex-col items-center justify-start pt-2 px-1 transition-all
                                ${isSel
                                  ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 scale-105 z-10'
                                  : 'border-border/50 bg-card hover:bg-muted/50 hover:border-primary/30'}
                                ${isToday && !isSel ? 'ring-2 ring-primary ring-inset' : ''}
                              `}>
                        <span className={`text-sm font-bold ${isSel ? 'text-primary' : 'text-foreground'}`}>{day}</span>
                        {dayEvs.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1 justify-center px-1">
                            {dayEvs.slice(0, 4).map(ev => (
                              <span key={ev.id} className={`w-2 h-2 rounded-full ${dotColour(ev.type)}`} />
                            ))}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Selected day detail panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border border-border/50 shadow-sm rounded-3xl overflow-hidden bg-card sticky top-6">
            <div className="p-6 border-b border-border/50 bg-primary/5 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <CalendarIcon className="w-24 h-24 text-primary transform rotate-12" />
              </div>
              <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1 relative z-10">
                {isAr ? 'تفاصيل اليوم' : 'Day Details'}
              </p>
              <h3 className="text-2xl font-black text-foreground relative z-10">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString(
                  isAr ? 'ar-SA' : 'en-US',
                  { weekday: 'long', month: 'long', day: 'numeric' }
                )}
              </h3>
            </div>

            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : selectedEvents.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                  <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-medium">{isAr ? 'لا توجد أحداث في هذا اليوم' : 'No events on this day'}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {selectedEvents.map(ev => {
                    const isToday  = selectedDate === today
                    const sessionId = ev.id.replace(/^session-/, '').replace(/^lesson-/, '')
                    return (
                      <div key={ev.id} className="p-6 transition-colors hover:bg-muted/20">
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 p-2 rounded-xl shrink-0 ${iconBg(ev.type)}`}>
                            {ev.type === 'live_session'        && <Video className="w-5 h-5" />}
                            {ev.type === 'assignment_deadline' && <FileText className="w-5 h-5" />}
                            {ev.type === 'lesson'              && <BookOpen className="w-5 h-5" />}
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <h4 className="font-bold text-foreground text-lg leading-tight">{ev.title}</h4>
                            <p className="text-sm font-medium text-muted-foreground">{ev.course}</p>
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mt-2 bg-muted/50 w-fit px-2 py-1 rounded-lg">
                              <Clock className="w-3.5 h-3.5" />
                              <span dir="ltr">{ev.time}</span>
                            </div>
                          </div>
                        </div>

                        {/* Live session actions */}
                        {ev.type === 'live_session' && (
                          <div className="mt-5 flex flex-col sm:flex-row gap-2">
                            {ev.link && isToday ? (
                              <a href={ev.link} target="_blank" rel="noreferrer"
                                 className="flex-1 inline-flex items-center justify-center font-bold shadow-md transition-all hover:scale-[1.02] active:scale-95 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-4">
                                <Video className={`w-4 h-4 ${isAr ? 'ml-2' : 'mr-2'}`} />
                                {isAr ? 'انضمام للجلسة الآن' : 'Join Session Now'}
                              </a>
                            ) : (
                              <Button disabled
                                      className="flex-1 font-bold rounded-xl h-12 bg-muted text-muted-foreground">
                                <Video className={`w-4 h-4 ${isAr ? 'ml-2' : 'mr-2'}`} />
                                {ev.link
                                  ? (isAr ? 'الرابط متاح في يوم الجلسة' : 'Link available on session day')
                                  : (isAr ? 'لم يضف المدرّس الرابط بعد' : 'Meeting link not added yet')}
                              </Button>
                            )}
                            <Button asChild variant="outline" className="font-bold rounded-xl h-12">
                              <Link href={`/academy/student/sessions/${sessionId}`}>
                                {isAr ? 'تفاصيل' : 'Details'}
                              </Link>
                            </Button>
                          </div>
                        )}

                        {/* Assignment actions */}
                        {ev.type === 'assignment_deadline' && (
                          <div className="mt-5">
                            <Button asChild variant="outline"
                                    className="w-full font-bold rounded-xl h-12 border-red-500/20 text-red-600 hover:bg-red-500/10">
                              <Link href={`/academy/student/tasks/${ev.id.replace(/^task-/, '')}/submit`}>
                                <FileText className={`w-4 h-4 ${isAr ? 'ml-2' : 'mr-2'}`} />
                                {isAr ? 'تسليم الواجب' : 'Submit Assignment'}
                              </Link>
                            </Button>
                          </div>
                        )}

                        {/* Lesson actions */}
                        {ev.type === 'lesson' && (
                          <div className="mt-5">
                            <Button asChild variant="outline" className="w-full font-bold rounded-xl h-12">
                              <Link href={`/academy/student/courses/${ev.course_id}/lesson/${ev.id.replace(/^lesson-/, '')}`}>
                                <BookOpen className={`w-4 h-4 ${isAr ? 'ml-2' : 'mr-2'}`} />
                                {isAr ? 'فتح الدرس' : 'Open Lesson'}
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
