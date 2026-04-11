"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { 
  Route, BookOpen, CheckCircle2, Lock, PlayCircle,
  ChevronDown, Star, Clock, Users, Trophy
} from 'lucide-react'

interface LearningPath {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  estimated_weeks: number
  courses_count: number
  enrolled_count?: number
}

interface PathProgress {
  path_id: string
  path_title: string
  current_course_id?: string
  completed_courses: number
  total_courses: number
  progress_percent: number
  started_at: string
}

interface PathCourse {
  id: string
  course_id: string
  course_title: string
  course_description?: string
  order_index: number
  is_required: boolean
  is_completed: boolean
  is_current: boolean
  is_locked: boolean
  progress_percent: number
}

export default function StudentLearningPathPage() {
  const { t } = useI18n()
  const [myPaths, setMyPaths] = useState<PathProgress[]>([])
  const [availablePaths, setAvailablePaths] = useState<LearningPath[]>([])
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [pathCourses, setPathCourses] = useState<PathCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [myPathsRes, availableRes] = await Promise.all([
          fetch('/api/academy/student/paths/enrolled'),
          fetch('/api/academy/student/paths/available')
        ])

        if (myPathsRes.ok) {
          const data = await myPathsRes.json()
          setMyPaths(data.data || [])
          if (data.data?.length > 0) {
            setSelectedPath(data.data[0].path_id)
          }
        }
        if (availableRes.ok) {
          const data = await availableRes.json()
          setAvailablePaths(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch paths:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedPath) {
      fetchPathCourses(selectedPath)
    }
  }, [selectedPath])

  async function fetchPathCourses(pathId: string) {
    try {
      const res = await fetch(`/api/academy/student/paths/${pathId}/courses`)
      if (res.ok) {
        const data = await res.json()
        setPathCourses(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch path courses:', error)
    }
  }

  const levelLabels = {
    beginner: t.academy?.beginner || 'مبتدئ',
    intermediate: t.academy?.intermediate || 'متوسط',
    advanced: t.academy?.advanced || 'متقدم'
  }

  const levelColors = {
    beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const currentPathProgress = myPaths.find(p => p.path_id === selectedPath)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t.academy?.learningPath || 'المسار التعليمي'}</h1>
        <p className="text-muted-foreground mt-1">
          {t.academy?.pathDesc || 'اتبع المسار المنظم لتحقيق أهدافك التعليمية'}
        </p>
      </div>

      {myPaths.length > 0 ? (
        <>
          {/* Path Selector */}
          {myPaths.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {myPaths.map((path) => (
                <button
                  key={path.path_id}
                  onClick={() => setSelectedPath(path.path_id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    selectedPath === path.path_id
                      ? "bg-blue-600 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {path.path_title}
                </button>
              ))}
            </div>
          )}

          {/* Current Path Progress */}
          {currentPathProgress && (
            <div className="bg-gradient-to-l from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-blue-200 text-sm">{t.academy?.currentPath || 'المسار الحالي'}</p>
                  <h2 className="text-2xl font-bold">{currentPathProgress.path_title}</h2>
                </div>
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <Route className="w-8 h-8" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{currentPathProgress.completed_courses}</p>
                  <p className="text-blue-200 text-sm">{t.academy?.completed || 'مكتمل'}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{currentPathProgress.total_courses - currentPathProgress.completed_courses}</p>
                  <p className="text-blue-200 text-sm">{t.academy?.remaining || 'متبقي'}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{currentPathProgress.progress_percent}%</p>
                  <p className="text-blue-200 text-sm">{t.academy?.progress || 'التقدم'}</p>
                </div>
              </div>

              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${currentPathProgress.progress_percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Path Courses Timeline */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-bold mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              {t.academy?.pathCourses || 'دورات المسار'}
            </h2>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-6">
                {pathCourses.map((course, index) => (
                  <div key={course.id} className="relative flex gap-4">
                    {/* Timeline Node */}
                    <div className={cn(
                      "relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-background",
                      course.is_completed && "bg-green-500 text-white",
                      course.is_current && "bg-blue-500 text-white ring-4 ring-blue-500/30",
                      course.is_locked && "bg-muted text-muted-foreground",
                      !course.is_completed && !course.is_current && !course.is_locked && "bg-yellow-500 text-white"
                    )}>
                      {course.is_completed ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : course.is_locked ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        <span className="font-bold">{index + 1}</span>
                      )}
                    </div>

                    {/* Course Card */}
                    <div className={cn(
                      "flex-1 rounded-xl border p-4 transition-all",
                      course.is_current && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                      course.is_completed && "border-green-500/50 bg-green-50 dark:bg-green-900/10",
                      course.is_locked && "border-border bg-muted/30 opacity-60",
                      !course.is_completed && !course.is_current && !course.is_locked && "border-border hover:border-blue-500/50"
                    )}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold">{course.course_title}</h3>
                            {course.is_required && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {t.academy?.required || 'إلزامي'}
                              </span>
                            )}
                            {course.is_current && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-600 text-white">
                                {t.academy?.current || 'الحالي'}
                              </span>
                            )}
                          </div>
                          {course.course_description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {course.course_description}
                            </p>
                          )}

                          {/* Progress Bar */}
                          {(course.is_current || course.is_completed) && (
                            <div className="mt-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">{t.academy?.progress || 'التقدم'}</span>
                                <span className="font-medium">{course.progress_percent}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    course.is_completed ? "bg-green-500" : "bg-blue-500"
                                  )}
                                  style={{ width: `${course.progress_percent}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        {!course.is_locked && (
                          <Link
                            href={`/academy/student/courses/${course.course_id}`}
                            className={cn(
                              "shrink-0 p-2 rounded-lg transition-colors",
                              course.is_current 
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            <PlayCircle className="w-5 h-5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* No Enrolled Paths - Show Available */
        <div className="space-y-6">
          <div className="text-center py-8 bg-card rounded-xl border border-border">
            <Route className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {t.academy?.noPathYet || 'لم تبدأ أي مسار بعد'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t.academy?.choosePath || 'اختر مساراً تعليمياً لتبدأ رحلتك'}
            </p>
          </div>

          {/* Available Paths */}
          {availablePaths.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4">{t.academy?.availablePaths || 'المسارات المتاحة'}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availablePaths.map((path) => (
                  <div
                    key={path.id}
                    className="bg-card rounded-xl border border-border overflow-hidden hover:border-blue-500/50 hover:shadow-lg transition-all group"
                  >
                    {/* Thumbnail */}
                    <div className="h-32 bg-gradient-to-br from-blue-500 to-blue-600 relative">
                      {path.thumbnail_url ? (
                        <img src={path.thumbnail_url} alt={path.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Route className="w-12 h-12 text-white/80" />
                        </div>
                      )}
                      <span className={cn(
                        "absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium",
                        levelColors[path.level]
                      )}>
                        {levelLabels[path.level]}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">{path.title}</h3>
                      {path.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {path.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {path.courses_count} {t.academy?.courses || 'دورات'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {path.estimated_weeks} {t.academy?.weeks || 'أسابيع'}
                        </span>
                      </div>

                      <button 
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/academy/student/paths/${path.id}/enroll`, {
                              method: 'POST'
                            })
                            if (res.ok) {
                              window.location.reload()
                            }
                          } catch (error) {
                            console.error('Failed to enroll:', error)
                          }
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {t.academy?.startPath || 'ابدأ المسار'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
