'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Pencil,
  ListChecks,
  Users,
} from 'lucide-react'

type DisplayStatus = 'pending' | 'submitted' | 'graded'

interface TaskRow {
  id: string
  title: string
  description?: string
  type?: string
  status?: string
  course_name?: string
  due_date?: string
  submitted_count: number
  graded_count: number
  total_students: number
}

// Derive a meaningful status from the submission counts so the list reflects
// reality instead of always showing "pending".
function deriveStatus(task: TaskRow): DisplayStatus {
  const submitted = task.submitted_count || 0
  const graded = task.graded_count || 0
  if (task.status === 'graded') return 'graded'
  if (submitted > 0 && graded >= submitted) return 'graded'
  if (submitted > 0) return 'submitted'
  return 'pending'
}

export default function TeacherTasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | DisplayStatus>('all')

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/academy/teacher/tasks')
        if (res.ok) {
          const json = await res.json()
          setTasks(Array.isArray(json) ? json : json.data || [])
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
    filter === 'all' ? true : deriveStatus(t) === filter
  )

  const statusColor: Record<DisplayStatus, 'secondary' | 'outline' | 'default'> = {
    pending: 'secondary',
    submitted: 'outline',
    graded: 'default',
  }

  const statusLabel: Record<DisplayStatus, string> = {
    pending: 'بانتظار التسليم',
    submitted: 'بحاجة لتصحيح',
    graded: 'مصححة',
  }

  const statusIcon: Record<DisplayStatus, React.ReactNode> = {
    pending: <Clock className="w-4 h-4" />,
    submitted: <AlertCircle className="w-4 h-4" />,
    graded: <CheckCircle className="w-4 h-4" />,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">المهام</h1>
        <Link href="/academy/teacher/tasks/new">
          <Button>
            <Plus className="w-4 h-4 ml-2" />
            مهمة جديدة
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
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
        {filteredTasks.map((task) => {
          const ds = deriveStatus(task)
          const isQuiz = task.type === 'quiz'
          return (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <Badge variant={statusColor[ds]}>
                        {statusIcon[ds]}
                        <span className="ml-1">{statusLabel[ds]}</span>
                      </Badge>
                      {isQuiz && (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                          <ListChecks className="w-3.5 h-3.5 ml-1" />
                          اختبار
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                    )}
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                      {task.course_name && <span>الدورة: {task.course_name}</span>}
                      {task.due_date && (
                        <span>موعد التسليم: {new Date(task.due_date).toLocaleDateString('ar-EG')}</span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {task.submitted_count} مُسلِّم
                        {task.graded_count > 0 && ` · ${task.graded_count} مُصحَّح`}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/academy/teacher/tasks/${task.id}/grade`}>
                      <Button size="sm" variant="outline">عرض التسليمات</Button>
                    </Link>
                    <Link href={`/academy/teacher/tasks/${task.id}/edit`}>
                      <Button size="sm" variant="outline">
                        <Pencil className="w-3.5 h-3.5 ml-1" />
                        تعديل
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTasks.length === 0 && (
        <Card className="text-center py-12">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">لا توجد مهام</p>
        </Card>
      )}
    </div>
  )
}
