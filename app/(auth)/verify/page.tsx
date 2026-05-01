"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"

function VerifyContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get("email")

    const [code, setCode] = useState(["", "", "", "", "", ""])
    const [loading, setLoading] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const [error, setError] = useState("")
    const [successMsg, setSuccessMsg] = useState("")
    const [countdown, setCountdown] = useState(60)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        if (!email) {
            router.push("/register")
        }
        // Focus first input on mount
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus()
        }
    }, [email, router])

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    const handleChange = (index: number, value: string) => {
        // Only allow numbers
        if (value && !/^\d+$/.test(value)) return

        const newCode = [...code]
        newCode[index] = value
        setCode(newCode)

        // Move to next input
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

        // Only paste numbers
        if (!/^\d+$/.test(pastedData.join(""))) return

        const newCode = [...code]
        pastedData.forEach((char, i) => {
            if (i < 6) newCode[i] = char
        })
        setCode(newCode)

        // Focus last filled input
        const focusIndex = Math.min(pastedData.length, 5)
        inputRefs.current[focusIndex]?.focus()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const fullCode = code.join("")

        if (fullCode.length < 6) {
            setError("الرجاء إدخال الرمز المكون من 6 أرقام كاملًا")
            return
        }

        setLoading(true)
        setError("")

        try {
            const res = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code: fullCode }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "فشل التحقق")
            }

            // #2: Route to the correct dashboard based on role + platform access flags.
            const u = data.user
            if (u.role === "parent") router.push("/academy/parent")
            else if (u.role === "teacher") router.push("/academy/teacher")
            else if (u.role === "reader") router.push("/reader")
            else if (u.role === "admin" || u.role === "academy_admin") {
                router.push(u.role === "admin" ? "/admin" : "/academy/admin")
            }
            else if (u.role === "student") {
                const hasAcademy = u.has_academy_access !== false
                const hasQuran = u.has_quran_access !== false
                if (hasAcademy && !hasQuran) router.push("/academy/student")
                else if (!hasAcademy && hasQuran) router.push("/student")
                else router.push("/academy/student") // both → academy default
            }
            else router.push("/")

        } catch (err: any) {
            setError(err.message)
            setSuccessMsg("")
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (!email || countdown > 0) return

        setResendLoading(true)
        setError("")
        setSuccessMsg("")

        try {
            const res = await fetch("/api/auth/resend-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "فشل إرسال الكود")
            }

            setSuccessMsg(data.message || "تم إرسال كود جديد!")
            setCountdown(60) // Reset timer to 60 seconds
        } catch (err: any) {
            setError(err.message)
        } finally {
            setResendLoading(false)
        }
    }

    if (!email) return null

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#0B3D2E] relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 backdrop-blur-sm">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002 2H5a2 2 0 00-2-2V7a2 2 0 002-2h14a2 2 0 002 2v10a2 2 0 00-2 2H5a2 2 0 00-2-2z" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-center text-3xl font-extrabold tracking-tight text-white mb-3">
                    تحقق من بريدك الإلكتروني
                </h2>
                <p className="text-center text-emerald-100/60 text-sm max-w-xs mx-auto mb-10 leading-relaxed">
                    أدخل الرمز المكون من 6 أرقام الذي أرسلناه للتو إلى بريدك: <br />
                    <span className="font-bold text-[#D4A843] mt-2 inline-block text-base" dir="ltr">{email}</span>
                </p>
            </div>

            <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-card/95 backdrop-blur-md py-10 px-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-3xl sm:px-10 border border-border">
                    <form className="space-y-8" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs border border-red-100 font-bold text-center animate-shake">
                                {error}
                            </div>
                        )}
                        {successMsg && (
                            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-xs border border-emerald-100 font-bold text-center">
                                {successMsg}
                            </div>
                        )}

                        <div className="flex justify-center gap-2 sm:gap-3" dir="ltr">
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

                        <button
                            type="submit"
                            disabled={loading || code.join("").length < 6}
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-primary/20 text-base font-black text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-[#0B3D2E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    جاري التأكيد...
                                </div>
                            ) : "تأكيد الحساب"}
                        </button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-slate-100 text-center space-y-4">
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={countdown > 0 || resendLoading}
                            className={`text-sm font-bold flex items-center justify-center w-full gap-2 transition-colors ${countdown > 0 ? "text-slate-400 cursor-not-allowed" : "text-[#0B3D2E] hover:text-[#D4A843]"}`}
                        >
                            {resendLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <span>إعادة إرسال الكود</span>
                            )}
                            {countdown > 0 && <span dir="ltr">({countdown}s)</span>}
                        </button>

                        <p className="text-sm text-slate-500 font-medium">
                            هل أدخلت بريداً خاطئاً؟{" "}
                            <Link href="/register" className="font-bold text-[#0B3D2E] hover:text-[#D4A843] transition-colors underline underline-offset-4">
                                العودة للتسجيل
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-emerald-100/30 text-[10px] font-medium uppercase tracking-[0.2em]">
                    Itqaan Platform &copy; 2024
                </p>
            </div>
        </div>
    )
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0B3D2E]">
                <Loader2 className="w-10 h-10 text-[#D4A843] animate-spin" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    )
}
