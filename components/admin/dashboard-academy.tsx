"use client"

import Link from 'next/link'
import useSWR from 'swr'
import { useI18n } from '@/lib/i18n/context'
import {
  BookOpen,
  Users,
  Award,
  GraduationCap,
  ArrowLeft,
  UserCheck,
  TrendingUp,
  ClipboardList,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { AcademyInsights } from '@/components/admin/analytics/academy-insights'
import { StatsGridSkeleton, StatsMiniGridSkeleton, ChartSkeleton } from "@/components/admin/skeletons"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

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
  enrollment_trend: Array<{
    date: string
    count: number
  }>
}

export function DashboardAcademy() {
  const { t, locale } = useI18n()
  const a = t.academyAdmin
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US'

  const { data: stats, error, isLoading } = useSWR<AcademyStats>(
    '/api/academy/admin/stats',
    fetcher,
  )

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20 lg:pb-0 font-sans">
        <StatsGridSkeleton count={4} />
        <StatsMiniGridSkeleton count={5} />
        <ChartSkeleton />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="text-red-500 font-bold text-xl">
          {a.dashLoadError}
        </div>
        <div className="text-muted-foreground">
          {a.dashRetryHint}
        </div>
        {error && (
          <code className="rounded bg-destructive/10 p-2 text-sm text-destructive">
            {error.message}
          </code>
        )}
      </div>
    )
  }

  const fmt = (num: number) => num.toLocaleString(dateLocale)

  const completionRate =
    stats.active_enrollments + stats.certificates_issued > 0
      ? Math.round(
          (stats.certificates_issued /
            (stats.active_enrollments + stats.certificates_issued)) *
            100,
        )
      : 0

  // Quick summary cards (academy-focused, replacing the removed traffic metrics)
  const summaryCards = [
    {
      value: fmt(stats.total_students + stats.total_teachers),
      label: a.dashTotalMembers,
      icon: Users,
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      value: fmt(stats.active_enrollments),
      label: a.dashActiveEnrollments,
      icon: BookOpen,
      iconBg: 'bg-purple-500/10 border-purple-500/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      value: fmt(stats.certificates_issued),
      label: a.dashCertificates,
      icon: Award,
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      value: fmt(stats.enrollments_today),
      label: a.dashTodaysEnrollments,
      icon: ClipboardList,
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ]

  // Stats grid cards
  const statCards = [
    {
      label: a.analyticsStudents,
      value: stats.total_students,
      icon: Users,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
      label: a.analyticsTeachers,
      value: stats.total_teachers,
      icon: GraduationCap,
      iconBg:
        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      label: a.analyticsCourses,
      value: stats.total_courses,
      icon: BookOpen,
      iconBg:
        'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    {
      label: a.dashTeacherApplications,
      value: stats.pending_teacher_apps,
      icon: UserCheck,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      label: a.dashCertificates,
      value: stats.certificates_issued,
      icon: Award,
      iconBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    },
  ]

  return (
    <div className="space-y-6 pb-20 lg:pb-0 font-sans">
      {/* Quick Stats Summary (academy-focused) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow"
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 border ${card.iconBg}`}
              >
                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {card.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {card.label}
                </p>
              </div>
            </div>
          )
        })}
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

      {/* Academy insights: community composition */}
      <AcademyInsights
        totalStudents={stats.total_students}
        totalTeachers={stats.total_teachers}
      />

      {/* Engagement & Activity Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {a.dashEnrollmentsThisWeek}
              </p>
              <p className="text-2xl font-bold">{fmt(stats.enrollments_week)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {a.dashActiveEnrollments}
              </p>
              <p className="text-2xl font-bold">{fmt(stats.active_enrollments)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {a.dashTotalPointsDistributed}
              </p>
              <p className="text-2xl font-bold">
                {fmt(stats.total_points_distributed)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {a.dashCompletionRate}
              </p>
              <p className="text-2xl font-bold">{completionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Courses + Top Students side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Courses */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/50">
            <div>
              <h3 className="font-bold text-foreground">
                {a.dashLatestCourses}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {a.dashRecentlyAdded}
              </p>
            </div>
            <Link
              href="/academy/admin/courses"
              className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
            >
              {a.dashViewAll}
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
                      {course.teacher_name || a.dashNoTeacher}
                    </p>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <p className="text-sm font-bold text-foreground">
                      {fmt(course.enrollments)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.dashEnrolled}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-10 flex-1 flex flex-col items-center justify-center text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground font-medium">
                {a.dashNoCoursesYet}
              </p>
            </div>
          )}
        </div>

        {/* Top Students */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/50">
            <div>
              <h3 className="font-bold text-foreground">
                {a.dashTopStudents}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {a.dashTopStudentsDesc}
              </p>
            </div>
            <Link
              href="/academy/admin/leaderboard"
              className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
            >
              {a.dashViewAll}
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
                {a.dashNoDataYet}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
