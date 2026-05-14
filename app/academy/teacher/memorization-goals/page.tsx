"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  BookMarked, Target, CheckCircle2, Loader2, Users,
  Calendar as CalendarIcon, Plus
} from "lucide-react"

interface Student {
  id: string
  name: string
  email: string
}

interface Goal {
  id: string
  student_id: string
  student_name?: string
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
}

export default function TeacherMemorizationGoalsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [thisWeek, setThisWeek] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [studentId, setStudentId] = useState("")
  const [surahFrom, setSurahFrom] = useState("")
  const [ayahFrom, setAyahFrom] = useState("")
  const [surahTo, setSurahTo] = useState("")
  const [ayahTo, setAyahTo] = useState("")
  const [targetVerses, setTargetVerses] = useState("")
  const [notes, setNotes] = useState("")
  const [studentHistory, setStudentHistory] = useState<Goal[]>([])

  async function loadAll() {
    setLoading(true)
    try {
      const [studentsRes, weekRes] = await Promise.all([
        fetch("/api/academy/teacher/students").then(r => r.ok ? r.json() : []),
        fetch("/api/academy/teacher/memorization-goals").then(r => r.ok ? r.json() : { goals: [] }),
      ])
      const list = Array.isArray(studentsRes) ? studentsRes : (studentsRes.data || [])
      setStudents(list)
      setThisWeek((weekRes.goals || []) as Goal[])
    } catch (err) {
      console.error("loadAll failed", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  async function loadStudent(id: string) {
    if (!id) {
      setStudentHistory([])
      return
    }
    try {
      const res = await fetch(`/api/academy/teacher/memorization-goals?student_id=${id}`)
      if (res.ok) {
        const data = await res.json()
        setStudentHistory((data.goals || []) as Goal[])
        const current = (data.goals || []).find((g: Goal) => {
          const today = new Date()
          const weekStart = new Date(g.week_start)
          const diff = (today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
          return diff >= 0 && diff < 7
        })
        if (current) {
          setSurahFrom(current.surah_from?.toString() || "")
          setAyahFrom(current.ayah_from?.toString() || "")
          setSurahTo(current.surah_to?.toString() || "")
          setAyahTo(current.ayah_to?.toString() || "")
          setTargetVerses(current.target_verses?.toString() || "")
          setNotes(current.notes || "")
        } else {
          setSurahFrom(""); setAyahFrom(""); setSurahTo("")
          setAyahTo(""); setTargetVerses(""); setNotes("")
        }
      }
    } catch (err) {
      console.error("loadStudent failed", err)
    }
  }

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setStudentId(id)
    void loadStudent(id)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId) return
    setSaving(true)
    try {
      const res = await fetch("/api/academy/teacher/memorization-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          surah_from: surahFrom ? parseInt(surahFrom, 10) : null,
          ayah_from: ayahFrom ? parseInt(ayahFrom, 10) : null,
          surah_to: surahTo ? parseInt(surahTo, 10) : null,
          ayah_to: ayahTo ? parseInt(ayahTo, 10) : null,
          target_verses: targetVerses ? parseInt(targetVerses, 10) : 0,
          notes: notes.trim() || null,
        }),
      })
      if (res.ok) {
        await Promise.all([loadAll(), loadStudent(studentId)])
      }
    } catch (err) {
      console.error("save failed", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-xs font-bold uppercase tracking-wider">
          <Target className="w-4 h-4" />
          أهداف الحفظ
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          إدارة أهداف الحفظ الأسبوعية
        </h1>
        <p className="text-sm text-muted-foreground">
          حدد أهداف الحفظ لكل طالب وتابع تقدم الفصل بأكمله.
        </p>
      </div>

      {/* This week's overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="w-4 h-4 text-purple-500" />
            أهداف هذا الأسبوع ({thisWeek.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {thisWeek.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              لم تحدد أي أهداف لهذا الأسبوع بعد.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {thisWeek.map(g => (
                <li key={g.id} className="py-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    g.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-purple-500/10 text-purple-600"
                  }`}>
                    {g.status === "completed"
                      ? <CheckCircle2 className="w-4 h-4" />
                      : <BookMarked className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">
                      {g.student_name || "طالب"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {g.target_verses ? `${g.target_verses} آية` : "هدف الحفظ"}
                      {g.surah_from ? ` · من سورة ${g.surah_from}${g.ayah_from ? ":" + g.ayah_from : ""}` : ""}
                      {g.surah_to ? ` إلى ${g.surah_to}${g.ayah_to ? ":" + g.ayah_to : ""}` : ""}
                    </p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    g.status === "completed" ? "bg-emerald-500/10 text-emerald-600" :
                    g.status === "missed"    ? "bg-red-500/10 text-red-500" :
                                                "bg-purple-500/10 text-purple-600"
                  }`}>
                    {g.status === "completed" ? "منجز" :
                     g.status === "missed"    ? "فائت" : "نشط"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Set / update form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="w-4 h-4 text-emerald-500" />
            تحديد هدف لطالب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold">الطالب</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={studentId}
                onChange={handleStudentChange}
                required
              >
                <option value="">— اختر طالب —</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">من سورة</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" min={1} max={114}
                         placeholder="1-114"
                         value={surahFrom}
                         onChange={(e) => setSurahFrom(e.target.value)} />
                  <Input type="number" min={1}
                         placeholder="آية"
                         value={ayahFrom}
                         onChange={(e) => setAyahFrom(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">إلى سورة</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" min={1} max={114}
                         placeholder="1-114"
                         value={surahTo}
                         onChange={(e) => setSurahTo(e.target.value)} />
                  <Input type="number" min={1}
                         placeholder="آية"
                         value={ayahTo}
                         onChange={(e) => setAyahTo(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">عدد الآيات المستهدفة</Label>
              <Input type="number" min={0}
                     placeholder="0"
                     value={targetVerses}
                     onChange={(e) => setTargetVerses(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">ملاحظات</Label>
              <Textarea rows={3}
                        placeholder="ملاحظات للطالب..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)} />
            </div>

            <Button type="submit" disabled={saving || !studentId}
                    className="w-full bg-purple-600 hover:bg-purple-700">
              {saving ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Target className="w-4 h-4 me-2" />}
              حفظ الهدف
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History for selected student */}
      {studentId && studentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-muted-foreground" />
              تاريخ أهداف هذا الطالب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {studentHistory.map(g => (
                <li key={g.id} className="py-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    g.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : g.status === "missed"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    <BookMarked className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">
                      {g.target_verses ? `${g.target_verses} آية` : "هدف الحفظ"}
                    </p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {new Date(g.week_start).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    g.status === "completed" ? "bg-emerald-500/10 text-emerald-600" :
                    g.status === "missed"    ? "bg-red-500/10 text-red-500" :
                                                "bg-muted text-muted-foreground"
                  }`}>
                    {g.status === "completed" ? "منجز" :
                     g.status === "missed"    ? "فائت" : "نشط"}
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
