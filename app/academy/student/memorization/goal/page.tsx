"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Target, BookMarked, CheckCircle2, Loader2, Calendar as CalendarIcon,
  Sparkles, History
} from "lucide-react"

interface MemorizationGoal {
  id: string
  student_id: string
  set_by: string | null
  week_start: string
  surah_from: number | null
  ayah_from: number | null
  surah_to: number | null
  ayah_to: number | null
  target_verses: number
  notes: string | null
  status: "active" | "completed" | "missed"
  completed_at: string | null
  created_at: string
  updated_at: string
}

export default function StudentMemorizationGoalPage() {
  const { t } = useI18n()
  const [goal, setGoal] = useState<MemorizationGoal | null>(null)
  const [history, setHistory] = useState<MemorizationGoal[]>([])
  const [weekStart, setWeekStart] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)

  // form state
  const [surahFrom, setSurahFrom] = useState("")
  const [ayahFrom, setAyahFrom] = useState("")
  const [surahTo, setSurahTo] = useState("")
  const [ayahTo, setAyahTo] = useState("")
  const [targetVerses, setTargetVerses] = useState("")
  const [notes, setNotes] = useState("")

  async function loadGoal() {
    setLoading(true)
    try {
      const [thisWeek, hist] = await Promise.all([
        fetch("/api/academy/student/memorization-goals").then(r => r.json()),
        fetch("/api/academy/student/memorization-goals?range=8").then(r => r.json()),
      ])
      setWeekStart(thisWeek.week_start || "")
      setGoal(thisWeek.goal || null)
      setHistory((hist.goals || []) as MemorizationGoal[])
      if (thisWeek.goal) {
        const g: MemorizationGoal = thisWeek.goal
        setSurahFrom(g.surah_from?.toString() || "")
        setAyahFrom(g.ayah_from?.toString() || "")
        setSurahTo(g.surah_to?.toString() || "")
        setAyahTo(g.ayah_to?.toString() || "")
        setTargetVerses(g.target_verses?.toString() || "")
        setNotes(g.notes || "")
      }
    } catch (err) {
      console.error("loadGoal failed", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadGoal() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/academy/student/memorization-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surah_from: surahFrom ? parseInt(surahFrom, 10) : null,
          ayah_from: ayahFrom ? parseInt(ayahFrom, 10) : null,
          surah_to: surahTo ? parseInt(surahTo, 10) : null,
          ayah_to: ayahTo ? parseInt(ayahTo, 10) : null,
          target_verses: targetVerses ? parseInt(targetVerses, 10) : 0,
          notes: notes.trim() || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setGoal(data.goal)
        await loadGoal()
      }
    } catch (err) {
      console.error("save goal failed", err)
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async () => {
    if (!goal) return
    setCompleting(true)
    try {
      const newStatus = goal.status === "completed" ? "active" : "completed"
      const res = await fetch(`/api/academy/student/memorization-goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const data = await res.json()
        setGoal(data.goal)
        await loadGoal()
      }
    } catch (err) {
      console.error("complete goal failed", err)
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  const isCompleted = goal?.status === "completed"
  const isAr = true

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-xs font-bold uppercase tracking-wider">
          <Target className="w-4 h-4" />
          {isAr ? "هدف الحفظ" : "Memorization Goal"}
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          {isAr ? "هدف الحفظ الأسبوعي" : "Weekly Memorization Goal"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAr
            ? "حدد ما تريد حفظه هذا الأسبوع وتابع تقدمك."
            : "Set what you want to memorize this week and track your progress."}
        </p>
      </div>

      {/* Current week */}
      <Card className={isCompleted ? "border-emerald-500/40" : "border-purple-500/30"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="w-4 h-4 text-purple-500" />
            {isAr ? "هدف هذا الأسبوع" : "This Week's Goal"}
            {weekStart && (
              <span className="ms-auto text-xs font-normal text-muted-foreground" dir="ltr">
                {new Date(weekStart).toLocaleDateString("ar-EG")}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goal && goal.set_by && goal.set_by !== goal.student_id && (
            <div className="mb-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-600">
              <Sparkles className="w-3.5 h-3.5 inline-block me-1" />
              {isAr
                ? "هذا الهدف حدده مدرسك."
                : "This goal was set by your teacher."}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">
                  {isAr ? "من سورة" : "From surah"}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number" min={1} max={114}
                    placeholder="1-114"
                    value={surahFrom}
                    onChange={(e) => setSurahFrom(e.target.value)}
                  />
                  <Input
                    type="number" min={1}
                    placeholder={isAr ? "آية" : "Ayah"}
                    value={ayahFrom}
                    onChange={(e) => setAyahFrom(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">
                  {isAr ? "إلى سورة" : "To surah"}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number" min={1} max={114}
                    placeholder="1-114"
                    value={surahTo}
                    onChange={(e) => setSurahTo(e.target.value)}
                  />
                  <Input
                    type="number" min={1}
                    placeholder={isAr ? "آية" : "Ayah"}
                    value={ayahTo}
                    onChange={(e) => setAyahTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">
                {isAr ? "عدد الآيات المستهدفة" : "Target verses"}
              </Label>
              <Input
                type="number" min={0}
                placeholder="0"
                value={targetVerses}
                onChange={(e) => setTargetVerses(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">
                {isAr ? "ملاحظات" : "Notes"}
              </Label>
              <Textarea
                placeholder={isAr ? "ملاحظات حول الهدف..." : "Notes..."}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Target className="w-4 h-4 me-2" />}
                {goal
                  ? (isAr ? "تحديث الهدف" : "Update goal")
                  : (isAr ? "حفظ الهدف" : "Save goal")}
              </Button>
              {goal && (
                <Button
                  type="button"
                  variant={isCompleted ? "outline" : "default"}
                  className={isCompleted
                    ? "flex-1"
                    : "flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"}
                  disabled={completing}
                  onClick={handleComplete}
                >
                  {completing
                    ? <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    : <CheckCircle2 className="w-4 h-4 me-2" />}
                  {isCompleted
                    ? (isAr ? "إلغاء الإنجاز" : "Undo complete")
                    : (isAr ? "تأشير كمنجز" : "Mark complete")}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="w-4 h-4 text-muted-foreground" />
              {isAr ? "الأسابيع السابقة" : "Past weeks"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {history.map(h => (
                <li key={h.id} className="py-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    h.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : h.status === "missed"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {h.status === "completed"
                      ? <CheckCircle2 className="w-4 h-4" />
                      : <BookMarked className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">
                      {h.target_verses
                        ? `${h.target_verses} ${isAr ? "آية" : "verses"}`
                        : (isAr ? "هدف الحفظ" : "Goal")}
                    </p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {new Date(h.week_start).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    h.status === "completed" ? "bg-emerald-500/10 text-emerald-600" :
                    h.status === "missed"    ? "bg-red-500/10 text-red-500" :
                                                "bg-muted text-muted-foreground"
                  }`}>
                    {h.status === "completed" ? (isAr ? "منجز" : "Done") :
                     h.status === "missed"    ? (isAr ? "فائت" : "Missed") :
                                                 (isAr ? "نشط" : "Active")}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
