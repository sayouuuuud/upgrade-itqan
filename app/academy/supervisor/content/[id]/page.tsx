"use client"

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle, XCircle, Clock, Video, Mic, FileText, Download, BookOpen } from 'lucide-react'

interface LessonDetail {
    id: string
    title: string
    description: string
    type: string
    content_url: string
    attachments: string[]
    status: string
    created_at: string
    rejection_reason?: string
    course_name?: string
    teacher_name?: string
}

export default function SupervisorContentDetailPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const lessonId = params.id as string
    const courseId = searchParams.get('course') || ''

    const [lesson, setLesson] = useState<LessonDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [rejectionReason, setRejectionReason] = useState('')
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        if (courseId && lessonId) fetchLesson()
    }, [courseId, lessonId])

    async function fetchLesson() {
        setLoading(true)
        try {
            const res = await fetch(`/api/academy/teacher/courses/${courseId}`)
            if (res.ok) {
                const data = await res.json()
                const found = data.lessons?.find((l: any) => l.id === lessonId)
                if (found) {
                    setLesson({
                        ...found,
                        course_name: data.title,
                        teacher_name: data.teacher_name,
                    })
                }
            }
        } catch (err) {
            console.error('Failed to fetch lesson:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleAction(action: 'approved' | 'rejected') {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/academy/teacher/courses/${courseId}/lessons/${lessonId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: action,
                    rejection_reason: action === 'rejected' ? rejectionReason : undefined
                }),
            })
            if (res.ok) {
                router.push('/academy/supervisor/content')
            }
        } catch (err) {
            console.error('Action failed:', err)
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-muted rounded w-1/3" />
                <div className="h-64 bg-muted rounded-xl" />
                <div className="h-32 bg-muted rounded-xl" />
            </div>
        )
    }

    if (!lesson) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">الدرس غير موجود</p>
                <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">العودة</button>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => router.push('/academy/supervisor/content')} className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{lesson.title}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        الدورة: {lesson.course_name} • الأستاذ: {lesson.teacher_name} •
                        <Clock className="w-3 h-3 inline mx-1" />
                        {new Date(lesson.created_at).toLocaleDateString('ar-EG')}
                    </p>
                </div>
            </div>

            {/* Content Preview */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-2">
                    {lesson.type === 'video' ? <Video className="w-5 h-5 text-blue-500" /> :
                        lesson.type === 'audio' ? <Mic className="w-5 h-5 text-purple-500" /> :
                            <FileText className="w-5 h-5 text-orange-500" />}
                    <span className="font-medium text-foreground">محتوى الدرس</span>
                </div>

                {lesson.content_url && lesson.type === 'video' && (
                    <div className="aspect-video bg-black">
                        <video controls className="w-full h-full" src={lesson.content_url}>
                            المتصفح لا يدعم تشغيل الفيديو
                        </video>
                    </div>
                )}
                {lesson.content_url && lesson.type === 'audio' && (
                    <div className="p-6">
                        <audio controls className="w-full" src={lesson.content_url}>
                            المتصفح لا يدعم تشغيل الصوت
                        </audio>
                    </div>
                )}
                {!lesson.content_url && (
                    <div className="p-6 text-center text-muted-foreground">لا يوجد ملف وسائط مرفق</div>
                )}
            </div>

            {/* Description */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    وصف الدرس
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {lesson.description || 'لا يوجد وصف'}
                </p>
            </div>

            {/* Attachments */}
            {lesson.attachments && lesson.attachments.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="font-bold text-foreground mb-3">المرفقات</h3>
                    <div className="space-y-2">
                        {lesson.attachments.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm">
                                <Download className="w-4 h-4 text-blue-500" />
                                <span className="text-foreground">مرفق {i + 1}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            {lesson.status === 'pending_review' && (
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <button
                        onClick={() => handleAction('approved')}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                        <CheckCircle className="w-5 h-5" />
                        قبول ونشر الدرس
                    </button>
                    <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                        <XCircle className="w-5 h-5" />
                        رفض الدرس
                    </button>
                </div>
            )}

            {lesson.status === 'rejected' && lesson.rejection_reason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">سبب الرفض:</p>
                    <p className="text-sm text-red-600 dark:text-red-300">{lesson.rejection_reason}</p>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold text-foreground mb-4">سبب رفض الدرس</h3>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="اكتب سبب الرفض هنا..."
                            className="w-full p-3 bg-secondary/20 border border-border rounded-xl text-sm text-foreground resize-none h-32 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            required
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => { setShowRejectModal(false); setRejectionReason('') }}
                                className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={() => { handleAction('rejected'); setShowRejectModal(false) }}
                                disabled={!rejectionReason.trim() || actionLoading}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                تأكيد الرفض
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
