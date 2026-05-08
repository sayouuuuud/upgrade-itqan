'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Clock, XCircle, BookOpen, UserCheck, Loader2 } from 'lucide-react'

interface InvitationInfo {
  email: string
  invited_name: string | null
  role_to_assign: string
  plan_title: string | null
  inviter_name: string | null
  expires_at: string
  status: string
}

const ROLE_LABELS: Record<string, string> = {
  academy_student: 'طالب في الأكاديمية',
  teacher: 'معلم',
  parent: 'ولي أمر',
  fiqh_supervisor: 'مشرف أسئلة الفقه',
  content_supervisor: 'مشرف المحتوى',
}

export default function InvitationPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>
}) {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState<string>('')
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid' | 'expired' | 'accepted' | 'accepting'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [enrolledPlan, setEnrolledPlan] = useState<{ id: string; title: string } | null>(null)

  useEffect(() => {
    params.then(({ inviteCode: code }) => {
      setInviteCode(code)
      fetchInvitation(code)
    })
  }, [])

  async function fetchInvitation(code: string) {
    try {
      const res = await fetch(`/api/academy/invitations/${code}`)
      if (!res.ok) {
        setStatus(res.status === 410 ? 'expired' : 'invalid')
        return
      }
      const data = await res.json()
      if (data.status === 'EXPIRED') { setStatus('expired'); return }
      if (data.status === 'ACCEPTED') { setStatus('accepted'); return }
      if (data.status === 'CANCELLED') { setStatus('invalid'); return }
      setInvitation(data)
      setStatus('ready')
    } catch {
      setStatus('invalid')
    }
  }

  async function handleAccept() {
    setStatus('accepting')
    try {
      const res = await fetch(`/api/academy/invitations/${inviteCode}/accept`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'حدث خطأ')
        setStatus('ready')
        return
      }
      if (data.enrolledPlanId) {
        setEnrolledPlan({ id: data.enrolledPlanId, title: data.planTitle || '' })
      }
      setStatus('accepted')
    } catch {
      setErrorMsg('حدث خطأ، يرجى المحاولة مجدداً')
      setStatus('ready')
    }
  }

  // ---- Loading ----
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // ---- Invalid ----
  if (status === 'invalid') {
    return (
      <Screen icon={<XCircle className="w-16 h-16 text-destructive" />}>
        <h1 className="text-2xl font-black text-foreground">رابط غير صالح</h1>
        <p className="text-muted-foreground text-sm mt-2">هذه الدعوة غير موجودة أو تم إلغاؤها.</p>
        <Button className="mt-6 rounded-2xl px-8" onClick={() => router.push('/')}>
          العودة للرئيسية
        </Button>
      </Screen>
    )
  }

  // ---- Expired ----
  if (status === 'expired') {
    return (
      <Screen icon={<Clock className="w-16 h-16 text-amber-500" />}>
        <h1 className="text-2xl font-black text-foreground">انتهت صلاحية الدعوة</h1>
        <p className="text-muted-foreground text-sm mt-2">
          انتهت صلاحية هذه الدعوة. تواصل مع الأدمن للحصول على دعوة جديدة.
        </p>
        <Button className="mt-6 rounded-2xl px-8" variant="outline" onClick={() => router.push('/')}>
          العودة
        </Button>
      </Screen>
    )
  }

  // ---- Accepted ----
  if (status === 'accepted') {
    return (
      <Screen icon={<CheckCircle className="w-16 h-16 text-emerald-500" />}>
        <h1 className="text-2xl font-black text-foreground">تم قبول الدعوة!</h1>
        {enrolledPlan ? (
          <p className="text-muted-foreground text-sm mt-2">
            تم تسجيلك في الخطة التعليمية <strong className="text-foreground">{enrolledPlan.title}</strong>
          </p>
        ) : (
          <p className="text-muted-foreground text-sm mt-2">مرحباً بك في منصة إتقان التعليمية.</p>
        )}
        <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
          {enrolledPlan && (
            <Button
              className="rounded-2xl"
              onClick={() => router.push(`/academy/student/courses/${enrolledPlan.id}`)}
            >
              <BookOpen className="w-4 h-4 me-2" />
              انتقل إلى الخطة التعليمية
            </Button>
          )}
          <Button
            variant={enrolledPlan ? 'outline' : 'default'}
            className="rounded-2xl"
            onClick={() => router.push('/academy/student')}
          >
            لوحة الطالب
          </Button>
        </div>
      </Screen>
    )
  }

  // ---- Ready — show invitation card ----
  const inv = invitation!
  const isExpired = inv.expires_at && new Date(inv.expires_at) < new Date()

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 rounded-3xl overflow-hidden">
        {/* Header band */}
        <div className="bg-[#0B3D2E] px-8 py-7 text-center">
          <p className="text-emerald-200 text-sm font-medium mb-1">إتقان التعليمية</p>
          <h1 className="text-white text-2xl font-black">دعوة للانضمام</h1>
        </div>

        <CardContent className="px-8 py-7 space-y-5">
          {/* Invitee greeting */}
          {inv.invited_name && (
            <p className="text-center text-foreground font-bold text-lg">
              أهلاً {inv.invited_name}
            </p>
          )}

          {/* Inviter */}
          <div className="flex items-center gap-3 bg-muted/50 rounded-2xl px-4 py-3">
            <UserCheck className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">دعوة من</p>
              <p className="font-bold text-foreground text-sm">{inv.inviter_name || 'الأدمن'}</p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center gap-3 bg-muted/50 rounded-2xl px-4 py-3">
            <UserCheck className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">الدور</p>
              <p className="font-bold text-foreground text-sm">
                {ROLE_LABELS[inv.role_to_assign] || inv.role_to_assign}
              </p>
            </div>
          </div>

          {/* Plan */}
          {inv.plan_title && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3">
              <BookOpen className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">الخطة التعليمية المرفقة</p>
                <p className="font-bold text-foreground text-sm">{inv.plan_title}</p>
              </div>
            </div>
          )}

          {/* Expiry */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {isExpired
              ? <span className="text-destructive font-semibold">انتهت صلاحية الدعوة</span>
              : <span>
                  صالحة حتى{' '}
                  {new Date(inv.expires_at).toLocaleDateString('ar-EG', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
            }
          </div>

          {errorMsg && (
            <p className="text-center text-sm text-destructive font-medium">{errorMsg}</p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              className="w-full h-12 rounded-2xl text-base font-bold"
              disabled={status === 'accepting' || !!isExpired}
              onClick={handleAccept}
            >
              {status === 'accepting'
                ? <><Loader2 className="w-4 h-4 me-2 animate-spin" />جاري القبول...</>
                : 'قبول الدعوة'}
            </Button>
            <Button
              variant="ghost"
              className="w-full rounded-2xl text-muted-foreground"
              onClick={() => router.push('/')}
            >
              رفض
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---- Layout helper ----
function Screen({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="text-center flex flex-col items-center max-w-sm">
        {icon}
        {children}
      </div>
    </div>
  )
}
