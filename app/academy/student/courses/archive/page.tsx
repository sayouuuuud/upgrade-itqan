"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import {
  Archive, Search, BookOpen, GraduationCap, CheckCircle2, ChevronLeft, Loader2,
  Route, Layers, Trophy, AlertCircle, RotateCcw,
} from 'lucide-react'

interface ArchivedCourse {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  level: string
  category_name: string
  teacher_name: string
  progress_percent: number
  completed_at: string | null
  enrolled_at: string
  total_lessons: number
  is_active: boolean
}

interface ArchivedPath {
  path_id: string
  path_title: string
  description: string | null
  thumbnail_url: string | null
  subject: string | null
  level: string | null
  completed_courses: number
  total_courses: number
  progress_percent: number
  started_at: string | null
}

type TabKey = 'all' | 'courses' | 'paths'

export default function StudentCoursesArchivePage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const [courses, setCourses] = useState<ArchivedCourse[]>([])
  const [paths, setPaths] = useState<ArchivedPath[]>([])
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('all')

  useEffect(() => {
    const id = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(id)
  }, [search])

  const load = () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (searchDebounced) params.set('search', searchDebounced)
    Promise.all([
      fetch(`/api/academy/student/courses/archive?${params}`).then(async (r) => {
        if (!r.ok) {
          const b = await r.json().catch(() => ({}))
          throw new Error(b.error || `فشل تحميل الدورات (${r.status})`)
        }
        return r.json()
      }),
      fetch(`/api/academy/student/paths/enrolled`).then((r) => (r.ok ? r.json() : { data: [] })),
    ])
      .then(([coursesRes, pathsRes]) => {
        setCourses(coursesRes.data || [])
        // Only completed paths belong in the archive.
        setPaths((pathsRes.data || []).filter((p: ArchivedPath) => (p.progress_percent ?? 0) >= 100))
      })
      .catch((e) => {
        setCourses([])
        setPaths([])
        setError(e?.message || 'تعذّر تحميل الأرشيف')
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [searchDebounced])

  // Client-side search for paths (courses are filtered server-side).
  const filteredPaths = useMemo(() => {
    if (!searchDebounced) return paths
    const q = searchDebounced.toLowerCase()
    return paths.filter(
      (p) =>
        p.path_title?.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q),
    )
  }, [paths, searchDebounced])

  const totalCount = courses.length + filteredPaths.length
  const showCourses = tab === 'all' || tab === 'courses'
  const showPaths = tab === 'all' || tab === 'paths'
  const visibleCount = (showCourses ? courses.length : 0) + (showPaths ? filteredPaths.length : 0)

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all', label: isAr ? 'الكل' : 'All', count: totalCount },
    { key: 'courses', label: isAr ? 'الدورات' : 'Courses', count: courses.length },
    { key: 'paths', label: isAr ? 'المسارات' : 'Paths', count: filteredPaths.length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-l from-indigo-600 via-indigo-500 to-sky-500 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-7 h-7" />
          {isAr ? 'أرشيف إنجازاتي' : 'My Achievements Archive'}
        </h1>
        <p className="text-white/85 mt-1.5 text-sm leading-relaxed">
          {isAr
            ? 'كل ما أكملته من دورات ومسارات في مكان واحد — افتح أي عنصر لمراجعته في أي وقت'
            : 'Everything you have completed — courses and paths — open any item to review anytime'}
        </p>
        <div className="flex items-center gap-6 flex-wrap mt-5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-200" />
            <span className="font-bold text-lg">{courses.length}</span>
            <span className="text-white/70 text-sm">{isAr ? 'دورة مكتملة' : 'courses'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-violet-200" />
            <span className="font-bold text-lg">{filteredPaths.length}</span>
            <span className="text-white/70 text-sm">{isAr ? 'مسار مكتمل' : 'paths'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-200" />
            <span className="font-bold text-lg">{totalCount}</span>
            <span className="text-white/70 text-sm">{isAr ? 'إجمالي الإنجازات' : 'total'}</span>
          </div>
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl w-fit">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2',
                tab === tb.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tb.label}
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                tab === tb.key ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' : 'bg-muted text-muted-foreground',
              )}>
                {tb.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={isAr ? 'ابحث بالعنوان أو الوصف...' : 'Search by title or description...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-red-200 dark:border-red-900/40">
          <AlertCircle className="w-14 h-14 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-bold mb-2 text-red-600">{isAr ? 'تعذّر تحميل الأرشيف' : 'Failed to load archive'}</h3>
          <p className="text-muted-foreground text-sm mb-5 max-w-sm mx-auto">{error}</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
        </div>
      ) : visibleCount === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Archive className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-semibold mb-2">{isAr ? 'الأرشيف فاضي' : 'Archive is empty'}</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            {isAr
              ? 'بمجرد ما تكمّل دورة أو مسار، هتلاقيه هنا للمراجعة في أي وقت'
              : 'Once you complete a course or path it will appear here for review'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showCourses && courses.map((course) => (
            <Link
              key={`c-${course.id}`}
              href={`/academy/student/courses/${course.id}`}
              className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-sky-500/50 hover:shadow-lg transition-all"
            >
              <div className="h-36 bg-gradient-to-br from-sky-500 to-indigo-600 relative overflow-hidden">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url || "/placeholder.svg"} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white/80" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-sky-500 text-white text-[11px] font-bold px-2 py-1 rounded-full">
                  <BookOpen className="w-3 h-3" /> {isAr ? 'دورة' : 'Course'}
                </span>
                <div className="absolute top-3 left-3 bg-emerald-500 text-white p-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="absolute bottom-3 right-3 left-3">
                  <h3 className="font-bold text-white text-lg line-clamp-2">{course.title}</h3>
                </div>
              </div>
              <div className="p-4">
                {course.category_name && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-sky-500/10 text-sky-600 dark:text-sky-400 mb-2">
                    {course.category_name}
                  </span>
                )}
                {course.teacher_name && (
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> {course.teacher_name}
                  </p>
                )}
                {course.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {isAr ? 'مكتملة' : 'Completed'}{course.completed_at && ` · ${fmtDate(course.completed_at)}`}
                  </span>
                  <ChevronLeft className={cn('w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-sky-600', !isAr && 'rotate-180')} />
                </div>
              </div>
            </Link>
          ))}

          {showPaths && filteredPaths.map((path) => (
            <Link
              key={`p-${path.path_id}`}
              href={`/academy/student/path/${path.path_id}`}
              className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-violet-500/50 hover:shadow-lg transition-all"
            >
              <div className="h-36 bg-gradient-to-br from-violet-500 to-fuchsia-600 relative overflow-hidden">
                {path.thumbnail_url ? (
                  <img src={path.thumbnail_url || "/placeholder.svg"} alt={path.path_title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Route className="w-12 h-12 text-white/80" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-violet-500 text-white text-[11px] font-bold px-2 py-1 rounded-full">
                  <Route className="w-3 h-3" /> {isAr ? 'مسار' : 'Path'}
                </span>
                <div className="absolute top-3 left-3 bg-emerald-500 text-white p-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="absolute bottom-3 right-3 left-3">
                  <h3 className="font-bold text-white text-lg line-clamp-2">{path.path_title}</h3>
                </div>
              </div>
              <div className="p-4">
                {path.subject && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 mb-2">
                    {path.subject}
                  </span>
                )}
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  {path.total_courses} {isAr ? 'دورة في المسار' : 'courses in path'}
                </p>
                {path.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{path.description}</p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">{isAr ? 'مسار مكتمل' : 'Path completed'}</span>
                  <ChevronLeft className={cn('w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-violet-600', !isAr && 'rotate-180')} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
