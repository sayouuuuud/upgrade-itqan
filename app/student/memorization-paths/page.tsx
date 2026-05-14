"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BookOpen, ChevronRight, CheckCircle2, Loader2, Lock, Pause, Play,
  Search,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type Path = {
  id: string
  title: string
  description: string | null
  unit_type: string
  total_units: number
  level: string
  estimated_days: number | null
  enrollment?: {
    id: string
    status: string
    units_completed: number
    last_activity_at: string | null
    completed_at: string | null
  } | null
}

const TYPE_LABELS: Record<string, string> = {
  juz: "بالأجزاء", surah: "بالسور", hizb: "بالأحزاب", page: "بالصفحات", custom: "مخصص",
}
const LEVEL_LABELS: Record<string, string> = {
  beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم",
}

export default function StudentMemorizationPathsPage() {
  const [paths, setPaths] = useState<Path[]>([])
  const [enrolled, setEnrolled] = useState<Path[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [migrationMissing, setMigrationMissing] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/student/memorization-paths?scope=all"),
        fetch("/api/student/memorization-paths?scope=enrolled"),
      ])
      const d1 = await r1.json()
      const d2 = await r2.json()
      if (d1.notice === "migration_not_applied" || d2.notice === "migration_not_applied") {
        setMigrationMissing(true)
      }
      setPaths(d1.paths || [])
      setEnrolled(d2.paths || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const filteredAll = paths.filter(p =>
    !search.trim() ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-emerald-600" />
          مسارات الحفظ
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          خطط حفظ منظمة من جزء عم للختمة الكاملة — اختر مساراً وابدأ، وستفتح الوحدة التالية بعد إتمام الحالية.
        </p>
      </div>

      {migrationMissing && (
        <Card className="p-4 bg-amber-50 border-amber-200 text-sm text-amber-900">
          النظام جاهز لكن قاعدة البيانات تحتاج تشغيل ميجريشن أولاً —
          راسل الإدارة لو ظهرت لك هذه الرسالة.
        </Card>
      )}

      <Tabs defaultValue="enrolled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="enrolled">مساراتي ({enrolled.length})</TabsTrigger>
          <TabsTrigger value="browse">تصفح المسارات ({paths.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled">
          {loading ? (
            <Loading />
          ) : enrolled.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              لم تشترك في أي مسار بعد — اضغط "تصفح المسارات" لاختيار مسار.
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolled.map(p => <EnrolledCard key={p.id} path={p} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="browse" className="space-y-3">
          <div className="relative max-w-md">
            <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن مسار..."
              className="pe-9"
            />
          </div>

          {loading ? (
            <Loading />
          ) : filteredAll.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              لا توجد مسارات منشورة حالياً.
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAll.map(p => <BrowseCard key={p.id} path={p} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function EnrolledCard({ path }: { path: Path }) {
  const e = path.enrollment
  const completed = e?.units_completed || 0
  const total = path.total_units || 1
  const pct = Math.round((completed / total) * 100)
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link
            href={`/student/memorization-paths/${path.id}`}
            className="font-semibold text-lg hover:text-emerald-700 line-clamp-2"
          >
            {path.title}
          </Link>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="outline">{TYPE_LABELS[path.unit_type] || path.unit_type}</Badge>
            <Badge variant="secondary">{LEVEL_LABELS[path.level] || path.level}</Badge>
            {e?.status === "completed" && (
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                <CheckCircle2 className="h-3 w-3 me-1" /> مكتمل
              </Badge>
            )}
            {e?.status === "paused" && (
              <Badge variant="outline">
                <Pause className="h-3 w-3 me-1" /> متوقف
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">التقدم</span>
          <span className="font-semibold">{completed}/{total} ({pct}%)</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      <Button asChild className="w-full mt-4 gap-2" variant={pct === 100 ? "outline" : "default"}>
        <Link href={`/student/memorization-paths/${path.id}`}>
          {pct === 100 ? "مراجعة المسار" : pct > 0 ? "متابعة الحفظ" : "بدء الحفظ"}
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </Button>
    </Card>
  )
}

function BrowseCard({ path }: { path: Path }) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow flex flex-col">
      <Link
        href={`/student/memorization-paths/${path.id}`}
        className="font-semibold text-lg hover:text-emerald-700 line-clamp-2"
      >
        {path.title}
      </Link>

      <div className="flex flex-wrap gap-1 mt-2">
        <Badge variant="outline">{TYPE_LABELS[path.unit_type] || path.unit_type}</Badge>
        <Badge variant="secondary">{path.total_units} وحدة</Badge>
        <Badge variant="outline">{LEVEL_LABELS[path.level] || path.level}</Badge>
      </div>

      {path.description && (
        <p className="text-sm text-muted-foreground mt-3 line-clamp-3 flex-1">{path.description}</p>
      )}

      {path.estimated_days && (
        <p className="text-xs text-muted-foreground mt-2">
          المدة المتوقعة: {path.estimated_days} يوماً
        </p>
      )}

      <Button asChild className="w-full mt-4 gap-2">
        <Link href={`/student/memorization-paths/${path.id}`}>
          {path.enrollment ? "متابعة المسار" : "ابدأ المسار"}
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </Button>
    </Card>
  )
}
