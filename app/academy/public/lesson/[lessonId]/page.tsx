'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, Clock } from 'lucide-react'

export default function PublicLessonPage({ params }: { params: { lessonId: string } }) {
  const [lesson, setLesson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await fetch(`/api/academy/public/lessons/${params.lessonId}`)
        if (res.ok) {
          const data = await res.json()
          setLesson(data)
        }
      } catch (error) {
        console.error('Failed to fetch lesson:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLesson()
  }, [params.lessonId])

  const handleSubscribe = async () => {
    setSubscribing(true)
    try {
      const res = await fetch(`/api/academy/public/lessons/${params.lessonId}/subscribe`, {
        method: 'POST'
      })
      if (res.ok) {
        // Redirect to login or show success message
        window.location.href = '/academy/student'
      }
    } catch (error) {
      console.error('Failed to subscribe:', error)
    } finally {
      setSubscribing(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">جاري التحميل...</div>
  }

  if (!lesson) {
    return <div className="text-center py-12">الدرس غير موجود</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{lesson.name}</CardTitle>
            <p className="text-gray-600 mt-2">{lesson.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Lesson preview */}
            <div className="bg-gray-100 aspect-video rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">معاينة الدرس</p>
              </div>
            </div>

            {/* Lesson details */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-600">المدة</p>
                <p className="font-semibold">{lesson.duration_minutes || 30} دقيقة</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Users className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-gray-600">المسجلين</p>
                <p className="font-semibold">{lesson.subscribers_count || 0}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <BookOpen className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-gray-600">المستوى</p>
                <p className="font-semibold">{lesson.level || 'beginner'}</p>
              </div>
            </div>

            {/* Full description */}
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">{lesson.full_description}</p>
            </div>

            {/* Subscribe button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="w-full h-12 text-lg"
              >
                {subscribing ? 'جاري التسجيل...' : 'اشترك الآن'}
              </Button>
              <p className="text-xs text-gray-600 text-center mt-3">
                يمكنك اختيار الاشتراك بعد تسجيل الدخول أو إنشاء حساب جديد
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Teacher info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">مدرس الدرس</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600" />
            <div>
              <p className="font-semibold">{lesson.teacher_name}</p>
              <p className="text-sm text-gray-600">{lesson.teacher_bio}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
