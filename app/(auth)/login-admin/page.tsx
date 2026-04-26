"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { Eye, EyeOff, Mail, Lock, ArrowLeft, AlertTriangle } from 'lucide-react'

export default function AdminLoginPage() {
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [notAdminError, setNotAdminError] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const router = useRouter()
    const { t } = useI18n()
    // Guard: run the auth check only ONCE to prevent infinite redirect loop
    const authChecked = useRef(false)

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
                        // Logged in but NOT an admin role 
                        setNotAdminError(true)
                    }
                }
            } catch {
                // network error 
            }
        }
        checkAuth()
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

            // Use window.location.href (full page load) so the new auth cookie
            // is included in the very first request to /admin — prevents redirect loop
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
        <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-background">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 opacity-10 dark:opacity-20" style={{ background: 'radial-gradient(circle at top left, var(--primary) 0%, transparent 40%, transparent 100%)' }} />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            </div>

            {/* Nav */}
            <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 max-w-7xl mx-auto w-full">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                    <img src="/branding/main-logo.png" alt="Logo" className="h-16 w-auto object-contain" />
                </Link>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                    <span>تسجيل دخول منصة الطلاب؟</span>
                    <span className="text-primary font-bold">هنا</span>
                </Link>
            </nav>

            {/* Form */}
            <main className="relative z-10 w-full max-w-lg px-4 py-12">
                <div className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-8 md:p-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">تسجيل دخول الإدارة</h1>
                        <p className="text-muted-foreground">مخصص لمديري منصة {t.appName}</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
                            {error}
                        </div>
                    )}

                    {notAdminError ? (
                        <div className="space-y-6 text-center">
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex flex-col items-center gap-3">
                                <AlertTriangle className="w-10 h-10 text-amber-500" />
                                <div>
                                    <h3 className="font-bold text-amber-800 dark:text-amber-400 mb-1 text-lg">غير مصرح بالدخول</h3>
                                    <p className="text-sm text-amber-700 dark:text-amber-500">حسابك الحالي مسجل دخول، ولكنه لا يملك صلاحيات الإدارة.</p>
                                </div>
                            </div>
                            <button onClick={handleLogout} disabled={loading} className="w-full bg-secondary border border-border hover:bg-secondary/80 text-foreground font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                {loading ? (
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : null}
                                تسجيل الخروج والمحاولة مرة أخرى
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">{t.auth.email}</label>
                                <div className="relative">
                                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors" />
                                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" className="w-full pr-10 pl-4 py-3 bg-secondary/30 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" required />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label htmlFor="password" className="block text-sm font-medium text-foreground">{t.auth.password}</label>
                                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">{t.auth.forgotPassword}</Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors" />
                                    <input id="password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="........" dir="ltr" className="w-full pr-10 pl-10 py-3 bg-secondary/30 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" required />
                                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="toggle password">
                                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60">
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {t.auth.signingIn}
                                    </span>
                                ) : (
                                    <>
                                        <span>{t.login} كمدير</span>
                                        <ArrowLeft className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
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
