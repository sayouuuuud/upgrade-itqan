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
  LinkIcon,
  Loader2,
  ChevronRight,
  Clock,
  BookOpen,
  Trophy,
  Calendar,
  AlertCircle,
  UserMinus,
  ArrowUpRight,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface PendingRequest {
  id: string
  child_id: string
  child_name: string
  child_email: string
  child_avatar: string | null
  relation: string
  status: string
  linked_at: string
}

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

export default function ParentChildrenPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [unlinkingChild, setUnlinkingChild] = useState<DashboardOverview['children'][0] | null>(null)
  const [cancellingPending, setCancellingPending] = useState<string | null>(null)
  const [unlinkLoading, setUnlinkLoading] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [overviewRes, pendingRes] = await Promise.all([
        fetch('/api/academy/parent/overview'),
        fetch('/api/academy/parent/children?status=pending'),
      ])
      if (overviewRes.ok) setOverview(await overviewRes.json())
      if (pendingRes.ok) {
        const d = await pendingRes.json()
        setPendingRequests(d.children || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleCancelPending = async (childId: string) => {
    setCancellingPending(childId)
    try {
      const res = await fetch('/api/academy/parent/children', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: childId }),
      })
      if (res.ok) {
        setPendingRequests((prev) => prev.filter((r) => r.child_id !== childId))
        setOverview((prev) =>
          prev
            ? {
                ...prev,
                summary: {
                  ...prev.summary,
                  pending_requests: Math.max(0, prev.summary.pending_requests - 1),
                },
              }
            : prev
        )
        toast.success(isAr ? 'تم إلغاء الطلب' : 'Request cancelled')
      } else {
        const d = await res.json()
        toast.error(d.error || (isAr ? 'حدث خطأ' : 'Error'))
      }
    } catch {
      toast.error(isAr ? 'حدث خطأ في الاتصال' : 'Connection error')
    } finally {
      setCancellingPending(null)
    }
  }

  const handleUnlink = async () => {
    if (!unlinkingChild) return

    setUnlinkLoading(true)
    try {
      const res = await fetch('/api/academy/parent/children', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: unlinkingChild.child_id }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || (isAr ? 'تم إلغاء الربط بنجاح' : 'Successfully unlinked'))
        const removedId = unlinkingChild.child_id
        setOverview((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            summary: {
              ...prev.summary,
              active_count: Math.max(0, prev.summary.active_count - 1),
            },
            children: prev.children.filter((c) => c.child_id !== removedId),
          }
        })
      } else {
        toast.error(data.error || (isAr ? 'حدث خطأ' : 'Error occurred'))
      }
    } catch {
      toast.error(isAr ? 'حدث خطأ في الاتصال' : 'Connection error')
    } finally {
      setUnlinkLoading(false)
      setUnlinkingChild(null)
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

  const children = overview?.children || []
  const summary = overview?.summary
  const hasChildren = children.length > 0
  const hasPending = pendingRequests.length > 0

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" />
            {isAr ? 'إدارة الأبناء' : 'Manage Children'}
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {isAr ? 'قائمة الأبناء' : 'My Children'}
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl">
            {isAr
              ? 'استعرض أبنائك المربوطين وتابع تقدمهم الأكاديمي.'
              : 'View your linked children and track their academic progress.'}
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

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-bold text-foreground">
              {isAr ? 'طلبات الربط المعلقة' : 'Pending Link Requests'}
            </h2>
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs font-bold">
              {pendingRequests.length}
            </Badge>
          </div>
          <Card className="rounded-2xl border-amber-200/40 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/10">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mb-4">
                {isAr
                  ? 'هذه الطلبات في انتظار موافقة الطلاب من لوحة تحكمهم.'
                  : 'These requests are awaiting student approval from their dashboard.'}
              </p>
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-background/60 border border-border/40"
                >
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage src={req.child_avatar || undefined} />
                    <AvatarFallback className="bg-amber-500/10 text-amber-600 font-bold text-sm">
                      {req.child_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{req.child_name}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{req.child_email}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {relationLabels[req.relation]?.[locale] || req.relation}
                  </Badge>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] gap-1">
                      <Clock className="w-3 h-3" />
                      {isAr ? 'معلق' : 'Pending'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
                      disabled={cancellingPending === req.child_id}
                      onClick={() => handleCancelPending(req.child_id)}
                    >
                      {cancellingPending === req.child_id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isAr ? (
                        'إلغاء'
                      ) : (
                        'Cancel'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!hasChildren && !hasPending && (
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-5">
              <Users className="w-9 h-9 text-muted-foreground/30" />
            </div>
            <h4 className="text-xl font-bold text-foreground mb-2">
              {isAr ? 'لا يوجد أبناء مربوطين' : 'No linked children'}
            </h4>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {isAr
                ? 'ابدأ بربط حساب ابنك لتتبع تقدمه الأكاديمي من مكان واحد.'
                : "Start by linking your child's account to track their academic progress from one place."}
            </p>
            <Button asChild className="rounded-xl font-bold h-12 px-8">
              <Link href="/academy/parent/link-child">
                {isAr ? 'ربط ابن جديد' : 'Link New Child'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Children Grid */}
      {hasChildren && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              {isAr ? 'الأبناء المربوطين' : 'Linked Children'}
              <span className="text-muted-foreground font-normal ms-2">({children.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {children.map((child) => (
              <Card
                key={child.link_id}
                className="rounded-2xl border-border/50 overflow-hidden hover:shadow-md hover:border-primary/20 transition-all group"
              >
                <CardContent className="p-0">
                  {/* Child Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start gap-4">
                      <Link href={`/academy/parent/children/${child.child_id}`}>
                        <Avatar className="w-14 h-14 shrink-0 ring-2 ring-background shadow-sm cursor-pointer hover:ring-primary/30 transition-all">
                          <AvatarImage src={child.child_avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                            {child.child_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/academy/parent/children/${child.child_id}`}
                            className="font-bold text-foreground hover:text-primary transition-colors truncate"
                          >
                            {child.child_name}
                          </Link>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                            {relationLabels[child.relation]?.[locale] || child.relation}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isAr ? 'ربط منذ' : 'Linked'} {fmtDate(child.linked_at, isAr)}
                        </p>
                      </div>
                      <Link
                        href={`/academy/parent/children/${child.child_id}`}
                        className="shrink-0"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight
                            className={`w-4 h-4 text-muted-foreground ${isAr ? 'rotate-180' : ''}`}
                          />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="px-6 pb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground font-medium">
                        {isAr ? 'التقدم' : 'Progress'}
                      </span>
                      <span className="font-bold text-foreground">
                        {child.enrollments.avg_progress}%
                      </span>
                    </div>
                    <Progress
                      value={child.enrollments.avg_progress}
                      className="h-1.5 bg-primary/10"
                    />
                  </div>

                  {/* Stats Grid */}
                  <div className="px-6 pb-4 grid grid-cols-4 gap-3">
                    <div className="text-center p-2 rounded-xl bg-muted/30">
                      <BookOpen className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-foreground">{child.enrollments.total}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {isAr ? 'مقرر' : 'Courses'}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-muted/30">
                      <Calendar className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-foreground">{child.bookings.upcoming}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {isAr ? 'حجز' : 'Bookings'}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-muted/30">
                      <Clock className="w-4 h-4 text-violet-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-foreground">{child.recitations.total_30d}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {isAr ? 'تلاوة' : 'Recitations'}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-muted/30">
                      <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-foreground">{child.badges.total}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {isAr ? 'شارة' : 'Badges'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-6 pb-6 flex items-center gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl h-9 font-bold text-xs"
                    >
                      <Link href={`/academy/parent/children/${child.child_id}`}>
                        <ArrowUpRight className="w-3.5 h-3.5 me-1" />
                        {isAr ? 'التفاصيل' : 'Details'}
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl h-9 font-bold text-xs"
                    >
                      <Link href={`/academy/parent/children/${child.child_id}/restrictions`}>
                        <Shield className="w-3.5 h-3.5 me-1" />
                        {isAr ? 'تقييد' : 'Restrict'}
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                      onClick={() => setUnlinkingChild(child)}
                      title={isAr ? 'إلغاء الربط' : 'Unlink'}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Rejected Links Info */}
      {(summary?.rejected_links || 0) > 0 && (
        <Card className="rounded-2xl border-border/50 bg-muted/20">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              {isAr
                ? `لديك ${summary?.rejected_links} طلب ربط مرفوض.`
                : `You have ${summary?.rejected_links} rejected link requests.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={!!unlinkingChild} onOpenChange={() => setUnlinkingChild(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-destructive" />
              {isAr ? 'تأكيد إلغاء الربط' : 'Confirm Unlink'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل أنت متأكد من إلغاء ربط ${unlinkingChild?.child_name}؟ لن تتمكن من متابعة تقدمه الدراسي بعد ذلك.`
                : `Are you sure you want to unlink ${unlinkingChild?.child_name}? You will no longer be able to track their progress.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unlinkLoading}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlink}
              disabled={unlinkLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unlinkLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isAr ? (
                'إلغاء الربط'
              ) : (
                'Unlink'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function fmtDate(s: string | null, isAr: boolean) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
