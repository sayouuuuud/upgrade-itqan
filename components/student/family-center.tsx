'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Link2Off,
  Heart,
  ShieldCheck
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse" />
          <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" />
        </div>
        <p className="text-muted-foreground animate-pulse font-medium">
          {isAr ? 'جاري تحميل بيانات العائلة...' : 'Loading family data...'}
        </p>
      </div>
    )
  }

  return (
    <motion.div 
      className="max-w-6xl mx-auto space-y-8 pb-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-primary/10 p-8 sm:p-10 shadow-sm">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 text-primary/5 rotate-12 pointer-events-none">
          <ShieldCheck className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Users className="w-4 h-4" />
            <span>{isAr ? 'مركز العائلة' : 'Family Center'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            {isAr ? 'ولي الأمر والعائلة' : 'Guardian & Family'}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            {isAr
              ? 'تصفح بيانات عائلتك، راجع طلبات الربط من أولياء الأمور، وابق على تواصل دائم ببيئة تعليمية آمنة.'
              : 'View your family details, review guardian link requests, and stay connected in a safe learning environment.'}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Pending Requests */}
          <AnimatePresence>
            {pendingRequests.length > 0 && (
              <motion.div variants={itemVariants} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95, height: 0 }}>
                <div className="rounded-2xl border border-amber-200/50 dark:border-amber-900/50 bg-gradient-to-b from-amber-50/50 to-background dark:from-amber-950/20 overflow-hidden shadow-sm relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />
                  <div className="p-6 border-b border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          {isAr ? 'طلبات ربط في الانتظار' : 'Pending Link Requests'}
                          <Badge className="bg-amber-500 hover:bg-amber-600 border-none text-white shadow-sm">
                            {pendingRequests.length}
                          </Badge>
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">
                          {isAr ? 'هذه الطلبات تحتاج إلى مراجعتك للموافقة أو الرفض.' : 'These requests need your review to approve or reject.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {pendingRequests.map((request) => (
                      <motion.div
                        key={request.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-5 rounded-xl border border-amber-200/40 bg-white/60 dark:bg-black/20 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="h-16 w-16 ring-4 ring-white dark:ring-background shadow-md">
                              <AvatarImage src={request.parent_avatar || undefined} className="object-cover" />
                              <AvatarFallback className="bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 text-xl font-bold text-amber-700 dark:text-amber-300">
                                {request.parent_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                              <div className="bg-amber-500 rounded-full w-4 h-4 border-2 border-background animate-pulse" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {request.parent_name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5" />
                              {request.parent_email}
                            </p>
                            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50">
                              {rel(request.relation)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex w-full sm:w-auto gap-3 mt-2 sm:mt-0">
                          <Button
                            onClick={() => handleAction(request.id, 'approve')}
                            disabled={actionLoading === request.id}
                            className="flex-1 sm:flex-none h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-sm hover:shadow-md transition-all border-none"
                          >
                            {actionLoading === request.id ? (
                              <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />
                            ) : (
                              <Check className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                            )}
                            {isAr ? 'قبول الطلب' : 'Approve'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleAction(request.id, 'reject')}
                            disabled={actionLoading === request.id}
                            className="flex-1 sm:flex-none h-11 px-6 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/50 font-semibold"
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
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Linked Guardians */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {isAr ? 'أولياء الأمور المعتمدون' : 'Approved Guardians'}
                  {parents.length > 0 && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {parents.length}
                    </Badge>
                  )}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {isAr ? 'الأشخاص الذين يتابعون تقدمك الدراسي.' : 'People who are tracking your academic progress.'}
                </p>
              </div>
            </div>

            {parents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-muted-foreground/25 bg-muted/10 p-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <UserCheck className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{isAr ? 'لا يوجد أولياء أمور معتمدين' : 'No Approved Guardians'}</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  {isAr 
                    ? 'بمجرد قبولك لطلب ربط من ولي أمرك، ستظهر بياناته هنا.' 
                    : 'Once you approve a link request from your guardian, their details will appear here.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {parents.map((p, i) => (
                  <motion.div 
                    key={p.link_id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 relative"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="p-6 pb-4 flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 ring-2 ring-background shadow-sm border border-border">
                          <AvatarImage src={p.avatar_url || undefined} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/30 text-primary font-bold text-lg">
                            {p.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-lg">{p.name}</h3>
                          <Badge variant="secondary" className="mt-1 font-medium bg-primary/5">
                            {rel(p.relation)}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setUnlinkTarget(p)}
                        className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors h-8 w-8"
                        title={isAr ? 'إلغاء الربط' : 'Unlink'}
                      >
                        <Link2Off className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="px-6 pb-6 pt-2">
                      <div className="space-y-3 p-4 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-3 text-sm text-foreground/80">
                          <div className="p-1.5 rounded-md bg-background shadow-sm border border-border/50">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <span className="truncate">{p.email}</span>
                        </div>
                        {p.phone && (
                          <div className="flex items-center gap-3 text-sm text-foreground/80">
                            <div className="p-1.5 rounded-md bg-background shadow-sm border border-border/50">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <span dir="ltr" className="font-medium">{p.phone}</span>
                          </div>
                        )}
                        {p.city && (
                          <div className="flex items-center gap-3 text-sm text-foreground/80">
                            <div className="p-1.5 rounded-md bg-background shadow-sm border border-border/50">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <span>{p.city}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        <div className="space-y-6">
          {/* Info Card */}
          <motion.div variants={itemVariants}>
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/10 to-primary/5 p-6 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 bg-primary/10 rounded-full w-24 h-24 blur-xl" />
              <div className="flex gap-4 relative z-10">
                <div className="p-2.5 bg-primary/20 rounded-xl text-primary h-fit">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-primary mb-1">{isAr ? 'بيئة آمنة' : 'Safe Environment'}</h3>
                  <p className="text-sm text-primary/80 leading-relaxed">
                    {isAr
                      ? 'عند قبول طلب ولي الأمر، سيتمكن من متابعة تقدمك الدراسي، الدرجات، والحضور. يمكنك دائماً إلغاء الربط متى شئت لحماية خصوصيتك.'
                      : 'By approving a guardian, they gain access to track your academic progress, grades, and attendance. You maintain full control to unlink at any time.'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Siblings */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-2xl overflow-hidden border-border/60 shadow-sm">
              <CardHeader className="bg-muted/20 border-b border-border/40 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                    <Heart className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-lg">{isAr ? 'الإخوة' : 'Siblings'}</CardTitle>
                </div>
                <CardDescription>
                  {isAr ? 'الطلاب الآخرون المرتبطون بنفس ولي الأمر' : 'Other students linked to the same guardian'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {siblings.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {isAr ? 'لا يوجد إخوة مسجلون.' : 'No registered siblings.'}
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {siblings.map((s) => (
                      <div key={s.student_id} className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={s.avatar_url || undefined} className="object-cover" />
                          <AvatarFallback className="bg-primary/5 text-primary text-sm font-medium">
                            {s.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-sm">{s.name}</p>
                          <p className="truncate text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <span className="w-1 h-1 rounded-full bg-primary/40 inline-block" />
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
          {rejectedRequests.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="rounded-2xl overflow-hidden border-border/60 shadow-sm">
                <CardHeader className="bg-muted/20 border-b border-border/40 pb-4">
                  <CardTitle className="text-lg text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {isAr ? 'سجل الطلبات المرفوضة' : 'Rejected Requests'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/40 max-h-[300px] overflow-y-auto">
                    {rejectedRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-muted/10 opacity-70 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 grayscale">
                            <AvatarImage src={request.parent_avatar || undefined} className="object-cover" />
                            <AvatarFallback className="text-xs bg-muted">
                              {request.parent_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{request.parent_name}</p>
                            <p className="text-[10px] text-muted-foreground">{rel(request.relation)}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-background">
                          {isAr ? 'مرفوض' : 'Rejected'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Unlink Confirmation */}
      <AlertDialog open={!!unlinkTarget} onOpenChange={(open) => !open && setUnlinkTarget(null)}>
        <AlertDialogContent className="rounded-2xl sm:max-w-[425px]">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
              <Link2Off className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <AlertDialogTitle className="text-center text-xl">{isAr ? 'إلغاء ارتباط ولي الأمر' : 'Unlink Guardian'}</AlertDialogTitle>
            <AlertDialogDescription className="text-center pt-2">
              {isAr ? (
                <>
                  هل أنت متأكد من رغبتك في إلغاء ربط حسابك بـ <strong className="text-foreground">{unlinkTarget?.name}</strong>؟
                  <br className="my-2" />
                  لن يتمكن بعدها من متابعة تقدمك الدراسي أو درجاتك.
                </>
              ) : (
                <>
                  Are you sure you want to unlink your account from <strong className="text-foreground">{unlinkTarget?.name}</strong>?
                  <br className="my-2" />
                  They will no longer be able to track your academic progress or grades.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-6">
            <AlertDialogCancel className="mt-0 sm:mt-0 rounded-xl">
              {isAr ? 'تراجع' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unlinkTarget && handleAction(unlinkTarget.link_id, 'unlink')}
              className="bg-rose-600 text-white hover:bg-rose-700 rounded-xl"
            >
              {isAr ? 'تأكيد الإلغاء' : 'Confirm Unlink'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
