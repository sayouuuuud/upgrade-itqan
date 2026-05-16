"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ChevronDown } from 'lucide-react'

interface StudentFormProps {
  initialRole: 'student' | 'parent'
  onBack: () => void
}

export function StudentForm({ initialRole, onBack }: StudentFormProps) {
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState('')
  const [platform, setPlatform] = useState('both')
  const router = useRouter()
  const { t } = useI18n()

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
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          gender: gender || undefined, 
          platform_choice: initialRole === 'parent' ? 'academy' : platform, 
          register_role: initialRole 
        }),
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
        const effectivePlatform = initialRole === 'parent' ? 'academy' : platform
        router.push(
          `/verify?email=${encodeURIComponent(email)}&platform=${effectivePlatform}&role=${initialRole}`
        )
      } else {
        const savedRole = data.user?.role || initialRole
        if (savedRole === 'parent') {
          router.push('/academy/parent')
        } else if (platform === 'quran') {
          router.push('/student')
        } else {
          router.push('/academy/student')
        }
      }
    } catch {
      setError(t.auth.connectionError)
      setLoading(false)
    }
  }

  const roleTitle = initialRole === 'parent' 
    ? (t.locale === 'ar' ? 'تسجيل ولي أمر جديد' : 'Register New Parent')
    : (t.locale === 'ar' ? 'تسجيل طالب جديد' : 'Register New Student')

  return (
    <div className="w-full">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 hover:bg-secondary rounded-full transition-colors" aria-label="back">
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </button>
        <h2 className="text-2xl font-bold text-foreground mr-2">{roleTitle}</h2>
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

        {initialRole !== 'parent' && (
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
            t.auth.createAccount
          )}
        </button>
      </form>
    </div>
  )
}
