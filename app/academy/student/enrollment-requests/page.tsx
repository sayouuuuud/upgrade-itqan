"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, CheckCircle, XCircle, GraduationCap } from 'lucide-react'

interface EnrollmentRequest {
  id: string
  status: 'pending' | 'active' | 'rejected'
  enrolled_at: string
  course_id: string
  course_title: string
  level: string
  thumbnail_url?: string
  teacher_name: string
}

const statusConfig = {
  pending: {
    label: 'في انتظار الموافقة',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  },
  active: {
    label: 'مُقبول',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  },
  rejected: {
    label: 'مرفوض',
    icon: XCircle,
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }
}

const levelLabels: Record<string, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم'
}

export default function EnrollmentRequestsPage() {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all')

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch('/api/academy/student/enrollments')
        if (res.ok) {
          const json = await res.json()
          setRequests(json.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch enrollment requests:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [])

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">طلبات الانضمام للدورات</h1>
        <p className="text-muted-foreground mt-1">تتبع حالة طلباتك للانضمام للدورات</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'active', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-card border border-border text-foreground hover:bg-muted'
            }`}
          >
            {f === 'all' ? `الكل (${requests.length})` : statusConfig[f].label}
            {f !== 'all' && (
              <span className="mr-1.5 inline-block bg-white/20 rounded-full px-1.5 text-xs">
                {requests.filter(r => r.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <BookOpen className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-semibold mb-2">لا توجد طلبات</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {filter === 'all'
              ? 'لم تتقدم بأي طلب انضمام لدورة بعد'
              : `لا توجد طلبات بهذه الحالة`}
          </p>
          <Link
            href="/academy/student/courses/browse"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            تصفح الدورات
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(req => {
            const config = statusConfig[req.status]
            const StatusIcon = config.icon
            return (
              <div key={req.id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Course Thumbnail */}
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {req.thumbnail_url ? (
                    <img src={req.thumbnail_url} alt={req.course_title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-7 h-7 text-white/70" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{req.course_title}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {req.teacher_name}
                    </span>
                    <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-medium">
                      {levelLabels[req.level] || req.level}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    تاريخ الطلب: {new Date(req.enrolled_at).toLocaleDateString('ar-EG')}
                  </p>
                </div>

                {/* Status Badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shrink-0 ${config.className}`}>
                  <StatusIcon className="w-4 h-4" />
                  {config.label}
                </div>

                {/* Action Button */}
                {req.status === 'active' && (
                  <Link
                    href={`/academy/student/courses/${req.course_id}`}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors shrink-0"
                  >
                    الدخول للدورة
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
