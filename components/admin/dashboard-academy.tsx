"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { BookOpen, Users, Award, GraduationCap, TrendingUp, ArrowLeft, Loader2 } from "lucide-react"
import { ChartSkeleton, StatsGridSkeleton, TableSkeleton } from "@/components/admin/skeletons"

interface AcademyStats {
  totals: {
    courses: number
    published_courses: number
    lessons: number
    enrollments: number
    active_enrollments: number
    teachers: number
    certificates: number
    new_enrollments_30: number
  }
  recentCourses: { id: string; title: string; status: string; students_count: number; created_at: string }[]
  topCourses: { id: string; title: string; students_count: number }[]
  enrollmentsOverTime: { day: string; count: number }[]
}

export function DashboardAcademy() {
  const { t } = useI18n()
  const isAr = t.locale === "ar"

  const [data, setData] = useState<AcademyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/academy-stats")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 pb-20 lg:pb-0 font-sans" dir={isAr ? "rtl" : "ltr"}>
        <StatsGridSkeleton count={4} />
        <ChartSkeleton />
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/50">
            <div className="h-5 w-40 bg-accent animate-pulse rounded-md" />
          </div>
          <TableSkeleton rows={4} cols={4} />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="text-red-500 font-bold text-xl">حدث خطأ أثناء تحميل بيانات الأكاديمية</div>
        {error && <code className="bg-red-50 text-red-800 p-2 rounded text-sm">{error}</code>}
      </div>
    )
  }

  const { totals, recentCourses, topCourses, enrollmentsOverTime } = data

  const statCards = [
    {
      label: "الدورات المنشورة",
      value: totals.published_courses,
      sub: `${totals.courses} إجمالي`,
      icon: BookOpen,
      color: "bg-primary/10 text-primary border-primary/20",
    },
    {
      label: "إجمالي التسجيلات",
      value: totals.enrollments,
      sub: `${totals.new_enrollments_30} جديد خلال 30 يوم`,
      icon: Users,
      color: "bg-accent/10 text-accent border-accent/20",
    },
    {
      label: "المعلمون",
      value: totals.teachers,
      sub: `${totals.lessons} درس`,
      icon: GraduationCap,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    },
    {
      label: "الشهادات الممنوحة",
      value: totals.certificates,
      sub: `${totals.active_enrollments} تسجيل نشط`,
      icon: Award,
      color: "bg-amber-500/10 text-amber-600 border-amber-200",
    },
  ]

  // Build a simple bar chart from enrollmentsOverTime
  const maxCount = Math.max(...enrollmentsOverTime.map((d) => d.count), 1)

  return (
    <div className="space-y-6 pb-20 lg:pb-0 font-sans" dir={isAr ? "rtl" : "ltr"}>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-card rounded-xl p-4 sm:p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-md flex items-center justify-center border mb-3 ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {card.value.toLocaleString(isAr ? "ar-EG" : "en-US")}
              </p>
              <p className="text-sm font-medium text-foreground mt-1">{card.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Enrollments Over Time */}
      {enrollmentsOverTime.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-foreground">التسجيلات خلال 30 يوم</h3>
          </div>
          <div className="flex items-end gap-1 h-32">
            {enrollmentsOverTime.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full bg-primary/80 rounded-t-sm transition-all group-hover:bg-primary"
                  style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? "4px" : "0" }}
                  title={`${d.day}: ${d.count}`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{enrollmentsOverTime[0]?.day}</span>
            <span>{enrollmentsOverTime[enrollmentsOverTime.length - 1]?.day}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between bg-muted/50">
            <div>
              <h3 className="font-bold text-foreground">آخر الدورات المضافة</h3>
              <p className="text-sm text-muted-foreground mt-0.5">أحدث 5 دورات في المنصة</p>
            </div>
            <Link href="/admin/academy/courses" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              عرض الكل <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentCourses.length > 0
              ? recentCourses.map((course) => (
                <div key={course.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {course.students_count} طالب •{" "}
                      {new Date(course.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                    course.status === "published"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-muted text-muted-foreground border-border"
                  }`}>
                    {course.status === "published" ? "منشور" : "مسودة"}
                  </span>
                </div>
              ))
              : (
                <div className="p-8 text-center text-muted-foreground/50 text-sm">لا توجد دورات بعد</div>
              )}
          </div>
        </div>

        {/* Top Courses */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border bg-muted/50">
            <h3 className="font-bold text-foreground">أكثر الدورات تسجيلًا</h3>
            <p className="text-sm text-muted-foreground mt-0.5">الدورات الأعلى إقبالًا</p>
          </div>
          <div className="p-5 space-y-3">
            {topCourses.length > 0
              ? topCourses.map((course, i) => (
                <div key={course.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{course.title}</p>
                    <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(course.students_count / (topCourses[0]?.students_count || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground shrink-0">
                    {course.students_count.toLocaleString(isAr ? "ar-EG" : "en-US")}
                  </span>
                </div>
              ))
              : (
                <div className="py-6 text-center text-muted-foreground/50 text-sm">لا توجد بيانات</div>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}
