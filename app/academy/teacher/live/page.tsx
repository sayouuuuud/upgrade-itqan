'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Video, Mic, MicOff, MessageSquare, Users, Clock, Calendar, Loader2, Play, Square, BookOpen } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LiveSession {
  id: string
  title: string
  course: string
  course_id: string
  scheduled_at: string
  meeting_url?: string
  duration: number
  status: 'scheduled' | 'live' | 'completed'
  participants: {
    id: string
    name: string
    join_time: string
  }[]
}

interface Course {
  id: string
  title: string
}

export default function TeacherLiveSessionPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  
  const [session, setSession] = useState<LiveSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [showNewSession, setShowNewSession] = useState(false)
  const [newSessionData, setNewSessionData] = useState({
    course_id: '',
    title: '',
    duration_minutes: 60
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active session
        const sessionRes = await fetch('/api/academy/teacher/live-session')
        if (sessionRes.ok) {
          const data = await sessionRes.json()
          setSession(data)
          if (data?.status === 'live') {
            setIsLive(true)
          }
        }

        // Fetch courses for creating new session
        const coursesRes = await fetch('/api/academy/teacher/courses')
        if (coursesRes.ok) {
          const data = await coursesRes.json()
          setCourses(data.courses || [])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleStartSession = async () => {
    if (!session) return
    
    try {
      const res = await fetch('/api/academy/teacher/live-session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.id, action: 'start' })
      })
      
      if (res.ok) {
        setIsLive(true)
        setSession(prev => prev ? { ...prev, status: 'live' } : null)
      }
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  const handleEndSession = async () => {
    if (!session) return
    
    try {
      const res = await fetch('/api/academy/teacher/live-session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.id, action: 'end' })
      })
      
      if (res.ok) {
        setIsLive(false)
        setSession(null)
      }
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }

  const handleCreateSession = async () => {
    if (!newSessionData.course_id) return
    
    setCreating(true)
    try {
      const res = await fetch('/api/academy/teacher/live-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSessionData)
      })
      
      if (res.ok) {
        const data = await res.json()
        // Refresh to get the new session
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isAr ? 'البث المباشر' : 'Live Session'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAr ? 'ابدأ جلسة بث مباشر مع طلابك' : 'Start a live session with your students'}
            </p>
          </div>
        </div>

        {!showNewSession ? (
          <Card className="text-center py-12 border-dashed">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Video className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {isAr ? 'لا توجد جلسة نشطة' : 'No Active Session'}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {isAr ? 'يمكنك بدء جلسة بث مباشر جديدة الآن' : 'You can start a new live session now'}
                </p>
              </div>
              <Button onClick={() => setShowNewSession(true)} className="mt-4">
                <Video className={`w-4 h-4 ${isAr ? 'ml-2' : 'mr-2'}`} />
                {isAr ? 'بدء جلسة جديدة' : 'Start New Session'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                {isAr ? 'جلسة بث جديدة' : 'New Live Session'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{isAr ? 'الدورة' : 'Course'}</Label>
                <Select
                  value={newSessionData.course_id}
                  onValueChange={(value) => setNewSessionData(prev => ({ ...prev, course_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isAr ? 'اختر الدورة' : 'Select course'} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{isAr ? 'عنوان الجلسة (اختياري)' : 'Session Title (optional)'}</Label>
                <Input
                  value={newSessionData.title}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={isAr ? 'جلسة حية' : 'Live Session'}
                />
              </div>

              <div className="space-y-2">
                <Label>{isAr ? 'المدة (بالدقائق)' : 'Duration (minutes)'}</Label>
                <Input
                  type="number"
                  value={newSessionData.duration_minutes}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                  min={15}
                  max={180}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateSession}
                  disabled={!newSessionData.course_id || creating}
                  className="flex-1"
                >
                  {creating ? (
                    <Loader2 className={`w-4 h-4 animate-spin ${isAr ? 'ml-2' : 'mr-2'}`} />
                  ) : (
                    <Play className={`w-4 h-4 ${isAr ? 'ml-2' : 'mr-2'}`} />
                  )}
                  {isAr ? 'بدء البث الآن' : 'Start Streaming'}
                </Button>
                <Button variant="outline" onClick={() => setShowNewSession(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{session.title}</h1>
            {isLive && (
              <Badge variant="destructive" className="animate-pulse">
                {isAr ? 'مباشر' : 'LIVE'}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {session.course}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main video area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-900 aspect-video flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
            <div className="text-center relative z-10">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Video className="w-10 h-10 text-white/60" />
              </div>
              <p className="text-white/60 text-sm">
                {isLive 
                  ? (isAr ? 'البث جارٍ...' : 'Streaming...') 
                  : (isAr ? 'اضغط لبدء البث' : 'Click to start streaming')}
              </p>
            </div>
            
            {isLive && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-sm font-medium">REC</span>
              </div>
            )}
          </Card>

          {/* Controls */}
          <div className="flex gap-2">
            <Button 
              onClick={isLive ? handleEndSession : handleStartSession}
              variant={isLive ? "destructive" : "default"}
              className="flex-1"
            >
              {isLive ? (
                <>
                  <Square className={`w-4 h-4 ${isAr ? 'ml-2' : 'mr-2'}`} />
                  {isAr ? 'إنهاء البث' : 'End Stream'}
                </>
              ) : (
                <>
                  <Play className={`w-4 h-4 ${isAr ? 'ml-2' : 'mr-2'}`} />
                  {isAr ? 'بدء البث' : 'Start Stream'}
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className={isMuted ? 'bg-red-500/10 border-red-500/30 text-red-500' : ''}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            <Button variant="outline" size="icon">
              <MessageSquare className="w-5 h-5" />
            </Button>
          </div>

          {/* Session info */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">{isAr ? 'الحاضرون' : 'Attendees'}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{session.participants.length}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">{isAr ? 'المدة' : 'Duration'}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{session.duration}</p>
                  <span className="text-xs text-muted-foreground">{isAr ? 'دقيقة' : 'min'}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">{isAr ? 'الحالة' : 'Status'}</span>
                  </div>
                  <Badge variant={isLive ? 'default' : 'secondary'} className="mt-1">
                    {isLive ? (isAr ? 'نشطة' : 'Active') : (isAr ? 'مجدولة' : 'Scheduled')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Participants list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {isAr ? 'الحاضرون' : 'Participants'}
                </span>
                <Badge variant="secondary">{session.participants.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
              {session.participants.length > 0 ? (
                session.participants.map((participant) => (
                  <div key={participant.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {participant.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{participant.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {participant.join_time}
                        </p>
                      </div>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isAr ? 'لم ينضم أحد بعد' : 'No one joined yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat area */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {isAr ? 'الدردشة' : 'Chat'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground text-center flex items-center justify-center border border-dashed">
                <p>{isAr ? 'منطقة الدردشة' : 'Chat area'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
