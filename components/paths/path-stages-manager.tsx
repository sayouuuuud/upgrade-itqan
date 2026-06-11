'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Plus, Trash2, Edit2, X, Loader2, GripVertical, Clock,
  Video, FileText, BookOpen, ChevronDown, ChevronUp, UploadCloud, Layers, Users
} from 'lucide-react'
import { toast } from 'sonner'

interface Stage {
  id: string
  position: number
  title: string
  description: string | null
  content: string | null
  video_url: string | null
  pdf_url: string | null
  passage_text: string | null
  estimated_minutes: number
  stage_type: 'custom' | 'course' | 'halaqa' | 'lesson'
  course_id: string | null
  halaqa_id: string | null
  lesson_id: string | null
  require_audio?: boolean
  require_file?: boolean
  task_instructions?: string | null
  course_title?: string
  halaqa_title?: string
  lesson_title?: string
}

interface StageForm {
  title: string
  description: string
  content: string
  video_url: string
  pdf_url: string
  passage_text: string
  estimated_minutes: number
  stage_type: 'custom' | 'course' | 'halaqa' | 'lesson'
  course_id: string
  halaqa_id: string
  lesson_id: string
  require_audio: boolean
  require_file: boolean
  task_instructions: string
}

const emptyStage: StageForm = {
  title: '', description: '', content: '', video_url: '',
  pdf_url: '', passage_text: '', estimated_minutes: 30,
  stage_type: 'custom', course_id: '', halaqa_id: '', lesson_id: '',
  require_audio: false, require_file: false, task_instructions: ''
}

export default function PathStagesManager({ pathId }: { pathId: string }) {
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<StageForm>(emptyStage)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [entities, setEntities] = useState<{courses: any[], halaqat: any[], lessons: any[]}>({courses: [], halaqat: [], lessons: []})
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const fetchEntities = async () => {
    try {
      const res = await fetch(`/api/academy/teacher/paths/entities`)
      if (res.ok) {
        const json = await res.json()
        setEntities(json.data || {courses: [], halaqat: [], lessons: []})
      }
    } catch {}
  }

  const fetchStages = async () => {
    try {
      const res = await fetch(`/api/academy/teacher/paths/${pathId}/stages`)
      if (res.ok) {
        const json = await res.json()
        setStages(json.data || [])
      } else {
        toast.error('تعذّر تحميل مراحل المسار')
      }
    } catch {
      toast.error('حدث خطأ أثناء تحميل المراحل')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStages(); fetchEntities() }, [pathId])

  const openAdd = () => {
    setEditId(null)
    setForm(emptyStage)
    setShowForm(true)
  }

  const openEdit = (s: Stage) => {
    setEditId(s.id)
    setForm({
      title: s.title,
      description: s.description || '',
      content: s.content || '',
      video_url: s.video_url || '',
      pdf_url: s.pdf_url || '',
      passage_text: s.passage_text || '',
      estimated_minutes: s.estimated_minutes || 30,
      stage_type: s.stage_type || 'custom',
      course_id: s.course_id || '',
      halaqa_id: s.halaqa_id || '',
      lesson_id: s.lesson_id || '',
      require_audio: s.require_audio ?? false,
      require_file: s.require_file ?? false,
      task_instructions: s.task_instructions || ''
    })
    setShowForm(true)
  }

  const handlePdfUpload = async (file: File) => {
    setUploadingPdf(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (res.ok && json.url) {
        setForm((prev) => ({ ...prev, pdf_url: json.url }))
        toast.success('تم رفع الملف')
      } else {
        toast.error(json.error || 'فشل رفع الملف')
      }
    } catch {
      toast.error('حدث خطأ أثناء رفع الملف')
    } finally {
      setUploadingPdf(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const url = editId
        ? `/api/academy/teacher/paths/${pathId}/stages/${editId}`
        : `/api/academy/teacher/paths/${pathId}/stages`
      const res = await fetch(url, {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(editId ? 'تم تحديث المرحلة' : 'تمت إضافة المرحلة')
        setShowForm(false)
        fetchStages()
      } else {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || 'تعذّر حفظ المرحلة')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المرحلة؟')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/academy/teacher/paths/${pathId}/stages/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('تم حذف المرحلة')
        fetchStages()
      } else {
        toast.error('تعذّر حذف المرحلة')
      }
    } finally {
      setDeletingId(null)
    }
  }

  const totalMinutes = stages.reduce((sum, s) => sum + (s.estimated_minutes || 0), 0)

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Layers className="w-4 h-4 text-emerald-600" />
            {stages.length} مرحلة
          </span>
          {totalMinutes > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              {totalMinutes} دقيقة تقديرية
            </span>
          )}
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          إضافة مرحلة
        </button>
      </div>

      {/* Stages list */}
      {stages.length === 0 ? (
        <div className="bg-muted/30 border border-dashed border-border rounded-2xl p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium mb-4">لا توجد مراحل في هذا المسار بعد</p>
          <button onClick={openAdd} className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors text-sm">
            ابدأ بإضافة أول مرحلة
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {stages.map((s, idx) => {
            const isOpen = expanded === s.id
            return (
              <div key={s.id} className="bg-card border border-border rounded-2xl overflow-hidden transition-all hover:border-emerald-500/40">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex items-center gap-2 shrink-0">
                    <GripVertical className="w-4 h-4 text-muted-foreground/40" />
                    <span className="w-8 h-8 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground truncate">{s.title}</h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {s.estimated_minutes} د</span>
                      {s.stage_type === 'course' && <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30"><BookOpen className="w-3 h-3" /> دورة: {s.course_title}</span>}
                      {s.stage_type === 'halaqa' && <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/30"><Users className="w-3 h-3" /> حلقة: {s.halaqa_title}</span>}
                      {s.stage_type === 'lesson' && <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/30"><Video className="w-3 h-3" /> درس: {s.lesson_title}</span>}
                      {s.video_url && <span className="inline-flex items-center gap-1 text-rose-500"><Video className="w-3 h-3" /> فيديو</span>}
                      {s.pdf_url && <span className="inline-flex items-center gap-1 text-blue-500"><FileText className="w-3 h-3" /> ملف</span>}
                      {s.passage_text && <span className="inline-flex items-center gap-1 text-emerald-600"><BookOpen className="w-3 h-3" /> مقطع</span>}
                      {s.require_audio && <span className="inline-flex items-center gap-1 text-sky-600 bg-sky-50 dark:bg-sky-900/20 px-1.5 py-0.5 rounded border border-sky-100 dark:border-sky-900/30">تسجيل صوتي (مراجعة)</span>}
                      {s.require_file && <span className="inline-flex items-center gap-1 text-violet-600 bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5 rounded border border-violet-100 dark:border-violet-900/30">رفع ملف (مراجعة)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {(s.description || s.content || s.passage_text) && (
                      <button
                        onClick={() => setExpanded(isOpen ? null : s.id)}
                        className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                        title="عرض التفاصيل"
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                    <button onClick={() => openEdit(s)} className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors" title="تعديل">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors disabled:opacity-50"
                      title="حذف"
                    >
                      {deletingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 pt-0 border-t border-border/50 space-y-3 text-sm">
                    {s.description && (
                      <div className="pt-3">
                        <p className="text-xs font-bold text-muted-foreground mb-1">الوصف</p>
                        <p className="text-foreground leading-relaxed">{s.description}</p>
                      </div>
                    )}
                    {s.content && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground mb-1">المحتوى</p>
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{s.content}</p>
                      </div>
                    )}
                    {s.passage_text && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground mb-1">المقطع المطلوب</p>
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{s.passage_text}</p>
                      </div>
                    )}
                    {s.video_url && (
                      <a href={s.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-rose-600 hover:underline text-xs font-medium">
                        <Video className="w-3.5 h-3.5" /> فتح رابط الفيديو
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Stage form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="text-lg font-bold">{editId ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-bold block mb-2">نوع المرحلة <span className="text-rose-500">*</span></label>
                  <div className="flex bg-muted/50 p-1 rounded-xl border border-border overflow-x-auto scrollbar-none">
                    {[
                      { id: 'custom', label: 'درس' },
                      { id: 'lesson', label: 'درس ضمن دورة' },
                      { id: 'course', label: 'دورة كاملة' },
                      { id: 'halaqa', label: 'حلقة تفاعلية' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setForm({ ...form, stage_type: tab.id as any })}
                        className={`flex-1 min-w-[100px] whitespace-nowrap text-sm font-bold py-2 px-3 rounded-lg transition-all ${
                          form.stage_type === tab.id
                            ? 'bg-card text-emerald-600 shadow-sm border border-border/50'
                            : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-bold block mb-1.5">عنوان المرحلة <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder={form.stage_type === 'custom' ? "مثال: أحكام النون الساكنة" : "عنوان يظهر في المسار"}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {form.stage_type === 'course' && (
                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <label className="text-sm font-bold block mb-1.5 text-emerald-800 dark:text-emerald-300">اختر الدورة <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={form.course_id}
                    onChange={(e) => {
                      const c = entities.courses.find((x: any) => x.id === e.target.value)
                      setForm({ ...form, course_id: e.target.value, title: c && form.title === '' ? c.title : form.title })
                    }}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">— اختر الدورة —</option>
                    {entities.courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  <div className="mt-2 text-left">
                    <a href="/academy/teacher/courses/new?scope=path_only" target="_blank" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-2">أو أنشئ دورة مخصصة لهذا المسار</a>
                  </div>
                </div>
              )}
              {form.stage_type === 'halaqa' && (
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <label className="text-sm font-bold block mb-1.5 text-blue-800 dark:text-blue-300">اختر الحلقة <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={form.halaqa_id}
                    onChange={(e) => {
                      const h = entities.halaqat.find((x: any) => x.id === e.target.value)
                      setForm({ ...form, halaqa_id: e.target.value, title: h && form.title === '' ? h.title : form.title })
                    }}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">— اختر الحلقة —</option>
                    {entities.halaqat.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
                  </select>
                  <div className="mt-2 text-left">
                    <a href="/academy/teacher/halaqat?new=true&scope=path_only" target="_blank" className="text-xs font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2">أو أنشئ حلقة مخصصة لهذا المسار</a>
                  </div>
                </div>
              )}
              {form.stage_type === 'lesson' && (
                <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 space-y-4">
                  <div>
                    <label className="text-sm font-bold block mb-1.5 text-amber-800 dark:text-amber-300">اختر الدورة أولاً <span className="text-rose-500">*</span></label>
                    <select
                      value={form.course_id}
                      onChange={(e) => setForm({ ...form, course_id: e.target.value, lesson_id: '' })}
                      className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">— اختر الدورة —</option>
                      {entities.courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold block mb-1.5 text-amber-800 dark:text-amber-300">اختر الدرس <span className="text-rose-500">*</span></label>
                    <select
                      required
                      disabled={!form.course_id}
                      value={form.lesson_id}
                      onChange={(e) => {
                        const l = entities.lessons.find((x: any) => x.id === e.target.value)
                        setForm({ ...form, lesson_id: e.target.value, title: l && form.title === '' ? l.title : form.title })
                      }}
                      className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      <option value="">— اختر الدرس —</option>
                      {entities.lessons
                        .filter(l => l.course_id === form.course_id)
                        .map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {form.stage_type === 'custom' && (
                <>
                  <div>
                    <label className="text-sm font-bold block mb-1.5">وصف مختصر</label>
                    <textarea
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="نبذة قصيرة عن هذه المرحلة..."
                      className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold block mb-1.5">المحتوى التعليمي</label>
                    <textarea
                      rows={4}
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="اشرح محتوى المرحلة، النقاط الأساسية، التعليمات للطالب..."
                      className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold block mb-1.5">المقطع المطلوب تلاوته (اختياري)</label>
                    <textarea
                      rows={2}
                      value={form.passage_text}
                      onChange={(e) => setForm({ ...form, passage_text: e.target.value })}
                      placeholder="الآيات أو النص المرجعي لهذه المرحلة..."
                      className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold block mb-1.5">رابط فيديو (اختياري)</label>
                    <input
                      type="url"
                      value={form.video_url}
                      onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                      placeholder="https://youtube.com/..."
                      className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold block mb-1.5">ملف مرفق PDF (اختياري)</label>
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handlePdfUpload(f)
                      }}
                    />
                    {form.pdf_url ? (
                      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border border-emerald-500/30 bg-emerald-500/5 rounded-lg">
                        <a href={form.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:underline truncate">
                          <FileText className="w-4 h-4 shrink-0" /> تم إرفاق الملف
                        </a>
                        <button type="button" onClick={() => setForm({ ...form, pdf_url: '' })} className="text-xs text-rose-500 hover:underline shrink-0">
                          إزالة
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        disabled={uploadingPdf}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-border rounded-lg hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
                      >
                        {uploadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        {uploadingPdf ? 'جاري الرفع...' : 'رفع ملف PDF'}
                      </button>
                    )}
                  </div>
                </>
              )}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-bold flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  متطلبات الاجتياز والمراجعة
                </p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.require_audio}
                    onChange={(e) => setForm({ ...form, require_audio: e.target.checked })}
                    className="mt-1 w-4 h-4 accent-emerald-600"
                  />
                  <span className="text-sm">
                    <span className="font-bold">يتطلب تسجيلاً صوتياً</span>
                    <span className="block text-xs text-muted-foreground">يرسل الطالب تلاوة صوتية وتراجعها أنت قبل اعتماد الاجتياز.</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.require_file}
                    onChange={(e) => setForm({ ...form, require_file: e.target.checked })}
                    className="mt-1 w-4 h-4 accent-emerald-600"
                  />
                  <span className="text-sm">
                    <span className="font-bold">يتطلب رفع ملف (مهمة تسليم)</span>
                    <span className="block text-xs text-muted-foreground">يرفع الطالب ملفاً مطلوباً وتراجعه أنت قبل اعتماد الاجتياز.</span>
                  </span>
                </label>
                {(form.require_audio || form.require_file) && (
                  <div>
                    <label className="text-xs font-bold block mb-1.5 text-muted-foreground">تعليمات التسليم للطالب (اختياري)</label>
                    <textarea
                      rows={2}
                      value={form.task_instructions}
                      onChange={(e) => setForm({ ...form, task_instructions: e.target.value })}
                      placeholder="اشرح للطالب ما المطلوب تسليمه بالتحديد..."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5">المدة التقديرية (دقائق)</label>
                <input
                  type="number"
                  min={1}
                  value={form.estimated_minutes}
                  onChange={(e) => setForm({ ...form, estimated_minutes: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-border rounded-lg font-bold hover:bg-muted transition-colors">
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingPdf}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editId ? 'حفظ التعديلات' : 'إضافة المرحلة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
