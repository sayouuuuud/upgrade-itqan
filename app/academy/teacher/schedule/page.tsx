'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Globe2, Megaphone, Plus, Edit2, Trash2, Radio, Video, Users, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function TeacherSchedulePage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [courseId, setCourseId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [maxStudents, setMaxStudents] = useState('20')
  const [isPublicLesson, setIsPublicLesson] = useState(false)
  const [announceToStudents, setAnnounceToStudents] = useState(true)
  const [seriesTitle, setSeriesTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/academy/teacher/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.data || data || [])
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }, [])

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/academy/teacher/courses')
      if (res.ok) {
        const data = await res.json()
        setCourses(data.data || data || [])
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchSessions(), fetchCourses()])
    setLoading(false)
  }, [fetchCourses, fetchSessions])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  const resetForm = () => {
    setEditingId(null)
    setCourseId('')
    setTitle('')
    setDescription('')
    setDate('')
    setTime('')
    setDuration('60')
    setMaxStudents('20')
    setIsPublicLesson(false)
    setAnnounceToStudents(true)
    setSeriesTitle('')
  }

  const handleOpenNewModal = () => {
    resetForm()
    setIsNewModalOpen(true)
  }

  const handleOpenEditModal = (session: any) => {
    resetForm()
    setEditingId(session.id)
    setCourseId(session.course_id)
    setTitle(session.title)
    setDescription(session.description || '')
    // Extract date and time for inputs
    if (session.scheduled_at) {
      const dt = new Date(session.scheduled_at)
      setDate(dt.toISOString().split('T')[0])
      setTime(dt.toTimeString().slice(0, 5))
    }
    setDuration(session.duration_minutes?.toString() || '60')
    setMaxStudents(session.max_students?.toString() || '20')
    setIsPublicLesson(!!session.is_public)
    setAnnounceToStudents(false)
    setSeriesTitle(session.series_title || '')
    setIsEditModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId || !title || !date || !time) {
      toast.error('يرجى تعبئة الحقول المطلوبة')
      return
    }

    setIsSubmitting(true)

    // Create combined timestamp
    const localDate = new Date(`${date}T${time}`)
    const scheduled_at = localDate.toISOString()

    const payload = {
      course_id: courseId,
      title,
      description,
      scheduled_at,
      duration_minutes: parseInt(duration),
      max_students: parseInt(maxStudents),
      is_public: isPublicLesson,
      announce_to_students: announceToStudents,
      series_title: seriesTitle,
    }

    try {
      const url = editingId ? `/api/academy/teacher/sessions/${editingId}` : '/api/academy/teacher/sessions'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(editingId ? 'تم تعديل الجلسة بنجاح' : 'تمت جدولة الجلسة بنجاح')
        setIsNewModalOpen(false)
        setIsEditModalOpen(false)
        fetchSessions()
      } else {
        const d = await res.json()
        toast.error(d.error || 'حدث خطأ أثناء حفظ الجلسة')
      }
    } catch (error) {
      toast.error('فشل في الاتصال بالخادم')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الجلسة بشكل نهائي؟')) return

    try {
      const res = await fetch(`/api/academy/teacher/sessions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('تم حذف الجلسة بنجاح')
        fetchSessions()
      } else {
        toast.error('حدث خطأ أثناء الحذف')
      }
    } catch (error) {
      toast.error('فشل في الاتصال بالخادم')
    }
  }

  const handleStartNow = async (id: string) => {
    try {
      const res = await fetch(`/api/academy/teacher/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' })
      });
      if (res.ok) {
        toast.success('تم تفعيل الجلسة، جاري فتح الغرفة...')
        router.push(`/academy/teacher/sessions/${id}/live`)
      } else {
        toast.error('حدث خطأ أثناء التفعيل')
      }
    } catch (err) {
      toast.error('فشل في الاتصال بالخادم')
    }
  }

  const handleEndSession = async (id: string) => {
    if (!confirm('هل أنت متأكد من إنهاء هذه الجلسة؟ لن يتمكن الطلاب من الدخول بعدها.')) return

    try {
      const res = await fetch(`/api/academy/teacher/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      if (res.ok) {
        toast.success('تم إنهاء الجلسة بنجاح')
        fetchSessions()
      } else {
        toast.error('حدث خطأ أثناء الإنهاء')
      }
    } catch (err) {
      toast.error('فشل في الاتصال بالخادم')
    }
  }

  const handleEnterLive = (id: string) => {
    router.push(`/academy/teacher/sessions/${id}/live`)
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء تفعيل هذه الجلسة؟ لن تظهر للطلاب بعد الآن.')) return

    try {
      const res = await fetch(`/api/academy/teacher/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      if (res.ok) {
        toast.success('تم إلغاء تفعيل الجلسة بنجاح')
        fetchSessions()
      } else {
        toast.error('حدث خطأ أثناء إلغاء التفعيل')
      }
    } catch (err) {
      toast.error('فشل في الاتصال بالخادم')
    }
  }

  const renderSkeletons = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-3 flex-1">
                <Skeleton className="h-6 w-1/3" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const safeSessions = Array.isArray(sessions) ? sessions : []
  const upcomingSessions = safeSessions.filter(s => new Date(s.scheduled_at) > new Date() && s.status !== 'completed')
  const pastSessions = safeSessions.filter(s => new Date(s.scheduled_at) <= new Date() || s.status === 'completed')

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 text-foreground">إدارة الجلسات التفاعلية</h1>
          <p className="text-muted-foreground text-sm">أدر جلساتك المباشرة وسجلات حضور طلابك بكل احترافية.</p>
        </div>
        <Button size="lg" onClick={handleOpenNewModal} className="shrink-0 shadow-md">
          <Plus className="w-5 h-5 ml-2" />
          جلسة جديدة
        </Button>
      </div>

      {loading ? (
        renderSkeletons()
      ) : (
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="mb-6 grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="upcoming" className="text-base font-medium">الجلسات المجدولة</TabsTrigger>
            <TabsTrigger value="past" className="text-base font-medium">الجلسات السابقة</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 animate-in fade-in-50 duration-500">
            {upcomingSessions.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {upcomingSessions.map((session) => (
                  <Card key={session.id} className="overflow-hidden border-r-4 border-r-primary hover:shadow-md transition-all group">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row items-stretch justify-between p-6 gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                                {session.title}
                                {session.status === 'in_progress' && (
                                  <Badge variant="default" className="bg-green-600 hover:bg-green-700 animate-pulse">
                                    <Radio className="w-3 h-3 ml-1" />
                                    نشطة الآن
                                  </Badge>
                                )}
                              </h3>
                              <p className="text-sm font-medium text-muted-foreground">{session.course_name}</p>
                            </div>
                            
                            {/* Badges for Public/Series */}
                            <div className="flex flex-col items-end gap-2">
                              {session.is_public && session.public_join_token && (
                                <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                                  <Globe2 className="w-3 h-3 ml-1" />
                                  جلسة عامة
                                </Badge>
                              )}
                              {session.series_title && (
                                <Badge variant="secondary" className="text-purple-700 bg-purple-50">
                                  سلسلة: {session.series_title}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 bg-muted/50 p-3 rounded-lg border">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span className="font-medium">{new Date(session.scheduled_at).toLocaleDateString('ar-EG')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-primary" />
                              <span className="font-medium">{new Date(session.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Video className="w-4 h-4 text-primary" />
                              <span className="font-medium">{session.duration_minutes || 60} دقيقة</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-primary" />
                              <span className="font-medium">الحد الأقصى: {session.max_students || 20}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-center gap-2 md:border-r md:pr-6 md:min-w-[200px]">
                          {session.status === 'in_progress' ? (
                            <>
                              <Button size="lg" onClick={() => handleEnterLive(session.id)} className="w-full bg-red-600 hover:bg-red-700 text-white shadow-md">
                                <Radio className="w-4 h-4 ml-2 animate-pulse" />
                                دخول الغرفة
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleEndSession(session.id)} className="w-full border-red-200 text-red-600 hover:bg-red-50">
                                إنهاء الجلسة
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="lg" onClick={() => handleStartNow(session.id)} className="w-full font-bold shadow-md">
                                بدء الجلسة الآن
                              </Button>
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <Button size="sm" variant="outline" onClick={() => handleOpenEditModal(session)} className="w-full">
                                  <Edit2 className="w-4 h-4 ml-1" />
                                  ��عديل
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDelete(session.id)} className="w-full text-destructive border-red-200 hover:bg-red-50">
                                  <Trash2 className="w-4 h-4 ml-1" />
                                  حذف
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border border-dashed">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">لا توجد جلسات مجدولة</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">لم تقم بجدولة أي جلسات قادمة. ابدأ بإنشاء جلسة جديدة للتواصل مع طلابك.</p>
                <Button onClick={handleOpenNewModal}>
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء جلسة جديدة
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4 animate-in fade-in-50 duration-500">
            {pastSessions.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {pastSessions.map((session) => (
                  <Card key={session.id} className="hover:border-primary/50 transition-colors bg-muted/20">
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                          {session.title}
                          {session.status === 'completed' ? (
                            <Badge variant="outline" className="text-xs bg-background">
                              مكتملة
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                              <Radio className="w-3 h-3 ml-1" />
                              مفعّلة للطلاب
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">{session.course_name}</p>
                        <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(session.scheduled_at).toLocaleDateString('ar-EG')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(session.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                            <Users className="w-3 h-3" />
                            {session.attendance_count || 0} حضور مسجل
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full sm:w-auto"
                          onClick={() => router.push(`/academy/teacher/sessions/${session.id}`)}
                        >
                          عرض تقرير الحضور
                        </Button>
                        {session.status !== 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto border-amber-300 text-amber-700 hover:bg-amber-50"
                            onClick={() => handleDeactivate(session.id)}
                          >
                            إلغاء التفعيل
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full sm:w-auto text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(session.id)}
                        >
                          <Trash2 className="w-4 h-4 ml-1" />
                          حذف السجل
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted text-muted-foreground mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">لا توجد سجلات لجلسات سابقة</h3>
                <p className="text-muted-foreground">ستظهر هنا الجلسات التي قمت بإنهائها وتفاصيل حضور الطلاب فيها.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* MODALS */}
      <Dialog open={isNewModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsNewModalOpen(false)
          setIsEditModalOpen(false)
        }
      }}>
        <DialogContent className="sm:max-w-[550px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{isEditModalOpen ? 'تعديل بيانات الجلسة' : 'جدولة جلسة تفاعلية جديدة'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 py-2 mt-2">
            
            <div className="flex flex-col space-y-2">
              <Label htmlFor="courseId" className="text-sm font-semibold">الدورة التدريبية <span className="text-destructive">*</span></Label>
              <select
                id="courseId"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="" disabled>اختر الدورة...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold">عنوان الجلسة <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-11"
                placeholder="مثال: مراجعة الوحدة الأولى وتطبيقات عملية"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="date" className="text-sm font-semibold">التاريخ <span className="text-destructive">*</span></Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-11" />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="time" className="text-sm font-semibold">الوقت <span className="text-destructive">*</span></Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="h-11" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="duration" className="text-sm font-semibold">المدة (بالدقائق) <span className="text-destructive">*</span></Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="maxStudents" className="text-sm font-semibold">سعة الطلاب (الحد الأقصى) <span className="text-destructive">*</span></Label>
                <Input
                  id="maxStudents"
                  type="number"
                  min="1"
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">تفاصيل ومحاور الجلسة (اختياري)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-11"
                placeholder="تفاصيل حول ما سيتم تغطيته في هذه الجلسة"
              />
            </div>

            <div className="rounded-xl border p-4 space-y-4 bg-muted/20">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={announceToStudents}
                    onChange={(e) => setAnnounceToStudents(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <div className="text-sm font-bold flex items-center gap-1">
                    <Megaphone className="w-4 h-4 text-primary" />
                    إرسال إشعار للطلاب
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">سيتم تنبيه جميع المسجلين في الدورة بموعد الجلسة</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group pt-2 border-t">
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={isPublicLesson}
                    onChange={(e) => setIsPublicLesson(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <div className="text-sm font-bold flex items-center gap-1">
                    <Globe2 className="w-4 h-4 text-green-600" />
                    جلسة عامة مفتوحة
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">إنشاء رابط يمكن مشاركته مع غير المسجلين للدخول كضيوف</p>
                </div>
              </label>

              {isPublicLesson && (
                <div className="flex flex-col space-y-2 pt-3 pl-7">
                  <Label htmlFor="seriesTitle" className="text-xs font-semibold text-muted-foreground">اسم السلسلة / التصنيف (اختياري)</Label>
                  <Input
                    id="seriesTitle"
                    value={seriesTitle}
                    onChange={(e) => setSeriesTitle(e.target.value)}
                    placeholder="مثال: سلسلة السيرة النبوية للمبتدئين"
                    className="h-9 text-sm"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); }} className="w-full sm:w-auto">
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-w-[120px]">
                {isSubmitting ? 'جاري الحفظ...' : (isEditModalOpen ? 'حفظ التعديلات' : 'جدولة الجلسة')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
