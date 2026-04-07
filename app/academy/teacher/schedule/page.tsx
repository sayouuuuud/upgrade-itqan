'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Users, Plus, Edit2 } from 'lucide-react'

export default function TeacherSchedulePage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch('/api/academy/teacher/sessions')
        if (res.ok) {
          const data = await res.json()
          setSessions(data)
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [])

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  const upcomingSessions = sessions.filter(s => new Date(s.scheduled_at) > new Date())
  const pastSessions = sessions.filter(s => new Date(s.scheduled_at) <= new Date())

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">الجدول</h1>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          جلسة جديدة
        </Button>
      </div>

      {upcomingSessions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">الجلسات القادمة</h2>
          <div className="space-y-3">
            {upcomingSessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold">{session.title}</h3>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(session.scheduled_at).toLocaleDateString('ar-EG')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(session.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {session.enrolled_count || 0} طالب
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">تعديل</Button>
                      <Button size="sm">ابدأ الآن</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pastSessions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">الجلسات السابقة</h2>
          <div className="space-y-2">
            {pastSessions.slice(0, 5).map((session) => (
              <Card key={session.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{session.title}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(session.scheduled_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">عرض التفاصيل</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <Card className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 mb-4">لا توجد جلسات مجدولة</p>
          <Button>
            <Plus className="w-4 h-4 ml-2" />
            جدول جلسة جديدة
          </Button>
        </Card>
      )}
    </div>
  )
}
