'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Trophy,
  Clock,
  ChevronRight,
  Loader2,
  LinkIcon,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'

interface DashboardOverview {
  parent: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  }
  summary: {
    total_children: number
    pending_requests: number
    rejected_links: number
    active_count: number
  }
  children: Array<{
    link_id: string
    child_id: string
    child_name: string
    child_avatar: string | null
    relation: string
    linked_at: string
    enrollments: {
      total: number
      active: number
      completed: number
      avg_progress: number
    }
    recitations: {
      total_30d: number
      last_at: string | null
    }
    bookings: {
      upcoming: number
    }
    weekly_activity: {
      recitations: number
      bookings: number
    }
    badges: {
      total: number
    }
  }>
}

const relationLabels: Record<string, { ar: string; en: string }> = {
  father: { ar: 'أب', en: 'Father' },
  mother: { ar: 'أم', en: 'Mother' },
  guardian: { ar: 'ولي أمر', en: 'Guardian' },
  other: { ar: 'أخرى', en: 'Other' },
}

export default function ParentDashboard() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOverview()
  }, [])

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/academy/parent/overview')
      if (res.ok) {
        const data = await res.json()
        setOverview(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

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

  if (!overview) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">{isAr ? 'حدث خطأ' : 'Error loading data'}</p>
      </div>
    )
  }

  const { parent, summary, children } = overview
  const firstName = parent.name.split(' ')[0]

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Hero Greeting */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-background border border-primary/10 p-8 md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(120,119,198,0.08),transparent_50%)]" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                {isAr ? 'لوحة التحكم' : 'Dashboard'}
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
              {isAr ? `مرحباً، ${firstName}` : `Welcome, ${firstName}`}
            </h1>
            <p className="text-muted-foreground font-medium max-w-lg">
              {isAr
                ? 'تابع تقدم أبنائك الأكاديمي من مكان واحد.'
                : 'Track your children\'s academic progress from one place.'}
            </p>
          </div>
          <Button
            asChild
            className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 shrink-0"
          >
            <Link href="/academy/parent/link-child">
              <LinkIcon className="w-4 h-4 me-2" />
              {isAr ? 'ربط ابن جديد' : 'Link New Child'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm rounded-2xl bg-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {isAr ? 'الأبناء' : 'Children'}
                </p>
                <h3 className="text-2xl font-black text-foreground">{summary.active_count}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-2xl bg-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {isAr ? 'المقررات' : 'Courses'}
                </p>
                <h3 className="text-2xl font-black text-foreground">
                  {children.reduce((sum, c) => sum + c.enrollments.total, 0)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-2xl bg-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {isAr ? 'التقدم' : 'Progress'}
                </p>
                <h3 className="text-2xl font-black text-foreground">
                  {children.length > 0
                    ? Math.round(
                        children.reduce((sum, c) => sum + c.enrollments.avg_progress, 0) /
                          children.length
                      )
                    : 0}
                  %
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-2xl bg-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {isAr ? 'الشارات' : 'Badges'}
                </p>
                <h3 className="text-2xl font-black text-foreground">
                  {children.reduce((sum, c) => sum + c.badges.total, 0)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Children Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              {isAr ? 'أبناؤك' : 'Your Children'}
            </h2>
            {children.length > 0 && (
              <Link
                href="/academy/parent/children"
                className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
              >
                {isAr ? 'إدارة' : 'Manage'}
                <ChevronRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
              </Link>
            )}
          </div>

          {children.length === 0 ? (
            <Card className="border-border/50 shadow-sm rounded-2xl bg-card">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <h4 className="text-lg font-bold text-foreground mb-2">
                  {isAr ? 'لا يوجد أبناء مربوطين' : 'No linked children'}
                </h4>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  {isAr
                    ? 'ابدأ بربط حساب ابنك لتتبع تقدمه الأكاديمي.'
                    : "Start by linking your child's account to track their progress."}
                </p>
                <Button asChild className="rounded-xl font-bold">
                  <Link href="/academy/parent/link-child">
                    {isAr ? 'ربط ابن جديد' : 'Link New Child'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {children.map((child) => (
                <Link
                  key={child.link_id}
                  href={`/academy/parent/children/${child.child_id}`}
                  className="block"
                >
                  <Card className="border-border/50 shadow-sm rounded-2xl bg-card overflow-hidden hover:shadow-md hover:border-primary/20 transition-all group cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-5">
                        {/* Avatar */}
                        <Avatar className="w-14 h-14 shrink-0 ring-2 ring-background shadow-sm">
                          <AvatarImage src={child.child_avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                            {child.child_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-foreground truncate">
                              {child.child_name}
                            </h3>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {relationLabels[child.relation]?.[locale] || child.relation}
                            </Badge>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-medium">
                                {isAr ? 'التقدم' : 'Progress'}
                              </span>
                              <span className="font-bold text-foreground">
                                {child.enrollments.avg_progress}%
                              </span>
                            </div>
                            <Progress
                              value={child.enrollments.avg_progress}
                              className="h-2 bg-primary/10"
                            />
                          </div>

                          {/* Stats Row */}
                          <div className="flex items-center gap-4 mt-4 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span className="font-medium">
                                {child.enrollments.total} {isAr ? 'مقرر' : 'courses'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="font-medium">
                                {child.bookings.upcoming} {isAr ? 'حجز' : 'bookings'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="font-medium">
                                {child.recitations.total_30d} {isAr ? 'تلاوة' : 'recitations'}
                              </span>
                            </div>
                            {child.badges.total > 0 && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                <span className="font-medium text-amber-600 dark:text-amber-400">
                                  {child.badges.total}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight
                          className={`w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-1 ${
                            isAr ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">
            {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
          </h2>
          <Card className="border-border/50 shadow-sm rounded-2xl bg-card overflow-hidden">
            <div className="divide-y divide-border/50">
              <Link
                href="/academy/parent/link-child"
                className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <LinkIcon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-sm text-foreground">
                    {isAr ? 'ربط ابن جديد' : 'Link New Child'}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr ? 'بحث وربط حساب طالب' : 'Search and link a student'}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </Link>

              <Link
                href="/academy/parent/children"
                className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                  <Users className="w-4.5 h-4.5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-sm text-foreground">
                    {isAr ? 'إدارة الأبناء' : 'Manage Children'}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr ? 'عرض وإدارة حسابات أبنائك' : 'View and manage children'}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-blue-500 transition-colors" />
              </Link>

              <Link
                href="/academy/parent/calendar"
                className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                  <Calendar className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-sm text-foreground">
                    {isAr ? 'التقويم' : 'Calendar'}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr ? 'مواعيد الحصص والواجبات' : 'Sessions and assignments'}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-emerald-500 transition-colors" />
              </Link>

              <Link
                href="/academy/parent/notifications"
                className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                  <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-sm text-foreground">
                    {isAr ? 'الإشعارات' : 'Notifications'}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr ? 'عرض كل الإشعارات' : 'View all notifications'}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-amber-500 transition-colors" />
              </Link>
            </div>
          </Card>

          {/* Pending Requests */}
          {summary.pending_requests > 0 && (
            <Card className="border-amber-200/50 dark:border-amber-800/50 shadow-sm rounded-2xl bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-amber-500" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">
                    {isAr ? 'طلبات معلقة' : 'Pending Requests'}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {isAr
                    ? `لديك ${summary.pending_requests} طلب ربط معلق`
                    : `You have ${summary.pending_requests} pending link requests`}
                </p>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl font-bold border-amber-300/50 hover:bg-amber-100/50"
                >
                  <Link href="/academy/parent/children?status=pending">
                    {isAr ? 'مراجعة الطلبات' : 'Review Requests'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
