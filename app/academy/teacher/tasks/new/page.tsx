"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export default function NewTaskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<{id: string; title: string}[]>([])
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    task_type: 'written',
    due_date: '',
    max_score: '100'
  })

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/academy/teacher/courses')
        if (res.ok) {
          const json = await res.json()
          setCourses(json.data || [])
        }
      } catch (e) {
        console.error('Failed to load courses', e)
      }
    }
    fetchCourses()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.course_id) {
      setError('يجب اختيار دورة')
      return
    }
    if (!formData.title.trim()) {
      setError('عنوان المهمة مطلوب')
      return
    }
    if (!formData.due_date) {
      setError('تاريخ التسليم مطلوب')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/academy/teacher/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          max_score: formData.max_score ? Number(formData.max_score) : 100
        })
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'حدث خطأ أثناء الإنشاء')
      }

      router.push('/academy/teacher/tasks')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const taskTypeLabels: Record<string, string> = {
    written: 'مهمة كتابية',
    audio: 'تسجيل صوتي',
    video: 'مقطع فيديو',
    quiz: 'اختبار',
    project: 'مشروع'
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/academy/teacher/tasks"
          className="p-2 border border-border bg-card rounded-lg hover:bg-muted text-muted-foreground transition-colors"
        >
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">إنشاء مهمة جديدة</h1>
          <p className="text-muted-foreground text-sm mt-1">
            أضف مهمة لإحدى دوراتك
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        {error && (
          <div className="p-4 mb-6 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">
              الدورة <span className="text-red-500">*</span>
            </label>
            <select
              title="Course"
              className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.course_id}
              onChange={e => setFormData({...formData, course_id: e.target.value})}
              required
            >
              <option value="">اختر الدورة...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">
              عنوان المهمة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="مثال: واجب تلاوة سورة البقرة"
              className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">وصف المهمة</label>
            <textarea
              rows={4}
              placeholder="اشرح ما يجب على الطالب فعله..."
              className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {/* Task Type */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">نوع المهمة</label>
              <select
                title="Task Type"
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.task_type}
                onChange={e => setFormData({...formData, task_type: e.target.value})}
              >
                {Object.entries(taskTypeLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                تاريخ التسليم <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.due_date}
                onChange={e => setFormData({...formData, due_date: e.target.value})}
                required
              />
            </div>

            {/* Max Score */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">الدرجة القصوى</label>
              <input
                type="number"
                min="1"
                max="1000"
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.max_score}
                onChange={e => setFormData({...formData, max_score: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4 border-t border-border mt-8">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 ml-auto"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <CheckCircle2 className="w-4 h-4" />
              حفظ المهمة
            </button>
            <Link
              href="/academy/teacher/tasks"
              className="px-6 py-3 border border-border bg-card hover:bg-muted text-foreground font-bold rounded-lg transition-colors"
            >
              إلغاء
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
