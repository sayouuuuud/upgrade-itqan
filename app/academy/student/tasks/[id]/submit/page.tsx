"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Upload, FileText, CheckCircle2 } from 'lucide-react'

export default function SubmitTaskPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string

  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [submissionData, setSubmissionData] = useState({
    content: '',
    file_url: ''
  })

  useEffect(() => {
    async function fetchTask() {
      try {
        const res = await fetch(`/api/academy/student/tasks/${taskId}`)
        if (res.ok) {
          const json = await res.json()
          setTask(json.task)
        } else {
          setError('لم يتم العثور على المهمة')
        }
      } catch (err) {
        setError('خطأ في الاتصال')
      } finally {
        setLoading(false)
      }
    }
    fetchTask()
  }, [taskId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submissionData.content && !submissionData.file_url) {
      setError('يجب إرفاق ملف أو كتابة محتوى')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/academy/student/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/academy/student/tasks'), 2000)
      } else {
        const json = await res.json()
        setError(json.error || 'حدث خطأ أثناء التسليم')
      }
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && !task) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/academy/student/tasks" className="p-2 border border-border rounded-lg hover:bg-muted">
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">تسليم المهمة</h1>
          <p className="text-muted-foreground text-sm">{task?.title}</p>
        </div>
      </div>

      <div className="bg-card border border-border p-6 rounded-xl">
        <h2 className="text-lg font-bold mb-4">تفاصيل المهمة</h2>
        <div className="p-4 bg-muted/50 rounded-lg mb-6">
          <p className="whitespace-pre-wrap">{task?.description}</p>
          <div className="mt-4 text-sm text-muted-foreground flex gap-4">
            <span>الدرجة القصوى: {task?.max_score}</span>
            <span>تاريخ التسليم: {task?.due_date ? new Date(task.due_date).toLocaleDateString() : 'مفتوح'}</span>
          </div>
        </div>

        {success ? (
          <div className="p-6 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-xl flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-12 h-12 mb-3 text-green-500" />
            <h3 className="font-bold text-lg mb-1">تم تسليم المهمة بنجاح</h3>
            <p className="text-sm opacity-90">جاري العودة لقائمة المهام...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

            <div className="space-y-2">
              <label className="font-bold text-sm block">إجابة المهمة (نص)</label>
              <textarea 
                rows={5}
                placeholder="اكتب إجابتك هنا..."
                className="w-full p-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                value={submissionData.content}
                onChange={e => setSubmissionData({...submissionData, content: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-sm block flex items-center gap-2">
                <FileText className="w-4 h-4"/> رابط مرفق (اختياري)
              </label>
              <input 
                type="url"
                placeholder="مثال: رابط Google Drive للملف"
                className="w-full p-3 rounded-lg border border-border bg-background dir-ltr text-left"
                value={submissionData.file_url}
                onChange={e => setSubmissionData({...submissionData, file_url: e.target.value})}
              />
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button 
                type="submit" 
                disabled={submitting}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm"
              >
                {submitting ? (
                  <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"/>
                ) : (
                  <><Upload className="w-5 h-5"/> تسليم المهمة</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
