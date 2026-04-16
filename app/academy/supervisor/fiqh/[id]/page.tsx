"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle, XCircle, User, Clock, BookOpen, Send } from 'lucide-react'

interface FiqhQuestionDetail {
    id: string
    question: string
    student_name: string
    student_id: string
    category: string
    status: string
    created_at: string
    answer?: string
    answered_by?: string
    answered_at?: string
    references?: string
    rejection_reason?: string
}

export default function SupervisorFiqhDetailPage() {
    const params = useParams()
    const router = useRouter()
    const questionId = params.id as string

    const [question, setQuestion] = useState<FiqhQuestionDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [answer, setAnswer] = useState('')
    const [references, setReferences] = useState('')
    const [rejectionMsg, setRejectionMsg] = useState('')
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => { fetchQuestion() }, [questionId])

    async function fetchQuestion() {
        setLoading(true)
        try {
            const res = await fetch(`/api/academy/fiqh/${questionId}`)
            if (res.ok) {
                const data = await res.json()
                setQuestion(data.question || data)
                if (data.question?.answer || data.answer) setAnswer(data.question?.answer || data.answer)
                if (data.question?.references || data.references) setReferences(data.question?.references || data.references)
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    async function handlePublish() {
        if (!answer.trim()) return
        setActionLoading(true)
        try {
            const res = await fetch(`/api/academy/fiqh/${questionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer, references, status: 'answered' }),
            })
            if (res.ok) router.push('/academy/supervisor/fiqh')
        } catch (err) { console.error(err) }
        finally { setActionLoading(false) }
    }

    async function handleReject() {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/academy/fiqh/${questionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected', rejection_reason: rejectionMsg }),
            })
            if (res.ok) router.push('/academy/supervisor/fiqh')
        } catch (err) { console.error(err) }
        finally { setActionLoading(false); setShowRejectModal(false) }
    }

    if (loading) return (
        <div className="space-y-6 animate-pulse max-w-3xl">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-40 bg-muted rounded-xl" />
            <div className="h-64 bg-muted rounded-xl" />
        </div>
    )

    if (!question) return (
        <div className="text-center py-12">
            <p className="text-muted-foreground">السؤال غير موجود</p>
            <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">العودة</button>
        </div>
    )

    const isPending = question.status === 'new' || question.status === 'in_review'

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => router.push('/academy/supervisor/fiqh')} className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </button>
                <h1 className="text-xl font-bold text-foreground">مراجعة سؤال فقهي</h1>
            </div>

            {/* Question Card */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                        {question.student_name?.[0] || 'ط'}
                    </div>
                    <div>
                        <p className="font-bold text-foreground">{question.student_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(question.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                            <span className="px-2 py-0.5 bg-muted rounded-full">{question.category}</span>
                        </div>
                    </div>
                </div>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{question.question}</p>
            </div>

            {/* Answer Form (if pending) */}
            {isPending && (
                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-green-600" />
                        كتابة الإجابة
                    </h3>
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="اكتب الإجابة الفقهية هنا..."
                        className="w-full p-4 bg-secondary/20 border border-border rounded-xl text-sm text-foreground resize-none h-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-relaxed"
                    />
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-foreground/80 mb-2">المراجع والمصادر (اختياري)</label>
                        <textarea
                            value={references}
                            onChange={(e) => setReferences(e.target.value)}
                            placeholder="أدخل المراجع والمصادر الشرعية..."
                            className="w-full p-3 bg-secondary/20 border border-border rounded-xl text-sm text-foreground resize-none h-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handlePublish}
                            disabled={!answer.trim() || actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                        >
                            <Send className="w-5 h-5" />
                            نشر الإجابة
                        </button>
                        <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={actionLoading}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Already Answered */}
            {question.status === 'answered' && question.answer && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                    <h3 className="font-bold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        الإجابة
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-300 leading-relaxed whitespace-pre-wrap">{question.answer}</p>
                    {question.references && (
                        <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-700">
                            <p className="text-xs font-bold text-green-600 dark:text-green-400">المراجع:</p>
                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">{question.references}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Rejected */}
            {question.status === 'rejected' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <p className="text-sm font-bold text-red-700 dark:text-red-400">تم رفض السؤال</p>
                    {question.rejection_reason && <p className="text-sm text-red-600 dark:text-red-300 mt-1">{question.rejection_reason}</p>}
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold text-foreground mb-4">رفض السؤال</h3>
                        <textarea
                            value={rejectionMsg}
                            onChange={(e) => setRejectionMsg(e.target.value)}
                            placeholder="سبب الرفض (مثلاً: السؤال خارج نطاق المنصة)..."
                            className="w-full p-3 bg-secondary/20 border border-border rounded-xl text-sm text-foreground resize-none h-24 focus:ring-2 focus:ring-red-500"
                        />
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => { setShowRejectModal(false); setRejectionMsg('') }}
                                className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80">إلغاء</button>
                            <button onClick={handleReject} disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">تأكيد الرفض</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
