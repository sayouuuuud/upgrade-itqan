"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Eye, CheckCircle, XCircle, Clock, Filter, Video, Mic, FileText } from 'lucide-react'

interface PendingLesson {
    id: string
    title: string
    course_id: string
    course_name: string
    teacher_name: string
    teacher_id: string
    type: string // 'video' | 'audio' | 'text'
    status: string // 'pending_review' | 'approved' | 'rejected'
    created_at: string
    rejection_reason?: string
}

export default function SupervisorContentPage() {
    const [lessons, setLessons] = useState<PendingLesson[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('pending_review')

    useEffect(() => {
        fetchLessons()
    }, [statusFilter])

    async function fetchLessons() {
        setLoading(true)
        try {
            const res = await fetch(`/api/academy/admin/courses?include_lessons=true&lesson_status=${statusFilter}`)
            if (res.ok) {
                const data = await res.json()
                // Extract lessons from courses response and flatten
                const allLessons: PendingLesson[] = []
                if (data.courses) {
                    for (const course of data.courses) {
                        if (course.lessons) {
                            for (const lesson of course.lessons) {
                                allLessons.push({
                                    ...lesson,
                                    course_id: course.id,
                                    course_name: course.title,
                                    teacher_name: course.teacher_name || 'غير محدد',
                                    teacher_id: course.teacher_id,
                                })
                            }
                        }
                    }
                }
                setLessons(allLessons)
            }
        } catch (err) {
            console.error('Failed to fetch lessons:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleAction(lessonId: string, courseId: string, action: 'approved' | 'rejected', reason?: string) {
        try {
            const res = await fetch(`/api/academy/teacher/courses/${courseId}/lessons/${lessonId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action, rejection_reason: reason }),
            })
            if (res.ok) {
                fetchLessons()
            }
        } catch (err) {
            console.error('Action failed:', err)
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="w-4 h-4 text-blue-500" />
            case 'audio': return <Mic className="w-4 h-4 text-purple-500" />
            default: return <FileText className="w-4 h-4 text-orange-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_review': return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">بانتظار المراجعة</span>
            case 'approved': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">مقبول</span>
            case 'rejected': return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">مرفوض</span>
            default: return null
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-blue-500" />
                        إشراف المحتوى
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">مراجعة الدروس قبل نشرها للطلاب</p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-secondary/20 border border-border rounded-lg text-sm text-foreground"
                    >
                        <option value="pending_review">بانتظار المراجعة</option>
                        <option value="approved">مقبول</option>
                        <option value="rejected">مرفوض</option>
                        <option value="">الكل</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                            <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                            <div className="h-3 bg-muted rounded w-1/4 mb-2" />
                            <div className="h-3 bg-muted rounded w-1/5" />
                        </div>
                    ))}
                </div>
            ) : lessons.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">لا توجد دروس منتظرة</h3>
                    <p className="text-sm text-muted-foreground">تمت مراجعة جميع الدروس المقدمة</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {lessons.map(lesson => (
                        <div key={lesson.id} className="bg-card border border-border rounded-xl p-5 hover:border-blue-500/30 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        {getTypeIcon(lesson.type)}
                                        <h3 className="font-bold text-foreground truncate">{lesson.title}</h3>
                                        {getStatusBadge(lesson.status)}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        الدورة: <span className="text-foreground">{lesson.course_name}</span> • الأستاذ: <span className="text-foreground">{lesson.teacher_name}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        <Clock className="w-3 h-3 inline ml-1" />
                                        {new Date(lesson.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                    {lesson.rejection_reason && (
                                        <p className="text-xs text-red-500 mt-1">سبب الرفض: {lesson.rejection_reason}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Link
                                        href={`/academy/supervisor/content/${lesson.id}?course=${lesson.course_id}`}
                                        className="p-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                                        title="مراجعة"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Link>
                                    {lesson.status === 'pending_review' && (
                                        <>
                                            <button
                                                onClick={() => handleAction(lesson.id, lesson.course_id, 'approved')}
                                                className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                                                title="قبول"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const reason = prompt('سبب الرفض:')
                                                    if (reason) handleAction(lesson.id, lesson.course_id, 'rejected', reason)
                                                }}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                                                title="رفض"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
