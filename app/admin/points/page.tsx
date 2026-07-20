'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Star, TrendingUp, Flame, Users, History, Settings,
  Plus, Minus, Search, Loader2, BarChart3, ArrowRight,
  ArrowLeft, User, Zap, Award, RefreshCw, Save,
  ChevronDown, ChevronUp, Trophy, X, Eye, Trash2, Edit3
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

// ── Types ──

interface Stats {
  total_students: number
  total_points_awarded: number
  avg_points: number
  avg_streak: number
  max_points: number
  max_streak: number
}

interface LevelDist { level: string; count: number }

interface RecentActivity {
  id: string
  user_id: string
  user_name: string
  user_email: string
  points: number
  reason: string
  description: string | null
  created_at: string
}

interface TopStudent {
  id: string
  name: string
  email: string
  total_points: number
  level: string
  streak_days: number
  longest_streak: number
}

interface DailyActivity {
  day: string
  transactions: number
  total_points: number
}

interface StudentSearch {
  id: string
  name: string
  email: string
  total_points: number
  level: string
  streak_days: number
}

interface StudentDetail {
  id: string
  name: string
  email: string
  total_points: number
  level: string
  streak_days: number
  longest_streak: number
  last_activity_date: string | null
  total_verses_memorized: number
  total_verses_revised: number
}

interface PointsBreakdown {
  reason: string
  count: number
  total: number
}

interface LogEntry {
  id: string
  points: number
  reason: string
  description: string | null
  created_at: string
}

interface Badge {
  badge_key: string
  badge_name: string
  badge_description: string
  badge_icon: string
  badge_image_url: string | null
  badge_color: string
  points_awarded: number
  awarded_at: string
}

// ── Constants ──

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  hafiz: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

// ── Tab Types ──
type Tab = 'overview' | 'config' | 'students'

export default function AdminPointsPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const tr = (ar: string, en: string) => (isAr ? ar : en)

  const REASON_LABELS = useMemo<Record<string, string>>(() => ({
    recitation: tr('تسجيل تلاوة', 'Recitation Logged'),
    mastered: tr('متقن تلاوة', 'Recitation Mastered'),
    task: tr('إنهاء مهمة', 'Task Completed'),
    lesson: tr('درس', 'Lesson'),
    streak: tr('يوم Streak', 'Streak Day'),
    juz_complete: tr('إنهاء جزء كامل', 'Juz Completed'),
    course_complete: tr('إنهاء دورة', 'Course Completed'),
    session_attend: tr('حضور درس', 'Session Attended'),
    daily_login: tr('تسجيل دخول يومي', 'Daily Login'),
    competition_win: tr('فوز بمسابقة', 'Competition Win'),
    badge_earned: tr('شارة جديدة', 'Badge Earned'),
    admin_adjust: tr('تعديل يدوي', 'Manual Adjustment'),
  }), [isAr])

  const LEVEL_LABELS = useMemo<Record<string, string>>(() => ({
    beginner: tr('مبتدئ', 'Beginner'),
    intermediate: tr('متوسط', 'Intermediate'),
    advanced: tr('متقدم', 'Advanced'),
    hafiz: tr('حافظ', 'Hafiz'),
  }), [isAr])
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)

  // ── Overview State ──
  const [stats, setStats] = useState<Stats | null>(null)
  const [levelDist, setLevelDist] = useState<LevelDist[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [topStudents, setTopStudents] = useState<TopStudent[]>([])
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([])

  // ── Config State ──
  const [pointsConfig, setPointsConfig] = useState<Record<string, number>>({})
  const [editConfig, setEditConfig] = useState<Record<string, number>>({})
  const [configSaving, setConfigSaving] = useState(false)
  const [configMsg, setConfigMsg] = useState<string | null>(null)

  // ── Students State ──
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StudentSearch[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null)
  const [studentLog, setStudentLog] = useState<LogEntry[]>([])
  const [studentBadges, setStudentBadges] = useState<Badge[]>([])
  const [studentBreakdown, setStudentBreakdown] = useState<PointsBreakdown[]>([])
  const [studentLoading, setStudentLoading] = useState(false)

  // ── Manual Adjust ──
  const [adjustPoints, setAdjustPoints] = useState('')
  const [adjustDesc, setAdjustDesc] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const [adjustResult, setAdjustResult] = useState<string | null>(null)

  // ── Actions State ──
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── Fetch Data ──

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/points')
      if (res.ok) {
        const json = await res.json()
        setStats(json.stats)
        setLevelDist(json.level_distribution || [])
        setRecentActivity(json.recent_activity || [])
        setTopStudents(json.top_students || [])
        setDailyActivity(json.daily_activity || [])
        setPointsConfig(json.points_config || {})
        setEditConfig(json.points_config || {})
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/points?search=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const json = await res.json()
        setSearchResults(json.students || [])
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setSearching(false)
    }
  }

  const selectStudent = async (userId: string) => {
    setStudentLoading(true)
    setAdjustResult(null)
    try {
      const res = await fetch(`/api/admin/points?user_id=${userId}`)
      if (res.ok) {
        const json = await res.json()
        setSelectedStudent(json.user)
        setStudentLog(json.log || [])
        setStudentBadges(json.badges || [])
        setStudentBreakdown(json.breakdown || [])
      }
    } catch (error) {
      console.error('Failed to fetch student:', error)
    } finally {
      setStudentLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    setConfigSaving(true)
    setConfigMsg(null)
    try {
      const res = await fetch('/api/admin/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_config', config: editConfig }),
      })
      if (res.ok) {
        setPointsConfig(editConfig)
        setConfigMsg(tr('تم حفظ الإعدادات بنجاح', 'Settings saved successfully'))
      } else {
        const data = await res.json()
        setConfigMsg(tr(`خطأ: ${data.error}`, `Error: ${data.error}`))
      }
    } catch {
      setConfigMsg(tr('فشل الاتصال', 'Connection failed'))
    } finally {
      setConfigSaving(false)
    }
  }

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !adjustPoints) return
    setAdjusting(true)
    setAdjustResult(null)
    try {
      const res = await fetch('/api/admin/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedStudent.id,
          points: Number(adjustPoints),
          description: adjustDesc || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setAdjustResult(tr(`تم! النقاط الجديدة: ${data.newTotal} — المستوى: ${LEVEL_LABELS[data.level] || data.level}`, `Done! New points: ${data.newTotal} — Level: ${LEVEL_LABELS[data.level] || data.level}`))
        setAdjustPoints('')
        setAdjustDesc('')
        selectStudent(selectedStudent.id)
      } else {
        setAdjustResult(tr(`خطأ: ${data.error}`, `Error: ${data.error}`))
      }
    } catch {
      setAdjustResult(tr('فشل الاتصال', 'Connection failed'))
    } finally {
      setAdjusting(false)
    }
  }

  const handleStudentAction = async (action: string, userId: string, extra?: Record<string, string>) => {
    setActionLoading(action)
    try {
      const res = await fetch('/api/admin/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, user_id: userId, ...extra }),
      })
      if (res.ok) {
        selectStudent(userId)
        fetchDashboard()
      }
    } catch (error) {
      console.error(`Action ${action} failed:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-7 h-7 text-amber-500" />
          {tr('إدارة النقاط والمستويات', 'Points & Levels Management')}
        </h1>
        <div className="flex gap-2">
          {([
            { key: 'overview' as Tab, label: tr('نظرة عامة', 'Overview'), icon: BarChart3 },
            { key: 'config' as Tab, label: tr('إعدادات النقاط', 'Points Settings'), icon: Settings },
            { key: 'students' as Tab, label: tr('إدارة الطلاب', 'Manage Students'), icon: Users },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${tab === t.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════ Tab: Overview ═══════════════ */}
      {tab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-5 text-center">
                <Users className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                <p className="text-2xl font-bold">{stats?.total_students ?? 0}</p>
                <p className="text-xs text-muted-foreground">{tr('طالب', 'Students')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <Star className="w-6 h-6 mx-auto mb-1 text-amber-500" />
                <p className="text-2xl font-bold">{(stats?.total_points_awarded ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{tr('إجمالي النقاط', 'Total Points')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-1 text-green-500" />
                <p className="text-2xl font-bold">{stats?.avg_points ?? 0}</p>
                <p className="text-xs text-muted-foreground">{tr('متوسط النقاط', 'Avg Points')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <Flame className="w-6 h-6 mx-auto mb-1 text-orange-500" />
                <p className="text-2xl font-bold">{stats?.avg_streak ?? 0}</p>
                <p className="text-xs text-muted-foreground">{tr('متوسط Streak', 'Avg Streak')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <Trophy className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
                <p className="text-2xl font-bold">{stats?.max_points ?? 0}</p>
                <p className="text-xs text-muted-foreground">{tr('أعلى نقاط', 'Max Points')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <Flame className="w-6 h-6 mx-auto mb-1 text-red-500" />
                <p className="text-2xl font-bold">{stats?.max_streak ?? 0}</p>
                <p className="text-xs text-muted-foreground">{tr('أطول Streak', 'Max Streak')}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Level Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5" />
                  {tr('توزيع المستويات', 'Levels Distribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {levelDist.map((ld) => {
                    const totalS = stats?.total_students || 1
                    const pct = Math.round((ld.count / totalS) * 100)
                    return (
                      <div key={ld.level} className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full w-20 text-center ${LEVEL_COLORS[ld.level] || LEVEL_COLORS.beginner}`}>
                          {LEVEL_LABELS[ld.level] || ld.level}
                        </span>
                        <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-20 text-left">
                          {ld.count} ({pct}%)
                        </span>
                      </div>
                    )
                  })}
                  {levelDist.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">{tr('لا توجد بيانات', 'No data available')}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top 10 Students */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  {tr('أفضل 10 طلاب', 'Top 10 Students')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topStudents.map((s, i) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => { setTab('students'); selectStudent(s.id) }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg w-6 text-center">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${LEVEL_COLORS[s.level] || LEVEL_COLORS.beginner}`}>
                            {LEVEL_LABELS[s.level] || s.level}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-600">{s.total_points}</span>
                        {s.streak_days > 0 && (
                          <span className="text-xs text-orange-500 flex items-center gap-0.5">
                            <Flame className="w-3 h-3" />{s.streak_days}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {topStudents.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">{tr('لا توجد بيانات', 'No data available')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Activity */}
          {dailyActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5" />
                  {tr('النشاط اليومي (آخر 14 يوم)', 'Daily Activity (Last 14 Days)')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {dailyActivity.map(d => (
                    <div key={d.day} className="text-center p-2 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">{new Date(d.day).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' })}</p>
                      <p className="text-lg font-bold text-amber-600">+{d.total_points}</p>
                      <p className="text-[10px] text-muted-foreground">{d.transactions} {tr('عملية', 'actions')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="w-5 h-5" />
                {tr('آخر النشاطات', 'Recent Activity')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{tr('لا توجد نشاطات بعد', 'No activities yet')}</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {recentActivity.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => { setTab('students'); selectStudent(a.user_id) }}
                    >
                      <div>
                        <p className="font-medium text-sm">{a.user_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {REASON_LABELS[a.reason] || a.reason}
                          {a.description ? ` — ${a.description}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${a.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {a.points >= 0 ? '+' : ''}{a.points}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══════════════ Tab: Config ═══════════════ */}
      {tab === 'config' && (
        <>
          {/* Points Config Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5" />
                {tr('إعدادات قيم النقاط', 'Points Value Settings')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {tr('عدّل قيم النقاط لكل نشاط. التغييرات تنطبق على النقاط الجديدة فقط.', 'Edit points value for each activity. Changes apply to new points only.')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(editConfig).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <div className="flex-1">
                      <label className="text-sm font-medium block mb-1">
                        {REASON_LABELS[key] || key}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={val}
                        onChange={(e) => setEditConfig(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                        className="h-9"
                      />
                    </div>
                    {val !== pointsConfig[key] && (
                      <span className="text-xs text-orange-500 mt-5">
                        {tr('كان:', 'Was:')} {pointsConfig[key]}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-6">
                <Button
                  onClick={handleSaveConfig}
                  disabled={configSaving || JSON.stringify(editConfig) === JSON.stringify(pointsConfig)}
                  className="min-w-[120px]"
                >
                  {configSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      {tr('حفظ الإعدادات', 'Save Settings')}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditConfig({ ...pointsConfig })}
                  disabled={JSON.stringify(editConfig) === JSON.stringify(pointsConfig)}
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  {tr('إلغاء التغييرات', 'Discard Changes')}
                </Button>
              </div>

              {configMsg && (
                <p className={`mt-3 text-sm font-medium ${configMsg.includes('Error') || configMsg.includes('خطأ') ? 'text-red-600' : 'text-green-600'}`}>
                  {configMsg}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Streak Multiplier Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flame className="w-5 h-5 text-orange-500" />
                {tr('مضاعف الـ Streak', 'Streak Multiplier')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm">
                  {tr('عندما يحافظ الطالب على Streak 7 أيام أو أكثر، تتضاعف جميع النقاط المكتسبة بمعامل ×1.5.', 'When a student maintains a streak of 7 days or more, all points earned are multiplied by ×1.5.')}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {tr(`مثال: تسجيل تلاوة = ${editConfig.recitation || 10} نقطة × 1.5 = ${Math.round((editConfig.recitation || 10) * 1.5)} نقطة`, `Example: Recitation = ${editConfig.recitation || 10} pts × 1.5 = ${Math.round((editConfig.recitation || 10) * 1.5)} pts`)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Level Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5" />
                {tr('حدود المستويات', 'Level Thresholds')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {([
                  { key: 'beginner', label: tr('مبتدئ', 'Beginner'), range: '0 – 499', color: 'border-gray-300 bg-gray-50 dark:bg-gray-800/50' },
                  { key: 'intermediate', label: tr('متوسط', 'Intermediate'), range: '500 – 1,999', color: 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' },
                  { key: 'advanced', label: tr('متقدم', 'Advanced'), range: '2,000 – 4,999', color: 'border-purple-300 bg-purple-50 dark:bg-purple-900/20' },
                  { key: 'hafiz', label: tr('حافظ', 'Hafiz'), range: '5,000+', color: 'border-amber-300 bg-amber-50 dark:bg-amber-900/20' },
                ]).map(l => (
                  <div key={l.key} className={`p-4 rounded-lg border-2 text-center ${l.color}`}>
                    <p className="font-bold text-lg">{l.label}</p>
                    <p className="text-sm text-muted-foreground">{l.range} {tr('نقطة', 'pts')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══════════════ Tab: Students ═══════════════ */}
      {tab === 'students' && (
        <>
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={tr('ابحث بالاسم أو البريد الإلكتروني...', 'Search by name or email...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pr-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : tr('بحث', 'Search')}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  {searchResults.map(s => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => selectStudent(s.id)}
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[s.level] || LEVEL_COLORS.beginner}`}>
                          {LEVEL_LABELS[s.level] || s.level}
                        </span>
                        <span className="font-bold text-amber-600">{s.total_points}</span>
                        {isAr ? <ArrowLeft className="w-4 h-4 text-muted-foreground" /> : <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Student Detail */}
          {studentLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}

          {selectedStudent && !studentLoading && (
            <>
              {/* Student Info Header */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <User className="w-7 h-7 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                        <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[selectedStudent.level] || LEVEL_COLORS.beginner}`}>
                            {LEVEL_LABELS[selectedStudent.level] || selectedStudent.level}
                          </span>
                          {selectedStudent.last_activity_date && (
                            <span className="text-xs text-muted-foreground">
                              {tr('آخر نشاط:', 'Last Activity:')} {new Date(selectedStudent.last_activity_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelectedStudent(null); setStudentLog([]); setStudentBadges([]); setStudentBreakdown([]) }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Student Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
                    <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                      <p className="text-2xl font-bold text-amber-600">{selectedStudent.total_points}</p>
                      <p className="text-xs text-muted-foreground">{tr('نقطة', 'pts')}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <p className="text-2xl font-bold text-orange-600">{selectedStudent.streak_days}</p>
                      <p className="text-xs text-muted-foreground">Streak</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <p className="text-2xl font-bold text-red-600">{selectedStudent.longest_streak}</p>
                      <p className="text-xs text-muted-foreground">{tr('أطول Streak', 'Max Streak')}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <p className="text-2xl font-bold text-green-600">{selectedStudent.total_verses_memorized}</p>
                      <p className="text-xs text-muted-foreground">{tr('آيات محفوظة', 'Verses Memorized')}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-2xl font-bold text-blue-600">{selectedStudent.total_verses_revised}</p>
                      <p className="text-xs text-muted-foreground">{tr('آيات مراجعة', 'Verses Revised')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Admin Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Edit3 className="w-5 h-5" />
                      {tr('إجراءات الأدمن', 'Admin Actions')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add/Remove Points */}
                    <form onSubmit={handleAdjust} className="space-y-3">
                      <label className="text-sm font-medium">{tr('تعديل النقاط', 'Adjust Points')}</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder={tr('النقاط (موجب أو سالب)', 'Points (positive or negative)')}
                          value={adjustPoints}
                          onChange={(e) => setAdjustPoints(e.target.value)}
                          className="flex-1"
                          required
                        />
                        <Input
                          placeholder={tr('السبب', 'Reason')}
                          value={adjustDesc}
                          onChange={(e) => setAdjustDesc(e.target.value)}
                          className="flex-1"
                        />
                        <Button type="submit" disabled={adjusting} size="sm">
                          {adjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </Button>
                      </div>
                      {adjustResult && (
                        <p className={`text-sm ${adjustResult.startsWith('Error') || adjustResult.startsWith('خطأ') ? 'text-red-600' : 'text-green-600'}`}>
                          {adjustResult}
                        </p>
                      )}
                    </form>

                    {/* Change Level */}
                    <div>
                      <label className="text-sm font-medium block mb-2">{tr('تغيير المستوى', 'Change Level')}</label>
                      <div className="flex gap-2 flex-wrap">
                        {(['beginner', 'intermediate', 'advanced', 'hafiz'] as const).map(lvl => (
                          <Button
                            key={lvl}
                            variant={selectedStudent.level === lvl ? 'default' : 'outline'}
                            size="sm"
                            disabled={actionLoading === 'set_level' || selectedStudent.level === lvl}
                            onClick={() => handleStudentAction('set_level', selectedStudent.id, { level: lvl })}
                          >
                            {LEVEL_LABELS[lvl]}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Reset Actions */}
                    <div className="flex gap-3 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                        disabled={actionLoading === 'reset_streak'}
                        onClick={() => {
                          if (confirm(tr('هل أنت متأكد من إعادة تعيين الـ Streak؟', 'Are you sure you want to reset the streak?'))) {
                            handleStudentAction('reset_streak', selectedStudent.id)
                          }
                        }}
                      >
                        {actionLoading === 'reset_streak' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          <>
                            <RefreshCw className="w-4 h-4 ml-1" />
                            {tr('إعادة تعيين Streak', 'Reset Streak')}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        disabled={actionLoading === 'reset_points'}
                        onClick={() => {
                          if (confirm(tr('هل أنت متأكد من إعادة تعيين كل النقاط والمستوى؟ هذا الإجراء لا يمكن التراجع عنه.', 'Are you sure you want to reset all points and level? This action cannot be undone.'))) {
                            handleStudentAction('reset_points', selectedStudent.id)
                          }
                        }}
                      >
                        {actionLoading === 'reset_points' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          <>
                            <Trash2 className="w-4 h-4 ml-1" />
                            {tr('إعادة تعيين كامل', 'Full Reset')}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Points Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="w-5 h-5" />
                      {tr('تفصيل النقاط', 'Points Breakdown')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {studentBreakdown.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">{tr('لا توجد بيانات', 'No data available')}</p>
                    ) : (
                      <div className="space-y-2">
                        {studentBreakdown.map(b => {
                          const totalAll = studentBreakdown.reduce((s, x) => s + x.total, 0) || 1
                          const pct = Math.round((b.total / totalAll) * 100)
                          return (
                            <div key={b.reason} className="flex items-center gap-3">
                              <span className="text-xs w-24 truncate">{REASON_LABELS[b.reason] || b.reason}</span>
                              <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 rounded-full"
                                  style={{ width: `${Math.max(pct, 3)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium w-20 text-left">
                                {b.total} ({b.count}×)
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Badges */}
              {studentBadges.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="w-5 h-5 text-purple-500" />
                      {tr('الشارات', 'Badges')} ({studentBadges.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {studentBadges.map(b => (
                        <div key={b.badge_key} className="flex items-center gap-2 p-3 rounded-lg border" style={{ backgroundColor: b.badge_color + '15', borderColor: b.badge_color + '40' }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: b.badge_color + '30' }}>
                            {b.badge_image_url ? (
                              <img src={b.badge_image_url} alt={b.badge_name} className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <span>{b.badge_icon || '🏆'}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{b.badge_name}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(b.awarded_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</p>
                          </div>
                          <span className="text-xs font-bold text-amber-600 mr-auto">+{b.points_awarded}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Points Log */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="w-5 h-5" />
                    {tr('سجل النقاط', 'Points Log')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {studentLog.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">{tr('لا توجد سجلات', 'No records found')}</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {studentLog.map(l => (
                        <div key={l.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <div>
                            <p className="text-sm font-medium">{REASON_LABELS[l.reason] || l.reason}</p>
                            {l.description && <p className="text-xs text-muted-foreground">{l.description}</p>}
                          </div>
                          <div className="text-left">
                            <span className={`font-bold text-sm ${l.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {l.points >= 0 ? '+' : ''}{l.points}
                            </span>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(l.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')} {new Date(l.created_at).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {!selectedStudent && !studentLoading && searchResults.length === 0 && (
            <Card className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-muted-foreground">{tr('ابحث عن طالب لعرض تفاصيل نقاطه وإدارتها', 'Search for a student to view and manage their points details')}</p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
