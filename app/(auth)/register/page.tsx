"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, ChevronDown } from 'lucide-react'

export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState('')
  const [role, setRole] = useState('student')
  const [platform, setPlatform] = useState('both')
  const router = useRouter()
  const { t } = useI18n()

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            router.push(`/${data.user.role}`)
          }
        }
      } catch (err) {
        // ignore
      }
    }
    checkAuth()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 6) {
      setError(t.auth.passwordMinLength)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, gender: gender || undefined, platform_choice: role === 'parent' ? 'academy' : platform, register_role: role }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t.auth.errorOccurred)
        if (data.requiresVerification) {
          setError((prev) => (
            <div className="flex flex-col items-center gap-2">
              <span>{prev}</span>
              <button
                type="button"
                onClick={() => router.push(`/verify?email=${encodeURIComponent(email)}`)}
                className="text-[#0B3D2E] font-bold underline hover:no-underline"
              >
                {t.locale === 'ar' ? 'تفعيل الآن' : 'Verify Now'}
              </button>
            </div>
          ) as any)
        }
        setLoading(false)
        return
      }

      if (data.requiresVerification) {
        // A-2: Pass the chosen platform through the verify step so the
        // post-verification redirect lands on the correct dashboard.
        const effectivePlatform = role === 'parent' ? 'academy' : platform
        router.push(
          `/verify?email=${encodeURIComponent(email)}&platform=${effectivePlatform}&role=${role}`
        )
      } else {
        // A-2: Route correctly based on what was actually saved server-side.
        // Parents are forced to `academy` regardless of the local `platform`
        // state, and `data.user.role` is the source of truth for routing.
        const savedRole = data.user?.role || role
        const effectivePlatform = savedRole === 'parent' ? 'academy' : platform

        if (savedRole === 'parent') {
          router.push('/academy/parent')
        } else if (effectivePlatform === 'academy') {
          router.push('/academy/student')
        } else {
          // 'both' or 'quran' → land on the Qur'an side; the Mode Switcher
          // in the dashboard handles moving to /academy/student for 'both'.
          router.push('/student')
        }
      }
    } catch {
      setError(t.auth.connectionError)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-[#0B3D2E]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at top left, #145A3E 0%, #0B3D2E 40%, #072A1F 100%)' }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 max-w-7xl mx-auto w-full">
        <Link href="/" className="text-3xl font-bold tracking-tighter text-[#D4A843] hover:opacity-80 transition-opacity">{t.appName}</Link>
        <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2">
          <span>{t.auth.alreadyHaveAccount}</span>
          <span className="text-[#D4A843] font-bold">{t.login}</span>
        </Link>
      </nav>

      {/* Form */}
      <main className="relative z-10 w-full max-w-lg px-4 py-12">
        <div className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t.auth.registerTitle}</h1>
            <p className="text-muted-foreground">{t.auth.joinCommunityDesc}</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullname" className="block text-sm font-medium text-foreground/80 mb-1">{t.auth.fullName}</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input id="fullname" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.auth.enterFullName} className="w-full pr-10 pl-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" required />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-1">{t.auth.email}</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" className="w-full pr-10 pl-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" required />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground/80 mb-1">{t.auth.password}</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input id="password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.auth.passwordPlaceholder} dir="ltr" className="w-full pr-10 pl-10 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" required minLength={6} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="toggle password">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-foreground/80 mb-1">{t.auth.gender}</label>
              <div className="relative">
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className="w-full pr-4 pl-10 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground appearance-none" required>
                  <option value="" className="bg-card">{t.auth.selectGender}</option>
                  <option value="male" className="bg-card">{t.auth.male}</option>
                  <option value="female" className="bg-card">{t.auth.female}</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-foreground/80 mb-1">نوع الحساب</label>
              <div className="relative">
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full pr-4 pl-10 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground appearance-none" required>
                  <option value="student" className="bg-card">طالب</option>
                  <option value="parent" className="bg-card">ولي أمر</option>
                </select>
              </div>
            </div>

            {role !== 'parent' && (
              <div>
                <label htmlFor="platform" className="block text-sm font-medium text-foreground/80 mb-1">المنصة المراد التسجيل بها</label>
                <div className="relative">
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                  <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full pr-4 pl-10 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground appearance-none" required>
                    <option value="both" className="bg-card">الاثنان معاً (المقرأة والأكاديمية)</option>
                    <option value="quran" className="bg-card">المقرأة (تسميع القرآن فقط)</option>
                    <option value="academy" className="bg-card">الأكاديمية (الدورات التعليمية فقط)</option>
                  </select>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t.auth.creatingAccount}
                </span>
              ) : (
                <>
                  <span>{t.auth.createAccount}</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link to Reader/Teacher Registration */}
          <div className="mt-6 text-center border-t border-gray-100 pt-6 space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {t.locale === 'ar' ? 'هل أنت مقرئ وترغب بالانضمام إلينا؟' : 'Are you a reciter and want to join us?'}
              </p>
              <Link href="/reader-register" className="inline-flex items-center justify-center text-sm font-bold text-[#0B3D2E] hover:text-[#0B3D2E]/80 transition-colors">
                {t.locale === 'ar' ? 'سجل كمقرئ من هنا' : 'Register as a Reciter here'}
              </Link>
            </div>

            <div className="pt-2 border-t border-gray-50">
              <p className="text-sm text-gray-600 mb-2">
                {t.locale === 'ar' ? 'هل أنت معلم وترغب بالانضمام إلينا؟' : 'Are you a teacher and want to join us?'}
              </p>
              <Link href="/teacher-register" className="inline-flex items-center justify-center text-sm font-bold text-[#D4A843] hover:text-[#D4A843]/80 transition-colors">
                {t.locale === 'ar' ? 'سجل كمعلم من هنا' : 'Register as a Teacher here'}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="absolute bottom-4 text-center w-full z-10 flex flex-col items-center gap-2">
        <img src="/branding/main-logo.png" alt="Itqan" className="h-10 w-auto opacity-30 grayscale brightness-200" />
        <p className="text-xs text-white/20">
          {'2026 '}{t.appName}{'. '}{t.footer.rights}
        </p>
      </footer>
    </div>
  )
}
