'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Award, Plus, Trash2, Edit2, X, Loader2, Star, Users,
  Eye, Search, Save, ToggleLeft, ToggleRight, User, Gift
} from 'lucide-react'

interface BadgeDef {
  id: string
  badge_key: string
  badge_name: string
  badge_description: string | null
  badge_icon: string
  badge_image_url: string | null
  badge_color: string
  points_awarded: number
  criteria_type: string
  criteria_value: number
  is_active: boolean
  display_order: number
  category: string
  earned_count: number
}

interface RecentAward {
  badge_key: string
  badge_name: string
  awarded_at: string
  user_name: string
  email: string
}

interface Stats {
  total_definitions: number
  total_students_with_badges: number
  total_badges_awarded: number
}

const ICONS = ['🏆', '⭐', '🌟', '🎖️', '🥇', '🏅', '💎', '🎯', '🚀', '🌙', '📖', '🎤', '💯', '👑', '🔥', '⚡']

const CATEGORIES = [
  { value: 'recitation', label: 'التلاوة' },
  { value: 'memorization', label: 'الحفظ' },
  { value: 'streak', label: 'الاستمرارية' },
  { value: 'mastery', label: 'الإتقان' },
  { value: 'special', label: 'خاصة' },
  { value: 'achievement', label: 'إنجازات' },
]

const CRITERIA_TYPES = [
  { value: 'recitation_count', label: 'عدد التلاوات' },
  { value: 'recitation_total', label: 'إجمالي التلاوات' },
  { value: 'streak_days', label: 'أيام Streak' },
  { value: 'juz_memorized', label: 'حفظ جزء' },
  { value: 'tajweed_path', label: 'مسار التجويد' },
  { value: 'ramadan', label: 'أيام رمضان' },
  { value: 'quran_complete', label: 'ختم القرآن' },
  { value: 'top_student', label: 'الأعلى نقاطاً' },
  { value: 'points_threshold', label: 'حد نقاط' },
  { value: 'manual', label: 'يدوي' },
]

const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#6366F1', '#EF4444', '#14B8A6', '#EAB308']

const emptyForm = {
  badge_key: '',
  badge_name: '',
  badge_description: '',
  badge_icon: '🏆',
  badge_image_url: '',
  badge_color: '#F59E0B',
  points_awarded: 0,
  criteria_type: 'manual',
  criteria_value: 0,
  category: 'achievement',
  display_order: 0,
}

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<BadgeDef[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentAwards, setRecentAwards] = useState<RecentAward[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<BadgeDef | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Award badge to student
  const [showAwardModal, setShowAwardModal] = useState(false)
  const [awardSearch, setAwardSearch] = useState('')
  const [awardStudents, setAwardStudents] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [awardBadgeKey, setAwardBadgeKey] = useState('')
  const [awarding, setAwarding] = useState(false)
  const [awardMsg, setAwardMsg] = useState<string | null>(null)

  const fetchBadges = async () => {
    try {
      const res = await fetch('/api/admin/badges?stats=true')
      if (res.ok) {
        const data = await res.json()
        setBadges(Array.isArray(data.data) ? data.data : [])
        setStats(data.stats || null)
        setRecentAwards(data.recent_awards || [])
      }
    } catch (error) {
      console.error('Failed to fetch badges:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBadges() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (b: BadgeDef) => {
    setEditItem(b)
    setForm({
      badge_key: b.badge_key,
      badge_name: b.badge_name,
      badge_description: b.badge_description || '',
      badge_icon: b.badge_icon || '🏆',
      badge_image_url: b.badge_image_url || '',
      badge_color: b.badge_color || '#F59E0B',
      points_awarded: b.points_awarded,
      criteria_type: b.criteria_type,
      criteria_value: b.criteria_value,
      category: b.category,
      display_order: b.display_order,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.badge_name || !form.badge_key) return
    setSaving(true)
    try {
      const url = editItem ? `/api/admin/badges/${editItem.id}` : '/api/admin/badges'
      const method = editItem ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowModal(false)
        fetchBadges()
      } else {
        const data = await res.json()
        alert(data.error || 'حدث خطأ')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشارة؟')) return
    setDeletingId(id)
    try {
      await fetch(`/api/admin/badges/${id}`, { method: 'DELETE' })
      fetchBadges()
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (b: BadgeDef) => {
    await fetch(`/api/admin/badges/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !b.is_active }),
    })
    fetchBadges()
  }

  const searchStudents = async () => {
    if (!awardSearch.trim()) return
    try {
      const res = await fetch(`/api/admin/points?search=${encodeURIComponent(awardSearch)}`)
      if (res.ok) {
        const data = await res.json()
        setAwardStudents(data.students || [])
      }
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const handleAwardBadge = async (userId: string) => {
    if (!awardBadgeKey) return
    setAwarding(true)
    setAwardMsg(null)
    try {
      const res = await fetch('/api/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'award_to_student', user_id: userId, badge_key: awardBadgeKey }),
      })
      const data = await res.json()
      if (res.ok) {
        setAwardMsg(data.awarded ? 'تم منح الشارة بنجاح!' : 'الطالب حاصل على الشارة مسبقاً')
        fetchBadges()
      } else {
        setAwardMsg(`خطأ: ${data.error}`)
      }
    } catch {
      setAwardMsg('فشل الاتصال')
    } finally {
      setAwarding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-7 h-7 text-yellow-600" />
            إدارة الشارات والإنجازات
          </h1>
          <p className="text-muted-foreground mt-1">إنشاء وتعديل وتخصيص الشارات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setShowAwardModal(true); setAwardMsg(null) }}>
            <Gift className="w-4 h-4 ml-2" />
            منح شارة لطالب
          </Button>
          <Button onClick={openAdd} className="bg-yellow-600 hover:bg-yellow-700 text-white">
            <Plus className="w-4 h-4 ml-2" />
            شارة جديدة
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5 text-center">
              <Award className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-bold">{stats.total_definitions}</p>
              <p className="text-xs text-muted-foreground">شارة معرّفة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 text-center">
              <Users className="w-6 h-6 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold">{stats.total_students_with_badges}</p>
              <p className="text-xs text-muted-foreground">طالب حاصل على شارات</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 text-center">
              <Star className="w-6 h-6 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold">{stats.total_badges_awarded}</p>
              <p className="text-xs text-muted-foreground">شارة ممنوحة</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Badge Cards */}
      {badges.length === 0 ? (
        <Card className="text-center py-12">
          <Award className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium mb-4">لا توجد شارات بعد</p>
          <Button onClick={openAdd} className="bg-yellow-600 hover:bg-yellow-700 text-white">
            <Plus className="w-4 h-4 ml-2" /> أنشئ أول شارة
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {badges.map((b) => (
            <Card
              key={b.id}
              className={`relative hover:shadow-md transition-shadow ${!b.is_active ? 'opacity-50' : ''}`}
            >
              <CardContent className="pt-5 text-center">
                {/* Active toggle */}
                <button
                  className="absolute top-2 left-2"
                  onClick={() => handleToggleActive(b)}
                  title={b.is_active ? 'تعطيل' : 'تفعيل'}
                >
                  {b.is_active ? (
                    <ToggleRight className="w-5 h-5 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Badge Display */}
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl"
                  style={{ backgroundColor: b.badge_color + '25' }}
                >
                  {b.badge_image_url ? (
                    <img src={b.badge_image_url} alt={b.badge_name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span>{b.badge_icon || '🏆'}</span>
                  )}
                </div>
                <h3 className="font-bold text-sm mb-1">{b.badge_name}</h3>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{b.badge_description}</p>

                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 font-bold">
                    +{b.points_awarded} نقطة
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700">
                    {CRITERIA_TYPES.find(c => c.value === b.criteria_type)?.label || b.criteria_type}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mb-3">
                  {b.earned_count} طالب حاصل عليها
                </p>

                <div className="flex items-center justify-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    disabled={deletingId === b.id}
                    onClick={() => handleDelete(b.id)}
                  >
                    {deletingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Awards */}
      {recentAwards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="w-5 h-5 text-yellow-500" />
              آخر الشارات الممنوحة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {recentAwards.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{a.user_name}</p>
                    <p className="text-xs text-muted-foreground">{a.badge_name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.awarded_at).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Create/Edit Modal ═══ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-card rounded-2xl border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editItem ? 'تعديل الشارة' : 'شارة جديدة'}</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Badge Key (only for new) */}
              {!editItem && (
                <div>
                  <label className="text-sm font-medium block mb-1">المعرّف (badge_key)</label>
                  <Input
                    value={form.badge_key}
                    onChange={(e) => setForm(f => ({ ...f, badge_key: e.target.value.replace(/\s/g, '_').toLowerCase() }))}
                    placeholder="مثال: first_recitation"
                    required
                  />
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-sm font-medium block mb-1">اسم الشارة</label>
                <Input
                  value={form.badge_name}
                  onChange={(e) => setForm(f => ({ ...f, badge_name: e.target.value }))}
                  placeholder="مثال: أول تلاوة"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium block mb-1">الوصف</label>
                <Input
                  value={form.badge_description}
                  onChange={(e) => setForm(f => ({ ...f, badge_description: e.target.value }))}
                  placeholder="مثال: سجّل تلاوتك الأولى على المنصة"
                />
              </div>

              {/* Icon Selection */}
              <div>
                <label className="text-sm font-medium block mb-1">الأيقونة</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, badge_icon: icon }))}
                      className={`w-10 h-10 text-xl rounded-lg border-2 transition-all flex items-center justify-center ${
                        form.badge_icon === icon ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 scale-110' : 'border-border'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="text-sm font-medium block mb-1">رابط الصورة (اختياري — بديل عن الأيقونة)</label>
                <Input
                  value={form.badge_image_url}
                  onChange={(e) => setForm(f => ({ ...f, badge_image_url: e.target.value }))}
                  placeholder="https://example.com/badge.png"
                  dir="ltr"
                />
              </div>

              {/* Color */}
              <div>
                <label className="text-sm font-medium block mb-1">اللون</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, badge_color: c }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        form.badge_color === c ? 'border-black dark:border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <Input
                    type="color"
                    value={form.badge_color}
                    onChange={(e) => setForm(f => ({ ...f, badge_color: e.target.value }))}
                    className="w-8 h-8 p-0 border-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Points */}
                <div>
                  <label className="text-sm font-medium block mb-1">النقاط الممنوحة</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.points_awarded}
                    onChange={(e) => setForm(f => ({ ...f, points_awarded: Number(e.target.value) }))}
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label className="text-sm font-medium block mb-1">ترتيب العرض</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.display_order}
                    onChange={(e) => setForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium block mb-1">التصنيف</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.category}
                  onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Criteria Type */}
                <div>
                  <label className="text-sm font-medium block mb-1">نوع الشرط</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.criteria_type}
                    onChange={(e) => setForm(f => ({ ...f, criteria_type: e.target.value }))}
                  >
                    {CRITERIA_TYPES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Criteria Value */}
                <div>
                  <label className="text-sm font-medium block mb-1">قيمة الشرط</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.criteria_value}
                    onChange={(e) => setForm(f => ({ ...f, criteria_value: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">معاينة</p>
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-3xl"
                  style={{ backgroundColor: form.badge_color + '25' }}
                >
                  {form.badge_image_url ? (
                    <img src={form.badge_image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span>{form.badge_icon}</span>
                  )}
                </div>
                <p className="font-bold text-sm">{form.badge_name || '...'}</p>
                <p className="text-xs text-muted-foreground">{form.badge_description || '...'}</p>
                <span className="text-xs text-amber-600 font-bold">+{form.points_awarded} نقطة</span>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      {editItem ? 'حفظ التعديلات' : 'إنشاء الشارة'}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Award Badge to Student Modal ═══ */}
      {showAwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAwardModal(false)} />
          <div className="relative bg-card rounded-2xl border p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Gift className="w-5 h-5 text-yellow-500" />
                منح شارة لطالب
              </h2>
              <button onClick={() => setShowAwardModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select Badge */}
            <div className="mb-4">
              <label className="text-sm font-medium block mb-1">اختر الشارة</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={awardBadgeKey}
                onChange={(e) => setAwardBadgeKey(e.target.value)}
              >
                <option value="">اختر شارة...</option>
                {badges.filter(b => b.is_active).map(b => (
                  <option key={b.badge_key} value={b.badge_key}>
                    {b.badge_icon} {b.badge_name} (+{b.points_awarded})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Student */}
            <div className="mb-4">
              <label className="text-sm font-medium block mb-1">ابحث عن الطالب</label>
              <div className="flex gap-2">
                <Input
                  placeholder="اسم أو بريد إلكتروني..."
                  value={awardSearch}
                  onChange={(e) => setAwardSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchStudents()}
                />
                <Button variant="outline" onClick={searchStudents} size="sm">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Student Results */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {awardStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={awarding || !awardBadgeKey}
                    onClick={() => handleAwardBadge(s.id)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {awarding ? <Loader2 className="w-3 h-3 animate-spin" /> : 'منح'}
                  </Button>
                </div>
              ))}
            </div>

            {awardMsg && (
              <p className={`mt-3 text-sm font-medium ${awardMsg.includes('خطأ') ? 'text-red-600' : 'text-green-600'}`}>
                {awardMsg}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
