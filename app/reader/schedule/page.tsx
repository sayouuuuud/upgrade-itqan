"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Clock, Calendar as CalendarIcon, CheckCircle, Loader2, CalendarRange, Info } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useI18n } from "@/lib/i18n/context"
import { enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"


type Slot = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
  specific_date?: string
  is_recurring?: boolean
}

export default function ScheduleManagementPage() {
  const { t, locale } = useI18n()
  const dateLocale = locale === 'ar' ? ar : enUS
  const daysOfWeek = t.reader.days

  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)

  // UI State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // New Slot State
  const [newSlotPeriods, setNewSlotPeriods] = useState([{ id: 1, start: "09:00", end: "09:30" }])
  const [newSlotDays, setNewSlotDays] = useState<number[]>([]) // Days for recurring
  const [isRecurring, setIsRecurring] = useState(false)

  const [dateRange, setDateRange] = useState<any>()
  const [bulkTimes, setBulkTimes] = useState([{ id: 1, start: "09:00", end: "09:30" }])
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]) // Mon-Fri

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/reader/schedule")
        if (res.ok) {
          const data = await res.json()
          setSlots(data.slots || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleAddSlot = async () => {
    if (isRecurring && newSlotDays.length === 0) {
      alert(t.reader.applyOnDays)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        periods: newSlotPeriods.map(p => ({ startTime: p.start, endTime: p.end })),
        isRecurring: isRecurring,
        daysOfWeek: isRecurring ? newSlotDays : [selectedDate.getDay()],
        specificDate: isRecurring ? undefined : format(selectedDate, "yyyy-MM-dd")
      }

      const res = await fetch("/api/reader/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        const newSlots = data.slots || []
        setSlots([...slots, ...newSlots].sort((a, b) => {
          if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
          return a.start_time.localeCompare(b.start_time)
        }))
        setDialogOpen(false)
        setNewSlotPeriods([{ id: Date.now(), start: "09:00", end: "09:30" }])
        setNewSlotDays([])
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        const errData = await res.json()
        alert(errData.error || t.student.bookingError)
      }
    } catch {
      alert(t.student.serverError)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkAdd = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      alert(t.reader.selectPeriod)
      return
    }
    if (selectedDays.length === 0) {
      alert(t.reader.applyOnDays)
      return
    }

    setSubmitting(true)
    try {
      // Format as YYYY-MM-DD
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const res = await fetch("/api/reader/schedule/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: formatLocalDate(dateRange.from),
          endDate: formatLocalDate(dateRange.to),
          days: selectedDays,
          times: bulkTimes.map(t => ({ startTime: t.start, endTime: t.end }))
        })
      })

      if (res.ok) {
        const data = await res.json()
        setSlots([...slots, ...(data.slots || [])].sort((a, b) => {
          if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
          return a.start_time.localeCompare(b.start_time)
        }))
        setBulkDialogOpen(false)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        const errData = await res.json()
        alert(errData.error || t.student.bookingError)
      }
    } catch {
      alert(t.student.serverError)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSlot = async (id: string, isRec: boolean) => {
    if (!confirm(t.reader.deleteSlotConfirm)) return

    try {
      const res = await fetch(`/api/reader/schedule?id=${id}`, {
        method: "DELETE"
      })

      if (res.ok) {
        setSlots(slots.filter(s => s.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm("هل أنت متأكد من حذف جميع المواعيد المتاحة لهذا اليوم؟")) return

    try {
      const dayOfWeek = selectedDate.getDay()
      const date = format(selectedDate, "yyyy-MM-dd")
      const res = await fetch(`/api/reader/schedule?type=all&dayOfWeek=${dayOfWeek}&date=${date}`, {
        method: "DELETE"
      })

      if (res.ok) {
        setSlots(slots.filter(s => {
          const isRec = s.is_recurring || !s.specific_date
          if (isRec && s.day_of_week === dayOfWeek) return false
          if (s.specific_date && format(new Date(s.specific_date), "yyyy-MM-dd") === date) return false
          return true
        }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const currentDaySlots = slots.filter(s => {
    const dow = selectedDate.getDay()
    const dateStr = format(selectedDate, "yyyy-MM-dd")

    // Show if it's a recurring slot for this day-of-week
    if ((s.is_recurring || !s.specific_date) && s.day_of_week === dow) return true

    // Show if it's a specific date slot for THIS EXACT DATE
    if (s.specific_date && format(new Date(s.specific_date), "yyyy-MM-dd") === dateStr) return true

    return false
  }).sort((a, b) => a.start_time.localeCompare(b.start_time))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400/20">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold">{t.reader.scheduleUpdatedSuccess}</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card p-8 rounded-3xl border border-border shadow-sm">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <CalendarRange className="w-8 h-8 text-primary" />
            {t.reader.manageScheduleTitle}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            {t.reader.manageScheduleDesc}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Calendar and Controls */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <Card className="border-border rounded-2xl shadow-sm overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b border-border bg-muted/30 dark:bg-muted/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                {t.student.selectDate}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                locale={dateLocale}
                className="w-full border-none shadow-none bg-transparent"
                modifiers={{
                  hasSlots: (date) => {
                    const dow = date.getDay()
                    const dateStr = format(date, "yyyy-MM-dd")
                    return slots.some(s =>
                      (s.specific_date && format(new Date(s.specific_date), "yyyy-MM-dd") === dateStr) ||
                      ((s.is_recurring || !s.specific_date) && s.day_of_week === dow)
                    )
                  }
                }}
                modifiersClassNames={{
                  hasSlots: "font-bold text-primary underline decoration-2 decoration-[#D4A843] underline-offset-4"
                }}
              />
            </CardContent>
          </Card>

          <Button
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-sm"
            onClick={() => {
              setIsRecurring(false)
              setNewSlotDays([selectedDate.getDay()])
              setNewSlotPeriods([{ id: Date.now(), start: "09:00", end: "09:30" }])
              setDialogOpen(true)
            }}
          >
            <Plus className="w-4 h-4 ml-2 rtl:mr-2" />
            {t.reader.addNewSlotTitle}
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-[#D4A843] text-[#D4A843] hover:bg-[#D4A843]/10 font-bold"
            onClick={() => setBulkDialogOpen(true)}
          >
            <CalendarRange className="w-4 h-4 ml-2 rtl:mr-2" />
            {t.reader.addBulkScheduleBtn}
          </Button>
        </div>

        {/* Right Column: Time Slots List */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <Card className="border-border rounded-2xl shadow-sm min-h-[450px] flex flex-col bg-card">
            <CardHeader className="pb-3 border-b border-border bg-muted/30 dark:bg-muted/10">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {format(selectedDate, "EEEE، d MMMM", { locale: dateLocale })}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.reader.availableSlots} ({currentDaySlots.length})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {currentDaySlots.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      onClick={handleDeleteAll}
                      title={t.reader.deleteAll || "حذف الكل"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    onClick={() => {
                      setIsRecurring(false)
                      setNewSlotDays([selectedDate.getDay()])
                      setNewSlotPeriods([{ id: Date.now(), start: "09:00", end: "09:30" }])
                      setDialogOpen(true)
                    }}
                    title={t.reader.addSlot || "إضافة موعد"}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <span className={cn(
                    "text-[10px] sm:text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider",
                    currentDaySlots.length > 0 ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                  )}>
                    {currentDaySlots.length > 0 ? t.active : t.inactive}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 flex-1">
              {currentDaySlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <CalendarIcon className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <p className="font-bold text-lg text-foreground/70">{t.reader.noWeeklySlots}</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">{t.reader.noWeeklySlotsDesc}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentDaySlots.map((slot) => {
                    const isRec = slot.is_recurring || !slot.specific_date
                    return (
                      <div
                        key={slot.id}
                        className={cn(
                          "group flex items-center justify-between p-4 rounded-xl border transition-all",
                          isRec ? "border-primary/20 bg-primary/[0.02]" : "border-border bg-card"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                            <Clock className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-base font-bold text-foreground font-mono tabular-nums leading-none">
                              {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider mt-1 text-muted-foreground/60">
                              {isRec ? t.reader.weeklyRecurringTitle : t.reader.specificDatesTitle}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg group-hover:opacity-100 opacity-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteSlot(slot.id, isRec)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 rounded-2xl shadow-sm">
            <CardContent className="pt-4 pb-4 flex gap-3">
              <Info className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">{t.reader.scheduleManagementTips}</p>
                <p className="text-sm text-amber-800/70 dark:text-amber-300/60 leading-relaxed text-xs">
                  {t.reader.bulkAddTip}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Simplified Add Slot Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-border bg-card shadow-2xl">
          <div className="bg-primary p-6 text-primary-foreground">
            <DialogHeader>
              <DialogTitle className="text-xl text-primary-foreground">{t.reader.addNewSlotTitle}</DialogTitle>
              <DialogDescription className="text-primary-foreground/70">
                {t.reader.dayLabel}: {format(selectedDate, "PPPP", { locale: dateLocale })}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 flex gap-2 items-start">
            <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-snug">
              سيتم تقسيم أي فترة زمنية تختارها إلى مواعيد مدة كل منها 30 دقيقة، بما يتوافق مع مدة الجلسة.
            </p>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Multi-day Selection for Recurring */}
            {isRecurring && (
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.reader.applyOnDays}</Label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((dayName: string, idx: number) => {
                    const isSelected = newSlotDays.includes(idx)
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setNewSlotDays(prev =>
                            prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                          )
                        }}
                        className={cn(
                          "px-3 h-10 rounded-xl text-xs font-bold transition-all border shrink-0",
                          isSelected
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                            : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                        )}
                      >
                        {dayName}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Multi-period Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.reader.selectTime}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewSlotPeriods([...newSlotPeriods, { id: Date.now(), start: "09:00", end: "09:30" }])}
                  className="h-7 text-[10px] font-black uppercase text-primary hover:bg-primary/5"
                >
                  <Plus className="w-3 h-3 ml-1 rtl:mr-1" />
                  {t.reader.addPeriod || "إضافة فترة"}
                </Button>
              </div>

              <div className="space-y-3">
                {newSlotPeriods.map((period, index) => (
                  <div key={period.id} className="group relative flex items-center gap-2 bg-muted/30 p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-all">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase px-1">{t.reader.fromLabel}</span>
                        <Input
                          type="time"
                          value={period.start}
                          onChange={(e) => {
                            const updated = [...newSlotPeriods]
                            updated[index].start = e.target.value
                            setNewSlotPeriods(updated)
                          }}
                          className="h-10 bg-background border-border rounded-lg text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase px-1">{t.reader.toLabel}</span>
                        <Input
                          type="time"
                          value={period.end}
                          onChange={(e) => {
                            const updated = [...newSlotPeriods]
                            updated[index].end = e.target.value
                            setNewSlotPeriods(updated)
                          }}
                          className="h-10 bg-background border-border rounded-lg text-sm font-mono"
                        />
                      </div>
                    </div>
                    {newSlotPeriods.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setNewSlotPeriods(newSlotPeriods.filter(p => p.id !== period.id))}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0 mt-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recurring Toggle */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse bg-card/50 p-4 rounded-xl border border-border shadow-inner">
              <Checkbox
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(!!checked)}
                className="w-5 h-5 rounded-md border-primary text-primary"
              />
              <Label
                htmlFor="isRecurring"
                className="flex flex-col gap-0.5 cursor-pointer flex-1"
              >
                <span className="text-sm font-bold text-foreground">
                  {t.reader.weeklyRecurringTitle}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t.reader.weeklyRecurringExplanation}
                </span>
              </Label>
              {isRecurring && <CheckCircle className="w-4 h-4 text-emerald-500 animate-in zoom-in" />}
            </div>
          </div>

          <DialogFooter className="p-6 bg-muted/20 border-t border-border gap-3">
            <Button
              variant="ghost"
              className="rounded-xl font-bold h-11"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              {t.cancel}
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-white font-bold px-8 rounded-xl h-11 shadow-lg shadow-primary/20 flex-1"
              onClick={handleAddSlot}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.reader.addPeriod || "جاري الإضافة"}...
                </>
              ) : (
                t.reader.addSlotBtn
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden border-border bg-card shadow-2xl">
          <div className="bg-[#D4A843] p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">{t.reader.bulkAddTitle}</DialogTitle>
              <DialogDescription className="text-amber-50">
                {t.reader.bulkAddDesc}
              </DialogDescription>
            </DialogHeader>
          </div>

          <Tabs defaultValue="setup" className="w-full">
            <div className="px-6 border-b border-border bg-muted/10">
              <TabsList className="h-12 bg-transparent gap-6">
                <TabsTrigger value="setup" className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#D4A843] bg-transparent font-bold">1. {t.reader.timeRangeLabel}</TabsTrigger>
                <TabsTrigger value="days" className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#D4A843] bg-transparent font-bold">2. {t.reader.applyOnDays}</TabsTrigger>
                <TabsTrigger value="times" className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#D4A843] bg-transparent font-bold">3. {t.reader.timeSlotsHeader}</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="setup" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.reader.fromLabel}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full h-12 justify-start font-mono bg-background border-border rounded-xl">
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {dateRange?.from ? format(dateRange.from, "PPP", { locale: dateLocale }) : t.reader.selectPeriod}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={setDateRange}
                          initialFocus
                          locale={dateLocale}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.reader.toLabel}</Label>
                    <Button variant="outline" className="w-full h-12 justify-start font-mono bg-background border-border rounded-xl cursor-not-allowed">
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {dateRange?.to ? format(dateRange.to, "PPP", { locale: dateLocale }) : t.reader.selectPeriod}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="days" className="mt-0 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((dayName: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedDays(prev =>
                          prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                        )
                      }}
                      className={cn(
                        "px-4 py-3 rounded-xl text-sm font-bold transition-all border shrink-0",
                        selectedDays.includes(idx)
                          ? "bg-[#D4A843] text-white border-[#D4A843] shadow-md shadow-amber-500/20"
                          : "bg-muted/50 text-muted-foreground border-border hover:border-amber-500/30"
                      )}
                    >
                      {dayName}
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="times" className="mt-0 space-y-4">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {bulkTimes.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-3 bg-muted/20 p-4 rounded-2xl border border-border group hover:border-[#D4A843]/30 transition-all">
                      <div className="grid grid-cols-2 gap-4 flex-1">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">{t.reader.fromLabel}</Label>
                          <Input
                            type="time"
                            value={item.start}
                            className="bg-background border-border rounded-xl h-11 font-mono"
                            onChange={(e) => {
                              const newTimes = [...bulkTimes]
                              newTimes[index].start = e.target.value
                              setBulkTimes(newTimes)
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">{t.reader.toLabel}</Label>
                          <Input
                            type="time"
                            value={item.end}
                            className="bg-background border-border rounded-xl h-11 font-mono"
                            onChange={(e) => {
                              const newTimes = [...bulkTimes]
                              newTimes[index].end = e.target.value
                              setBulkTimes(newTimes)
                            }}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-xl mt-4"
                        onClick={() => setBulkTimes(bulkTimes.filter(t => t.id !== item.id))}
                        disabled={bulkTimes.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full border-dashed h-12 rounded-xl text-primary font-bold hover:bg-primary/5"
                    onClick={() => setBulkTimes([...bulkTimes, { id: Date.now(), start: "09:00", end: "09:30" }])}
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    {t.reader.addPeriod}
                  </Button>
                </div>
              </TabsContent>
            </div>

            <DialogFooter className="p-6 bg-muted/20 border-t border-border">
              <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setBulkDialogOpen(false)}>{t.cancel}</Button>
              <Button
                className="bg-[#D4A843] hover:bg-[#C39732] text-white font-black px-10 rounded-xl shadow-lg shadow-amber-500/20"
                onClick={handleBulkAdd}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    {t.submittingStatus}
                  </>
                ) : (
                  t.reader.saveAndInsertSchedule
                )}
              </Button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
