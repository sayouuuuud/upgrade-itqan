'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/auth'

interface Course {
  id: string
  title: string
  description: string
  category: string
  is_public: boolean
  created_at: string
}

export default function TeacherCoursesPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
  })

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

      if (data.role !== 'reader') {
        router.push('/unauthorized')
        return
      }

      setSession(data)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  // Fetch teacher's courses
  useEffect(() => {
    if (!session) return

    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/lms/courses', {
          credentials: 'include',
        })
        const data = await response.json()
        if (data.success) {
          setCourses(data.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch courses:', err)
      }
    }

    fetchCourses()
  }, [session])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/lms/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create course')
        return
      }

      setSuccess('تم إنشاء الدورة بنجاح!')
      setFormData({ title: '', description: '', category: 'General' })

      // Refresh courses list
      const coursesResponse = await fetch('/api/lms/courses', {
        credentials: 'include',
      })
      const coursesData = await coursesResponse.json()
      if (coursesData.success) {
        setCourses(coursesData.data || [])
      }

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('حدث خطأ ما. يرجى المحاولة مرة أخرى.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-muted-foreground">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">إدارة الدورات</h1>
          <p className="text-gray-600 dark:text-gray-400">قم بإنشاء وإدارة دوراتك التعليمية</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg border border-red-300 dark:border-red-700">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg border border-green-300 dark:border-green-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Course Form */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-6">إنشاء دورة جديدة</h2>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">عنوان الدورة</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="مثال: تعليم القرآن الكريم"
                    required
                    className="w-full px-3 py-2 border border-border rounded-md bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الوصف</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="اكتب وصفًا للدورة..."
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-md bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الفئة</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option>General</option>
                    <option>Quran</option>
                    <option>Tajweed</option>
                    <option>Islamic Studies</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
                >
                  {submitting ? 'جاري الإنشاء...' : 'إنشاء دورة'}
                </button>
              </form>
            </div>
          </div>

          {/* Courses List */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-6">دوراتك</h2>

            {courses.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">لم تقم بإنشاء أي دورات بعد</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{course.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{course.description}</p>
                      </div>
                      <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                        {course.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(course.created_at).toLocaleDateString('ar-EG')}
                      </span>
                      <span className={`text-xs font-medium ${course.is_public ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        {course.is_public ? 'عام' : 'خاص'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
