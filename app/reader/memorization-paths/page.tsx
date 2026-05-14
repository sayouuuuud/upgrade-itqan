"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BookOpen, Plus, Loader2, Users, CheckCircle2, Eye, EyeOff, Trash2,
  ChevronRight,
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
  juz: "بالأجزاء", surah: "بالسور", hizb: "بالأحزاب", page: "بالصفحات", custom: "مخصص",
}
const RANGE_MAX: Record<string, number> = { juz: 30, surah: 114, hizb: 60, page: 604 }

export default function ReaderMemorizationPathsPage() {
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
      const res = await fetch("/api/reader/memorization-paths?include_stats=1")
      const data = await res.json()
      if (data.notice === "migration_not_applied") setMigrationMissing(true)
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
      const res = await fetch("/api/reader/memorization-paths", {
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
    await fetch(`/api/reader/memorization-paths/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !p.is_published }),
    })
    await load()
  }

  async function remove(p: Path) {
    if (!confirm(`حذف المسار "${p.title}" نهائياً؟`)) return
    await fetch(`/api/reader/memorization-paths/${p.id}`, { method: "DELETE" })
    await load()
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-emerald-600" />
            مسارات الحفظ
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            خطط حفظ تنشئها لطلابك — جزء/سورة/حزب/صفحات بترتيب متتابع، الوحدة التالية تنفتح بعد إتمام السابقة.
          </p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إنشاء مسار جديد
        </Button>
      </div>

      {migrationMissing && (
        <Card className="p-4 bg-amber-50 border-amber-200 text-sm text-amber-900">
          <strong>الميجريشن لسه ما اتشغّلش.</strong> راسل الإدارة لتشغيل
          <code className="bg-amber-100 px-2 py-0.5 mx-1 rounded">scripts/022-memorization-paths.sql</code>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : paths.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          لم تنشئ أي مسار بعد — اضغط "إنشاء مسار جديد" لتبدأ.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paths.map(p => (
            <Card key={p.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/reader/memorization-paths/${p.id}`}
                    className="font-semibold text-lg hover:text-emerald-700 line-clamp-2"
                  >
                    {p.title}
                  </Link>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="outline">{TYPE_LABELS[p.unit_type] || p.unit_type}</Badge>
                    <Badge variant="secondary">{p.total_units} وحدة</Badge>
                    {p.is_published ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        <Eye className="h-3 w-3 me-1" /> منشور
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <EyeOff className="h-3 w-3 me-1" /> مسودة
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {p.description && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{p.description}</p>
              )}

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="border rounded-lg p-2">
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" /> مشترك
                  </div>
                  <div className="text-lg font-semibold">{p.stats?.enrolled || "0"}</div>
                </div>
                <div className="border rounded-lg p-2">
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> أتموا
                  </div>
                  <div className="text-lg font-semibold">{p.stats?.completed || "0"}</div>
                </div>
                <div className="border rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">متوسط %</div>
                  <div className="text-lg font-semibold">{p.stats?.avg_progress || "0"}%</div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/reader/memorization-paths/${p.id}`}>
                    إدارة <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                  </Link>
                </Button>
                <Button
                  variant={p.is_published ? "secondary" : "default"} size="sm"
                  onClick={() => togglePublish(p)}
                >
                  {p.is_published ? "إخفاء" : "نشر"}
                </Button>
                <Button variant="destructive" size="icon" onClick={() => remove(p)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إنشاء مسار حفظ جديد</DialogTitle>
            <DialogDescription>
              اختر نوع التقسيم (جزء/سورة/حزب/صفحة) والمدى — يولّد النظام الوحدات تلقائياً.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2 space-y-1">
              <Label>عنوان المسار</Label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="مثلاً: حفظ جزء عم"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <Label>الوصف (اختياري)</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="نبذة قصيرة عن المسار"
              />
            </div>

            <div className="space-y-1">
              <Label>نوع التقسيم</Label>
              <Select
                value={form.unit_type}
                onValueChange={v => {
                  const max = RANGE_MAX[v] || 1
                  setForm({ ...form, unit_type: v, range_from: "1", range_to: String(max) })
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="surah">حسب السور</SelectItem>
                  <SelectItem value="juz">حسب الأجزاء</SelectItem>
                  <SelectItem value="hizb">حسب الأحزاب</SelectItem>
                  <SelectItem value="page">حسب الصفحات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>الترتيب</Label>
              <Select
                value={form.direction}
                onValueChange={v => setForm({ ...form, direction: v as any })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">من الأول للآخر (الفاتحة → الناس)</SelectItem>
                  <SelectItem value="asc">من الآخر للأول (جزء عم → الفاتحة)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>من رقم</Label>
              <Input
                type="number" min="1" max={RANGE_MAX[form.unit_type] || 1}
                value={form.range_from}
                onChange={e => setForm({ ...form, range_from: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>إلى رقم</Label>
              <Input
                type="number" min="1" max={RANGE_MAX[form.unit_type] || 1}
                value={form.range_to}
                onChange={e => setForm({ ...form, range_to: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>المستوى</Label>
              <Select
                value={form.level}
                onValueChange={v => setForm({ ...form, level: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">مبتدئ</SelectItem>
                  <SelectItem value="intermediate">متوسط</SelectItem>
                  <SelectItem value="advanced">متقدم</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>المدة المتوقعة (أيام)</Label>
              <Input
                type="number" min="1"
                value={form.estimated_days}
                onChange={e => setForm({ ...form, estimated_days: e.target.value })}
                placeholder="اختياري"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input
                id="r_require_audio" type="checkbox" className="h-4 w-4"
                checked={form.require_audio}
                onChange={e => setForm({ ...form, require_audio: e.target.checked })}
              />
              <Label htmlFor="r_require_audio" className="cursor-pointer">
                يتطلب تسجيل صوتي قبل إتمام كل وحدة
              </Label>
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input
                id="r_is_published" type="checkbox" className="h-4 w-4"
                checked={form.is_published}
                onChange={e => setForm({ ...form, is_published: e.target.checked })}
              />
              <Label htmlFor="r_is_published" className="cursor-pointer">
                نشر المسار للطلاب فوراً
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenCreate(false)}>إلغاء</Button>
            <Button onClick={submit} disabled={creating || !form.title.trim()} className="gap-2">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              إنشاء المسار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
