"use client"

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { 
  BookMarked, Calendar, Star, TrendingUp, Flame, 
  ChevronDown, Plus, CheckCircle2, Clock, Target
} from 'lucide-react'

interface MemorizationProgress {
  total_ayahs: number
  total_juz: number
  last_memorized_surah: number
  last_memorized_ayah: number
  streak_days: number
  total_reviews: number
}

interface MemorizationLog {
  id: string
  surah_number: number
  surah_name: string
  ayah_from: number
  ayah_to: number
  quality: 'excellent' | 'good' | 'acceptable' | 'needs_review'
  points_earned: number
  logged_at: string
  teacher_name?: string
}

const SURAHS = [
  { number: 1, name: 'الفاتحة', ayahs: 7 },
  { number: 2, name: 'البقرة', ayahs: 286 },
  { number: 3, name: 'آل عمران', ayahs: 200 },
  // ... يمكن إضافة باقي السور
  { number: 114, name: 'الناس', ayahs: 6 },
]

export default function MemorizationPage() {
  const { t } = useI18n()
  const [progress, setProgress] = useState<MemorizationProgress | null>(null)
  const [logs, setLogs] = useState<MemorizationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [progressRes, logsRes] = await Promise.all([
          fetch('/api/academy/student/memorization/progress'),
          fetch('/api/academy/student/memorization/logs?limit=10')
        ])

        if (progressRes.ok) {
          const data = await progressRes.json()
          setProgress(data)
        }
        if (logsRes.ok) {
          const data = await logsRes.json()
          setLogs(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch memorization data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const qualityLabels = {
    excellent: { label: t.academy?.excellent || 'ممتاز', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    good: { label: t.academy?.good || 'جيد', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    acceptable: { label: t.academy?.acceptable || 'مقبول', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    needs_review: { label: t.academy?.needsReview || 'يحتاج مراجعة', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.academy?.memorization || 'الحفظ والمراجعة'}</h1>
          <p className="text-muted-foreground mt-1">
            {t.academy?.trackMemorization || 'تتبع تقدمك في حفظ القرآن الكريم'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.academy?.logMemorization || 'تسجيل حفظ جديد'}
        </button>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <BookMarked className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{progress?.total_juz || 0}</p>
          <p className="text-sm opacity-90">{t.academy?.juzMemorized || 'جزء محفوظ'}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <Target className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{progress?.total_ayahs || 0}</p>
          <p className="text-sm opacity-90">{t.academy?.ayahsMemorized || 'آية محفوظة'}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <Flame className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{progress?.streak_days || 0}</p>
          <p className="text-sm opacity-90">{t.academy?.streakDays || 'يوم متتالي'}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{progress?.total_reviews || 0}</p>
          <p className="text-sm opacity-90">{t.academy?.totalReviews || 'مراجعة'}</p>
        </div>
      </div>

      {/* Current Position */}
      {progress && progress.last_memorized_surah > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-blue-600" />
            {t.academy?.currentPosition || 'الموقع الحالي'}
          </h2>
          <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              {progress.last_memorized_surah}
            </div>
            <div>
              <p className="font-semibold">
                {t.academy?.surah || 'سورة'} {SURAHS.find(s => s.number === progress.last_memorized_surah)?.name || progress.last_memorized_surah}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.academy?.ayah || 'الآية'} {progress.last_memorized_ayah}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Memorization History */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          {t.academy?.memorizationHistory || 'سجل الحفظ'}
        </h2>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t.academy?.noMemorizationLogs || 'لا يوجد سجل حفظ بعد'}</p>
            <p className="text-sm mt-1">{t.academy?.startMemorizing || 'ابدأ بتسجيل حفظك الأول'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {t.academy?.surah || 'سورة'} {log.surah_name || log.surah_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t.academy?.ayahs || 'الآيات'} {log.ayah_from} - {log.ayah_to}
                  </p>
                </div>
                <div className="text-left">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    qualityLabels[log.quality].color
                  )}>
                    {qualityLabels[log.quality].label}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    +{log.points_earned}
                  </p>
                </div>
                <div className="text-left text-sm text-muted-foreground hidden sm:block">
                  {formatDate(log.logged_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Memorization Modal */}
      {showAddModal && (
        <AddMemorizationModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            // Refresh data
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

function AddMemorizationModal({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void
  onSuccess: () => void 
}) {
  const { t } = useI18n()
  const [surahNumber, setSurahNumber] = useState('')
  const [ayahFrom, setAyahFrom] = useState('')
  const [ayahTo, setAyahTo] = useState('')
  const [quality, setQuality] = useState<'excellent' | 'good' | 'acceptable' | 'needs_review'>('good')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!surahNumber || !ayahFrom || !ayahTo) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/academy/student/memorization/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surah_number: parseInt(surahNumber),
          ayah_from: parseInt(ayahFrom),
          ayah_to: parseInt(ayahTo),
          quality
        })
      })

      if (res.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to log memorization:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl border border-border p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">{t.academy?.logMemorization || 'تسجيل حفظ جديد'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t.academy?.surahNumber || 'رقم السورة'}
            </label>
            <input
              type="number"
              min="1"
              max="114"
              value={surahNumber}
              onChange={(e) => setSurahNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.academy?.fromAyah || 'من الآية'}
              </label>
              <input
                type="number"
                min="1"
                value={ayahFrom}
                onChange={(e) => setAyahFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.academy?.toAyah || 'إلى الآية'}
              </label>
              <input
                type="number"
                min="1"
                value={ayahTo}
                onChange={(e) => setAyahTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t.academy?.quality || 'جودة الحفظ'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['excellent', 'good', 'acceptable', 'needs_review'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuality(q)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    quality === q
                      ? "bg-blue-600 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {q === 'excellent' && (t.academy?.excellent || 'ممتاز')}
                  {q === 'good' && (t.academy?.good || 'جيد')}
                  {q === 'acceptable' && (t.academy?.acceptable || 'مقبول')}
                  {q === 'needs_review' && (t.academy?.needsReview || 'يحتاج مراجعة')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              {t.cancel || 'إلغاء'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? '...' : (t.save || 'حفظ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
