'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, AlertCircle, Plus, Filter } from 'lucide-react'

export default function TeacherTasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all')

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/academy/teacher/tasks')
        if (res.ok) {
          const data = await res.json()
          setTasks(data)
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  const filteredTasks = tasks.filter(t => 
    filter === 'all' ? true : t.status === filter
  )

  const statusColor = {
    pending: 'secondary',
    submitted: 'outline',
    graded: 'default',
    late: 'destructive'
  }

  const statusLabel = {
    pending: 'معلقة',
    submitted: 'مرسلة',
    graded: 'مصححة',
    late: 'متأخرة'
  }

  const statusIcon = {
    pending: <Clock className="w-4 h-4" />,
    submitted: <AlertCircle className="w-4 h-4" />,
    graded: <CheckCircle className="w-4 h-4" />,
    late: <AlertCircle className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">المهام</h1>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          مهمة جديدة
        </Button>
      </div>

      <div className="flex gap-2">
        {(['all', 'pending', 'submitted', 'graded'] as const).map((f) => (
          <Button 
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'الكل' : statusLabel[f]}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{task.title}</h3>
                    <Badge variant={statusColor[task.status as keyof typeof statusColor]}>
                      {statusIcon[task.status as keyof typeof statusIcon]}
                      <span className="ml-1">{statusLabel[task.status as keyof typeof statusLabel]}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{task.description}</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>الدورة: {task.course_name}</p>
                    <p>موعد التسليم: {new Date(task.due_date).toLocaleDateString('ar-EG')}</p>
                    <p>عدد المسلمين: {task.submitted_count} / {task.total_students}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">عرض الإرسالات</Button>
                  <Button size="sm" variant="outline">تعديل</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card className="text-center py-12">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">لا توجد مهام</p>
        </Card>
      )}
    </div>
  )
}
