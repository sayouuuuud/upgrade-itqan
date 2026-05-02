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
  status: string
  review_notes?: string
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
  const [isDraft, setIsDraft] = useState(false)
  
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editLesson, setEditLesson] = useState<Lesson | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editVideoUrl, setEditVideoUrl] = useState('')
  const [editDuration, setEditDuration] = useState('')
  const [isEditDraft, setIsEditDraft] = useState(false)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null)

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
          duration_minutes: newDuration ? parseInt(newDuration) : null,
          status: isDraft ? 'draft' : 'pending_review'
        })
      })
      if (res.ok) {
        setIsAddOpen(false)
        setNewTitle('')
        setNewDesc('')
        setNewVideoUrl('')
        setNewDuration('')
        setIsDraft(false)
        fetchLessons()
      }
    } finally {
      setAdding(false)
    }
  }

  const handleEditLesson = async () => {
    if (!editLesson || !editTitle.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`/api/academy/teacher/courses/${courseId}/lessons/${editLesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          video_url: editVideoUrl,
          duration_minutes: editDuration ? parseInt(editDuration) : null,
          status: isEditDraft ? 'draft' : 'pending_review'
        })
      })
      if (res.ok) {
        setIsEditOpen(false)
        fetchLessons()
      }
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return
    setAdding(true)
    try {
      const res = await fetch(`/api/academy/teacher/courses/${courseId}/lessons/${lessonToDelete.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setIsDeleteOpen(false)
        setLessonToDelete(null)
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
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-foreground">{lesson.title}</h3>
                    {lesson.status === 'draft' && (
                      <span className="bg-gray-500/10 text-gray-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-gray-500/20">
                        {isAr ? "مسودة" : "Draft"}
                      </span>
                    )}
                    {lesson.status === 'pending_review' && (
                      <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-500/20">
                        {isAr ? "قيد المراجعة" : "Pending Review"}
                      </span>
                    )}
                    {lesson.status === 'published' && (
                      <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {isAr ? "منشور" : "Published"}
                      </span>
                    )}
                    {lesson.status === 'rejected' && (
                      <span className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-red-500/20">
                        {isAr ? "مرفوض" : "Rejected"}
                      </span>
                    )}
                  </div>
                  {lesson.description && <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{lesson.description}</p>}
                  {lesson.status === 'rejected' && lesson.review_notes && (
                      <p className="text-xs text-red-500 mb-2 font-medium bg-red-500/5 px-3 py-2 rounded-lg border border-red-500/10">
                        {isAr ? "سبب الرفض: " : "Rejection Reason: "}{lesson.review_notes}
                      </p>
                  )}

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

                <div className="flex items-center gap-2 self-end md:self-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => {
                      setEditLesson(lesson)
                      setEditTitle(lesson.title)
                      setEditDesc(lesson.description || '')
                      setEditVideoUrl(lesson.video_url || '')
                      setEditDuration(lesson.duration_minutes?.toString() || '')
                      setIsEditDraft(lesson.status === 'draft')
                      setIsEditOpen(true)
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setLessonToDelete(lesson)
                      setIsDeleteOpen(true)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Lesson Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] border-border bg-card">
          <DialogHeader>
            <DialogTitle>{isAr ? "تعديل الدرس" : "Edit Lesson"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4" dir={isAr ? "rtl" : "ltr"}>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground">{isAr ? "عنوان الدرس" : "Lesson Title"}</label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground">{isAr ? "الوصف" : "Description"}</label>
              <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">{isAr ? "رابط الفيديو" : "Video URL"}</label>
                <Input value={editVideoUrl} onChange={e => setEditVideoUrl(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">{isAr ? "المدة (دقائق)" : "Duration (Mins)"}</label>
                <Input type="number" value={editDuration} onChange={e => setEditDuration(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-2xl border border-border/50">
              <input 
                type="checkbox" 
                id="edit-draft-toggle"
                checked={isEditDraft}
                onChange={e => setIsEditDraft(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
              />
              <label htmlFor="edit-draft-toggle" className="text-sm font-bold cursor-pointer select-none">
                {isAr ? "حفظ كمسودة (لن يتم تقديمه للمراجعة)" : "Save as draft (will not be submitted for review)"}
              </label>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse sm:justify-start">
            <Button onClick={handleEditLesson} disabled={!editTitle.trim() || adding}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditDraft ? (isAr ? "حفظ المسودة" : "Save Draft") : (isAr ? "تقديم للمراجعة" : "Submit for Review"))}
            </Button>
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-destructive">{isAr ? "حذف الدرس" : "Delete Lesson"}</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center space-y-4" dir={isAr ? "rtl" : "ltr"}>
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
              <Trash2 className="w-8 h-8" />
            </div>
            <p className="font-bold text-foreground">
              {isAr ? `هل أنت متأكد من حذف درس «${lessonToDelete?.title}»؟` : `Are you sure you want to delete "${lessonToDelete?.title}"?`}
            </p>
            <p className="text-sm text-muted-foreground">
              {isAr ? "لا يمكن التراجع عن هذا الإجراء وسيتم حذف كافة ملفات التقدم المرتبطة بالدرس." : "This action cannot be undone and all associated progress data will be deleted."}
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="destructive" className="w-full sm:w-auto" onClick={handleDeleteLesson} disabled={adding}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "تأكيد الحذف" : "Confirm Delete")}
            </Button>
            <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setIsDeleteOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-2xl border border-border/50">
              <input 
                type="checkbox" 
                id="draft-toggle"
                checked={isDraft}
                onChange={e => setIsDraft(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
              />
              <label htmlFor="draft-toggle" className="text-sm font-bold cursor-pointer select-none">
                {isAr ? "حفظ كمسودة (لن يتم تقديمه للمراجعة)" : "Save as draft (will not be submitted for review)"}
              </label>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse sm:justify-start">
            <Button onClick={handleAddLesson} disabled={!newTitle.trim() || adding}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : (isDraft ? (isAr ? "حفظ المسودة" : "Save Draft") : (isAr ? "تقديم للمراجعة" : "Submit for Review"))}
            </Button>
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
