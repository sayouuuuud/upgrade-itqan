"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen, HelpCircle, UserCheck, BarChart3, Clock,
  CheckCircle, ArrowLeft, Loader2, Video, Mic, FileText, TrendingUp
} from 'lucide-react'

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
                  teacher_name: course.teacher_name || 'غير محدد',
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
    { label: 'دروس تنتظر المراجعة', value: stats.pendingLessons, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', href: '/academy/supervisor/content' },
    { label: 'إجمالي الدروس', value: stats.totalLessons, icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10', href: '/academy/supervisor/content' },
    { label: 'أسئلة فقهية معلقة', value: stats.fiqhUnanswered, icon: HelpCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', href: '/academy/fiqh-supervisor/questions' },
    { label: 'إجمالي الأسئلة', value: stats.fiqhTotal, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', href: '/academy/fiqh-supervisor/questions' },
  ]

  const quickLinks = [
    { href: '/academy/supervisor/content', label: 'إشراف المحتوى', desc: 'مراجعة واعتماد الدروس', icon: BookOpen },
    { href: '/academy/fiqh-supervisor/questions', label: 'الأسئلة الفقهية', desc: 'الإجابة على أسئلة الطلاب', icon: HelpCircle },
    { href: '/academy/supervisor/teachers', label: 'توثيق المدرسين', desc: 'مراجعة وتوثيق المدرسين', icon: UserCheck },
    { href: '/academy/supervisor/quality', label: 'مراقبة الجودة', desc: 'متابعة أداء المدرسين', icon: BarChart3 },
  ]

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-foreground">
          {name ? `مرحباً، ${name}` : 'لوحة المشرف'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          نظرة عامة على مهام الإشراف — مراجعة المحتوى، الأسئلة الفقهية، وجودة المدرسين
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map(({ label, value, icon: Icon, color, bg, href }) => (
              <Link key={label} href={href} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className={`text-3xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickLinks.map(({ href, label, desc, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-4 bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:bg-muted/30 transition-colors group">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </Link>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-foreground text-sm">دروس تنتظر المراجعة</h2>
              </div>
              <Link href="/academy/supervisor/content" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                عرض الكل
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentLessons.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  لا توجد دروس تنتظر المراجعة
                </div>
              ) : recentLessons.map(lesson => {
                const Icon = typeIcon[lesson.type] || FileText
                return (
                  <Link key={lesson.id} href="/academy/supervisor/content" className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors group">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {lesson.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {lesson.course_name} · {lesson.teacher_name}
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      ينتظر
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
