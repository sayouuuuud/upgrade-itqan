"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, XCircle, User, FileText } from 'lucide-react'

export default function GradeTaskPage() {
  const params = useParams()
  const taskId = params.id as string

  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`/api/academy/teacher/tasks/${taskId}/submissions`)
      if (res.ok) {
        const json = await res.json()
        setSubmissions(json.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [taskId])

  const handleGrade = async (submissionId: string, score: number, feedback: string) => {
    try {
      const res = await fetch(`/api/academy/teacher/tasks/${taskId}/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, feedback })
      })
      if (res.ok) {
        fetchSubmissions() // Refresh
        alert('تم التقييم بنجاح')
      } else {
        alert('حدث خطأ')
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"/></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/academy/teacher/tasks" className="p-2 border border-border bg-card rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">تقييم تسليمات الطلاب</h1>
          <p className="text-muted-foreground mt-1">مراجعة المهام ورصد الدرجات</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border divide-y divide-border">
        {submissions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">لا توجد تسليمات لهذه المهمة حتى الآن.</div>
        ) : (
          submissions.map(sub => (
            <GradeCard key={sub.id} submission={sub} onGrade={handleGrade} />
          ))
        )}
      </div>
    </div>
  )
}

function GradeCard({ submission, onGrade }: { submission: any, onGrade: (id: string, score: number, feedback: string) => void }) {
  const [score, setScore] = useState(submission.score || 0)
  const [feedback, setFeedback] = useState(submission.feedback || '')
  
  return (
    <div className="p-6">
       <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
             <div className="flex items-center gap-2 mb-4">
               <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex justify-center items-center">
                 <User className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="font-bold">{submission.student_name}</h3>
                 <p className="text-xs text-muted-foreground">{new Date(submission.submitted_at).toLocaleString('ar')}</p>
               </div>
               <div className="ml-auto">
                 {submission.status === 'graded' ? (
                   <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                     <CheckCircle2 className="w-3 h-3"/> تم التقييم
                   </span>
                 ) : (
                   <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">بانتظار التقييم</span>
                 )}
               </div>
             </div>

             <div className="bg-muted/50 p-4 rounded-xl text-sm whitespace-pre-wrap font-medium">
               {submission.content || <span className="text-muted-foreground italic">لم يكتب الطالب نصاً</span>}
             </div>

             {submission.file_url && (
               <a href={submission.file_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-bold bg-blue-50 px-3 py-2 rounded-lg">
                 <FileText className="w-4 h-4"/>
                 فتح المرفق
               </a>
             )}
          </div>

          <div className="md:w-1/3 bg-background border border-border p-4 rounded-xl flex flex-col">
             <h4 className="font-bold text-sm mb-3">رصد الدرجة</h4>
             <div className="space-y-4 flex-1">
               <div>
                 <label className="text-xs text-muted-foreground block mb-1">الدرجة (من {submission.max_score || 100})</label>
                 <input 
                   type="number" min="0" max={submission.max_score || 100} 
                   value={score} onChange={e => setScore(Number(e.target.value))}
                   className="w-full p-2 border border-border rounded-lg bg-card"
                 />
               </div>
               <div>
                 <label className="text-xs text-muted-foreground block mb-1">ملاحظات الأستاذ (اختياري)</label>
                 <textarea 
                   rows={3} value={feedback} onChange={e => setFeedback(e.target.value)}
                   className="w-full p-2 border border-border rounded-lg bg-card text-sm"
                   placeholder="أحسنت صنعاً..."
                 />
               </div>
             </div>
             <button 
               onClick={() => onGrade(submission.id, score, feedback)}
               className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm mt-4 transition-colors"
             >
               حفظ التقييم
             </button>
          </div>
       </div>
    </div>
  )
}
