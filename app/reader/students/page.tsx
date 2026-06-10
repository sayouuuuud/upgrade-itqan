'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users, Search, Mail, BookOpen, Mic, Calendar,
  TrendingUp, CheckCircle2, Clock, Star, Route,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SimpleListSkeleton } from '@/components/ui/skeletons'

interface Student {
  student_id: string
  student_name: string
  student_email: string | null
  avatar_url: string | null
  gender: string | null
  last_login_at: string | null
  total_recitations: number
  pending_recitations: number
  total_sessions: number
  completed_sessions: number
  week_new_verses: number
  week_revised_verses: number
  active_days_30: number
  tajweed_paths: number
  memorization_paths: number
}

export default function ReaderStudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/reader/students')
      .then((r) => r.json())
      .then((j) => setStudents(j.students || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () =>
      students.filter(
        (s) =>
          s.student_name?.includes(search) ||
          s.student_email?.toLowerCase().includes(search.toLowerCase()),
      ),
    [students, search],
  )

  const summary = useMemo(() => {
    const total = students.length
    const pendingRecitations = students.reduce((a, s) => a + s.pending_recitations, 0)
    const weekVerses = students.reduce((a, s) => a + s.week_new_verses, 0)
    const totalSessions = students.reduce((a, s) => a + s.total_sessions, 0)
    return { total, pendingRecitations, weekVerses, totalSessions }
  }, [students])

  if (loading) return <SimpleListSkeleton rows={5} />

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
          <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">طلابي</h1>
          <p className="text-sm text-muted-foreground font-medium">
            جميع الطلاب المرتبطين بك عبر التلاوات والجلسات والمسارات
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={<Users className="w-5 h-5" />}        label="إجمالي الطلاب"         value={summary.total}              tint="emerald" />
        <StatTile icon={<Mic className="w-5 h-5" />}          label="تلاوات معلقة"           value={summary.pendingRecitations} tint="amber" />
        <StatTile icon={<TrendingUp className="w-5 h-5" />}   label="آيات هذا الأسبوع"       value={summary.weekVerses}         tint="blue" />
        <StatTile icon={<Calendar className="w-5 h-5" />}     label="إجمالي الجلسات"         value={summary.totalSessions}      tint="violet" />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="ابحث بالاسم أو البريد الإلكتروني..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-11 h-12 rounded-xl bg-card"
        />
      </div>

      {/* Students Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <Card
              key={s.student_id}
              className="group border-border rounded-3xl overflow-hidden bg-card hover:shadow-xl hover:shadow-black/5 hover:border-emerald-500/30 transition-all duration-300"
            >
              <CardContent className="p-5 space-y-4">
                {/* Identity */}
                <div className="flex items-center gap-3">
                  {s.avatar_url ? (
                    <img
                      src={s.avatar_url}
                      alt={s.student_name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-border group-hover:ring-emerald-400/50 transition-all shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xl ring-2 ring-border group-hover:ring-emerald-400/50 transition-all shrink-0">
                      {s.student_name?.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-foreground truncate">{s.student_name}</h3>
                    {s.student_email && (
                      <p className="text-xs text-muted-foreground truncate">{s.student_email}</p>
                    )}
                    {s.last_login_at && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        آخر دخول: {new Date(s.last_login_at).toLocaleDateString('ar-EG')}
                      </p>
                    )}
                  </div>
                  {s.pending_recitations > 0 && (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                      <Mic className="w-3 h-3" />
                      {s.pending_recitations}
                    </span>
                  )}
                </div>

                {/* Weekly progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-muted-foreground">آيات هذا الأسبوع</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {s.week_new_verses} جديدة · {s.week_revised_verses} مراجعة
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, (s.week_new_verses / 20) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-4 gap-2">
                  <MiniStat icon={<Mic className="w-4 h-4" />}         label="تلاوات"   value={s.total_recitations} />
                  <MiniStat icon={<Calendar className="w-4 h-4" />}     label="جلسات"    value={s.total_sessions} />
                  <MiniStat icon={<Star className="w-4 h-4" />}         label="نشاط/30"  value={s.active_days_30} />
                  <MiniStat icon={<Route className="w-4 h-4" />}        label="مسارات"   value={s.tajweed_paths + s.memorization_paths} />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-xl font-bold"
                    onClick={() => router.push(`/reader/recitations?studentId=${s.student_id}`)}
                  >
                    <Mic className="w-4 h-4 ml-1.5" />
                    التلاوات
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 rounded-xl font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 shadow-none"
                    onClick={() => router.push(`/reader/chat?studentId=${s.student_id}`)}
                  >
                    <Mail className="w-4 h-4 ml-1.5" />
                    مراسلة
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
              {search ? 'لا توجد نتائج مطابقة' : 'لا يوجد طلاب بعد'}
            </h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-xs">
              {search
                ? 'جرّب البحث بكلمة مختلفة أو امسح حقل البحث.'
                : 'سيظهر هنا الطلاب المرتبطين بك عبر التلاوات أو الجلسات أو المسارات.'}
            </p>
            {search && (
              <Button variant="outline" className="rounded-xl" onClick={() => setSearch('')}>
                مسح البحث
              </Button>
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
  tint: 'emerald' | 'amber' | 'blue' | 'violet'
}) {
  const tints: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber:   'bg-amber-100   text-amber-700   dark:bg-amber-900/30   dark:text-amber-400',
    blue:    'bg-blue-100    text-blue-700    dark:bg-blue-900/30    dark:text-blue-400',
    violet:  'bg-violet-100  text-violet-700  dark:bg-violet-900/30  dark:text-violet-400',
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

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-2 rounded-xl bg-muted/40 border border-border">
      <div className="text-emerald-600 dark:text-emerald-400 mb-1">{icon}</div>
      <p className="text-sm font-bold leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
    </div>
  )
}
