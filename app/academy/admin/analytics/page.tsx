"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  Download,
  FileSpreadsheet,
  Globe2,
  GraduationCap,
  Library,
  Loader2,
  MapPin,
  MessageSquare,
  Mic2,
  Route,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/context"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts'

interface Stats {
  totalStudents: number
  totalTeachers: number
  totalParents: number
  totalReaders: number
  totalAdmins: number
  activeCourses: number
  draftCourses: number
  archivedCourses: number
  totalEnrollments: number
  activeEnrollments: number
  completedEnrollments: number
  totalLessons: number
  totalSessions: number
  upcomingSessions: number
  completedSessions: number
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  taskCompletionRate: number
  attendancePresent: number
  attendanceTotal: number
  attendanceRate: number
  completionRate: number
  totalCertificates: number
  weeklyEnrollments: number
  monthlyEnrollments: number
  dailyActiveStudents: number
  weeklyActiveStudents: number
  monthlyActiveStudents: number
  dailyActivityRate: number
  learningPaths: number
  memorizationPaths: number
  tajweedPaths: number
  totalRecitations: number
  totalBookings: number
  totalBooks: number
  totalBookFiles: number
  forumPosts: number
  communityMembers: number
}

interface AnalyticsData {
  stats: Stats
  enrollmentTrend: { month: string; count: number }[]
  genderDistribution: { gender: string; count: number }[]
  topCourses: { title: string; enrollments: number; avg_progress: number }[]
  topTeachers: { teacher_id: string; name: string; courses_count: number; students_count: number }[]
  topStudents: { student_id: string; name: string; points: number; enrollments: number; completed: number }[]
  enrollmentStatuses: { status: string; count: number }[]
  sessionsByStatus: { status: string; count: number }[]
  studentsByCountry: { country: string; country_code?: string | null; count: number; active_count: number }[]
  geoHeatmap: { country: string; country_code?: string | null; region: string; city: string; count: number }[]
  dailyActivity: { day: string; active_students: number; points: number }[]
  topSurahs: { surah_name: string; surah_number?: number | null; recordings: number; unique_students: number }[]
  lastSignups: { id: string; name: string; role: string; created_at: string }[]
}

interface CounterCardProps {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  color: string
}

function CounterCard({ label, value, hint, icon: Icon, color }: CounterCardProps) {
  return (
    <Card className="relative overflow-hidden border-0 bg-card/40 backdrop-blur-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className={`absolute top-0 right-0 w-2 h-full ${color}`} />
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color.replace('bg-', 'bg-opacity-10 text-')}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-3xl font-black text-foreground drop-shadow-sm truncate">{value}</p>
          <p className="text-sm font-semibold text-muted-foreground mt-0.5">{label}</p>
          {hint && <p className="text-[10px] text-muted-foreground/70 mt-1 truncate">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

const COLORS = ['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#6366f1'];

const nameTranslations: Record<string, { ar: string; en: string }> = {
  'مدير الأكاديمية': { ar: 'مدير الأكاديمية', en: 'Academy Admin' },
  'مدير المقرأة': { ar: 'مدير المقرأة', en: 'Maqraah Admin' },
  'المدير العام': { ar: 'المدير العام', en: 'Super Admin' },
  'مشرف': { ar: 'مشرف', en: 'Supervisor' },
  'مدير': { ar: 'مدير', en: 'Admin' },
  'طالب': { ar: 'طالب', en: 'Student' },
  'معلم': { ar: 'معلم', en: 'Teacher' },
  'مقرئ': { ar: 'مقرئ', en: 'Reader' },
  'ولي أمر': { ar: 'ولي أمر', en: 'Parent' },
}

function formatLocation(val?: string | null, isAr?: boolean) {
  if (!val || val === 'غير محدد' || val === 'unspecified' || val === 'Unspecified') {
    return isAr ? 'غير محدد' : 'Unspecified'
  }
  return val
}

function formatUserName(name: string, isAr: boolean) {
  if (nameTranslations[name]) {
    return isAr ? nameTranslations[name].ar : nameTranslations[name].en
  }
  return name
}

function formatRole(role: string, t: any) {
  const adminRoles = (t.adminRoles as Record<string, string>) || {}
  return adminRoles[role] || role
}

export default function AdminAnalyticsPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const a = t.academyAdmin
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US'

  const monthLabels: Record<string, string> = {
    "01": a.month01, "02": a.month02, "03": a.month03, "04": a.month04,
    "05": a.month05, "06": a.month06, "07": a.month07, "08": a.month08,
    "09": a.month09, "10": a.month10, "11": a.month11, "12": a.month12,
  }

  const genderLabels: Record<string, string> = {
    male: a.analyticsMale,
    female: a.analyticsFemale,
    unknown: a.analyticsUnknown,
  }

  const enrollmentStatusLabels: Record<string, string> = {
    active: a.analyticsActive,
    ACTIVE: a.analyticsActive,
    completed: a.analyticsCompleted,
    COMPLETED: a.analyticsCompleted,
    paused: a.analyticsPaused,
    PAUSED: a.analyticsPaused,
    dropped: a.analyticsDropped,
    DROPPED: a.analyticsDropped,
    accepted: a.analyticsAccepted,
    unknown: a.analyticsUnknown,
  }

  const sessionStatusLabels: Record<string, string> = {
    scheduled: a.analyticsScheduled,
    in_progress: a.analyticsInProgress,
    completed: a.analyticsCompleted,
    cancelled: a.analyticsCancelled,
    unknown: a.analyticsUnknown,
  }

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetch("/api/academy/admin/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch("/api/academy/admin/analytics/export")
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const el = document.createElement("a")
      el.href = url
      el.download = `academy-analytics-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(el)
      el.click()
      el.remove()
      URL.revokeObjectURL(url)
      toast.success(a.analyticsExportSuccess)
    } catch {
      toast.error(a.analyticsExportFailed)
    } finally {
      setExporting(false)
    }
  }

  const stats = data?.stats

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">{a.analyticsLoading}</p>
        </div>
      </div>
    )
  }

  if (!data || !stats) {
    return (
      <div className="text-center text-muted-foreground py-20 bg-muted/20 rounded-2xl border border-border/50 backdrop-blur-sm">
        <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">{a.analyticsLoadError}</h2>
        <p className="text-sm">{a.analyticsRetryHint}</p>
      </div>
    )
  }

  const userCounters: CounterCardProps[] = [
    { label: a.analyticsStudents, value: stats.totalStudents.toLocaleString(), icon: Users, color: "bg-blue-500" },
    { label: a.analyticsTeachers, value: stats.totalTeachers.toLocaleString(), icon: GraduationCap, color: "bg-purple-500" },
    { label: a.analyticsParents, value: stats.totalParents.toLocaleString(), icon: UserCog, color: "bg-amber-500" },
    { label: a.analyticsActiveToday, value: stats.dailyActiveStudents.toLocaleString(), hint: a.analyticsActiveTodayHint.replace('{rate}', String(stats.dailyActivityRate)), icon: Activity, color: "bg-emerald-500" },
  ]

  const contentCounters: CounterCardProps[] = [
    { label: a.analyticsCourses, value: stats.activeCourses.toLocaleString(), hint: a.analyticsTotalLessons.replace('{count}', String(stats.totalLessons)), icon: BookOpen, color: "bg-indigo-500" },
    { label: a.analyticsCompletedSessions, value: stats.completedSessions.toLocaleString(), hint: a.analyticsSessionsTotal.replace('{count}', String(stats.totalSessions)), icon: Calendar, color: "bg-pink-500" },
    { label: a.analyticsLearningPaths, value: stats.learningPaths.toLocaleString(), icon: Route, color: "bg-orange-500" },
    { label: a.analyticsLibrary, value: stats.totalBooks.toLocaleString(), hint: a.analyticsFiles.replace('{count}', String(stats.totalBookFiles)), icon: Library, color: "bg-teal-500" },
  ]

  const engagementCounters: CounterCardProps[] = [
    { label: a.analyticsActiveEnrollments, value: stats.activeEnrollments.toLocaleString(), hint: `${stats.totalEnrollments} ${a.analyticsTotalEnrollments}`, icon: UserCheck, color: "bg-cyan-500" },
    { label: a.analyticsCompletionRate, value: `${stats.completionRate}%`, icon: Target, color: "bg-yellow-500" },
    { label: a.analyticsCompletedTasks, value: `${stats.taskCompletionRate}%`, hint: a.analyticsTasksCount.replace('{count}', String(stats.completedTasks)), icon: Sparkles, color: "bg-rose-500" },
    { label: a.analyticsIssuedCertificates, value: stats.totalCertificates.toLocaleString(), icon: Award, color: "bg-emerald-400" },
  ]

  // Prepare chart data
  const trendData = data.enrollmentTrend.map(d => ({
    name: monthLabels[d.month.split("-")[1] || d.month] || d.month,
    count: d.count
  }))

  const dailyData = data.dailyActivity.slice(-14).map(d => ({
    name: d.day.split("-").slice(1).join("-"),
    students: d.active_students,
    points: d.points
  }))

  const genderData = data.genderDistribution.map(d => ({
    name: genderLabels[d.gender] || d.gender,
    value: d.count
  }))

  const enrollStatusData = data.enrollmentStatuses.map(d => ({
    name: enrollmentStatusLabels[d.status] || d.status,
    value: d.count
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border shadow-xl rounded-lg p-3 text-sm">
          <p className="font-bold text-foreground mb-2 border-b border-border pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="flex justify-between gap-4 font-medium">
              <span>{entry.name}:</span>
              <span>{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            {a.analyticsTitle}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            {a.analyticsDesc}
          </p>
        </div>
        <Button onClick={handleExport} disabled={exporting} size="lg" className="gap-2 font-bold shadow-lg hover:shadow-primary/25 transition-all">
          {exporting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-5 h-5" />
          )}
          {a.analyticsExport}
          {!exporting && <Download className="w-5 h-5 mr-1 opacity-70" />}
        </Button>
      </div>

      {/* Quick Stats Grid */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {userCounters.map((c) => <CounterCard key={c.label} {...c} />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contentCounters.map((c) => <CounterCard key={c.label} {...c} />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {engagementCounters.map((c) => <CounterCard key={c.label} {...c} />)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trend Chart */}
        <Card className="lg:col-span-2 border-0 bg-card/50 backdrop-blur-lg shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <TrendingUp className="w-5 h-5 text-primary" />
              {a.analyticsEnrollmentGrowth}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" name={a.analyticsEnrollments} stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gender Distribution Donut */}
        <Card className="border-0 bg-card/50 backdrop-blur-lg shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Users className="w-5 h-5 text-primary" />
              {a.analyticsGenderDistribution}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card className="border-0 bg-card/50 backdrop-blur-lg shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Activity className="w-5 h-5 text-emerald-500" />
              {a.analyticsDailyActivity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis yAxisId="left" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'currentColor', opacity: 0.05}} />
                  <Bar yAxisId="left" dataKey="students" name={a.analyticsActiveStudents} fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Enrollment Statuses */}
        <Card className="border-0 bg-card/50 backdrop-blur-lg shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Target className="w-5 h-5 text-amber-500" />
              {a.analyticsEnrollmentStatuses}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollStatusData} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="opacity-10" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} width={80} className="text-foreground" />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'currentColor', opacity: 0.05}} />
                  <Bar dataKey="value" name={a.analyticsEnrollmentCount} fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24}>
                    {enrollStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Students */}
        <Card className="border-0 bg-card/50 backdrop-blur-lg shadow-md h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg font-bold">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                {a.analyticsHonorRoll}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.topStudents.length > 0 ? (
              <div className="divide-y divide-border/50">
                {data.topStudents.slice(0, 5).map((s, idx) => {
                  const medals = ["text-yellow-500 bg-yellow-500/10", "text-gray-400 bg-gray-400/10", "text-amber-700 bg-amber-700/10"]
                  return (
                    <div key={s.student_id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${medals[idx] || "text-muted-foreground bg-muted"}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.enrollments} {a.analyticsCourses} • {s.completed} {a.analyticsStudentsCount}
                        </p>
                      </div>
                      <div className="text-left shrink-0">
                        <span className="inline-flex items-center gap-1 font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs">
                          {s.points.toLocaleString()} <Sparkles className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">{a.analyticsNoData}</div>
            )}
          </CardContent>
        </Card>

        {/* Top Teachers */}
        <Card className="border-0 bg-card/50 backdrop-blur-lg shadow-md h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <GraduationCap className="w-5 h-5 text-purple-500" />
              {a.analyticsTopTeachers}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.topTeachers.length > 0 ? (
              <div className="divide-y divide-border/50">
                {data.topTeachers.slice(0, 5).map((t, idx) => (
                  <div key={t.teacher_id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center font-black">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.courses_count} {a.analyticsCourseMaterials}
                      </p>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="font-black text-foreground">{t.students_count}</span>
                      <span className="text-xs text-muted-foreground block">{a.analyticsStudentsCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">{a.analyticsNoData}</div>
            )}
          </CardContent>
        </Card>

        {/* Top Courses */}
        <Card className="border-0 bg-card/50 backdrop-blur-lg shadow-md h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              {a.analyticsTopCourses}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.topCourses.length > 0 ? (
              <div className="divide-y divide-border/50">
                {data.topCourses.slice(0, 5).map((c, idx) => {
                  const max = Math.max(...data.topCourses.map((x) => x.enrollments), 1)
                  const width = (c.enrollments / max) * 100
                  return (
                    <div key={idx} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-foreground truncate flex-1 ml-4">{c.title}</p>
                        <span className="font-black text-indigo-500 shrink-0">{c.enrollments} {a.analyticsStudentsCount}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground w-10">{c.avg_progress}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">{a.analyticsNoData}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Heatmap & Community */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 bg-card/50 backdrop-blur-lg shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Globe2 className="w-5 h-5 text-blue-500" />
              {a.analyticsGeoDistribution}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.geoHeatmap.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {data.geoHeatmap.slice(0, 9).map((item, idx) => {
                  const max = Math.max(...data.geoHeatmap.map((r) => r.count), 1)
                  const intensity = 0.1 + (item.count / max) * 0.9
                  return (
                    <div
                      key={`${item.country}-${item.region}-${idx}`}
                      className="rounded-xl border border-border/40 p-4 relative overflow-hidden group hover:shadow-md transition-all"
                    >
                      <div 
                        className="absolute inset-0 bg-blue-500 transition-opacity duration-300" 
                        style={{ opacity: intensity * 0.2 }} 
                      />
                      <div className="relative z-10">
                        <p className="text-sm font-black truncate text-foreground group-hover:text-blue-500 transition-colors">{formatLocation(item.region, isAr)}</p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {formatLocation(item.country, isAr)} • {formatLocation(item.city, isAr)}
                        </p>
                        <div className="mt-3 flex items-end justify-between">
                          <span className="text-2xl font-black text-foreground drop-shadow-sm">{item.count}</span>
                          <MapPin className="w-4 h-4 text-muted-foreground/50" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                {a.analyticsNoGeoData}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-card/50 backdrop-blur-lg shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <MessageSquare className="w-5 h-5 text-teal-500" />
              {a.analyticsCommunityPulse}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="relative overflow-hidden bg-gradient-to-br from-teal-500/10 to-teal-500/5 border border-teal-500/20 rounded-2xl p-6 text-center hover:scale-[1.02] transition-transform">
                <MessageSquare className="absolute -left-4 -bottom-4 w-24 h-24 text-teal-500/10" />
                <p className="text-4xl font-black text-teal-600 dark:text-teal-400 drop-shadow-sm relative z-10">
                  {stats.forumPosts.toLocaleString()}
                </p>
                <p className="text-sm font-bold text-teal-700/70 dark:text-teal-300/70 mt-2 relative z-10">{a.analyticsTotalPosts}</p>
              </div>
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-6 text-center hover:scale-[1.02] transition-transform">
                <Users className="absolute -left-4 -bottom-4 w-24 h-24 text-blue-500/10" />
                <p className="text-4xl font-black text-blue-600 dark:text-blue-400 drop-shadow-sm relative z-10">
                  {stats.communityMembers.toLocaleString()}
                </p>
                <p className="text-sm font-bold text-blue-700/70 dark:text-blue-300/70 mt-2 relative z-10">{a.analyticsCommunityMembers}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {a.analyticsRecentSignups}
              </h4>
              {data.lastSignups.length > 0 ? (
                <div className="space-y-2">
                  {data.lastSignups.slice(0, 4).map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors">
                      <span className="font-bold text-sm truncate max-w-[150px] sm:max-w-[200px]">{formatUserName(u.name, isAr)}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{formatRole(u.role, t)}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">{a.analyticsNoRecentSignups}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
