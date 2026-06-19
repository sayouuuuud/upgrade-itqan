"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {
  Shield, Search, Users, BookOpen, Loader2, Settings2, CheckCircle2, Globe
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type Supervisor = {
  id: string
  name: string
  email: string
  role: "student_supervisor" | "reciter_supervisor"
  is_active: boolean
  assignment_count: string | number
}

type PoolUser = { id: string; name: string; email: string; is_active: boolean }

export default function AdminSupervisorsPage() {
  const { t, locale } = useI18n()
  const a = t.admin
  const isAr = locale === "ar"

  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [loading, setLoading] = useState(true)

  const [active, setActive] = useState<Supervisor | null>(null)
  const [pool, setPool] = useState<PoolUser[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dialogLoading, setDialogLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [poolSearch, setPoolSearch] = useState("")

  const fetchSupervisors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/supervisors")
      if (res.ok) {
        const data = await res.json()
        setSupervisors(data.supervisors || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSupervisors()
  }, [fetchSupervisors])

  const openManage = async (s: Supervisor) => {
    setActive(s)
    setDialogLoading(true)
    setPoolSearch("")
    try {
      const res = await fetch(`/api/admin/supervisors/${s.id}/assignments`)
      if (res.ok) {
        const data = await res.json()
        setPool(data.pool || [])
        setSelected(new Set<string>(data.assignedIds || []))
      }
    } finally {
      setDialogLoading(false)
    }
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const save = async () => {
    if (!active) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/supervisors/${active.id}/assignments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selected) }),
      })
      if (res.ok) {
        setActive(null)
        fetchSupervisors()
      }
    } finally {
      setSaving(false)
    }
  }

  const filteredPool = pool.filter(
    (u) =>
      !poolSearch ||
      u.name?.toLowerCase().includes(poolSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(poolSearch.toLowerCase())
  )

  const roleLabel = (role: string) =>
    role === "student_supervisor"
      ? a.svStudentSupervisor
      : a.svReciterSupervisor

  return (
    <div className="p-4 md:p-6 space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground text-balance">
            {a.svManage}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "حدّد نطاق إشراف كل مشرف على الطلاب أو المقرئين المُسندين له"
              : "Define each supervisor's scope over assigned students or readers"}
          </p>
        </div>
      </header>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : supervisors.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Shield className="h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            {a.svNoSupervisors}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {supervisors.map((s) => {
            const count = Number(s.assignment_count) || 0
            const isStudent = s.role === "student_supervisor"
            return (
              <div
                key={s.id}
                className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-card-foreground">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 gap-1">
                    {isStudent ? <Users className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
                    {roleLabel(s.role)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {count === 0 ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-500">
                      <Globe className="h-4 w-4" />
                      {a.svFullScope}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {isAr
                        ? `${count} ${isStudent ? "طالب" : "مقرئ"} مُسند`
                        : `${count} assigned ${isStudent ? "student(s)" : "reader(s)"}`}
                    </span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-auto gap-2 bg-transparent"
                  onClick={() => openManage(s)}
                >
                  <Settings2 className="h-4 w-4" />
                  {a.svSetScope}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>
              {a.svSetScopeTitle} — {active?.name}
            </DialogTitle>
            <DialogDescription>
              {isAr
                ? "اختر المستخدمين المُسندين. ترك الكل بدون تحديد يعني نطاقاً كاملاً (يرى الجميع)."
                : "Select assigned users. Leaving none selected means full scope (sees everyone)."}
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ltr:left-3 rtl:right-3" />
            <Input
              value={poolSearch}
              onChange={(e) => setPoolSearch(e.target.value)}
              placeholder={a.svSearchPlaceholder}
              className="ltr:pl-9 rtl:pr-9"
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-md border divide-y">
            {dialogLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPool.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {a.svNoUsers}
              </p>
            ) : (
              filteredPool.map((u) => (
                <label
                  key={u.id}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selected.has(u.id)}
                    onCheckedChange={() => toggle(u.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  {!u.is_active && (
                    <Badge variant="outline" className="text-xs">
                      {a.svInactive}
                    </Badge>
                  )}
                </label>
              ))
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {isAr
              ? `${selected.size} مُحدد`
              : `${selected.size} selected`}
          </p>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setActive(null)} disabled={saving}>
              {a.bkgCancel}
            </Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {a.svSaveScope}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
