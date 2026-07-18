"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen, HelpCircle, UserCheck, BarChart3, Clock,
  CheckCircle, ArrowLeft, Loader2, Video, Mic, FileText, TrendingUp,
  ShieldCheck, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

interface Stats {
  pendingLessons: number
  totalLessons: number
  fiqhUnanswered: number
  fiqhTotal: number
}

interface PendingLesson {
  id: string
  title: string
  course_name: string
  teacher_name: string
  type: string
  created_at: string
}

const typeIcon: Record<string, any> = { video: Video, audio: Mic, text: FileText }

export default function AcademySupervisorDashboard() {
  const { t } = useI18n()
  const academy = (t as any).academy as Record<string, string> | undefined
  const a = t.admin
  const [stats, setStats] = useState<Stats>({ pendingLessons: 0, totalLessons: 0, fiqhUnanswered: 0, fiqhTotal: 0 })
  const [recentLessons, setRecentLessons] = useState<PendingLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [coursesRes, fiqhRes, meRes] = await Promise.all([
          fetch('/api/academy/admin/courses?include_lessons=true&lesson_status=pending_review'),
          fetch('/api/academy/fiqh?view=inbox&status=all'),
          fetch('/api/auth/me'),
        ])

        let pending: PendingLesson[] = []
        let totalLessons = 0
        if (coursesRes.ok) {
          const d = await coursesRes.json()
          for (const course of d.courses || []) {
            for (const lesson of course.lessons || []) {
              totalLessons++
              if (lesson.status === 'pending_review') {
                pending.push({
                  id: lesson.id,
                  title: lesson.title,
                  course_name: course.title,
                  teacher_name: course.teacher_name || a.svUnassigned,
                  type: lesson.type || 'text',
                  created_at: lesson.created_at,
                })
              }
            }
          }
        }

        let fiqhUnanswered = 0
        let fiqhTotal = 0
        if (fiqhRes.ok) {
          const d = await fiqhRes.json()
          const c = d.counts || {}
          fiqhTotal = c.all ?? (d.questions || []).length
          fiqhUnanswered = c.open ?? (d.questions || []).filter((q: any) => q.answer === null).length
        }

        if (meRes.ok) {
          const d = await meRes.json()
          setName(d.user?.name || '')
        }

        setStats({ pendingLessons: pending.length, totalLessons, fiqhUnanswered, fiqhTotal })
        setRecentLessons(pending.slice(0, 5))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const statCards = [
    { label: a.svqPendingReviews, value: stats.pendingLessons, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', href: '/academy/supervisor/content' },
    { label: a.svTotalLessons, value: stats.totalLessons, icon: BookOpen, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', href: '/academy/supervisor/content' },
    { label: a.svPendingFiqh, value: stats.fiqhUnanswered, icon: HelpCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', href: '/academy/fiqh-supervisor/questions' },
    { label: a.svTotalQuestions, value: stats.fiqhTotal, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', href: '/academy/fiqh-supervisor/questions' },
  ]

  const quickLinks = [
    { href: '/academy/supervisor/content', label: a.svContentSupervision, desc: a.svContentSupervisionDesc, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { href: '/academy/fiqh-supervisor/questions', label: a.svFiqhQuestions, desc: a.svFiqhQuestionsDesc, icon: HelpCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { href: '/academy/supervisor/teachers', label: a.svTeacherVerification, desc: a.svTeacherVerificationDesc, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto relative min-h-screen">
      
      {/* Decorative Background Effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full filter blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full filter blur-[100px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] p-8 shadow-2xl shadow-black/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-2 shadow-inner">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-bold tracking-wide uppercase">{a.svGeneralSupervisor}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight flex flex-col gap-2">
            {a.svWelcome} 
            <span>
              {name || a.svWelcomeName}
            </span>
          </h1>
          <p className="text-muted-foreground/80 font-medium max-w-2xl text-lg leading-relaxed">
            {a.svOverviewDesc}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-card/30 backdrop-blur-xl rounded-[40px] border border-white/10 shadow-xl">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <Loader2 className="absolute inset-0 m-auto w-8 h-8 animate-spin text-primary opacity-50" />
          </div>
          <p className="text-lg font-bold text-muted-foreground animate-pulse">{a.svLoadingDashboard}</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Stats Grid (Bento Style) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map(({ label, value, icon: Icon, color, bg, border, href }) => (
              <Link 
                key={label} 
                href={href}
                className={cn(
                  "relative group bg-card/60 backdrop-blur-xl border rounded-[32px] p-6 hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 overflow-hidden cursor-pointer",
                  border
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-50 pointer-events-none" />
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${bg} opacity-50 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700`} />
                
                <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                  <div className="flex items-center justify-between">
                    <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform duration-500 border border-white/10`}>
                      <Icon className={`w-7 h-7 ${color}`} />
                    </div>
                  </div>
                  <div>
                    <p className={`text-5xl font-black tracking-tighter ${color} drop-shadow-sm`}>{value}</p>
                    <p className="text-sm text-muted-foreground mt-2 font-bold uppercase tracking-widest">{label}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Links */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <h3 className="font-black text-xl px-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                {a.svQuickAccess}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {quickLinks.map(({ href, label, desc, icon: Icon, color, bg }) => (
                  <Link 
                    key={href} 
                    href={href} 
                    className="flex items-center gap-4 bg-card/60 backdrop-blur-md border border-border rounded-3xl p-5 hover:border-primary/40 hover:bg-card hover:shadow-lg transition-all group overflow-hidden relative"
                  >
                    <div className="absolute right-0 top-0 w-2 h-full bg-primary/20 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom" />
                    <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center shrink-0 border border-white/5 shadow-inner group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{label}</p>
                      <p className="text-xs font-semibold text-muted-foreground mt-1 line-clamp-1">{desc}</p>
                    </div>
                    <ArrowLeft className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:-translate-x-1 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Lessons Box */}
            <div className="lg:col-span-2">
              <div className="bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[40px] overflow-hidden shadow-xl shadow-black/5 h-full flex flex-col relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
                
                <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 dark:border-white/5 bg-white/5 dark:bg-black/5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
                      <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h2 className="font-black text-foreground text-xl">{a.svPendingLessonsTitle}</h2>
                      <p className="text-xs font-semibold text-muted-foreground mt-1">{a.svPendingLessonsDesc}</p>
                    </div>
                  </div>
                  <Link href="/academy/supervisor/content" className="text-sm font-bold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 group/btn">
                    {a.svViewAll}
                    <ArrowLeft className="w-4 h-4 group-hover/btn:-translate-x-1 transition-transform" />
                  </Link>
                </div>
                
                <div className="flex-1 relative z-10">
                  {recentLessons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center h-full">
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-500/20">
                        <CheckCircle className="w-8 h-8 text-emerald-500 opacity-80" />
                      </div>
<p className="text-lg font-black text-foreground">{a.svNoPendingLessons}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {a.svNoPendingLessonsDesc}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {recentLessons.map(lesson => {
                        const Icon = typeIcon[lesson.type] || FileText
                        return (
                          <Link 
                            key={lesson.id} 
                            href="/academy/supervisor/content" 
                            className="flex items-center gap-4 bg-white/40 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-white/5 border border-white/20 dark:border-white/5 p-5 rounded-[24px] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group/item"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-inner group-hover/item:scale-110 transition-transform">
                              <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="text-base font-bold text-foreground line-clamp-1 group-hover/item:text-primary transition-colors">
                                {lesson.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold text-muted-foreground">
                                <span className="bg-muted px-2 py-1 rounded-md">{lesson.course_name}</span>
                                <span className="bg-muted px-2 py-1 rounded-md">{lesson.teacher_name}</span>
                              </div>
                            </div>
                            <span className="shrink-0 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                              {a.svUnderReview}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
