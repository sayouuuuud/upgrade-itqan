'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Calendar, Clock, ExternalLink, Mail, PlayCircle, User, Video } from 'lucide-react'

type SeriesSession = {
  id: string
  title: string
  scheduled_at: string
  public_join_token: string | null
  status: string
}

type PublicSession = {
  id: string
  title: string
  description: string | null
  scheduled_at: string
  duration_minutes: number
  meeting_link: string | null
  meeting_platform: string | null
  status: string
  teacher_name: string
  teacher_bio: string | null
  course_title: string
  course_description: string | null
  series_title: string | null
  series_sessions: SeriesSession[]
}

export default function PublicSessionPage({ params }: { params: { token: string } }) {
  const [session, setSession] = useState<PublicSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/academy/public/sessions/${params.token}`)
        if (res.ok) {
          const json = await res.json()
          setSession(json.data)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [params.token])

  const handleSubscribe = async (event: FormEvent) => {
    event.preventDefault()
    setSubscribing(true)
    try {
      const res = await fetch(`/api/academy/public/sessions/${params.token}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSubscribed(true)
        setEmail('')
      }
    } finally {
      setSubscribing(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen grid place-items-center" dir="rtl">جاري التحميل...</div>
  }

  if (!session) {
    return <div className="min-h-screen grid place-items-center" dir="rtl">الدرس غير موجود أو غير متاح للعامة</div>
  }

  const startDate = new Date(session.scheduled_at)
  const endDate = new Date(startDate.getTime() + session.duration_minutes * 60000)
  const now = new Date()
  const isLive = session.status === 'in_progress' || (startDate <= now && endDate >= now)
  const isEnded = session.status === 'completed' || endDate < now

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-10" dir="rtl">
      <div className="container max-w-5xl space-y-6">
        <Card className="overflow-hidden shadow-xl">
          <div className="bg-gradient-to-r from-emerald-700 to-blue-700 text-white p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm mb-4">
              <Video className="w-4 h-4" />
              درس عام مفتوح
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{session.title}</h1>
            <p className="mt-3 text-white/85">{session.course_title}</p>
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-lg bg-muted p-4 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <span>{startDate.toLocaleString('ar-EG')}</span>
              </div>
              <div className="rounded-lg bg-muted p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-700" />
                <span>{session.duration_minutes} دقيقة</span>
              </div>
              <div className="rounded-lg bg-muted p-4 flex items-center gap-3">
                <User className="w-5 h-5 text-purple-700" />
                <span>{session.teacher_name}</span>
              </div>
            </div>

            {session.description && <p className="text-lg leading-8 text-muted-foreground">{session.description}</p>}

            <div className="rounded-2xl border bg-card p-6 text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center">
                <PlayCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold">
                {isEnded ? 'انتهى الدرس' : isLive ? 'الدرس مباشر الآن' : 'رابط الدرس جاهز'}
              </h2>
              <p className="text-muted-foreground">
                لا تحتاج إلى تسجيل دخول. اضغط الرابط وادخل مباشرة.
              </p>
              {session.meeting_link ? (
                <Button size="lg" asChild className="gap-2">
                  <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-5 h-5" />
                    دخول الدرس
                  </a>
                </Button>
              ) : (
                <p className="text-sm text-amber-700">سيضيف الشيخ رابط الاجتماع قريباً.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {session.series_sessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {session.series_title || 'سلسلة الدروس'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {session.series_sessions.map((item, index) => (
                <Link
                  key={item.id}
                  href={item.public_join_token ? `/academy/public/session/${item.public_join_token}` : '#'}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
                >
                  <span>{index + 1}. {item.title}</span>
                  <span className="text-sm text-muted-foreground">{new Date(item.scheduled_at).toLocaleDateString('ar-EG')}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              اشترك في تذكيرات الشيخ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscribed ? (
              <p className="rounded-lg bg-green-50 text-green-800 p-4">
                تم الاشتراك. سيصلك تذكير قبل الدروس العامة القادمة.
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="البريد الإلكتروني"
                  className="flex h-11 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <Button type="submit" disabled={subscribing}>
                  {subscribing ? 'جاري الاشتراك...' : 'اشترك في القائمة البريدية'}
                </Button>
              </form>
            )}
            <div className="mt-6 rounded-lg border p-4">
              <h3 className="font-semibold mb-2">هل تريد متابعة المنصة كاملة؟</h3>
              <p className="text-muted-foreground mb-3">
                سجل حساباً لتتابع الحفظ والدورات والاختبارات والجلسات الخاصة.
              </p>
              <Button asChild variant="outline">
                <Link href="/auth/signup">التسجيل في المنصة</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
