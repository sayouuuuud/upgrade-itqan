'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent } from '@/components/ui/card'
import { Users, BookOpen, Target, UserMinus, Plus, Loader2, AlertTriangle, Mic, Calendar, Award } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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

interface LinkedChild {
  id: string
  child_id: string
  child_name: string
  child_email: string
  child_avatar: string | null
  relation: string
  status: string
  linked_at: string
}

interface ChildActivity {
  recitations: Array<{
    id: string
    surah_name: string
    status: string
    created_at: string
    reader_name: string | null
    overall_score: string | number | null
  }>
  sessions: Array<{
    id: string
    status: string
    scheduled_at: string | null
    slot_start: string | null
    teacher_name: string | null
  }>
  badges: Array<{
    id: string
    badge_name: string | null
    badge_type: string
    earned_at: string | null
  }>
}

export default function ParentChildrenPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [children, setChildren] = useState<LinkedChild[]>([])
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<Record<string, ChildActivity>>({})
  const [unlinkingChild, setUnlinkingChild] = useState<LinkedChild | null>(null)
  const [unlinkLoading, setUnlinkLoading] = useState(false)

  useEffect(() => {
    fetchChildren()
  }, [])

  const fetchChildren = async () => {
    try {
      const res = await fetch('/api/academy/parent/children')
      const data = await res.json()
      if (res.ok) {
        const linkedChildren: LinkedChild[] = data.children || []
        setChildren(linkedChildren)
        const entries = await Promise.all(linkedChildren.map(async (child) => {
          try {
            const activityRes = await fetch(`/api/academy/parent/children/${child.child_id}/activity`)
            if (!activityRes.ok) return [child.child_id, { recitations: [], sessions: [], badges: [] }] as const
            const activityData = await activityRes.json()
            return [child.child_id, activityData as ChildActivity] as const
          } catch {
            return [child.child_id, { recitations: [], sessions: [], badges: [] }] as const
          }
        }))
        setActivities(Object.fromEntries(entries))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const getRelationLabel = (rel: string) => {
    if (rel === 'father') return isAr ? 'أب' : 'Father'
    if (rel === 'mother') return isAr ? 'أم' : 'Mother'
    return isAr ? 'ولي أمر' : 'Guardian'
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
        setChildren(prev => prev.filter(c => c.child_id !== unlinkingChild.child_id))
      } else {
        toast.error(data.error || (isAr ? 'حدث خطأ' : 'Error occurred'))
      }
    } catch (error) {
      toast.error(isAr ? 'حدث خطأ في الاتصال' : 'Connection error')
    } finally {
      setUnlinkLoading(false)
      setUnlinkingChild(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border/50">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
             <Users className="w-4 h-4" />
             {isAr ? "إدارة الأبناء" : "Manage Children"}
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {isAr ? "قائمة الأبناء" : "My Children"}
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl">
            {isAr 
              ? "استعرض قائمة أبنائك المربوطين بحسابك وتحكم في تفضيلات المتابعة." 
              : "View a list of your linked children and manage tracking preferences."}
          </p>
        </div>
        <Button asChild className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-bold shadow-md hover:shadow-lg transition-all">
          <Link href="/academy/parent/link-child">
            <Plus className={`w-5 h-5 ${isAr ? "ml-2" : "mr-2"}`} />
            {isAr ? "ربط ابن جديد" : "Link New Child"}
          </Link>
        </Button>
      </div>

      {children.length === 0 ? (
        <Card className="border-border/50 shadow-sm rounded-3xl bg-card">
          <CardContent className="p-16 text-center">
            <Users className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-foreground mb-2">{isAr ? "لا يوجد أبناء مربوطين حالياً" : "No linked children yet"}</h4>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">{isAr ? "ابدأ بربط حساب ابنك عن طريق البريد الإلكتروني المسجل في المنصة." : "Start by linking your child's account using their registered email."}</p>
            <Button asChild className="rounded-2xl font-bold h-12 px-8">
              <Link href="/academy/parent/link-child">{isAr ? "ربط ابن جديد" : "Link New Child"}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map(child => (
            <Card key={child.id} className="border-border/50 shadow-sm rounded-3xl bg-card overflow-hidden">
              <CardContent className="p-0">
                <div className="p-8 pb-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-3xl font-black text-primary">{child.child_name.charAt(0)}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-foreground leading-tight">{child.child_name}</h3>
                    <p className="text-sm font-medium text-muted-foreground" dir="ltr">{child.child_email}</p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/60 mt-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase">{isAr ? "صلة القرابة:" : "Relation:"}</span>
                      <span className="text-xs font-black text-foreground">{getRelationLabel(child.relation)}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 grid grid-cols-1 gap-4">
                  <div className="rounded-2xl border border-border bg-muted/10 p-4">
                    <div className="flex items-center gap-2 font-bold mb-3">
                      <Mic className="w-4 h-4 text-primary" />
                      {isAr ? 'آخر التلاوات' : 'Recent Recitations'}
                    </div>
                    {(activities[child.child_id]?.recitations || []).slice(0, 3).length === 0 ? (
                      <p className="text-sm text-muted-foreground">{isAr ? 'لا توجد تلاوات بعد.' : 'No recitations yet.'}</p>
                    ) : (
                      <div className="space-y-2">
                        {(activities[child.child_id]?.recitations || []).slice(0, 3).map(recitation => (
                          <div key={recitation.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-semibold text-foreground">{recitation.surah_name}</span>
                            <span className="text-muted-foreground">{recitation.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-border bg-muted/10 p-4">
                      <div className="flex items-center gap-2 font-bold mb-3">
                        <Calendar className="w-4 h-4 text-primary" />
                        {isAr ? 'الجلسات' : 'Sessions'}
                      </div>
                      <p className="text-2xl font-black text-foreground">{activities[child.child_id]?.sessions?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? 'جلسة مرتبطة' : 'linked sessions'}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/10 p-4">
                      <div className="flex items-center gap-2 font-bold mb-3">
                        <Award className="w-4 h-4 text-primary" />
                        {isAr ? 'الشارات' : 'Badges'}
                      </div>
                      <p className="text-2xl font-black text-foreground">{activities[child.child_id]?.badges?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? 'شارة مكتسبة' : 'earned badges'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/10 p-6 flex items-center justify-around">
                  <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                      <span className="text-xs font-bold uppercase">{isAr ? "الحالة" : "Status"}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{isAr ? "مربوط ✓" : "Linked ✓"}</span>
                    </div>
                  </div>
                  
                  <div className="w-px h-12 bg-border/50" />
                  
                  <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                      <span className="text-xs font-bold uppercase">{isAr ? "تاريخ الربط" : "Linked On"}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground" dir="ltr">{new Date(child.linked_at).toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>

                <div className="p-6 bg-muted/20 border-t border-border/50 flex items-center gap-4">
                  <Button variant="default" asChild className="flex-1 bg-card border border-border text-foreground hover:bg-muted font-bold rounded-xl h-12 shadow-sm">
                    <Link href={`/academy/parent/reports?child=${child.child_id}`}>
                      {isAr ? "عرض التقارير الكاملة" : "View Full Reports"}
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-12 w-12 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setUnlinkingChild(child)}
                    title={isAr ? "إلغاء الربط" : "Unlink"}
                  >
                    <UserMinus className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={!!unlinkingChild} onOpenChange={() => setUnlinkingChild(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
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
              ) : (
                isAr ? 'إلغاء الربط' : 'Unlink'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
