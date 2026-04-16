'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent } from '@/components/ui/card'
import { Users, FileText, Target, CheckCircle2, AlertCircle, Clock, GraduationCap, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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

export default function ParentDashboard() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [children, setChildren] = useState<LinkedChild[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChildren()
  }, [])

  const fetchChildren = async () => {
    try {
      const res = await fetch('/api/academy/parent/children')
      const data = await res.json()
      if (res.ok) {
        setChildren(data.children || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
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
    <div className="max-w-7xl mx-auto space-y-8 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border/50">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
             {isAr ? "نظرة عامة" : "Overview"}
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {isAr ? "لوحة تحكم ولي الأمر" : "Parent Dashboard"}
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl">
            {isAr 
              ? "تابع تقدم أبنائك، أداءهم الأكاديمي، وتنبيهات المهام من مكان واحد." 
              : "Track your children's progress, academic performance, and task alerts from one place."}
          </p>
        </div>
        <Button asChild className="hidden md:flex h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-bold shadow-md hover:shadow-lg transition-all active:scale-95">
          <Link href="/academy/parent/link-child">
            {isAr ? "ربط ابن جديد" : "Link New Child"}
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50 shadow-sm rounded-3xl bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{isAr ? "مجموع الأبناء" : "Total Children"}</p>
              <h4 className="text-2xl font-black text-foreground">{children.length}</h4>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm rounded-3xl bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{isAr ? "الحالة" : "Status"}</p>
              <h4 className="text-2xl font-black text-foreground">{children.filter(c => c.status === 'active').length} {isAr ? "نشط" : "active"}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-3xl bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{isAr ? "متوسط التقدم" : "Avg Progress"}</p>
              <h4 className="text-2xl font-black text-foreground">—</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-3xl bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{isAr ? "التنبيهات" : "Alerts"}</p>
              <h4 className="text-2xl font-black text-foreground">0</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Children List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">{isAr ? "متابعة الأبناء" : "Children Overview"}</h3>
            <Link href="/academy/parent/children" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              {isAr ? "إدارة الأبناء" : "Manage"}
              <ChevronRight className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
            </Link>
          </div>
          
          {children.length === 0 ? (
            <Card className="border-border/50 shadow-sm rounded-3xl bg-card">
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-foreground mb-2">{isAr ? "لا يوجد أبناء مربوطين" : "No linked children"}</h4>
                <p className="text-sm text-muted-foreground mb-6">{isAr ? "ابدأ بربط حساب ابنك لتتبع تقدمه الأكاديمي." : "Start by linking your child's account to track their progress."}</p>
                <Button asChild className="rounded-2xl font-bold">
                  <Link href="/academy/parent/link-child">{isAr ? "ربط ابن جديد" : "Link New Child"}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {children.map(child => (
                <Card key={child.id} className="border-border/50 shadow-sm rounded-3xl bg-card overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex items-center gap-4 flex-1">
                         <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                           <span className="text-xl font-bold text-primary">{child.child_name.charAt(0)}</span>
                         </div>
                         <div>
                           <h4 className="text-lg font-bold text-foreground">{child.child_name}</h4>
                           <p className="text-sm font-medium text-muted-foreground mt-1" dir="ltr">{child.child_email}</p>
                           <span className="text-xs font-bold text-muted-foreground/60 mt-1 inline-block">
                             {child.relation === 'father' ? (isAr ? 'أب' : 'Father') : child.relation === 'mother' ? (isAr ? 'أم' : 'Mother') : (isAr ? 'ولي أمر' : 'Guardian')}
                           </span>
                         </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Button variant="outline" asChild className="rounded-xl border-border hover:bg-muted font-bold">
                          <Link href={`/academy/parent/reports?child=${child.child_id}`}>
                            {isAr ? "التقارير" : "Reports"}
                          </Link>
                        </Button>
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{isAr ? "مربوط ✓" : "Linked ✓"}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Quick Actions */}
        <div className="space-y-6">
           <h3 className="text-xl font-bold text-foreground">{isAr ? "إجراءات سريعة" : "Quick Actions"}</h3>
           <Card className="border-border/50 shadow-sm rounded-3xl bg-card">
             <CardContent className="p-0 divide-y divide-border/50">
               <Link href="/academy/parent/link-child" className="p-5 flex items-center gap-4 hover:bg-muted/20 transition-colors block">
                 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                   <Users className="w-5 h-5 text-primary" />
                 </div>
                 <div>
                   <h5 className="font-bold text-sm text-foreground">{isAr ? "ربط ابن جديد" : "Link New Child"}</h5>
                   <p className="text-xs font-medium text-muted-foreground mt-0.5">{isAr ? "بحث وربط حساب طالب" : "Search and link a student account"}</p>
                 </div>
               </Link>
               <Link href="/academy/parent/children" className="p-5 flex items-center gap-4 hover:bg-muted/20 transition-colors block">
                 <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                   <FileText className="w-5 h-5 text-blue-500" />
                 </div>
                 <div>
                   <h5 className="font-bold text-sm text-foreground">{isAr ? "إدارة الأبناء" : "Manage Children"}</h5>
                   <p className="text-xs font-medium text-muted-foreground mt-0.5">{isAr ? "عرض وإدارة حسابات أبنائك" : "View and manage your children"}</p>
                 </div>
               </Link>
               <Link href="/academy/parent/notifications" className="p-5 flex items-center gap-4 hover:bg-muted/20 transition-colors block">
                 <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                   <AlertCircle className="w-5 h-5 text-amber-500" />
                 </div>
                 <div>
                   <h5 className="font-bold text-sm text-foreground">{isAr ? "الإشعارات" : "Notifications"}</h5>
                   <p className="text-xs font-medium text-muted-foreground mt-0.5">{isAr ? "عرض كل الإشعارات" : "View all notifications"}</p>
                 </div>
               </Link>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}
