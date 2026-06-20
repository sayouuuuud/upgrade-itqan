"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Eye, CheckCircle, XCircle, Clock, Filter, Video, Mic, FileText, CheckCircle2, ShieldAlert, Sparkles, FolderOpen } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

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
    const { t, dir, locale } = useI18n()
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
                                    teacher_name: course.teacher_name || t?.supervisorContent?.unspecified || 'غير محدد',
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
            case 'video': return <Video className="w-5 h-5" />
            case 'audio': return <Mic className="w-5 h-5" />
            default: return <FileText className="w-5 h-5" />
        }
    }
    
    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'video': return t?.supervisorContent?.typeVideo || 'فيديو'
            case 'audio': return t?.supervisorContent?.typeAudio || 'مقطع صوتي'
            default: return t?.supervisorContent?.typeText || 'نص مقروء'
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_review': return <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 tracking-wide uppercase shadow-sm"><ShieldAlert className="w-3.5 h-3.5" /> {t?.supervisorContent?.statusPending}</span>
            case 'approved': return <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 tracking-wide uppercase shadow-sm"><CheckCircle2 className="w-3.5 h-3.5" /> {t?.supervisorContent?.statusApproved}</span>
            case 'rejected': return <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 tracking-wide uppercase shadow-sm"><XCircle className="w-3.5 h-3.5" /> {t?.supervisorContent?.statusRejected}</span>
            default: return null
        }
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto relative min-h-screen" dir={dir}>
            
            {/* Decorative Background */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full filter blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
            <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full filter blur-[120px] pointer-events-none -z-10" />

            {/* Header */}
            <div className="bg-card/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] p-8 shadow-2xl shadow-black/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shrink-0">
                            <BookOpen className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">{t?.supervisorContent?.title}</h1>
                            <p className="text-muted-foreground font-medium max-w-lg">
                                {t?.supervisorContent?.subtitle}
                            </p>
                        </div>
                    </div>
                    
                    <div className="w-full md:w-auto mt-4 md:mt-0 flex items-center gap-3 bg-muted/40 backdrop-blur-sm p-2 rounded-2xl border border-white/10 shadow-inner">
                        {[
                            { id: 'pending_review', label: t?.supervisorContent?.filterPending || 'المعلقة' },
                            { id: 'approved', label: t?.supervisorContent?.filterApproved || 'المقبولة' },
                            { id: 'rejected', label: t?.supervisorContent?.filterRejected || 'المرفوضة' },
                            { id: '', label: t?.supervisorContent?.filterAll || 'الكل' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setStatusFilter(f.id)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === f.id ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-card/40 backdrop-blur-md border border-white/10 rounded-[32px] p-6 animate-pulse flex gap-6">
                            <div className="w-16 h-16 bg-muted/50 rounded-2xl shrink-0" />
                            <div className="flex-1 space-y-3">
                                <div className="h-5 bg-muted/50 rounded w-1/3" />
                                <div className="h-4 bg-muted/50 rounded w-1/4" />
                                <div className="h-4 bg-muted/50 rounded w-1/5" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : lessons.length === 0 ? (
                <div className="bg-card/40 backdrop-blur-md border-2 border-dashed border-border rounded-[40px] p-24 text-center shadow-none flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-border">
                        <FolderOpen className="w-10 h-10 text-muted-foreground opacity-50" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground mb-2">{t?.supervisorContent?.emptyTitle}</h3>
                    <p className="text-muted-foreground font-bold max-w-sm mx-auto">
                        {t?.supervisorContent?.emptyText}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {lessons.map(lesson => (
                        <div key={lesson.id} className="group bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[32px] p-5 hover:bg-card/80 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/[0.02] to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                            
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner group-hover:scale-110 transition-transform ${lesson.type === 'video' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' : lesson.type === 'audio' ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400'}`}>
                                {getTypeIcon(lesson.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0 text-center md:text-right relative z-10 w-full">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                                    <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                        <h3 className="font-black text-xl text-foreground truncate group-hover:text-primary transition-colors">{lesson.title}</h3>
                                        {getStatusBadge(lesson.status)}
                                    </div>
                                    <span className="text-[11px] font-bold text-muted-foreground flex items-center justify-center md:justify-start gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg border border-border w-fit mx-auto md:mx-0">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(lesson.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm mt-3">
                                    <span className="bg-muted px-3 py-1.5 rounded-xl font-bold text-muted-foreground border border-white/5">
                                        {t?.supervisorContent?.labelCourse}: <span className="text-foreground">{lesson.course_name}</span>
                                    </span>
                                    <span className="bg-muted px-3 py-1.5 rounded-xl font-bold text-muted-foreground border border-white/5">
                                        {t?.supervisorContent?.labelTeacher}: <span className="text-foreground">{lesson.teacher_name}</span>
                                    </span>
                                    <span className="bg-muted px-3 py-1.5 rounded-xl font-bold text-muted-foreground border border-white/5">
                                        {t?.supervisorContent?.labelType}: <span className="text-foreground">{getTypeLabel(lesson.type)}</span>
                                    </span>
                                </div>

                                {lesson.rejection_reason && (
                                    <div className="mt-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2 text-rose-700 dark:text-rose-400 text-sm font-bold w-full">
                                        <ShieldAlert className="w-5 h-5 shrink-0" />
                                        <p>{t?.supervisorContent?.labelRejectionReason}: {lesson.rejection_reason}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0 relative z-10 w-full md:w-auto justify-center md:justify-end mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border">
                                <Link
                                    href={`/academy/supervisor/content/${lesson.id}?course=${lesson.course_id}`}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all font-bold text-sm shadow-sm"
                                    title={t?.supervisorContent?.btnReview || ""}
                                >
                                    <Eye className="w-4 h-4" />
                                    <span>{t?.supervisorContent?.btnReview}</span>
                                </Link>
                                
                                {lesson.status === 'pending_review' && (
                                    <>
                                        <button
                                            onClick={() => handleAction(lesson.id, lesson.course_id, 'approved')}
                                            className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                            title={t?.supervisorContent?.tooltipApprove || ""}
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                const reason = prompt(t?.supervisorContent?.promptRejectionReason || "")
                                                if (reason) handleAction(lesson.id, lesson.course_id, 'rejected', reason)
                                            }}
                                            className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                            title={t?.supervisorContent?.tooltipReject || ""}
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
