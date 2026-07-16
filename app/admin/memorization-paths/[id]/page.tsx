"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowRight, BookOpen, CheckCircle2, Clock, Eye, EyeOff, Loader2,
  Lock, Save, TrendingUp, Users, ChevronRight, Activity, CalendarDays,
  ListTodo, Medal, Settings, UserCheck, ShieldAlert
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
import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton"
import { useI18n } from "@/lib/i18n/context"

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
  const { t } = useI18n()
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
    return <PageLoadingSkeleton />
  }
  if (!path) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{t.admin.memPathNotFound}</h3>
        <p className="text-muted-foreground text-center">{t.admin.memPathNotFoundDesc}</p>
        <Button asChild className="mt-6">
          <Link href="/admin/memorization-paths">{t.admin.memPathBack}</Link>
        </Button>
      </div>
    )
  }

  const overall = stats?.overall || {}
  const perUnit: any[] = stats?.per_unit || []
  const topStudents: any[] = stats?.top_students || []

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Premium Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-[#0B3D2E] to-emerald-950 p-8 sm:p-10 shadow-xl">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-24 -end-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -start-24 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <Link 
            href="/admin/memorization-paths" 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-emerald-100 text-sm font-medium mb-6 backdrop-blur-md transition-colors"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" /> {t.admin.memPathBackLink}
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-emerald-400" />
                {path.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-500/30 px-3 py-1 text-sm rounded-xl">
                  {path.unit_type === 'juz' ? t.admin.memPathByParts : path.unit_type === 'surah' ? t.admin.memPathBySurahs : path.unit_type}
                </Badge>
                <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 text-sm rounded-xl backdrop-blur-md">
                  {path.total_units} {t.admin.memPathUnits}
                </Badge>
                {path.is_published ? (
                  <Badge className="bg-emerald-500 text-white border-0 px-3 py-1 text-sm rounded-xl shadow-lg shadow-emerald-500/20 gap-1.5">
                    <Eye className="h-4 w-4" /> {t.admin.memPathPublished}
                  </Badge>
                ) : (
                  <Badge className="bg-slate-800 text-slate-300 border-slate-700 px-3 py-1 text-sm rounded-xl gap-1.5">
                    <EyeOff className="h-4 w-4" /> {t.admin.memPathDraft}
                  </Badge>
                )}
              </div>
            </div>
            
            {path.description && (
              <div className="md:max-w-md bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <p className="text-emerald-100/90 text-sm leading-relaxed">
                  {path.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-6 rounded-3xl border-border/50 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{t.admin.memPathEnrolled}</p>
              <h4 className="text-2xl font-bold text-foreground">{overall.enrolled || "0"}</h4>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 rounded-3xl border-border/50 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Medal className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{t.admin.memPathCompleted}</p>
              <h4 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{overall.completed || "0"}</h4>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 rounded-3xl border-border/50 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{t.admin.memPathActiveStudents}</p>
              <h4 className="text-2xl font-bold text-foreground">{overall.active || "0"}</h4>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 rounded-3xl border-border/50 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{t.admin.memPathAvgProgress}</p>
              <h4 className="text-2xl font-bold text-foreground">{overall.avg_progress_percent || "0"}%</h4>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="units" className="space-y-6">
        <div className="bg-card border border-border/50 rounded-2xl p-1.5 shadow-sm overflow-x-auto">
          <TabsList className="w-full flex justify-start sm:justify-center bg-transparent gap-2 h-auto">
            <TabsTrigger value="units" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-medium">
              <ListTodo className="w-4 h-4 me-2" /> {t.admin.memPathUnitsTab} ({units.length})
            </TabsTrigger>
            <TabsTrigger value="funnel" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-medium">
              <TrendingUp className="w-4 h-4 me-2" /> {t.admin.memPathFunnelTab}
            </TabsTrigger>
            <TabsTrigger value="students" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-medium">
              <Users className="w-4 h-4 me-2" /> {t.admin.memPathStudentsTab}
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-medium">
              <Settings className="w-4 h-4 me-2" /> {t.admin.memPathSettingsTab}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="units" className="mt-0">
          <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16 text-center font-bold">{t.admin.memPathSeqCol}</TableHead>
                  <TableHead className="font-bold text-right">{t.admin.memPathUnitTitleCol}</TableHead>
                  <TableHead className="font-bold text-right">{t.admin.memPathTypeCol}</TableHead>
                  <TableHead className="hidden sm:table-cell font-bold text-right">{t.admin.memPathDurationCol}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((u, index) => (
                  <TableRow key={u.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm">
                        {u.position}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-foreground group-hover:text-emerald-600 transition-colors">{u.title}</div>
                      {u.description && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{u.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900/50">
                        {u.unit_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm font-medium text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {u.estimated_minutes} {t.admin.memPathMinutes}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {units.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      {t.admin.memPathNoUnits}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="mt-0">
          <Card className="p-6 rounded-3xl border-border/50 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" /> {t.admin.memPathFunnelTitle}
            </h3>
            <div className="space-y-4">
              {perUnit.map(u => {
                const started = parseInt(u.started || "0", 10)
                const completed = parseInt(u.completed || "0", 10)
                const enrolled = parseInt(overall.enrolled || "0", 10)
                const pct = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0
                return (
                  <div key={u.unit_id} className="relative overflow-hidden border border-border/50 rounded-2xl p-4 bg-card hover:border-emerald-200 transition-colors">
                    {/* Background Progress Bar */}
                    <div 
                      className="absolute inset-0 bg-emerald-50 dark:bg-emerald-900/10 transition-all duration-1000 ease-out" 
                      style={{ width: `${pct}%`, opacity: 0.5 }}
                    />
                    
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-sm font-bold text-sm text-slate-500">
                          {u.position}
                        </span>
                        <span className="font-bold text-foreground">{u.title}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Users className="w-4 h-4" /> 
                          <span>{t.admin.memPathStarted}: <strong>{started}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" /> 
                          <span>{t.admin.memPathFinished}: <strong>{completed}</strong></span>
                        </div>
                        <div className="px-3 py-1 bg-white dark:bg-slate-800 shadow-sm rounded-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {pct}%
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {perUnit.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border">
                  <TrendingUp className="w-10 h-10 text-slate-300 mb-3" />
                  <p>{t.admin.memPathNoStats}</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-0">
          <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-right">{t.admin.memPathStudentCol}</TableHead>
                  <TableHead className="text-center font-bold">{t.admin.memPathProgressCol}</TableHead>
                  <TableHead className="font-bold text-right">{t.admin.memPathStatusCol}</TableHead>
                  <TableHead className="hidden sm:table-cell font-bold text-right">{t.admin.memPathLastActivityCol}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topStudents.map(s => (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-bold text-foreground">{s.name || "—"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.email || "—"}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium text-sm">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{s.units_completed}</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500">{path.total_units}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.status === "completed" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                          {t.admin.memPathStatusCompleted}
                        </Badge>
                      ) : s.status === "active" ? (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                          {t.admin.memPathStatusActive}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                          {s.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                      {s.last_activity_at ? (
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4 text-slate-400" />
                          {new Date(s.last_activity_at).toLocaleDateString("ar-EG")}
                        </div>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {topStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      {t.admin.memPathNoStudents}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <Card className="p-6 sm:p-8 rounded-3xl border-border/50 shadow-sm max-w-2xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" /> {t.admin.memPathSettingsTitle}
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t.admin.memPathTitleLabel}</Label>
                <Input 
                  value={edit.title} 
                  onChange={e => setEdit({ ...edit, title: e.target.value })} 
                  className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t.admin.memPathDescLabel}</Label>
                <Textarea
                  rows={4}
                  value={edit.description}
                  onChange={e => setEdit({ ...edit, description: e.target.value })}
                  className="rounded-xl bg-slate-50 dark:bg-slate-900/50 resize-none"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t.admin.memPathLevelLabel}</Label>
                  <Select value={edit.level} onValueChange={v => setEdit({ ...edit, level: v })}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">{t.admin.memPathLevelBeginner}</SelectItem>
                      <SelectItem value="intermediate">{t.admin.memPathLevelIntermediate}</SelectItem>
                      <SelectItem value="advanced">{t.admin.memPathLevelAdvanced}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t.admin.memPathDaysLabel}</Label>
                  <Input
                    type="number"
                    value={edit.estimated_days}
                    onChange={e => setEdit({ ...edit, estimated_days: e.target.value })}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50"
                    placeholder={t.admin.memPathDaysPlaceholder}
                  />
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 space-y-4 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input
                      id="require_audio_edit" type="checkbox" 
                      className="peer w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      checked={edit.require_audio}
                      onChange={e => setEdit({ ...edit, require_audio: e.target.checked })}
                    />
                  </div>
                  <Label htmlFor="require_audio_edit" className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    {t.admin.memPathRequireAudio}
                  </Label>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input
                      id="is_published_edit" type="checkbox" 
                      className="peer w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      checked={edit.is_published}
                      onChange={e => setEdit({ ...edit, is_published: e.target.checked })}
                    />
                  </div>
                  <Label htmlFor="is_published_edit" className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    {t.admin.memPathIsPublished}
                  </Label>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button 
                  onClick={save} 
                  disabled={saving || !edit.title.trim()} 
                  className="gap-2 rounded-xl h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-base"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  {saving ? t.admin.memPathSaving : t.admin.memPathSaveBtn}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
