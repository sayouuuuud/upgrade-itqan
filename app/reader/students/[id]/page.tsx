'use client'


import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowRight, Mail, User, Mic, Calendar, MapPin, Clock,
  GraduationCap, TrendingUp, Route, BookOpen, CheckCircle2,
  Star, PlayCircle, Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { ProfileSkeleton } from '@/components/ui/skeletons'
import { useI18n } from '@/lib/i18n/context'

interface StudentData {
  id: string
  name: string
  email: string | null
  avatar_url: string | null
  gender: string | null
  bio: string | null
  city: string | null
  qualification: string | null
  memorized_parts: number | null
  last_login_at: string | null
  created_at: string
}
interface Recitation {
  id: string
  surah_name: string
  surah_number: number
  ayah_from: number
  ayah_to: number
  recitation_type: string | null
  status: string
  audio_url: string | null
  audio_duration_seconds: number | null
  qiraah: string | null
  created_at: string
  reviewed_at: string | null
}
interface SessionItem {
  id: string
  scheduled_at: string | null
  duration_minutes: number | null
  status: string
  meeting_platform: string | null
  session_summary: string | null
}
interface PathItem {
  enrollment_id: string
  path_id: string
  title: string
  thumbnail_url: string | null
  status: string
  stages_completed?: number
  total_stages?: number
  units_completed?: number
  total_units?: number
  last_activity_at: string | null
}

const RECIT_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'بانتظار المراجعة', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  reviewing: { label: 'قيد المراجعة',     cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  mastered:  { label: 'متقن',             cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  needs_work:{ label: 'يحتاج مراجعة',     cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
}
const SESSION_STATUS: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'مجدولة',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  completed: { label: 'مكتملة',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'ملغاة',   cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  in_progress:{ label: 'جارية', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
}

export default function ReaderStudentDetailPage() {
  const { t } = useI18n()

  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string

  const [student, setStudent] = useState<StudentData | null>(null)
  const [recitations, setRecitations] = useState<Recitation[]>([])
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [tajweedPaths, setTajweedPaths] = useState<PathItem[]>([])
  const [memorizationPaths, setMemorizationPaths] = useState<PathItem[]>([])
  const [memStats, setMemStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) return
    fetch(`/api/reader/students/${studentId}`)
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok) throw new Error(j.error || (t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["خطأ"] || "خطأ")] || ((t as any).extracted_2026_v2?.["خطأ"] || "خطأ")))
        setStudent(j.student)
        setRecitations(j.recitations || [])
        setSessions(j.sessions || [])
        setTajweedPaths(j.tajweedPaths || [])
        setMemorizationPaths(j.memorizationPaths || [])
        setMemStats(j.memStats || {})
      })
      .catch((e) => toast.error(e.message || (t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["تعذر جلب بيانات الطالب"] || "تعذر جلب بيانات الطالب")] || ((t as any).extracted_2026_v2?.["تعذر جلب بيانات الطالب"] || "تعذر جلب بيانات الطالب"))))
      .finally(() => setLoading(false))
  }, [studentId])

  if (loading) return <ProfileSkeleton />

  if (!student) {
    return (
      <Card className="max-w-md mx-auto mt-12 border-border rounded-3xl">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <User className="w-16 h-16 text-muted-foreground mb-4 opacity-40" />
          <h2 className="text-xl font-bold mb-2">{(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["الطالب غير موجود"] || "الطالب غير موجود")] || ((t as any).extracted_2026_v2?.["الطالب غير موجود"] || "الطالب غير موجود"))}</h2>
          <p className="text-muted-foreground mb-6">{(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["عذراً، هذا الطالب غير موجود أو ليس لديك صلاحية لرؤيته."] || "عذراً، هذا الطالب غير موجود أو ليس لديك صلاحية لرؤيته.")] || ((t as any).extracted_2026_v2?.["عذراً، هذا الطالب غير موجود أو ليس لديك صلاحية لرؤيته."] || "عذراً، هذا الطالب غير موجود أو ليس لديك صلاحية لرؤيته."))}</p>
          <Button onClick={() => router.push('/reader/students')} variant="outline" className="rounded-xl">
            {(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["العودة للقائمة"] || "العودة للقائمة")] || ((t as any).extracted_2026_v2?.["العودة للقائمة"] || "العودة للقائمة"))}
                              </Button>
        </CardContent>
      </Card>
    )
  }

  const pendingCount = recitations.filter((r) => r.status === 'pending').length
  const masteredCount = recitations.filter((r) => r.status === 'mastered').length
  const completedSessions = sessions.filter((s) => s.status === 'completed').length

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/reader/students')}
          className="rounded-full hover:bg-muted"
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["ملف الطالب"] || "ملف الطالب")] || ((t as any).extracted_2026_v2?.["ملف الطالب"] || "ملف الطالب"))}</h1>
          <p className="text-sm text-muted-foreground font-medium">{(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["تلاوات الطالب وجلساته ومساراته معك"] || "تلاوات الطالب وجلساته ومساراته معك")] || ((t as any).extracted_2026_v2?.["تلاوات الطالب وجلساته ومساراته معك"] || "تلاوات الطالب وجلساته ومساراته معك"))}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border rounded-3xl overflow-hidden bg-card">
            <div className="h-24 bg-emerald-500/10 w-full" />
            <CardContent className="p-6 pt-0 relative flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-2xl bg-background border-4 border-background shadow-lg flex items-center justify-center -mt-12 mb-4 overflow-hidden">
                {student.avatar_url ? (
                  <img src={student.avatar_url} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-3xl">
                    {student.name.charAt(0)}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">{student.name}</h2>
              {student.email && <p className="text-sm text-muted-foreground mb-4">{student.email}</p>}

              <div className="flex gap-2 w-full mb-6">
                <Button
                  className="flex-1 font-bold rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-transparent shadow-none"
                  variant="outline"
                  onClick={() => router.push(`/reader/chat?studentId=${student.id}`)}
                >
                  <Mail className="w-4 h-4 ml-2" />
                  {(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["مراسلة"] || "مراسلة")] || ((t as any).extracted_2026_v2?.["مراسلة"] || "مراسلة"))}
                                                  </Button>
              </div>

              <div className="w-full space-y-3 text-sm text-right">
                {student.city && (
                  <InfoRow icon={<MapPin className="w-4 h-4" />} text={student.city} />
                )}
                <InfoRow
                  icon={<User className="w-4 h-4" />}
                  text={student.gender === 'female' ? (t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["أنثى"] || "أنثى")] || ((t as any).extracted_2026_v2?.["أنثى"] || "أنثى")) : student.gender === 'male' ? (t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["ذكر"] || "ذكر")] || ((t as any).extracted_2026_v2?.["ذكر"] || "ذكر")) : ((t as any).extracted_2026_v2?.["غير محدد"] || "غير محدد")}
                />
                {student.memorized_parts != null && (
                  <InfoRow icon={<BookOpen className="w-4 h-4" />} text={`${student.memorized_parts} أجزاء محفوظة`} />
                )}
                {student.qualification && (
                  <InfoRow icon={<GraduationCap className="w-4 h-4" />} text={student.qualification} />
                )}
                <InfoRow
                  icon={<Calendar className="w-4 h-4" />}
                  text={`انضم في ${new Date(student.created_at).toLocaleDateString('ar-EG')}`}
                />
                {student.last_login_at && (
                  <InfoRow
                    icon={<Clock className="w-4 h-4" />}
                    text={`آخر دخول: ${new Date(student.last_login_at).toLocaleDateString('ar-EG')}`}
                  />
                )}
              </div>

              {student.bio && (
                <p className="mt-5 text-sm text-muted-foreground leading-relaxed text-right w-full border-t border-border pt-4">
                  {student.bio}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats + tabs */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Mic className="w-5 h-5" />} tint="amber" value={pendingCount} label={(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["تلاوات معلقة"] || "تلاوات معلقة")] || ((t as any).extracted_2026_v2?.["تلاوات معلقة"] || "تلاوات معلقة"))} />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} tint="emerald" value={masteredCount} label={(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["تلاوات متقنة"] || "تلاوات متقنة")] || ((t as any).extracted_2026_v2?.["تلاوات متقنة"] || "تلاوات متقنة"))} />
            <StatCard icon={<Calendar className="w-5 h-5" />} tint="blue" value={completedSessions} label={(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["جلسات مكتملة"] || "جلسات مكتملة")] || ((t as any).extracted_2026_v2?.["جلسات مكتملة"] || "جلسات مكتملة"))} />
            <StatCard icon={<TrendingUp className="w-5 h-5" />} tint="violet" value={memStats.week_new_verses ?? 0} label={(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["آيات هذا الأسبوع"] || "آيات هذا الأسبوع")] || ((t as any).extracted_2026_v2?.["آيات هذا الأسبوع"] || "آيات هذا الأسبوع"))} />
          </div>

          <Card className="border-border rounded-3xl overflow-hidden">
            <Tabs defaultValue="recitations" className="w-full">
              <div className="border-b border-border bg-muted/20 overflow-x-auto">
                <TabsList className="w-max justify-start h-14 bg-transparent p-0">
                  <TabTrigger value="recitations" label={`التلاوات (${recitations.length})`} />
                  <TabTrigger value="sessions" label={`الجلسات (${sessions.length})`} />
                  <TabTrigger value="paths" label={`المسارات (${tajweedPaths.length + memorizationPaths.length})`} />
                  <TabTrigger value="memorization" label={(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["الحفظ"] || "الحفظ")] || ((t as any).extracted_2026_v2?.["الحفظ"] || "الحفظ"))} />
                </TabsList>
              </div>

              {/* Recitations */}
              <TabsContent value="recitations" className="p-6 m-0 outline-none">
                {recitations.length > 0 ? (
                  <div className="space-y-3">
                    {recitations.map((r) => {
                      const st = RECIT_STATUS[r.status] || { label: r.status, cls: 'bg-muted text-muted-foreground' }
                      return (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(`/reader/recitations/${r.id}`)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <Mic className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-foreground truncate">
                                {r.surah_name} ({r.ayah_from}-{r.ayah_to})
                              </h3>
                              <div className="flex items-center flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                {r.qiraah && <span>{r.qiraah}</span>}
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span>{new Date(r.created_at).toLocaleDateString('ar-EG')}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState icon={<Mic />} text={(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["لا توجد تلاوات لهذا الطالب بعد"] || "لا توجد تلاوات لهذا الطالب بعد")] || ((t as any).extracted_2026_v2?.["لا توجد تلاوات لهذا الطالب بعد"] || "لا توجد تلاوات لهذا الطالب بعد"))} />
                )}
              </TabsContent>

              {/* Sessions */}
              <TabsContent value="sessions" className="p-6 m-0 outline-none">
                {sessions.length > 0 ? (
                  <div className="space-y-3">
                    {sessions.map((s) => {
                      const st = SESSION_STATUS[s.status] || { label: s.status, cls: 'bg-muted text-muted-foreground' }
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(`/reader/sessions/${s.id}`)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-foreground truncate">
                                {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : (t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["غير محددة"] || "غير محددة")] || ((t as any).extracted_2026_v2?.["غير محددة"] || "غير محددة"))}
                              </h3>
                              <div className="flex items-center flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                {s.duration_minutes && <span>{s.duration_minutes} {(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["دقيقة"] || "دقيقة")] || ((t as any).extracted_2026_v2?.["دقيقة"] || "دقيقة"))}</span>}
                                {s.meeting_platform && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span>{s.meeting_platform}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState icon={<Calendar />} text={(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["لا توجد جلسات مع هذا الطالب بعد"] || "لا توجد جلسات مع هذا الطالب بعد")] || ((t as any).extracted_2026_v2?.["لا توجد جلسات مع هذا الطالب بعد"] || "لا توجد جلسات مع هذا الطالب بعد"))} />
                )}
              </TabsContent>

              {/* Paths */}
              <TabsContent value="paths" className="p-6 m-0 outline-none">
                {tajweedPaths.length + memorizationPaths.length > 0 ? (
                  <div className="space-y-3">
                    {tajweedPaths.map((p) => (
                      <PathRow
                        key={p.enrollment_id}
                        title={p.title}
                        thumbnail={p.thumbnail_url}
                        kind={(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["تجويد"] || "تجويد")] || ((t as any).extracted_2026_v2?.["تجويد"] || "تجويد"))}
                        done={p.stages_completed || 0}
                        total={p.total_stages || 0}
                        status={p.status}
                        onClick={() => router.push(`/reader/learning-paths/${p.path_id}`)}
                      />
                    ))}
                    {memorizationPaths.map((p) => (
                      <PathRow
                        key={p.enrollment_id}
                        title={p.title}
                        thumbnail={p.thumbnail_url}
                        kind={(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["حفظ"] || "حفظ")] || ((t as any).extracted_2026_v2?.["حفظ"] || "حفظ"))}
                        done={p.units_completed || 0}
                        total={p.total_units || 0}
                        status={p.status}
                        onClick={() => router.push(`/reader/memorization-paths/${p.path_id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={<Route />} text={(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["الطالب غير مسجل في أي من مساراتك"] || "الطالب غير مسجل في أي من مساراتك")] || ((t as any).extracted_2026_v2?.["الطالب غير مسجل في أي من مساراتك"] || "الطالب غير مسجل في أي من مساراتك"))} />
                )}
              </TabsContent>

              {/* Memorization */}
              <TabsContent value="memorization" className="p-6 m-0 outline-none">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <MemTile icon={<Sparkles className="w-5 h-5" />} value={memStats.total_new_verses ?? 0} label={(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["إجمالي الآيات الجديدة"] || "إجمالي الآيات الجديدة")] || ((t as any).extracted_2026_v2?.["إجمالي الآيات الجديدة"] || "إجمالي الآيات الجديدة"))} />
                  <MemTile icon={<PlayCircle className="w-5 h-5" />} value={memStats.total_revised_verses ?? 0} label={(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["إجمالي المراجعة"] || "إجمالي المراجعة")] || ((t as any).extracted_2026_v2?.["إجمالي المراجعة"] || "إجمالي المراجعة"))} />
                  <MemTile icon={<TrendingUp className="w-5 h-5" />} value={memStats.week_new_verses ?? 0} label={(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["آيات هذا الأسبوع"] || "آيات هذا الأسبوع")] || ((t as any).extracted_2026_v2?.["آيات هذا الأسبوع"] || "آيات هذا الأسبوع"))} />
                  <MemTile icon={<Calendar className="w-5 h-5" />} value={memStats.active_days_30 ?? 0} label={(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["أيام نشطة (30 يوم)"] || "أيام نشطة (30 يوم)")] || ((t as any).extracted_2026_v2?.["أيام نشطة (30 يوم)"] || "أيام نشطة (30 يوم)"))} />
                  <MemTile icon={<Star className="w-5 h-5" />} value={memStats.avg_quality ?? '—'} label={(t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["متوسط الجودة"] || "متوسط الجودة")] || ((t as any).extracted_2026_v2?.["متوسط الجودة"] || "متوسط الجودة"))} />
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-muted-foreground p-2 rounded-lg bg-muted/30">
      <span className="shrink-0 text-emerald-600/70 dark:text-emerald-400/70">{icon}</span>
      <span className="font-medium">{text}</span>
    </div>
  )
}

function StatCard({ icon, value, label, tint }: { icon: React.ReactNode; value: number | string; label: string; tint: string }) {
  const tints: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  }
  return (
    <Card className="border-border rounded-2xl bg-card">
      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tints[tint]}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function TabTrigger({ value, label }: { value: string; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="h-full px-6 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:shadow-none rounded-none font-bold whitespace-nowrap"
    >
      {label}
    </TabsTrigger>
  )
}

function PathRow({
  title, thumbnail, kind, done, total, status, onClick,
}: {
  title: string; thumbnail: string | null; kind: string; done: number; total: number; status: string; onClick: () => void
}) {
  const { t } = useI18n()

  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div
      className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 overflow-hidden">
          {thumbnail ? (
            <img src={thumbnail || "/placeholder.svg"} alt={title} className="w-full h-full object-cover" />
          ) : (
            <Route className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-foreground truncate">{title}</h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="px-2 py-0.5 rounded-full bg-muted font-medium">{kind}</span>
            <span>{done}/{total}</span>
            <span>{status === 'completed' ? (t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["· مكتمل"] || "· مكتمل")] || ((t as any).extracted_2026_v2?.["· مكتمل"] || "· مكتمل")) : status === 'active' ? (t.addedTranslations_2026?.[((t as any).extracted_2026_v2?.["· نشط"] || "· نشط")] || ((t as any).extracted_2026_v2?.["· نشط"] || "· نشط")) : ''}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end shrink-0 gap-1.5 w-28">
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{pct}%</span>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

function MemTile({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-muted/40 border border-border">
      <div className="text-emerald-600 dark:text-emerald-400 mb-2">{icon}</div>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-3 [&>svg]:w-full [&>svg]:h-full">{icon}</div>
      <p className="text-muted-foreground font-medium">{text}</p>
    </div>
  )
}
