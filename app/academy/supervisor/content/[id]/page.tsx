"use client"


import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle, XCircle, Clock, Video, Mic, FileText, Download, BookOpen, AlertCircle, PlayCircle, Loader2, ShieldCheck, GraduationCap } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

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
  const { t } = useI18n();
  const academy = (t as any).academy as Record<string, string> | undefined

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
            <div className="flex flex-col items-center justify-center py-40 gap-6">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <Loader2 className="absolute inset-0 m-auto w-10 h-10 animate-spin text-primary opacity-50" />
                </div>
                <p className="text-xl font-black text-muted-foreground animate-pulse">{(t.addedTranslations_2026?.['جاري تحميل بيانات الدرس...'] || 'جاري تحميل بيانات الدرس...')}</p>
            </div>
        )
    }

    if (!lesson) {
        return (
            <div className="bg-card/40 backdrop-blur-md border-2 border-dashed border-border rounded-[40px] p-24 text-center shadow-none flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-border">
                    <AlertCircle className="w-10 h-10 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-2">{(t.addedTranslations_2026?.['الدرس غير موجود'] || 'الدرس غير موجود')}</h3>
                <p className="text-muted-foreground font-bold mb-8">{(t.addedTranslations_2026?.['عذراً، لم نتمكن من العثور على الدرس المطلوب.'] || 'عذراً، لم نتمكن من العثور على الدرس المطلوب.')}</p>
                <button 
                    onClick={() => router.back()} 
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                    <ArrowRight className="w-5 h-5" />
                    {(t.addedTranslations_2026?.['العودة لصندوق المحتوى'] || 'العودة لصندوق المحتوى')}
                                    </button>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 relative min-h-screen pb-20" dir="rtl">
            
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full filter blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full filter blur-[120px] pointer-events-none -z-10" />

            {/* Header Bar */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => router.push('/academy/supervisor/content')} 
                    className="w-12 h-12 rounded-2xl bg-card border border-white/10 flex items-center justify-center hover:bg-muted transition-all shadow-sm group hover:-translate-x-1"
                >
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
                <div className="flex-1 bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-black/5">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${lesson.type === 'video' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : lesson.type === 'audio' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'}`}>
                            {lesson.type === 'video' ? <Video className="w-5 h-5" /> : lesson.type === 'audio' ? <Mic className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-foreground line-clamp-1">{lesson.title}</h1>
                            <p className="text-xs font-bold text-muted-foreground mt-0.5 flex items-center gap-2">
                                <span><BookOpen className="w-3 h-3 inline ml-1 opacity-70" /> {lesson.course_name}</span>
                                <span className="text-border">•</span>
                                <span><GraduationCap className="w-3 h-3 inline ml-1 opacity-70" /> {lesson.teacher_name}</span>
                            </p>
                        </div>
                    </div>
                    <div className="hidden sm:block">
                        <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-lg border border-border shadow-inner">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(lesson.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Media Player Card */}
                    <div className="bg-card/60 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] p-6 sm:p-8 shadow-2xl shadow-black/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 opacity-50 blur-3xl rounded-full pointer-events-none" />
                        
                        <div className="relative z-10">
                            <h3 className="text-xl font-black text-foreground mb-6 flex items-center gap-3">
                                <PlayCircle className="w-6 h-6 text-primary" />
                                {(t.addedTranslations_2026?.['استعراض المحتوى التعليمي'] || 'استعراض المحتوى التعليمي')}
                                                            </h3>
                            
                            <div className="rounded-[24px] overflow-hidden border-2 border-white/10 shadow-inner bg-black/5 dark:bg-white/5">
                                {lesson.content_url && lesson.type === 'video' && (
                                    <div className="aspect-video bg-black relative">
                                        <video controls className="w-full h-full object-contain outline-none" src={lesson.content_url}>
                                            {(t.addedTranslations_2026?.['المتصفح لا يدعم تشغيل الفيديو'] || 'المتصفح لا يدعم تشغيل الفيديو')}
                                                                                    </video>
                                    </div>
                                )}
                                {lesson.content_url && lesson.type === 'audio' && (
                                    <div className="p-8 flex flex-col items-center justify-center bg-gradient-to-br from-purple-500/10 to-blue-500/10 min-h-[200px]">
                                        <Mic className="w-16 h-16 text-purple-500 mb-6 opacity-50" />
                                        <audio controls className="w-full max-w-md outline-none" src={lesson.content_url}>
                                            {(t.addedTranslations_2026?.['المتصفح لا يدعم تشغيل الصوت'] || 'المتصفح لا يدعم تشغيل الصوت')}
                                                                                    </audio>
                                    </div>
                                )}
                                {!lesson.content_url && (
                                    <div className="aspect-video bg-muted/30 flex flex-col items-center justify-center text-center p-6">
                                        <FileText className="w-12 h-12 text-muted-foreground opacity-40 mb-4" />
                                        <p className="text-muted-foreground font-bold text-lg">{(t.addedTranslations_2026?.['محتوى نصي فقط'] || 'محتوى نصي فقط')}</p>
                                        <p className="text-sm text-muted-foreground/70 mt-1">{(t.addedTranslations_2026?.['لا يوجد ملف وسائط مرفق مع هذا الدرس'] || 'لا يوجد ملف وسائط مرفق مع هذا الدرس')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Lesson Description */}
                    <div className="bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[40px] p-6 sm:p-8 shadow-lg shadow-black/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                        <h3 className="font-black text-xl text-foreground mb-6 flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                                <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            {(t.addedTranslations_2026?.['الشرح التفصيلي للدرس'] || 'الشرح التفصيلي للدرس')}
                                                    </h3>
                        <div className="prose prose-sm dark:prose-invert max-w-none relative z-10">
                            {lesson.description ? (
                                <p className="leading-loose text-muted-foreground font-medium text-base bg-background/50 p-6 rounded-3xl border border-white/5 shadow-inner whitespace-pre-wrap">
                                    {lesson.description}
                                </p>
                            ) : (
                                <div className="flex items-center justify-center p-8 bg-muted/30 rounded-3xl border border-dashed border-border text-muted-foreground font-bold">
                                    {(t.addedTranslations_2026?.['لا يوجد وصف مرفق مع هذا الدرس'] || 'لا يوجد وصف مرفق مع هذا الدرس')}
                                                                        </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Action Panel */}
                    <div className="bg-gradient-to-br from-card to-card/50 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] p-6 shadow-2xl shadow-black/5 sticky top-8">
                        <div className="mb-6 pb-6 border-b border-white/10 dark:border-white/5">
                            <h3 className="font-black text-xl text-foreground flex items-center gap-3 mb-2">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                                {(t.addedTranslations_2026?.['قرار الإشراف'] || 'قرار الإشراف')}
                                                            </h3>
                            <p className="text-sm font-semibold text-muted-foreground">
                                {(t.addedTranslations_2026?.['يرجى مراجعة محتوى الدرس بدقة قبل اتخاذ القرار بالاعتماد أو الرفض.'] || 'يرجى مراجعة محتوى الدرس بدقة قبل اتخاذ القرار بالاعتماد أو الرفض.')}
                                                            </p>
                        </div>

                        {lesson.status === 'pending_review' ? (
                            <div className="space-y-4">
                                <button
                                    onClick={() => handleAction('approved')}
                                    disabled={actionLoading}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                                    {(t.addedTranslations_2026?.['اعتماد ونشر الدرس'] || 'اعتماد ونشر الدرس')}
                                                                    </button>
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={actionLoading}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white font-black rounded-2xl border border-rose-500/20 transition-all hover:shadow-lg hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
                                >
                                    <XCircle className="w-6 h-6" />
                                    {(t.addedTranslations_2026?.['رفض المحتوى'] || 'رفض المحتوى')}
                                                                    </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {lesson.status === 'approved' ? (
                                    <div className="flex flex-col items-center justify-center py-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
                                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                                            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <p className="font-black text-lg text-emerald-700 dark:text-emerald-400">{(t.addedTranslations_2026?.['الدرس معتمد مسبقاً'] || 'الدرس معتمد مسبقاً')}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                                        <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-3">
                                            <XCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                                        </div>
                                        <p className="font-black text-lg text-rose-700 dark:text-rose-400">{(t.addedTranslations_2026?.['الدرس مرفوض مسبقاً'] || 'الدرس مرفوض مسبقاً')}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Rejection Reason (If Rejected) */}
                    {lesson.status === 'rejected' && lesson.rejection_reason && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-[32px] p-6 shadow-inner animate-in slide-in-from-top-4">
                            <h4 className="text-sm font-black uppercase text-rose-700 dark:text-rose-400 flex items-center gap-2 mb-3">
                                <AlertCircle className="w-5 h-5" /> {(t.addedTranslations_2026?.['سبب الرفض'] || 'سبب الرفض')}
                                                            </h4>
                            <p className="text-sm font-bold text-rose-800 dark:text-rose-300 leading-relaxed bg-white/40 dark:bg-black/20 p-4 rounded-2xl border border-rose-500/10">
                                {lesson.rejection_reason}
                            </p>
                        </div>
                    )}

                    {/* Attachments */}
                    {lesson.attachments && lesson.attachments.length > 0 && (
                        <div className="bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[32px] p-6 shadow-lg shadow-black/5">
                            <h3 className="font-black text-lg text-foreground mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                {(t.addedTranslations_2026?.['المرفقات الإضافية'] || 'المرفقات الإضافية')}
                                                            </h3>
                            <div className="space-y-3">
                                {lesson.attachments.map((url, i) => (
                                    <a 
                                        key={i} 
                                        href={url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-4 bg-background hover:bg-muted/50 border border-border rounded-2xl transition-colors group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0 group-hover:scale-110 transition-transform">
                                            <Download className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                            {(t.addedTranslations_2026?.['تحميل المرفق'] || 'تحميل المرفق')} {i + 1}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card/95 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        
                        <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-rose-500/10 to-transparent pointer-events-none" />

                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 mb-6 shadow-inner">
                                <AlertCircle className="w-8 h-8 text-rose-500" />
                            </div>
                            
                            <h3 className="text-2xl font-black text-foreground mb-2">{(t.addedTranslations_2026?.['توضيح سبب الرفض'] || 'توضيح سبب الرفض')}</h3>
                            <p className="text-sm font-semibold text-muted-foreground mb-6">
                                {(t.addedTranslations_2026?.['يرجى توضيح سبب رفض المحتوى بدقة ليتمكن الأستاذ من تدارك الأخطاء وتعديل الدرس.'] || 'يرجى توضيح سبب رفض المحتوى بدقة ليتمكن الأستاذ من تدارك الأخطاء وتعديل الدرس.')}
                                                            </p>
                            
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder={(t.addedTranslations_2026?.['اكتب سبب الرفض هنا بوضوح...'] || 'اكتب سبب الرفض هنا بوضوح...')}
                                className="w-full p-5 bg-background border-2 border-border rounded-2xl text-sm font-bold text-foreground resize-none h-40 focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-inner"
                                required
                            />
                            
                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => { setShowRejectModal(false); setRejectionReason('') }}
                                    className="flex-1 px-6 py-4 bg-muted text-foreground font-black rounded-2xl hover:bg-muted/80 transition-colors"
                                >
                                    {(t.addedTranslations_2026?.['تراجع وإلغاء'] || 'تراجع وإلغاء')}
                                                                    </button>
                                <button
                                    onClick={() => { handleAction('rejected'); setShowRejectModal(false) }}
                                    disabled={!rejectionReason.trim() || actionLoading}
                                    className="flex-1 px-6 py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all disabled:opacity-50 shadow-lg shadow-rose-500/20 hover:shadow-xl hover:-translate-y-1 disabled:hover:translate-y-0"
                                >
                                    {(t.addedTranslations_2026?.['تأكيد الرفض'] || 'تأكيد الرفض')}
                                                                    </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
