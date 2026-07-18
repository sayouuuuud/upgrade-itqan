'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowRight, Mail, User, BookOpen, Award, CheckCircle, 
  MapPin, Calendar, BookMarked, GraduationCap, Clock, TrendingUp,
  ClipboardList, FileText, ListChecks, ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from "@/lib/i18n/context";

interface StudentData {
  id: string
  name: string
  email: string
  avatar_url: string | null
  gender: string | null
  bio: string | null
  city: string | null
  created_at: string
  qualification: string | null
  memorized_parts: number | null
  courses_count: number
  tasks_completed: number
  tasks_total: number
  total_points: number
  progress_percentage: number
  last_activity: string | null
}

interface Enrollment {
  id: string
  title: string
  thumbnail_url: string | null
  status: string
  enrolled_at: string
  progress_percentage: number
}

interface Submission {
  id: string
  task_id: string
  status: string
  score: number | null
  auto_score: number | null
  submission_type: string | null
  submitted_at: string | null
  graded_at: string | null
  task_title: string
  task_type: string
  max_score: number
  course_title: string | null
}

interface Badge {
  id: string
  name: string
  icon: string | null
  icon_url: string | null
  awarded_at: string
}

export default function TeacherStudentProfilePage() {
    const { t } = useI18n();
  const academyTeacher = (t as any).academyTeacher as Record<string, string> | undefined
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string

  const [student, setStudent] = useState<StudentData | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [specializations, setSpecializations] = useState<string[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch(`/api/academy/teacher/students/${studentId}`)
        const json = await res.json()
        
        if (res.ok) {
          setStudent(json.student)
          setEnrollments(json.enrollments || [])
          setBadges(json.badges || [])
          setSpecializations(json.specializations || [])
          setSubmissions(json.submissions || [])
        } else {
          toast.error(json.error || (t.addedTranslations_2026?.['حدث خطأ أثناء جلب البيانات'] || (t.addedTranslations_2026?.['حدث خطأ أثناء جلب البيانات'] || 'حدث خطأ أثناء جلب البيانات')))
        }
      } catch (error) {
        console.error('Failed to fetch student:', error)
        toast.error((t.addedTranslations_2026?.['تعذر جلب بيانات الطالب'] || (t.addedTranslations_2026?.['تعذر جلب بيانات الطالب'] || 'تعذر جلب بيانات الطالب')))
      } finally {
        setLoading(false)
      }
    }

    if (studentId) {
      fetchStudent()
    }
  }, [studentId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">{(t.addedTranslations_2026?.['جاري تحميل بيانات الطالب...'] || (t.addedTranslations_2026?.['جاري تحميل بيانات الطالب...'] || 'جاري تحميل بيانات الطالب...'))}</p>
      </div>
    )
  }

  if (!student) {
    return (
      <Card className="max-w-md mx-auto mt-12 border-border shadow-lg">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <User className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">{(t.addedTranslations_2026?.['الطالب غير موجود'] || (t.addedTranslations_2026?.['الطالب غير موجود'] || 'الطالب غير موجود'))}</h2>
          <p className="text-muted-foreground mb-6">
            {(t.addedTranslations_2026?.['عذراً، هذا الطالب غير موجود أو ليس لديك صلاحية لرؤية بياناته.'] || (t.addedTranslations_2026?.['عذراً، هذا الطالب غير موجود أو ليس لديك صلاحية لرؤية بياناته.'] || 'عذراً، هذا الطالب غير موجود أو ليس لديك صلاحية لرؤية بياناته.'))}
                              </p>
          <Button onClick={() => router.push('/academy/teacher/students')} variant="outline">
            {(t.addedTranslations_2026?.['العودة للقائمة'] || (t.addedTranslations_2026?.['العودة للقائمة'] || 'العودة للقائمة'))}
                              </Button>
        </CardContent>
      </Card>
    )
  }

  const SPECIALIZATIONS_MAP: Record<string, string> = {
    'sira': (t.addedTranslations_2026?.['السيرة النبوية'] || (t.addedTranslations_2026?.['السيرة النبوية'] || 'السيرة النبوية')),
    'fiqh': (t.addedTranslations_2026?.['الفقه'] || (t.addedTranslations_2026?.['الفقه'] || 'الفقه')),
    'aqeedah': (t.addedTranslations_2026?.['العقيدة'] || (t.addedTranslations_2026?.['العقيدة'] || 'العقيدة')),
    'tajweed': (t.addedTranslations_2026?.['التجويد'] || (t.addedTranslations_2026?.['التجويد'] || 'التجويد')),
    'tafseer': (t.addedTranslations_2026?.['التفسير'] || (t.addedTranslations_2026?.['التفسير'] || 'التفسير')),
    'arabic': (t.addedTranslations_2026?.['اللغة العربية'] || (t.addedTranslations_2026?.['اللغة العربية'] || 'اللغة العربية')),
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Actions */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => router.push('/academy/teacher/students')}
          className="rounded-full hover:bg-muted"
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{(t.addedTranslations_2026?.['بروفايل الطالب'] || (t.addedTranslations_2026?.['بروفايل الطالب'] || 'بروفايل الطالب'))}</h1>
          <p className="text-sm text-muted-foreground font-medium">{(t.addedTranslations_2026?.['عرض بيانات وتقدم الطالب التفصيلية'] || (t.addedTranslations_2026?.['عرض بيانات وتقدم الطالب التفصيلية'] || 'عرض بيانات وتقدم الطالب التفصيلية'))}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border shadow-xl shadow-black/5 rounded-3xl overflow-hidden bg-card/70 backdrop-blur-xl">
            <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5 w-full relative">
               <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
            </div>
            <CardContent className="p-6 pt-0 relative flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-2xl bg-background border-4 border-background shadow-lg flex items-center justify-center -mt-12 mb-4 overflow-hidden relative group">
                {student.avatar_url ? (
                  <img src={student.avatar_url} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
                    {student.name.charAt(0)}
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-bold text-foreground mb-1">{student.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">{student.email}</p>
              
              <div className="flex gap-2 w-full mb-6">
                <Button 
                  className="flex-1 font-bold rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border-transparent shadow-none" 
                  variant="outline"
                  onClick={() => router.push(`/academy/teacher/chat?studentId=${student.id}`)}
                >
                  <Mail className="w-4 h-4 ml-2" />
                  {(t.addedTranslations_2026?.['مراسلة'] || (t.addedTranslations_2026?.['مراسلة'] || 'مراسلة'))}
                                                  </Button>
              </div>

              <div className="w-full space-y-3 text-sm text-right">
                {student.city && (
                  <div className="flex items-center gap-3 text-muted-foreground p-2 rounded-lg bg-muted/30">
                    <MapPin className="w-4 h-4 shrink-0 text-primary/60" />
                    <span className="font-medium">{student.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-muted-foreground p-2 rounded-lg bg-muted/30">
                  <User className="w-4 h-4 shrink-0 text-primary/60" />
                  <span className="font-medium">{student.gender === 'female' ? (t.addedTranslations_2026?.['أنثى'] || (t.addedTranslations_2026?.['أنثى'] || 'أنثى')) : student.gender === 'male' ? (t.addedTranslations_2026?.['ذكر'] || (t.addedTranslations_2026?.['ذكر'] || 'ذكر')) : (t.addedTranslations_2026?.['غير محدد'] || 'غير محدد')}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground p-2 rounded-lg bg-muted/30">
                  <Calendar className="w-4 h-4 shrink-0 text-primary/60" />
                  <span className="font-medium">{(t.addedTranslations_2026?.['انضم في'] || (t.addedTranslations_2026?.['انضم في'] || 'انضم في'))} {new Date(student.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
                {student.last_activity && (
                  <div className="flex items-center gap-3 text-muted-foreground p-2 rounded-lg bg-muted/30">
                    <Clock className="w-4 h-4 shrink-0 text-primary/60" />
                    <span className="font-medium">{(t.addedTranslations_2026?.['آخر نشاط:'] || (t.addedTranslations_2026?.['آخر نشاط:'] || 'آخر نشاط:'))} {new Date(student.last_activity).toLocaleDateString('ar-EG')}</span>
                  </div>
                )}
                {student.qualification && (
                  <div className="flex items-center gap-3 text-muted-foreground p-2 rounded-lg bg-muted/30">
                    <GraduationCap className="w-4 h-4 shrink-0 text-primary/60" />
                    <span className="font-medium">{student.qualification}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats & Tabs */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border shadow-sm rounded-2xl bg-card hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{student.courses_count}</p>
                  <p className="text-xs text-muted-foreground font-medium">{(t.addedTranslations_2026?.['الدورات المسجلة'] || (t.addedTranslations_2026?.['الدورات المسجلة'] || 'الدورات المسجلة'))}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm rounded-2xl bg-card hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{student.progress_percentage}%</p>
                  <p className="text-xs text-muted-foreground font-medium">{(t.addedTranslations_2026?.['متوسط التقدم'] || (t.addedTranslations_2026?.['متوسط التقدم'] || 'متوسط التقدم'))}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm rounded-2xl bg-card hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{student.tasks_completed} <span className="text-sm text-muted-foreground font-normal">/ {student.tasks_total}</span></p>
                  <p className="text-xs text-muted-foreground font-medium">{(t.addedTranslations_2026?.['المهام المنجزة'] || (t.addedTranslations_2026?.['المهام المنجزة'] || 'المهام المنجزة'))}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm rounded-2xl bg-card hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{student.total_points}</p>
                  <p className="text-xs text-muted-foreground font-medium">{(t.addedTranslations_2026?.['إجمالي النقاط'] || (t.addedTranslations_2026?.['إجمالي النقاط'] || 'إجمالي النقاط'))}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Tabs */}
          <Card className="border-border shadow-xl shadow-black/5 rounded-3xl overflow-hidden">
            <Tabs defaultValue="courses" className="w-full">
              <div className="border-b border-border bg-muted/20">
                <TabsList className="w-full justify-start h-14 bg-transparent p-0">
                  <TabsTrigger 
                    value="courses" 
                    className="h-full px-6 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none font-bold"
                  >
                    {(t.addedTranslations_2026?.['الدورات المشتركة'] || (t.addedTranslations_2026?.['الدورات المشتركة'] || 'الدورات المشتركة'))}
                                                        </TabsTrigger>
                  <TabsTrigger 
                    value="submissions" 
                    className="h-full px-6 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none font-bold"
                  >
                    {(t.addedTranslations_2026?.['المهام والتسليمات ('] || (t.addedTranslations_2026?.['المهام والتسليمات ('] || 'المهام والتسليمات ('))}{submissions.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="badges" 
                    className="h-full px-6 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none font-bold"
                  >
                    {(t.addedTranslations_2026?.['الشارات ('] || (t.addedTranslations_2026?.['الشارات ('] || 'الشارات ('))}{badges.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="specializations" 
                    className="h-full px-6 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none font-bold"
                  >
                    {(t.addedTranslations_2026?.['التخصصات'] || (t.addedTranslations_2026?.['التخصصات'] || 'التخصصات'))}
                                                        </TabsTrigger>
                </TabsList>
              </div>

              {/* Courses Tab */}
              <TabsContent value="courses" className="p-6 m-0 outline-none">
                {enrollments.length > 0 ? (
                  <div className="space-y-4">
                    {enrollments.map(enrollment => (
                      <div key={enrollment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                            {enrollment.thumbnail_url ? (
                              <img
                                src={enrollment.thumbnail_url || "/placeholder.svg"}
                                alt={enrollment.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <BookOpen className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{enrollment.title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{(t.addedTranslations_2026?.['انضم في:'] || (t.addedTranslations_2026?.['انضم في:'] || 'انضم في:'))} {new Date(enrollment.enrolled_at).toLocaleDateString('ar-EG')}</span>
                              <span className="w-1 h-1 rounded-full bg-border"></span>
                              <span className={`px-2 py-0.5 rounded-full font-medium ${
                                enrollment.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                enrollment.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {enrollment.status === 'active' ? (t.addedTranslations_2026?.['نشط'] || (t.addedTranslations_2026?.['نشط'] || 'نشط')) : 
                                 enrollment.status === 'completed' ? (t.addedTranslations_2026?.['مكتمل'] || (t.addedTranslations_2026?.['مكتمل'] || 'مكتمل')) : 
                                 enrollment.status === 'pending' ? (t.addedTranslations_2026?.['قيد الانتظار'] || (t.addedTranslations_2026?.['قيد الانتظار'] || 'قيد الانتظار')) : (t.addedTranslations_2026?.['غير نشط'] || 'غير نشط')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-2">
                          <div className="flex items-center justify-between w-32 text-xs font-bold mb-1">
                            <span>{(t.addedTranslations_2026?.['التقدم'] || (t.addedTranslations_2026?.['التقدم'] || 'التقدم'))}</span>
                            <span className="text-primary">{enrollment.progress_percentage}%</span>
                          </div>
                          <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-1000" 
                              style={{ width: `${enrollment.progress_percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                    <p className="text-muted-foreground font-medium">{(t.addedTranslations_2026?.['لا توجد دورات مشتركة حالياً'] || (t.addedTranslations_2026?.['لا توجد دورات مشتركة حالياً'] || 'لا توجد دورات مشتركة حالياً'))}</p>
                  </div>
                )}
              </TabsContent>

              {/* Submissions Tab */}
              <TabsContent value="submissions" className="p-6 m-0 outline-none">
                {submissions.length > 0 ? (
                  <div className="space-y-3">
                    {submissions.map(sub => {
                      const isQuiz = sub.task_type === "quiz"
                      const isGraded = sub.status === "graded"
                      const displayScore = sub.score ?? sub.auto_score
                      return (
                        <div
                          key={sub.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                              isQuiz ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" : "bg-primary/10 text-primary"
                            }`}>
                              {isQuiz ? <ListChecks className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-foreground truncate">{sub.task_title}</h3>
                              <div className="flex items-center flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                {sub.course_title && <span className="truncate">{sub.course_title}</span>}
                                {sub.submitted_at && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span>{new Date(sub.submitted_at).toLocaleDateString("ar-EG")}</span>
                                  </>
                                )}
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span className={`px-2 py-0.5 rounded-full font-medium ${
                                  isGraded
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                }`}>
                                  {isGraded ? (t.addedTranslations_2026?.['مصححة'] || (t.addedTranslations_2026?.['مصححة'] || 'مصححة')) : sub.status === "late" ? (t.addedTranslations_2026?.['متأخرة'] || (t.addedTranslations_2026?.['متأخرة'] || 'متأخرة')) : (t.addedTranslations_2026?.['بانتظار التصحيح'] || 'بانتظار التصحيح')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-center">
                              <p className="text-lg font-bold text-foreground">
                                {displayScore != null ? (
                                  <>{displayScore}<span className="text-xs text-muted-foreground font-normal"> / {sub.max_score}</span></>
                                ) : (
                                  <span className="text-sm text-muted-foreground font-normal">—</span>
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{isQuiz ? (t.addedTranslations_2026?.['درجة الاختبار'] || (t.addedTranslations_2026?.['درجة الاختبار'] || 'درجة الاختبار')) : (t.addedTranslations_2026?.['الدرجة'] || 'الدرجة')}</p>
                            </div>
                            <Link
                              href={`/academy/teacher/tasks/${sub.task_id}/grade`}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-bold transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              {(t.addedTranslations_2026?.['فتح'] || (t.addedTranslations_2026?.['فتح'] || 'فتح'))}
                                                                  </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                    <p className="text-muted-foreground font-medium">{(t.addedTranslations_2026?.['لم يسلّم الطالب أي مهام بعد'] || (t.addedTranslations_2026?.['لم يسلّم الطالب أي مهام بعد'] || 'لم يسلّم الطالب أي مهام بعد'))}</p>
                  </div>
                )}
              </TabsContent>

              {/* Badges Tab */}
              <TabsContent value="badges" className="p-6 m-0 outline-none">
                {badges.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {badges.map(badge => (
                      <div key={badge.id} className="flex flex-col items-center text-center p-4 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center mb-3">
                          {badge.icon_url || badge.icon?.startsWith('http') ? (
                            <img src={badge.icon_url || badge.icon || ''} alt={badge.name} className="w-10 h-10 object-contain" />
                          ) : badge.icon ? (
                            <span className="text-3xl">{badge.icon}</span>
                          ) : (
                            <Award className="w-8 h-8 text-amber-500" />
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-foreground mb-1">{badge.name}</h4>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(badge.awarded_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                    <p className="text-muted-foreground font-medium">{(t.addedTranslations_2026?.['لم يحصل الطالب على أي شارات بعد'] || (t.addedTranslations_2026?.['لم يحصل الطالب على أي شارات بعد'] || 'لم يحصل الطالب على أي شارات بعد'))}</p>
                  </div>
                )}
              </TabsContent>

              {/* Specializations Tab */}
              <TabsContent value="specializations" className="p-6 m-0 outline-none">
                {specializations.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {specializations.map(spec => (
                      <div key={spec} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card font-bold text-sm">
                        <BookMarked className="w-4 h-4 text-primary" />
                        {SPECIALIZATIONS_MAP[spec] || spec}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookMarked className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                    <p className="text-muted-foreground font-medium">{(t.addedTranslations_2026?.['لم يحدد الطالب أي تخصصات بعد'] || (t.addedTranslations_2026?.['لم يحدد الطالب أي تخصصات بعد'] || 'لم يحدد الطالب أي تخصصات بعد'))}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}
