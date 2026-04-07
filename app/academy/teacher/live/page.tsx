'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Video, Mic, MessageSquare, Users, Clock, LogOut } from 'lucide-react'

export default function TeacherLiveSessionPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/academy/teacher/live-session')
        if (res.ok) {
          const data = await res.json()
          setSession(data)
          setParticipants(data.participants || [])
        }
      } catch (error) {
        console.error('Failed to fetch session:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
    const interval = setInterval(fetchSession, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">البث المباشر</h1>
        <Card className="text-center py-12">
          <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 mb-4">لا توجد جلسة بث مباشر نشطة حالياً</p>
          <Button>
            <Video className="w-4 h-4 ml-2" />
            بدء جلسة جديدة
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{session.title}</h1>
        {isLive && <Badge variant="destructive" className="animate-pulse">مباشر</Badge>}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main video area */}
        <div className="lg:col-span-2">
          <Card className="bg-black aspect-video flex items-center justify-center">
            <div className="text-center">
              <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600">منطقة البث المباشر</p>
            </div>
          </Card>

          {/* Controls */}
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={() => setIsLive(!isLive)}
              variant={isLive ? "destructive" : "default"}
              className="flex-1"
            >
              {isLive ? 'إنهاء البث' : 'بدء البث'}
            </Button>
            <Button variant="outline" size="icon">
              <Mic className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon">
              <MessageSquare className="w-5 h-5" />
            </Button>
          </div>

          {/* Session info */}
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">عدد الحاضرين</p>
                  <p className="text-2xl font-bold">{participants.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">المدة</p>
                  <p className="text-2xl font-bold">{session.duration}دقيقة</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الحالة</p>
                  <Badge>{isLive ? 'نشطة' : 'مجدولة'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Participants list */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                الحاضرون
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <div key={participant.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                    <div>
                      <p className="font-sm">{participant.name}</p>
                      <p className="text-xs text-gray-500">
                        <Clock className="w-3 h-3 inline" />
                        {participant.join_time}
                      </p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">لم ينضم أحد بعد</p>
              )}
            </CardContent>
          </Card>

          {/* Chat area */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">الدردشة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-50 rounded p-2 text-sm text-gray-500 text-center flex items-center justify-center">
                منطقة الدردشة
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
