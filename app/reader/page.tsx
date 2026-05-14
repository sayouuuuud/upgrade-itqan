"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ClipboardList, Calendar, CalendarCheck, CheckCircle, ArrowLeft, Loader2, ArrowRight, Power, Star, Users, BarChart3, Clock, Target, Flame, BookOpen } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ReaderStats {
  pendingReviews: number
  todaySessions: number
  upcomingSessions: number
  masteredCount: number
}

interface NewSlotRequest {
  id: string
  student_id: string
  student_name: string
  recitation_id: string
  requested_at: string
}

interface StudentProgressReport {
  student_id: string
  student_name: string
  student_email: string | null
  active_days_30: number
  week_new_verses: number
  week_revised_verses: number
  target_verses: number
  goal_status: string | null
  week_start: string | null
  last_activity_at: string | null
}

interface ReaderPerformanceStats {
  completionRate: number
  studentCount: number
  averageRating: string
}

export default function ReaderDashboard() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [stats, setStats] = useState<ReaderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(true)
  const [updatingActivity, setUpdatingActivity] = useState(false)
  const [slotRequests, setSlotRequests] = useState<NewSlotRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [performanceStats, setPerformanceStats] = useState<ReaderPerformanceStats | null>(null)
  const [studentProgress, setStudentProgress] = useState<StudentProgressReport[]>([])
  const [loadingStudentProgress, setLoadingStudentProgress] = useState(true)

  useEffect(() => {
    // Fetch stats
    const fetchStats = fetch('/api/reader/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setStats(data)
        else setStats({ pendingReviews: 0, todaySessions: 0, upcomingSessions: 0, masteredCount: 0 })
      })
      .catch(() => setStats({ pendingReviews: 0, todaySessions: 0, upcomingSessions: 0, masteredCount: 0 }))

    // Fetch profile for activity status
    const fetchProfile = fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          setIsAccepting(data.user.is_accepting_recitations)
        }
      })

    const fetchRequests = fetch('/api/recitations/new-slot-requests')
      .then(r => r.ok ? r.json() : { requests: [] })
      .then(data => setSlotRequests(data.requests || []))
      .catch(() => setSlotRequests([]))
      .finally(() => setLoadingRequests(false))

    const fetchPerformance = fetch('/api/stats?range=month')
      .then(r => r.ok ? r.json() : null)
      .then(data => setPerformanceStats(data))

    const fetchStudentProgress = fetch('/api/reader/student-progress')
      .then(r => r.ok ? r.json() : { students: [] })
      .then(data => setStudentProgress(data.students || []))
      .catch(() => setStudentProgress([]))
      .finally(() => setLoadingStudentProgress(false))

    Promise.all([fetchStats, fetchProfile, fetchRequests, fetchPerformance, fetchStudentProgress]).finally(() => setLoading(false))
  }, [])

  const handleToggleActivity = async (checked: boolean) => {
    setUpdatingActivity(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_accepting_recitations: checked })
      })

      if (res.ok) {
        setIsAccepting(checked)
        toast.success(t.reader.statusUpdated)
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      toast.error("Error updating status")
    } finally {
      setUpdatingActivity(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B5E3B]" />
      </div>
    )
  }

  const kpis = [
    {
      label: t.reader.pendingReviewsLabel,
      value: stats?.pendingReviews ?? 0,
      icon: ClipboardList,
      color: "text-[#C9A227]",
      bg: "bg-[#C9A227]/10",
      iconBig: "text-[#C9A227]",
      urgent: (stats?.pendingReviews ?? 0) > 0,
    },
    {
      label: t.reader.todaySessionsLabel,
      value: stats?.todaySessions ?? 0,
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-50",
      iconBig: "text-blue-500",
      urgent: false,
    },
    {
      label: t.reader.upcomingSessions7Days,
      value: stats?.upcomingSessions ?? 0,
      icon: CalendarCheck,
      color: "text-purple-600",
      bg: "bg-purple-50",
      iconBig: "text-purple-500",
      urgent: false,
    },
    {
      label: t.reader.masteredCasesCount,
      value: stats?.masteredCount ?? 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      iconBig: "text-emerald-500",
      urgent: false,
    },
  ]

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/recitations/new-slot-requests/${requestId}/accept`, { method: 'POST' });
      if (res.ok) {
        toast.success(locale === 'ar' ? 'تم قبول الطلب بنجاح' : 'Request accepted successfully');
        setSlotRequests(prev => prev.filter(r => r.id !== requestId));
        // Refresh stats
        fetch('/api/reader/stats').then(r => r.json()).then(data => setStats(data));
      } else {
        toast.error("Failed to accept request");
      }
    } catch (error) {
      toast.error("Error accepting request");
    }
  }

  const formatArabicNumber = (value: number) => value.toLocaleString(isAr ? 'ar-EG' : 'en-US')

  return (
    <div className="bg-card min-h-full -m-6 lg:-m-8 p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-foreground tracking-tight">{t.reader.readerOverview}</h2>
        <p className="text-muted-foreground font-medium">{t.reader.readerActivitySummary}</p>
      </div>

      {/* Activity Toggle Card - Premium Design */}
      <div className={cn(
        "p-1 rounded-[32px] border transition-all duration-500 shadow-2xl shadow-black/5 relative overflow-hidden group",
        isAccepting 
          ? "bg-primary/5 border-primary/20" 
          : "bg-muted/30 border-border"
      )}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 opacity-20 pointer-events-none" />
        
        <div className="bg-card/60 backdrop-blur-xl p-6 md:p-8 rounded-[30px] flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-6">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
              isAccepting 
                ? "bg-primary text-primary-foreground shadow-primary/20 rotate-3" 
                : "bg-muted text-muted-foreground"
            )}>
              <Power className={cn("w-8 h-8", isAccepting && "animate-pulse")} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                {t.reader.activityForEvaluation}
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  isAccepting 
                    ? "bg-primary/20 text-primary border border-primary/20" 
                    : "bg-muted text-muted-foreground border border-border"
                )}>
                  {isAccepting ? t.reader.active : t.reader.inactive}
                </div>
              </h3>
              <p className="text-muted-foreground text-sm font-medium max-w-xl leading-relaxed">
                {t.reader.activityForEvaluationDesc}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-2xl border border-border/50">
              <span className={cn(
                "text-xs font-black uppercase tracking-widest px-2",
                isAccepting ? "text-primary" : "text-muted-foreground"
              )}>
                {isAccepting ? t.reader.active : t.reader.inactive}
              </span>
              <Switch
                checked={isAccepting}
                onCheckedChange={handleToggleActivity}
                disabled={updatingActivity}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            {updatingActivity && (
              <div className="flex items-center gap-2 text-[10px] font-bold text-primary animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{isAr ? "جاري التحديث..." : "Updating..."}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className={cn(
                "p-1 rounded-[32px] border transition-all duration-500 shadow-2xl shadow-black/5 relative overflow-hidden group",
                kpi.urgent ? "border-amber-500/30 ring-1 ring-amber-500/10" : "border-border/50"
              )}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="bg-card/60 backdrop-blur-xl p-6 rounded-[30px] relative z-10 h-full flex flex-col">
                <div className={cn(
                  "p-3 rounded-2xl w-fit mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                  kpi.bg, kpi.color, "border border-border/50"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <div className="mt-auto">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-4xl font-black text-foreground tracking-tight">{kpi.value}</h3>
                  </div>
                  <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">{kpi.label}</p>
                </div>

                {kpi.urgent && (
                  <div className="absolute top-4 left-4 flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span className="absolute w-2 h-2 rounded-full bg-amber-500" />
                  </div>
                )}
                
                {/* Decorative Icon Background */}
                <Icon className={cn(
                  "absolute -bottom-4 -left-4 w-24 h-24 opacity-5 transition-all duration-700 group-hover:scale-125 group-hover:rotate-12",
                  kpi.color
                )} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Performance Stats Overlay */}
      {performanceStats && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl border border-primary/20">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-black text-foreground tracking-tight uppercase tracking-widest text-sm">{t.admin?.readerStats?.title}</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: t.admin?.readerStats?.completionRate, value: `${performanceStats.completionRate}%`, icon: CheckCircle, color: "text-primary", bg: "bg-primary/10" },
              { label: t.admin?.readerStats?.studentCount, value: performanceStats.studentCount, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: t.admin?.readerStats?.averageRating, value: performanceStats.averageRating, icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" }
            ].map((stat, idx) => (
              <div key={idx} className="bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-[28px] shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group">
                <div className="flex items-center gap-5">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 border border-border", stat.bg, stat.color)}>
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={cn("text-3xl font-black tracking-tight", stat.color)}>{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Progress Reports */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground tracking-tight">
                {isAr ? "تقرير تقدم الطلاب" : "Student Progress Report"}
              </h3>
              <p className="text-sm text-muted-foreground font-medium">
                {isAr
                  ? "أيام الانتظام، آيات الأسبوع، والمقارنة مع هدف الحفظ."
                  : "Consistency, weekly verses, and goal comparison."}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-[32px] shadow-sm overflow-hidden">
          {loadingStudentProgress ? (
            <div className="p-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : studentProgress.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground font-medium">
              {isAr ? "لا توجد بيانات تقدم للطلاب بعد" : "No student progress data yet"}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {studentProgress.map((student) => {
                const completedVerses = student.week_new_verses
                const totalWeeklyVerses = student.week_new_verses + student.week_revised_verses
                const targetVerses = student.target_verses
                const goalPercent = targetVerses > 0
                  ? Math.min(100, Math.round((completedVerses / targetVerses) * 100))
                  : 0
                const goalLabel = targetVerses > 0
                  ? `${formatArabicNumber(completedVerses)} / ${formatArabicNumber(targetVerses)} ${isAr ? "آية" : "verses"}`
                  : (isAr ? "لا يوجد هدف محدد" : "No target set")

                return (
                  <div key={student.student_id} className="p-5 md:p-6 space-y-4 hover:bg-muted/20 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                          {student.student_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-foreground truncate">{student.student_name}</h4>
                          {student.student_email && (
                            <p className="text-xs text-muted-foreground truncate">{student.student_email}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:min-w-[620px]">
                        <div className="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-3">
                          <div className="flex items-center gap-2 text-orange-600 mb-1">
                            <Flame className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              {isAr ? "الانتظام" : "Consistency"}
                            </span>
                          </div>
                          <p className="text-lg font-black text-foreground">
                            {formatArabicNumber(student.active_days_30)}
                            <span className="text-xs text-muted-foreground font-bold mx-1">
                              {isAr ? "يوم/٣٠" : "days/30"}
                            </span>
                          </p>
                        </div>

                        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                          <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <BookOpen className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              {isAr ? "حفظ الأسبوع" : "Week Hifz"}
                            </span>
                          </div>
                          <p className="text-lg font-black text-foreground">
                            {formatArabicNumber(student.week_new_verses)}
                            <span className="text-xs text-muted-foreground font-bold mx-1">
                              {isAr ? "آية" : "verses"}
                            </span>
                          </p>
                        </div>

                        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3">
                          <div className="flex items-center gap-2 text-amber-600 mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              {isAr ? "إجمالي الأسبوع" : "Week Total"}
                            </span>
                          </div>
                          <p className="text-lg font-black text-foreground">
                            {formatArabicNumber(totalWeeklyVerses)}
                            <span className="text-xs text-muted-foreground font-bold mx-1">
                              {isAr ? "حفظ + مراجعة" : "new + review"}
                            </span>
                          </p>
                        </div>

                        <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3">
                          <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <Target className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              {isAr ? "مقارنة الهدف" : "Goal"}
                            </span>
                          </div>
                          <p className="text-sm font-black text-foreground">{goalLabel}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                        <span>{isAr ? "نسبة تحقيق هدف الأسبوع" : "Weekly goal progress"}</span>
                        <span>{targetVerses > 0 ? `${formatArabicNumber(goalPercent)}%` : "—"}</span>
                      </div>
                      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden" dir="ltr">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-500"
                          style={{ width: `${goalPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Slot Requests Recovery Flow - Premium Redesign */}
      {slotRequests.length > 0 && (
        <div className="relative p-1 rounded-[40px] border border-border bg-primary/5 shadow-2xl shadow-primary/5 overflow-hidden group">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl opacity-50" />
          
          <div className="bg-card/80 backdrop-blur-2xl p-8 rounded-[38px] space-y-8 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-[20px] flex items-center justify-center text-amber-500 shadow-inner">
                <CalendarCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{t.reader.newSlotRequests || (locale === 'ar' ? 'طلبات مواعد جديدة' : 'New Slot Requests')}</h3>
                <p className="text-muted-foreground text-sm font-medium">{t.reader.requestsFromSuspendedDesc || (locale === 'ar' ? 'طلاب انتهت مهلتهم ويطلبون فرصة جديدة لحجز موعد.' : 'Students whose window expired and are asking for a new chance to book.')}</p>
              </div>
            </div>

            <div className="grid gap-4">
              {slotRequests.map((request, idx) => (
                <div key={request.id} className="bg-card/40 border border-border/50 p-6 rounded-[24px] flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-muted/10 transition-all duration-300 group/item">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-muted to-card rounded-full flex items-center justify-center border-2 border-border shadow-md group-hover/item:border-primary/50 transition-colors">
                      <span className="text-xl font-black text-muted-foreground group-hover/item:text-primary">{request.student_name.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-foreground">{request.student_name}</h4>
                      <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {new Date(request.requested_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white h-14 px-8 rounded-2xl text-sm font-black transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 active:scale-95 group-hover/item:translate-x-[-4px] rtl:group-hover/item:translate-x-[4px]"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>{t.reader.acceptRequest || (locale === 'ar' ? 'قبول الطلب وتجديد الفرصة' : 'Accept & Renew Opportunity')}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State / Welcome Polish */}
      {stats?.pendingReviews === 0 && (
        <div className="text-center py-16 bg-card/40 border-[3px] border-dashed border-border/50 rounded-[40px] group hover:border-primary/30 transition-colors duration-500">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-border group-hover:rotate-12 transition-transform">
            <ClipboardList className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <p className="text-muted-foreground font-black text-xl uppercase tracking-widest max-w-md mx-auto leading-relaxed px-6">
            {t.reader.noNewRecitationsForReview}
          </p>
        </div>
      )}

      {/* Quick Action Button - Premium Style */}
      <div className="flex justify-center pt-8">
        <Link
          href="/reader/recitations"
          className="group relative h-20 px-12 flex items-center gap-4 bg-primary text-primary-foreground rounded-[24px] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-2xl shadow-primary/25 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          <div className="relative z-10 flex items-center gap-4">
            <ClipboardList className="w-6 h-6" />
            <span className="font-black text-xl tracking-tight">{t.reader.goToNewRecitationsLabel}</span>
            
            {(stats?.pendingReviews ?? 0) > 0 && (
              <span className="bg-amber-500 text-white min-w-[28px] h-[28px] flex items-center justify-center text-[10px] font-black rounded-full shadow-lg border-2 border-primary ring-4 ring-primary/20">
                {stats!.pendingReviews}
              </span>
            )}
            
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-transform group-hover:translate-x-2 rtl:group-hover:-translate-x-2">
              <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
