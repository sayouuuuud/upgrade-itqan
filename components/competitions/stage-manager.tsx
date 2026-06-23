"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Flag, Trophy, XCircle, Loader2, CheckCircle2, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Stage {
  id: string
  order_index: number
  name: string
  advance_count: number | null
  status: string // locked | active | completed
}

export interface RankPreviewRow {
  rank: number
  student_id: string
  student_name: string | null
  score: number | null
  is_winner: boolean
}

/**
 * Admin-facing stage control: shows the round timeline, a preview of who
 * advances/wins from the active stage, the primary advance/finalize button, and
 * an "end competition" menu with the two early-exit options.
 *
 * `basePath` is the scope-specific API base, e.g.
 *   /api/academy/admin/competitions/<id>
 *   /api/admin/competitions/<id>
 */
export function StageManager({
  competitionId,
  basePath,
  onChanged,
}: {
  competitionId: string
  basePath: string
  onChanged?: () => void
}) {
  const [stages, setStages] = useState<Stage[]>([])
  const [activeStage, setActiveStage] = useState<Stage | null>(null)
  const [preview, setPreview] = useState<{ ready: boolean; pending: number; topN: number; ranking: RankPreviewRow[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<null | "advance" | "finalize_now" | "cancel">(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${basePath}/stages`)
      if (res.ok) {
        const data = await res.json()
        setStages(data.stages || [])
        setActiveStage(data.activeStage || null)
      }
      const pv = await fetch(`${basePath}/advance`)
      if (pv.ok) setPreview(await pv.json())
    } catch {
      // best-effort; UI shows empty state
    } finally {
      setLoading(false)
    }
  }, [basePath])

  useEffect(() => {
    load()
  }, [load])

  const isFinal = activeStage ? activeStage.order_index >= Math.max(...stages.map((s) => s.order_index), 0) : false
  const cutoff = isFinal ? preview?.topN : activeStage?.advance_count

  async function runAction(action: "advance" | "finalize_now" | "cancel") {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`${basePath}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || "حدث خطأ")
        return
      }
      setConfirm(null)
      await load()
      onChanged?.()
    } catch {
      setError("تعذّر تنفيذ العملية")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (stages.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Stage timeline */}
      <div className="flex flex-wrap items-center gap-2">
        {stages.map((s, i) => {
          const active = activeStage?.id === s.id
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
                  active && "border-primary bg-primary/10 text-primary font-medium",
                  s.status === "completed" && !active && "border-muted bg-muted/50 text-muted-foreground",
                )}
              >
                {s.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : s.status === "locked" ? (
                  <Lock className="h-4 w-4 shrink-0" />
                ) : (
                  <Flag className="h-4 w-4 shrink-0" />
                )}
                <span>{s.name}</span>
                {s.advance_count != null && (
                  <Badge variant="secondary" className="text-[10px]">
                    {"يتأهّل "}
                    {s.advance_count}
                  </Badge>
                )}
              </div>
              {i < stages.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          )
        })}
      </div>

      {/* Active stage status + preview */}
      {activeStage && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">
                {"المرحلة الحالية: "}
                {activeStage.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {preview?.pending ? `${preview.pending} مشاركة بانتظار التقييم` : "كل المشاركات مُقيّمة"}
                {cutoff ? ` · ${isFinal ? "الفائزون" : "المتأهلون"}: ${cutoff}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={busy || !preview?.ready}
                onClick={() => setConfirm(isFinal ? "finalize_now" : "advance")}
              >
                {isFinal ? <Trophy className="ml-1.5 h-4 w-4" /> : <ChevronRight className="ml-1.5 h-4 w-4" />}
                {isFinal ? "اعتماد النتائج النهائية" : "ترحيل المتأهلين"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" disabled={busy}>
                    {"إنهاء المسابقة"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isFinal && (
                    <DropdownMenuItem onClick={() => setConfirm("finalize_now")}>
                      <Trophy className="ml-2 h-4 w-4" />
                      {"إنهاء واعتماد النتائج الحالية"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirm("cancel")}>
                    <XCircle className="ml-2 h-4 w-4" />
                    {"إلغاء المسابقة (بدون فائز)"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Ranking preview */}
          {preview && preview.ranking.length > 0 && (
            <div className="mt-4 space-y-1">
              {preview.ranking.slice(0, Math.max(cutoff || 3, 5)).map((r) => (
                <div
                  key={r.student_id}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2 py-1 text-sm",
                    r.is_winner ? "bg-primary/10" : "text-muted-foreground",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-5 text-center font-medium">{r.rank}</span>
                    <span>{r.student_name || "—"}</span>
                    {r.is_winner && (
                      <Badge variant="default" className="text-[10px]">
                        {isFinal ? "فائز" : "متأهّل"}
                      </Badge>
                    )}
                  </span>
                  <span className="tabular-nums">{r.score ?? "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation dialog */}
      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm === "advance" && "ترحيل المتأهلين للمرحلة التالية"}
              {confirm === "finalize_now" && "إنهاء واعتماد النتائج الحالية"}
              {confirm === "cancel" && "إلغاء المسابقة"}
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              {confirm === "advance" && (
                <span>
                  {`سيتأهّل أعلى ${cutoff || ""} طالباً من «${activeStage?.name}» إلى المرحلة التالية، وسيُستبعد الباقون. سيتم إشعار الجميع.`}
                </span>
              )}
              {confirm === "finalize_now" && (
                <span>
                  {`سيتم اعتماد نتائج «${activeStage?.name}» كنتيجة نهائية فوراً. الفائز هو صاحب أعلى درجة، وستُمنح النقاط والشهادات، وتُغلق باقي المراحل.`}
                </span>
              )}
              {confirm === "cancel" && (
                <span>{"سيتم إنهاء المسابقة فوراً بدون فائز أو نقاط أو شهادات، مع إشعار كل المشاركين. لا يمكن التراجع."}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)} disabled={busy}>
              {"رجوع"}
            </Button>
            <Button
              variant={confirm === "cancel" ? "destructive" : "default"}
              onClick={() => confirm && runAction(confirm)}
              disabled={busy}
            >
              {busy && <Loader2 className="ml-1.5 h-4 w-4 animate-spin" />}
              {"تأكيد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
