'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, Users, Calendar, Loader2, ClipboardCheck, Clock, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-emerald-600" />
            تحكيم المسابقات
          </h1>
          <p className="text-muted-foreground mt-1">قيّم مشاركات الطلاب في المسابقات</p>
        </div>
        {totalPending > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {totalPending} مشاركة بانتظار التقييم
            </span>
          </div>
        )}
      </div>

      {/* Competition List */}
      {competitions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Trophy className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium">لا توجد مسابقات مسندة إليك حالياً</p>
        </div>
      ) : (
        <div className="space-y-3">
          {competitions.map(comp => {
            const startDate = new Date(comp.start_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })
            const endDate = new Date(comp.end_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })

            return (
              <Link
                key={comp.id}
                href={`/reader/competitions/${comp.id}`}
                className="block bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {TYPE_LABELS[comp.type] || comp.type}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        comp.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      )}>
                        {comp.status === 'active' ? 'نشطة' : 'منتهية'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold">{comp.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {startDate} — {endDate}</span>
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {comp.participants_count} مشارك</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    {(comp.pending_count || 0) > 0 ? (
                      <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full px-3 py-1.5 text-center">
                        <span className="text-xl font-bold">{comp.pending_count}</span>
                        <p className="text-[10px]">بانتظار التقييم</p>
                      </div>
                    ) : (
                      <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full px-3 py-1.5 text-center">
                        <Star className="w-5 h-5 mx-auto" />
                        <p className="text-[10px]">تم التقييم</p>
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
