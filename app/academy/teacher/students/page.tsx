'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Search, Mail, TrendingUp, Award, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/academy/teacher/students')
        if (res.ok) {
          const data = await res.json()
          setStudents(data)
        }
      } catch (error) {
        console.error('Failed to fetch students:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  const filteredStudents = students.filter(s =>
    s.name.includes(searchTerm) || s.email.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">الطلاب</h1>
          <p className="text-muted-foreground">قم بإدارة وتتبع طلابك في الأكاديمية</p>
        </div>
        <Link href="/academy/teacher/students/create">
          <Button className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            إضافة طالب جديد
          </Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
        <Input
          placeholder="ابحث عن طالب..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{student.name}</CardTitle>
              <p className="text-sm text-gray-600">{student.email}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-xs text-gray-600">الدورات</div>
                  <div className="font-semibold">{student.courses_count}</div>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-xs text-gray-600">النقاط</div>
                  <div className="font-semibold">{student.total_points}</div>
                </div>
                <div className="bg-purple-50 p-2 rounded">
                  <div className="text-xs text-gray-600">المهام</div>
                  <div className="font-semibold">{student.tasks_completed}/{student.tasks_total}</div>
                </div>
                <div className="bg-amber-50 p-2 rounded">
                  <div className="text-xs text-gray-600">التقدم</div>
                  <div className="font-semibold">{student.progress_percentage}%</div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-gray-600">آخر نشاط: {new Date(student.last_activity).toLocaleDateString('ar-EG')}</p>
                {student.badges_count > 0 && (
                  <p className="text-amber-600 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    {student.badges_count} شارة
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">عرض</Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Mail className="w-3 h-3 ml-1" />
                  تواصل
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <Card className="text-center py-12">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">لا توجد نتائج</p>
        </Card>
      )}
    </div>
  )
}
