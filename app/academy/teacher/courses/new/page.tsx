"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'

export default function NewCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<{id: string; name: string}[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    level: 'beginner',
    category_id: ''
  })
  
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/academy/admin/categories')
        if (res.ok) {
          const json = await res.json()
          setCategories(json.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim()) {
      setError('عنوان الدورة مطلوب')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/academy/teacher/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category_id: formData.category_id || undefined
        })
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'حدث خطأ أثناء الإنشاء')
      }

      const json = await res.json()
      router.push(`/academy/teacher/courses/${json.data.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/academy/teacher/courses" 
          className="p-2 border border-border bg-card rounded-lg hover:bg-muted text-muted-foreground transition-colors"
        >
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">إنشاء دورة جديدة</h1>
          <p className="text-muted-foreground text-sm mt-1">
            أدخل البيانات الأساسية للدورة (يمكنك تعديلها لاحقاً)
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-xl p-6">
        {error && (
          <div className="p-4 mb-6 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">عنوان الدورة <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="مثال: دورة التجويد المبسط"
              className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">وصف الدورة</label>
            <textarea 
              rows={4}
              placeholder="اكتب وصفاً مختصراً عما سيتعلمه الطالب في هذه الدورة..."
              className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">المستوى</label>
              <select 
                title="Level"
                role="combobox"
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.level}
                onChange={e => setFormData({...formData, level: e.target.value as any})}
              >
                <option value="beginner">مبتدئ</option>
                <option value="intermediate">متوسط</option>
                <option value="advanced">متقدم</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">التصنيف</label>
              <select 
                title="Category"
                role="combobox"
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category_id}
                onChange={e => setFormData({...formData, category_id: e.target.value})}
              >
                <option value="">بدون تصنيف</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">رابط صورة الغلاف (اختياري)</label>
            <input 
              type="url" 
              placeholder="https://..."
              className="w-full p-3 rounded-lg border border-border bg-background text-left dir-ltr focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.thumbnail_url}
              onChange={e => setFormData({...formData, thumbnail_url: e.target.value})}
            />
            {formData.thumbnail_url && (
              <div className="mt-3 w-full h-40 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                <img src={formData.thumbnail_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-4 border-t border-border mt-8">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 ml-auto"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              إنشاء وحفظ
            </button>
            <Link 
              href="/academy/teacher/courses"
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
