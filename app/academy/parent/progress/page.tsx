'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Target, Activity, TrendingUp, BookOpen, Clock } from 'lucide-react'

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

      <div className="space-y-12">
        {progressData.length === 0 && (
          <div className="text-center text-muted-foreground p-8">لا يوجد بيانات متاحة.</div>
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
