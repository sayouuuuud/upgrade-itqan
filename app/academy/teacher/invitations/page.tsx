'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Plus, Loader2, Link as LinkIcon, CheckCircle2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface Course {
  id: string
  title: string
}

interface InvitationCode {
  id: string
  code: string
  course_id: string | null
  course_title: string | null
  max_uses: number
  used_count: number
  expires_at: string | null
  created_at: string
}

export default function TeacherInvitationsPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const [codes, setCodes] = useState<InvitationCode[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const [generating, setGenerating] = useState(false)
  const [newCourseId, setNewCourseId] = useState('')
  const [newMaxUses, setNewMaxUses] = useState(10)

  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/academy/teacher/invitations')
      const data = await res.json()
      if (res.ok) {
        setCodes(data.codes || [])
        setCourses(data.courses || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/academy/teacher/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: newCourseId || null,
          maxUses: newMaxUses
        })
      })
      if (res.ok) {
        fetchCodes()
        setNewMaxUses(10)
        setNewCourseId('')
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="space-y-1 shrink-0">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
          <LinkIcon className="w-8 h-8 text-primary" />
          {isAr ? "أكواد الدعوة للطلاب" : "Student Invitations"}
        </h1>
        <p className="text-muted-foreground font-medium">
          {isAr ? "أنشئ أكواد دعوة للطلاب للانضمام لدوراتك التدريبية." : "Generate invitation codes for students to join your courses."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Generate Card */}
        <Card className="md:col-span-1 border-border shadow-sm h-fit">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-lg">{isAr ? "توليد كود جديد" : "Generate New Code"}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="space-y-2">
              <Label className="font-bold text-foreground/80">{isAr ? "ارتباط بدورة (اختياري)" : "Link to Course (Optional)"}</Label>
              <select
                value={newCourseId}
                onChange={e => setNewCourseId(e.target.value)}
                className="w-full border-border bg-card p-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">{isAr ? "المسار العام (بدون دورة محددة)" : "General (No specific course)"}</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-foreground/80">{isAr ? "الحد الأقصى للاستخدام" : "Max Uses"}</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={newMaxUses}
                onChange={e => setNewMaxUses(parseInt(e.target.value) || 1)}
                className="rounded-lg bg-card"
              />
            </div>

            <Button onClick={handleGenerate} disabled={generating} className="w-full gap-2 rounded-lg py-5 shadow-sm">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isAr ? "توليد كود دعوة" : "Generate Code"}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Codes */}
        <Card className="md:col-span-2 border-border shadow-sm">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-lg">{isAr ? "الأكواد النشطة" : "Active Codes"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : codes.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground">
                {isAr ? "لا توجد أكواد حالياً. ابدأ بتوليد كود جديد." : "No codes yet. Generate a new one."}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {codes.map(c => (
                  <div key={c.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors hover:bg-muted/30">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xl font-black text-primary tracking-widest">{c.code}</span>
                        {c.course_title && (
                          <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full truncate">
                            {c.course_title}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                        <span>{isAr ? "الاستخدام:" : "Usage:"} <strong className={`${c.used_count >= c.max_uses ? 'text-destructive' : 'text-foreground'}`}>{c.used_count}</strong> / {c.max_uses}</span>
                        <span>{isAr ? "تاريخ الإنشاء:" : "Created:"} {formatTime(c.created_at)}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handleCopy(c.code, c.id)}
                      className={`shrink-0 gap-2 ${copiedId === c.id ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-700' : ''}`}
                    >
                      {copiedId === c.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedId === c.id ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ الكود" : "Copy Code")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
