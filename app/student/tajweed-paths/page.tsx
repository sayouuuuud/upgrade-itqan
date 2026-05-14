"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  GraduationCap, ChevronRight, CheckCircle2, Loader2, Pause, Search,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"

type Subject = "tajweed" | "fiqh" | "aqeedah" | "seerah" | "tafsir"
const SUBJECTS: Subject[] = ["tajweed"] // Maqra'ah student: tajweed only

type Path = {
  id: string
  title: string
  description: string | null
  level: string
  subject: Subject
  total_stages: number
  estimated_days: number | null
  enrollment_id?: string | null
  enrollment_status?: string | null
  stages_completed?: number | null
  completed_at?: string | null
}

export default function StudentTajweedPathsPage() {
  const { t } = useI18n()
  const tp = (t as any).tajweedPaths

  const [paths, setPaths] = useState<Path[]>([])
  const [enrolled, setEnrolled] = useState<Path[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [browseSubject, setBrowseSubject] = useState<"all" | Subject>("all")
  const [migrationMissing, setMigrationMissing] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/student/tajweed-paths?scope=all&subject_scope=tajweed"),
        fetch("/api/student/tajweed-paths?scope=enrolled&subject_scope=tajweed"),
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

  const filteredAll = paths.filter(p => {
    const matchesSearch =
      !search.trim() ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase())
    const matchesSubject = browseSubject === "all" || p.subject === browseSubject
    return matchesSearch && matchesSubject
  })

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-emerald-600" /> {tp.tajweedTitle}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tp.studentSubtitleTajweed}
        </p>
      </div>

      {migrationMissing && (
        <Card className="p-4 bg-amber-50 border-amber-200 text-sm text-amber-900">
          {tp.migrationMissingStudent}
        </Card>
      )}

      <Tabs defaultValue="enrolled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="enrolled">{tp.tabs.myPaths} ({enrolled.length})</TabsTrigger>
          <TabsTrigger value="browse">{tp.tabs.browse} ({paths.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled">
          {loading ? (
            <Loading />
          ) : enrolled.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              {tp.emptyEnrolled}
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolled.map(p => <EnrolledCard key={p.id} path={p} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="browse" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative max-w-md flex-1 min-w-[220px]">
              <Search className="h-4 w-4 absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tp.searchPlaceholder}
                className="pe-9"
              />
            </div>
          </div>



          {loading ? (
            <Loading />
          ) : filteredAll.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              {tp.emptyPublished}
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
  const { t } = useI18n()
  const tp = (t as any).tajweedPaths
  const completed = path.stages_completed || 0
  const total = path.total_stages || 1
  const pct = Math.round((completed / total) * 100)
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <Link
        href={`/student/tajweed-paths/${path.id}`}
        className="font-semibold text-lg hover:text-emerald-700 line-clamp-2"
      >
        {path.title}
      </Link>
      <div className="flex flex-wrap gap-1 mt-2">
        <Badge variant="outline">{tp.levels[path.level] || path.level}</Badge>
        <Badge variant="secondary">{path.total_stages} {tp.metadata.stagesUnit}</Badge>
        {path.enrollment_status === "completed" && (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            <CheckCircle2 className="h-3 w-3 me-1" /> {tp.statuses.completed}
          </Badge>
        )}
        {path.enrollment_status === "paused" && (
          <Badge variant="outline"><Pause className="h-3 w-3 me-1" /> {tp.statuses.paused}</Badge>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{tp.metadata.progress}</span>
          <span className="font-semibold">{completed}/{total} ({pct}%)</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      <Button asChild className="w-full mt-4 gap-2" variant={pct === 100 ? "outline" : "default"}>
        <Link href={`/student/tajweed-paths/${path.id}`}>
          {pct === 100
            ? tp.actions.review
            : pct > 0
              ? tp.actions.continueLearning
              : tp.actions.start}
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </Button>
    </Card>
  )
}

function BrowseCard({ path }: { path: Path }) {
  const { t } = useI18n()
  const tp = (t as any).tajweedPaths
  return (
    <Card className="p-4 hover:shadow-md transition-shadow flex flex-col">
      <Link
        href={`/student/tajweed-paths/${path.id}`}
        className="font-semibold text-lg hover:text-emerald-700 line-clamp-2"
      >
        {path.title}
      </Link>
      <div className="flex flex-wrap gap-1 mt-2">
        <Badge variant="outline">{tp.levels[path.level] || path.level}</Badge>
        <Badge variant="secondary">{path.total_stages} {tp.metadata.stagesUnit}</Badge>
      </div>
      {path.description && (
        <p className="text-sm text-muted-foreground mt-3 line-clamp-3 flex-1">{path.description}</p>
      )}
      {path.estimated_days && (
        <p className="text-xs text-muted-foreground mt-2">
          {tp.metadata.estimatedDaysLabel}: {path.estimated_days} {tp.metadata.daysSuffix}
        </p>
      )}
      <Button asChild className="w-full mt-4 gap-2">
        <Link href={`/student/tajweed-paths/${path.id}`}>
          {path.enrollment_id ? tp.actions.continueLearning : tp.actions.start}
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </Button>
    </Card>
  )
}
