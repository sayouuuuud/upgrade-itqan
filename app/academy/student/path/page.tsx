"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { 
  Route, BookOpen, Clock, ChevronLeft, Award, PlayCircle, BookMarked, HelpCircle
} from 'lucide-react'

interface TajweedPath {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  total_stages: number
  estimated_days: number
  subject: string
  enrollment_status?: 'active' | 'completed' | 'paused' | 'dropped' | null
  stages_completed?: number
  price?: number
  enrollment_type?: 'free' | 'paid'
  tags?: string[]
}

export default function StudentLearningPathPage() {
  const { t } = useI18n()
  const [paths, setPaths] = useState<TajweedPath[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPaths() {
      try {
        const res = await fetch('/api/student/tajweed-paths?subject_scope=academy')
        if (res.ok) {
          const data = await res.json()
          setPaths(data.paths || [])
        }
      } catch (error) {
        console.error('Failed to fetch paths:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPaths()
  }, [])

  const levelLabels = {
    beginner: 'مبتدئ',
    intermediate: 'متوسط',
    advanced: 'متقدم'
  }

  const levelColors = {
    beginner: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    intermediate: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    advanced: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
  }

  const subjectLabels: { [key: string]: string } = {
    fiqh: 'الفقه الإسلامي',
    aqeedah: 'العقيدة الإسلامية',
    seerah: 'السيرة النبوية',
    tafsir: 'التفسير وعلوم القرآن',
    tajweed: 'التجويد والمقرأة'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse text-sm">جاري تحميل المسارات الأكاديمية...</p>
      </div>
    )
  }

  // Filter paths
  const myPaths = paths.filter(p => p.enrollment_status === 'active')
  const availablePaths = paths.filter(p => p.enrollment_status !== 'active')

  return (
    <div className="space-y-10 py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-8 sm:p-12 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute right-1/3 -top-12 w-32 h-32 rounded-full bg-white/5 blur-lg pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-full bg-emerald-700/50 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
            المسارات التعليمية الأكاديمية
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-4 tracking-tight leading-tight">
            ارتقِ بمعرفتك الشرعية عبر مسارات أكاديمية متكاملة
          </h1>
          <p className="text-emerald-100/90 mt-4 text-base sm:text-lg leading-relaxed font-light">
            تعلم الفقه، العقيدة، السيرة والتفسير في مسارات دراسية منظمة، مرتبطة مباشرة بالدورات والدروس لضمان التحصيل العلمي الأمثل.
          </p>
        </div>
      </div>

      {/* Enrolled/Registered Paths Section */}
      {myPaths.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-r-4 border-emerald-600 pr-3">
            <h2 className="text-2xl font-bold text-foreground">مساراتي التعليمية النشطة</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              {myPaths.length}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myPaths.map((path) => {
              const progressPercent = path.total_stages > 0 
                ? Math.round(((path.stages_completed || 0) / path.total_stages) * 100) 
                : 0

              return (
                <Link
                  key={path.id}
                  href={`/academy/student/path/${path.id}`}
                  className="group relative flex flex-col justify-between bg-card hover:bg-accent/40 rounded-2xl border border-border/80 hover:border-emerald-500/40 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 overflow-hidden"
                >
                  <div className="p-6 space-y-4">
                    {/* Header: Subject & Level */}
                    <div className="flex justify-between items-center gap-2">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {subjectLabels[path.subject] || path.subject}
                      </span>
                      <span className={cn("px-2.5 py-1 text-xs font-medium rounded-full", levelColors[path.level])}>
                        {levelLabels[path.level]}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-emerald-600 transition-colors leading-snug">
                        {path.title}
                      </h3>
                      {path.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                          {path.description}
                        </p>
                      )}
                    </div>

                    {/* Progress Info */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">نسبة إنجاز المسار</span>
                        <span className="text-emerald-600 font-semibold">{progressPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500 group-hover:bg-emerald-400"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground/80 mt-1">
                        أكملت {path.stages_completed || 0} من أصل {path.total_stages} دورة
                      </p>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="border-t border-border/60 bg-muted/20 px-6 py-4 flex justify-between items-center group-hover:bg-muted/40 transition-colors">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      واصل التعلم الآن
                    </span>
                    <ChevronLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Paths Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-r-4 border-emerald-600 pr-3">
          <h2 className="text-2xl font-bold text-foreground">المسارات التعليمية المتاحة</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            {availablePaths.length}
          </span>
        </div>

        {availablePaths.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePaths.map((path) => (
              <Link
                key={path.id}
                href={`/academy/student/path/${path.id}`}
                className="group relative flex flex-col justify-between bg-card hover:bg-accent/40 rounded-2xl border border-border/80 hover:border-emerald-500/40 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 overflow-hidden"
              >
                <div>
                  {/* Thumbnail / Header Gradient Banner */}
                  <div className="h-32 bg-gradient-to-br from-emerald-700/90 to-teal-800 relative flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    {path.thumbnail_url ? (
                      <img 
                        src={path.thumbnail_url} 
                        alt={path.title} 
                        className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" 
                      />
                    ) : (
                      <BookMarked className="w-12 h-12 text-white/20 absolute right-4 bottom-2" />
                    )}
                    <h3 className="relative z-10 text-white font-bold text-center text-lg leading-snug drop-shadow-sm px-2">
                      {path.title}
                    </h3>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4">
                    {/* Level and Subject Badges */}
                    <div className="flex justify-between items-center gap-2">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                        {subjectLabels[path.subject] || path.subject}
                      </span>
                      <span className={cn("px-2.5 py-1 text-xs font-medium rounded-full", levelColors[path.level])}>
                        {levelLabels[path.level]}
                      </span>
                    </div>

                    {/* Description */}
                    {path.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {path.description}
                      </p>
                    )}

                    {/* Metadata: stages & hours */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        {path.total_stages} دورة
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        {path.estimated_days} ساعة تقديرية
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action: Price / Button */}
                <div className="border-t border-border/60 bg-muted/10 px-6 py-4 flex justify-between items-center group-hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">التسجيل</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {path.enrollment_type === 'paid' ? `${path.price} ر.س` : 'مجاني بالكامل'}
                    </span>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-medium group-hover:bg-emerald-500 transition-colors flex items-center gap-1">
                    عرض التفاصيل
                    <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/20 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-6">
            <HelpCircle className="w-12 h-12 text-muted-foreground/60 mb-3" />
            <h3 className="text-base font-semibold">لا توجد مسارات متاحة حالياً</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              تم تسجيلك بالفعل في كافة المسارات المتاحة، أو سيتم طرح مسارات دراسية جديدة قريباً.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
