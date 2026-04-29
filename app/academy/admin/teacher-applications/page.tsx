"use client"

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, FileText, User, Phone, Globe, GraduationCap, Clock, BookOpen } from 'lucide-react'

export default function TeacherApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/academy/admin/teacher-applications')
      if (res.ok) {
        const json = await res.json()
        setApplications(json.data || [])
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchApps() }, [])

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    if (!confirm(action === 'approved' ? 'هل تريد قبول هذا المدرس؟' : 'هل تريد رفض هذا الطلب؟')) return
    try {
      const res = await fetch(`/api/academy/admin/teacher-applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      })
      if (res.ok) {
        fetchApps()
      } else {
        alert('حدث خطأ')
      }
    } catch { }
  }

  const pending = applications.filter(a => a.status === 'pending')
  const history = applications.filter(a => a.status !== 'pending')

  if (loading) return (
    <div className="p-8 flex justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">طلبات الانضمام كأستاذ</h1>
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
            {pending.length} في الانتظار
          </span>
          <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full font-medium">
            {history.length} سابق
          </span>
        </div>
      </div>

      {/* Pending Applications */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-yellow-50/50 dark:bg-yellow-900/10">
          <h2 className="font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            طلبات في الانتظار ({pending.length})
          </h2>
        </div>
        <div className="divide-y divide-border">
          {pending.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">لا توجد طلبات معلقة</p>
          ) : (
            pending.map(app => {
              // Parse qualifications if it's JSON
              let details: any = {}
              try {
                details = typeof app.qualifications === 'string'
                  ? JSON.parse(app.qualifications)
                  : (app.qualifications || {})
              } catch { }

              return (
                <div key={app.id} className="p-5 flex flex-col lg:flex-row justify-between gap-4 hover:bg-muted/20 transition-colors">
                  <div className="flex gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg">{app.name}</h3>
                      <p className="text-sm text-muted-foreground">{app.email}</p>

                      {/* Details Grid */}
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {details.phone && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                            <span dir="ltr">{details.phone}</span>
                          </div>
                        )}
                        {details.nationality && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Globe className="w-3.5 h-3.5" />
                            {details.nationality}
                          </div>
                        )}
                        {details.qualification && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {details.qualification}
                          </div>
                        )}
                        {details.years_of_experience != null && details.years_of_experience > 0 && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {details.years_of_experience} سنوات خبرة
                          </div>
                        )}
                      </div>

                      {details.teaching_subjects && (
                        <div className="mt-2 text-sm bg-muted/50 p-2.5 rounded-lg flex items-start gap-2">
                          <BookOpen className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span><span className="font-semibold">المواد:</span> {details.teaching_subjects}</span>
                        </div>
                      )}

                      {app.cv_url && (
                        <a href={app.cv_url} target="_blank" rel="noreferrer" className="inline-flex gap-2 items-center text-sm text-blue-600 mt-2 hover:underline">
                          <FileText className="w-4 h-4" /> عرض السيرة الذاتية
                        </a>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        📅 تاريخ الطلب: {new Date(app.created_at).toLocaleDateString('ar-SA', { dateStyle: 'long' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => handleAction(app.id, 'approved')}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />قبول كأستاذ
                    </button>
                    <button
                      onClick={() => handleAction(app.id, 'rejected')}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 font-bold rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />رفض
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* History */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="font-bold">سجل الطلبات السابقة ({history.length})</h2>
        </div>
        <div className="divide-y divide-border">
          {history.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">لا يوجد سجل</p>
          ) : (
            history.map(app => (
              <div key={app.id} className="p-4 flex justify-between items-center bg-muted/10">
                <div>
                  <h3 className="font-bold">{app.name}</h3>
                  <p className="text-sm text-muted-foreground">{app.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(app.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${app.status === 'approved'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                  {app.status === 'approved' ? '✓ مقبول' : '✗ مرفوض'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
