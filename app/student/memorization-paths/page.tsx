"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BookOpen, ChevronRight, CheckCircle2, Lock, Pause, Play,
  Search,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

type Path = {
  id: string
  title: string
  description: string | null
  unit_type: string
  total_units: number
  level: string
  estimated_days: number | null
  enrollment?: {
    id: string
    status: string
    units_completed: number
    last_activity_at: string | null
    completed_at: string | null
  } | null
}

export default function StudentMemorizationPathsPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  
  const [paths, setPaths] = useState<Path[]>([])
  const [enrolled, setEnrolled] = useState<Path[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [migrationMissing, setMigrationMissing] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/student/memorization-paths?scope=all"),
        fetch("/api/student/memorization-paths?scope=enrolled"),
      ])
      const d1 = await r1.json()
      const d2 = await r2.json()
      if (d1.notice === "migration_not_applied" || d2.notice === "migration_not_applied") {
        setMigrationMissing(true)
      }
      setPaths(d1.paths || [])
      setEnrolled(d2.paths || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  function formatDigits(n: number | string): string {
    if (locale === 'ar') {
      return String(n).replace(/\d/g, d => (t.addedTranslations_2026?.['٠١٢٣٤٥٦٧٨٩'] || '٠١٢٣٤٥٦٧٨٩')[Number(d)])
    }
    return String(n)
  }

  const filteredAll = paths.filter(p =>
    !search.trim() ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-600 to-teal-700 text-white p-8 sm:p-12 shadow-2xl border border-emerald-500/20">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-2xl text-center md:text-start mx-auto md:mx-0">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-sm mx-auto md:mx-0">
            <BookOpen className="w-4 h-4 text-emerald-200" />
            <span className="text-emerald-50">{t.memorizationPathsPage?.badgeTitle}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {isAr ? (
              <>
                {(t.addedTranslations_2026?.['مسارات'] || 'مسارات')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-emerald-50">{(t.addedTranslations_2026?.['الحفظ'] || 'الحفظ')}</span>
              </>
            ) : (
              <>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-emerald-50">Memorization</span> Paths
              </>
            )}
          </h1>
          <p className="text-emerald-100/90 text-base sm:text-lg font-medium leading-relaxed max-w-xl mx-auto md:mx-0">
            {t.memorizationPathsPage?.description}
          </p>
        </div>
      </div>

      {migrationMissing && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
            {t.memorizationPathsPage?.migrationMissing}
          </p>
        </div>
      )}

      <Tabs defaultValue="enrolled" className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-2 rounded-2xl border border-border shadow-sm">
          <TabsList className="bg-transparent border-none p-0 h-auto gap-2 flex-wrap">
            <TabsTrigger 
              value="enrolled" 
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-6 py-2.5 font-bold transition-all"
            >
              {t.memorizationPathsPage?.tabs.myPaths.replace('{count}', formatDigits(enrolled.length))}
            </TabsTrigger>
            <TabsTrigger 
              value="browse"
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-6 py-2.5 font-bold transition-all"
            >
              {t.memorizationPathsPage?.tabs.browse.replace('{count}', formatDigits(paths.length))}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="m-0 sm:w-72 mt-2 sm:mt-0">
            <div className="relative group">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors", isAr ? "right-3" : "left-3")} />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.memorizationPathsPage?.tabs.searchPlaceholder}
                className={cn("bg-muted/50 border-transparent focus:bg-background focus:border-emerald-500 rounded-xl h-10 transition-all", isAr ? "pe-10" : "ps-10")}
              />
            </div>
          </TabsContent>
        </div>

        <TabsContent value="enrolled" className="mt-0 outline-none">
          {loading ? (
            <Loading />
          ) : enrolled.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-3xl py-20 text-center shadow-sm">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <BookOpen className="w-10 h-10 text-emerald-600/50 dark:text-emerald-400/50" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t.memorizationPathsPage?.emptyEnrolledTitle}</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {t.memorizationPathsPage?.emptyEnrolledDesc}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-start *:w-full">
              {enrolled.map(p => <EnrolledCard key={p.id} path={p} formatDigits={formatDigits} t={t} locale={locale} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="browse" className="mt-0 outline-none space-y-6">
          {/* Show search only on mobile if it wrapped, else it's in the header */}
          <div className="sm:hidden relative group">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors", isAr ? "right-3" : "left-3")} />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.memorizationPathsPage?.tabs.searchPlaceholder}
              className={cn("bg-card border-border focus:border-emerald-500 rounded-xl h-11 transition-all shadow-sm", isAr ? "pe-10" : "ps-10")}
            />
          </div>

          {loading ? (
            <Loading />
          ) : filteredAll.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-3xl py-20 text-center shadow-sm">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Search className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <p className="text-lg font-bold text-foreground">{t.memorizationPathsPage?.emptyBrowseTitle}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-start *:w-full">
              {filteredAll.map(p => <BrowseCard key={p.id} path={p} formatDigits={formatDigits} t={t} locale={locale} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Loading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse w-full">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-card rounded-3xl border border-border/60 p-6 flex flex-col space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-muted shrink-0" />
          <div className="h-6 bg-muted rounded w-3/4" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-muted rounded" />
            <div className="h-6 w-20 bg-muted rounded" />
          </div>
          <div className="space-y-2 mt-4">
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-5/6" />
          </div>
          <div className="h-10 bg-muted rounded-xl w-full mt-6" />
        </div>
      ))}
    </div>
  )
}

function EnrolledCard({ path, formatDigits, t, locale }: { path: Path, formatDigits: (n: number) => string, t: any, locale: string }) {
  const e = path.enrollment
  const completed = e?.units_completed || 0
  const total = path.total_units || 1
  const pct = Math.round((completed / total) * 100)
  const isAr = locale === 'ar'
  
  return (
    <div className="group bg-card rounded-3xl border border-border/60 p-6 flex flex-col hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20">
          <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        {e?.status === "completed" ? (
          <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t.memorizationPathsPage?.enrolledStatusCompleted}
          </div>
        ) : e?.status === "paused" ? (
          <div className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border border-amber-200 dark:border-amber-500/20">
            <Pause className="w-3.5 h-3.5" /> {t.memorizationPathsPage?.enrolledStatusPaused}
          </div>
        ) : null}
      </div>

      <Link
        href={`/student/memorization-paths/${path.id}`}
        className="font-black text-xl text-foreground group-hover:text-emerald-600 transition-colors line-clamp-2 mb-3"
      >
        {path.title}
      </Link>

      <div className="flex flex-wrap gap-2 mb-6">
        <span className="px-3 py-1 bg-muted rounded-lg text-xs font-bold text-muted-foreground border border-border/50">
          {t.memorizationPathsPage?.types[path.unit_type] || path.unit_type}
        </span>
        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
          {t.memorizationPathsPage?.levels[path.level] || path.level}
        </span>
      </div>

      <div className="mt-auto pt-4 border-t border-border/50 space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <span className="block text-xs font-bold text-muted-foreground mb-1">{t.memorizationPathsPage?.progressLabel}</span>
            <span className="text-2xl font-black text-foreground leading-none">{formatDigits(completed)}<span className="text-base text-muted-foreground font-bold">/{formatDigits(total)}</span></span>
          </div>
          <span className="text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md text-sm">{formatDigits(pct)}%</span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 relative"
            style={{ width: `${pct}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] -skew-x-12" />
          </div>
        </div>
      </div>

      <Link 
        href={`/student/memorization-paths/${path.id}`}
        className={cn(
          "mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all duration-300",
          pct === 100 
            ? "bg-muted text-foreground hover:bg-muted/80" 
            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30"
        )}
      >
        {pct === 100 ? t.memorizationPathsPage?.reviewBtn : pct > 0 ? t.memorizationPathsPage?.continueBtn : t.memorizationPathsPage?.startBtn}
        <ChevronRight className="w-5 h-5 rtl:rotate-180" />
      </Link>
    </div>
  )
}

function BrowseCard({ path, formatDigits, t, locale }: { path: Path, formatDigits: (n: number) => string, t: any, locale: string }) {
  const isAr = locale === 'ar'
  return (
    <div className="group bg-card rounded-3xl border border-border/60 p-6 flex flex-col hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-muted/50 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 flex items-center justify-center shrink-0 transition-colors border border-border/50 group-hover:border-emerald-100 dark:group-hover:border-emerald-500/20">
          <BookOpen className="w-6 h-6 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
        </div>
      </div>

      <Link
        href={`/student/memorization-paths/${path.id}`}
        className="font-black text-xl text-foreground group-hover:text-emerald-600 transition-colors line-clamp-2 mb-3"
      >
        {path.title}
      </Link>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2.5 py-1 bg-muted rounded-md text-xs font-bold text-muted-foreground">
          {t.memorizationPathsPage?.types[path.unit_type] || path.unit_type}
        </span>
        <span className="px-2.5 py-1 bg-muted rounded-md text-xs font-bold text-muted-foreground">
          {t.memorizationPathsPage?.unitsCount.replace('{count}', formatDigits(path.total_units))}
        </span>
        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-md text-xs font-bold text-emerald-700 dark:text-emerald-400">
          {t.memorizationPathsPage?.levels[path.level] || path.level}
        </span>
      </div>

      {path.description && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4 flex-1">
          {path.description}
        </p>
      )}

      {path.estimated_days && (
        <div className="mt-auto mb-5 flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-100 dark:border-amber-500/20 w-fit">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          {t.memorizationPathsPage?.estimatedDays.replace('{days}', formatDigits(path.estimated_days))}
        </div>
      )}

      <Link 
        href={`/student/memorization-paths/${path.id}`}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold bg-muted/50 hover:bg-emerald-600 text-foreground hover:text-white transition-all duration-300 border border-border hover:border-transparent mt-auto"
      >
        {path.enrollment ? t.memorizationPathsPage?.continueBtn : t.memorizationPathsPage?.startBtn}
        <ChevronRight className="w-5 h-5 rtl:rotate-180" />
      </Link>
    </div>
  )
}
