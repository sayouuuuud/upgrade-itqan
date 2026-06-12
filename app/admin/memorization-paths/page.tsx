"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BookOpen, Plus, Loader2, Users, CheckCircle2, Eye, EyeOff, Trash2,
  ArrowRight, ChevronRight, Settings, BarChart, Sparkles, AlertCircle, FileText, Route
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton"

type Path = {
  id: string
  title: string
  description: string | null
  unit_type: string
  range_from: number | null
  range_to: number | null
  direction: "asc" | "desc"
  level: string
  total_units: number
  estimated_days: number | null
  require_audio: boolean
  is_published: boolean
  is_active: boolean
  created_by_name?: string
  created_at: string
  stats?: { enrolled: string; active: string; completed: string; avg_progress: string }
}

const TYPE_LABELS: Record<string, string> = {
  juz: "بالأجزاء",
  surah: "بالسور",
  hizb: "بالأحزاب",
  page: "بالصفحات",
  custom: "مخصص",
}

const RANGE_MAX: Record<string, number> = { juz: 30, surah: 114, hizb: 60, page: 604 }

export default function AdminMemorizationPathsPage() {
  const [paths, setPaths] = useState<Path[]>([])
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [migrationMissing, setMigrationMissing] = useState(false)

  const [form, setForm] = useState({
    title: "",
    description: "",
    unit_type: "surah",
    range_from: "1",
    range_to: "114",
    direction: "desc" as "asc" | "desc",
    level: "beginner",
    require_audio: false,
    estimated_days: "",
    is_published: false,
  })

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/memorization-paths?include_stats=1")
      const data = await res.json()
      if (data.notice === "migration_not_applied") {
        setMigrationMissing(true)
      }
      setPaths(data.paths || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function submit() {
    if (!form.title.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/admin/memorization-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          unit_type: form.unit_type,
          range_from: form.unit_type === "custom" ? null : parseInt(form.range_from, 10) || 1,
          range_to:   form.unit_type === "custom" ? null : parseInt(form.range_to, 10) || RANGE_MAX[form.unit_type] || 1,
          direction: form.direction,
          level: form.level,
          require_audio: form.require_audio,
          estimated_days: form.estimated_days ? parseInt(form.estimated_days, 10) : null,
          is_published: form.is_published,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "فشل الإنشاء")
        return
      }
      setOpenCreate(false)
      setForm({ ...form, title: "", description: "" })
      await load()
    } finally {
      setCreating(false)
    }
  }

  async function togglePublish(p: Path) {
    await fetch(`/api/admin/memorization-paths/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !p.is_published }),
    })
    await load()
  }

  async function remove(p: Path) {
    if (!confirm(`حذف المسار "${p.title}" نهائياً؟`)) return
    await fetch(`/api/admin/memorization-paths/${p.id}`, { method: "DELETE" })
    await load()
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-[#0B3D2E] to-emerald-950 p-8 sm:p-10 shadow-xl">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-emerald-100 text-sm font-medium mb-4 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>إدارة المحتوى التعليمي</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">مسارات الحفظ</h1>
            <p className="text-emerald-100/80 max-w-xl text-lg leading-relaxed">
              خطط حفظ منظمة ومدروسة — يفتح الطالب وحدة تلو الأخرى ليتقدم بخطى ثابتة نحو الختمة الكاملة.
            </p>
          </div>
          <Button 
            onClick={() => setOpenCreate(true)} 
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 gap-2 w-full sm:w-auto group"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
            إنشاء مسار جديد
          </Button>
        </div>
      </div>

      {migrationMissing && (
        <Card className="p-5 bg-amber-500/10 border-amber-500/20 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 text-amber-700 dark:text-amber-500">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              <strong>تنبيه:</strong> الميجريشن لم يتم تنفيذه بعد. يرجى تشغيل
              <code className="bg-amber-500/20 px-2 py-0.5 mx-2 rounded font-mono text-xs text-amber-800 dark:text-amber-400">
                psql "$DATABASE_URL" -f scripts/022-memorization-paths.sql
              </code>
            </p>
          </div>
        </Card>
      )}

      {loading ? (
        <PageLoadingSkeleton />
      ) : paths.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-card/50 border border-dashed border-border rounded-3xl shadow-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-100/50 dark:bg-emerald-900/20 flex items-center justify-center mb-6 shadow-inner">
            <Route className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">لا توجد مسارات حفظ</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-8">
            لم تقم بإنشاء أي مسارات حفظ بعد. ابدأ بإنشاء المسار الأول لتمكين الطلاب من البدء في الحفظ المنهجي.
          </p>
          <Button 
            onClick={() => setOpenCreate(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md gap-2"
          >
            <Plus className="h-4 w-4" />
            إنشاء مسار جديد
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paths.map(p => (
            <Card key={p.id} className="group overflow-hidden rounded-3xl border-border/50 bg-card hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all duration-300">
              {/* Card Header & Badges */}
              <div className="p-6 pb-4">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 rounded-lg px-2.5 py-0.5 text-xs font-semibold">
                      {TYPE_LABELS[p.unit_type] || p.unit_type}
                    </Badge>
                    {p.is_published ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50/50 rounded-lg px-2.5 py-0.5 gap-1">
                        <Eye className="h-3 w-3" /> <span className="text-xs">منشور</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-50/50 rounded-lg px-2.5 py-0.5 gap-1">
                        <EyeOff className="h-3 w-3" /> <span className="text-xs">مسودة</span>
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary" className="rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 text-xs whitespace-nowrap">
                    {p.total_units} وحدة
                  </Badge>
                </div>

                <Link
                  href={`/admin/memorization-paths/${p.id}`}
                  className="block group-hover:text-emerald-600 transition-colors"
                >
                  <h3 className="text-xl font-bold text-foreground line-clamp-2 leading-tight mb-2">
                    {p.title}
                  </h3>
                </Link>
                
                {p.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                )}
              </div>

              {/* Stats Section */}
              <div className="px-6 py-4 bg-muted/30 border-t border-b border-border/50">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center mb-1">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-lg font-bold text-foreground">{p.stats?.enrolled || "0"}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">مشترك</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center mb-1">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-lg font-bold text-foreground">{p.stats?.completed || "0"}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">أتموا</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center mb-1">
                      <BarChart className="h-4 w-4" />
                    </div>
                    <span className="text-lg font-bold text-foreground">{p.stats?.avg_progress || "0"}%</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">متوسط</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 flex gap-2 bg-card">
                <Button
                  asChild variant="ghost" className="flex-1 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-slate-800/50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <Link href={`/admin/memorization-paths/${p.id}`}>
                    <Settings className="h-4 w-4 me-2" /> إدارة المسار
                  </Link>
                </Button>
                <Button
                  variant="outline" size="icon" className="rounded-xl shrink-0"
                  onClick={() => togglePublish(p)}
                  title={p.is_published ? "إخفاء" : "نشر"}
                >
                  {p.is_published ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-emerald-600" />}
                </Button>
                <Button 
                  variant="outline" size="icon" 
                  className="rounded-xl shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100" 
                  onClick={() => remove(p)}
                  title="حذف المسار"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-0 shadow-2xl rounded-3xl">
          <div className="bg-emerald-900 px-6 py-6 border-b border-emerald-800">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-emerald-400" />
                إنشاء مسار حفظ جديد
              </DialogTitle>
              <DialogDescription className="text-emerald-200/80 text-base mt-2">
                اختر نوع التقسيم والمدى — سيقوم النظام بتوليد الوحدات تلقائياً وترتيبها.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">عنوان المسار <span className="text-red-500">*</span></Label>
                <Input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: مسار الحفظ السريع لجزء عم"
                  className="h-12 rounded-xl border-slate-200 focus-visible:ring-emerald-500 bg-slate-50 dark:bg-slate-900/50"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">الوصف (اختياري)</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="اكتب نبذة مختصرة عن هذا المسار تظهر للطلاب..."
                  className="rounded-xl border-slate-200 focus-visible:ring-emerald-500 bg-slate-50 dark:bg-slate-900/50 resize-none"
                />
              </div>

              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" /> نوع التقسيم
                </Label>
                <Select
                  value={form.unit_type}
                  onValueChange={v => {
                    const max = RANGE_MAX[v] || 1
                    setForm({ ...form, unit_type: v, range_from: "1", range_to: String(max) })
                  }}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="surah">حسب السور (مثال: سورة البقرة)</SelectItem>
                    <SelectItem value="juz">حسب الأجزاء (مثال: الجزء الأول)</SelectItem>
                    <SelectItem value="hizb">حسب الأحزاب</SelectItem>
                    <SelectItem value="page">حسب الصفحات</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Route className="w-4 h-4 text-emerald-600" /> الترتيب
                </Label>
                <Select
                  value={form.direction}
                  onValueChange={v => setForm({ ...form, direction: v as any })}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">من الأول للآخر (الفاتحة ← الناس)</SelectItem>
                    <SelectItem value="asc">من الآخر للأول (الناس ← الفاتحة)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">من رقم</Label>
                <Input
                  type="number" min="1" max={RANGE_MAX[form.unit_type] || 1}
                  value={form.range_from}
                  onChange={e => setForm({ ...form, range_from: e.target.value })}
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">إلى رقم</Label>
                <Input
                  type="number" min="1" max={RANGE_MAX[form.unit_type] || 1}
                  value={form.range_to}
                  onChange={e => setForm({ ...form, range_to: e.target.value })}
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">المستوى</Label>
                <Select
                  value={form.level}
                  onValueChange={v => setForm({ ...form, level: v })}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">مبتدئ</SelectItem>
                    <SelectItem value="intermediate">متوسط</SelectItem>
                    <SelectItem value="advanced">متقدم</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">المدة المتوقعة (أيام)</Label>
                <Input
                  type="number" min="1"
                  value={form.estimated_days}
                  onChange={e => setForm({ ...form, estimated_days: e.target.value })}
                  placeholder="اختياري"
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50"
                />
              </div>

              <div className="md:col-span-2 space-y-3 mt-2 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input
                      id="require_audio" type="checkbox"
                      className="peer w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      checked={form.require_audio}
                      onChange={e => setForm({ ...form, require_audio: e.target.checked })}
                    />
                  </div>
                  <Label htmlFor="require_audio" className="cursor-pointer text-sm font-medium text-emerald-900 dark:text-emerald-100 select-none">
                    يتطلب تسجيل صوتي للتسميع قبل إتمام كل وحدة
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input
                      id="is_published" type="checkbox"
                      className="peer w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      checked={form.is_published}
                      onChange={e => setForm({ ...form, is_published: e.target.checked })}
                    />
                  </div>
                  <Label htmlFor="is_published" className="cursor-pointer text-sm font-medium text-emerald-900 dark:text-emerald-100 select-none">
                    نشر المسار وإتاحته للطلاب فور إنشائه
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-t border-border flex justify-end gap-3 rounded-b-3xl">
            <Button variant="outline" onClick={() => setOpenCreate(false)} className="rounded-xl h-11 px-6">إلغاء</Button>
            <Button 
              onClick={submit} 
              disabled={creating || !form.title.trim()} 
              className="gap-2 rounded-xl h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            >
              {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              {creating ? "جاري الإنشاء..." : "إنشاء المسار"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
