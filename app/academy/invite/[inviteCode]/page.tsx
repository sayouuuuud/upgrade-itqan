'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Clock, XCircle, BookOpen, UserCheck, Loader2, Eye, EyeOff, Mail, Lock, User, ChevronDown } from 'lucide-react'

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
  const [enrolledPlan, setEnrolledPlan] = useState<{ id: string; title: string; redirect: string } | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // Form fields
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState('')
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    params.then(({ inviteCode: code }) => {
      setInviteCode(code)
      checkAuthAndFetch(code)
    })
  }, [])

  async function checkAuthAndFetch(code: string) {
    try {
      const authRes = await fetch('/api/auth/me')
      if (authRes.ok) {
        setIsLoggedIn(true)
      }
    } catch {}
    fetchInvitation(code)
  }

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
      if (data.invited_name) setName(data.invited_name)
      setStatus('ready')
    } catch {
      setStatus('invalid')
    }
  }

  async function handleAccept(e?: React.FormEvent) {
    if (e) e.preventDefault()
    
    if (!isLoggedIn) {
      if (!name || !password || !gender) {
        setErrorMsg('يرجى تعبئة جميع الحقول')
        return
      }
      if (password.length < 6) {
        setErrorMsg('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
        return
      }
    }

    setStatus('accepting')
    setErrorMsg('')
    
    try {
      const endpoint = isLoggedIn 
        ? `/api/academy/invitations/${inviteCode}/accept` 
        : `/api/academy/invitations/${inviteCode}/register`
        
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: isLoggedIn ? undefined : { 'Content-Type': 'application/json' },
        body: isLoggedIn ? undefined : JSON.stringify({ name, password, gender })
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'حدث خطأ')
        setStatus('ready')
        return
      }
      if (data.enrolledPlanId || data.redirect) {
        setEnrolledPlan({ 
          id: data.enrolledPlanId || '', 
          title: data.planTitle || '',
          redirect: data.redirect || '/academy/student'
        })
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
          <Button
            className="rounded-2xl"
            onClick={() => router.push(enrolledPlan?.redirect || '/academy/student')}
          >
            {enrolledPlan?.id ? (
              <><BookOpen className="w-4 h-4 me-2" /> انتقل إلى الخطة التعليمية</>
            ) : (
              'دخول المنصة'
            )}
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
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold p-3 rounded-2xl text-center">
              {errorMsg}
            </div>
          )}

          {/* Form / Actions */}
          <div className="pt-2">
            {isLoggedIn ? (
              <div className="flex flex-col gap-3">
                <Button
                  className="w-full h-12 rounded-2xl text-base font-bold"
                  disabled={status === 'accepting' || !!isExpired}
                  onClick={() => handleAccept()}
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
            ) : (
              <form onSubmit={handleAccept} className="space-y-4 text-start">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input disabled value={inv.email} dir="ltr" className="rounded-xl pr-9 bg-muted text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">الاسم الكامل</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input 
                      required 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      placeholder="الاسم الثلاثي" 
                      className="rounded-xl pr-9" 
                      disabled={status === 'accepting' || !!isExpired}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input 
                      required 
                      type={showPw ? 'text' : 'password'}
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder="6 أحرف على الأقل" 
                      dir="ltr"
                      minLength={6}
                      className="rounded-xl pr-9 pl-9" 
                      disabled={status === 'accepting' || !!isExpired}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">الجنس</Label>
                  <div className="relative">
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                    <select 
                      required
                      value={gender} 
                      onChange={e => setGender(e.target.value)} 
                      className="w-full h-10 pr-3 pl-9 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={status === 'accepting' || !!isExpired}
                    >
                      <option value="">اختر الجنس</option>
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-2xl text-base font-bold mt-2"
                  disabled={status === 'accepting' || !!isExpired}
                >
                  {status === 'accepting'
                    ? <><Loader2 className="w-4 h-4 me-2 animate-spin" />جاري إنشاء الحساب...</>
                    : 'تسجيل الدخول وقبول الدعوة'}
                </Button>
              </form>
            )}
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
