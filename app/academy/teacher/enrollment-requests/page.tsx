"use client"

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { CheckCircle2, XCircle, Clock, Search, BookOpen, GraduationCap } from 'lucide-react'

export default function EnrollmentRequestsPage() {
  const { t } = useI18n()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/academy/teacher/enrollment-requests')
      if (res.ok) {
        const json = await res.json()
        setRequests(json.data || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleAction = async (requestId: string, action: 'active' | 'rejected') => {
    try {
      const res = await fetch(`/api/academy/teacher/enrollment-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      })
      if (res.ok) {
        // Update local state without fetching all again
        setRequests(requests.map(req => req.id === requestId ? { ...req, status: action } : req))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const completedRequests = requests.filter(r => r.status !== 'pending')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">طلبات الانضمام</h1>
          <p className="text-muted-foreground mt-1">إدارة طلبات الطلاب للالتحاق بدوراتك</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pending */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-yellow-50/50 dark:bg-yellow-900/10">
            <h2 className="font-bold flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
              <Clock className="w-5 h-5" />
              في الانتظار ({pendingRequests.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">لا توجد طلبات معلقة.</div>
            ) : (
              pendingRequests.map(req => (
                <div key={req.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-500" />
                        {req.student_name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-1">{req.student_email}</p>
                      <p className="text-sm font-medium flex items-center gap-1.5 mt-2 text-blue-700 dark:text-blue-400">
                        <BookOpen className="w-4 h-4" />
                        {req.course_title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(req.enrolled_at).toLocaleDateString('ar')}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(req.id, 'active')}
                        className="p-2 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 rounded-lg flex items-center gap-2 font-bold text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        قبول
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'rejected')}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg flex items-center gap-2 font-bold text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        رفض
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed */}
        <div className="bg-card rounded-xl border border-border overflow-hidden opacity-90">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="font-bold flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-5 h-5" />
              سجل الطلبات
            </h2>
          </div>
          <div className="divide-y divide-border">
            {completedRequests.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">لا يوجد سجل طلبات مقبولة أو مرفوضة بعد.</div>
            ) : (
              completedRequests.map(req => (
                <div key={req.id} className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold text-sm">{req.student_name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{req.course_title}</p>
                    </div>
                    <div>
                      {req.status === 'active' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">مقبول</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">مرفوض</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
