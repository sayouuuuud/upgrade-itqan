"use client"

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, BookOpen, GraduationCap, Award, Loader2, UserCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AnalyticsData {
  stats: {
    totalStudents: number
    activeCourses: number
    completionRate: number
    totalTeachers: number
    weeklyEnrollments: number
    totalCertificates: number
  }
  enrollmentTrend: { month: string; count: number }[]
  genderDistribution: { gender: string; count: number }[]
  topCourses: { title: string; enrollments: number }[]
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/academy/admin/analytics')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  const stats = data?.stats || {
    totalStudents: 0,
    activeCourses: 0,
    completionRate: 0,
    totalTeachers: 0,
    weeklyEnrollments: 0,
    totalCertificates: 0
  }

  const statCards = [
    { label: 'إجمالي الطلاب', value: stats.totalStudents.toLocaleString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'الدورات النشطة', value: stats.activeCourses.toString(), icon: BookOpen, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'معدل الإتمام', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'عدد المدرسين', value: stats.totalTeachers.toString(), icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'تسجيلات هذا الأسبوع', value: stats.weeklyEnrollments.toString(), icon: UserCheck, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'الشهادات الصادرة', value: stats.totalCertificates.toString(), icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ]

  const months: Record<string, string> = {
    '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
    '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
    '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
  }

  const genderLabels: Record<string, string> = {
    'male': 'ذكور',
    'female': 'إناث',
    'unknown': 'غير محدد'
  }

  const maxEnrollment = Math.max(...(data?.enrollmentTrend || []).map(e => e.count), 1)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          التحليلات
        </h1>
        <p className="text-sm text-muted-foreground mt-1">نظرة عامة على أداء ومقاييس الأكاديمية</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              نمو التسجيلات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.enrollmentTrend && data.enrollmentTrend.length > 0 ? (
              <div className="space-y-3">
                {data.enrollmentTrend.map((item, idx) => {
                  const monthNum = item.month.split('-')[1]
                  const monthName = months[monthNum] || item.month
                  const width = (item.count / maxEnrollment) * 100
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-16 shrink-0">{monthName}</span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-10 text-left">{item.count}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات كافية
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              توزيع الطلاب
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.genderDistribution && data.genderDistribution.length > 0 ? (
              <div className="flex items-center justify-center gap-8 py-8">
                {data.genderDistribution.map((item, idx) => {
                  const colors = ['bg-blue-500', 'bg-pink-500', 'bg-gray-400']
                  const total = data.genderDistribution.reduce((acc, g) => acc + g.count, 0)
                  const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0
                  return (
                    <div key={idx} className="text-center">
                      <div className={`w-20 h-20 rounded-full ${colors[idx % colors.length]} flex items-center justify-center mx-auto mb-3`}>
                        <span className="text-white text-xl font-black">{percentage}%</span>
                      </div>
                      <p className="font-bold text-foreground">{genderLabels[item.gender] || item.gender}</p>
                      <p className="text-sm text-muted-foreground">{item.count} طالب</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات كافية
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Courses */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            أكثر الدورات تسجيلاً
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.topCourses && data.topCourses.length > 0 ? (
            <div className="space-y-3">
              {data.topCourses.map((course, idx) => {
                const maxCourse = Math.max(...data.topCourses.map(c => c.enrollments), 1)
                const width = (course.enrollments / maxCourse) * 100
                const medals = ['bg-amber-500', 'bg-gray-400', 'bg-amber-700']
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${medals[idx] || 'bg-muted'} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-sm font-bold">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{course.title}</p>
                      <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-primary/70 rounded-full transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-muted-foreground shrink-0">{course.enrollments} طالب</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              لا توجد دورات حتى الآن
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
