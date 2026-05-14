"use client"

import { useState, useEffect } from "react"
import {
    CheckCircle2, XCircle, FileText, User, Phone, Globe, GraduationCap,
    Clock, BookOpen, Trash2, Mic, AlertCircle, Loader2, Calendar
} from "lucide-react"
import AdminAudioPlayer from "@/components/admin/audio-player"
import AdminPdfViewer from "@/components/admin/pdf-viewer"

type App = {
    id: string
    user_id: string
    name: string
    email: string
    qualifications: string | Record<string, any>
    responses: Record<string, any> | null
    cv_url: string | null
    cv_file_url: string | null
    certificate_file_url: string | null
    audio_url: string | null
    status: string
    created_at: string
    submitted_at: string | null
    rejection_reason: string | null
    rejection_count: number
}

type Question = {
    id: string
    label: string
    type: string
    sort_order: number
}

export default function TeacherApplicationsPage() {
    const [apps, setApps] = useState<App[]>([])
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending")
    const [rejectingId, setRejectingId] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const [processing, setProcessing] = useState(false)

    const fetchData = async () => {
        try {
            const [a, q] = await Promise.all([
                fetch("/api/academy/admin/teacher-applications"),
                fetch("/api/admin/application-questions?role=teacher"),
            ])
            if (a.ok) {
                const j = await a.json()
                setApps(j.data || [])
                if (!selectedId && j.data?.length) setSelectedId(j.data[0].id)
            }
            if (q.ok) {
                const j = await q.json()
                setQuestions(j.data || [])
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const filtered = apps.filter(a => filter === "all" ? true : a.status === filter)

    const counts = {
        all: apps.length,
        pending: apps.filter(a => a.status === "pending").length,
        approved: apps.filter(a => a.status === "approved").length,
        rejected: apps.filter(a => a.status === "rejected").length,
    }

    const selected = apps.find(a => a.id === selectedId) || null

    const approve = async (id: string) => {
        if (!confirm("هل تريد قبول هذا المدرس؟")) return
        setProcessing(true)
        try {
            const res = await fetch(`/api/academy/admin/teacher-applications/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "approved" }),
            })
            if (res.ok) await fetchData()
            else alert("حدث خطأ")
        } finally {
            setProcessing(false)
        }
    }

    const submitReject = async () => {
        if (!rejectingId) return
        setProcessing(true)
        try {
            const res = await fetch(`/api/academy/admin/teacher-applications/${rejectingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "rejected", rejection_reason: rejectionReason }),
            })
            if (res.ok) {
                setRejectingId(null)
                setRejectionReason("")
                await fetchData()
            } else {
                alert("حدث خطأ")
            }
        } finally {
            setProcessing(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("حذف الطلب نهائياً؟")) return
        setProcessing(true)
        try {
            const res = await fetch(`/api/academy/admin/teacher-applications/${id}`, { method: "DELETE" })
            if (res.ok) {
                setSelectedId(null)
                await fetchData()
            }
        } finally {
            setProcessing(false)
        }
    }

    if (loading) {
        return (
            <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const parseQuals = (raw: any): Record<string, any> => {
        if (!raw) return {}
        if (typeof raw === "string") {
            try { return JSON.parse(raw) } catch { return {} }
        }
        return raw
    }

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl font-bold">طلبات الانضمام كأستاذ</h1>
                <div className="flex gap-2 text-xs">
                    {(["pending", "approved", "rejected", "all"] as const).map(k => (
                        <button
                            key={k}
                            onClick={() => setFilter(k)}
                            className={`px-3 py-1.5 rounded-full font-bold transition-colors ${filter === k
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            {k === "pending" ? "في الانتظار" : k === "approved" ? "مقبول" : k === "rejected" ? "مرفوض" : "الكل"}
                            <span className="mr-1.5 opacity-80">({counts[k]})</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                {/* List */}
                <div className="space-y-2 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto pr-1">
                    {filtered.length === 0 && (
                        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                            لا توجد طلبات
                        </div>
                    )}
                    {filtered.map(app => (
                        <button
                            key={app.id}
                            onClick={() => setSelectedId(app.id)}
                            className={`w-full text-right p-3 rounded-xl border-2 transition-all ${selectedId === app.id
                                ? "bg-primary/5 border-primary shadow-sm"
                                : "bg-card border-border hover:border-primary/30"
                                }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold truncate">{app.name}</h3>
                                    <p className="text-xs text-muted-foreground truncate">{app.email}</p>
                                </div>
                                <StatusBadge status={app.status} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(app.created_at).toLocaleDateString("ar-EG")}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Detail */}
                <div className="space-y-5">
                    {!selected ? (
                        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
                            اختر طلباً من القائمة
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="bg-card border border-border rounded-xl p-5 flex items-start justify-between flex-wrap gap-4">
                                <div className="flex gap-4 items-start min-w-0">
                                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                                        <User className="w-7 h-7" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="font-bold text-xl">{selected.name}</h2>
                                        <p className="text-sm text-muted-foreground">{selected.email}</p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                            <StatusBadge status={selected.status} />
                                            {selected.rejection_count > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {selected.rejection_count} مرة رفض سابقة
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selected.status === "pending" && (
                                        <>
                                            <button
                                                disabled={processing}
                                                onClick={() => approve(selected.id)}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> قبول
                                            </button>
                                            <button
                                                disabled={processing}
                                                onClick={() => { setRejectingId(selected.id); setRejectionReason("") }}
                                                className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 text-red-700 font-bold rounded-lg flex items-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" /> رفض
                                            </button>
                                        </>
                                    )}
                                    <button
                                        disabled={processing}
                                        onClick={() => handleDelete(selected.id)}
                                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                        title="حذف"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Old qualifications fields (legacy from initial register) */}
                            {(() => {
                                const qual = parseQuals(selected.qualifications)
                                const items: { icon: any; label: string; v: any }[] = []
                                if (qual.phone) items.push({ icon: Phone, label: "هاتف", v: qual.phone })
                                if (qual.nationality) items.push({ icon: Globe, label: "الجنسية", v: qual.nationality })
                                if (qual.qualification) items.push({ icon: GraduationCap, label: "المؤهل", v: qual.qualification })
                                if (qual.years_of_experience != null) items.push({ icon: Clock, label: "سنوات خبرة", v: qual.years_of_experience })
                                if (qual.teaching_subjects) items.push({ icon: BookOpen, label: "المواد", v: qual.teaching_subjects })
                                if (items.length === 0) return null
                                return (
                                    <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {items.map((it, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm">
                                                <it.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                                                <span className="text-muted-foreground">{it.label}:</span>
                                                <span className="font-bold truncate">{String(it.v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })()}

                            {/* Audio test */}
                            {selected.audio_url && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold flex items-center gap-2">
                                        <Mic className="w-4 h-4 text-blue-600" /> الاختبار الصوتي
                                    </h3>
                                    <AdminAudioPlayer src={selected.audio_url} label="تسجيل المتقدم" />
                                </div>
                            )}

                            {/* PDF */}
                            {(selected.cv_file_url || selected.cv_url || selected.certificate_file_url) && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-rose-600" /> الوثائق
                                    </h3>
                                    <AdminPdfViewer
                                        src={selected.cv_file_url || selected.cv_url || selected.certificate_file_url || ""}
                                        label="السيرة الذاتية / الشهادات"
                                    />
                                </div>
                            )}

                            {/* Dynamic responses */}
                            {selected.responses && Object.keys(selected.responses).length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold">إجابات النموذج</h3>
                                    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                                        {questions
                                            .filter(q => q.type !== "audio" && q.type !== "file")
                                            .map(q => {
                                                const v = selected.responses?.[q.id]
                                                if (!v) return null
                                                return (
                                                    <div key={q.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                                                        <p className="text-xs font-bold text-muted-foreground">{q.label}</p>
                                                        <p className="text-sm mt-1 whitespace-pre-wrap">{String(v)}</p>
                                                    </div>
                                                )
                                            })}
                                    </div>
                                </div>
                            )}

                            {/* Existing rejection reason */}
                            {selected.status === "rejected" && selected.rejection_reason && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                                    <p className="text-xs font-bold text-red-700 mb-1">سبب الرفض السابق:</p>
                                    <p className="text-sm text-red-900 dark:text-red-200 whitespace-pre-wrap">{selected.rejection_reason}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Reject dialog */}
            {rejectingId && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                    onClick={() => !processing && setRejectingId(null)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
                    >
                        <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="w-5 h-5" />
                            <h2 className="font-bold text-lg">رفض الطلب</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            اكتب رسالة للمتقدم تشرح فيها سبب الرفض. ستُعرض له في لوحة التحكم.
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            rows={4}
                            placeholder="مثال: نقص في المؤهلات الأكاديمية، يرجى تحديث ملفك..."
                            className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none resize-y"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setRejectingId(null)}
                                disabled={processing}
                                className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl font-bold"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={submitReject}
                                disabled={processing}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                                تأكيد الرفض
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const cfg = status === "pending"
        ? { label: "في الانتظار", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" }
        : status === "approved"
            ? { label: "مقبول", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" }
            : status === "rejected"
                ? { label: "مرفوض", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" }
                : { label: "مسودة", cls: "bg-muted text-muted-foreground" }
    return <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${cfg.cls}`}>{cfg.label}</span>
}
