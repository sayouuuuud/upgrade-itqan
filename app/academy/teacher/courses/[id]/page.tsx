"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import {
  ArrowRight, PlayCircle, Settings, Users, BookOpen, Clock,
  Trash2, Plus, GripVertical, CheckCircle2, UploadCloud,
  FileText, Video, Image as ImageIcon, FileIcon, Loader2, Save, Trash, Edit2
} from 'lucide-react'

type Tab = 'lessons' | 'settings' | 'students'

export default function ManageCoursePage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const courseId = params.id as string

  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingRequests, setPendingRequests] = useState(0)

  const [activeTab, setActiveTab] = useState<Tab>('lessons')

  // Settings Tab
  const [courseSettings, setCourseSettings] = useState({ title: '', description: '', thumbnail_url: '', level: 'beginner', status: 'draft' })
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  // Add Lesson
  const [showAddLesson, setShowAddLesson] = useState(false)
  const [isSubmitLesson, setIsSubmitLesson] = useState(false)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [newLesson, setNewLesson] = useState({ title: '', description: '', video_url: '', duration_minutes: '' })
  const [attachments, setAttachments] = useState<any[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const fetchCourseData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/academy/teacher/courses/${courseId}`)
      if (res.ok) {
        const data = await res.json()
        setCourse(data.course)
        setCourseSettings({
          title: data.course.title || '',
          description: data.course.description || '',
          thumbnail_url: data.course.thumbnail_url || '',
          level: data.course.level || 'beginner',
          status: data.course.status || 'draft'
        })
        setLessons(data.lessons || [])
        setPendingRequests(data.pending_requests || 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await fetch(`/api/academy/teacher/courses/${courseId}/students`)
      if (res.ok) {
        const data = await res.json()
        setStudents(data.data || [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  useEffect(() => {
    if (activeTab === 'students' && students.length === 0) {
      fetchStudents()
    }
  }, [activeTab])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'lesson_video' | 'lesson_doc') => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFiles(prev => ({ ...prev, [type]: true }))
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) {
        const text = await res.json()
        alert(text.error || "Upload failed")
        return
      }
      const data = await res.json()

      if (type === 'thumbnail') {
        setCourseSettings(prev => ({ ...prev, thumbnail_url: data.url }))
      } else if (type === 'lesson_video') {
        setNewLesson(prev => ({ ...prev, video_url: data.url }))
      } else if (type === 'lesson_doc') {
        setAttachments(prev => [...prev, { name: file.name, url: data.url, type: file.type }])
      }
    } catch (error) {
      console.error(error)
      alert("Failed to upload file")
    } finally {
      setUploadingFiles(prev => ({ ...prev, [type]: false }))
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSettings(true)
    try {
      const res = await fetch(`/api/academy/teacher/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseSettings)
      })
      if (res.ok) {
        await fetchCourseData()
        alert("تم الحفظ بنجاح!")
      }
    } catch (er) {
      console.error(er)
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLesson.title) return
    setIsSubmitLesson(true)
    try {
      if (editingLessonId) {
        const res = await fetch(`/api/academy/teacher/courses/${courseId}/lessons/${editingLessonId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newLesson,
            duration_minutes: newLesson.duration_minutes ? Number(newLesson.duration_minutes) : undefined,
            attachments
          })
        })
        if (res.ok) {
          await fetchCourseData()
          setShowAddLesson(false)
          setEditingLessonId(null)
          setNewLesson({ title: '', description: '', video_url: '', duration_minutes: '' })
          setAttachments([])
        }
      } else {
        const res = await fetch(`/api/academy/teacher/courses/${courseId}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newLesson,
            duration_minutes: newLesson.duration_minutes ? Number(newLesson.duration_minutes) : undefined,
            attachments
          })
        })
        if (res.ok) {
          await fetchCourseData()
          setShowAddLesson(false)
          setNewLesson({ title: '', description: '', video_url: '', duration_minutes: '' })
          setAttachments([])
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitLesson(false)
    }
  }

  const handleEditClick = (lesson: any) => {
    setEditingLessonId(lesson.id)
    setNewLesson({
      title: lesson.title || '',
      description: lesson.description || '',
      video_url: lesson.video_url || '',
      duration_minutes: lesson.duration_minutes ? lesson.duration_minutes.toString() : ''
    })
    setAttachments(lesson.attachments || [])
    setShowAddLesson(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelLesson = () => {
    setShowAddLesson(false)
    setEditingLessonId(null)
    setNewLesson({ title: '', description: '', video_url: '', duration_minutes: '' })
    setAttachments([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!course) return <div className="text-center p-8 bg-card rounded-xl border border-border">الدورة غير موجودة</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Profile Card */}
      <div className="relative bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        <div className="px-6 pb-6 relative">
          <div className="flex gap-4 items-end -mt-10 mb-4">
            <div className="w-24 h-24 rounded-xl border-4 border-card bg-muted shadow-md overflow-hidden flex items-center justify-center">
              {course.thumbnail_url ? (
                <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-10 h-10 text-muted-foreground opacity-50" />
              )}
            </div>
            <div className="flex-1 pb-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{course.title}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded font-medium">
                    {course.level === 'beginner' ? 'مبتدئ' : course.level === 'advanced' ? 'متقدم' : 'متوسط'}
                  </span>
                  {course.category_name && <span>• {course.category_name}</span>}
                </p>
              </div>
              <Link href="/academy/teacher/courses" className="px-4 py-2 border border-border bg-card hover:bg-muted font-bold rounded-lg transition-colors flex items-center gap-2">
                العودة <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 p-1 bg-muted/30 border border-border rounded-xl">
        <button
          onClick={() => setActiveTab('lessons')}
          className={`flex-1 flex gap-2 justify-center items-center py-3 px-4 font-bold rounded-lg transition-all ${activeTab === 'lessons' ? 'bg-card text-blue-600 shadow-sm border border-border' : 'text-muted-foreground hover:bg-muted/50'}`}
        >
          <PlayCircle className="w-5 h-5" /> دروس الدورة
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex gap-2 justify-center items-center py-3 px-4 font-bold rounded-lg transition-all ${activeTab === 'settings' ? 'bg-card text-blue-600 shadow-sm border border-border' : 'text-muted-foreground hover:bg-muted/50'}`}
        >
          <Settings className="w-5 h-5" /> إعدادات الدورة
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 flex gap-2 justify-center items-center py-3 px-4 font-bold rounded-lg transition-all ${activeTab === 'students' ? 'bg-card text-blue-600 shadow-sm border border-border' : 'text-muted-foreground hover:bg-muted/50'}`}
        >
          <Users className="w-5 h-5" /> الطلاب المسجلين
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="md:col-span-3 space-y-6">

          {/* --- LESSONS TAB --- */}
          {activeTab === 'lessons' && (
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/10">
                <h2 className="text-xl font-bold flex items-center gap-2">المحتوى التعليمي</h2>
                <button
                  onClick={() => {
                    if (showAddLesson) {
                      handleCancelLesson()
                    } else {
                      setShowAddLesson(true)
                      setEditingLessonId(null)
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm shadow-md"
                >
                  <Plus className="w-4 h-4" /> إضافة درس
                </button>
              </div>

              {showAddLesson && (
                <div className="p-6 border-b border-border bg-blue-50/50 dark:bg-blue-900/10 transition-all">
                  <form onSubmit={handleAddLesson} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="col-span-2">
                        <label className="text-sm font-bold block mb-1">عنوان الدرس <span className="text-red-500">*</span></label>
                        <input required value={newLesson.title} onChange={e => setNewLesson({ ...newLesson, title: e.target.value })} type="text" placeholder="اكتب عنواناً جذاباً للدرس" className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-bold block mb-1">المحتوى المرئي (فيديو)</label>
                        <div className="flex flex-col gap-3">
                          <div className="flex gap-2">
                            <input type="url" placeholder="رابط يوتيوب أو Vimeo" value={newLesson.video_url} onChange={e => setNewLesson({ ...newLesson, video_url: e.target.value })} className="flex-1 p-3 rounded-xl border border-border bg-background text-left dir-ltr focus:ring-2 focus:ring-blue-500 outline-none" />
                            <div className="relative">
                              <input type="file" accept="video/*" onChange={e => handleFileUpload(e, 'lesson_video')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                              <button type="button" disabled={uploadingFiles['lesson_video']} className="h-full px-4 bg-muted hover:bg-muted/80 text-foreground font-bold border border-border rounded-xl flex items-center gap-2 transition-colors">
                                {uploadingFiles['lesson_video'] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                                رفع فيديو
                              </button>
                            </div>
                          </div>

                          {/* Video Preview */}
                          {newLesson.video_url && (
                            <div className="w-full relative rounded-xl overflow-hidden bg-black aspect-video border border-border">
                              {(newLesson.video_url.includes('youtube.com') || newLesson.video_url.includes('youtu.be')) ? (
                                <iframe
                                  src={`https://www.youtube.com/embed/${newLesson.video_url.includes('youtu.be') ? newLesson.video_url.split('youtu.be/')[1] : newLesson.video_url.split('v=')[1]?.split('&')[0]}`}
                                  className="w-full h-full"
                                  allowFullScreen
                                />
                              ) : (
                                <video
                                  src={newLesson.video_url}
                                  controls
                                  className="w-full h-full object-contain"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className="text-sm font-bold block mb-1">مدة الدرس التقريبية (بالدقائق)</label>
                        <input type="number" min="1" value={newLesson.duration_minutes} onChange={e => setNewLesson({ ...newLesson, duration_minutes: e.target.value })} placeholder="30" className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="text-sm font-bold block mb-1">المرفقات والملفات (PDF/Docs)</label>
                      <div className="p-4 border-2 border-dashed border-border rounded-xl bg-background text-center relative group hover:border-blue-500 transition-colors">
                        <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={e => handleFileUpload(e, 'lesson_doc')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground pointer-events-none">
                          {uploadingFiles['lesson_doc'] ? <Loader2 className="w-8 h-8 animate-spin text-blue-500" /> : <UploadCloud className="w-8 h-8 group-hover:text-blue-500 transition-colors tracking-widest" />}
                          <span className="font-bold text-sm">اسحب وافلت الملفات هنا أو اضغط للرفع</span>
                          <span className="text-xs">يدعم PDF, Word, Excel حتى 20 ميجابايت</span>
                        </div>
                      </div>
                      {attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {attachments.map((att, i) => (
                            <div key={i} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
                              <FileIcon className="w-4 h-4" />
                              <span className="truncate max-w-[150px]">{att.name}</span>
                              <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-blue-400 hover:text-red-500"><Trash className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="text-sm font-bold block mb-1">وصف الدرس التدريبي</label>
                      <textarea value={newLesson.description} onChange={e => setNewLesson({ ...newLesson, description: e.target.value })} className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 outline-none" rows={3} placeholder="ماذا سيتعلم الطالب في هذا الدرس؟" />
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-border">
                      <button type="button" onClick={handleCancelLesson} className="px-5 py-2.5 bg-muted hover:bg-muted/80 rounded-xl font-bold transition-colors">إلغاء</button>
                      <button type="submit" disabled={isSubmitLesson || uploadingFiles['lesson_video'] || uploadingFiles['lesson_doc']} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                        {isSubmitLesson ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {editingLessonId ? "تحديث الدرس" : "حفظ الدرس"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="divide-y divide-border">
                {lessons.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center">
                    <BookOpen className="w-16 h-16 text-muted/50 mb-4" />
                    <h3 className="text-lg font-bold text-muted-foreground mb-1">لم يتم إضافة دروس بعد</h3>
                    <p className="text-sm text-muted-foreground/80">ابدأ بإضافة أول درس تعليمي للطلاب الآن</p>
                  </div>
                ) : (
                  lessons.map((lesson, idx) => (
                    <div key={lesson.id} className="p-5 flex items-center gap-4 hover:bg-muted/30 transition-colors group">
                      <div className="text-muted-foreground cursor-grab active:cursor-grabbing"><GripVertical className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" /></div>
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex justify-center items-center font-black text-sm shadow-sm">{idx + 1}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{lesson.title}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-3">
                          {lesson.duration_minutes && <span><Clock className="w-3.5 h-3.5 inline mr-1" /> {lesson.duration_minutes} دقيقة</span>}
                          {lesson.video_url && <span className="text-green-600 dark:text-green-500 font-medium"><CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> يوجد فيديو مفهرس</span>}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button title="تعديل الدرس" onClick={() => handleEditClick(lesson)} className="p-2 text-blue-500 opacity-0 group-hover:opacity-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"><Edit2 className="w-5 h-5" /></button>
                        <button title="حذف الدرس" className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* --- SETTINGS TAB --- */}
          {activeTab === 'settings' && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 lg:p-8">
              <h2 className="text-xl font-bold mb-6 border-b border-border pb-4 flex items-center gap-2">
                <Settings className="w-6 h-6 text-blue-600" />
                إدارة خصائص الدورة
              </h2>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="text-sm font-bold block mb-2">الصورة التعريفية (Thumbnail)</label>
                    <div className="flex items-end gap-4">
                      <div className="w-40 h-24 bg-muted rounded-xl border-2 border-dashed border-border overflow-hidden flex items-center justify-center relative shadow-inner">
                        {courseSettings.thumbnail_url ? (
                          <img src={courseSettings.thumbnail_url} alt="Thumbnail preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex-1 relative">
                        <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'thumbnail')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <button type="button" disabled={uploadingFiles['thumbnail']} className="px-5 py-2.5 bg-card border border-border hover:bg-muted font-bold rounded-xl flex items-center gap-2 shadow-sm transition-colors">
                          {uploadingFiles['thumbnail'] ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                          رفع صورة جديدة
                        </button>
                        <p className="text-xs text-muted-foreground mt-2">الحجم الأمثل 1280x720. أقصى حجم 4MB.</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="text-sm font-bold block mb-1">عنوان الدورة الأساسي</label>
                    <input type="text" value={courseSettings.title} onChange={e => setCourseSettings({ ...courseSettings, title: e.target.value })} className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 font-bold" />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="text-sm font-bold block mb-1">مستوى الصعوبة</label>
                    <select value={courseSettings.level} onChange={e => setCourseSettings({ ...courseSettings, level: e.target.value })} className="w-full p-3 rounded-xl border border-border bg-background font-medium">
                      <option value="beginner">مبتدئ (تأسيس)</option>
                      <option value="intermediate">متوسط</option>
                      <option value="advanced">متقدم (احترافي)</option>
                    </select>
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="text-sm font-bold block mb-1">حالة الظهور (النشر)</label>
                    <select value={courseSettings.status} onChange={e => setCourseSettings({ ...courseSettings, status: e.target.value })} className="w-full p-3 rounded-xl border border-border bg-background font-medium">
                      <option value="published">فعالة / منشورة للكل</option>
                      <option value="draft">مسودة خفية</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-sm font-bold block mb-1">وصف الدورة (نبذة عامة)</label>
                    <textarea value={courseSettings.description} onChange={e => setCourseSettings({ ...courseSettings, description: e.target.value })} className="w-full p-3 rounded-xl border border-border bg-background leading-relaxed" rows={4}></textarea>
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex justify-end">
                  <button type="submit" disabled={isSavingSettings} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 font-bold flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
                    {isSavingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    تحديث مساحات الدورة
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* --- STUDENTS TAB --- */}
          {activeTab === 'students' && (
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-muted/50 to-transparent">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-indigo-600" /> الطلاب المسجلين</h2>
                  <p className="text-sm text-muted-foreground mt-1">قائمة بالطلاب الحاليين ومتابعة تقدمهم واستيعابهم.</p>
                </div>
                <div className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-bold shadow-sm">
                  إجمالي المسجلين: <span className="text-indigo-600 text-lg mx-1">{students.length}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-muted/40 font-bold border-b border-border">
                    <tr>
                      <th className="p-4 rounded-tr-lg">الطالب</th>
                      <th className="p-4">تاريخ الانضمام</th>
                      <th className="p-4">نسبة التقدم المحرز</th>
                      <th className="p-4">حالة الحساب</th>
                      <th className="p-4 border-l-0 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">لا يوجد طلاب مسجلين في الوقت الحالي.</td>
                      </tr>
                    ) : (
                      students.map(s => (
                        <tr key={s.enrollment_id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4 font-medium flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 font-bold text-indigo-700 flex items-center justify-center">
                              {s.avatar_url ? <img src={s.avatar_url} className="rounded-full w-full h-full object-cover" /> : s.name.charAt(0)}
                            </div>
                            <div>
                              <div>{s.name}</div>
                              <div className="text-xs text-muted-foreground font-normal">{s.email || '-'}</div>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground">{new Date(s.enrolled_at).toLocaleDateString('ar-EG')}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <span className="font-bold w-9">{s.progress}%</span>
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${s.progress}%` }}></div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{s.completed_lessons} دروس منجزة</div>
                          </td>
                          <td className="p-4">
                            <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-bold ring-1 ring-green-500/20">
                              مفعل وحر
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline px-2 py-1 rounded transition-colors text-center w-full">إزالة الطالب</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Info Sidebar Section */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-gradient-to-bl from-blue-600 to-indigo-700 text-white rounded-xl shadow-lg p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <BookOpen className="w-24 h-24" />
            </div>
            <h3 className="font-bold mb-2 text-lg relative z-10">لوحة التحكم السريعة</h3>
            <p className="text-sm text-blue-100 mb-5 relative z-10 leading-relaxed">أبقِ دورتك محدثة وتابّع طلّابك لضمان تجربة تعليمية فريدة لهم.</p>

            {pendingRequests > 0 && (
              <div className="bg-yellow-400 text-yellow-900 rounded-xl p-4 font-bold text-sm relative z-10 shadow-sm animate-pulse">
                لديك {pendingRequests} طلب انضمام جديد!
                <Link href={`/academy/teacher/enrollment-requests?course_id=${courseId}`} className="block mt-2 text-center py-2 bg-white/30 hover:bg-white/50 rounded-lg transition-colors">
                  مراجعة الطلبات
                </Link>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-600" /> ملخص الدورة</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-3 bg-muted/30 hover:bg-muted/60 transition-colors rounded-lg border border-border/50">
                <span className="text-muted-foreground font-medium">حالة النشر</span>
                <span className="font-bold">{course.status === 'published' ? 'منشورة عامة' : 'مسودة خاصة'}</span>
              </div>
              <div className="flex justify-between p-3 bg-muted/30 hover:bg-muted/60 transition-colors rounded-lg border border-border/50">
                <span className="text-muted-foreground font-medium">عدد الدروس</span>
                <span className="font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded shadow-sm">{lessons.length}</span>
              </div>
              <div className="flex justify-between p-3 bg-muted/30 hover:bg-muted/60 transition-colors rounded-lg border border-border/50">
                <span className="text-muted-foreground font-medium">مستوى المادة</span>
                <span className="font-bold">{course.level === 'beginner' ? 'مبتدئ' : course.level === 'advanced' ? 'متقدم' : 'متوسط'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
