'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Mail } from 'lucide-react'

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await fetch('/api/academy/admin/teachers')
        if (res.ok) {
          const data = await res.json()
          setTeachers(data)
        }
      } catch (error) {
        console.error('Failed to fetch teachers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeachers()
  }, [])

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">إدارة المدرسين</h1>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          إضافة مدرس
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teachers.map((teacher) => (
          <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{teacher.name}</CardTitle>
              <p className="text-sm text-gray-600">{teacher.email}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm text-center">
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-xs text-gray-600">الدورات</div>
                  <div className="font-semibold">{teacher.courses_count}</div>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-xs text-gray-600">الطلاب</div>
                  <div className="font-semibold">{teacher.students_count}</div>
                </div>
              </div>

              <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                {teacher.status === 'active' ? 'نشط' : 'معطل'}
              </Badge>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit2 className="w-3 h-3 ml-1" />
                  تعديل
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Mail className="w-3 h-3 ml-1" />
                  رسالة
                </Button>
                <Button size="sm" variant="destructive" className="flex-1">
                  <Trash2 className="w-3 h-3 ml-1" />
                  حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {teachers.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-500">لا توجد مدرسين</p>
        </Card>
      )}
    </div>
  )
}
