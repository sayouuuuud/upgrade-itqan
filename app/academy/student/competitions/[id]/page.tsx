'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Trophy, Calendar, Users, Star, Clock, ArrowRight, Loader2, Upload, Mic, CheckCircle, AlertCircle, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Competition {
  id: string
  title: string
  description: string | null
  type: string
  start_date: string
  end_date: string
  status: string
  max_participants: number | null
  prizes_description: string | null
  rules: string | null
  tajweed_rules: string[] | null
  is_featured: boolean
  participants_count: number
  has_joined: boolean
  min_verses: number
}

interface Entry {
  id: string
  submission_url: string | null
  notes: string | null
  score: number | null
  status: string
  feedback: string | null
  tajweed_scores: Record<string, number>
  verses_count: number
  submitted_at: string
  evaluated_at: string | null
}

const TAJWEED_LABELS: Record<string, string> = {
  idgham: 'الإدغام', ikhfa: 'الإخفاء', iqlab: 'الإقلاب', izhar: 'الإظهار',
  madd: 'المدود', qalqala: 'القلقلة', ghunna: 'الغنة',
  tafkhim_tarqiq: 'التفخيم والترقيق', waqf: 'الوقف والابتداء', makharij: 'مخارج الحروف',
}

export default function StudentCompetitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [joining, setJoining] = useState(false)
  const [form, setForm] = useState({ submission_url: '', notes: '', verses_count: 0 })

  useEffect(() => {
    async function load() {
      try {
        const [compRes, entriesRes] = await Promise.all([
          fetch(`/api/academy/student/competitions?status=all`),
          fetch(`/api/academy/student/competitions?view=my_entries`),
        ])

        if (compRes.ok) {
          const compData = await compRes.json()
          const found = (compData.data || []).find((c: Competition) => c.id === id)
          if (found) setCompetition(found)
        }

        if (entriesRes.ok) {
          const entriesData = await entriesRes.json()
          const myEntry = (entriesData.data || []).find((e: Entry & { competition_id: string }) => e.competition_id === id)
          if (myEntry) {
            setEntry(myEntry)
            setForm({
              submission_url: myEntry.submission_url || '',
              notes: myEntry.notes || '',
              verses_count: myEntry.verses_count || 0,
            })
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleJoin = async () => {
    setJoining(true)
    try {
      const res = await fetch(`/api/academy/student/competitions/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        setCompetition(prev => prev ? { ...prev, has_joined: true } : null)
        setEntry({ id: '', submission_url: null, notes: null, score: null, status: 'pending', feedback: null, tajweed_scores: {}, verses_count: 0, submitted_at: new Date().toISOString(), evaluated_at: null })
      } else {
        const data = await res.json()
        alert(data.error || 'حدث خطأ')
      }
    } finally {
      setJoining(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.submission_url) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/academy/student/competitions/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setEntry(prev => prev ? {
          ...prev,
          submission_url: form.submission_url,
          notes: form.notes,
          verses_count: form.verses_count,
          submitted_at: new Date().toISOString(),
        } : null)
        alert('تم تقديم المشاركة بنجاح!')
      } else {
        const data = await res.json()
        alert(data.error || 'حدث خطأ')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">المسابقة غير موجودة</p>
        <Link href="/academy/student/competitions" className="text-amber-600 hover:underline mt-2 inline-block">
          العودة للمسابقات
        </Link>
      </div>
    )
  }

  const startDate = new Date(competition.start_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
  const endDate = new Date(competition.end_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link href="/academy/student/competitions" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowRight className="w-4 h-4" />
        العودة للمسابقات
      </Link>

      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{competition.title}</h1>
            {competition.description && (
              <p className="text-muted-foreground mt-2">{competition.description}</p>
            )}
          </div>
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            competition.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            competition.status === 'upcoming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          )}>
            {competition.status === 'active' ? 'نشطة' : competition.status === 'upcoming' ? 'قادمة' : 'منتهية'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {startDate} — {endDate}</span>
          <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {competition.participants_count} مشارك</span>
        </div>

        {competition.prizes_description && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">🏅 {competition.prizes_description}</p>
          </div>
        )}

        {competition.rules && (
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
            <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">📋 القوانين: {competition.rules}</p>
          </div>
        )}

        {competition.tajweed_rules && competition.tajweed_rules.length > 0 && (
          <div className="bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-800 rounded-lg p-3 mt-3">
            <p className="text-sm font-medium text-pink-800 dark:text-pink-300 mb-2">أحكام التجويد المطلوبة:</p>
            <div className="flex flex-wrap gap-2">
              {competition.tajweed_rules.map(rule => (
                <span key={rule} className="px-2 py-1 bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 rounded-full text-xs font-medium">
                  {TAJWEED_LABELS[rule] || rule}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Join / Submit Section */}
      {!competition.has_joined && !entry ? (
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-bold mb-2">انضم للمسابقة!</h2>
          <p className="text-muted-foreground mb-4">سجّل الآن وشارك في المسابقة لكسب الشارات والنقاط</p>
          {competition.status === 'active' ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              {joining ? <Loader2 className="w-5 h-5 animate-spin inline-block ml-1" /> : <Trophy className="w-5 h-5 inline-block ml-1" />}
              سجّل الآن
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">المسابقة غير مفتوحة للتسجيل حالياً</p>
          )}
        </div>
      ) : entry ? (
        <div className="space-y-4">
          {/* Submission Status */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              {entry.status === 'winner' ? <Award className="w-5 h-5 text-amber-500" /> :
               entry.status === 'evaluated' ? <CheckCircle className="w-5 h-5 text-green-500" /> :
               <Clock className="w-5 h-5 text-blue-500" />}
              حالة مشاركتك
            </h2>

            {entry.status === 'winner' && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-300 dark:border-amber-700 rounded-xl p-4 mb-4 text-center">
                <Trophy className="w-10 h-10 mx-auto mb-2 text-amber-500" />
                <p className="text-lg font-bold text-amber-800 dark:text-amber-300">مبارك! أنت الفائز! 🎉</p>
              </div>
            )}

            {entry.score !== null && (
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center min-w-[100px]">
                  <p className="text-3xl font-bold text-amber-600">{entry.score}</p>
                  <p className="text-xs text-muted-foreground">الدرجة</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    الحالة: <span className="font-medium text-foreground">{entry.status === 'evaluated' ? 'تم التقييم' : entry.status === 'winner' ? 'فائز' : 'قيد التقييم'}</span>
                  </p>
                  {entry.evaluated_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      تاريخ التقييم: {new Date(entry.evaluated_at).toLocaleDateString('ar-EG')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {entry.feedback && (
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">ملاحظات المقرئ:</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">{entry.feedback}</p>
              </div>
            )}

            {/* Tajweed Scores */}
            {Object.keys(entry.tajweed_scores).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">تقييم أحكام التجويد:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(entry.tajweed_scores).map(([rule, score]) => (
                    <div key={rule} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                      <span className="text-sm">{TAJWEED_LABELS[rule] || rule}</span>
                      <span className="text-sm font-bold text-amber-600">{score}/10</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Form (only if competition is active) */}
          {competition.status === 'active' && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-500" />
                {entry.submission_url ? 'تحديث المشاركة' : 'تقديم المشاركة'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">رابط التلاوة / التسجيل *</label>
                  <input
                    type="url"
                    value={form.submission_url}
                    onChange={e => setForm(prev => ({ ...prev, submission_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">أرفق رابط تسجيل التلاوة الخاص بالمسابقة</p>
                </div>

                {(competition.type === 'ramadan' || competition.type === 'memorization') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">عدد الآيات المحفوظة</label>
                    <input
                      type="number"
                      value={form.verses_count}
                      onChange={e => setForm(prev => ({ ...prev, verses_count: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background"
                      min={0}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">ملاحظات إضافية</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background min-h-[80px] resize-y"
                    placeholder="أي ملاحظات تود إضافتها..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !form.submission_url}
                  className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin inline-block ml-1" /> : <Upload className="w-5 h-5 inline-block ml-1" />}
                  {entry.submission_url ? 'تحديث المشاركة' : 'تقديم المشاركة'}
                </button>
              </form>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
