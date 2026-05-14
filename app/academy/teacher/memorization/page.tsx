'use client'

import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, TrendingUp } from 'lucide-react'

interface StudentMemorization {
  student_id: string
  student_name: string
  total_juz: number
  completed_suwar: number
  progress_percent: number
  last_recitation: string | null
}

export default function TeacherMemorizationPage() {
  const { data: session } = useSession()
  const { data: stats, isLoading: statsLoading } = useSWR<StudentMemorization[]>(
    session ? '/api/academy/teacher/memorization' : null,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    }
  )

  if (statsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg w-64"></div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">سجل الحفظ والتسميع</h1>
        <p className="text-slate-500 mt-2">تابع تقدم طلابك في حفظ القرآن والتسميع</p>
      </div>

      <div className="grid gap-4">
        {stats && stats.length > 0 ? (
          stats.map((student) => (
            <Card key={student.student_id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{student.student_name}</CardTitle>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {student.progress_percent}%
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-slate-500">أجزاء مكتملة</p>
                      <p className="font-semibold">{student.total_juz} / 30</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-slate-500">سور مكتملة</p>
                      <p className="font-semibold">{student.completed_suwar} / 114</p>
                    </div>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${student.progress_percent}%` }}
                  ></div>
                </div>

                {student.last_recitation && (
                  <p className="text-xs text-slate-500">
                    آخر تسميع: {new Date(student.last_recitation).toLocaleDateString('ar')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              لا توجد بيانات حفظ حالياً
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
