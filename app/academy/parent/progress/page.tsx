'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Target, Activity, TrendingUp, BookOpen, Clock, BarChart3, Trophy, Star, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ParentProgressPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [progressData, setProgressData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch list of linked children
        const res = await fetch('/api/academy/parent/children')
        if (!res.ok) { setLoading(false); return }
        const { children } = await res.json()

        // For each child, fetch their course/report details in parallel
        const detailed = await Promise.all(
          (children || []).map(async (child: any) => {
            try {
              const rRes = await fetch(`/api/academy/parent/children/${child.child_id}/reports`)
              if (!rRes.ok) return { ...child, courses: [], stats: {} }
              const rData = await rRes.json()
              const totalLessons = rData.courses?.reduce((acc: number, c: any) => acc + (c.total_lessons || 0), 0) || 0
              const completedLessons = rData.courses?.reduce((acc: number, c: any) => acc + (c.completed_lessons || 0), 0) || 0
              const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
              return {
                id: child.child_id,
                name: child.child_name,
                overallProgress,
                courses: (rData.courses || []).map((c: any) => ({
                  name: c.title,
                  progress: c.total_lessons > 0 ? Math.round((c.completed_lessons / c.total_lessons) * 100) : 0,
                  status: c.completed_lessons === c.total_lessons && c.total_lessons > 0 ? 'completed' : 'in_progress'
                })),
                stats: rData.stats || {},
                weeklyActivity: [0, 0, 0, 0, 0, 0, 0] // placeholder – real activity log not yet implemented
              }
            } catch {
              return { id: child.child_id, name: child.child_name, courses: [], overallProgress: 0, weeklyActivity: [] }
            }
          })
        )

        setProgressData(detailed.filter(Boolean))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="p-8 text-center">{isAr ? "جاري التحميل..." : "Loading..."}</div>
  }


  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="space-y-2 pb-4 border-b border-border/50">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
          <Target className="w-4 h-4" />
          {isAr ? "متابعة التقدم" : "Progress Tracking"}
        </div>
        <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
          {isAr ? "التقدم والمستويات" : "Progress & Levels"}
        </h1>
        <p className="text-muted-foreground font-medium max-w-2xl">
          {isAr
            ? "نظرة شاملة ومقارنة على نسب إنجاز أبنائك في الدورات المختلفة ومعدلات نشاطهم الأسبوعية."
            : "Comprehensive overview and comparison of your children's completion rates across courses and weekly activity rates."}
        </p>
      </div>

      {/* Comparison Section - Only show if more than 1 child */}
      {progressData.length > 1 && (
        <Card className="border-border/50 shadow-sm rounded-3xl bg-card overflow-hidden">
          <CardHeader className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">{isAr ? "مقارنة أداء الأبناء" : "Children Performance Comparison"}</CardTitle>
                <CardDescription className="font-medium mt-1">
                  {isAr ? "مقارنة شاملة بين تقدم ونشاط أبنائك" : "Comprehensive comparison of your children's progress and activity"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Overall Progress Comparison */}
            <div className="mb-8">
              <h4 className="text-sm font-bold text-muted-foreground uppercase mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                {isAr ? "التقدم الإجمالي" : "Overall Progress"}
              </h4>
              <div className="space-y-4">
                {progressData
                  .sort((a, b) => b.overallProgress - a.overallProgress)
                  .map((student, index) => (
                    <div key={student.id} className="flex items-center gap-4">
                      {/* Rank */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                        index === 0 ? "bg-amber-100 text-amber-700" :
                        index === 1 ? "bg-gray-100 text-gray-700" :
                        "bg-orange-100 text-orange-700"
                      )}>
                        {index === 0 ? <Trophy className="w-4 h-4" /> : index + 1}
                      </div>
                      
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold">{student.name.charAt(0)}</span>
                      </div>
                      
                      {/* Name and Progress */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-foreground truncate">{student.name}</span>
                          <span className={cn(
                            "font-black text-sm",
                            student.overallProgress >= 80 ? "text-emerald-500" :
                            student.overallProgress >= 50 ? "text-amber-500" :
                            "text-red-500"
                          )}>
                            {student.overallProgress}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              student.overallProgress >= 80 ? "bg-emerald-500" :
                              student.overallProgress >= 50 ? "bg-amber-500" :
                              "bg-red-500"
                            )}
                            style={{ width: `${student.overallProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Courses Comparison */}
            <div className="mb-8">
              <h4 className="text-sm font-bold text-muted-foreground uppercase mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                {isAr ? "عدد الدورات المكتملة" : "Completed Courses"}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {progressData.map((student) => {
                  const completedCourses = student.courses.filter((c: any) => c.progress === 100).length
                  const totalCourses = student.courses.length
                  return (
                    <div key={student.id} className="p-4 rounded-xl bg-muted/30 text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{student.name.charAt(0)}</span>
                      </div>
                      <p className="font-bold text-foreground truncate">{student.name}</p>
                      <p className="text-2xl font-black text-blue-600 mt-1">
                        {completedCourses}<span className="text-sm text-muted-foreground font-medium">/{totalCourses}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{isAr ? "دورة مكتملة" : "completed"}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Weekly Activity Comparison */}
            <div>
              <h4 className="text-sm font-bold text-muted-foreground uppercase mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                {isAr ? "النشاط الأسبوعي (ساعات)" : "Weekly Activity (hours)"}
              </h4>
              <div className="flex items-end justify-center gap-8 h-32">
                {progressData.map((student, idx) => {
                  const totalHours = student.weeklyActivity.reduce((acc: number, curr: number) => acc + curr, 0)
                  const maxHours = Math.max(...progressData.map((s: any) => 
                    s.weeklyActivity.reduce((acc: number, curr: number) => acc + curr, 0)
                  ))
                  const height = maxHours === 0 ? 10 : Math.max(10, (totalHours / maxHours) * 100)
                  const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500']
                  
                  return (
                    <div key={student.id} className="flex flex-col items-center gap-2 group">
                      <div className="relative">
                        <div
                          className={cn(
                            "w-16 rounded-t-lg transition-all",
                            colors[idx % colors.length]
                          )}
                          style={{ height: `${height}px` }}
                        />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold">
                          {totalHours}h
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-bold">{student.name.charAt(0)}</span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground truncate max-w-[80px]">
                        {student.name.split(' ')[0]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stats Summary */}
            <div className="mt-8 pt-6 border-t border-border/50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                  <Star className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <p className="text-2xl font-black text-emerald-600">{
                    progressData.reduce((acc, s) => acc + (s.overallProgress >= 80 ? 1 : 0), 0)
                  }</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "متفوقين (80%+)" : "High Achievers"}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20">
                  <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-black text-blue-600">{
                    progressData.reduce((acc, s) => acc + s.courses.length, 0)
                  }</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "إجمالي الدورات" : "Total Courses"}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20">
                  <Award className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-black text-amber-600">{
                    progressData.reduce((acc, s) => acc + s.courses.filter((c: any) => c.progress === 100).length, 0)
                  }</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "دورات مكتملة" : "Completed"}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20">
                  <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-black text-purple-600">{
                    progressData.reduce((acc, s) => acc + s.weeklyActivity.reduce((a: number, c: number) => a + c, 0), 0)
                  }h</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "ساعات هذا الأسبوع" : "Hours This Week"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-12">
        {progressData.length === 0 && (
          <div className="text-center text-muted-foreground p-8">{isAr ? "لا يوجد بيانات متاحة." : "No data available."}</div>
        )}
        {progressData.map(student => (
          <div key={student.id} className="space-y-6">
            <h3 className="text-2xl font-black text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary">{student.name.charAt(0)}</span>
              </div>
              {student.name}
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Courses Progress */}
              <Card className="lg:col-span-8 border-border/50 shadow-sm rounded-3xl bg-card">
                <CardHeader className="p-6 pb-2 border-b border-border/50 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg font-bold">{isAr ? "التقدم في الدورات" : "Course Progress"}</CardTitle>
                      <CardDescription className="font-medium text-xs mt-1">{isAr ? "نسب الإنجاز لكل دورة مسجلة" : "Completion rates for each enrolled course"}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {student.courses.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm">التلميذ غير مسجل في أي دورة.</div>
                  ) : student.courses.map((course: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-foreground">{course.name}</span>
                        <span className={`font-black ${course.progress === 100 ? 'text-emerald-500' : 'text-primary'}`}>
                          {course.progress}%
                        </span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${course.progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Weekly Activity "Chart" */}
              <Card className="lg:col-span-4 border-border/50 shadow-sm rounded-3xl bg-card">
                <CardHeader className="p-6 pb-2 border-b border-border/50 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    <div>
                      <CardTitle className="text-lg font-bold">{isAr ? "النشاط الأسبوعي" : "Weekly Activity"}</CardTitle>
                      <CardDescription className="font-medium text-xs mt-1">{isAr ? "بالساعات" : "In hours"}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-end justify-between h-40 gap-2 mb-2">
                    {student.weeklyActivity.map((hours: number, i: number) => {
                      const max = Math.max(...student.weeklyActivity);
                      const height = max === 0 ? 0 : (hours / max) * 100;
                      const daysAr = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
                      const daysEn = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                      return (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                          <div className="w-full flex-1 flex items-end relative rounded-md overflow-hidden bg-muted/30">
                            <div
                              className="w-full bg-amber-400 group-hover:bg-amber-500 transition-colors rounded-t-sm"
                              style={{ height: `${height}%` }}
                            >
                              <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs font-bold px-2 py-1 rounded shadow-lg transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                {hours} {isAr ? "س" : "h"}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{isAr ? daysAr[i] : daysEn[i]}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50 flex flex-col items-center">
                    <p className="text-sm font-bold text-muted-foreground uppercase mb-1">{isAr ? "إجمالي الساعات" : "Total Hours"}</p>
                    <h4 className="text-3xl font-black text-foreground">
                      {student.weeklyActivity.reduce((acc: number, curr: number) => acc + curr, 0)} <span className="text-base text-muted-foreground font-medium">{isAr ? "ساعة" : "hrs"}</span>
                    </h4>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
