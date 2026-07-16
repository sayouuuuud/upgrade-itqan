'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Clock, XCircle, BookOpen, UserCheck, Loader2, Mail, Lock, User, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface InvitationInfo {
  email: string
  invited_name: string | null
  role_to_assign: string
  plan_title: string | null
  inviter_name: string | null
  expires_at: string
  status: string
}

export default function InvitationPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>
}) {
  const router = useRouter()
  const { inviteCode } = use(params)
  const { t } = useI18n()
  const inv = (t as any).invite as Record<string, string> | undefined

  function getRoleLabel(role: string) {
    const map: Record<string, string> = {
      academy_student: inv?.roleAcademyStudent ?? 'Academy Student',
      student: inv?.roleStudent ?? 'Student',
      teacher: inv?.roleTeacher ?? 'Teacher',
      parent: inv?.roleParent ?? 'Parent',
      fiqh_supervisor: inv?.roleFiqh ?? 'Fiqh Supervisor',
      content_supervisor: inv?.roleContent ?? 'Content Supervisor',
    }
    return map[role] ?? role
  }
  
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready-new' | 'ready-logged' | 'invalid' | 'expired' | 'accepted'>('loading')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [enrolledPlan, setEnrolledPlan] = useState<{ id: string; title: string } | null>(null)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState('')
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [invRes, sessionRes] = await Promise.all([
          fetch(`/api/academy/invitations/${inviteCode}`),
          fetch('/api/auth/session')
        ])

        if (!invRes.ok) {
          setStatus(invRes.status === 410 ? 'expired' : 'invalid')
          return
        }

        const invData = await invRes.json()
        if (invData.status === 'EXPIRED') { setStatus('expired'); return }
        if (invData.status === 'ACCEPTED') { setStatus('accepted'); return }
        if (invData.status === 'CANCELLED') { setStatus('invalid'); return }

        setInvitation(invData)
        if (invData.invited_name) setName(invData.invited_name)

        let loggedInEmail = null
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json()
          if (sessionData && sessionData.user) {
            loggedInEmail = sessionData.user.email
          }
        }

        if (loggedInEmail) {
          setSessionEmail(loggedInEmail)
          setStatus('ready-logged')
        } else {
          setStatus('ready-new')
        }
      } catch (err) {
        setStatus('invalid')
      }
    }
    loadData()
  }, [inviteCode])

  async function handleAcceptLoggedIn() {
    setSubmitting(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/academy/invitations/${inviteCode}/accept`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'حدث خطأ')
        return
      }
      if (data.enrolledPlanId) {
        setEnrolledPlan({ id: data.enrolledPlanId, title: data.planTitle || '' })
      }
      setStatus('accepted')
    } catch {
      setErrorMsg(inv?.genericError ?? 'An error occurred, please try again')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegisterAndAccept(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !password || password.length < 6) {
      setErrorMsg(inv?.namePasswordRequired ?? 'Name and password (min 6 characters) are required')
      return
    }

    setSubmitting(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/academy/invitations/${inviteCode}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password, gender: gender || undefined })
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || (inv?.registerError ?? 'An error occurred during registration'))
        return
      }
      if (data.enrolledPlanId) {
        setEnrolledPlan({ id: data.enrolledPlanId, title: data.planTitle || '' })
      }
      setStatus('accepted')
    } catch {
      setErrorMsg(inv?.genericError ?? 'An error occurred, please try again')
    } finally {
      setSubmitting(false)
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

  // ---- Invalid / Expired ----
  if (status === 'invalid') {
    return (
      <Screen icon={<XCircle className="w-16 h-16 text-destructive" />}>
        <h1 className="text-2xl font-black text-foreground">{inv?.invalidLink ?? 'Invalid Link'}</h1>
        <p className="text-muted-foreground text-sm mt-2">{inv?.invalidDesc ?? 'This invitation does not exist or has been cancelled.'}</p>
        <Button className="mt-6 rounded-2xl px-8" onClick={() => router.push('/')}>{inv?.backHome ?? 'Back to Home'}</Button>
      </Screen>
    )
  }
  if (status === 'expired') {
    return (
      <Screen icon={<Clock className="w-16 h-16 text-amber-500" />}>
        <h1 className="text-2xl font-black text-foreground">{inv?.expiredTitle ?? 'Invitation Expired'}</h1>
        <p className="text-muted-foreground text-sm mt-2">{inv?.expiredDesc ?? 'This invitation has expired. Contact the admin for a new one.'}</p>
        <Button className="mt-6 rounded-2xl px-8" variant="outline" onClick={() => router.push('/')}>{inv?.back ?? 'Back'}</Button>
      </Screen>
    )
  }

  // ---- Accepted ----
  if (status === 'accepted') {
    return (
      <Screen icon={<CheckCircle className="w-16 h-16 text-emerald-500" />}>
        <h1 className="text-2xl font-black text-foreground">{inv?.successTitle ?? 'Done!'}</h1>
        {enrolledPlan ? (
          <p className="text-muted-foreground text-sm mt-2">
            {inv?.enrolledIn ?? 'You have been enrolled in'} <strong className="text-foreground">{enrolledPlan.title}</strong>
          </p>
        ) : (
          <p className="text-muted-foreground text-sm mt-2">{inv?.welcomePlatform ?? 'Welcome to Itqan Education Platform.'}</p>
        )}
        <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
          {enrolledPlan && (
            <Button className="rounded-2xl h-12 text-base font-bold" onClick={() => router.push(`/academy/student/courses/${enrolledPlan.id}`)}>
              <BookOpen className="w-4 h-4 me-2" />
              {inv?.startPlan ?? 'Start Learning Plan'}
            </Button>
          )}
          <Button variant={enrolledPlan ? 'outline' : 'default'} className="rounded-2xl h-12" onClick={() => router.push('/academy/student')}>
            {inv?.goToDashboard ?? 'Go to Dashboard'}
          </Button>
        </div>
      </Screen>
    )
  }

  const invite = invitation!
  const isExpired = invite.expires_at && new Date(invite.expires_at) < new Date()

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 py-12" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl border-0 rounded-[2rem] overflow-hidden">
        {/* Header band */}
        <div className="bg-gradient-to-br from-[#0B3D2E] to-[#1A6B50] px-8 py-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <p className="text-emerald-100/80 text-sm font-medium mb-2 relative z-10">{inv?.platformName ?? 'Itqan Education Platform'}</p>
          <h1 className="text-white text-3xl font-black relative z-10">{inv?.inviteTitle ?? 'Join Invitation'}</h1>
        </div>

        <CardContent className="px-6 py-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-foreground">{inv?.welcome ?? 'Welcome!'}</h2>
            <p className="text-sm text-muted-foreground">
              {inv?.invitedBy ?? 'You received an invitation from'} <strong>{invite.inviter_name || (inv?.admin ?? 'Admin')}</strong> {inv?.toJoinAs ?? 'to join as'} <strong>{getRoleLabel(invite.role_to_assign)}</strong>.
            </p>
          </div>

          {invite.plan_title && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3">
              <BookOpen className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{inv?.attachedPlan ?? 'Attached Educational Plan'}</p>
                <p className="font-bold text-foreground text-sm">{invite.plan_title}</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm text-center font-medium">
              {errorMsg}
            </div>
          )}

          {/* Registration Form for New Users */}
          {status === 'ready-new' && (
            <form onSubmit={handleRegisterAndAccept} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">{inv?.email ?? 'Email'}</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <Input 
                    type="email" 
                    value={invite.email} 
                    disabled 
                    dir="ltr"
                    className="pr-10 h-12 rounded-2xl bg-muted/50 border-border/50 text-muted-foreground" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">{inv?.fullName ?? 'Full Name'} <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder={inv?.namePlaceholder ?? 'Enter your full name'}
                    className="pr-10 h-12 rounded-2xl focus:ring-2 focus:ring-primary/20" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">{inv?.password ?? 'Password'} <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type={showPw ? 'text' : 'password'} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder={inv?.passwordPlaceholder ?? 'At least 6 characters'}
                    dir="ltr"
                    className="pr-10 pl-10 h-12 rounded-2xl focus:ring-2 focus:ring-primary/20" 
                    required 
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="toggle password">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">{inv?.gender ?? 'Gender (optional)'}</Label>
                <div className="relative">
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <select 
                    value={gender} 
                    onChange={e => setGender(e.target.value)} 
                    className="w-full h-12 pr-4 pl-10 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 transition-colors text-sm text-foreground appearance-none"
                  >
                    <option value="">{inv?.genderSelect ?? 'Select gender...'}</option>
                    <option value="male">{inv?.male ?? 'Male'}</option>
                    <option value="female">{inv?.female ?? 'Female'}</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all mt-2"
                disabled={submitting || !!isExpired}
              >
                {submitting
                  ? <><Loader2 className="w-5 h-5 me-2 animate-spin" />{inv?.creatingAccount ?? 'Creating account...'}</>
                  : (inv?.registerAndAccept ?? 'Create Account & Accept')}
              </Button>
            </form>
          )}

          {/* Action for Logged In Users */}
          {status === 'ready-logged' && (
            <div className="space-y-4 pt-2">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-2xl text-sm font-medium flex items-start gap-2">
                <UserCheck className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
                <p>
                  {inv?.loggedInNotice ?? 'You are currently signed in as'} ({sessionEmail}).{' '}
                  {inv?.acceptWillAdd ?? 'Accepting will add the permissions of this invitation to your current account.'}
                </p>
              </div>
              <Button
                className="w-full h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                disabled={submitting || !!isExpired}
                onClick={handleAcceptLoggedIn}
              >
                {submitting
                  ? <><Loader2 className="w-5 h-5 me-2 animate-spin" />{inv?.accepting ?? 'Accepting...'}</>
                  : (inv?.continueAndAccept ?? 'Continue & Accept')}
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}

// ---- Layout helper ----
function Screen({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4" dir="rtl">
      <div className="text-center flex flex-col items-center max-w-sm">
        {icon}
        {children}
      </div>
    </div>
  )
}
