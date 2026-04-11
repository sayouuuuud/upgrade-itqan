'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Eye, BarChart3 } from 'lucide-react'

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/academy/admin/courses')
        if (res.ok) {
          const data = await res.json()
          setCourses(data)
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">إدارة الدورات</h1>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          دورة جديدة
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-right p-4">اسم الدورة</th>
              <th className="text-right p-4">المدرس</th>
              <th className="text-right p-4">الطلاب</th>
              <th className="text-right p-4">الحالة</th>
              <th className="text-right p-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-semibold">{course.name}</div>
                  <p className="text-xs text-gray-600">{course.description?.substring(0, 50)}...</p>
                </td>
                <td className="p-4">{course.teacher_name}</td>
                <td className="p-4">
                  <div className="font-semibold">{course.students_count}</div>
                </td>
                <td className="p-4">
                  <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                    {course.status === 'published' ? 'منشورة' : 'مسودة'}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {courses.length === 0 && (
        <Card className="text-center py-12">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">لا توجد دورات</p>
        </Card>
      )}
    </div>
  )
}
