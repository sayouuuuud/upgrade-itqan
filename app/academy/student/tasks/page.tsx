"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { 
  ClipboardList, Clock, Star, Filter, CheckCircle2,
  AlertCircle, BookOpen, Mic, FileText, HelpCircle
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string
  course_id: string
  course_title: string
  type: 'memorization' | 'recitation' | 'written' | 'quiz'
  due_date?: string
  points_value: number
  status: 'pending' | 'submitted' | 'graded' | 'late'
  grade?: number
  feedback?: string
}

export default function StudentTasksPage() {
  const { t } = useI18n()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all')

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch('/api/academy/student/tasks')
        if (res.ok) {
          const data = await res.json()
          setTasks(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [])

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    return task.status === filter
  })

  const typeIcons = {
    memorization: BookOpen,
    recitation: Mic,
    written: FileText,
    quiz: HelpCircle
  }

  const typeLabels = {
    memorization: t.academy?.memorization || 'حفظ',
    recitation: t.academy?.recitation || 'تسميع',
    written: t.academy?.written || 'كتابي',
    quiz: t.academy?.quiz || 'اختبار'
  }

  const statusConfig = {
    pending: { 
      label: t.academy?.pending || 'معلق', 
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: Clock
    },
    submitted: { 
      label: t.academy?.submitted || 'مُسلَّم', 
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      icon: CheckCircle2
    },
    graded: { 
      label: t.academy?.graded || 'مُقيَّم', 
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      icon: CheckCircle2
    },
    late: { 
      label: t.academy?.late || 'متأخر', 
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      icon: AlertCircle
    }
  }

  const getDueStatus = (dueDate?: string) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    
    if (days < 0) return { text: t.academy?.overdue || 'متأخر', urgent: true }
    if (days === 0) return { text: t.academy?.dueToday || 'اليوم', urgent: true }
    if (days === 1) return { text: t.academy?.dueTomorrow || 'غداً', urgent: true }
    if (days <= 3) return { text: `${days} ${t.academy?.days || 'أيام'}`, urgent: false }
    return { text: formatDate(dueDate), urgent: false }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('ar-SA', {
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const pendingCount = tasks.filter(t => t.status === 'pending').length
  const submittedCount = tasks.filter(t => t.status === 'submitted').length
  const gradedCount = tasks.filter(t => t.status === 'graded').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t.academy?.tasks || 'المهام'}</h1>
        <p className="text-muted-foreground mt-1">
          {t.academy?.tasksDesc || 'أكمل المهام واكسب النقاط'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setFilter('pending')}
          className={cn(
            "bg-card rounded-xl border p-4 text-center transition-all",
            filter === 'pending' ? "border-yellow-500 ring-2 ring-yellow-500/20" : "border-border hover:border-yellow-500/50"
          )}
        >
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-sm text-muted-foreground">{t.academy?.pending || 'معلقة'}</p>
        </button>
        <button
          onClick={() => setFilter('submitted')}
          className={cn(
            "bg-card rounded-xl border p-4 text-center transition-all",
            filter === 'submitted' ? "border-blue-500 ring-2 ring-blue-500/20" : "border-border hover:border-blue-500/50"
          )}
        >
          <p className="text-2xl font-bold text-blue-600">{submittedCount}</p>
          <p className="text-sm text-muted-foreground">{t.academy?.submitted || 'مُسلَّمة'}</p>
        </button>
        <button
          onClick={() => setFilter('graded')}
          className={cn(
            "bg-card rounded-xl border p-4 text-center transition-all",
            filter === 'graded' ? "border-green-500 ring-2 ring-green-500/20" : "border-border hover:border-green-500/50"
          )}
        >
          <p className="text-2xl font-bold text-green-600">{gradedCount}</p>
          <p className="text-sm text-muted-foreground">{t.academy?.graded || 'مُقيَّمة'}</p>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-4">
        {(['all', 'pending', 'submitted', 'graded'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === f
                ? "bg-blue-600 text-white"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {f === 'all' && (t.academy?.all || 'الكل')}
            {f === 'pending' && (t.academy?.pending || 'معلقة')}
            {f === 'submitted' && (t.academy?.submitted || 'مُسلَّمة')}
            {f === 'graded' && (t.academy?.graded || 'مُقيَّمة')}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">
            {t.academy?.noTasks || 'لا توجد مهام'}
          </h3>
          <p className="text-muted-foreground">
            {filter === 'all' 
              ? (t.academy?.noTasksYet || 'لم يتم تعيين مهام لك بعد')
              : (t.academy?.noTasksInFilter || 'لا توجد مهام في هذا التصنيف')
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const TypeIcon = typeIcons[task.type]
            const StatusIcon = statusConfig[task.status].icon
            const dueStatus = getDueStatus(task.due_date)

            return (
              <Link
                key={task.id}
                href={`/academy/student/tasks/${task.id}/submit`}
                className="block bg-card rounded-xl border border-border p-4 hover:border-blue-500/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    task.type === 'memorization' && "bg-green-100 text-green-600 dark:bg-green-900/30",
                    task.type === 'recitation' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
                    task.type === 'written' && "bg-purple-100 text-purple-600 dark:bg-purple-900/30",
                    task.type === 'quiz' && "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
                  )}>
                    <TypeIcon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                        {task.title}
                      </h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        statusConfig[task.status].color
                      )}>
                        {statusConfig[task.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.course_title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs",
                          task.type === 'memorization' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                          task.type === 'recitation' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                          task.type === 'written' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                          task.type === 'quiz' && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        )}>
                          {typeLabels[task.type]}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Star className="w-4 h-4" />
                        {task.points_value} {t.academy?.points || 'نقطة'}
                      </span>
                      {dueStatus && (
                        <span className={cn(
                          "flex items-center gap-1",
                          dueStatus.urgent ? "text-red-600" : "text-muted-foreground"
                        )}>
                          <Clock className="w-4 h-4" />
                          {dueStatus.text}
                        </span>
                      )}
                      {task.status === 'graded' && task.grade !== undefined && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          {task.grade}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
