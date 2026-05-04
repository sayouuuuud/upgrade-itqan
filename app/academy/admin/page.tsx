'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import {
  BookOpen,
  Users,
  Award,
  GraduationCap,
  ArrowLeft,
  Loader2,
  Eye,
  UserCheck,
  TrendingUp,
  ClipboardList,
  Sparkles,
} from 'lucide-react'
import { ViewsChart } from '@/components/admin/analytics/views-chart'
import { VisitorStats } from '@/components/admin/analytics/visitors-stats'

interface AcademyStats {
  total_students: number
  total_teachers: number
  total_courses: number
  total_points_distributed: number
  pending_teacher_apps: number
  enrollments_today: number
  enrollments_week: number
  active_enrollments: number
  certificates_issued: number
  latest_courses: Array<{
    id: string
    title: string
    teacher_name: string | null
    enrollments: number
    created_at: string
  }>
  top_students: Array<{
    id: string
    name: string
    avatar_url: string | null
    total_points: number
  }>
}

export default function AcademyAdminPage() {
  const { t } = useI18n()
  const isAr = t.locale === 'ar'

  const [stats, setStats] = useState<AcademyStats | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          fetch('/api/academy/admin/stats'),
          fetch('/api/admin/analytics?days=30').catch(() => null),
        ])

        if (statsRes.ok) {
          setStats(await statsRes.json())
        } else {
          setError(await statsRes.text())
        }

        if (analyticsRes && analyticsRes.ok) {
          setAnalytics(await analyticsRes.json())
        }
      } catch (err) {
        console.error('[academy-admin] load error:', err)
        setError(String(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="text-red-500 font-bold text-xl">
          {isAr ? 'حدث خطأ أثناء تحميل البيانات' : 'Failed to load dashboard'}
        </div>
        <div className="text-muted-foreground">
          {isAr ? 'يرجى المحاولة مرة أخرى أو التواصل مع الدعم.' : 'Please try again or contact support.'}
        </div>
        {error && (
          <code className="bg-red-50 text-red-800 p-2 rounded text-sm">{error}</code>
        )}
      </div>
    )
  }

  const fmt = (num: number) => num.toLocaleString(isAr ? 'ar-EG' : 'en-US')

  // Analytics derived data (shared page_views table covers both platforms; we only show high-level usage)
  const chartData = (analytics?.overTime || []).map((d: any) => ({
    date: d.raw_date || d.day,
    views_count: parseInt(d.views || '0'),
    visitors_count: parseInt(d.visitors || '0'),
  }))

  const topCountriesMapped = (analytics?.topCountries || []).map((c: any) => ({
    country: c.country,
    count: parseInt(c.views || '0'),
  }))

  const deviceTypesRaw = analytics?.deviceTypes || []
  const totalDevices = deviceTypesRaw.reduce(
    (sum: number, d: any) => sum + parseInt(d.count || '0'),
    0,
  )
  const deviceTypesMapped = deviceTypesRaw.map((d: any) => ({
    device_type: d.device_type,
    count: parseInt(d.count || '0'),
    percentage:
      totalDevices > 0 ? Math.round((parseInt(d.count || '0') / totalDevices) * 100) : 0,
  }))

  const totalViews = parseInt(analytics?.overview?.total_views || '0')
  const uniqueVisitors = parseInt(analytics?.overview?.unique_visitors || '0')

  // Stats grid cards
  const statCards = [
    {
      label: isAr ? 'الطلاب' : 'Students',
      value: stats.total_students,
      icon: Users,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
      label: isAr ? 'المدرسون' : 'Teachers',
      value: stats.total_teachers,
      icon: GraduationCap,
      iconBg:
        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      label: isAr ? 'الدورات' : 'Courses',
      value: stats.total_courses,
      icon: BookOpen,
      iconBg:
        'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    {
      label: isAr ? 'طلبات تدريس' : 'Teacher Applications',
      value: stats.pending_teacher_apps,
      icon: UserCheck,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      label: isAr ? 'الشهادات الصادرة' : 'Certificates',
      value: stats.certificates_issued,
      icon: Award,
      iconBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    },
  ]

  return (
    <div className="space-y-6 pb-20 lg:pb-0 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {t.academy?.dashboard || 'لوحة تحكم الأكاديمية'}
        </h1>
      </div>

      {/* Quick Stats Summary (4 cards: views/visitors/total members/today's enrollments) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
            <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {fmt(totalViews)}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isAr ? 'إجمالي المشاهدات (٣٠ يوم)' : 'Total Views (30 Days)'}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {fmt(uniqueVisitors)}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isAr ? 'الزوار الفريدون' : 'Unique Visitors'}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {fmt(stats.total_students + stats.total_teachers)}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isAr ? 'إجمالي الأعضاء' : 'Total Members'}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-100/50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 border border-amber-200 dark:border-amber-900/50">
            <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {fmt(stats.enrollments_today)}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isAr ? 'تسجيلات اليوم' : "Today's Enrollments"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid (5 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-10 h-10 ${stat.iconBg} rounded-md flex items-center justify-center border`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                {fmt(stat.value)}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                {stat.label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Views Chart */}
      {analytics && chartData.length > 0 && <ViewsChart data={chartData} />}

      {/* Engagement & Activity Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">
                {isAr ? 'تسجيلات هذا الأسبوع' : 'Enrollments this week'}
              </p>
              <p className="text-2xl font-bold">{fmt(stats.enrollments_week)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-xs text-muted-foreground">
                {isAr ? 'تسجيلات نشطة' : 'Active Enrollments'}
              </p>
              <p className="text-2xl font-bold">{fmt(stats.active_enrollments)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-xs text-muted-foreground">
                {isAr ? 'إجمالي النقاط الموزعة' : 'Total Points Distributed'}
              </p>
              <p className="text-2xl font-bold">
                {fmt(stats.total_points_distributed)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visitor Stats (Countries & Devices) */}
      {analytics && (topCountriesMapped.length > 0 || deviceTypesMapped.length > 0) && (
        <div className="grid grid-cols-1 gap-6">
          <VisitorStats
            countryData={topCountriesMapped}
            deviceData={deviceTypesMapped}
          />
        </div>
      )}

      {/* Latest Courses + Top Students side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Courses */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/50">
            <div>
              <h3 className="font-bold text-foreground">
                {isAr ? 'أحدث الدورات' : 'Latest Courses'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isAr ? 'الدورات المضافة مؤخراً' : 'Recently added courses'}
              </p>
            </div>
            <Link
              href="/academy/admin/courses"
              className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
            >
              {isAr ? 'عرض الكل' : 'View All'}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
          {stats.latest_courses.length > 0 ? (
            <div className="divide-y divide-border">
              {stats.latest_courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/academy/admin/courses/${course.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">
                      {course.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {course.teacher_name || (isAr ? 'بدون مدرس' : 'No teacher')}
                    </p>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <p className="text-sm font-bold text-foreground">
                      {fmt(course.enrollments)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isAr ? 'مسجل' : 'enrolled'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-10 flex-1 flex flex-col items-center justify-center text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground font-medium">
                {isAr ? 'لا توجد دورات بعد' : 'No courses yet'}
              </p>
            </div>
          )}
        </div>

        {/* Top Students */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/50">
            <div>
              <h3 className="font-bold text-foreground">
                {isAr ? 'أنشط الطلاب' : 'Top Students'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isAr
                  ? 'الطلاب الأكثر حصولاً على النقاط'
                  : 'Students with most points'}
              </p>
            </div>
            <Link
              href="/academy/admin/leaderboard"
              className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
            >
              {isAr ? 'عرض الكل' : 'View All'}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
          {stats.top_students.length > 0 ? (
            <div className="divide-y divide-border">
              {stats.top_students.map((student, idx) => (
                <Link
                  key={student.id}
                  href={`/academy/admin/users/${student.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                      idx === 0
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                        : idx === 1
                          ? 'bg-slate-400/20 text-slate-700 dark:text-slate-300 border border-slate-400/40'
                          : idx === 2
                            ? 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/40'
                            : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {student.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={student.avatar_url}
                        alt={student.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">
                      {student.name}
                    </p>
                  </div>
                  <div className="text-end flex-shrink-0 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <p className="text-sm font-bold text-foreground">
                      {fmt(student.total_points)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-10 flex-1 flex flex-col items-center justify-center text-center">
              <Sparkles className="w-12 h-12 text-amber-500/20 mb-4" />
              <p className="text-muted-foreground font-medium">
                {isAr ? 'لا توجد بيانات بعد' : 'No data yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
