"use client"

import Image from "next/image"
import { useCallback, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
    AlertCircle,
    ArrowRight,
    Ban,
    BookOpen,
    CheckCircle2,
    Clock,
    Edit3,
    Loader2,
    LogOut,
    RefreshCcw,
    Send,
    XCircle,
} from "lucide-react"
import AudioRecorder from "@/components/applicant/audio-recorder"
import PdfUploader from "@/components/applicant/pdf-uploader"

type QuestionType = "text" | "textarea" | "select" | "audio" | "file"

type Question = {
    id: string
    label: string
    description: string | null
    type: QuestionType
    options: string[] | null
    is_required: boolean
    sort_order: number
}

type ApplicantUser = {
    role: string
    approval_status: string
}

type ApplicationRecord = {
    status?: string | null
    responses?: Record<string, unknown> | null
    audio_url?: string | null
    cv_file_url?: string | null
    pdf_url?: string | null
    rejection_reason?: string | null
    rejection_count?: number | null
    submitted_at?: string | null
    created_at?: string | null
}

type ApplicationData = {
    user: ApplicantUser
    application: ApplicationRecord | null
    questions: Question[]
}

type AuthMeData = {
    user?: ApplicantUser
    error?: string
    message?: string
}

type LoadResult =
    | { type: "ready"; data: ApplicationData; warning?: string }
    | { type: "redirect"; href: string }

type SaveDraftInput = {
    responses?: Record<string, string>
    audio_url?: string | null
    pdf_url?: string | null
}

function dashboardFor(user: ApplicantUser) {
    if (user.role === "teacher") return "/academy/teacher"
    if (user.role === "reader") return "/reader"
    return "/"
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getMessage(value: unknown, fallback: string) {
    if (value instanceof Error && value.message) return value.message
    if (isRecord(value) && typeof value.error === "string") return value.error
    if (isRecord(value) && typeof value.message === "string") return value.message
    return fallback
}

async function readJson(response: Response) {
    return response.json().catch(() => null) as Promise<unknown>
}

async function readResponseMessage(response: Response, fallback: string) {
    return getMessage(await readJson(response), fallback)
}

function normalizeResponses(value: unknown) {
    const result: Record<string, string> = {}
    if (!isRecord(value)) return result

    for (const [key, answer] of Object.entries(value)) {
        if (typeof answer === "string") result[key] = answer
        else if (typeof answer === "number" || typeof answer === "boolean") result[key] = String(answer)
    }

    return result
}

function getStoredFile(application: ApplicationRecord | null) {
    return application?.cv_file_url || application?.pdf_url || null
}

async function fetchCurrentUser() {
    const response = await fetch("/api/auth/me", { cache: "no-store" })
    if (response.status === 401) return null
    if (!response.ok) throw new Error(await readResponseMessage(response, "فشل تحميل بيانات الحساب"))

    const json = (await readJson(response)) as AuthMeData
    return json.user || null
}

async function fetchApplicationData() {
    const response = await fetch("/api/auth/application/me", { cache: "no-store" })
    if (response.status === 401) return null
    if (!response.ok) throw new Error(await readResponseMessage(response, "فشل تحميل بيانات الطلب"))

    return (await readJson(response)) as ApplicationData
}

async function readPendingApplication(): Promise<LoadResult> {
    const user = await fetchCurrentUser()
    if (!user) return { type: "redirect", href: "/login" }
    if (user.approval_status === "approved") return { type: "redirect", href: dashboardFor(user) }

    try {
        const applicationData = await fetchApplicationData()
        if (!applicationData) return { type: "redirect", href: "/login" }
        if (applicationData.user.approval_status === "approved") {
            return { type: "redirect", href: dashboardFor(applicationData.user) }
        }
        return { type: "ready", data: applicationData }
    } catch (error) {
        if (user.approval_status === "rejected") {
            return {
                type: "ready",
                data: { user, application: null, questions: [] },
                warning: getMessage(error, "تعذر تحميل تفاصيل الطلب، لكن حالة الرفض ظاهرة من الحساب."),
            }
        }
        throw error
    }
}

function roleLabel(role: string) {
    return role === "teacher" ? "أستاذ" : "مقرئ"
}

export default function PendingApplicationPage() {
    const router = useRouter()
    const [data, setData] = useState<ApplicationData | null>(null)
    const [loading, setLoading] = useState(true)
    const [responses, setResponses] = useState<Record<string, string>>({})
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [reapplying, setReapplying] = useState(false)
    const [reapplyBlocked, setReapplyBlocked] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [warning, setWarning] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const applyData = useCallback((nextData: ApplicationData, nextWarning?: string) => {
        setData(nextData)
        setResponses(normalizeResponses(nextData.application?.responses))
        setAudioUrl(nextData.application?.audio_url || null)
        setPdfUrl(getStoredFile(nextData.application))
        setWarning(nextWarning || null)
        setError(null)
        setLoading(false)
    }, [])

    const loadApplication = useCallback(async () => {
        const result = await readPendingApplication()
        if (result.type === "redirect") {
            router.replace(result.href)
            return
        }
        applyData(result.data, result.warning)
    }, [applyData, router])

    useEffect(() => {
        let active = true
        void readPendingApplication()
            .then((result) => {
                if (!active) return
                if (result.type === "redirect") {
                    router.replace(result.href)
                    return
                }
                applyData(result.data, result.warning)
            })
            .catch((err: unknown) => {
                if (!active) return
                setError(getMessage(err, "حدث خطأ غير متوقع"))
                setLoading(false)
            })

        return () => {
            active = false
        }
    }, [applyData, router])

    const refresh = async () => {
        setLoading(true)
        setError(null)
        setWarning(null)
        try {
            await loadApplication()
        } catch (err: unknown) {
            setError(getMessage(err, "حدث خطأ غير متوقع"))
            setLoading(false)
        }
    }

    const logout = async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => null)
        router.push("/login")
    }

    const saveDraft = async (input: SaveDraftInput = {}) => {
        setSaving(true)
        setError(null)
        try {
            const response = await fetch("/api/auth/application/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    responses: input.responses || responses,
                    audio_url: input.audio_url !== undefined ? input.audio_url : audioUrl,
                    pdf_url: input.pdf_url !== undefined ? input.pdf_url : pdfUrl,
                }),
            })

            if (!response.ok) throw new Error(await readResponseMessage(response, "فشل الحفظ"))
        } catch (err: unknown) {
            setError(getMessage(err, "فشل الحفظ"))
        } finally {
            setSaving(false)
        }
    }

    const updateResponse = (questionId: string, value: string, autosave = false) => {
        const nextResponses = { ...responses, [questionId]: value }
        setResponses(nextResponses)
        if (autosave) void saveDraft({ responses: nextResponses })
    }

    const submit = async () => {
        setSubmitting(true)
        setError(null)
        setSuccess(null)
        try {
            const saveResponse = await fetch("/api/auth/application/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ responses, audio_url: audioUrl, pdf_url: pdfUrl }),
            })
            if (!saveResponse.ok) throw new Error(await readResponseMessage(saveResponse, "فشل حفظ الطلب"))

            const submitResponse = await fetch("/api/auth/application/me/submit", { method: "POST" })
            const submitJson = await readJson(submitResponse)
            if (!submitResponse.ok) throw new Error(getMessage(submitJson, "فشل الإرسال"))

            setSuccess(getMessage(submitJson, "تم استلام طلبك"))
            await loadApplication()
        } catch (err: unknown) {
            setError(getMessage(err, "فشل الإرسال"))
        } finally {
            setSubmitting(false)
        }
    }

    const reapply = async () => {
        setReapplying(true)
        setError(null)
        setSuccess(null)
        try {
            const response = await fetch("/api/auth/reapply", { method: "POST" })
            const json = await readJson(response)
            if (!response.ok) {
                if (isRecord(json) && json.blocked === true) setReapplyBlocked(true)
                throw new Error(getMessage(json, "فشل إعادة التقديم"))
            }
            setSuccess(getMessage(json, "تم إعادة تقديم طلبك بنجاح"))
            await loadApplication()
        } catch (err: unknown) {
            setError(getMessage(err, "فشل إعادة التقديم"))
        } finally {
            setReapplying(false)
        }
    }

    if (loading) return <LoadingScreen />

    if (!data) {
        return <LoadError message={error} onRefresh={refresh} onLogout={logout} />
    }

    const status = data.user.approval_status
    const application = data.application
    const isRejected = status === "rejected"
    const isSubmitted = status === "pending_approval" && !!application?.submitted_at && application?.status !== "draft"

    if (isRejected) {
        return (
            <RejectedApplication
                application={application}
                blocked={reapplyBlocked}
                error={error}
                warning={warning}
                role={data.user.role}
                reapplying={reapplying}
                onLogout={logout}
                onReapply={reapply}
            />
        )
    }

    return (
        <PageShell>
            <div className="max-w-4xl mx-auto space-y-6 relative z-10">
                <Header role={data.user.role} subtitle={isSubmitted ? "طلبك قيد المراجعة" : "أكمل البيانات لإرسال طلبك"} onLogout={logout} />
                <Timeline isSubmitted={isSubmitted} hasDraft={!!application && application.status !== "draft"} />

                {isSubmitted ? (
                    <PendingReview submittedAt={application?.submitted_at || null} />
                ) : (
                    <ApplicationForm
                        questions={data.questions}
                        responses={responses}
                        audioUrl={audioUrl}
                        pdfUrl={pdfUrl}
                        saving={saving}
                        submitting={submitting}
                        error={error}
                        success={success}
                        onResponseChange={updateResponse}
                        onBlurSave={() => void saveDraft()}
                        onAudioChange={(url) => {
                            setAudioUrl(url)
                            void saveDraft({ audio_url: url })
                        }}
                        onPdfChange={(url) => {
                            setPdfUrl(url)
                            void saveDraft({ pdf_url: url })
                        }}
                        onSubmit={submit}
                    />
                )}
            </div>
        </PageShell>
    )
}

function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B3D2E]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#D4A843]" />
                <p className="text-white/50 text-sm">جاري تحميل بيانات طلبك...</p>
            </div>
        </div>
    )
}

function LoadError({ message, onRefresh, onLogout }: { message: string | null; onRefresh: () => void; onLogout: () => void }) {
    return (
        <div dir="rtl" className="min-h-screen flex items-center justify-center px-4 bg-[#0B3D2E]">
            <div className="w-full max-w-md bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl p-8 space-y-5 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-7 h-7 text-red-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">تعذّر تحميل بيانات طلبك</h1>
                    <p className="text-sm text-white/50 mt-2">
                        {message || "حدث خطأ غير متوقع. حاول مرة أخرى أو سجّل الخروج وادخل مجددًا."}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={onRefresh} className="flex-1 px-4 py-2.5 bg-[#D4A843] hover:bg-[#C49A3A] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                        <RefreshCcw className="w-4 h-4" /> إعادة المحاولة
                    </button>
                    <button onClick={onLogout} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                        <LogOut className="w-4 h-4" /> تسجيل الخروج
                    </button>
                </div>
            </div>
        </div>
    )
}

function PageShell({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#0B3D2E] py-8 px-4" dir="rtl">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 right-0 w-96 h-96 bg-[#D4A843]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            </div>
            {children}
        </div>
    )
}

function Header({ role, subtitle, onLogout }: { role: string; subtitle: string; onLogout: () => void }) {
    return (
        <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={onLogout} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
                    <ArrowRight className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-white">طلب الانضمام ك{roleLabel(role)}</h1>
                    <p className="text-sm text-white/40 mt-0.5">{subtitle}</p>
                </div>
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                <LogOut className="w-4 h-4" /> خروج
            </button>
        </header>
    )
}

function Timeline({ isSubmitted, hasDraft }: { isSubmitted: boolean; hasDraft: boolean }) {
    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-2 relative">
                <div className="absolute top-5 right-0 left-0 h-0.5 bg-white/10 -z-0" />
                <Step done current={!isSubmitted && !hasDraft} label="التسجيل" icon={<CheckCircle2 className="w-5 h-5" />} />
                <Step done={isSubmitted || hasDraft} current={!isSubmitted && hasDraft} label="استكمال البيانات" icon={<Edit3 className="w-5 h-5" />} />
                <Step done={isSubmitted} current={isSubmitted} label="مراجعة الإدارة" icon={<Clock className="w-5 h-5" />} />
                <Step done={false} current={false} label="القبول" icon={<CheckCircle2 className="w-5 h-5" />} />
            </div>
        </div>
    )
}

function PendingReview({ submittedAt }: { submittedAt: string | null }) {
    return (
        <div className="bg-amber-900/20 border-2 border-amber-500/30 rounded-2xl p-5 flex items-start gap-4">
            <Clock className="w-6 h-6 text-amber-400 mt-1 shrink-0" />
            <div className="flex-1">
                <h2 className="font-bold text-amber-300">طلبك قيد المراجعة</h2>
                <p className="text-sm text-amber-400/70 mt-1">تم إرسال طلبك بنجاح. سيقوم فريق الإدارة بمراجعة بياناتك في أقرب وقت ممكن.</p>
                <p className="text-xs text-amber-500/50 mt-2">
                    تاريخ الإرسال: {submittedAt ? new Date(submittedAt).toLocaleString("ar-EG") : "—"}
                </p>
            </div>
        </div>
    )
}

function RejectedApplication({
    application,
    blocked,
    error,
    warning,
    role,
    reapplying,
    onLogout,
    onReapply,
}: {
    application: ApplicationRecord | null
    blocked: boolean
    error: string | null
    warning: string | null
    role: string
    reapplying: boolean
    onLogout: () => void
    onReapply: () => void
}) {
    return (
        <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0B3D2E] relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#D4A843]/5 rounded-full blur-3xl" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #D4A843 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            </div>

            <nav className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center z-10 max-w-4xl mx-auto w-full">
                <Image src="/branding/main-logo.png" alt="Logo" width={140} height={48} className="h-12 w-auto object-contain" priority />
                <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    <LogOut className="w-4 h-4" /> خروج
                </button>
            </nav>

            <div className="relative z-10 w-full max-w-lg">
                <div className="bg-white/5 backdrop-blur-xl border border-red-500/20 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="h-1.5 w-full bg-gradient-to-l from-red-500 to-red-700" />
                    <div className="p-8 md:p-10 text-center space-y-6">
                        <div className="relative inline-flex">
                            <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto">
                                <XCircle className="w-10 h-10 text-red-400" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0B3D2E] border-2 border-red-500/30 flex items-center justify-center">
                                <BookOpen className="w-3.5 h-3.5 text-red-400" />
                            </div>
                        </div>

                        <div>
                            <p className="text-red-400/70 text-xs font-bold tracking-[0.2em] uppercase mb-2">قرار الإدارة</p>
                            <h1 className="text-3xl font-black text-white mb-2">تم رفض طلبك</h1>
                            <p className="text-white/50 text-base">
                                للأسف لم يتم قبول طلب انضمامك <span className="text-[#D4A843]">كـ{roleLabel(role)}</span> في هذه المرحلة
                            </p>
                        </div>

                        {application?.rejection_reason ? (
                            <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-5 text-right space-y-2">
                                <p className="text-xs font-black text-red-400/80 tracking-wider uppercase flex items-center gap-2">
                                    <span className="w-5 h-0.5 bg-red-400/40 block" />
                                    سبب الرفض
                                    <span className="w-5 h-0.5 bg-red-400/40 block" />
                                </p>
                                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{application.rejection_reason}</p>
                            </div>
                        ) : (
                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-center">
                                <p className="text-white/30 text-sm">لم يُذكر سبب محدد. يمكنك التواصل مع الإدارة لمزيد من التفاصيل.</p>
                            </div>
                        )}

                        {warning && (
                            <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-200 flex items-start gap-2 text-right">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {warning}
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-sm text-red-300 flex items-start gap-2 text-right">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 pt-2">
                            {blocked ? (
                                <div className="bg-orange-950/30 border border-orange-500/30 rounded-2xl p-5 text-center space-y-2">
                                    <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto">
                                        <Ban className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <p className="text-orange-300 font-bold text-sm">تم إيقاف إمكانية إعادة التقديم</p>
                                    <p className="text-white/30 text-xs leading-relaxed">قررت الإدارة إيقاف إمكانية إعادة تقديم الطلب على هذا الحساب. يرجى التواصل مع الإدارة مباشرة للاستفسار.</p>
                                </div>
                            ) : (
                                <button
                                    onClick={onReapply}
                                    disabled={reapplying}
                                    className="w-full px-6 py-4 bg-[#D4A843] hover:bg-[#C49A3A] disabled:opacity-50 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] shadow-lg shadow-[#D4A843]/10"
                                >
                                    {reapplying ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
                                    {reapplying ? "جاري تحديث الطلب..." : "إعادة التقديم مرة أخرى"}
                                </button>
                            )}
                            <button onClick={onLogout} className="w-full px-6 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/60 hover:text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all">
                                <LogOut className="w-4 h-4" /> تسجيل الخروج
                            </button>
                        </div>
                    </div>
                </div>
                <p className="text-center text-white/20 text-xs mt-6">هل لديك أي استفسار؟ تواصل مع إدارة المنصة عبر قنوات الدعم الرسمية</p>
            </div>
        </div>
    )
}

function ApplicationForm({
    questions,
    responses,
    audioUrl,
    pdfUrl,
    saving,
    submitting,
    error,
    success,
    onResponseChange,
    onBlurSave,
    onAudioChange,
    onPdfChange,
    onSubmit,
}: {
    questions: Question[]
    responses: Record<string, string>
    audioUrl: string | null
    pdfUrl: string | null
    saving: boolean
    submitting: boolean
    error: string | null
    success: string | null
    onResponseChange: (questionId: string, value: string, autosave?: boolean) => void
    onBlurSave: () => void
    onAudioChange: (url: string | null) => void
    onPdfChange: (url: string | null) => void
    onSubmit: () => void
}) {
    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-[#D4A843]" /> نموذج طلب الانضمام
                </h2>
                {saving && (
                    <span className="text-xs text-white/30 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> جاري الحفظ
                    </span>
                )}
            </div>

            {questions.length === 0 && (
                <div className="bg-white/[0.03] rounded-xl p-4 text-sm text-white/30">
                    لم يتم إعداد نموذج الطلب بعد من قبل الإدارة. يرجى التواصل مع الدعم.
                </div>
            )}

            {questions.map((question, index) => (
                <QuestionField
                    key={question.id}
                    question={question}
                    index={index}
                    value={responses[question.id] || ""}
                    audioUrl={audioUrl}
                    pdfUrl={pdfUrl}
                    onResponseChange={onResponseChange}
                    onBlurSave={onBlurSave}
                    onAudioChange={onAudioChange}
                    onPdfChange={onPdfChange}
                />
            ))}

            {error && <Notice tone="error">{error}</Notice>}
            {success && <Notice tone="success">{success}</Notice>}

            <button
                onClick={onSubmit}
                disabled={submitting || questions.length === 0}
                className="w-full px-4 py-3.5 bg-[#D4A843] hover:bg-[#C49A3A] disabled:opacity-50 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
            >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                إرسال الطلب للمراجعة
            </button>
        </div>
    )
}

function QuestionField({
    question,
    index,
    value,
    audioUrl,
    pdfUrl,
    onResponseChange,
    onBlurSave,
    onAudioChange,
    onPdfChange,
}: {
    question: Question
    index: number
    value: string
    audioUrl: string | null
    pdfUrl: string | null
    onResponseChange: (questionId: string, value: string, autosave?: boolean) => void
    onBlurSave: () => void
    onAudioChange: (url: string | null) => void
    onPdfChange: (url: string | null) => void
}) {
    return (
        <div className="space-y-2">
            <label className="block">
                <span className="text-sm font-bold text-white/90 flex items-center gap-2">
                    <span className="bg-[#D4A843]/10 text-[#D4A843] text-xs w-6 h-6 rounded-full flex items-center justify-center">{index + 1}</span>
                    {question.label}
                    {question.is_required && <span className="text-red-400">*</span>}
                </span>
                {question.description && <span className="block text-xs text-white/30 mt-1">{question.description}</span>}
            </label>

            {question.type === "text" && (
                <input
                    type="text"
                    value={value}
                    onChange={(event) => onResponseChange(question.id, event.target.value)}
                    onBlur={onBlurSave}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#D4A843]/20 outline-none text-white placeholder:text-white/20"
                />
            )}
            {question.type === "textarea" && (
                <textarea
                    value={value}
                    onChange={(event) => onResponseChange(question.id, event.target.value)}
                    onBlur={onBlurSave}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#D4A843]/20 outline-none resize-y text-white placeholder:text-white/20"
                />
            )}
            {question.type === "select" && (
                <select
                    value={value}
                    onChange={(event) => onResponseChange(question.id, event.target.value, true)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#D4A843]/20 outline-none text-white"
                >
                    <option value="">— اختر —</option>
                    {(question.options || []).map((option) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            )}
            {question.type === "audio" && <AudioRecorder value={audioUrl} onChange={onAudioChange} />}
            {question.type === "file" && <PdfUploader value={pdfUrl} onChange={onPdfChange} />}
        </div>
    )
}

function Notice({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
    const className = tone === "error"
        ? "bg-red-950/30 border border-red-500/20 text-red-300"
        : "bg-emerald-900/20 border border-emerald-500/20 text-emerald-300"
    const Icon = tone === "error" ? AlertCircle : CheckCircle2

    return (
        <div className={`${className} rounded-xl p-3 text-sm flex items-start gap-2 whitespace-pre-line`}>
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            {children}
        </div>
    )
}

function Step({ done, current, label, icon }: { done: boolean; current: boolean; label: string; icon: ReactNode }) {
    const bg = done
        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
        : current
            ? "bg-[#D4A843]/20 text-[#D4A843] border-[#D4A843]/40"
            : "bg-white/5 text-white/30 border-white/10"

    return (
        <div className="flex flex-col items-center gap-2 z-10 flex-1">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${bg}`}>{icon}</div>
            <span className={`text-xs font-bold text-center ${current ? "text-white/80" : "text-white/30"}`}>{label}</span>
        </div>
    )
}
