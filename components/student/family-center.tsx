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
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        <p className="text-muted-foreground font-medium">
          {isAr ? 'جاري تحميل بيانات العائلة...' : 'Loading family data...'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          {isAr ? 'مركز العائلة' : 'Family Center'}
        </h1>
        <p className="text-muted-foreground mt-2 text-base max-w-2xl">
          {isAr
            ? 'تصفح بيانات عائلتك، راجع طلبات الربط من أولياء الأمور، وابق على تواصل دائم ببيئة تعليمية آمنة.'
            : 'View your family details, review guardian link requests, and stay connected in a safe learning environment.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-900/10 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-amber-200/40 dark:border-amber-900/40 bg-amber-100/20 dark:bg-amber-900/5">
                <CardTitle className="text-amber-800 dark:text-amber-400 flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5" />
                  {isAr ? 'طلبات ربط في الانتظار' : 'Pending Link Requests'}
                  <Badge variant="secondary" className="bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200 ml-auto mr-2">
                    {pendingRequests.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-200/50 dark:border-amber-800/50 bg-background/50 shadow-sm transition-colors hover:bg-background"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage src={request.parent_avatar || undefined} className="object-cover" />
                        <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                          {request.parent_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          {request.parent_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="font-normal text-xs bg-transparent border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400">
                            {rel(request.relation)}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
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
                        className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
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
                        className="flex-1 sm:flex-none border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                      >
                        {actionLoading === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />
                        ) : (
                          <X className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                        )}
                        {isAr ? 'رفض' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Linked Guardians */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {isAr ? 'أولياء الأمور المعتمدون' : 'Approved Guardians'}
              {parents.length > 0 && (
                <Badge variant="secondary" className="font-normal">
                  {parents.length}
                </Badge>
              )}
            </h2>

            {parents.length === 0 ? (
              <Card className="border-dashed shadow-none bg-transparent">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                    <UserCheck className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {isAr ? 'لا يوجد أولياء أمور معتمدين' : 'No Approved Guardians'}
                  </h3>
                  <p className="text-muted-foreground max-w-sm">
                    {isAr 
                      ? 'بمجرد قبولك لطلب ربط من ولي أمرك، ستظهر بياناته هنا.' 
                      : 'Once you approve a link request from your guardian, their details will appear here.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {parents.map((p) => (
                  <Card 
                    key={p.link_id} 
                    className="overflow-hidden border-border/50 shadow-sm transition-colors hover:border-primary/30 flex flex-col"
                  >
                    <CardHeader className="p-5 pb-0 flex flex-row items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border">
                          <AvatarImage src={p.avatar_url || undefined} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                            {p.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-base leading-tight">{p.name}</h3>
                          <Badge variant="secondary" className="mt-1.5 font-medium bg-muted text-xs">
                            {rel(p.relation)}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setUnlinkTarget(p)}
                        className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full h-8 w-8 shrink-0"
                        title={isAr ? 'إلغاء الربط' : 'Unlink'}
                      >
                        <Link2Off className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    
                    <CardContent className="p-5 pt-4 mt-auto">
                      <div className="space-y-2.5 rounded-lg bg-muted/30 p-3">
                        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="truncate">{p.email}</span>
                        </div>
                        {p.phone && (
                          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4 shrink-0" />
                            <span dir="ltr">{p.phone}</span>
                          </div>
                        )}
                        {p.city && (
                          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="truncate">{p.city}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          
          <Card className="border-border/50 shadow-sm bg-primary/5 border-primary/10">
            <CardContent className="p-5 flex gap-4">
              <div className="shrink-0 text-primary">
                <ShieldCheck className="w-5 h-5 mt-0.5" />
              </div>
              <div>
                <h3 className="font-semibold text-primary mb-1">{isAr ? 'بيئة آمنة' : 'Safe Environment'}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isAr
                    ? 'عند قبول طلب ولي الأمر، سيتمكن من متابعة تقدمك الدراسي. يمكنك دائماً إلغاء الربط متى شئت لحماية خصوصيتك.'
                    : 'By approving a guardian, they gain access to track your academic progress. You maintain full control to unlink at any time.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Siblings */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4 p-5">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">{isAr ? 'الإخوة' : 'Siblings'}</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {isAr ? 'الطلاب الآخرون المرتبطون بنفس ولي الأمر' : 'Other students linked to the same guardian'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {siblings.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  {isAr ? 'لا يوجد إخوة مسجلون.' : 'No registered siblings.'}
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {siblings.map((s) => (
                    <div key={s.student_id} className="flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
                      <Avatar className="h-9 w-9 border">
                        <AvatarImage src={s.avatar_url || undefined} className="object-cover" />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                          {s.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm text-foreground">{s.name}</p>
                        <p className="truncate text-xs text-muted-foreground mt-0.5">
                          {isAr ? `عبر ${s.parent_name}` : `via ${s.parent_name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          {rejectedRequests.length > 0 && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-3 p-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {isAr ? 'سجل الطلبات المرفوضة' : 'Rejected Requests'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto">
                  {rejectedRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 grayscale opacity-70">
                          <AvatarImage src={request.parent_avatar || undefined} className="object-cover" />
                          <AvatarFallback className="text-xs bg-muted">
                            {request.parent_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-muted-foreground truncate">{request.parent_name}</p>
                          <p className="text-xs text-muted-foreground/70">{rel(request.relation)}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
                        {isAr ? 'مرفوض' : 'Rejected'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Unlink Confirmation */}
      <AlertDialog open={!!unlinkTarget} onOpenChange={(open) => !open && setUnlinkTarget(null)}>
        <AlertDialogContent className="sm:max-w-[400px]">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
              <Link2Off className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <AlertDialogTitle className="text-center text-lg">{isAr ? 'إلغاء ارتباط ولي الأمر' : 'Unlink Guardian'}</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
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
          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            <AlertDialogCancel className="mt-0 sm:mt-0">
              {isAr ? 'تراجع' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unlinkTarget && handleAction(unlinkTarget.link_id, 'unlink')}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {isAr ? 'تأكيد' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
