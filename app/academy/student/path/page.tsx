"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { 
  Route, BookOpen, Clock, ChevronLeft, Award, PlayCircle, BookMarked, HelpCircle, Layers, Sparkles
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
  const academyStudent = (t as any).academyStudent as Record<string, string> | undefined
  const [paths, setPaths] = useState<TajweedPath[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')

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
    beginner: t.studentPages?.path?.levels?.beginner || 'مبتدئ',
    intermediate: t.studentPages?.path?.levels?.intermediate || 'متوسط',
    advanced: t.studentPages?.path?.levels?.advanced || 'متقدم'
  }

  const levelColors = {
    beginner: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    intermediate: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    advanced: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
  }

  const subjectLabels: { [key: string]: string } = {
    fiqh: t.studentPages?.path?.subjects?.fiqh || 'الفقه',
    aqeedah: t.studentPages?.path?.subjects?.aqeedah || 'العقيدة',
    seerah: t.studentPages?.path?.subjects?.seerah || 'السيرة النبوية',
    tafsir: t.studentPages?.path?.subjects?.tafsir || 'التفسير',
    tajweed: t.studentPages?.path?.subjects?.tajweed || 'التجويد'
  }

  const tabs = [
    { id: 'all', label: t.studentPages?.path?.subjects?.all || 'الكل' },
    { id: 'fiqh', label: t.studentPages?.path?.subjects?.fiqh || 'الفقه' },
    { id: 'aqeedah', label: t.studentPages?.path?.subjects?.aqeedah || 'العقيدة' },
    { id: 'seerah', label: t.studentPages?.path?.subjects?.seerah || 'السيرة النبوية' },
    { id: 'tafsir', label: t.studentPages?.path?.subjects?.tafsir || 'التفسير' }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse text-sm">{t.studentPages?.path?.loading}</p>
      </div>
    )
  }

  // Filter paths by tab
  const filteredPaths = activeTab === 'all' 
    ? paths 
    : paths.filter(p => p.subject === activeTab)

  const myPaths = filteredPaths.filter(p => p.enrollment_status === 'active' || p.enrollment_status === 'paused')
  const completedPaths = filteredPaths.filter(p => p.enrollment_status === 'completed')
  // Available = paths the student is NOT enrolled in. Completed/active paths are
  // shown in their own sections and must not reappear as "available".
  const availablePaths = filteredPaths.filter(p => !p.enrollment_status)

  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white p-10 sm:p-14 shadow-2xl border border-emerald-800/50">
        <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute left-10 -top-20 w-48 h-48 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-emerald-100 text-xs font-bold uppercase tracking-wider backdrop-blur-md mb-6">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            {t.studentPages?.path?.title}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.15]">
            {t.studentPages?.path?.heroTitle}
          </h1>
          <p className="text-emerald-100/90 mt-5 text-lg leading-relaxed font-light max-w-2xl">
            {t.studentPages?.path?.heroDesc}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300",
              activeTab === tab.id 
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" 
                : "bg-card text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 border border-border/60"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Enrolled/Registered Paths Section */}
      {myPaths.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 border-r-4 border-emerald-600 pr-4">
            <h2 className="text-2xl font-bold text-foreground">{t.studentPages?.path?.myPathsTitle}</h2>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              {myPaths.length} {t.studentPages?.path?.pathCountSuffix}
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
                  className="group relative flex flex-col justify-between bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/50 rounded-3xl border border-border/80 hover:border-emerald-500/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 overflow-hidden"
                >
                  <div className="p-6 sm:p-8 space-y-5">
                    {/* Header: Subject & Level */}
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                          {subjectLabels[path.subject] || path.subject}
                        </span>
                      </div>
                      <span className={cn("px-2.5 py-1 text-[10px] font-bold rounded-md border", levelColors[path.level])}>
                        {levelLabels[path.level]}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-extrabold text-xl group-hover:text-emerald-600 transition-colors leading-snug">
                        {path.title}
                      </h3>
                      {path.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                          {path.description}
                        </p>
                      )}
                    </div>

                    {/* Progress Info */}
                    <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-border/40">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-muted-foreground">{t.studentPages?.path?.progressLabel}</span>
                        <span className="text-emerald-600">{progressPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-l from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground/80 font-medium">
                        {(t.studentPages?.path?.completedStagesDetail || 'أكملت {completed} من أصل {total} مرحلة')
                          .replace('{completed}', String(path.stages_completed || 0))
                          .replace('{total}', String(path.total_stages))}
                      </p>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="bg-emerald-600/5 px-6 sm:px-8 py-4 flex justify-between items-center border-t border-emerald-600/10 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 group-hover:text-white flex items-center gap-1 transition-colors">
                      {t.studentPages?.path?.continueLearning}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-emerald-600/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                      <ChevronLeft className="w-4 h-4 text-emerald-700 dark:text-emerald-400 group-hover:text-white group-hover:-translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Completed Paths Section */}
      {completedPaths.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 border-r-4 border-emerald-600 pr-4">
            <h2 className="text-2xl font-bold text-foreground">{t.studentPages?.path?.completedPathsTitle}</h2>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              {completedPaths.length} {t.studentPages?.path?.pathCountSuffix}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedPaths.map((path) => (
              <Link
                key={path.id}
                href={`/academy/student/path/${path.id}`}
                className="group relative flex flex-col justify-between bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/50 rounded-3xl border border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 overflow-hidden"
              >
                <div className="p-6 sm:p-8 space-y-5">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        {subjectLabels[path.subject] || path.subject}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <Award className="w-3 h-3" />
                      {t.studentPages?.path?.statusCompleted}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-xl group-hover:text-emerald-600 transition-colors leading-snug">
                      {path.title}
                    </h3>
                    {path.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {path.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                    <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold leading-relaxed">
                      {t.studentPages?.path?.completedCertificateNotice}
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-600/5 px-6 sm:px-8 py-4 flex justify-between items-center border-t border-emerald-600/10 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 group-hover:text-white transition-colors">
                    {t.studentPages?.path?.reviewPath}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-emerald-600/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                    <ChevronLeft className="w-4 h-4 text-emerald-700 dark:text-emerald-400 group-hover:text-white group-hover:-translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Available Paths Section */}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
        <div className="flex items-center gap-3 border-r-4 border-emerald-600 pr-4">
          <h2 className="text-2xl font-bold text-foreground">
            {activeTab === 'all' 
              ? t.studentPages?.path?.availablePathsTitle 
              : (t.studentPages?.path?.availablePathsSubjectTitle || 'مسارات {subject} المتاحة').replace('{subject}', subjectLabels[activeTab])}
          </h2>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            {availablePaths.length} {t.studentPages?.path?.pathCountSuffix}
          </span>
        </div>

        {availablePaths.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePaths.map((path) => (
              <Link
                key={path.id}
                href={`/academy/student/path/${path.id}`}
                className="group relative flex flex-col justify-between bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/50 rounded-3xl border border-border/80 hover:border-emerald-500/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 overflow-hidden"
              >
                <div>
                  {/* Thumbnail / Header Gradient Banner */}
                  <div className="h-40 bg-gradient-to-br from-emerald-800 to-teal-950 relative flex items-center justify-center p-6 overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500 z-10" />
                    {path.thumbnail_url ? (
                      <img 
                        src={path.thumbnail_url} 
                        alt={path.title} 
                        className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <BookMarked className="w-16 h-16 text-white/10 absolute right-4 bottom-0 transform translate-y-4 translate-x-4" />
                    )}
                    
                    {/* Badge over image */}
                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                       <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-white/20 backdrop-blur-sm text-white border border-white/20">
                        {subjectLabels[path.subject] || path.subject}
                      </span>
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-white/20 backdrop-blur-sm text-white border border-white/20">
                        {levelLabels[path.level]}
                      </span>
                    </div>

                    <h3 className="relative z-20 text-white font-extrabold text-center text-xl sm:text-2xl leading-tight drop-shadow-md">
                      {path.title}
                    </h3>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 sm:p-8 space-y-4">
                    {/* Description */}
                    {path.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {path.description}
                      </p>
                    )}

                    {/* Metadata: stages & hours */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground font-semibold pt-2">
                      <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-border/50">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        {path.total_stages} {t.studentPages?.path?.stageLabel}
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-border/50">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        {path.estimated_days} {t.studentPages?.path?.hourLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="bg-slate-50 dark:bg-slate-900/50 px-6 sm:px-8 py-5 flex justify-between items-center border-t border-border/60">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t.studentPages?.path?.enrollmentLabel}</span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      {path.enrollment_type === 'paid' 
                        ? (t.studentPages?.path?.paidCurrency || '{price} ر.س').replace('{price}', String(path.price))
                        : t.studentPages?.path?.freeBadge}
                    </span>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold group-hover:bg-emerald-500 group-hover:shadow-lg group-hover:shadow-emerald-600/20 transition-all flex items-center gap-1.5">
                    {t.studentPages?.path?.explorePath}
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card border border-dashed border-border/80 rounded-[2rem] flex flex-col items-center justify-center p-6 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{t.studentPages?.path?.noPathsTitle}</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
              {t.studentPages?.path?.noPathsDesc}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
