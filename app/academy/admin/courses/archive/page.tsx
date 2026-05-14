"use client"

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import {
  Archive, Search, BookOpen, RotateCcw, Users, Loader2,
} from 'lucide-react'

interface ArchivedCourse {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  status: string
  is_active: boolean
  archived_at: string | null
  specialization: string | null
  category_name: string
  teacher_name: string
  archived_by_name: string
  total_lessons: number
  total_enrolled: number
  completed_enrolled: number
}

export default function AdminCoursesArchivePage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [courses, setCourses] = useState<ArchivedCourse[]>([])
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    const id = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(id)
  }, [search])

  const fetchArchive = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (searchDebounced) params.set('search', searchDebounced)
    fetch(`/api/academy/admin/courses/archive?${params}`)
      .then(r => (r.ok ? r.json() : { data: [] }))
      .then(d => setCourses(d.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchArchive()
  }, [searchDebounced])

  const handleRestore = async (id: string) => {
    if (!confirm(isAr ? 'إعادة تفعيل الدورة؟ هتظهر للطلاب الجدد تاني.' : 'Reactivate this course? It will become visible to new students.')) return
    setRestoring(id)
    try {
      const res = await fetch(`/api/academy/teacher/courses/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      })
      if (res.ok) {
        fetchArchive()
      } else {
        alert(isAr ? 'حدث خطأ' : 'Failed to reactivate')
      }
    } finally {
      setRestoring(null)
    }
  }

  const titleText = t.academy?.archiveTitle || (isAr ? 'أرشيف الدورات' : 'Courses Archive')
  const descText = t.academy?.archiveAdminDesc || (isAr ? 'الدورات المعطّلة — يمكن إعادة تفعيلها' : 'Deactivated courses — can be reactivated')
  const searchPlaceholder = t.academy?.archiveSearchPlaceholder || (isAr ? 'ابحث بالعنوان أو الوصف...' : 'Search by title or description...')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Archive className="w-7 h-7 text-blue-600" />
          {titleText}
        </h1>
        <p className="text-muted-foreground mt-1">{descText}</p>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Archive className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-semibold mb-2">{isAr ? 'لا توجد دورات مؤرشفة' : 'No archived courses'}</h3>
          <p className="text-muted-foreground">{isAr ? 'الدورات اللي يتم تعطيلها هتظهر هنا' : 'Deactivated courses will appear here'}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-right p-4 text-sm font-bold text-muted-foreground">{isAr ? 'الدورة' : 'Course'}</th>
                  <th className="text-right p-4 text-sm font-bold text-muted-foreground">{isAr ? 'المدرس' : 'Teacher'}</th>
                  <th className="text-right p-4 text-sm font-bold text-muted-foreground">{isAr ? 'المسجلين' : 'Enrolled'}</th>
                  <th className="text-right p-4 text-sm font-bold text-muted-foreground">{isAr ? 'المؤرشف بواسطة' : 'Archived by'}</th>
                  <th className="text-right p-4 text-sm font-bold text-muted-foreground">{isAr ? 'تاريخ الأرشفة' : 'Archived at'}</th>
                  <th className="text-right p-4 text-sm font-bold text-muted-foreground">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="font-bold flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        {course.title}
                      </p>
                      {course.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{course.description}</p>
                      )}
                      {course.category_name && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                          {course.category_name}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm">{course.teacher_name || '—'}</td>
                    <td className="p-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        {course.total_enrolled}
                        {course.completed_enrolled > 0 && (
                          <span className="text-xs text-emerald-600 mr-1">
                            ({course.completed_enrolled} {isAr ? 'مكتمل' : 'completed'})
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{course.archived_by_name || '—'}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {course.archived_at
                        ? new Date(course.archived_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')
                        : '—'}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleRestore(course.id)}
                        disabled={restoring === course.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                      >
                        {restoring === course.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <RotateCcw className="w-3.5 h-3.5" />}
                        {isAr ? 'إعادة تفعيل' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
