"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { Eye, EyeOff, Mail, Lock, ArrowLeft, AlertTriangle, Shield, BookOpen, Star } from 'lucide-react'

// Islamic geometric pattern SVG component
function IslamicPattern({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <pattern id="islamicPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M10 0L20 10L10 20L0 10Z" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.3"/>
        <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.2"/>
        <path d="M5 5L15 5L15 15L5 15Z" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.15" transform="rotate(45 10 10)"/>
      </pattern>
      <rect width="100" height="100" fill="url(#islamicPattern)"/>
    </svg>
  )
}

// Floating decorative elements
function FloatingElements() {
  return (
    <>
      {/* Animated circles */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-2xl animate-float-slow" />
      <div className="absolute bottom-32 left-10 w-40 h-40 bg-gradient-to-tr from-emerald-500/15 to-teal-500/10 rounded-full blur-3xl animate-float-medium" />
      <div className="absolute top-1/3 left-1/4 w-24 h-24 bg-primary/10 rounded-full blur-xl animate-float-fast" />
      
      {/* Geometric shapes */}
      <div className="absolute top-40 left-20 w-16 h-16 border-2 border-primary/20 rotate-45 animate-spin-slow" />
      <div className="absolute bottom-40 right-20 w-12 h-12 border border-emerald-500/30 rounded-full animate-pulse-slow" />
      <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-primary/10 rotate-12 animate-bounce-slow" />
      
      {/* Star decorations */}
      <Star className="absolute top-32 right-1/4 w-6 h-6 text-primary/20 animate-twinkle" />
      <Star className="absolute bottom-48 left-1/3 w-4 h-4 text-emerald-500/30 animate-twinkle-delay" />
      <Star className="absolute top-2/3 right-16 w-5 h-5 text-primary/15 animate-twinkle-delay-2" />
    </>
  )
}

export default function AdminLoginPage() {
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notAdminError, setNotAdminError] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { t } = useI18n()
  const authChecked = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (authChecked.current) return
    authChecked.current = true

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          const allowedRoles = ['admin', 'student_supervisor', 'reciter_supervisor']
          if (data.user && !allowedRoles.includes(data.user.role)) {
            setNotAdminError(true)
          }
        }
      } catch {
        // network error
      }
    }
    checkAuth()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, loginType: 'admin' }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t.auth.errorOccurred)
        setLoading(false)
        return
      }

      const role = data.user?.role || 'admin'
      const adminRoles = ['admin', 'student_supervisor', 'reciter_supervisor']
      if (adminRoles.includes(role)) {
        window.location.href = '/admin'
      } else {
        const rolePath = ['student', 'teacher', 'parent'].includes(role) ? `/academy/${role}` : `/${role}`
        window.location.href = rolePath
      }
    } catch {
      setError(t.auth.connectionError)
      setLoading(false)
    }
  }

  async function handleLogout() {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.reload()
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-900">
      {/* Islamic Pattern Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <IslamicPattern className="absolute inset-0 w-full h-full text-primary/30 dark:text-primary/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
      </div>

      {/* Floating Elements */}
      {mounted && <FloatingElements />}

      {/* Left Panel - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12 bg-gradient-to-br from-primary via-emerald-600 to-teal-700">
        {/* Pattern overlay on left panel */}
        <div className="absolute inset-0 opacity-10">
          <IslamicPattern className="w-full h-full text-white" />
        </div>
        
        <div className="relative z-10">
          <Link href="/" className="inline-block">
            <img src="/branding/main-logo.png" alt="Logo" className="h-20 w-auto object-contain brightness-0 invert" />
          </Link>
        </div>
        
        <div className="relative z-10 space-y-8">
          <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight text-balance">
              بوابة الإدارة
              <br />
              <span className="text-emerald-200">لمنصة إتقان</span>
            </h2>
          </div>
          
          <p className={`text-lg text-white/80 max-w-md leading-relaxed transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            نظام إدارة متكامل للمقرأة الإلكترونية، يمكّنك من متابعة الطلاب والمعلمين وإدارة المحتوى بكفاءة عالية
          </p>

          {/* Features list */}
          <div className={`space-y-4 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {[
              { icon: Shield, text: 'حماية متقدمة للبيانات' },
              { icon: BookOpen, text: 'إدارة المناهج والدورات' },
              { icon: Star, text: 'تقارير وإحصائيات شاملة' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          {t.appName} &copy; 2024 - جميع الحقوق محفوظة
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center relative z-10 px-6 py-12 lg:px-12">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-6 right-6">
          <Link href="/">
            <img src="/branding/main-logo.png" alt="Logo" className="h-12 w-auto object-contain" />
          </Link>
        </div>

        <div className={`w-full max-w-md transition-all duration-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Header */}
          <div className="text-center mb-8 lg:text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              <span>بوابة الإدارة المحمية</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
              تسجيل الدخول
            </h1>
            <p className="text-muted-foreground">
              أدخل بيانات حسابك للوصول للوحة التحكم
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl shadow-primary/5 rounded-3xl p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-sm text-red-700 dark:text-red-400 text-center flex items-center justify-center gap-2 animate-shake">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {notAdminError ? (
              <div className="space-y-6 text-center">
                <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-800 dark:text-amber-400 mb-2 text-lg">غير مصرح بالدخول</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-500">حسابك الحالي لا يملك صلاحيات الإدارة</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout} 
                  disabled={loading} 
                  className="w-full bg-secondary hover:bg-secondary/80 text-foreground font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading && <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                  تسجيل الخروج والمحاولة مرة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                    البريد الإلكتروني
                  </label>
                  <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@itqan.com"
                      dir="ltr"
                      className="w-full pr-12 pl-4 py-4 bg-secondary/50 dark:bg-secondary/20 border-2 border-border/50 rounded-2xl focus:ring-0 focus:border-primary transition-all duration-300 text-foreground placeholder:text-muted-foreground/50"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                      كلمة المرور
                    </label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                      نسيت كلمة المرور؟
                    </Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                      className="w-full pr-12 pl-12 py-4 bg-secondary/50 dark:bg-secondary/20 border-2 border-border/50 rounded-2xl focus:ring-0 focus:border-primary transition-all duration-300 text-foreground placeholder:text-muted-foreground/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="toggle password"
                    >
                      {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary via-emerald-600 to-teal-600 hover:from-primary/90 hover:via-emerald-600/90 hover:to-teal-600/90 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-3 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-lg group"
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري تسجيل الدخول...
                    </span>
                  ) : (
                    <>
                      <span>تسجيل الدخول كمدير</span>
                      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer Link */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm">
              لست مديراً؟{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                تسجيل دخول الطلاب والمعلمين
              </Link>
            </p>
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="lg:hidden absolute bottom-4 text-center w-full text-xs text-muted-foreground">
          {t.appName} &copy; 2024
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-15px) rotate(-3deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(45deg); }
          to { transform: rotate(405deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(-8px) rotate(12deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        @keyframes twinkle-delay {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.3); }
        }
        @keyframes twinkle-delay-2 {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
        .animate-twinkle-delay { animation: twinkle-delay 3s ease-in-out infinite 1s; }
        .animate-twinkle-delay-2 { animation: twinkle-delay-2 3s ease-in-out infinite 2s; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  )
}
