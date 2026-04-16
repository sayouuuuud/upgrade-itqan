'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import Link from 'next/link'
import { BookOpen, Users, Award, GraduationCap, ArrowLeft, Loader2, Sparkles } from 'lucide-react'

export default function AcademyAdminPage() {
  const { t } = useI18n()
  const isAr = t.locale === "ar"

  const [stats, setStats] = useState({
    total_students: 0,
    total_teachers: 0,
    total_courses: 0,
    total_points_distributed: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/academy/admin/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const formatNumber = (num: number) => num.toLocaleString(isAr ? "ar-EG" : "en-US")

  return (
    <div className="space-y-6 pb-20 lg:pb-0 font-sans" dir={isAr ? "rtl" : "ltr"}>
      
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {t.academy?.dashboard || 'لوحة تحكم الأكاديمية'}
        </h1>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Students */}
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {formatNumber(stats.total_students)}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">{t.academy?.totalStudents || 'الطلاب المسجلين'}</p>
          </div>
        </div>

        {/* Teachers */}
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {formatNumber(stats.total_teachers)}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">{t.academy?.totalTeachers || 'المدرسين النشطين'}</p>
          </div>
        </div>

        {/* Courses */}
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {formatNumber(stats.total_courses)}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">{t.academy?.totalCourses || 'الدورات المنشورة'}</p>
          </div>
        </div>

        {/* Points */}
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
            <Award className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {(stats.total_points_distributed / 1000).toLocaleString(isAr ? "ar-EG" : "en-US", { maximumFractionDigits: 1 })}K
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">{t.academy?.totalPoints || 'نقطة موزعة'}</p>
          </div>
        </div>

      </div>

      {/* Advanced Analytics / Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Latest Courses Table Container */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/50 mb-0">
            <div>
              <h3 className="font-bold text-foreground">{t.academy?.latestCourses || 'أحدث الدورات'}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t.academy?.recentlyAddedCourses || 'الدورات المضافة مؤخراً في المنصة'}</p>
            </div>
            <Link href="/academy/admin/courses" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
              {t.admin?.viewAll || 'عرض الكل'}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
          <div className="p-10 flex-1 flex flex-col items-center justify-center text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground font-medium">{t.admin?.noDataYet || 'لا توجد بيانات لعرضها حتى الآن.'}</p>
          </div>
        </div>

        {/* Most Active Students Container */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/50 mb-0">
            <div>
              <h3 className="font-bold text-foreground">{t.academy?.activeStudents || 'أنشط الطلاب'}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t.academy?.studentsWithMostPoints || 'الطلاب الأكثر حصولاً على النقاط والشارات'}</p>
            </div>
            <Link href="/academy/admin/leaderboard" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
              {t.admin?.viewAll || 'عرض الكل'}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
          <div className="p-10 flex-1 flex flex-col items-center justify-center text-center">
            <Sparkles className="w-12 h-12 text-amber-500/20 mb-4" />
            <p className="text-muted-foreground font-medium">{t.admin?.noDataYet || 'لا توجد بيانات لعرضها حتى الآن.'}</p>
          </div>
        </div>

      </div>
    </div>
  )
}
