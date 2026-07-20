'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
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
  Shield,
  GraduationCap,
  Sparkles,
  Activity
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

export default function ParentChildrenPage() {
  const { t, locale } = useI18n()
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
        toast.success(t.parentPages?.children?.requestCancelled)
      } else {
        const d = await res.json()
        toast.error(d.error || t.parentPages?.children?.connectionError)
      }
    } catch {
      toast.error(t.parentPages?.children?.connectionError)
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
        toast.success(data.message || t.parentPages?.children?.successfullyUnlinked)
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
        toast.error(data.error || t.parentPages?.children?.connectionError)
      }
    } catch {
      toast.error(t.parentPages?.children?.connectionError)
    } finally {
      setUnlinkLoading(false)
      setUnlinkingChild(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse" />
            <div className="w-16 h-16 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center relative z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium animate-pulse">
            {t.parentPages?.children?.loadingChildren}
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
    <div className="max-w-6xl mx-auto space-y-10 pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Premium Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border border-primary/10"
      >
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <div className="w-64 h-64 bg-primary rounded-full blur-3xl" />
        </div>
        <div className="absolute bottom-0 left-0 p-8 opacity-20 pointer-events-none">
          <div className="w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 px-8 py-12 md:px-12 md:py-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-md shadow-sm border border-border/50 text-primary text-sm font-bold">
              <Users className="w-4 h-4" />
              {t.parentPages?.children?.manageChildren}
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-foreground flex items-center gap-3">
              {t.parentPages?.children?.myChildren}
              <Sparkles className="w-8 h-8 text-amber-500 animate-pulse hidden md:block" />
            </h1>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed">
              {t.parentPages?.children?.childrenDesc}
            </p>
          </div>
          <Button
            asChild
            className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 transition-all active:scale-95 shrink-0 text-lg group"
          >
            <Link href="/academy/parent/link-child">
              <LinkIcon className="w-5 h-5 me-2 group-hover:rotate-12 transition-transform" />
              {t.parentPages?.children?.linkNewChild}
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Pending Requests Section */}
      <AnimatePresence>
        {pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                {t.parentPages?.children?.pendingLinkRequests}
              </h2>
              <Badge className="bg-amber-500 text-white border-0 text-xs font-bold shadow-sm ms-2">
                {pendingRequests.length}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((req) => (
                <motion.div
                  key={req.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="rounded-2xl border-amber-200/50 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                    <CardContent className="p-5 flex items-center gap-4 relative z-10">
                      <Avatar className="w-12 h-12 shrink-0 ring-2 ring-amber-500/20">
                        <AvatarImage src={req.child_avatar || undefined} />
                        <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 font-bold text-lg">
                          {req.child_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-base text-foreground truncate">{req.child_name}</p>
                          <Badge variant="outline" className="text-[10px] bg-background/50 border-amber-200 dark:border-amber-800">
                            {t.parentPages?.dashboard?.relationLabels[req.relation] || req.relation}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate" dir="ltr">{req.child_email}</p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-[10px] gap-1 shadow-none">
                          <Clock className="w-3 h-3" />
                          {t.parentPages?.children?.waiting}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-3 text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
                          disabled={cancellingPending === req.child_id}
                          onClick={() => handleCancelPending(req.child_id)}
                        >
                          {cancellingPending === req.child_id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            t.parentPages?.children?.cancelRequest
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!hasChildren && !hasPending && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="rounded-[2.5rem] border-dashed border-2 border-border/60 bg-muted/10 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
            <CardContent className="p-20 text-center relative z-10 flex flex-col items-center">
              <div className="relative mb-8 group">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl group-hover:bg-primary/30 transition-colors duration-500" />
                <div className="w-24 h-24 rounded-full bg-background border border-border shadow-xl flex items-center justify-center relative z-10">
                  <GraduationCap className="w-12 h-12 text-primary" />
                </div>
              </div>
              <h4 className="text-2xl font-black text-foreground mb-3">
                {t.parentPages?.children?.noChildrenLinkedYet}
              </h4>
              <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                {t.parentPages?.children?.noChildrenLinkedYetDesc}
              </p>
              <Button asChild className="rounded-2xl font-bold h-14 px-10 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                <Link href="/academy/parent/link-child">
                  <LinkIcon className="w-5 h-5 me-2" />
                  {t.parentPages?.children?.linkChildNow}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Children Grid */}
      {hasChildren && (
        <motion.div 
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {t.parentPages?.children?.linkedChildren}
              </h2>
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-sm font-bold bg-muted/50">
                {children.length}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
            {children.map((child) => (
              <motion.div key={child.link_id} variants={itemVariants} className="h-full">
                <Card className="rounded-[2rem] border-border/40 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 group bg-card relative h-full flex flex-col">
                  <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                  
                  <CardContent className="p-0 flex flex-col flex-1 relative z-10">
                    {/* Child Profile Header */}
                    <div className="p-6 sm:p-8 pb-5 flex items-start gap-5">
                      <Link href={`/academy/parent/children/${child.child_id}`} className="relative group/avatar shrink-0">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-md group-hover/avatar:bg-primary/40 transition-colors duration-300" />
                        <Avatar className="w-20 h-20 ring-4 ring-background shadow-lg relative z-10">
                          <AvatarImage src={child.child_avatar || undefined} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-black text-2xl">
                            {child.child_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <Link
                            href={`/academy/parent/children/${child.child_id}`}
                            className="text-2xl font-black text-foreground hover:text-primary transition-colors truncate"
                          >
                            {child.child_name}
                          </Link>
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                            {t.parentPages?.dashboard?.relationLabels[child.relation] || child.relation}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground gap-1.5 font-medium">
                          <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{t.parentPages?.children?.linkedSince} {fmtDate(child.linked_at, isAr)}</span>
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setUnlinkingChild(child)}
                          title={t.parentPages?.children?.unlink}
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Main Progress Indicator */}
                    <div className="px-6 sm:px-8 pb-6">
                      <div className="p-5 rounded-2xl bg-muted/30 border border-border/40">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold text-foreground">
                              {t.parentPages?.children?.academicProgress}
                            </span>
                          </div>
                          <span className="text-xl font-black text-primary">
                            {child.enrollments.avg_progress}%
                          </span>
                        </div>
                        <div className="relative h-2.5 bg-secondary rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${child.enrollments.avg_progress}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bento Stats Grid */}
                    <div className="px-6 sm:px-8 pb-8 grid grid-cols-2 gap-3 flex-1 content-start">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 group-hover:bg-blue-500/10 transition-colors">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xl sm:text-2xl font-black text-foreground leading-none mb-1">{child.enrollments.total}</p>
                          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">{t.parentPages?.children?.enrolledCourses}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 group-hover:bg-emerald-500/10 transition-colors">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xl sm:text-2xl font-black text-foreground leading-none mb-1">{child.bookings.upcoming}</p>
                          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">{t.parentPages?.children?.upcomingBookings}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl bg-violet-500/5 dark:bg-violet-500/10 border border-violet-500/10 group-hover:bg-violet-500/10 transition-colors">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-violet-500" />
                        </div>
                        <div>
                          <p className="text-xl sm:text-2xl font-black text-foreground leading-none mb-1">{child.recitations.total_30d}</p>
                          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">{isAr ? 'تلاوات (30 يوم)' : 'Recitations (30d)'}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 group-hover:bg-amber-500/10 transition-colors">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-xl sm:text-2xl font-black text-foreground leading-none mb-1">{child.badges.total}</p>
                          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">{t.parentPages?.children?.earnedBadges}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="px-6 sm:px-8 py-4 bg-muted/20 border-t border-border/40 flex items-center gap-3 mt-auto">
                      <Button
                        asChild
                        className="flex-1 rounded-xl h-12 font-bold shadow-sm"
                      >
                        <Link href={`/academy/parent/children/${child.child_id}`}>
                          {t.parentPages?.children?.viewDetails}
                          <ChevronRight className={`w-4 h-4 ms-2 ${isAr ? 'rotate-180' : ''}`} />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="secondary"
                        className="rounded-xl h-12 px-6 font-bold bg-background shadow-sm border border-border"
                      >
                        <Link href={`/academy/parent/children/${child.child_id}/restrictions`}>
                          <Shield className="w-4 h-4 sm:me-2 text-primary" />
                          <span className="hidden sm:inline">{t.parentPages?.children?.restrictions}</span>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Rejected Links Info */}
      {(summary?.rejected_links || 0) > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Card className="rounded-[2rem] border-red-200/40 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-red-900 dark:text-red-300 mb-1">
                  {t.parentPages?.children?.rejectedRequests}
                </h4>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {t.parentPages?.children?.rejectedRequestsDesc.replace('{count}', String(summary?.rejected_links))}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={!!unlinkingChild} onOpenChange={() => setUnlinkingChild(null)}>
        <AlertDialogContent className="rounded-[2rem] overflow-hidden p-0 border-0">
          <div className="h-2 bg-destructive w-full" />
          <div className="p-6 sm:p-8 space-y-6">
            <AlertDialogHeader className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
                <UserMinus className="w-8 h-8 text-destructive" />
              </div>
              <AlertDialogTitle className="text-2xl font-black text-center">
                {t.parentPages?.children?.confirmUnlinkTitle}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-base">
                {t.parentPages?.children?.confirmUnlinkDesc.replace('{name}', unlinkingChild?.child_name || '')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3 sm:gap-0">
              <AlertDialogCancel disabled={unlinkLoading} className="rounded-xl h-12 font-bold w-full sm:w-auto mt-0">
                {t.parentPages?.children?.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUnlink}
                disabled={unlinkLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-12 font-bold w-full sm:w-auto"
              >
                {unlinkLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t.parentPages?.children?.unlinkButton
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function fmtDate(s: string | null, isAr: boolean) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
