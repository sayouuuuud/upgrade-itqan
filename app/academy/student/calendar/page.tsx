'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Calendar as CalendarIcon, ChevronRight, ChevronLeft,
  Clock, Video, FileText, CheckCircle, BookOpen,
  Loader2, Sparkles, LayoutDashboard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string
  title: string
  date: string          // YYYY-MM-DD
  time: string          // HH:mm
  type: 'live_session' | 'assignment_deadline' | 'lesson'
  course: string
  course_id?: string
  link?: string
  status?: string
  scheduled_at?: string
  meta?: Record<string, any>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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

  const today = todayLocal()
  const getEventsForDate = (d: string) => events.filter(e => e.date === d)
  const selectedEvents   = getEventsForDate(selectedDate)
  const todayEvents      = getEventsForDate(today)
  const todaySessions    = todayEvents.filter(e => e.type === 'live_session' || e.type === 'lesson')
  const todayTasks       = todayEvents.filter(e => e.type === 'assignment_deadline')

  const year = currentDate.getFullYear()
  const mon  = currentDate.getMonth()
  const daysInMonth    = new Date(year, mon + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, mon, 1).getDay()

  const monthNamesAr = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  const monthNamesEn = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const dayNamesAr   = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
  const dayNamesEn   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  const monthName = isAr ? monthNamesAr[mon] : monthNamesEn[mon]
  const dayNames  = isAr ? dayNamesAr : dayNamesEn

  const prevMonth = () => setCurrentDate(new Date(year, mon - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, mon + 1, 1))

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

  const dotColour = (type: CalendarEvent['type']) =>
    type === 'live_session' ? 'bg-blue-500' :
    type === 'lesson' ? 'bg-purple-500' : 'bg-rose-500'

  const iconStyles = (type: CalendarEvent['type']) =>
    type === 'live_session' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
    type === 'lesson' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' : 
    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'

  const animationProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' }
  } as const

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Page header ── */}
      <motion.div {...animationProps} className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full -z-10 pointer-events-none" />
        
        <div className="space-y-3">
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase backdrop-blur-sm",
            isAr ? "tracking-normal" : "tracking-wider"
          )}>
            <Sparkles className="w-4 h-4" />
            {isAr ? 'التقويم الأكاديمي' : 'Academic Calendar'}
          </div>
          <h1 className={cn(
            "text-4xl lg:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 py-2 leading-relaxed",
            isAr ? "tracking-normal" : "tracking-tight"
          )}>
            {isAr ? 'التقويم والمواعيد' : 'Calendar & Schedule'}
          </h1>
          <p className="text-muted-foreground font-medium max-w-xl">
            {isAr ? 'نظم وقتك وتابع جلساتك ومهامك الأكاديمية بكل سهولة واحترافية.' : 'Organize your time and track your academic sessions and tasks with ease and professionalism.'}
          </p>
        </div>
      </motion.div>

      {/* ── Top summary cards ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* Today's sessions */}
        <Card className="border-0 shadow-xl shadow-blue-900/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="p-5 border-b border-border/50 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">{isAr ? 'جلسات اليوم' : "Today's sessions"}</h3>
            </div>
            <span className="flex items-center justify-center w-8 h-8 font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
              {todaySessions.length}
            </span>
          </div>
          <CardContent className="p-5 relative">
            {todaySessions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center font-medium">
                {isAr ? 'لا توجد جلسات اليوم، وقت رائع للمراجعة!' : 'No sessions today, great time for a review!'}
              </p>
            ) : (
              <ul className="space-y-3">
                {todaySessions.map((ev, i) => {
                  const sessionId = ev.id.replace(/^session-/, '').replace(/^lesson-/, '')
                  return (
                    <motion.li 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (i * 0.1) }}
                      key={ev.id} 
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-border/50 hover:border-blue-500/30 transition-all hover:shadow-md"
                    >
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={ev.id.startsWith('session-') ? `/academy/student/sessions/${sessionId}` : '#'}
                          className="text-sm font-bold text-foreground truncate block hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {ev.title}
                        </Link>
                        <span dir="ltr" className="text-xs font-bold text-muted-foreground">{ev.time}</span>
                      </div>
                      {ev.link && (
                        <a href={ev.link} target="_blank" rel="noreferrer"
                           className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-transform hover:scale-105 active:scale-95 shrink-0">
                          {isAr ? 'انضمام' : 'Join'}
                        </a>
                      )}
                    </motion.li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Today's tasks */}
        <Card className="border-0 shadow-xl shadow-rose-900/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="p-5 border-b border-border/50 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">{isAr ? 'مهام اليوم' : "Today's tasks"}</h3>
            </div>
            <span className="flex items-center justify-center w-8 h-8 font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full">
              {todayTasks.length}
            </span>
          </div>
          <CardContent className="p-5 relative">
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center font-medium">
                {isAr ? 'لا توجد مهام مستحقة اليوم، عمل ممتاز!' : 'No tasks due today, great job!'}
              </p>
            ) : (
              <ul className="space-y-3">
                {todayTasks.map((ev, i) => {
                  const isDone = ev.status === 'submitted' || ev.status === 'graded'
                  return (
                    <motion.li 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (i * 0.1) }}
                      key={ev.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl border transition-all hover:shadow-md",
                        isDone 
                          ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-500/20" 
                          : "bg-white dark:bg-slate-800 shadow-sm border-border/50 hover:border-rose-500/30"
                      )}
                    >
                      <button
                        onClick={() => !isDone && markTaskDone(ev.id)}
                        disabled={isDone}
                        className={cn(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                          isDone 
                            ? "bg-emerald-500 border-emerald-500 text-white" 
                            : "border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-500/10"
                        )}
                      >
                        {isDone && <CheckCircle className="w-4 h-4" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          "text-sm font-bold block truncate transition-colors",
                          isDone ? "line-through text-muted-foreground" : "text-foreground"
                        )}>
                          {ev.title.replace(/^تسليم:\s*/, '')}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground block truncate">
                          {ev.course}
                        </span>
                      </div>
                    </motion.li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Calendar Grid Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-8"
        >
          <Card className="border-0 shadow-xl shadow-slate-900/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
            <div className="p-6 sm:p-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground">{monthName}</h2>
                <p className="text-muted-foreground font-bold">{year}</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all h-10 w-10">
                  {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </Button>
                <div className="w-[1px] h-6 bg-border mx-1" />
                <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all h-10 w-10">
                  {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            <CardContent className="p-6 sm:p-8 pt-0">
              <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-4">
                {dayNames.map(d => (
                  <div 
                    key={d} 
                    className={cn(
                      "text-center font-bold text-xs sm:text-sm text-muted-foreground uppercase",
                      isAr ? "tracking-normal" : "tracking-widest"
                    )}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-32">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-100 dark:border-blue-900/30" />
                    <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin absolute inset-0" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2 sm:gap-4">
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`e-${i}`} className="aspect-square rounded-2xl bg-slate-50/50 dark:bg-slate-800/20" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day     = i + 1
                    const dateStr = `${year}-${String(mon + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const dayEvs  = getEventsForDate(dateStr)
                    const isSel   = selectedDate === dateStr
                    const isToday = dateStr === today

                    return (
                      <button 
                        key={day} 
                        onClick={() => setSelectedDate(dateStr)}
                        className={cn(
                          "aspect-square relative rounded-2xl border flex flex-col items-center pt-3 px-1 transition-all duration-300 group",
                          isSel
                            ? "border-blue-500 bg-gradient-to-b from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 scale-[1.05] z-10"
                            : "border-transparent bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700",
                          isToday && !isSel && "ring-2 ring-blue-500/50 ring-offset-2 ring-offset-background"
                        )}
                      >
                        <span className={cn(
                          "text-sm sm:text-lg font-black transition-colors duration-300",
                          isSel ? "text-white" : "text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400"
                        )}>
                          {day}
                        </span>
                        
                        {dayEvs.length > 0 && (
                          <div className="mt-auto mb-3 flex flex-wrap gap-1 justify-center px-1">
                            {dayEvs.slice(0, 3).map(ev => (
                              <span 
                                key={ev.id} 
                                className={cn(
                                  "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors duration-300",
                                  isSel ? "bg-white/90" : dotColour(ev.type)
                                )} 
                              />
                            ))}
                            {dayEvs.length > 3 && (
                              <span className={cn(
                                "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors duration-300",
                                isSel ? "bg-white/50" : "bg-slate-300 dark:bg-slate-600"
                              )} />
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Selected Day Details Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-4"
        >
          <Card className="border-0 shadow-xl shadow-slate-900/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] overflow-hidden sticky top-6 flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-border/50 relative overflow-hidden bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                <CalendarIcon className="w-32 h-32 text-foreground rotate-12" />
              </div>
              <p className={cn(
                "text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2 relative z-10 flex items-center gap-2",
                isAr ? "tracking-normal" : "tracking-widest"
              )}>
                <LayoutDashboard className="w-4 h-4" />
                {isAr ? 'تفاصيل اليوم' : 'Day Details'}
              </p>
              <h3 className="text-3xl font-black text-foreground relative z-10">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString(
                  isAr ? 'ar-SA' : 'en-US',
                  { weekday: 'long', day: 'numeric', month: 'long' }
                )}
              </h3>
            </div>

            <CardContent className="p-0 overflow-y-auto flex-1">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="p-12 flex items-center justify-center"
                  >
                    <div className="w-8 h-8 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                  </motion.div>
                ) : selectedEvents.length === 0 ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="p-16 text-center flex flex-col items-center"
                  >
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                      <CalendarIcon className="w-10 h-10 text-slate-400" />
                    </div>
                    <p className="font-bold text-lg text-foreground mb-2">{isAr ? 'يوم حر!' : 'Free day!'}</p>
                    <p className="text-sm text-muted-foreground">{isAr ? 'لا توجد أحداث أو مهام مجدولة في هذا اليوم.' : 'No events or tasks scheduled for this day.'}</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="content"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="divide-y divide-border/50"
                  >
                    {selectedEvents.map((ev, i) => {
                      const isToday  = selectedDate === today
                      const sessionId = ev.id.replace(/^session-/, '').replace(/^lesson-/, '')
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          key={ev.id} 
                          className="p-6 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
                        >
                          <div className="flex items-start gap-4">
                            <div className={cn("mt-1 p-3 rounded-2xl shrink-0 border", iconStyles(ev.type))}>
                              {ev.type === 'live_session'        && <Video className="w-5 h-5" />}
                              {ev.type === 'assignment_deadline' && <FileText className="w-5 h-5" />}
                              {ev.type === 'lesson'              && <BookOpen className="w-5 h-5" />}
                            </div>
                            <div className="space-y-1.5 flex-1">
                              <h4 className="font-bold text-foreground text-lg leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{ev.title}</h4>
                              <p className="text-sm font-medium text-muted-foreground">{ev.course}</p>
                              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mt-3 bg-slate-100 dark:bg-slate-800 w-fit px-2.5 py-1.5 rounded-lg">
                                <Clock className="w-4 h-4" />
                                <span dir="ltr">{ev.time}</span>
                              </div>
                            </div>
                          </div>

                          {/* Live session actions */}
                          {ev.type === 'live_session' && (
                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                              {ev.link && isToday ? (
                                <a href={ev.link} target="_blank" rel="noreferrer"
                                   className="flex-1 inline-flex items-center justify-center font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl h-12 px-4 group/btn">
                                  <Video className={cn("w-4 h-4 transition-transform group-hover/btn:scale-110", isAr ? 'ml-2' : 'mr-2')} />
                                  {isAr ? 'انضمام الآن' : 'Join Now'}
                                </a>
                              ) : (
                                <Button disabled className="flex-1 font-bold rounded-xl h-12 bg-slate-100 dark:bg-slate-800 text-muted-foreground border-0">
                                  <Video className={cn("w-4 h-4 opacity-50", isAr ? 'ml-2' : 'mr-2')} />
                                  {ev.link ? (isAr ? 'متاح يوم الجلسة' : 'Available on session day') : (isAr ? 'الرابط غير متوفر' : 'Link not available')}
                                </Button>
                              )}
                              <Button asChild variant="outline" className="font-bold rounded-xl h-12 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                                <Link href={`/academy/student/sessions/${sessionId}`}>
                                  {isAr ? 'التفاصيل' : 'Details'}
                                </Link>
                              </Button>
                            </div>
                          )}

                          {/* Assignment actions */}
                          {ev.type === 'assignment_deadline' && (
                            <div className="mt-6">
                              <Button asChild variant="outline"
                                      className="w-full font-bold rounded-xl h-12 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                                <Link href={`/academy/student/tasks/${ev.id.replace(/^task-/, '')}/submit`}>
                                  <FileText className={cn("w-4 h-4", isAr ? 'ml-2' : 'mr-2')} />
                                  {isAr ? 'تسليم الواجب' : 'Submit Assignment'}
                                </Link>
                              </Button>
                            </div>
                          )}

                          {/* Lesson actions */}
                          {ev.type === 'lesson' && (
                            <div className="mt-6">
                              <Button asChild className="w-full font-bold rounded-xl h-12 bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-95">
                                <Link href={`/academy/student/courses/${ev.course_id}/lesson/${ev.id.replace(/^lesson-/, '')}`}>
                                  <BookOpen className={cn("w-4 h-4", isAr ? 'ml-2' : 'mr-2')} />
                                  {isAr ? 'فتح الدرس' : 'Open Lesson'}
                                </Link>
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
