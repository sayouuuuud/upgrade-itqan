'use client'

import { useState, useEffect, use, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Loader2,
  Shield,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  MessageSquare,
  Calendar,
  Mic,
  GraduationCap,
  ShieldCheck,
  Lock,
  Unlock,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { SURAHS } from '@/lib/quran-surahs'
import { toast } from 'sonner'

interface Restriction {
  id: string
  restriction_type: string
  target_id: string
  created_at: string
}

interface PathOption {
  id: string
  title: string
  level: string | null
}

interface CourseOption {
  id: string
  title: string
}

interface ChildInfo {
  id: string
  name: string
  avatar_url: string | null
}

const FEATURES = [
  { id: 'messaging', icon: MessageSquare, color: 'blue' as const },
  { id: 'scheduling', icon: Calendar, color: 'emerald' as const },
]

const featureLabels: Record<string, { ar: string; en: string }> = {
  messaging: { ar: 'الرسائل', en: 'Messaging' },
  scheduling: { ar: 'الجدولة', en: 'Scheduling' },
}

const featureDescriptions: Record<string, { ar: string; en: string }> = {
  messaging: {
    ar: 'منع الابن من إرسال واستقبال الرسائل',
    en: 'Prevent your child from sending and receiving messages',
  },
  scheduling: {
    ar: 'منع الابن من حجز جلسات جديدة',
    en: 'Prevent your child from booking new sessions',
  },
}

export default function RestrictionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight

  const [child, setChild] = useState<ChildInfo | null>(null)
  const [restrictions, setRestrictions] = useState<Restriction[]>([])
  const [memPaths, setMemPaths] = useState<PathOption[]>([])
  const [tajPaths, setTajPaths] = useState<PathOption[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/academy/parent/children/${id}/restrictions`)
      const data = await res.json()
      if (res.ok) {
        setChild(data.child || null)
        setRestrictions(data.restrictions || [])
        setMemPaths(data.paths?.memorization || [])
        setTajPaths(data.paths?.tajweed || [])
        setCourses(data.courses || [])
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const isBlocked = (type: string, targetId: string) =>
    restrictions.some(
      (r) => r.restriction_type === type && r.target_id === targetId.toString()
    )

  const countByType = (type: string) =>
    restrictions.filter((r) => r.restriction_type === type).length

  const toggle = async (type: string, targetId: string, nextBlocked: boolean) => {
    const key = `${type}:${targetId}`
    setSavingKey(key)
    // optimistic update
    setRestrictions((prev) => {
      if (nextBlocked) {
        if (prev.some((r) => r.restriction_type === type && r.target_id === targetId.toString())) {
          return prev
        }
        return [
          ...prev,
          {
            id: `tmp-${key}`,
            restriction_type: type,
            target_id: targetId.toString(),
            created_at: new Date().toISOString(),
          },
        ]
      }
      return prev.filter(
        (r) => !(r.restriction_type === type && r.target_id === targetId.toString())
      )
    })
    try {
      const res = await fetch(`/api/academy/parent/children/${id}/restrictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restriction_type: type,
          target_id: targetId.toString(),
          blocked: nextBlocked,
        }),
      })
      if (res.ok) {
        await load()
      } else {
        await load()
        toast.error(isAr ? 'حدث خطأ' : 'Error')
      }
    } catch {
      await load()
      toast.error(isAr ? 'حدث خطأ' : 'Error')
    } finally {
      setSavingKey(null)
    }
  }

  const filteredSurahs = SURAHS.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.name_ar.includes(search) ||
      s.name_en.toLowerCase().includes(q) ||
      s.number.toString() === search
    )
  })

  const blockedCount = restrictions.length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">
            {isAr ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  const tabMeta = [
    { value: 'features', label: isAr ? 'الميزات' : 'Features', count: countByType('feature') },
    { value: 'courses', label: isAr ? 'الدورات' : 'Courses', count: countByType('course') },
    { value: 'surahs', label: isAr ? 'السور' : 'Surahs', count: countByType('surah') },
    {
      value: 'paths',
      label: isAr ? 'المسارات' : 'Paths',
      count: countByType('memorization_path') + countByType('tajweed_path'),
    },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back Link */}
      <Link
        href={`/academy/parent/children/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronIcon className="w-4 h-4" />
        {isAr ? 'العودة لصفحة الابن' : 'Back to child'}
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/40 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/60 via-amber-50/20 to-background dark:from-amber-950/20 dark:via-amber-950/5 p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(245,158,11,0.08),transparent_55%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {child && (
              <Avatar className="w-14 h-14 shrink-0 ring-2 ring-background shadow-sm">
                <AvatarImage src={child.avatar_url || undefined} />
                <AvatarFallback className="bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-lg">
                  {child.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <Shield className="w-3.5 h-3.5" />
                {isAr ? 'تقييد المحتوى' : 'Content Control'}
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground truncate">
                {child?.name || (isAr ? 'إعدادات المحتوى' : 'Content Settings')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-md text-pretty">
                {isAr
                  ? 'تحكم في المحتوى المتاح للابن. كل شيء متاح افتراضياً.'
                  : 'Control what your child can access. Everything is allowed by default.'}
              </p>
            </div>
          </div>

          {/* Active count chip */}
          <div
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 shrink-0 ${
              blockedCount > 0
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {blockedCount > 0 ? (
              <Lock className="w-6 h-6 shrink-0" />
            ) : (
              <ShieldCheck className="w-6 h-6 shrink-0" />
            )}
            <div>
              <p className="text-2xl font-black leading-none">{blockedCount}</p>
              <p className="text-[11px] font-medium mt-1">
                {isAr ? 'تقييد نشط' : 'active limits'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="features" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex w-auto">
            {tabMeta.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="text-xs sm:text-sm gap-1.5">
                {t.label}
                {t.count > 0 && (
                  <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    {t.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Features Tab */}
        <TabsContent value="features" className="mt-6">
          <Card className="rounded-2xl border-border/50 overflow-hidden">
            <CardContent className="p-0 divide-y divide-border/50">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                const blocked = isBlocked('feature', feature.id)
                const key = `feature:${feature.id}`
                const colorClasses = {
                  blue: 'bg-blue-500/10 text-blue-500',
                  emerald: 'bg-emerald-500/10 text-emerald-500',
                }

                return (
                  <RestrictionRow
                    key={feature.id}
                    icon={<Icon className="w-5 h-5" />}
                    iconClass={colorClasses[feature.color]}
                    title={featureLabels[feature.id]?.[locale] || feature.id}
                    subtitle={featureDescriptions[feature.id]?.[locale] || ''}
                    blocked={blocked}
                    saving={savingKey === key}
                    isAr={isAr}
                    onToggle={(checked) => toggle('feature', feature.id, !checked)}
                  />
                )
              })}
            </CardContent>
          </Card>
          <Hint isAr={isAr} />
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="mt-6">
          <Card className="rounded-2xl border-border/50 overflow-hidden">
            <CardContent className="p-0">
              {courses.length === 0 ? (
                <EmptyRow
                  icon={<GraduationCap className="w-10 h-10 text-muted-foreground/30" />}
                  text={isAr ? 'الابن غير مسجل في أي دورة.' : 'Your child is not enrolled in any courses.'}
                />
              ) : (
                <div className="divide-y divide-border/50">
                  {courses.map((course) => {
                    const blocked = isBlocked('course', course.id)
                    const key = `course:${course.id}`
                    return (
                      <RestrictionRow
                        key={course.id}
                        icon={<BookOpen className="w-5 h-5 text-primary" />}
                        iconClass="bg-primary/10"
                        title={course.title}
                        blocked={blocked}
                        saving={savingKey === key}
                        isAr={isAr}
                        onToggle={(checked) => toggle('course', course.id, !checked)}
                      />
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          {courses.length > 0 && <Hint isAr={isAr} />}
        </TabsContent>

        {/* Surahs Tab */}
        <TabsContent value="surahs" className="mt-6 space-y-4">
          <div className="relative">
            <Search
              className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`}
            />
            <Input
              placeholder={isAr ? 'ابحث باسم السورة أو رقمها...' : 'Search by name or number...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`h-11 rounded-xl ${isAr ? 'pr-10' : 'pl-10'}`}
            />
          </div>

          <Card className="rounded-2xl border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="max-h-[55vh] overflow-y-auto divide-y divide-border/50">
                {filteredSurahs.map((s) => {
                  const blocked = isBlocked('surah', s.number.toString())
                  const key = `surah:${s.number}`
                  return (
                    <RestrictionRow
                      key={s.number}
                      icon={<Mic className="w-5 h-5 text-emerald-500" />}
                      iconClass="bg-emerald-500/10"
                      title={isAr ? s.name_ar : s.name_en}
                      subtitle={`${isAr ? 'سورة' : 'Surah'} ${s.number}`}
                      blocked={blocked}
                      saving={savingKey === key}
                      isAr={isAr}
                      onToggle={(checked) => toggle('surah', s.number.toString(), !checked)}
                    />
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paths Tab */}
        <TabsContent value="paths" className="mt-6 space-y-6">
          <PathGroup
            title={isAr ? 'مسارات الحفظ' : 'Memorization Paths'}
            icon={<GraduationCap className="w-5 h-5 text-violet-500" />}
            paths={memPaths}
            type="memorization_path"
            iconClass="bg-violet-500/10"
            isBlocked={isBlocked}
            savingKey={savingKey}
            isAr={isAr}
            onToggle={toggle}
          />
          <PathGroup
            title={isAr ? 'مسارات التجويد' : 'Tajweed Paths'}
            icon={<BookOpen className="w-5 h-5 text-blue-500" />}
            paths={tajPaths}
            type="tajweed_path"
            iconClass="bg-blue-500/10"
            isBlocked={isBlocked}
            savingKey={savingKey}
            isAr={isAr}
            onToggle={toggle}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RestrictionRow({
  icon,
  iconClass,
  title,
  subtitle,
  blocked,
  saving,
  isAr,
  onToggle,
}: {
  icon: React.ReactNode
  iconClass: string
  title: string
  subtitle?: string
  blocked: boolean
  saving: boolean
  isAr: boolean
  onToggle: (checked: boolean) => void
}) {
  return (
    <div
      className={`flex items-center gap-4 p-4 sm:p-5 transition-colors ${
        blocked ? 'bg-amber-50/40 dark:bg-amber-950/10' : 'hover:bg-muted/20'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-foreground truncate">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          {blocked ? (
            <>
              <Lock className="w-3 h-3 text-amber-500" />
              {subtitle || (isAr ? 'محظور — لا يمكن الوصول' : 'Blocked — cannot access')}
            </>
          ) : (
            <>
              <Unlock className="w-3 h-3 text-emerald-500" />
              {subtitle || (isAr ? 'متاح — يمكن الوصول' : 'Allowed — can access')}
            </>
          )}
        </p>
      </div>
      {blocked && (
        <Badge variant="destructive" className="text-[10px] shrink-0 hidden sm:inline-flex">
          {isAr ? 'محظور' : 'Blocked'}
        </Badge>
      )}
      {saving ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
      ) : (
        <Switch checked={!blocked} onCheckedChange={onToggle} />
      )}
    </div>
  )
}

function PathGroup({
  title,
  icon,
  paths,
  type,
  iconClass,
  isBlocked,
  savingKey,
  isAr,
  onToggle,
}: {
  title: string
  icon: React.ReactNode
  paths: PathOption[]
  type: string
  iconClass: string
  isBlocked: (type: string, id: string) => boolean
  savingKey: string | null
  isAr: boolean
  onToggle: (type: string, id: string, next: boolean) => void
}) {
  return (
    <div>
      <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {paths.length === 0 ? (
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            {isAr ? 'لا توجد مسارات متاحة.' : 'No paths available.'}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-border/50 overflow-hidden">
          <CardContent className="p-0 divide-y divide-border/50">
            {paths.map((p) => {
              const blocked = isBlocked(type, p.id)
              const key = `${type}:${p.id}`
              return (
                <RestrictionRow
                  key={p.id}
                  icon={icon}
                  iconClass={iconClass}
                  title={p.title}
                  subtitle={p.level || undefined}
                  blocked={blocked}
                  saving={savingKey === key}
                  isAr={isAr}
                  onToggle={(checked) => onToggle(type, p.id, !checked)}
                />
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function EmptyRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="p-12 flex flex-col items-center justify-center text-center gap-3">
      {icon}
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function Hint({ isAr }: { isAr: boolean }) {
  return (
    <p className="text-xs text-muted-foreground mt-3 px-1 flex items-center gap-1.5">
      <Unlock className="w-3.5 h-3.5 text-emerald-500" />
      {isAr
        ? 'المفتاح المفعّل يعني أن المحتوى متاح. أطفئه للحظر.'
        : 'A toggle that is on means the content is accessible. Turn it off to block.'}
    </p>
  )
}
