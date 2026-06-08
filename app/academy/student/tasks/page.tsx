"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { 
  ClipboardList, Clock, Star, CheckCircle2,
  AlertCircle, BookOpen, Mic, HelpCircle,
  TrendingUp, Loader2, PlayCircle, FolderOpen, PenTool,
  Calendar, CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

type TaskKind = 'memorization' | 'recitation' | 'written' | 'quiz' | 'project' | 'media'

interface Task {
  id: string
  title: string
  description?: string
  course_id: string
  course_title: string
  type?: string
  due_date?: string
  points_value: number
  status: 'pending' | 'submitted' | 'graded' | 'late'
  grade?: number
  feedback?: string
}

function normalizeTaskType(raw?: string | null): TaskKind {
  const v = (raw || '').toLowerCase()
  if (v === 'recitation' || v === 'audio') return 'recitation'
  if (v === 'video' || v === 'image') return 'media'
  if (v === 'memorization' || v === 'memorize') return 'memorization'
  if (v === 'quiz' || v === 'test' || v === 'exam') return 'quiz'
  if (v === 'project' || v === 'file') return 'project'
  return 'written'
}

export default function StudentTasksPage() {
  const { t } = useI18n()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all')
  const [marking, setMarking] = useState<string | null>(null)

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

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleMarkDone = async (taskId: string, currentStatus: Task['status']) => {
    setMarking(taskId)
    const action = currentStatus === 'submitted' ? 'undo_done' : 'mark_done'
    try {
      const res = await fetch(`/api/academy/student/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId
          ? { ...t, status: action === 'mark_done' ? 'submitted' : 'pending' }
          : t))
      }
    } catch (err) {
      console.error('mark done failed', err)
    } finally {
      setMarking(null)
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    return task.status === filter
  })

  const typeIcons = {
    memorization: BookOpen,
    recitation: Mic,
    written: PenTool,
    quiz: HelpCircle,
    project: FolderOpen,
    media: PlayCircle
  }

  const statusConfig = {
    pending: { 
      label: 'معلق', 
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      icon: Clock
    },
    submitted: { 
      label: 'مُسلَّم', 
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle2
    },
    graded: { 
      label: 'مُقيَّم', 
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      icon: CheckCircle
    },
    late: { 
      label: 'متأخر', 
      color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
      icon: AlertCircle
    }
  }

  const getDueStatus = (dueDate?: string) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    
    if (days < 0) return { text: 'متأخر', isLate: true, isUrgent: false }
    if (days === 0) return { text: 'اليوم', isLate: false, isUrgent: true }
    if (days === 1) return { text: 'غداً', isLate: false, isUrgent: true }
    if (days <= 3) return { text: `باقي ${days} أيام`, isLate: false, isUrgent: false }
    return { text: formatDate(dueDate), isLate: false, isUrgent: false }
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
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        <p className="text-muted-foreground font-medium">جاري تحميل المهام...</p>
      </div>
    )
  }

  const pendingCount = tasks.filter(t => t.status === 'pending').length
  const submittedCount = tasks.filter(t => t.status === 'submitted').length
  const gradedCount = tasks.filter(t => t.status === 'graded').length
  const lateCount = tasks.filter(t => t.status === 'late').length
  const totalCount = tasks.length
  const doneCount = submittedCount + gradedCount
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          {t.academy?.tasks || 'المهام الدراسية'}
        </h1>
        <p className="text-muted-foreground mt-2 text-base">
          {t.academy?.tasksDesc || 'تابع واجباتك واختباراتك وأكمل مهامك في الوقت المحدد.'}
        </p>
      </div>

      {/* Completion progress card */}
      {totalCount > 0 && (
        <Card className="border-border/50 shadow-sm bg-card/50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    مؤشر الإنجاز الكلي
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <span className="text-muted-foreground">{doneCount} من {totalCount} مهام مكتملة</span>
                    {lateCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-xs font-medium dark:bg-rose-900/20 dark:text-rose-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {lateCount} مهام متأخرة
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full max-w-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">نسبة الإنجاز</span>
                  <span className="text-sm font-bold">{completionPct}%</span>
                </div>
                <Progress value={completionPct} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card 
          className={cn(
            "cursor-pointer transition-colors hover:bg-muted/50 border-border/50 shadow-sm",
            filter === 'pending' && "border-amber-500/50 bg-amber-50/30 dark:bg-amber-900/10"
          )}
          onClick={() => setFilter('pending')}
        >
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-2">المهام المعلقة</p>
            <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-colors hover:bg-muted/50 border-border/50 shadow-sm",
            filter === 'submitted' && "border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-900/10"
          )}
          onClick={() => setFilter('submitted')}
        >
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-2">المهام المُسلَّمة</p>
            <p className="text-3xl font-bold text-foreground">{submittedCount}</p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-colors hover:bg-muted/50 border-border/50 shadow-sm",
            filter === 'graded' && "border-blue-500/50 bg-blue-50/30 dark:bg-blue-900/10"
          )}
          onClick={() => setFilter('graded')}
        >
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-2">المهام المُقيَّمة</p>
            <p className="text-3xl font-bold text-foreground">{gradedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center">
        {(['all', 'pending', 'submitted', 'graded'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            className="rounded-full px-5"
            onClick={() => setFilter(f)}
          >
            {f === 'all' && 'الكل'}
            {f === 'pending' && 'المعلقة'}
            {f === 'submitted' && 'المُسلَّمة'}
            {f === 'graded' && 'المُقيَّمة'}
          </Button>
        ))}
      </div>

      {/* Tasks Grid/List */}
      {filteredTasks.length === 0 ? (
        <Card className="border-dashed border-2 shadow-none bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              لا توجد مهام
            </h3>
            <p className="text-muted-foreground max-w-sm">
              {filter === 'all' 
                ? 'أنت على أتم الاستعداد! لم يتم تعيين مهام جديدة لك بعد.'
                : 'لا توجد مهام تطابق هذا التصنيف حالياً.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const kind = normalizeTaskType(task.type)
            const TypeIcon = typeIcons[kind]
            const dueStatus = getDueStatus(task.due_date)
            const isDoneOrGraded = task.status === 'submitted' || task.status === 'graded'
            const canSelfMark = task.status === 'pending' || task.status === 'late' || task.status === 'submitted'
            const conf = statusConfig[task.status]

            return (
              <Card 
                key={task.id} 
                className={cn(
                  "flex flex-col overflow-hidden transition-all hover:border-primary/30",
                  task.status === 'late' && "border-rose-200 dark:border-rose-900/50"
                )}
              >
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background border shadow-sm text-foreground">
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <Badge variant="outline" className={cn("border bg-transparent font-medium", conf.color)}>
                          <conf.icon className="w-3.5 h-3.5 ml-1" />
                          {conf.label}
                        </Badge>
                      </div>
                    </div>

                    {canSelfMark && task.status !== 'graded' && (
                      <Button
                        size="icon"
                        variant={isDoneOrGraded ? "outline" : "ghost"}
                        onClick={(e) => {
                          e.preventDefault()
                          handleMarkDone(task.id, task.status)
                        }}
                        disabled={marking === task.id}
                        className={cn(
                          "h-8 w-8 rounded-full",
                          isDoneOrGraded && "text-emerald-600 border-emerald-200 hover:bg-emerald-50",
                          !isDoneOrGraded && "hover:bg-primary/10 hover:text-primary"
                        )}
                        title={isDoneOrGraded ? 'تراجع عن التسليم' : 'تأشير كمنجز'}
                      >
                        {marking === task.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4 flex-1 flex flex-col">
                  <div className="mb-4">
                    <Link href={`/academy/student/tasks/${task.id}/submit`} className="hover:underline hover:text-primary">
                      <h3 className="text-lg font-semibold text-foreground line-clamp-1 mb-1">
                        {task.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 line-clamp-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {task.course_title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>{task.points_value}</span>
                      </div>
                      
                      {dueStatus && (
                        <div className={cn(
                          "flex items-center gap-1 text-sm",
                          dueStatus.isLate ? "text-rose-600 font-medium" :
                          dueStatus.isUrgent ? "text-amber-600 font-medium" :
                          "text-muted-foreground"
                        )}>
                          <Calendar className="w-4 h-4" />
                          <span>{dueStatus.text}</span>
                        </div>
                      )}
                    </div>

                    <Button 
                      asChild 
                      variant={isDoneOrGraded ? "secondary" : "default"}
                      size="sm"
                    >
                      <Link href={`/academy/student/tasks/${task.id}/submit`}>
                        {isDoneOrGraded ? 'التفاصيل' : 'ابدأ'}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
