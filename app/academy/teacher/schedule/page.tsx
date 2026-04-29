'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Users, Plus, Edit2, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function TeacherSchedulePage() {
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/academy/teacher/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.data || data || [])
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/academy/teacher/courses')
      if (res.ok) {
        const data = await res.json()
        setCourses(data.data || data || [])
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    }
  }

  const loadData = async () => {
    setLoading(true)
    await Promise.all([fetchSessions(), fetchCourses()])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setCourseId('')
    setTitle('')
    setDescription('')
    setDate('')
    setTime('')
    setDuration('60')
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
      duration_minutes: parseInt(duration)
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
    if (!confirm('هل أنت متأكد من حذف هذه الجلسة؟')) return

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
        toast.success('تم تفعيل الجلسة للطلاب')
        fetchSessions()
      } else {
        toast.error('حدث خطأ أثناء التفعيل')
      }
    } catch (err) {
      toast.error('فشل في الاتصال بالخادم')
    }
  }

  if (loading) {
    return <div className="text-center py-8 flex flex-col items-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      دقيقة واحدة، جاري التحميل...
    </div>
  }

  // Ensure sessions is an array before filtering
  const safeSessions = Array.isArray(sessions) ? sessions : []
  const upcomingSessions = safeSessions.filter(s => new Date(s.scheduled_at) > new Date() && s.status !== 'completed')
  const pastSessions = safeSessions.filter(s => new Date(s.scheduled_at) <= new Date() || s.status === 'completed')

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">الجدول والجلسات</h1>
        <Button onClick={handleOpenNewModal}>
          <Plus className="w-4 h-4 ml-2" />
          جلسة جديدة
        </Button>
      </div>

      {upcomingSessions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">الجلسات القادمة والنشطة</h2>
          <div className="space-y-3">
            {upcomingSessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold">{session.title} <span className="text-sm font-normal text-muted-foreground mr-2">({session.course_name})</span></h3>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(session.scheduled_at).toLocaleDateString('ar-EG')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(session.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-1 text-primary">
                          مدتها: {session.duration_minutes || 60} دقيقة
                        </div>
                      </div>
                      {session.status === 'in_progress' && <p className="text-sm text-green-600 font-bold mt-1">الجلسة نشطة حالياً</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(session.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleOpenEditModal(session)}>
                        <Edit2 className="w-4 h-4 ml-1" />
                        تعديل
                      </Button>
                      <Button size="sm" onClick={() => handleStartNow(session.id)} disabled={session.status === 'in_progress'}>
                        {session.status === 'in_progress' ? 'نشطة' : 'ابدأ الآن'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pastSessions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 mt-8">الجلسات السابقة</h2>
          <div className="space-y-2">
            {pastSessions.slice(0, 10).map((session) => (
              <Card key={session.id} className="opacity-80">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{session.title}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(session.scheduled_at).toLocaleDateString('ar-EG')} - {session.course_name}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">عرض التفاصيل</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {safeSessions.length === 0 && (
        <Card className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 mb-4">لا توجد جلسات مجدولة ضمن أي من دوراتك</p>
          <Button onClick={handleOpenNewModal}>
            <Plus className="w-4 h-4 ml-2" />
            جدول أول جلسة
          </Button>
        </Card>
      )}

      {/* MODALS */}
      <Dialog open={isNewModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsNewModalOpen(false)
          setIsEditModalOpen(false)
        }
      }}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>{isEditModalOpen ? 'تعديل الجلسة' : 'جدولة جلسة جديدة'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="courseId">الدورة التدريبية</Label>
              <select
                id="courseId"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="" disabled>اختر الدورة</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="title">عنوان الجلسة</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="مثال: مراجعة الوحدة الأولى"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="description">وصف الجلسة (اختياري)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="تفاصيل إضافية عن الجلسة"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="date">التاريخ</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="time">الوقت</Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="duration">المدة (بالدقائق)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ الجلسة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
