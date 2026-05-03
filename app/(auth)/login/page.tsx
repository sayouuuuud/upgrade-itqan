"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const { t } = useI18n()

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            router.push(getRedirectPath(data.user))
          }
        }
      } catch (err) {
        // ignore
      }
    }
    checkAuth()
  }, [router])

  // #2: Honor the user's chosen platform (academy / quran / both) when redirecting.
  function getRedirectPath(u: {
    role: string
    has_academy_access?: boolean
    has_quran_access?: boolean
  }): string {
    const role = u.role
    // Admin / supervisor roles always go to their own panels
    if (role === 'admin' || role === 'academy_admin' || role === 'student_supervisor' || role === 'reciter_supervisor') {
      return `/${role === 'admin' ? 'admin' : role === 'academy_admin' ? 'academy/admin' : role}`
    }
    if (role === 'reader') return '/reader'
    if (role === 'teacher') return '/academy/teacher'
    if (role === 'parent') return '/academy/parent'

    // Student: route based on platform access flags.
    const hasAcademy = u.has_academy_access !== false
    const hasQuran = u.has_quran_access !== false
    if (hasAcademy && !hasQuran) return '/academy/student'
    if (!hasAcademy && hasQuran) return '/student'
    // Both available → default to academy (the primary platform); user can switch via ModeSwitcher.
    return '/academy/student'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        // In dev, the API returns a `debug` field with the underlying exception
        // so we can immediately see why login is failing without digging into logs.
        const message = data.debug ? `${data.error || t.auth.errorOccurred}: ${data.debug}` : (data.error || t.auth.errorOccurred)
        setError(message)
        setLoading(false)
        return
      }

      // #2: Redirect based on role and platform flags returned from the API.
      router.push(getRedirectPath(data.user || { role: 'student' }))
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
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <img src="/branding/main-logo.png" alt="Logo" className="h-16 w-auto object-contain" />
        </Link>
        <Link href="/register" className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2">
          <span>{t.auth.noAccount}</span>
          <span className="text-[#D4A843] font-bold">{t.register}</span>
        </Link>
      </nav>

      {/* Form */}
      <main className="relative z-10 w-full max-w-lg px-4 py-12">
        <div className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t.login}</h1>
            <p className="text-muted-foreground">{t.auth.enterCredentials}</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-1">{t.auth.email}</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" className="w-full pr-10 pl-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" required />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-foreground/80">{t.auth.password}</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">{t.auth.forgotPassword}</Link>
              </div>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input id="password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="........" dir="ltr" className="w-full pr-10 pl-10 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="toggle password">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t.auth.signingIn}
                </span>
              ) : (
                <>
                  <span>{t.login}</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
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
