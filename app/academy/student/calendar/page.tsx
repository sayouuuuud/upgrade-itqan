'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, MapPin, Clock, Video, FileText, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'

interface CalendarEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD format
  time: string
  type: 'live_session' | 'assignment_deadline' | 'review'
  course: string
  link?: string
}

const mockEvents: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'جلسة حية: الفقه الميسر',
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    type: 'live_session',
    course: 'الفقه الميسر - المستوى الأول',
    link: '#'
  },
  {
    id: 'e2',
    title: 'تسليم الواجب الثاني',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    time: '23:59',
    type: 'assignment_deadline',
    course: 'تلاوة وتجويد'
  },
  {
    id: 'e3',
    title: 'موعد مراجعة الحفظ',
    date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    time: '16:30',
    type: 'review',
    course: 'تلاوة وتجويد'
  }
]

export default function AcademyCalendarPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0])

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  
  // Adjust for week starting on Sunday (0) vs Monday. We'll stick to standard JS for now (0 = Sunday).
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const monthNamesAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
  const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  
  const dayNamesAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
  const dayNamesEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const monthName = isAr ? monthNamesAr[currentDate.getMonth()] : monthNamesEn[currentDate.getMonth()]
  const dayNames = isAr ? dayNamesAr : dayNamesEn

  const getEventsForDate = (dateStr: string) => mockEvents.filter(e => e.date === dateStr)

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <CalendarIcon className="w-4 h-4" />
            {isAr ? "التقويم الأكاديمي" : "Academic Calendar"}
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {isAr ? "التقويم والمواعيد" : "Calendar & Schedule"}
          </h1>
        </div>
      </div>

      {/* Mobile list view — visible only on small screens */}
      <div className="block md:hidden space-y-4">
        <Card className="border border-border/50 shadow-sm rounded-3xl overflow-hidden bg-card">
          <div className="p-5 border-b border-border/50 flex justify-between items-center bg-muted/20">
            <h2 className="text-lg font-bold text-foreground">
              {monthName} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth} className="rounded-xl bg-card border-border h-9 w-9">
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth} className="rounded-xl bg-card border-border h-9 w-9">
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <CardContent className="p-0">
            {(() => {
              const monthEvents = mockEvents
                .filter((ev) => {
                  const d = new Date(ev.date)
                  return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()
                })
                .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

              if (monthEvents.length === 0) {
                return (
                  <div className="p-10 text-center text-muted-foreground flex flex-col items-center">
                    <CalendarIcon className="w-10 h-10 mb-3 opacity-20" />
                    <p className="font-medium text-sm">{isAr ? "لا توجد أحداث هذا الشهر" : "No events this month"}</p>
                  </div>
                )
              }

              return (
                <div className="divide-y divide-border/50">
                  {monthEvents.map((ev) => {
                    const evDate = new Date(ev.date)
                    const isToday = ev.date === new Date().toISOString().split('T')[0]
                    return (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedDate(ev.date)}
                        className="w-full text-start p-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-start gap-3">
                          {/* Date badge */}
                          <div className={`shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center border ${
                            isToday ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/40 border-border text-foreground'
                          }`}>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                              {evDate.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short' })}
                            </span>
                            <span className="text-xl font-black leading-none">
                              {evDate.getDate()}
                            </span>
                          </div>

                          {/* Event info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                                ev.type === 'live_session' ? 'bg-blue-500/10 text-blue-500' :
                                ev.type === 'review' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                              }`}>
                                {ev.type === 'live_session' && <Video className="w-3.5 h-3.5" />}
                                {ev.type === 'assignment_deadline' && <FileText className="w-3.5 h-3.5" />}
                                {ev.type === 'review' && <CheckCircle className="w-3.5 h-3.5" />}
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

      <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Column */}
        <div className="lg:col-span-8">
          <Card className="border border-border/50 shadow-sm rounded-3xl overflow-hidden bg-card">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/20">
              <h2 className="text-2xl font-bold text-foreground">
                {monthName} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevMonth} className="rounded-xl bg-card border-border">
                  {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth} className="rounded-xl bg-card border-border">
                  {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center font-bold text-sm text-muted-foreground pb-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for start of month */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square rounded-2xl bg-transparent" />
                ))}
                
                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayEvents = getEventsForDate(dateStr)
                  const isSelected = selectedDate === dateStr
                  const isToday = dateStr === new Date().toISOString().split('T')[0]

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`
                        aspect-square relative rounded-2xl border flex flex-col items-center justify-start pt-2 px-1 transition-all
                        ${isSelected 
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 scale-105 z-10' 
                          : 'border-border/50 bg-card hover:bg-muted/50 hover:border-primary/30'
                        }
                        ${isToday && !isSelected ? 'ring-2 ring-primary ring-inset' : ''}
                      `}
                    >
                      <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {day}
                      </span>
                      
                      {dayEvents.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1 justify-center px-1">
                          {dayEvents.map(ev => (
                            <span 
                              key={ev.id} 
                              className={`w-2 h-2 rounded-full ${
                                ev.type === 'live_session' ? 'bg-blue-500' :
                                ev.type === 'review' ? 'bg-emerald-500' : 'bg-red-500'
                              }`} 
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Details Column */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border border-border/50 shadow-sm rounded-3xl overflow-hidden bg-card sticky top-6">
            <div className="p-6 border-b border-border/50 bg-primary/5 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <CalendarIcon className="w-24 h-24 text-primary transform rotate-12" />
              </div>
              <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1 relative z-10">
                {isAr ? "تفاصيل اليوم" : "Day Details"}
              </p>
              <h3 className="text-2xl font-black text-foreground relative z-10">
                {selectedDate && new Date(selectedDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric'})}
              </h3>
            </div>
            
            <CardContent className="p-0">
              {selectedEvents.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                  <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-medium">{isAr ? "لا توجد أحداث في هذا اليوم" : "No events on this day"}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {selectedEvents.map(ev => {
                    const isToday = selectedDate === new Date().toISOString().split('T')[0]
                    return (
                      <div key={ev.id} className="p-6 transition-colors hover:bg-muted/20">
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 p-2 rounded-xl shrink-0 ${
                            ev.type === 'live_session' ? 'bg-blue-500/10 text-blue-500' :
                            ev.type === 'review' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {ev.type === 'live_session' && <Video className="w-5 h-5" />}
                            {ev.type === 'assignment_deadline' && <FileText className="w-5 h-5" />}
                            {ev.type === 'review' && <CheckCircle className="w-5 h-5" />}
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

                        {ev.type === 'live_session' && ev.link && (
                          <div className="mt-5">
                            <Button className="w-full font-bold shadow-md transform transition-all hover:scale-[1.02] active:scale-95 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12" disabled={!isToday}>
                              <Video className={`w-4 h-4 ${isAr ? "ml-2" : "mr-2"}`} />
                              {isToday ? (isAr ? "انضمام للجلسة الآن" : "Join Session Now") : (isAr ? "الرابط سيتاح في موعد الجلسة" : "Link available at session time")}
                            </Button>
                          </div>
                        )}
                        {ev.type === 'assignment_deadline' && (
                          <div className="mt-5">
                            <Button variant="outline" className="w-full font-bold rounded-xl h-12 border-red-500/20 text-red-600 hover:bg-red-500/10">
                              <FileText className={`w-4 h-4 ${isAr ? "ml-2" : "mr-2"}`} />
                              {isAr ? "تسليم الواجب" : "Submit Assignment"}
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
