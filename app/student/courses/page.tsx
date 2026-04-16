'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Course {
  id: string
  title: string
  description: string
  category: string
  is_public: boolean
  teacher_name: string
  created_at: string
}

interface EnrolledCourse {
  course_id: string
  course_title: string
  teacher_name: string
  progress: number
  enrolled_at: string
}

type Tab = 'enrolled' | 'browse'

export default function StudentCoursesPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<Tab>('enrolled')
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const data = await fetch('/api/auth/me', {
        credentials: 'include',
      }).then(r => r.json())

      if (!data.id) {
        router.push('/login')
        return
      }

      if (data.role !== 'student') {
        router.push('/unauthorized')
        return
      }

      setSession(data)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  // Fetch enrolled and available courses
  useEffect(() => {
    if (!session) return

    const fetchCourses = async () => {
      try {
        const enrolledResponse = await fetch('/api/lms/courses?status=enrolled', {
          credentials: 'include',
        })
        const enrolledData = await enrolledResponse.json()
        if (enrolledData.success) {
          setEnrolledCourses(enrolledData.data || [])
        }

        const availableResponse = await fetch('/api/lms/courses?public=true', {
          credentials: 'include',
        })
        const availableData = await availableResponse.json()
        if (availableData.success) {
          setAvailableCourses(availableData.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch courses:', err)
      }
    }

    fetchCourses()
  }, [session])

  const handleEnrollCourse = async (courseId: string) => {
    setEnrolling(courseId)
    setError('')

    try {
      const response = await fetch(`/api/lms/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'فشل الالتحاق بالدورة')
        return
      }

      // Refresh courses
      const enrolledResponse = await fetch('/api/lms/courses?status=enrolled', {
        credentials: 'include',
      })
      const enrolledData = await enrolledResponse.json()
      if (enrolledData.success) {
        setEnrolledCourses(enrolledData.data || [])
      }

      setActiveTab('enrolled')
      setTimeout(() => setError(''), 3000)
    } catch (err) {
      setError('حدث خطأ ما. يرجى المحاولة مرة أخرى.')
    } finally {
      setEnrolling(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div>جاري التحميل...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">الدورات التعليمية</h1>
          <p className="text-gray-600 dark:text-gray-400">استكشف والتحق بالدورات المتاحة</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg border border-red-300 dark:border-red-700">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8 flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`px-4 py-2 font-medium transition border-b-2 ${activeTab === 'enrolled'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            مقرراتي ({enrolledCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 font-medium transition border-b-2 ${activeTab === 'browse'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            استكشاف الدروس ({availableCourses.length})
          </button>
        </div>

        {/* My Courses Tab */}
        {activeTab === 'enrolled' && (
          <div>
            {enrolledCourses.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">لم تلتحق بأي دورات بعد</p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-2 px-6 rounded-md transition"
                >
                  استكشف الدورات المتاحة
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {enrolledCourses.map((course) => (
                  <div
                    key={course.course_id}
                    className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{course.course_title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">المدرس: {course.teacher_name}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">التقدم</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(course.enrolled_at).toLocaleDateString('ar-EG')}
                      </span>
                      <button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-1 px-4 rounded-md transition">
                        متابعة
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Browse Courses Tab */}
        {activeTab === 'browse' && (
          <div>
            {availableCourses.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">لا توجد دورات متاحة حاليًا</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition flex flex-col"
                  >
                    <div className="p-6 flex flex-col flex-1">
                      <div className="mb-4">
                        <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-medium">
                          {course.category}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">{course.description}</p>

                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        المدرس: <span className="font-medium">{course.teacher_name}</span>
                      </div>

                      <button
                        onClick={() => handleEnrollCourse(course.id)}
                        disabled={enrolling === course.id}
                        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
                      >
                        {enrolling === course.id ? 'جاري الالتحاق...' : 'الالتحاق بالدورة'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
