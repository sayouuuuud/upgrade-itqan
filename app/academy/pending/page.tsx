"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Clock, CheckCircle2, XCircle, Send, Loader2, RefreshCcw, AlertCircle,
    LogOut, Mic, FileText, Edit3
} from "lucide-react"
import AudioRecorder from "@/components/applicant/audio-recorder"
import PdfUploader from "@/components/applicant/pdf-uploader"

type Question = {
    id: string
    label: string
    description: string | null
    type: "text" | "textarea" | "select" | "audio" | "file"
    options: string[] | null
    is_required: boolean
    sort_order: number
}

type ApplicationData = {
    user: { role: string; approval_status: string }
    application: {
        status: string
        responses: Record<string, any> | null
        audio_url: string | null
        cv_file_url?: string | null
        pdf_url?: string | null
        rejection_reason: string | null
        rejection_count: number
        submitted_at: string | null
        created_at?: string
    } | null
    questions: Question[]
}

/**
 * Pending applicant dashboard. Shows:
 *   - Empty/draft state: form with admin questions + audio recorder + PDF upload
 *   - Pending review: progress card with timeline
 *   - Approved: success card with redirect
 *   - Rejected: rejection reason + reapply form
 */
export default function PendingApplicationPage() {
    const router = useRouter()
    const [data, setData] = useState<ApplicationData | null>(null)
    const [loading, setLoading] = useState(true)
    const [responses, setResponses] = useState<Record<string, any>>({})
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [reapplying, setReapplying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const load = async () => {
        setError(null)
        try {
            const res = await fetch("/api/auth/application/me")
            if (!res.ok) {
                if (res.status === 401) {
                    // Hard navigation so we drop any stale auth state cleanly.
                    window.location.replace("/login")
                    return
                }
                throw new Error("فشل تحميل بيانات الطلب")
            }
            const json = (await res.json()) as ApplicationData
            setData(json)
            setResponses(json.application?.responses || {})
            setAudioUrl(json.application?.audio_url || null)
            setPdfUrl(
                json.application?.cv_file_url ||
                json.application?.pdf_url ||
                null
            )
            // If approved, redirect to the right dashboard
            if (json.user.approval_status === "approved") {
                if (json.user.role === "teacher") window.location.replace("/academy/teacher")
                else if (json.user.role === "reader") window.location.replace("/reader")
                else window.location.replace("/")
            }
        } catch (err: any) {
            setError(err?.message || "خطأ غير متوقع")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const saveDraft = async (extra?: Partial<{ audio_url: string | null; pdf_url: string | null }>) => {
        setSaving(true)
        setError(null)
        try {
            await fetch("/api/auth/application/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    responses,
                    audio_url: extra?.audio_url !== undefined ? extra.audio_url : audioUrl,
                    pdf_url: extra?.pdf_url !== undefined ? extra.pdf_url : pdfUrl,
                }),
            })
        } catch (err: any) {
            setError(err?.message || "فشل الحفظ")
        } finally {
            setSaving(false)
        }
    }

    const submit = async () => {
        setSubmitting(true)
        setError(null)
        setSuccess(null)
        try {
            // Save latest draft first
            await fetch("/api/auth/application/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ responses, audio_url: audioUrl, pdf_url: pdfUrl }),
            })
            // Submit
            const res = await fetch("/api/auth/application/me/submit", { method: "POST" })
            const json = await res.json()
            if (!res.ok) {
                setError(json.error || "فشل الإرسال")
            } else {
                setSuccess(json.message || "تم استلام طلبك")
                await load()
            }
        } catch (err: any) {
            setError(err?.message || "فشل الإرسال")
        } finally {
            setSubmitting(false)
        }
    }

    const reapply = async () => {
        setReapplying(true)
        setError(null)
        try {
            const res = await fetch("/api/auth/reapply", { method: "POST" })
            if (!res.ok) {
                const j = await res.json().catch(() => ({}))
                setError(j.error || "فشل إعادة التقديم")
            } else {
                await load()
            }
        } finally {
            setReapplying(false)
        }
    }

    const logout = async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => { })
        router.push("/login")
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!data) {
        return (
            <div
                dir="rtl"
                className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900"
            >
                <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-foreground">تعذّر تحميل بيانات طلبك</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {error || "حدث خطأ غير متوقع. حاول مرة أخرى أو سجّل الخروج وادخل مجددًا."}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={() => { setLoading(true); load() }}
                            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                            <RefreshCcw className="w-4 h-4" /> إعادة المحاولة
                        </button>
                        <button
                            onClick={logout}
                            className="flex-1 px-4 py-2.5 bg-muted hover:bg-muted/70 text-foreground font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" /> تسجيل الخروج
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const status = data.user.approval_status
    const app = data.application
    const isSubmitted = !!app?.submitted_at && status === "pending_approval" && app?.status !== "draft"
    const isPending = status === "pending_approval"
    const isRejected = status === "rejected"

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-8 px-4" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">

                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                            {data.user.role === "teacher" ? "طلب الانضمام كأستاذ" : "طلب الانضمام كمقرئ"}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isSubmitted ? "طلبك قيد المراجعة" : isRejected ? "تم رفض الطلب — يمكنك إعادة التقديم" : "أكمل البيانات لإرسال طلبك"}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg"
                    >
                        <LogOut className="w-4 h-4" /> خروج
                    </button>
                </header>

                {/* progress timeline */}
                <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-2 relative">
                        <div className="absolute top-5 right-0 left-0 h-0.5 bg-muted -z-0" />
                        <Step
                            done={true}
                            current={!isSubmitted && !isRejected}
                            label="التسجيل"
                            icon={<CheckCircle2 className="w-5 h-5" />}
                        />
                        <Step
                            done={isSubmitted || isRejected || (!!app && app.status !== "draft")}
                            current={!isSubmitted && !isRejected && !!app}
                            label="استكمال البيانات"
                            icon={<Edit3 className="w-5 h-5" />}
                        />
                        <Step
                            done={isSubmitted}
                            current={isSubmitted && !isRejected}
                            label="مراجعة الإدارة"
                            icon={<Clock className="w-5 h-5" />}
                        />
                        <Step
                            done={false}
                            current={false}
                            label="القبول"
                            icon={<CheckCircle2 className="w-5 h-5" />}
                            error={isRejected}
                            errorIcon={<XCircle className="w-5 h-5" />}
                        />
                    </div>
                </div>

                {/* status banner */}
                {isRejected && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-3">
                            <XCircle className="w-6 h-6 text-red-600" />
                            <h2 className="font-bold text-red-900 dark:text-red-200">تم رفض طلبك</h2>
                        </div>
                        {app?.rejection_reason && (
                            <div className="bg-white dark:bg-red-900/40 rounded-xl p-4 border border-red-200 dark:border-red-700">
                                <p className="text-xs font-bold text-red-600 mb-1">رسالة الإدارة:</p>
                                <p className="text-sm text-red-900 dark:text-red-200 whitespace-pre-wrap">{app.rejection_reason}</p>
                            </div>
                        )}
                        <button
                            onClick={reapply}
                            disabled={reapplying}
                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                            {reapplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                            إعادة التقديم
                        </button>
                    </div>
                )}

                {isSubmitted && !isRejected && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-start gap-4">
                        <Clock className="w-6 h-6 text-amber-600 mt-1 shrink-0" />
                        <div className="flex-1">
                            <h2 className="font-bold text-amber-900 dark:text-amber-200">طلبك قيد المراجعة</h2>
                            <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                                تم إرسال طلبك بنجاح. سيقوم فريق الإدارة بمراجعة بياناتك في أقرب وقت ممكن. سنخطرك عبر البريد الإلكتروني والإشعارات بمجرد اتخاذ قرار.
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                                تاريخ الإرسال: {app?.submitted_at ? new Date(app.submitted_at).toLocaleString("ar-EG") : "—"}
                            </p>
                        </div>
                    </div>
                )}

                {/* form: shown when draft (not submitted) OR rejected (after reapply, status returns to pending and user re-fills) */}
                {!isSubmitted && (
                    <div className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-lg flex items-center gap-2">
                                <Send className="w-5 h-5 text-primary" /> نموذج طلب الانضمام
                            </h2>
                            {saving && <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" /> جاري الحفظ
                            </span>}
                        </div>

                        {data.questions.length === 0 && (
                            <div className="bg-muted/30 rounded-xl p-4 text-sm text-muted-foreground">
                                لم يتم إعداد نموذج الطلب بعد من قبل الإدارة. يرجى التواصل مع الدعم.
                            </div>
                        )}

                        {data.questions.map((q, i) => (
                            <div key={q.id} className="space-y-2">
                                <label className="block">
                                    <span className="text-sm font-bold flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary text-xs w-6 h-6 rounded-full flex items-center justify-center">
                                            {i + 1}
                                        </span>
                                        {q.label}
                                        {q.is_required && <span className="text-red-500">*</span>}
                                    </span>
                                    {q.description && (
                                        <span className="block text-xs text-muted-foreground mt-1">{q.description}</span>
                                    )}
                                </label>
                                {q.type === "text" && (
                                    <input
                                        type="text"
                                        value={responses[q.id] || ""}
                                        onChange={e => setResponses({ ...responses, [q.id]: e.target.value })}
                                        onBlur={() => saveDraft()}
                                        className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                )}
                                {q.type === "textarea" && (
                                    <textarea
                                        value={responses[q.id] || ""}
                                        onChange={e => setResponses({ ...responses, [q.id]: e.target.value })}
                                        onBlur={() => saveDraft()}
                                        rows={4}
                                        className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-y"
                                    />
                                )}
                                {q.type === "select" && (
                                    <select
                                        value={responses[q.id] || ""}
                                        onChange={e => { setResponses({ ...responses, [q.id]: e.target.value }); saveDraft() }}
                                        className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                    >
                                        <option value="">— اختر —</option>
                                        {(q.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                )}
                                {q.type === "audio" && (
                                    <AudioRecorder
                                        value={audioUrl}
                                        onChange={(u) => { setAudioUrl(u); saveDraft({ audio_url: u }) }}
                                    />
                                )}
                                {q.type === "file" && (
                                    <PdfUploader
                                        value={pdfUrl}
                                        onChange={(u) => { setPdfUrl(u); saveDraft({ pdf_url: u }) }}
                                    />
                                )}
                            </div>
                        ))}

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2 whitespace-pre-line">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                {success}
                            </div>
                        )}

                        <button
                            onClick={submit}
                            disabled={submitting || data.questions.length === 0}
                            className="w-full px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            إرسال الطلب للمراجعة
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

function Step({
    done, current, label, icon, error, errorIcon,
}: {
    done: boolean
    current: boolean
    label: string
    icon: React.ReactNode
    error?: boolean
    errorIcon?: React.ReactNode
}) {
    const bg = error
        ? "bg-red-500 text-white border-red-500"
        : done
            ? "bg-emerald-500 text-white border-emerald-500"
            : current
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-muted text-muted-foreground border-border"
    return (
        <div className="flex flex-col items-center gap-2 z-10 flex-1">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sm ${bg}`}>
                {error ? errorIcon : icon}
            </div>
            <span className={`text-xs font-bold text-center ${current ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
            </span>
        </div>
    )
}
