'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Plus, Trash2, Edit2, BookOpen, X, Loader2, BarChart3,
  UserPlus, Users, Mic, Eye, EyeOff, Search, CheckSquare, Square, Check,
  Layers, UploadCloud, ImageIcon
} from 'lucide-react'
import { PageLoadingSkeleton } from '@/components/ui/page-loading-skeleton'

interface Path {
  id: string
  title: string
  description: string
  subject: string
  level: string
  is_published: boolean
  thumbnail_url?: string | null
  require_audio?: boolean
  total_courses: number
  estimated_hours: number
  enrolled_count?: number
}

interface TeacherCourse {
  id: string
  title: string
  total_enrolled: number
}

interface CourseStudent {
  student_id: string
  name: string
  email: string
  status: string
}

const SUBJECTS = [
  { value: 'tajweed', label: 'التجويد والمقرأة' },
  { value: 'fiqh', label: 'الفقه الإسلامي' },
  { value: 'aqeedah', label: 'العقيدة الإسلامية' },
  { value: 'seerah', label: 'السيرة النبوية' },
  { value: 'tafsir', label: 'التفسير وعلوم القرآن' },
]
const LEVELS = [
  { value: 'beginner', label: 'مبتدئ' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced', label: 'متقدم' },
]

const emptyForm = {
  title: '', description: '', subject: 'tajweed', level: 'beginner',
  estimated_hours: 0, thumbnail_url: '', require_audio: false, is_published: false,
}

export default function TeacherPathsPage() {
  const router = useRouter()
  const [paths, setPaths] = useState<Path[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Path | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const thumbInputRef = useRef<HTMLInputElement>(null)

  // Enroll-students modal state
  const [enrollPath, setEnrollPath] = useState<Path | null>(null)
  const [courses, setCourses] = useState<TeacherCourse[]>([])
  const [coursesLoaded, setCoursesLoaded] = useState(false)
  const [enrollCourseId, setEnrollCourseId] = useState('')
  const [courseStudents, setCourseStudents] = useState<CourseStudent[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [studentSearch, setStudentSearch] = useState('')
  const [enrolling, setEnrolling] = useState(false)

  const fetchPaths = async () => {
    try {
      const res = await fetch('/api/academy/teacher/paths')
      if (res.ok) {
        const data = await res.json()
        setPaths(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch paths:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPaths() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (path: Path) => {
    setEditItem(path)
    setForm({
      title: path.title,
      description: path.description || '',
      subject: path.subject || 'tajweed',
      level: path.level || 'beginner',
      estimated_hours: path.estimated_hours || 0,
      thumbnail_url: path.thumbnail_url || '',
      require_audio: path.require_audio || false,
      is_published: path.is_published || false,
    })
    setShowModal(true)
  }

  const openEnroll = async (path: Path) => {
    setEnrollPath(path)
    setEnrollCourseId('')
    setCourseStudents([])
    setSelectedIds(new Set())
    setStudentSearch('')
    if (!coursesLoaded) {
      try {
        const res = await fetch('/api/academy/teacher/courses')
        if (res.ok) {
          const data = await res.json()
          setCourses(Array.isArray(data) ? data : data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setCoursesLoaded(true)
      }
    }
  }

  const selectCourse = async (courseId: string) => {
    setEnrollCourseId(courseId)
    setCourseStudents([])
    setSelectedIds(new Set())
    if (!courseId) return
    setLoadingStudents(true)
    try {
      const res = await fetch(`/api/academy/teacher/courses/${courseId}/students`)
      if (res.ok) {
        const data = await res.json()
        const list: CourseStudent[] = (data.data || []).filter((s: CourseStudent) => s.status !== 'dropped')
        setCourseStudents(list)
      }
    } catch (error) {
      console.error('Failed to fetch course students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const filteredStudents = courseStudents.filter(
    (s) => s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.email?.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedIds.has(s.student_id))
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) filteredStudents.forEach((s) => next.delete(s.student_id))
      else filteredStudents.forEach((s) => next.add(s.student_id))
      return next
    })
  }

  const handleEnroll = async (mode: 'selected' | 'all') => {
    if (!enrollPath || !enrollCourseId) return
    const payload = mode === 'all'
      ? { course_id: enrollCourseId, all: true }
      : { student_ids: Array.from(selectedIds) }
    if (mode === 'selected' && selectedIds.size === 0) return
    setEnrolling(true)
    try {
      const res = await fetch(`/api/academy/teacher/paths/${enrollPath.id}/enroll-students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        alert(`تم تسجيل ${data.enrolled} طالب جديد` + (data.reactivated ? ` وإعادة تفعيل ${data.reactivated}` : '') + (data.skipped ? ` (${data.skipped} مسجلين مسبقاً)` : ''))
        setEnrollPath(null)
        fetchPaths()
      } else {
        alert(data.error || 'حدث خطأ أثناء التسجيل')
      }
    } finally {
      setEnrolling(false)
    }
  }

  const handleThumbUpload = async (file: File) => {
    setUploadingThumb(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (res.ok && json.url) {
        setForm((prev) => ({ ...prev, thumbnail_url: json.url }))
        toast.success('تم رفع الصورة')
      } else {
        toast.error(json.error || 'فشل رفع الصورة')
      }
    } catch {
      toast.error('حدث خطأ أثناء رفع الصورة')
    } finally {
      setUploadingThumb(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) return
    setSaving(true)
    try {
      const url = editItem ? `/api/academy/teacher/paths/${editItem.id}` : '/api/academy/teacher/paths'
      const method = editItem ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        const json = await res.json().catch(() => ({}))
        setShowModal(false)
        if (!editItem && json?.data?.id) {
          // Take the teacher straight to the new path so they can add its content
          toast.success('تم إنشاء المسار، أضف محتواه الآن')
          router.push(`/academy/teacher/paths/${json.data.id}`)
          return
        }
        toast.success('تم حفظ التعديلات')
        fetchPaths()
      } else {
        toast.error('حدث خطأ في الحفظ')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المسار؟')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/academy/teacher/paths/${id}`, { method: 'DELETE' })
      if (res.ok) fetchPaths()
      else alert('لا يمكن الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  const getSubjectLabel = (val: string) => SUBJECTS.find(s => s.value === val)?.label || val
  const getLevelLabel = (val: string) => LEVELS.find(l => l.value === val)?.label || val

  const FADE_UP_ANIMATION_VARIANTS = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  if (loading) {
    return <PageLoadingSkeleton />
  }

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      viewport={{ once: true }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.1 } }
      }}
      className="space-y-8 max-w-7xl mx-auto pb-12 relative" dir="rtl"
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Hero Welcome Section */}
      <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-l from-emerald-600 to-teal-700 p-8 sm:p-10 text-white shadow-xl shadow-emerald-900/10">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-sm">
              <Layers className="w-4 h-4 text-emerald-100" />
              <span className="text-sm font-bold tracking-wide">البرامج والمسارات</span>
            </div>
            <h1 className="text-3xl font-black sm:text-4xl drop-shadow-sm">
              إدارة المسارات التعليمية
            </h1>
            <p className="text-emerald-50 max-w-xl leading-relaxed text-base">
              أنشئ مسارات متسلسلة للطلاب تتكون من عدة دورات ومراحل. قم بإضافة الطلاب الجدد، وتتبع مستوى إنجازهم بشكل مفصل.
            </p>
          </div>
          
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-emerald-700 rounded-xl font-black transition-colors shadow-lg hover:bg-emerald-50 w-full sm:w-auto shrink-0"
          >
            <Plus className="w-5 h-5" />
            إنشاء مسار جديد
          </button>
        </div>
      </motion.div>

      {paths.length === 0 ? (
        <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-border/50 rounded-3xl p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-emerald-600/50" />
          </div>
          <h2 className="text-xl font-bold mb-3">لا توجد مسارات تعليمية بعد</h2>
          <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto leading-relaxed">
            المسار التعليمي هو سلسلة من الدورات. ابدأ بإنشاء مسارك الأول ثم أضف إليه الدورات من صفحة تفاصيل المسار.
          </p>
          <button onClick={openAdd} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md">
            <Plus className="w-5 h-5 inline mr-1" /> أضف أول مسار
          </button>
        </motion.div>
      ) : (
        <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {paths.map((path, index) => (
              <motion.div 
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3 className="font-bold text-xl leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{path.title}</h3>
                    <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full font-bold shrink-0 border border-emerald-200/50 dark:border-emerald-800/50">
                      {getLevelLabel(path.level)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-2 leading-relaxed font-medium">{path.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-6">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md">{getSubjectLabel(path.subject)}</span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {path.total_courses || 0} مرحلة</span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {path.enrolled_count || 0} طالب</span>
                    {path.is_published
                      ? <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-200/50">منشور</span>
                      : <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-md border border-amber-200/50">مسودة</span>}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-border/50">
                  <Link 
                    href={`/academy/teacher/paths/${path.id}`} 
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                  >
                    <Layers className="w-4 h-4" /> إدارة المسار
                  </Link>
                  <button
                    onClick={() => openEnroll(path)}
                    className="flex items-center justify-center p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-xl transition-colors shrink-0"
                    title="إضافة طلاب من دوراتك"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openEdit(path)} 
                    className="flex items-center justify-center p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                    title="تعديل المسار"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(path.id)}
                    disabled={deletingId === path.id}
                    className="flex items-center justify-center p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 rounded-xl transition-colors shrink-0 disabled:opacity-50"
                    title="حذف المسار"
                  >
                    {deletingId === path.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-none"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-full"
            >
              <div className="flex items-center justify-between p-6 sm:p-8 border-b border-border/50 bg-muted/20">
                <h3 className="text-xl font-black">{editItem ? 'تعديل المسار الأكاديمي' : 'إضافة مسار أكاديمي جديد'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">اسم المسار <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="مثال: مسار الفقه المالكي للمبتدئين"
                    className="w-full px-4 py-3 border border-border/60 rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">الوصف</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="وصف مختصر لأهداف المسار ومحتواه..."
                    className="w-full px-4 py-3 border border-border/60 rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">التخصص</label>
                    <select
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-4 py-3 border border-border/60 rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium appearance-none"
                    >
                      {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">المستوى</label>
                    <select
                      value={form.level}
                      onChange={e => setForm({ ...form, level: e.target.value })}
                      className="w-full px-4 py-3 border border-border/60 rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium appearance-none"
                    >
                      {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">المدة التقديرية (بالأيام)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.estimated_hours}
                    onChange={e => setForm({ ...form, estimated_hours: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-border/60 rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">صورة غلاف المسار (اختياري)</label>
                  <input
                    ref={thumbInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleThumbUpload(f)
                    }}
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 rounded-2xl border border-border/60 bg-muted/40 overflow-hidden shrink-0 flex items-center justify-center">
                      {form.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.thumbnail_url || "/placeholder.svg"} alt="معاينة صورة الغلاف" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-7 h-7 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <button
                        type="button"
                        onClick={() => thumbInputRef.current?.click()}
                        disabled={uploadingThumb}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-border/60 rounded-xl bg-background/50 hover:bg-muted/50 transition-colors text-sm font-medium disabled:opacity-60"
                      >
                        {uploadingThumb ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        {uploadingThumb ? 'جاري الرفع...' : form.thumbnail_url ? 'تغيير الصورة' : 'رفع صورة من جهازك'}
                      </button>
                      {form.thumbnail_url && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, thumbnail_url: '' })}
                          className="text-xs text-rose-500 hover:underline"
                        >
                          إزالة الصورة
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, require_audio: !form.require_audio })}
                    className={cn(
                      "w-full flex items-center justify-between gap-4 px-4 py-4 border rounded-2xl transition-all text-right",
                      form.require_audio ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/50" : "bg-card border-border/50 hover:bg-muted/50"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl", form.require_audio ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" : "bg-muted text-muted-foreground")}>
                        <Mic className="w-5 h-5" />
                      </div>
                      <span className="text-sm">
                        <span className="font-bold block mb-0.5">طلب تسجيل صوتي</span>
                        <span className="text-[11px] text-muted-foreground font-medium">إلزام الطالب برفع تلاوة صوتية لكل مرحلة</span>
                      </span>
                    </span>
                    <span className={cn("relative w-11 h-6 rounded-full transition-colors shrink-0", form.require_audio ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700")}>
                      <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", form.require_audio ? "right-1" : "right-6")} />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_published: !form.is_published })}
                    className={cn(
                      "w-full flex items-center justify-between gap-4 px-4 py-4 border rounded-2xl transition-all text-right",
                      form.is_published ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/50" : "bg-card border-border/50 hover:bg-muted/50"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl", form.is_published ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" : "bg-muted text-muted-foreground")}>
                        {form.is_published ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </div>
                      <span className="text-sm">
                        <span className="font-bold block mb-0.5">نشر المسار للطلاب</span>
                        <span className="text-[11px] text-muted-foreground font-medium">إتاحة المسار للطلاب للاشتراك به</span>
                      </span>
                    </span>
                    <span className={cn("relative w-11 h-6 rounded-full transition-colors shrink-0", form.is_published ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700")}>
                      <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", form.is_published ? "right-1" : "right-6")} />
                    </span>
                  </button>
                </div>
                
                <div className="flex gap-4 pt-4 border-t border-border/50 mt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors">
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    {editItem ? 'حفظ التعديلات' : 'إضافة المسار'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Enroll students modal */}
      <AnimatePresence>
        {enrollPath && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={(e) => e.target === e.currentTarget && setEnrollPath(null)}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-none"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between p-6 sm:p-8 border-b border-border/50 bg-muted/20 shrink-0">
                <div>
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    إضافة طلاب للمسار
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground mt-2 line-clamp-1">{enrollPath.title}</p>
                </div>
                <button onClick={() => setEnrollPath(null)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">اختر مصدر الطلاب (دوراتك)</label>
                  <select
                    value={enrollCourseId}
                    onChange={e => selectCourse(e.target.value)}
                    className="w-full px-4 py-3.5 border border-border/60 rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium appearance-none"
                  >
                    <option value="">— حدد الدورة لسحب الطلاب منها —</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title} ({c.total_enrolled} طالب مسجل)</option>
                    ))}
                  </select>
                  {coursesLoaded && courses.length === 0 && (
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200/50 mt-2">
                      لا توجد دورات مرتبطة بحسابك بعد. قم بإنشاء دورة لتمكين سحب الطلاب.
                    </p>
                  )}
                </div>

                {enrollCourseId && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                        className="w-full pr-11 pl-4 py-3 border border-border/60 rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all font-medium"
                      />
                    </div>

                    {loadingStudents ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-3 bg-muted/20 rounded-2xl border border-dashed border-border/50">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        <span className="text-sm font-medium text-muted-foreground">جاري جلب قائمة الطلاب...</span>
                      </div>
                    ) : courseStudents.length === 0 ? (
                      <div className="text-center py-10 bg-muted/20 rounded-2xl border border-dashed border-border/50">
                        <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-semibold text-muted-foreground">لا يوجد طلاب مسجلون في هذه الدورة.</p>
                      </div>
                    ) : (
                      <div className="border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="w-full flex items-center gap-3 px-4 py-3.5 bg-emerald-50/50 hover:bg-emerald-100/50 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20 text-sm font-black border-b border-border/60 transition-colors text-right"
                        >
                          {allFilteredSelected ? <CheckSquare className="w-5 h-5 text-emerald-600" /> : <Square className="w-5 h-5 text-emerald-600/40" />}
                          تحديد الكل ({filteredStudents.length})
                        </button>
                        <div className="max-h-64 overflow-y-auto divide-y divide-border/40 scrollbar-thin scrollbar-thumb-border">
                          {filteredStudents.map(s => {
                            const checked = selectedIds.has(s.student_id)
                            return (
                              <button
                                key={s.student_id}
                                type="button"
                                onClick={() => toggleStudent(s.student_id)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-4 py-3 transition-colors text-right",
                                  checked ? "bg-emerald-50/30 dark:bg-emerald-900/5" : "hover:bg-muted/40"
                                )}
                              >
                                {checked ? <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" /> : <Square className="w-5 h-5 text-muted-foreground shrink-0" />}
                                <span className="flex-1 min-w-0">
                                  <span className={cn("text-sm block truncate font-bold mb-0.5", checked ? "text-foreground" : "text-muted-foreground")}>{s.name}</span>
                                  <span className="text-[11px] font-medium text-muted-foreground block truncate">{s.email}</span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {enrollCourseId && courseStudents.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 p-6 sm:p-8 border-t border-border/50 bg-muted/20 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEnroll('all')}
                    disabled={enrolling}
                    className="flex-1 py-3 border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <Users className="w-5 h-5" />
                    إضافة الكل ({courseStudents.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEnroll('selected')}
                    disabled={enrolling || selectedIds.size === 0}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                  >
                    {enrolling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    إضافة المحددين ({selectedIds.size})
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
