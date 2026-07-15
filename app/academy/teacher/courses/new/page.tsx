"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Tag } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

const SPEC_LABELS_AR: Record<string, string> = {
  sira:    (t.addedTranslations_2026?.['السيرة النبوية'] || (t.addedTranslations_2026?.['السيرة النبوية'] || 'السيرة النبوية')),
  fiqh:    (t.addedTranslations_2026?.['الفقه'] || (t.addedTranslations_2026?.['الفقه'] || 'الفقه')),
  aqeedah: (t.addedTranslations_2026?.['العقيدة'] || (t.addedTranslations_2026?.['العقيدة'] || 'العقيدة')),
  tajweed: (t.addedTranslations_2026?.['التجويد'] || (t.addedTranslations_2026?.['التجويد'] || 'التجويد')),
  tafseer: (t.addedTranslations_2026?.['التفسير'] || (t.addedTranslations_2026?.['التفسير'] || 'التفسير')),
  arabic:  (t.addedTranslations_2026?.['اللغة العربية'] || (t.addedTranslations_2026?.['اللغة العربية'] || 'اللغة العربية')),
}

const SPEC_LABELS_EN: Record<string, string> = {
  sira:    "Prophet's Biography (Sira)",
  fiqh:    'Jurisprudence (Fiqh)',
  aqeedah: 'Creed (Aqeedah)',
  tajweed: 'Tajweed',
  tafseer: 'Interpretation (Tafseer)',
  arabic:  'Arabic Language',
}

export default function NewCoursePage() {
    
  const { t } = useI18n()
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const specLabels = isAr ? SPEC_LABELS_AR : SPEC_LABELS_EN

  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<{id: string; name: string}[]>([])
  const [teacherSpec, setTeacherSpec] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    level: 'beginner',
    category_id: '',
    scope: 'public'
  })
  
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, specRes] = await Promise.all([
          fetch('/api/academy/admin/categories'),
          fetch('/api/student/specializations'), // same table, works for teachers too
        ])
        if (catRes.ok) {
          const json = await catRes.json()
          setCategories(json.data || [])
        }
        if (specRes.ok) {
          const json = await specRes.json()
          const specs: { specialization: string }[] = json.specializations || []
          if (specs.length > 0) setTeacherSpec(specs[0].specialization)
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      }
    }
    fetchData()

    // Read initial scope from URL query parameters
    const searchParams = new URLSearchParams(window.location.search)
    const initialScope = searchParams.get('scope')
    if (initialScope === 'path_only' || initialScope === 'public') {
      setFormData(prev => ({ ...prev, scope: initialScope }))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim()) {
      setError((t.addedTranslations_2026?.['عنوان الدورة مطلوب'] || (t.addedTranslations_2026?.['عنوان الدورة مطلوب'] || 'عنوان الدورة مطلوب')))
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
        throw new Error(json.error || ((t.addedTranslations_2026?.['حدث خطأ أثناء الإنشاء'] || (t.addedTranslations_2026?.['حدث خطأ أثناء الإنشاء'] || 'حدث خطأ أثناء الإنشاء'))))
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
          <h1 className="text-2xl font-bold">{(t.addedTranslations_2026?.['إنشاء دورة جديدة'] || (t.addedTranslations_2026?.['إنشاء دورة جديدة'] || 'إنشاء دورة جديدة'))}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {(t.addedTranslations_2026?.['أدخل البيانات الأساسية للدورة (يمكنك تعديلها لاحقاً)'] || (t.addedTranslations_2026?.['أدخل البيانات الأساسية للدورة (يمكنك تعديلها لاحقاً)'] || 'أدخل البيانات الأساسية للدورة (يمكنك تعديلها لاحقاً)'))}
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

          {/* Teacher specialization — read-only info */}
          {teacherSpec && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <Tag className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground font-medium">
                {(t.addedTranslations_2026?.['سيتم تصنيف هذه الدورة تلقائياً تحت تخصصك:'] || (t.addedTranslations_2026?.['سيتم تصنيف هذه الدورة تلقائياً تحت تخصصك:'] || 'سيتم تصنيف هذه الدورة تلقائياً تحت تخصصك:'))}
              </span>
              <span className="text-sm font-bold text-primary">
                {specLabels[teacherSpec] ?? teacherSpec}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">{(t.addedTranslations_2026?.['عنوان الدورة'] || (t.addedTranslations_2026?.['عنوان الدورة'] || 'عنوان الدورة'))} <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder={(t.addedTranslations_2026?.['مثال: دورة التجويد المبسط'] || (t.addedTranslations_2026?.['مثال: دورة التجويد المبسط'] || 'مثال: دورة التجويد المبسط'))}
              className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">{(t.addedTranslations_2026?.['وصف الدورة'] || (t.addedTranslations_2026?.['وصف الدورة'] || 'وصف الدورة'))}</label>
            <textarea 
              rows={4}
              placeholder={(t.addedTranslations_2026?.['اكتب وصفاً مختصراً عما سيتعلمه الطالب في هذه الدورة...'] || (t.addedTranslations_2026?.['اكتب وصفاً مختصراً عما سيتعلمه الطالب في هذه الدورة...'] || 'اكتب وصفاً مختصراً عما سيتعلمه الطالب في هذه الدورة...'))}
              className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">{(t.addedTranslations_2026?.['المستوى'] || (t.addedTranslations_2026?.['المستوى'] || 'المستوى'))}</label>
              <select 
                title="Level"
                role="combobox"
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.level}
                onChange={e => setFormData({...formData, level: e.target.value as any})}
              >
                <option value="beginner">{(t.addedTranslations_2026?.['مبتدئ'] || (t.addedTranslations_2026?.['مبتدئ'] || 'مبتدئ'))}</option>
                <option value="intermediate">{(t.addedTranslations_2026?.['متوسط'] || (t.addedTranslations_2026?.['متوسط'] || 'متوسط'))}</option>
                <option value="advanced">{(t.addedTranslations_2026?.['متقدم'] || (t.addedTranslations_2026?.['متقدم'] || 'متقدم'))}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">{(t.addedTranslations_2026?.['التصنيف'] || (t.addedTranslations_2026?.['التصنيف'] || 'التصنيف'))}</label>
              <select 
                title="Category"
                role="combobox"
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category_id}
                onChange={e => setFormData({...formData, category_id: e.target.value})}
              >
                <option value="">{(t.addedTranslations_2026?.['بدون تصنيف'] || (t.addedTranslations_2026?.['بدون تصنيف'] || 'بدون تصنيف'))}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-bold text-foreground block mb-2">{(t.addedTranslations_2026?.['رؤية الدورة'] || (t.addedTranslations_2026?.['رؤية الدورة'] || 'رؤية الدورة'))}</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 p-3 border border-border rounded-lg bg-background cursor-pointer hover:border-blue-500/50 flex-1 transition-colors">
                  <input 
                    type="radio" 
                    name="scope" 
                    value="public" 
                    checked={formData.scope === 'public'} 
                    onChange={e => setFormData({...formData, scope: 'public'})}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-bold text-sm">{(t.addedTranslations_2026?.['دورة عامة'] || (t.addedTranslations_2026?.['دورة عامة'] || 'دورة عامة'))}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{(t.addedTranslations_2026?.['تظهر لجميع الطلاب في تصفح الدورات'] || (t.addedTranslations_2026?.['تظهر لجميع الطلاب في تصفح الدورات'] || 'تظهر لجميع الطلاب في تصفح الدورات'))}</p>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-3 border border-border rounded-lg bg-background cursor-pointer hover:border-emerald-500/50 flex-1 transition-colors">
                  <input 
                    type="radio" 
                    name="scope" 
                    value="path_only" 
                    checked={formData.scope === 'path_only'} 
                    onChange={e => setFormData({...formData, scope: 'path_only'})}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400">{(t.addedTranslations_2026?.['مخصصة لمسار فقط'] || (t.addedTranslations_2026?.['مخصصة لمسار فقط'] || 'مخصصة لمسار فقط'))}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{(t.addedTranslations_2026?.['مخفية، وتظهر فقط للطلاب الملتحقين بالمسار'] || (t.addedTranslations_2026?.['مخفية، وتظهر فقط للطلاب الملتحقين بالمسار'] || 'مخفية، وتظهر فقط للطلاب الملتحقين بالمسار'))}</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">{(t.addedTranslations_2026?.['رابط صورة الغلاف (اختياري)'] || (t.addedTranslations_2026?.['رابط صورة الغلاف (اختياري)'] || 'رابط صورة الغلاف (اختياري)'))}</label>
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
              {(t.addedTranslations_2026?.['إنشاء وحفظ'] || (t.addedTranslations_2026?.['إنشاء وحفظ'] || 'إنشاء وحفظ'))}
            </button>
            <Link 
              href="/academy/teacher/courses"
              className="px-6 py-3 border border-border bg-card hover:bg-muted text-foreground font-bold rounded-lg transition-colors"
            >
              {(t.addedTranslations_2026?.['إلغاء'] || (t.addedTranslations_2026?.['إلغاء'] || 'إلغاء'))}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
