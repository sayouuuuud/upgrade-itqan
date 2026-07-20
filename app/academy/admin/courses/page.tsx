'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  Plus, Edit2, Trash2, BookOpen, X, Loader2, Users, Archive,
  Search, Filter, GraduationCap, Clock, FileText, XCircle,
  ImageIcon, UploadCloud, Tag, PlayCircle, Settings, ExternalLink, CheckCircle2,
  Eye, ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CourseCardsGridSkeleton } from "@/components/admin/skeletons"
import { useI18n } from '@/lib/i18n/context'

type CourseStatus = 'draft' | 'pending_review' | 'published' | 'archived' | 'rejected'
type Level = 'beginner' | 'intermediate' | 'advanced'

interface Course {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  status: CourseStatus
  level: Level
  category_id: string | null
  teacher_id: string | null
  is_published: boolean
  is_active: boolean
  category_name: string
  teacher_name: string
  total_lessons: number
  total_enrolled: number
  pending_requests: number
  rejection_reason: string | null
  reviewed_at: string | null
  submitted_for_review_at: string | null
  created_at: string
}

interface Category {
  id: string
  name: string
}

interface Teacher {
  id: string
  name: string
  email: string
}

interface FormState {
  title: string
  description: string
  thumbnail_url: string
  category_id: string
  teacher_id: string
  status: CourseStatus
  level: Level
}

export default function AdminCoursesPage() {
  const { t, locale } = useI18n()
  const a = t.academyAdmin

  const STATUS_LABELS: Record<CourseStatus, string> = {
    published: a.courseStatus.published,
    draft: a.courseStatus.draft,
    pending_review: a.courseStatus.pendingReview,
    archived: a.courseStatus.archived,
    rejected: a.courseStatus.rejected,
  }

  const STATUS_BADGE_CLS: Record<CourseStatus, string> = {
    published: 'bg-green-500/90 text-white border-green-400',
    pending_review: 'bg-amber-500/90 text-white border-amber-400',
    rejected: 'bg-red-500/90 text-white border-red-400',
    archived: 'bg-gray-700/80 text-white border-gray-500',
    draft: 'bg-slate-700/70 text-white border-slate-500',
  }

  const LEVEL_LABELS: Record<Level, string> = {
    beginner: a.courseLevel.beginner,
    intermediate: a.courseLevel.intermediate,
    advanced: a.courseLevel.advanced,
  }

  const LEVEL_BADGE_CLS: Record<Level, string> = {
    beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    advanced: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  }

  const dateLocale = locale === 'ar' ? 'ar-EG' : 'en-US'

  const emptyForm: FormState = {
    title: '',
    description: '',
    thumbnail_url: '',
    category_id: '',
    teacher_id: '',
    status: 'draft',
    level: 'beginner',
  }

  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])

  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Course | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)

  const [dismissedPendingCount, setDismissedPendingCount] = useState(-1)
  const [dismissedRejectedCount, setDismissedRejectedCount] = useState(-1)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const storedPending = localStorage.getItem('dismissedPendingCount')
    if (storedPending) setDismissedPendingCount(parseInt(storedPending, 10))
    const storedRejected = localStorage.getItem('dismissedRejectedCount')
    if (storedRejected) setDismissedRejectedCount(parseInt(storedRejected, 10))
  }, [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CourseStatus>('all')
  const [levelFilter, setLevelFilter] = useState<'all' | Level>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all')
  const [teacherFilter, setTeacherFilter] = useState<'all' | string>('all')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/academy/admin/courses')
      if (res.ok) {
        const data = await res.json()
        setCourses(Array.isArray(data) ? data : data.data || [])
      } else {
        toast.error(a.failedToLoadCourses)
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      toast.error(a.serverConnectionFailed)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/academy/admin/categories')
      if (res.ok) {
        const json = await res.json()
        setCategories(json.data || [])
      }
    } catch {
      /* ignore */
    }
  }

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/academy/admin/teachers?assignable=1')
      if (res.ok) {
        const json = await res.json()
        setTeachers(json.data || [])
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    fetchCourses()
    fetchCategories()
    fetchTeachers()
  }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (course: Course) => {
    setEditItem(course)
    setForm({
      title: course.title || '',
      description: course.description || '',
      thumbnail_url: course.thumbnail_url || '',
      category_id: course.category_id || '',
      teacher_id: course.teacher_id || '',
      status: (course.status as CourseStatus) || 'draft',
      level: (course.level as Level) || 'beginner',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving || uploadingThumb) return
    setShowModal(false)
    setEditItem(null)
    setForm(emptyForm)
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(a.mustSelectImage)
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error(a.maxImageSize4MB)
      return
    }

    setUploadingThumb(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const errMsg = json.details ? `${json.error}: ${json.details}` : (json.error || a.failedToUploadImage)
        toast.error(errMsg)
        return
      }
      setForm(prev => ({ ...prev, thumbnail_url: json.url }))
      toast.success(a.imageUploaded)
    } catch (err) {
      console.error(err)
      toast.error(a.failedToUploadImage)
    } finally {
      setUploadingThumb(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error(a.courseNameRequired)
      return
    }
    if (!form.teacher_id) {
      toast.error(a.selectTeacher)
      return
    }

    setSaving(true)
    try {
      const url = editItem ? `/api/academy/admin/courses/${editItem.id}` : '/api/academy/admin/courses'
      const method = editItem ? 'PATCH' : 'POST'

      const payload: Record<string, any> = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        thumbnail_url: form.thumbnail_url.trim() || null,
        category_id: form.category_id || null,
        teacher_id: form.teacher_id || null,
        status: form.status,
        level: form.level,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || json.detail || a.saveError)
        return
      }
      toast.success(editItem ? a.courseUpdated : a.courseCreated)
      setShowModal(false)
      setEditItem(null)
      setForm(emptyForm)
      fetchCourses()
    } catch (err) {
      console.error(err)
      toast.error(a.saveError)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (course: Course) => {
    if (!confirm(a.confirmDeleteCourse.replace('{title}', course.title))) return
    setDeletingId(course.id)
    try {
      let res = await fetch(`/api/academy/admin/courses/${course.id}`, { method: 'DELETE' })
      if (res.status === 409) {
        const json = await res.json().catch(() => ({}))
        const enrolledCount = json?.enrolled_count
        const forceMsg = enrolledCount
          ? a.confirmForceDelete.replace('{count}', enrolledCount)
          : (json?.message || a.cannotDeleteCourse)
        if (!confirm(forceMsg)) return
        res = await fetch(`/api/academy/admin/courses/${course.id}?force=1`, { method: 'DELETE' })
      }
      if (res.ok) {
        toast.success(a.courseDeleted)
        setCourses(prev => prev.filter(c => c.id !== course.id))
      } else {
        const json = await res.json().catch(() => ({}))
        toast.error(json?.error || json?.message || a.failedToDeleteCourse)
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleArchive = async (course: Course) => {
    const willDeactivate = course.is_active !== false
    const msg = willDeactivate ? a.confirmDisableCourse : a.confirmEnableCourse
    if (!confirm(msg)) return
    setArchivingId(course.id)
    try {
      const res = await fetch(`/api/academy/teacher/courses/${course.id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !willDeactivate }),
      })
      if (res.ok) {
        toast.success(willDeactivate ? a.courseDisabled : a.courseEnabled)
        fetchCourses()
      } else {
        const json = await res.json().catch(() => ({}))
        toast.error(json?.error || a.saveError)
      }
    } finally {
      setArchivingId(null)
    }
  }

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase()
    return courses.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (levelFilter !== 'all' && c.level !== levelFilter) return false
      if (categoryFilter !== 'all' && c.category_id !== categoryFilter) return false
      if (teacherFilter !== 'all' && c.teacher_id !== teacherFilter) return false
      if (q) {
        const hay = `${c.title} ${c.description || ''} ${c.teacher_name || ''} ${c.category_name || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [courses, search, statusFilter, levelFilter, categoryFilter, teacherFilter])

  const stats = useMemo(() => {
    const total = courses.length
    const published = courses.filter(c => c.status === 'published').length
    const draft = courses.filter(c => c.status === 'draft').length
    const pending = courses.filter(c => c.status === 'pending_review').length
    const rejected = courses.filter(c => c.status === 'rejected').length
    const archived = courses.filter(c => c.is_active === false).length
    const students = courses.reduce((sum, c) => sum + (c.total_enrolled || 0), 0)
    return { total, published, draft, pending, rejected, archived, students }
  }, [courses])



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
            {a.coursesTitle}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {a.coursesDesc}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/academy/admin/courses/archive"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-border bg-card hover:bg-muted text-foreground font-bold rounded-xl transition-colors"
          >
            <Archive className="w-4 h-4" />
            {t.administration}
          </Link>
          <button
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            {a.newCourse}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={<BookOpen className="w-5 h-5 text-blue-500" />} value={stats.total} label={a.totalCourses} />
        <StatCard icon={<GraduationCap className="w-5 h-5 text-green-500" />} value={stats.published} label={a.courseStatus.published} />
        <StatCard icon={<Clock className="w-5 h-5 text-amber-500" />} value={stats.pending} label={a.courseStatus.pendingReview} />
        <StatCard icon={<FileText className="w-5 h-5 text-slate-500" />} value={stats.draft} label={a.drafts} />
        <StatCard icon={<Archive className="w-5 h-5 text-gray-500" />} value={stats.archived} label={a.courseStatus.archived} />
        <StatCard icon={<Users className="w-5 h-5 text-purple-500" />} value={stats.students} label={a.totalStudents} />
      </div>

      {isMounted && stats.pending > 0 && stats.pending !== dismissedPendingCount && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center justify-between gap-2 text-sm text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{a.pendingReviewCount.replace('{count}', String(stats.pending))}</span>
          </div>
          <button 
            onClick={() => {
              setDismissedPendingCount(stats.pending)
              localStorage.setItem('dismissedPendingCount', String(stats.pending))
            }}
            className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isMounted && stats.rejected > 0 && stats.rejected !== dismissedRejectedCount && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center justify-between gap-2 text-sm text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{a.rejectedCount.replace('{count}', String(stats.rejected))}</span>
          </div>
          <button 
            onClick={() => {
              setDismissedRejectedCount(stats.rejected)
              localStorage.setItem('dismissedRejectedCount', String(stats.rejected))
            }}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={a.searchCoursesPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            icon={<Filter className="w-4 h-4" />}
            value={statusFilter}
            onChange={v => setStatusFilter(v as any)}
            options={[
              { value: 'all', label: a.allStatuses },
              { value: 'published', label: a.courseStatus.published },
              { value: 'draft', label: a.courseStatus.draft },
              { value: 'pending_review', label: a.courseStatus.pendingReview },
              { value: 'rejected', label: a.courseStatus.rejected },
              { value: 'archived', label: a.courseStatus.archived },
            ]}
          />
          <FilterSelect
            value={levelFilter}
            onChange={v => setLevelFilter(v as any)}
            options={[
              { value: 'all', label: a.allLevels },
              { value: 'beginner', label: a.courseLevel.beginner },
              { value: 'intermediate', label: a.courseLevel.intermediate },
              { value: 'advanced', label: a.courseLevel.advanced },
            ]}
          />
          {categories.length > 0 && (
            <FilterSelect
              value={categoryFilter}
              onChange={v => setCategoryFilter(v)}
              options={[{ value: 'all', label: a.allCategories }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
            />
          )}
          {teachers.length > 0 && (
            <FilterSelect
              value={teacherFilter}
              onChange={v => setTeacherFilter(v)}
              options={[{ value: 'all', label: a.allTeachers }, ...teachers.map(t => ({ value: t.id, label: t.name }))]}
            />
          )}
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <CourseCardsGridSkeleton count={6} />
      ) : filteredCourses.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <BookOpen className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          {courses.length === 0 ? (
            <>
              <p className="text-muted-foreground font-medium mb-4">{a.noCoursesYet}</p>
              <button onClick={openAdd} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 inline ml-1" /> {a.addFirstCourse}
              </button>
            </>
          ) : (
            <p className="text-muted-foreground font-medium">{a.noResultsMatchFilters}</p>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={() => openEdit(course)}
              onArchive={() => handleToggleArchive(course)}
              onDelete={() => handleDelete(course)}
              archiving={archivingId === course.id}
              deleting={deletingId === course.id}
              a={a}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {editItem ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                {editItem ? a.courseStatus.pendingReview + ' ' + t.edit : a.newCourse}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                disabled={saving || uploadingThumb}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Thumbnail */}
              <div>
                <label className="text-sm font-bold block mb-2">{a.thumbnailImage}</label>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-full sm:w-44 aspect-video bg-muted rounded-xl border-2 border-dashed border-border overflow-hidden flex items-center justify-center relative shrink-0">
                    {form.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.thumbnail_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        disabled={uploadingThumb || saving}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <button
                        type="button"
                        disabled={uploadingThumb || saving}
                        className="px-4 py-2.5 bg-card border border-border hover:bg-muted font-bold rounded-lg flex items-center gap-2 shadow-sm transition-colors disabled:opacity-60"
                      >
                        {uploadingThumb ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        {form.thumbnail_url ? a.changeImage : a.uploadImage}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.imageFormatHint}</p>
                    {form.thumbnail_url && (
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, thumbnail_url: '' }))}
                        className="text-xs text-red-600 hover:underline"
                      >
                        {a.removeImage}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-bold block mb-1.5">
                  {a.courseTitle} <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder={a.courseTitlePlaceholder}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-bold block mb-1.5">{a.courseDescription}</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder={a.courseDescriptionPlaceholder}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Teacher */}
                <div>
                  <label className="text-sm font-bold mb-1.5 flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> {a.teacher} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.teacher_id}
                    onChange={e => setForm({ ...form, teacher_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{a.selectTeacher}</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-bold mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-4 h-4" /> {a.courseCategory}
                  </label>
                  <select
                    value={form.category_id}
                    onChange={e => setForm({ ...form, category_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{a.noCategory}</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Level */}
                <div>
                  <label className="text-sm font-bold block mb-1.5">{a.level}</label>
                  <select
                    value={form.level}
                    onChange={e => setForm({ ...form, level: e.target.value as Level })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="beginner">{a.courseLevel.beginner}</option>
                    <option value="intermediate">{a.courseLevel.intermediate}</option>
                    <option value="advanced">{a.courseLevel.advanced}</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-bold block mb-1.5">{a.status}</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as CourseStatus })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">{a.courseStatus.draft}</option>
                    <option value="pending_review">{a.courseStatus.pendingReview}</option>
                    <option value="published">{a.courseStatus.published}</option>
                    <option value="rejected">{a.courseStatus.rejected}</option>
                    <option value="archived">{a.courseStatus.archived}</option>
                  </select>
                </div>
              </div>

              {editItem && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>{a.manageLessonsHint}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving || uploadingThumb}
                  className="flex-1 py-2.5 border border-border rounded-lg font-bold hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingThumb}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editItem ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                  {editItem ? a.saveChanges : a.addCourse}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        {icon}
      </div>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function FilterSelect({
  icon,
  value,
  onChange,
  options,
}: {
  icon?: React.ReactNode
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          'appearance-none px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500',
          icon ? 'pr-8' : ''
        )}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function CourseCard({
  course,
  onEdit,
  onArchive,
  onDelete,
  archiving,
  deleting,
  a,
}: {
  course: Course
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
  archiving: boolean
  deleting: boolean
  a: any
}) {
  const STATUS_LABELS: Record<CourseStatus, string> = {
    published: a.courseStatus.published,
    draft: a.courseStatus.draft,
    pending_review: a.courseStatus.pendingReview,
    archived: a.courseStatus.archived,
    rejected: a.courseStatus.rejected,
  }

  const LEVEL_LABELS: Record<Level, string> = {
    beginner: a.courseLevel.beginner,
    intermediate: a.courseLevel.intermediate,
    advanced: a.courseLevel.advanced,
  }

  const STATUS_BADGE_CLS: Record<CourseStatus, string> = {
    published: 'bg-green-500/90 text-white border-green-400',
    pending_review: 'bg-amber-500/90 text-white border-amber-400',
    rejected: 'bg-red-500/90 text-white border-red-400',
    archived: 'bg-gray-700/80 text-white border-gray-500',
    draft: 'bg-slate-700/70 text-white border-slate-500',
  }

  const LEVEL_BADGE_CLS: Record<Level, string> = {
    beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    advanced: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  }

  const status = (course.status || 'draft') as CourseStatus
  const level = (course.level || 'beginner') as Level
  const isArchived = course.is_active === false

  return (
    <div className={cn(
      'bg-card border border-border rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col',
      isArchived && 'opacity-70'
    )}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-blue-700 to-blue-900 shrink-0">
        {course.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-blue-300/30" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded-full border shadow-sm backdrop-blur-md', STATUS_BADGE_CLS[status])}>
            {STATUS_LABELS[status]}
          </span>
          {isArchived && status !== 'archived' && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border shadow-sm backdrop-blur-md bg-gray-700/80 text-white border-gray-500">
              {a.courseStatus.archived}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', LEVEL_BADGE_CLS[level])}>
            {LEVEL_LABELS[level]}
          </span>
          {course.category_name && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
              {course.category_name}
            </span>
          )}
        </div>

        <h3 className="font-bold text-base mb-1 line-clamp-1">{course.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">
          {course.description || `— ${a.noDescription} —`}
        </p>

        <div className="text-xs text-muted-foreground space-y-1 mb-3">
          {course.teacher_name && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium text-foreground/80">{course.teacher_name}</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <PlayCircle className="w-3.5 h-3.5" /> {a.lessonCount.replace('{count}', String(course.total_lessons || 0))}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {a.enrolledCount.replace('{count}', String(course.total_enrolled || 0))}
            </span>
            {course.pending_requests > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                <Clock className="w-3.5 h-3.5" /> {course.pending_requests}
              </span>
            )}
          </div>
        </div>

        {status === 'rejected' && course.rejection_reason && (
          <div className="mb-3 -mt-1 bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/60 rounded-lg p-2 text-[11px] text-red-700 dark:text-red-300">
            <div className="font-bold mb-0.5 flex items-center gap-1"><XCircle className="w-3 h-3" /> {a.previousRejectionReason}</div>
            <p className="line-clamp-2">{course.rejection_reason}</p>
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-border flex items-center gap-1.5">
          {status === 'pending_review' ? (
            <Link
              href={`/academy/admin/courses/${course.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-xs font-bold transition-colors shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {a.review}
            </Link>
          ) : (
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 text-xs font-bold transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {a.edit}
            </button>
          )}
          <Link
            href={`/academy/admin/courses/${course.id}`}
            className="flex items-center justify-center gap-1 px-3 py-2 border border-border bg-card hover:bg-muted text-xs font-bold rounded-lg transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            {a.content}
          </Link>
          <button
            onClick={onArchive}
            disabled={archiving}
            className="shrink-0 flex items-center justify-center w-9 h-9 border border-border bg-card rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-muted-foreground hover:text-amber-600 transition-colors disabled:opacity-60"
            title={isArchived ? a.confirmEnableCourse : a.confirmDisableCourse}
          >
            {archiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="shrink-0 flex items-center justify-center w-9 h-9 border border-border bg-card rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-60"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
