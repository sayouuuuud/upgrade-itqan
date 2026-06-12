'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import {
  Users,
  Check,
  X,
  Loader2,
  UserCheck,
  Clock,
  Phone,
  Mail,
  MapPin,
  Link2Off,
  Heart,
  ShieldCheck,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ParentRequest {
  id: string
  parent_id: string
  parent_name: string
  parent_email: string
  parent_avatar: string | null
  relation: string
  status: string
  created_at: string
}

interface LinkedParent {
  link_id: string
  parent_id: string
  name: string
  email: string
  phone: string | null
  city: string | null
  gender: string | null
  avatar_url: string | null
  relation: string
  linked_since: string
}

interface Sibling {
  student_id: string
  name: string
  avatar_url: string | null
  gender: string | null
  relation: string
  parent_name: string
}

const relationLabels: Record<string, { ar: string; en: string }> = {
  father: { ar: 'الأب', en: 'Father' },
  mother: { ar: 'الأم', en: 'Mother' },
  guardian: { ar: 'ولي الأمر', en: 'Guardian' },
  other: { ar: 'آخر', en: 'Other' },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export function FamilyCenter() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const [requests, setRequests] = useState<ParentRequest[]>([])
  const [parents, setParents] = useState<LinkedParent[]>([])
  const [siblings, setSiblings] = useState<Sibling[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [unlinkTarget, setUnlinkTarget] = useState<LinkedParent | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/student/family')
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
        setParents(data.parents || [])
        setSiblings(data.siblings || [])
      }
    } catch (error) {
      console.error('Failed to fetch family data:', error)
    } finally {
      setLoading(false)
    }
  }

  const rel = (r: string) => relationLabels[r]?.[isAr ? 'ar' : 'en'] || r

  const handleAction = async (requestId: string, action: 'approve' | 'reject' | 'unlink') => {
    setActionLoading(requestId)
    try {
      const res = await fetch('/api/student/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        await fetchData()
      } else {
        toast.error(data.error || (isAr ? 'حدث خطأ' : 'An error occurred'))
      }
    } catch {
      toast.error(isAr ? 'حدث خطأ في الاتصال' : 'Connection error')
    } finally {
      setActionLoading(null)
      setUnlinkTarget(null)
    }
  }

  const pendingRequests = requests.filter((r) => r.status?.toLowerCase() === 'pending')
  const rejectedRequests = requests.filter((r) => r.status?.toLowerCase() === 'rejected')

  if (loading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto pb-12" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="relative overflow-hidden rounded-3xl bg-muted/30 border border-border/50 p-8">
          <Skeleton className="h-12 w-12 rounded-2xl mb-4" />
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-56 w-full rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-primary/10 p-8 shadow-sm"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Users className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex items-center gap-4 mb-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isAr ? 'مركز العائلة' : 'Family Center'}
          </h1>
        </div>
        <p className="text-muted-foreground font-medium text-base max-w-2xl relative z-10">
          {isAr
            ? 'تصفح بيانات عائلتك، راجع طلبات الربط من أولياء الأمور، وابق على تواصل دائم ببيئة تعليمية آمنة.'
            : 'View your family details, review guardian link requests, and stay connected in a safe learning environment.'}
        </p>
      </motion.div>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <motion.div variants={itemVariant}>
              <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/40 dark:to-amber-900/10 dark:border-amber-900/50 shadow-md overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
                <CardHeader className="pb-3 border-b border-amber-200/40 dark:border-amber-900/40 bg-amber-100/30 dark:bg-amber-900/10">
                  <CardTitle className="text-amber-800 dark:text-amber-400 flex items-center gap-2 text-lg">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                    {isAr ? 'طلبات ربط في الانتظار' : 'Pending Link Requests'}
                    <Badge variant="secondary" className="bg-amber-200/60 text-amber-800 dark:bg-amber-800/60 dark:text-amber-200 ml-auto mr-auto shadow-sm">
                      {pendingRequests.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <AnimatePresence>
                    {pendingRequests.map((request) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-200/50 dark:border-amber-800/50 bg-background/80 backdrop-blur-sm shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                            <AvatarImage src={request.parent_avatar || undefined} className="object-cover" />
                            <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 font-bold">
                              {request.parent_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-base font-bold text-foreground">
                              {request.parent_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="font-semibold text-[10px] bg-transparent border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                                {rel(request.relation)}
                              </Badge>
                              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5" />
                                {request.parent_email}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            onClick={() => handleAction(request.id, 'approve')}
                            disabled={actionLoading === request.id}
                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                          >
                            {actionLoading === request.id ? (
                              <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />
                            ) : (
                              <Check className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                            )}
                            {isAr ? 'قبول' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(request.id, 'reject')}
                            disabled={actionLoading === request.id}
                            className="flex-1 sm:flex-none border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-all hover:shadow-sm"
                          >
                            {actionLoading === request.id ? (
                              <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />
                            ) : (
                              <X className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                            )}
                            {isAr ? 'رفض' : 'Reject'}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Linked Guardians */}
          <motion.div variants={itemVariant} className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {isAr ? 'أولياء الأمور المعتمدون' : 'Approved Guardians'}
              {parents.length > 0 && (
                <Badge variant="secondary" className="font-semibold bg-primary/10 text-primary">
                  {parents.length}
                </Badge>
              )}
            </h2>

            {parents.length === 0 ? (
              <Card className="border-dashed border-2 bg-transparent shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 mb-6 rounded-full bg-primary/5 flex items-center justify-center">
                    <UserCheck className="w-10 h-10 text-primary/40" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {isAr ? 'لا يوجد أولياء أمور معتمدين' : 'No Approved Guardians'}
                  </h3>
                  <p className="text-muted-foreground font-medium max-w-sm">
                    {isAr 
                      ? 'بمجرد قبولك لطلب ربط من ولي أمرك، ستظهر بياناته هنا لتتمكن من متابعة الارتباط بكل سهولة.' 
                      : 'Once you approve a link request from your guardian, their details will appear here.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {parents.map((p) => (
                  <motion.div key={p.link_id} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                    <Card className="overflow-hidden border-border/40 shadow-sm transition-all hover:shadow-md hover:border-primary/40 bg-gradient-to-b from-background to-muted/10 flex flex-col h-full relative group">
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/40 to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <CardHeader className="p-5 pb-0 flex flex-row items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                              <AvatarImage src={p.avatar_url || undefined} className="object-cover" />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                                {p.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-background w-4 h-4 rounded-full shadow-sm"></div>
                          </div>
                          <div>
                            <h3 className="font-bold text-base leading-tight">{p.name}</h3>
                            <Badge variant="secondary" className="mt-1.5 font-semibold bg-primary/10 text-primary text-xs">
                              {rel(p.relation)}
                            </Badge>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setUnlinkTarget(p)}
                          className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full h-8 w-8 shrink-0"
                          title={isAr ? 'إلغاء الربط' : 'Unlink'}
                        >
                          <Link2Off className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      
                      <CardContent className="p-5 pt-6 mt-auto">
                        <div className="space-y-3 rounded-xl bg-background/50 border border-border/40 p-4 shadow-sm">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground group/item">
                            <div className="p-1.5 rounded-md bg-muted group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors">
                              <Mail className="h-4 w-4 shrink-0" />
                            </div>
                            <span className="truncate font-medium">{p.email}</span>
                          </div>
                          {p.phone && (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground group/item">
                              <div className="p-1.5 rounded-md bg-muted group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors">
                                <Phone className="h-4 w-4 shrink-0" />
                              </div>
                              <span dir="ltr" className="font-medium">{p.phone}</span>
                            </div>
                          )}
                          {p.city && (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground group/item">
                              <div className="p-1.5 rounded-md bg-muted group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors">
                                <MapPin className="h-4 w-4 shrink-0" />
                              </div>
                              <span className="truncate font-medium">{p.city}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          
          <motion.div variants={itemVariant}>
            <Card className="border-primary/20 shadow-sm bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden">
              <div className="absolute -right-6 -top-6 text-primary/10">
                <ShieldCheck className="w-32 h-32" />
              </div>
              <CardContent className="p-6 flex flex-col gap-3 relative z-10">
                <div className="p-3 bg-primary/20 rounded-xl w-fit text-primary shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-primary mb-2 text-lg">{isAr ? 'بيئة آمنة' : 'Safe Environment'}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {isAr
                      ? 'عند قبول طلب ولي الأمر، سيتمكن من متابعة تقدمك الدراسي. يمكنك دائماً إلغاء الربط متى شئت لحماية خصوصيتك.'
                      : 'By approving a guardian, they gain access to track your academic progress. You maintain full control to unlink at any time.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Siblings */}
          <motion.div variants={itemVariant}>
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/40 pb-4 p-5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-500/10 rounded-md text-rose-500 shadow-inner">
                    <Heart className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-base font-bold">{isAr ? 'الإخوة' : 'Siblings'}</CardTitle>
                </div>
                <CardDescription className="text-xs font-medium">
                  {isAr ? 'الطلاب الآخرون المرتبطون بنفس ولي الأمر' : 'Other students linked to the same guardian'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {siblings.length === 0 ? (
                  <div className="p-8 flex flex-col items-center justify-center text-center text-muted-foreground">
                    <Users className="w-10 h-10 mb-3 opacity-20" />
                    <span className="text-sm font-medium">{isAr ? 'لا يوجد إخوة مسجلون.' : 'No registered siblings.'}</span>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {siblings.map((s) => (
                      <div key={s.student_id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors group">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
                          <AvatarImage src={s.avatar_url || undefined} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {s.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-sm text-foreground">{s.name}</p>
                          <p className="truncate text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-primary/40"></span>
                            {isAr ? `عبر ${s.parent_name}` : `via ${s.parent_name}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* History */}
          <AnimatePresence>
            {rejectedRequests.length > 0 && (
              <motion.div variants={itemVariant} initial="hidden" animate="show" exit="hidden">
                <Card className="border-border/50 shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/20 border-b border-border/40 pb-3 p-5">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {isAr ? 'سجل الطلبات المرفوضة' : 'Rejected Requests'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/30 max-h-[300px] overflow-y-auto">
                      {rejectedRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 grayscale opacity-70">
                              <AvatarImage src={request.parent_avatar || undefined} className="object-cover" />
                              <AvatarFallback className="text-xs bg-muted font-semibold">
                                {request.parent_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-muted-foreground truncate">{request.parent_name}</p>
                              <p className="text-xs font-medium text-muted-foreground/70">{rel(request.relation)}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-semibold px-1.5 py-0 border-border/50 bg-background">
                            {isAr ? 'مرفوض' : 'Rejected'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Unlink Confirmation */}
      <AlertDialog open={!!unlinkTarget} onOpenChange={(open) => !open && setUnlinkTarget(null)}>
        <AlertDialogContent className="sm:max-w-[400px]">
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4 shadow-inner">
              <Link2Off className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <AlertDialogTitle className="text-center text-xl font-bold">{isAr ? 'إلغاء ارتباط ولي الأمر' : 'Unlink Guardian'}</AlertDialogTitle>
            <AlertDialogDescription className="text-center font-medium">
              {isAr ? (
                <>
                  هل أنت متأكد من رغبتك في إلغاء ارتباط حسابك بـ <strong className="text-foreground">{unlinkTarget?.name}</strong>؟
                  <br className="my-2" />
                  لن يتمكن بعدها من متابعة تقدمك الدراسي.
                </>
              ) : (
                <>
                  Are you sure you want to unlink your account from <strong className="text-foreground">{unlinkTarget?.name}</strong>?
                  <br className="my-2" />
                  They will no longer be able to track your academic progress.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-4">
            <AlertDialogCancel className="mt-0 sm:mt-0 font-semibold px-6">
              {isAr ? 'تراجع' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unlinkTarget && handleAction(unlinkTarget.link_id, 'unlink')}
              className="bg-rose-600 text-white hover:bg-rose-700 font-semibold shadow-sm px-6"
            >
              {isAr ? 'تأكيد' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
