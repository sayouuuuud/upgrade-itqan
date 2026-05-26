'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Calendar as CalendarIcon, ChevronRight, ChevronLeft,
  Clock, Video, FileText, Loader2, Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  type: 'live_session' | 'assignment_deadline' | 'booking' | 'lesson' | 'memorization_goal'
  course: string
  link?: string
  status?: string
  scheduled_at?: string
  meta?: Record<string, any>
}

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayLocal(): string {
  return toLocalDate(new Date())
}

interface RoleCalendarProps {
  apiUrl: string
  pageTitle: string
  pageBadge: string
  /** Whether to show "mark done" on tasks */
  showMarkDone?: boolean
}

export default function RoleCalendar({ apiUrl, pageTitle, pageBadge, showMarkDone }: RoleCalendarProps) {
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

    fetch(`${apiUrl}?month=${month}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.error) { setError(data.error); return }
        const processed: CalendarEvent[] = (data.events || []).map((ev: CalendarEvent) => {
          if (ev.scheduled_at) {
            const d = new Date(ev.scheduled_at)
            return { ...ev, date: toLocalDate(d), time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) }
          }
          return ev
        })
        setEvents(processed)
      })
      .catch(() => { if (!cancelled) setError('فشل تحميل الأحداث') })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [currentDate.getFullYear(), currentDate.getMonth(), apiUrl])

  const today = todayLocal()
  const getEventsForDate = (d: string) => events.filter(e => e.date === d)
  const selectedEvents = getEventsForDate(selectedDate)
  const todayEvents = getEventsForDate(today)
  const todaySessions = todayEvents.filter(e => e.type === 'live_session' || e.type === 'lesson' || e.type === 'booking')
  const todayTasks = todayEvents.filter(e => e.type === 'assignment_deadline')

  const year = currentDate.getFullYear()
  const mon = currentDate.getMonth()
  const daysInMonth = new Date(year, mon + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, mon, 1).getDay()

  const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const monthName = isAr ? monthNamesAr[mon] : monthNamesEn[mon]
  const dayNames = isAr ? dayNamesAr : dayNamesEn

  const prevMonth = () => setCurrentDate(new Date(year, mon - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, mon + 1, 1))

  const dotColour = (type: CalendarEvent['type']) =>
    type === 'live_session' ? 'bg-blue-500' :
    type === 'booking' ? 'bg-emerald-500' :
    type === 'lesson' ? 'bg-purple-500' : 'bg-red-500'

  const iconBg = (type: CalendarEvent['type']) =>
    type === 'live_session' ? 'bg-blue-500/10 text-blue-500' :
    type === 'booking' ? 'bg-emerald-500/10 text-emerald-500' :
    type === 'lesson' ? 'bg-purple-500/10 text-purple-500' : 'bg-red-500/10 text-red-500'

  const typeIcon = (type: CalendarEvent['type']) => {
    if (type === 'live_session' || type === 'lesson') return <Video className="w-4 h-4" />
    if (type === 'booking') return <Users className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Page header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
          <CalendarIcon className="w-4 h-4" />
          {pageBadge}
        </div>
        <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
          {pageTitle}
        </h1>
      </div>

      {/* Top summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card">
          <div className="p-4 border-b border-border/50 flex items-center gap-2 bg-blue-500/5">
            <Video className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-sm">{isAr ? 'جلسات اليوم' : "Today's sessions"}</h3>
            <span className="ms-auto text-[11px] font-bold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">{todaySessions.length}</span>
          </div>
          <CardContent className="p-3">
            {todaySessions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">{isAr ? 'لا توجد جلسات اليوم' : 'No sessions today'}</p>
            ) : (
              <ul className="space-y-2">
                {todaySessions.map(ev => (
                  <li key={ev.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                    <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span dir="ltr" className="text-xs font-bold text-blue-500">{ev.time}</span>
                    <span className="text-xs text-foreground truncate flex-1">{ev.title}</span>
                    {ev.link && (
                      <a href={ev.link} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-blue-600 hover:underline shrink-0">{isAr ? 'انضمام' : 'Join'}</a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card">
          <div className="p-4 border-b border-border/50 flex items-center gap-2 bg-orange-500/5">
            <FileText className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-sm">{isAr ? 'مهام اليوم' : "Today's tasks"}</h3>
            <span className="ms-auto text-[11px] font-bold bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full">{todayTasks.length}</span>
          </div>
          <CardContent className="p-3">
            {todayTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">{isAr ? 'لا توجد مهام مستحقة اليوم' : 'No tasks due today'}</p>
            ) : (
              <ul className="space-y-2">
                {todayTasks.map(ev => (
                  <li key={ev.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                    <FileText className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span dir="ltr" className="text-xs font-bold text-orange-500">{ev.time}</span>
                    <span className="text-xs text-foreground truncate flex-1">{ev.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar grid + event list */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 border border-border/50 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronRight className="w-4 h-4 rtl:rotate-180" /></Button>
            <h2 className="font-bold text-base">{monthName} {year}</h2>
            <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronLeft className="w-4 h-4 rtl:rotate-180" /></Button>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${year}-${String(mon + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayEvents = getEventsForDate(dateStr)
                const isToday = dateStr === today
                const isSelected = dateStr === selectedDate

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all ${
                      isSelected ? 'bg-primary text-primary-foreground shadow-md' :
                      isToday ? 'bg-primary/10 text-primary' :
                      'hover:bg-muted'
                    }`}
                  >
                    {day}
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((ev, idx) => (
                          <span key={idx} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-primary-foreground' : dotColour(ev.type)}`} />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          {loading && (
            <div className="flex justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
        </Card>

        {/* Selected date events */}
        <Card className="border border-border/50 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="text-sm font-bold text-muted-foreground">
              {selectedDate === today ? (isAr ? 'أحداث اليوم' : "Today's Events") : selectedDate}
            </h3>
          </div>
          <CardContent className="p-3 max-h-96 overflow-y-auto">
            {error ? (
              <p className="text-xs text-destructive py-6 text-center">{error}</p>
            ) : selectedEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">{isAr ? 'لا توجد أحداث' : 'No events'}</p>
            ) : (
              <ul className="space-y-3">
                {selectedEvents.map(ev => (
                  <li key={ev.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                    <div className={`p-2 rounded-lg shrink-0 ${iconBg(ev.type)}`}>
                      {typeIcon(ev.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-bold truncate">{ev.title}</p>
                      <p className="text-[11px] text-muted-foreground">{ev.course}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span dir="ltr">{ev.time}</span>
                      </div>
                      {ev.link && (
                        <a href={ev.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline">
                          <Video className="w-3 h-3" /> {isAr ? 'رابط الجلسة' : 'Meeting link'}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
