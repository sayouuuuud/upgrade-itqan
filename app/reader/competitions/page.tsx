'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, Users, Calendar, Loader2, ClipboardCheck, Clock, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageLoadingSkeleton } from '@/components/ui/page-loading-skeleton'

interface Competition {
  id: string
  title: string
  description: string | null
  type: string
  start_date: string
  end_date: string
  status: string
  participants_count: number
  pending_count?: number
}

const TYPE_LABELS: Record<string, string> = {
  monthly: 'شهرية', ramadan: 'رمضان', tajweed: 'تجويد',
  memorization: 'حفظ', weekly: 'أسبوعية', special: 'خاصة',
}

export default function ReaderCompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/reader/competitions')
        if (res.ok) {
          const json = await res.json()
          setCompetitions(json.data || [])
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalPending = competitions.reduce((sum, c) => sum + (c.pending_count || 0), 0)

  if (loading) {
    return <PageLoadingSkeleton />
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-primary" />
            تحكيم المسابقات
          </h1>
          <p className="text-muted-foreground mt-2">قيّم مشاركات الطلاب في المسابقات واسند الدرجات النهائية.</p>
        </div>
        {totalPending > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50 rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm min-w-[200px]">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            <div>
              <span className="block text-xl font-bold text-amber-700 dark:text-amber-400 leading-none mb-1">
                {totalPending}
              </span>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-500">
                مشاركة بانتظار التقييم
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Competition List */}
      {competitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-card/50 border border-dashed border-border rounded-xl">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">لا توجد مسابقات</h3>
          <p className="text-muted-foreground text-sm">لا توجد مسابقات مسندة إليك لتحكيمها في الوقت الحالي.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {competitions.map(comp => {
            const startDate = new Date(comp.start_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })
            const endDate = new Date(comp.end_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })

            return (
              <Link
                key={comp.id}
                href={`/reader/competitions/${comp.id}`}
                className="group block bg-card border border-border/50 rounded-xl p-6 shadow-sm transition-colors hover:border-primary/30"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border/50">
                        {TYPE_LABELS[comp.type] || comp.type}
                      </span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                        comp.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50' 
                          : 'bg-muted text-muted-foreground border-border/50'
                      )}>
                        {comp.status === 'active' ? 'نشطة' : 'منتهية'}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{comp.title}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {startDate} — {endDate}</span>
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {comp.participants_count} مشارك</span>
                    </div>
                  </div>

                  <div className="md:pl-4 md:border-l border-border/50 min-w-[140px] flex items-center justify-center">
                    {(comp.pending_count || 0) > 0 ? (
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-amber-600 dark:text-amber-500">{comp.pending_count}</span>
                        <span className="text-xs font-medium text-amber-700/70 dark:text-amber-400/70 mt-1">بانتظار التقييم</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-500">
                        <Star className="w-6 h-6 mb-1" />
                        <span className="text-xs font-medium opacity-80">مكتملة التقييم</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
