"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [email, setEmail] = useState('')
    const router = useRouter()
    const { t } = useI18n()
  const app = (t as any).app as Record<string, string> | undefined

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setSuccess(false)
        setLoading(true)

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()

            if (!res.ok) {
                if (data.error === 'not_found') {
                    setError('not_found')
                } else {
                    setError(data.error || t.auth.errorOccurred)
                }
                setLoading(false)
                return
            }

            setSuccess(true)
            // Transition to reset password page after 2 seconds
            setTimeout(() => {
                router.push(`/reset-password?email=${encodeURIComponent(email)}`)
            }, 2000)
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
                <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2">
                    <span>{t.forgotPassword.backToLogin}</span>
                    <ArrowLeft className="w-4 h-4 text-[#D4A843]" />
                </Link>
            </nav>

            {/* Form */}
            <main className="relative z-10 w-full max-w-lg px-4 py-12">
                <div className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-8 md:p-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">{t.forgotPassword.title}</h1>
                        <p className="text-muted-foreground">{t.forgotPassword.desc}</p>
                    </div>

                    {error === 'not_found' ? (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                            <p className="text-sm font-medium text-amber-900 mb-3">هذا البريد الإلكتروني غير مسجل في منصة إتقان الفاتحة.</p>
                            <Link href="/register" className="inline-flex items-center justify-center px-4 py-2 bg-[#D4A843] text-white rounded-lg text-sm font-bold hover:bg-[#C49A3A] transition-colors">
                                إنشاء حساب جديد الآن
                            </Link>
                        </div>
                    ) : error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 text-center">
                            {t.forgotPassword.codeSent}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-1">{t.auth.email || 'البريد الإلكتروني'}</label>
                            <div className="relative">
                                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" className="w-full pr-10 pl-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" required />
                            </div>
                        </div>

                        <button type="submit" disabled={loading || success} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {t.forgotPassword.sendingCode}
                                </span>
                            ) : (
                                <>
                                    <span>{t.forgotPassword.sendCode}</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    )
}
