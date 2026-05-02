"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import {
    ChevronRight, Calendar, User as UserIcon, Mic2,
    AlertCircle, FileAudio, Loader2, Info, MessageSquare, Award
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { AudioPlayer } from "@/components/audio-player"
import Link from "next/link"

export default function AdminRecitationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { t } = useI18n()
    const router = useRouter()
    const isAr = t.locale === "ar"
    const { id } = use(params)

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [updating, setUpdating] = useState(false)
    const [newStatus, setNewStatus] = useState("")
    const [internalNotes, setInternalNotes] = useState("")

    useEffect(() => {
        async function fetchRecitation() {
            try {
                const res = await fetch(`/api/admin/recitations/${id}`)
                if (!res.ok) throw new Error(t.admin.failedToLoadData || "Failed to load data")
                const json = await res.json()
                setData(json)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchRecitation()
    }, [id, t.admin.failedToLoadData])

    useEffect(() => {
        if (data) {
            setNewStatus(data.status)
            setInternalNotes(data.internal_notes || "")
        }
    }, [data])

    const handleUpdate = async () => {
        setUpdating(true)
        try {
            const res = await fetch(`/api/admin/recitations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus, internal_notes: internalNotes })
            })
            if (!res.ok) throw new Error(isAr ? "فشل التحديث" : "Failed to update")
            const json = await res.json()
            setData(json.data)
            alert(isAr ? "تم التحديث بنجاح" : "Updated successfully")
        } catch (err: any) {
            alert(err.message)
        } finally {
            setUpdating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">{t.loading}</p>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-destructive">
                <AlertCircle className="w-12 h-12" />
                <p className="text-lg font-bold">{error || t.admin.adminRecitationDetails.notFound}</p>
                <Button onClick={() => router.back()} variant="outline">{t.back}</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <button onClick={() => router.back()} className="hover:text-primary transition-colors">
                        {t.back}
                    </button>
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                    <span className="font-bold text-foreground">{t.admin.adminRecitationDetails.title} #{id.substring(0, 8)}</span>
                </div>
                <div>
                    <StatusBadge status={data.status} className="px-3 py-1 text-sm" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recitation Info Card */}
                    <Card className="border-border/50 shadow-2xl shadow-black/5 overflow-hidden bg-card/60 backdrop-blur-xl border rounded-[32px]">
                        <div className="bg-primary p-6 text-primary-foreground flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Mic2 className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black mb-1">
                                    {t.admin.surah} {data.surah_name}
                                </h2>
                                <p className="text-white/80 flex items-center gap-2 text-sm">
                                    <span>{t.admin.adminRecitationDetails.verses}: {data.ayah_from} - {data.ayah_to}</span>
                                    <span>•</span>
                                    <span>{data.recitation_type === 'tilawa' ? t.admin.adminRecitationDetails.typeTilawa : data.recitation_type === 'hifd' ? t.admin.adminRecitationDetails.typeHifd : t.admin.adminRecitationDetails.typeMurajaa}</span>
                                </p>
                            </div>
                        </div>

                        <CardContent className="p-6 space-y-6">
                            {/* Audio Player */}
                            <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                                <h3 className="font-bold mb-4 flex items-center gap-2 text-foreground">
                                    <FileAudio className="w-5 h-5 text-primary" />
                                    {t.admin.adminRecitationDetails.audioRecording}
                                </h3>
                                {data.audio_url ? (
                                    <AudioPlayer src={data.audio_url} />
                                ) : (
                                    <div className="text-sm text-muted-foreground italic p-4 bg-muted/20 rounded-xl text-center border border-dashed border-border/50">
                                        {t.admin.adminRecitationDetails.noAudio}
                                    </div>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                                    <span className="text-sm text-muted-foreground block mb-1">{t.admin.adminRecitationDetails.submissionType}</span>
                                    <span className="font-bold text-foreground">{data.submission_type === 'recorded' ? t.admin.adminRecitationDetails.subRecorded : t.admin.adminRecitationDetails.subUploaded}</span>
                                </div>
                            </div>

                            {/* Student Notes */}
                            {data.student_notes && (
                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <h3 className="font-bold mb-2 flex items-center gap-2 text-primary">
                                        <MessageSquare className="w-4 h-4" />
                                        {t.admin.adminRecitationDetails.studentNotes}
                                    </h3>
                                    <p className="text-sm text-foreground/80 leading-relaxed">{data.student_notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Evaluator's Notes / Feedback */}
                    {(data.detailed_feedback || data.verdict) && (
                        <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-[32px] bg-card/60 backdrop-blur-xl border">
                            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                                <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
                                    <Award className="w-5 h-5 text-primary" />
                                    {isAr ? "تقييم المقرئ والملاحظات" : "Evaluator's Feedback & Verdict"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                                        <span className="text-sm text-muted-foreground block mb-1">{isAr ? "القرار النهائي" : "Final Verdict"}</span>
                                        <span className="font-bold text-foreground">
                                            {data.verdict === 'mastered' ? (isAr ? "متقن" : "Mastered") :
                                             data.verdict === 'needs_session' ? (isAr ? "يحتاج جلسة مصححة" : "Needs Session") :
                                             data.verdict}
                                        </span>
                                    </div>
                                    {data.overall_score && (
                                    <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                                        <span className="text-sm text-muted-foreground block mb-1">{isAr ? "التقييم العام" : "Overall Score"}</span>
                                        <span className="font-bold text-foreground">{data.overall_score}/100</span>
                                    </div>
                                    )}
                                </div>

                                {data.detailed_feedback && (
                                    <div className="p-5 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                        <h3 className="font-bold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                            <MessageSquare className="w-4 h-4" />
                                            {isAr ? "ملاحظات المقرئ المكتوبة" : "Evaluator's Written Feedback"}
                                        </h3>
                                        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{data.detailed_feedback}</p>
                                    </div>
                                )}

                                {data.wordMistakes && data.wordMistakes.length > 0 && (
                                    <div className="p-5 bg-destructive/5 rounded-xl border border-destructive/10">
                                        <h3 className="font-bold mb-3 flex items-center gap-2 text-destructive">
                                            <AlertCircle className="w-4 h-4" />
                                            {isAr ? "الكلمات التي أخطأ فيها" : "Mistakes In Words"}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {data.wordMistakes.map((word: string, i: number) => (
                                                <span key={i} className="px-3 py-1.5 bg-destructive/10 text-destructive font-bold text-sm rounded-lg flex items-center gap-1">
                                                    {word}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                    {/* Management Card */}
                    <Card className="border-primary/20 shadow-2xl shadow-primary/5 rounded-3xl bg-primary/5 border">
                        <CardHeader className="pb-3 border-b border-primary/10">
                            <CardTitle className="text-sm font-black text-primary uppercase tracking-widest">
                                {isAr ? "إدارة التسميع" : "Recitation Management"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-muted-foreground uppercase">{isAr ? "الحالة" : "Status"}</label>
                                <select 
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full p-2.5 bg-card border border-border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="pending">{isAr ? "قيد الانتظار" : "Pending"}</option>
                                    <option value="in_review">{isAr ? "قيد المراجعة" : "In Review"}</option>
                                    <option value="reviewed">{isAr ? "تمت المراجعة" : "Reviewed"}</option>
                                    <option value="mastered">{isAr ? "متقن" : "Mastered"}</option>
                                    <option value="needs_session">{isAr ? "يحتاج جلسة" : "Needs Session"}</option>
                                    <option value="cancelled">{isAr ? "ملغي" : "Cancelled"}</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-muted-foreground uppercase">{isAr ? "ملاحظات داخلية" : "Internal Notes"}</label>
                                <textarea 
                                    value={internalNotes}
                                    onChange={(e) => setInternalNotes(e.target.value)}
                                    placeholder={isAr ? "ملاحظات لا يراها الطالب..." : "Private notes..."}
                                    className="w-full h-24 p-2.5 bg-card border border-border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>

                            <Button 
                                onClick={handleUpdate}
                                disabled={updating}
                                className="w-full h-12 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20"
                            >
                                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "حفظ التغييرات" : "Save Changes")}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Student Info */}
                    <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-3xl bg-card/60 backdrop-blur-xl border">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">{t.admin.adminRecitationDetails.studentInfo}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-500/20">
                                    {data.student_avatar ? (
                                        <img src={data.student_avatar} alt={data.student_name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        data.student_name.charAt(0)
                                    )}
                                </div>
                                <div>
                                    <Link href={`/admin/users/${data.student_id || '#'}`} className="font-black text-foreground hover:text-primary transition-colors">
                                        {data.student_name}
                                    </Link>
                                    <p className="text-xs text-muted-foreground font-bold">{data.student_email}</p>
                                </div>
                            </div>
                            <div className="pt-3 border-t border-border/50 text-sm">
                                <div className="flex justify-between py-1">
                                    <span className="text-muted-foreground font-bold">{t.admin.adminRecitationDetails.uploadDate}</span>
                                    <span className="font-black text-foreground">{new Date(data.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Evaluator Info */}
                    {(data.reader_name || data.assigned_reader_id) && (
                    <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-3xl bg-card/60 backdrop-blur-xl border">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">{t.admin.adminRecitationDetails.evaluator}</CardTitle>
                        </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold border border-purple-500/20">
                                        {data.reader_avatar ? (
                                            <img src={data.reader_avatar} alt={data.reader_name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            data.reader_name ? data.reader_name.charAt(0) : '?'
                                        )}
                                    </div>
                                    <div>
                                        <Link href={`/admin/users/${data.assigned_reader_id || '#'}`} className="font-black text-foreground hover:text-primary transition-colors">
                                            {data.reader_name || t.admin.adminRecitationDetails.unassignedEvaluator}
                                        </Link>
                                        {data.reader_email && <p className="text-xs text-muted-foreground font-bold">{data.reader_email}</p>}
                                    </div>
                                </div>
                                {data.reviewed_at && (
                                    <div className="pt-3 border-t border-border/50 text-sm">
                                        <div className="flex justify-between py-1">
                                            <span className="text-muted-foreground font-bold">{t.admin.adminRecitationDetails.evaluationDate}</span>
                                            <span className="font-black text-foreground">{new Date(data.reviewed_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
