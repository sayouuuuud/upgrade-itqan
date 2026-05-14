'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { X, User as UserIcon, Heart, ExternalLink, BookOpen, Calendar, Loader2, CheckCircle2 } from 'lucide-react'

interface Teacher {
  id: string
  name: string | null
  bio: string | null
  avatar_url: string | null
}

interface OtherLesson {
  id: string
  slug: string
  title: string
  cover_image_url: string | null
  scheduled_at: string
  status: string
}

interface Course {
  id: string
  title: string
  slug: string | null
  thumbnail_url: string | null
}

interface WelcomeData {
  teacher: Teacher
  from_lesson: { title: string; slug: string }
  other_lessons: OtherLesson[]
  courses: Course[]
  is_following: boolean
}

export function WelcomeTeacherPopup() {
  const [data, setData] = useState<WelcomeData | null>(null)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/me/welcome', { credentials: 'include' })
      .then(async r => {
        if (!r.ok) return null
        return r.json()
      })
      .then(d => {
        if (!cancelled && d?.data) {
          setData(d.data)
          setFollowing(d.data.is_following)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const dismiss = useCallback(() => {
    setClosing(true)
    fetch('/api/me/welcome/dismiss', { method: 'POST', credentials: 'include' })
      .catch(() => {})
      .finally(() => {
        setData(null)
      })
  }, [])

  const toggleFollow = useCallback(async () => {
    if (!data) return
    setFollowLoading(true)
    try {
      const method = following ? 'DELETE' : 'POST'
      const res = await fetch(`/api/academy/teachers/${data.teacher.id}/follow`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: method === 'POST' ? JSON.stringify({ source: 'welcome_popup' }) : undefined,
      })
      if (res.ok) {
        const json = await res.json()
        setFollowing(!!json.following)
      }
    } finally {
      setFollowLoading(false)
    }
  }, [data, following])

  if (!data || closing) return null

  const teacherInitial = (data.teacher.name || '؟').slice(0, 1)

  return (
    <div
      role="dialog"
      aria-modal="true"
      dir="rtl"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={dismiss}
          aria-label="إغلاق"
          className="absolute top-3 left-3 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header banner */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-600 px-8 py-7 text-white text-center">
          <p className="text-sm opacity-90 mb-1">أهلاً بيك في منصة إتقان 🌟</p>
          <h2 className="text-xl font-bold">شكراً لحضورك درس &quot;{data.from_lesson.title}&quot;</h2>
        </div>

        {/* Teacher card */}
        <div className="px-6 sm:px-8 py-6 -mt-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-5 flex items-start gap-4">
            <div className="flex-shrink-0">
              {data.teacher.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.teacher.avatar_url}
                  alt={data.teacher.name || ''}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-100 dark:ring-emerald-900"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 text-white flex items-center justify-center text-2xl font-bold ring-4 ring-emerald-100 dark:ring-emerald-900">
                  {teacherInitial}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <UserIcon className="w-3.5 h-3.5" />
                الشيخ المُدرّس
              </div>
              <h3 className="text-xl font-bold leading-tight">
                {data.teacher.name || 'مدرس'}
              </h3>
              {data.teacher.bio ? (
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-3">
                  {data.teacher.bio}
                </p>
              ) : (
                <p className="text-sm text-slate-500 mt-2">
                  من مدرسي منصة إتقان.
                </p>
              )}
            </div>
          </div>

          {/* Follow CTA */}
          <button
            onClick={toggleFollow}
            disabled={followLoading}
            className={`mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 ${
              following
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {followLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : following ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                بتتابع الشيخ ✓ (هتوصلك إشعارات بالدروس الجديدة)
              </>
            ) : (
              <>
                <Heart className="w-5 h-5" />
                تابع الشيخ {data.teacher.name || ''} لمتابعة دروسه القادمة
              </>
            )}
          </button>

          {/* Other lessons */}
          {data.other_lessons.length > 0 && (
            <section className="mt-6">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                دروس عامة تانية للشيخ
              </h4>
              <div className="space-y-2">
                {data.other_lessons.slice(0, 4).map(lesson => (
                  <Link
                    key={lesson.id}
                    href={`/lessons/${lesson.slug}`}
                    target="_blank"
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {lesson.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={lesson.cover_image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{lesson.title}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(lesson.scheduled_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Courses */}
          {data.courses.length > 0 && (
            <section className="mt-6">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                دورات الشيخ على المنصة
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.courses.slice(0, 4).map(course => (
                  <Link
                    key={course.id}
                    href={course.slug ? `/academy/student/courses/${course.slug}` : `/academy/student/courses`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {course.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{course.title}</div>
                      <div className="text-xs text-slate-500">دورة كاملة</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data.other_lessons.length === 0 && data.courses.length === 0 && (
            <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-300 text-center">
              لسه ماعندوش محتوى تاني على المنصة، بس لما يحطّ هتوصلك إشعارات لو تابعته.
            </div>
          )}

          <button
            onClick={dismiss}
            className="mt-6 w-full px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-colors"
          >
            ادخل المنصة
          </button>
        </div>
      </div>
    </div>
  )
}
