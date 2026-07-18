'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users, Search, Mail, Award, UserPlus, BookOpen,
  TrendingUp, CheckCircle2, ArrowLeft, Sparkles,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageLoadingSkeleton } from '@/components/ui/page-loading-skeleton'

interface Student {
  id: string
  name: string
  email: string
  avatar_url?: string | null
  courses_count: number
  total_points: number
  tasks_completed: number
  tasks_total: number
  progress_percentage: number
  badges_count: number
  last_activity: string | null
}

export default function TeacherStudentsPage() {
  const { t } = useI18n()
  const academyTeacher = (t as any).academyTeacher as Record<string, string> | undefined
  const a = t.admin
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/academy/teacher/students')
        if (res.ok) {
          const json = await res.json()
          setStudents(Array.isArray(json) ? json : (json.data || []))
        }
      } catch (error) {
        console.error('Failed to fetch students:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (s) =>
          s.name?.includes(searchTerm) ||
          s.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [students, searchTerm],
  )

  const summary = useMemo(() => {
    const total = students.length
    const totalCourses = students.reduce((a, s) => a + (s.courses_count || 0), 0)
    const avgProgress = total
      ? Math.round(
          students.reduce((a, s) => a + Number(s.progress_percentage || 0), 0) / total,
        )
      : 0
    const totalBadges = students.reduce((a, s) => a + (s.badges_count || 0), 0)
    return { total, totalCourses, avgProgress, totalBadges }
  }, [students])

  if (loading) {
    return <PageLoadingSkeleton />
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">{a.tchsStudents}</h1>
            <p className="text-sm text-muted-foreground font-medium">
              {a.tchsStudentsDesc}
            </p>
          </div>
        </div>
        <Link href="/academy/teacher/students/create">
          <Button className="flex items-center gap-2 rounded-xl font-bold shadow-sm">
            <UserPlus className="w-4 h-4" />
            {a.tchsAddStudent}
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={<Users className="w-5 h-5" />} label={a.tchsTotalStudents} value={summary.total} tint="primary" />
        <StatTile icon={<BookOpen className="w-5 h-5" />} label={a.tchsTotalEnrollments} value={summary.totalCourses} tint="blue" />
        <StatTile icon={<TrendingUp className="w-5 h-5" />} label={a.tchsAvgProgress} value={`${summary.avgProgress}%`} tint="green" />
        <StatTile icon={<Award className="w-5 h-5" />} label={a.tchsBadgesAwarded} value={summary.totalBadges} tint="amber" />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder={a.tchsSearchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-11 h-12 rounded-xl bg-card"
        />
      </div>

      {/* Students Grid */}
      {filteredStudents.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="group border-border rounded-3xl overflow-hidden bg-card hover:shadow-xl hover:shadow-black/5 hover:border-primary/30 transition-all duration-300"
            >
              <CardContent className="p-5 space-y-4">
                {/* Identity */}
                <div className="flex items-center gap-3">
                  <Link href={`/academy/teacher/students/${student.id}`} className="shrink-0">
                    {student.avatar_url ? (
                      <img
                        src={student.avatar_url || "/placeholder.svg"}
                        alt={student.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-border group-hover:ring-primary/40 transition-all"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl ring-2 ring-border group-hover:ring-primary/40 transition-all">
                        {student.name?.charAt(0)}
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/academy/teacher/students/${student.id}`}>
                      <h3 className="font-bold text-foreground truncate hover:text-primary transition-colors">
                        {student.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                    {student.badges_count > 0 && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        <Award className="w-3 h-3" />
                        {student.badges_count} {a.tchsBadges}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-muted-foreground">{a.tchsProgress}</span>
                    <span className="text-primary">{Math.round(Number(student.progress_percentage || 0))}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, Number(student.progress_percentage || 0))}%` }}
                    />
                  </div>
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-3 gap-2">
                  <MiniStat icon={<BookOpen className="w-4 h-4" />} label={a.tchsCourses} value={student.courses_count} />
                  <MiniStat icon={<CheckCircle2 className="w-4 h-4" />} label={a.tchsTasks} value={`${student.tasks_completed}/${student.tasks_total}`} />
                  <MiniStat icon={<Sparkles className="w-4 h-4" />} label={a.tchsPoints} value={student.total_points} />
                </div>

                {student.last_activity && (
                  <p className="text-[11px] text-muted-foreground">
                    {a.tchsLastActivity} {new Date(student.last_activity).toLocaleDateString('ar-EG')}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Link href={`/academy/teacher/students/${student.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full rounded-xl font-bold">
                      {a.tchsViewProfile}
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    className="flex-1 rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary/20 shadow-none"
                    onClick={() => router.push(`/academy/teacher/chat?studentId=${student.id}`)}
                  >
                    <Mail className="w-4 h-4 ml-1.5" />
                    {a.tchsMessage}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-border rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="font-bold text-lg mb-1">
              {searchTerm ? a.tchsNoResults : a.tchsNoStudents}
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              {searchTerm
                ? a.tchsNoResultsHint
                : a.tchsNoStudentsHint}
            </p>
            {searchTerm ? (
              <Button variant="outline" className="rounded-xl" onClick={() => setSearchTerm('')}>
                <ArrowLeft className="w-4 h-4 ml-1.5" />
                {a.tchsClearSearch}
              </Button>
            ) : (
              <Link href="/academy/teacher/students/create">
                <Button className="rounded-xl font-bold">
                  <UserPlus className="w-4 h-4 ml-1.5" />
                  {a.tchsAddStudent}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatTile({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  tint: 'primary' | 'blue' | 'green' | 'amber'
}) {
  const tints: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  }
  return (
    <Card className="border-border rounded-2xl bg-card">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tints[tint]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground font-medium mt-1 truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-2.5 rounded-xl bg-muted/40 border border-border">
      <div className="text-primary/70 mb-1">{icon}</div>
      <p className="text-sm font-bold leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
    </div>
  )
}
