"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowRight, BookOpen, CheckCircle2, Clock, Eye, EyeOff, Loader2,
  Lock, Save, TrendingUp, Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

type Unit = {
  id: string
  position: number
  unit_type: string
  juz_number: number | null
  surah_number: number | null
  hizb_number: number | null
  page_from: number | null
  page_to: number | null
  title: string
  description: string | null
  estimated_minutes: number
}

export default function AdminMemorizationPathDetailPage() {
  const params = useParams<{ id: string }>()
  const pathId = params.id

  const [path, setPath] = useState<any>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [edit, setEdit] = useState({
    title: "",
    description: "",
    level: "beginner",
    estimated_days: "",
    require_audio: false,
    is_published: false,
  })

  async function load() {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/admin/memorization-paths/${pathId}`),
        fetch(`/api/admin/memorization-paths/${pathId}/stats`),
      ])
      const d1 = await r1.json()
      const d2 = await r2.json()
      if (r1.ok && d1.path) {
        setPath(d1.path)
        setUnits(d1.units || [])
        setEdit({
          title: d1.path.title || "",
          description: d1.path.description || "",
          level: d1.path.level || "beginner",
          estimated_days: d1.path.estimated_days?.toString() || "",
          require_audio: !!d1.path.require_audio,
          is_published: !!d1.path.is_published,
        })
      }
      if (r2.ok) setStats(d2)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (pathId) load() }, [pathId])

  async function save() {
    setSaving(true)
    try {
      await fetch(`/api/admin/memorization-paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: edit.title,
          description: edit.description || null,
          level: edit.level,
          estimated_days: edit.estimated_days ? parseInt(edit.estimated_days, 10) : null,
          require_audio: edit.require_audio,
          is_published: edit.is_published,
        }),
      })
      await load()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!path) {
    return <div className="p-6 text-center text-muted-foreground">المسار غير موجود.</div>
  }

  const overall = stats?.overall || {}
  const perUnit: any[] = stats?.per_unit || []
  const topStudents: any[] = stats?.top_students || []

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href="/admin/memorization-paths">
            <ArrowRight className="h-4 w-4 rtl:rotate-180" /> رجوع للقائمة
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-emerald-600" />
            {path.title}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">{path.total_units} وحدة</Badge>
            <Badge variant="outline">{path.unit_type}</Badge>
            {path.is_published ? (
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                <Eye className="h-3 w-3 me-1" /> منشور
              </Badge>
            ) : (
              <Badge variant="outline"><EyeOff className="h-3 w-3 me-1" /> مسودة</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" /> مشتركين
          </div>
          <div className="text-2xl font-bold mt-1">{overall.enrolled || "0"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> أتموا
          </div>
          <div className="text-2xl font-bold mt-1 text-emerald-700">{overall.completed || "0"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> نشطون
          </div>
          <div className="text-2xl font-bold mt-1">{overall.active || "0"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> متوسط التقدم
          </div>
          <div className="text-2xl font-bold mt-1">{overall.avg_progress_percent || "0"}%</div>
        </Card>
      </div>

      <Tabs defaultValue="units" className="space-y-4">
        <TabsList>
          <TabsTrigger value="units">الوحدات ({units.length})</TabsTrigger>
          <TabsTrigger value="funnel">معدلات الإكمال</TabsTrigger>
          <TabsTrigger value="students">الطلاب</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="units">
          <Card className="p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead className="hidden sm:table-cell">المدة المتوقعة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="text-center font-mono">{u.position}</TableCell>
                    <TableCell>
                      <div className="font-medium">{u.title}</div>
                      {u.description && (
                        <div className="text-xs text-muted-foreground">{u.description}</div>
                      )}
                    </TableCell>
                    <TableCell><Badge variant="outline">{u.unit_type}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {u.estimated_minutes} د
                    </TableCell>
                  </TableRow>
                ))}
                {units.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      لا توجد وحدات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="funnel">
          <Card className="p-4">
            <div className="space-y-3">
              {perUnit.map(u => {
                const started = parseInt(u.started || "0", 10)
                const completed = parseInt(u.completed || "0", 10)
                const enrolled = parseInt(overall.enrolled || "0", 10)
                const pct = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0
                return (
                  <div key={u.unit_id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm">
                        <span className="font-mono text-muted-foreground">#{u.position}</span>{" "}
                        <span className="font-medium">{u.title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-3 items-center">
                        <span>بدأ: {started}</span>
                        <span>أتم: <strong>{completed}</strong></span>
                        <span>{pct}%</span>
                      </div>
                    </div>
                    <Progress value={pct} className="h-2 mt-2" />
                  </div>
                )
              })}
              {perUnit.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  لا توجد بيانات بعد
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card className="p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد</TableHead>
                  <TableHead className="text-center">وحدات منجزة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="hidden sm:table-cell">آخر نشاط</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topStudents.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.email || "—"}</TableCell>
                    <TableCell className="text-center">
                      {s.units_completed}/{path.total_units}
                    </TableCell>
                    <TableCell>
                      {s.status === "completed" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                          أتم
                        </Badge>
                      ) : s.status === "active" ? (
                        <Badge variant="secondary">نشط</Badge>
                      ) : (
                        <Badge variant="outline">{s.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {s.last_activity_at ? new Date(s.last_activity_at).toLocaleDateString("ar-EG") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {topStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      لا يوجد طلاب مشتركين بعد
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="p-6 max-w-xl space-y-4">
            <div className="space-y-1">
              <Label>العنوان</Label>
              <Input value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>الوصف</Label>
              <Textarea
                rows={3}
                value={edit.description}
                onChange={e => setEdit({ ...edit, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>المستوى</Label>
                <Select value={edit.level} onValueChange={v => setEdit({ ...edit, level: v })}>
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
                  type="number"
                  value={edit.estimated_days}
                  onChange={e => setEdit({ ...edit, estimated_days: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="require_audio_edit" type="checkbox" className="h-4 w-4"
                checked={edit.require_audio}
                onChange={e => setEdit({ ...edit, require_audio: e.target.checked })}
              />
              <Label htmlFor="require_audio_edit" className="cursor-pointer">
                يتطلب تسجيل صوتي قبل إتمام الوحدة
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_published_edit" type="checkbox" className="h-4 w-4"
                checked={edit.is_published}
                onChange={e => setEdit({ ...edit, is_published: e.target.checked })}
              />
              <Label htmlFor="is_published_edit" className="cursor-pointer">
                منشور للطلاب
              </Label>
            </div>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ التعديلات
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
