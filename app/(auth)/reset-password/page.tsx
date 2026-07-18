"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useI18n } from '@/lib/i18n/context'
import { Eye, EyeOff, Lock, ArrowLeft, Loader2 } from "lucide-react"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get("email") || ""

  const [inputEmail, setInputEmail] = useState(initialEmail)
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [newPassword, setNewPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { t } = useI18n()
  const app = (t as any).app as Record<string, string> | undefined

  useEffect(() => {
    if (initialEmail && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [initialEmail])

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("")

    if (!/^\d+$/.test(pastedData.join(""))) return

    const newCode = [...code]
    pastedData.forEach((char, i) => {
      if (i < 6) newCode[i] = char
    })
    setCode(newCode)

    const focusIndex = Math.min(pastedData.length, 5)
    inputRefs.current[focusIndex]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join("")

    if (!inputEmail) {
      setError(t.resetPassword.emailMissing)
      return
    }

    if (fullCode.length < 6) {
      setError(t.resetPassword.enterFullCode)
      return
    }

    if (newPassword.length < 6) {
      setError(t.auth.passwordMinLength)
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inputEmail, code: fullCode, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || t.resetPassword.verificationFailed)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-[#0B3D2E]">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px]"></div>

      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 max-w-7xl mx-auto w-full">
        <Link href="/" className="text-3xl font-bold tracking-tighter text-[#D4A843] hover:opacity-80 transition-opacity drop-shadow-sm">{t.appName}</Link>
        <Link href="/login" className="px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-sm font-medium text-white/90 hover:bg-white/10 transition-all flex items-center gap-2">
          <span>{t.resetPassword.backToPlatform}</span>
          <ArrowLeft className="w-4 h-4 text-[#D4A843]" />
        </Link>
      </nav>

      <main className="relative z-10 w-full max-w-lg px-4 py-12">
        <div className="bg-card/95 backdrop-blur-2xl border border-border shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] p-8 md:p-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-secondary/10 mb-6 border border-border">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-foreground mb-3 tracking-tight">{t.resetPassword.title}</h1>
            {initialEmail ? (
              <p className="text-slate-500 text-sm leading-relaxed">
                {t.resetPassword.enterCodeTo} <br />
                <span className="font-bold text-[#D4A843] mt-1 inline-block text-base" dir="ltr">{initialEmail}</span>
              </p>
            ) : (
              <p className="text-slate-500 text-sm leading-relaxed">
                {t.resetPassword.resetDescFull}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-bold text-center animate-shake">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-700 font-bold text-center">
              {t.resetPassword.passwordChanged}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {!initialEmail && (
              <div className="space-y-2">
                <label htmlFor="inputEmail" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 text-center">{t.auth.email}</label>
                <input
                  id="inputEmail"
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="w-full px-4 py-4 text-center bg-secondary/20 dark:bg-secondary/10 border-2 border-border rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-card transition-all text-base font-bold placeholder:font-medium placeholder:text-muted-foreground/30 text-foreground"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">{t.resetPassword.verificationCodeLabel}</label>
              <div className="flex justify-center gap-2 sm:gap-3 mb-8" dir="ltr">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    maxLength={1}
                    required
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-black text-foreground bg-secondary/20 dark:bg-secondary/10 border-2 border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all transform focus:scale-105"
                    autoComplete="off"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.resetPassword.newPasswordLabel}</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#D4A843] w-5 h-5 transition-colors" />
                <input
                  id="newPassword"
                  type={showPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t.resetPassword.newPasswordPlaceholder}
                  dir="ltr"
                  className="w-full pr-12 pl-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#D4A843]/10 focus:border-[#D4A843] focus:bg-white transition-all text-base font-bold placeholder:font-medium placeholder:text-slate-300"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#0B3D2E] transition-colors" aria-label="toggle password">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success || code.join("").length < 6 || !inputEmail || newPassword.length < 6}
              className="w-full py-4.5 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {t.resetPassword.saving}</> : t.resetPassword.updatePassword}
            </button>
          </form>
        </div>

        <p className="mt-12 text-center text-emerald-100/20 text-[10px] font-black uppercase tracking-[0.3em]">
          Itqaan Platform &bull; Secure Access
        </p>
      </main>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0B3D2E]">
        <Loader2 className="w-10 h-10 text-[#D4A843] animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

