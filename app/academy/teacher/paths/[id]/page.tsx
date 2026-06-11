"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowRight, Users, Award, TrendingUp, UserMinus, Percent, 
  GraduationCap, Calendar, BarChart3, Loader2, Layers, ClipboardCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import PathStagesManager from '@/components/paths/path-stages-manager'
import PathSubmissionsReview from '@/components/paths/path-submissions-review'

interface PathDetails {
  id: string
  title: string
  total_stages: number
}

interface PathStats {
  enrolled_students: number
  active_students: number
  completed_students: number
  dropped_students: number
  avg_progress_percent: number
}

interface FunnelStage {
  id: string
  position: number
  title: string
  started_count: number
  completed_count: number
}

interface TopStudent {
  student_id: string
  student_name: string
  student_email: string
  student_image?: string
  stages_completed: number
  last_activity_at: string
  progress_percent: number
}

interface StatsApiResponse {
  data: {
    path: PathDetails
    stats: PathStats
    funnel: FunnelStage[]
    top_students: TopStudent[]
    students: RosterStudent[]
  }
}

interface RosterStudent {
  student_id: string
  student_name: string
  student_email: string
  student_image?: string
  status: 'active' | 'completed' | 'dropped'
  stages_completed: number
  started_at: string | null
  completed_at: string | null
  last_activity_at: string | null
  progress_percent: number
}

export default function TeacherPathStatsPage() {
  const params = useParams()
  const pathId = params.id as string
  const [data, setData] = useState<StatsApiResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'content' | 'submissions' | 'stats'>('content')

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/academy/teacher/paths/${pathId}/stats`)
        if (res.ok) {
          const json = await res.json()
          setData(json.data)
        } else {
          toast.error('فشل في جلب إحصائيات المسار')
        }
      } catch (error) {
        console.error('Error fetching path stats:', error)
        toast.error('حدث خطأ أثناء تحميل البيانات')
      } finally {
        setLoading(false)
      }
    }

    if (pathId) {
      fetchStats()
    }
  }, [pathId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
        <p className="text-muted-foreground animate-pulse text-sm">جاري تحميل إحصائيات المسار...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-2xl font-bold text-destructive">المسار غير موجود</h2>
        <p className="text-muted-foreground">عذراً، لم نتمكن من العثور على المسار المطلوب أو لا تملك الصلاحية للوصول إليه.</p>
        <Link href="/academy/teacher/paths" className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:underline">
          <ArrowRight className="w-4 h-4" />
          العودة للمسارات
        </Link>
      </div>
    )
  }

  const { path, stats, funnel, top_students } = data
  const students = data.students || []
  const totalEnrolled = stats.enrolled_students || 0
  const completionRate = totalEnrolled > 0 
    ? Math.round((stats.completed_students / totalEnrolled) * 100) 
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link href="/academy/teacher/paths" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
        <ArrowRight className="w-4 h-4" />
        العودة للوحة التحكم والمسارات
      </Link>

      {/* Header Info */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            لوحة الإشراف والمتابعة
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2">{path.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">تتبع مؤشرات التقدم للطلاب وقمع التحويل عبر المراحل.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-600/10 border border-emerald-500/10 rounded-2xl px-4 py-2.5 text-emerald-600 dark:text-emerald-400 text-sm font-semibold shrink-0">
          <GraduationCap className="w-5 h-5" />
          {path.total_stages} مرحلة في المسار
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 border border-border rounded-2xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('content')}
          className={cn(
            'flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors',
            activeTab === 'content'
              ? 'bg-card text-emerald-600 shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Layers className="w-4 h-4" />
          المحتوى والمراحل
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={cn(
            'flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors',
            activeTab === 'submissions'
              ? 'bg-card text-emerald-600 shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <ClipboardCheck className="w-4 h-4" />
          مراجعة التسليمات
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={cn(
            'flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors',
            activeTab === 'stats'
              ? 'bg-card text-emerald-600 shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <BarChart3 className="w-4 h-4" />
          الإحصائيات والمتابعة
        </button>
      </div>

      {activeTab === 'content' && <PathStagesManager pathId={path.id} />}

      {activeTab === 'submissions' && (
        <PathSubmissionsReview apiBase={`/api/academy/teacher/paths/${path.id}`} />
      )}

      {activeTab === 'stats' && (
      <div className="space-y-8">
      {/* Stats Grid Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Enrolled */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs sm:text-sm font-medium">الطلاب المسجلين</span>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold">{stats.enrolled_students}</h3>
            <p className="text-[10px] text-muted-foreground">إجمالي الاشتراكات بالمسار</p>
          </div>
        </div>

        {/* Active */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs sm:text-sm font-medium">الطلاب النشطين</span>
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold">{stats.active_students}</h3>
            <p className="text-[10px] text-muted-foreground">يدرسون المسار حالياً</p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs sm:text-sm font-medium">الخريجين</span>
            <Award className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold">{stats.completed_students}</h3>
            <p className="text-[10px] text-muted-foreground">أكملوا كافة المراحل</p>
          </div>
        </div>

        {/* Dropped */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs sm:text-sm font-medium">المنسحبين</span>
            <UserMinus className="w-5 h-5 text-rose-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold">{stats.dropped_students}</h3>
            <p className="text-[10px] text-muted-foreground">لم يكملوا المسار</p>
          </div>
        </div>

        {/* Completion Rate / Avg Progress */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2 col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs sm:text-sm font-medium">معدل الإتمام</span>
            <Percent className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold">{completionRate}%</h3>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-1">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${completionRate}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground pt-1">متوسط الإنجاز: {Math.round(stats.avg_progress_percent)}%</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Conversion Funnel Widget (Left 2 cols on desktop) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              قمع التحول للمسار (Student Conversion Funnel)
            </h2>
            <p className="text-xs text-muted-foreground mt-1">نسبة وعدد الطلاب الذين بدأوا وأكملوا كل مرحلة دراسية في المسار.</p>
          </div>

          {funnel.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">لا توجد مراحل دراسية مضافة لهذا المسار.</p>
          ) : (
            <div className="space-y-6 pt-2">
              {funnel.map((stage, idx) => {
                const startPercent = totalEnrolled > 0 
                  ? Math.round((stage.started_count / totalEnrolled) * 100) 
                  : 0
                const completePercent = totalEnrolled > 0 
                  ? Math.round((stage.completed_count / totalEnrolled) * 100) 
                  : 0

                return (
                  <div key={stage.id} className="space-y-2 bg-muted/10 border border-border/40 p-4 rounded-2xl relative hover:bg-muted/20 transition-all duration-200">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-sm text-foreground line-clamp-1">{stage.title}</h4>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-muted-foreground">
                        <span className="text-amber-600 dark:text-amber-400">بدأوا: {stage.started_count} ({startPercent}%)</span>
                        <span className="text-emerald-600 dark:text-emerald-400">أكملوا: {stage.completed_count} ({completePercent}%)</span>
                      </div>
                    </div>

                    {/* Progress bars overlap visual */}
                    <div className="space-y-1.5 pt-1">
                      {/* Started bar */}
                      <div className="relative h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                          style={{ width: `${startPercent}%` }} 
                        />
                      </div>
                      {/* Completed bar */}
                      <div className="relative h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500" 
                          style={{ width: `${completePercent}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top students dashboard list (Right 1 col on desktop) */}
        <div className="lg:col-span-1 bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                أبرز الطلاب المتقدمين
              </h2>
              <p className="text-xs text-muted-foreground mt-1">الطلاب الـ 10 الأكثر إنجازاً ونشاطاً بالمسار.</p>
            </div>

            {top_students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">لا توجد اشتراكات نشطة بعد.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {top_students.map((student, idx) => (
                  <div key={student.student_id} className="py-3.5 flex items-center gap-3 first:pt-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-foreground truncate">{student.student_name}</h4>
                      <p className="text-[10px] text-muted-foreground truncate">{student.student_email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-600">{student.progress_percent}%</span>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{student.stages_completed} مراحل</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {top_students.length > 0 && (
            <div className="border-t border-border/60 pt-4 mt-4 text-center">
              <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                آخر تحديث للبيانات تلقائياً الآن
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Full students roster */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            جميع الطلاب المسجلين ({students.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-1">قائمة كاملة بكل الطلاب في المسار وحالتهم ونسبة تقدمهم.</p>
        </div>

        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">لا يوجد طلاب مسجلين في هذا المسار بعد.</p>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-right text-xs text-muted-foreground border-b border-border">
                  <th className="font-semibold py-3 px-3">الطالب</th>
                  <th className="font-semibold py-3 px-3">الحالة</th>
                  <th className="font-semibold py-3 px-3">المراحل المكتملة</th>
                  <th className="font-semibold py-3 px-3">نسبة التقدم</th>
                  <th className="font-semibold py-3 px-3">آخر نشاط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {students.map((s) => (
                  <tr key={s.student_id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                          {s.student_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.student_image || "/placeholder.svg"} alt={s.student_name} className="w-full h-full object-cover" />
                          ) : (
                            (s.student_name || '?').charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{s.student_name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{s.student_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusPill status={s.status} />
                    </td>
                    <td className="py-3 px-3 font-semibold">
                      {s.stages_completed} / {path.total_stages}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${s.progress_percent}%` }} />
                        </div>
                        <span className="text-xs font-bold text-emerald-600">{s.progress_percent}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground">
                      {s.last_activity_at ? new Date(s.last_activity_at).toLocaleDateString('ar-EG') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: 'active' | 'completed' | 'dropped' }) {
  if (status === 'completed') {
    return <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">خريج</span>
  }
  if (status === 'dropped') {
    return <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">منسحب</span>
  }
  return <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">نشط</span>
}
