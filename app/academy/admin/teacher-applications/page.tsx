"use client"

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, FileText, User } from 'lucide-react'

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
    try {
      const res = await fetch(`/api/academy/admin/teacher-applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      })
      if (res.ok) {
        alert(action === 'approved' ? 'تم قبول الأستاذ' : 'تم الرفض')
        fetchApps()
      } else {
        alert('حدث خطأ')
      }
    } catch {}
  }

  const pending = applications.filter(a => a.status === 'pending')
  const history = applications.filter(a => a.status !== 'pending')

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"/></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">طلبات الانضمام كأستاذ</h1>
      
      <div className="bg-card border border-border rounded-xl">
         <div className="p-4 border-b border-border bg-yellow-50/50">
           <h2 className="font-bold text-yellow-700">طلبات في الانتظار ({pending.length})</h2>
         </div>
         <div className="divide-y divide-border">
            {pending.length === 0 ? <p className="p-8 text-center text-muted-foreground">لا توجد طلبات معلقة</p> : 
              pending.map(app => (
                <div key={app.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-muted/30">
                   <div className="flex gap-4">
                     <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center shrink-0">
                       <User className="w-6 h-6"/>
                     </div>
                     <div>
                       <h3 className="font-bold text-lg">{app.name}</h3>
                       <p className="text-sm text-muted-foreground">{app.email}</p>
                       <div className="mt-2 text-sm bg-muted p-2 rounded-lg break-words">
                         <span className="font-bold">المؤهلات:</span> {app.qualifications}
                       </div>
                       {app.cv_url && (
                         <a href={app.cv_url} target="_blank" rel="noreferrer" className="inline-flex gap-2 items-center text-sm text-blue-600 mt-2">
                           <FileText className="w-4 h-4"/> عرض السيرة الذاتية مجانا
                         </a>
                       )}
                     </div>
                   </div>
                   <div className="flex gap-2 shrink-0 self-end sm:self-center">
                     <button onClick={() => handleAction(app.id, 'approved')} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg whitespace-nowrap">قبول كأستاذ</button>
                     <button onClick={() => handleAction(app.id, 'rejected')} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg whitespace-nowrap">رفض</button>
                   </div>
                </div>
              ))
            }
         </div>
      </div>

      <div className="bg-card border border-border rounded-xl">
         <div className="p-4 border-b border-border bg-muted/30">
           <h2 className="font-bold">سجل الطلبات السابقة ({history.length})</h2>
         </div>
         <div className="divide-y divide-border">
            {history.length === 0 ? <p className="p-8 text-center text-muted-foreground">لا يوجد سجل</p> : 
              history.map(app => (
                <div key={app.id} className="p-4 flex justify-between items-center bg-muted/10">
                   <div>
                     <h3 className="font-bold">{app.name}</h3>
                     <p className="text-sm text-muted-foreground">{app.email}</p>
                   </div>
                   <span className={`px-2 py-1 text-xs font-bold rounded-full ${app.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                     {app.status === 'approved' ? 'مقبول' : 'مرفوض'}
                   </span>
                </div>
              ))
            }
         </div>
      </div>
    </div>
  )
}
