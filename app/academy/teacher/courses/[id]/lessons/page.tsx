'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useI18n } from '@/lib/i18n/context'
import { Loader2, Plus, ArrowRight, Play, Edit2, Trash2, Clock, ListOrdered } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  description: string | null
  video_url: string | null
  duration_minutes: number | null
  order_index: number
  created_at: string
}

export default function CourseLessonsPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [adding, setAdding] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [newDuration, setNewDuration] = useState('')

  useEffect(() => {
    fetchLessons()
  }, [])

  const fetchLessons = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/academy/teacher/courses/${courseId}/lessons`)
      if (res.ok) {
        const data = await res.json()
        setLessons(data.lessons || [])
      } else {
        router.push('/academy/teacher') // Unauthorized or not found
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleAddLesson = async () => {
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`/api/academy/teacher/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          video_url: newVideoUrl,
          duration_minutes: newDuration ? parseInt(newDuration) : null
        })
      })
      if (res.ok) {
        setIsAddOpen(false)
        setNewTitle('')
        setNewDesc('')
        setNewVideoUrl('')
        setNewDuration('')
        fetchLessons()
      }
    } finally {
      setAdding(false)
    }
  }

  // Delete/Edit functionality can be added later if needed via API, this is minimal MVP.

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <Button variant="ghost" onClick={() => router.push('/academy/teacher')} className="mb-2">
            {isAr ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowRight className="w-4 h-4 mr-2 rotate-180" />}
            {isAr ? "العودة للوحة التحكم" : "Back to Dashboard"}
          </Button>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <ListOrdered className="w-8 h-8 text-primary" />
            {isAr ? "إدارة دروس الدورة" : "Manage Course Lessons"}
          </h1>
          <p className="text-muted-foreground font-medium">
            {isAr ? "أضف ورتب دروس ومحتويات دورتك التعليمية." : "Add and arrange the lessons and content of your course."}
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          {isAr ? "إضافة درس جديد" : "Add New Lesson"}
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : lessons.length === 0 ? (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Play className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-bold text-foreground mb-1">{isAr ? "لا توجد دروس بعد" : "No lessons yet"}</p>
              <p className="text-sm text-muted-foreground">{isAr ? "ابدأ بإضافة أول درس لهذه الدورة" : "Start by adding the first lesson to this course"}</p>
            </CardContent>
          </Card>
        ) : (
          lessons.map((lesson, idx) => (
            <Card key={lesson.id} className="border-border shadow-sm">
              <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <h3 className="font-black text-xl text-primary">{idx + 1}</h3>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-foreground mb-1">{lesson.title}</h3>
                  {lesson.description && <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{lesson.description}</p>}

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
                    {lesson.duration_minutes && (
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {lesson.duration_minutes} {isAr ? "دقيقة" : "mins"}</span>
                    )}
                    {lesson.video_url && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-sm">
                        <Play className="w-3 h-3" /> {isAr ? "يحتوي فيديو" : "Has Video"}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[600px] border-border bg-card">
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة درس جديد" : "Add New Lesson"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4" dir={isAr ? "rtl" : "ltr"}>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground">{isAr ? "عنوان الدرس" : "Lesson Title"}</label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={isAr ? "مثال: مقدمة في علوم القرآن..." : "e.g. Introduction to Quranic Sciences..."} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground">{isAr ? "وصف مختصر (اختياري)" : "Brief Description (Optional)"}</label>
              <Textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                rows={3}
                placeholder={isAr ? "اكتب نبذة عن محتوى الدرس..." : "Write a brief about the lesson content..."}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">{isAr ? "رابط الفيديو (اختياري)" : "Video URL (Optional)"}</label>
                <Input value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} placeholder="https://..." dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">{isAr ? "مدة الدرس بالدقائق (اختياري)" : "Duration (Mins) (Optional)"}</label>
                <Input type="number" min="1" value={newDuration} onChange={e => setNewDuration(e.target.value)} placeholder="30" />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse sm:justify-start">
            <Button onClick={handleAddLesson} disabled={!newTitle.trim() || adding}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "إضافة الدرس" : "Add Lesson")}
            </Button>
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
