"use client"

// Admin panel: manage the rule list shown in the forum sidebar.

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useToast } from "@/hooks/use-toast"
import type { Community, CommunityRule } from "@/lib/community/types"

interface RulesPanelProps {
  community: Community
}

export function RulesPanel({ community }: RulesPanelProps) {
  const { locale } = useI18n()
  const { toast } = useToast()
  const isAr = locale === "ar"

  const [rules, setRules] = useState<CommunityRule[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<CommunityRule | null>(null)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [position, setPosition] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/community/admin/rules?community=${community}`)
      const data = await res.json()
      if (res.ok) setRules(data.rules || [])
      else toast({ title: data.error, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [community, toast])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setCreating(true)
    setTitle("")
    setBody("")
    setPosition(rules.length + 1)
  }
  const openEdit = (r: CommunityRule) => {
    setCreating(false)
    setEditing(r)
    setTitle(r.title)
    setBody(r.body || "")
    setPosition(r.position)
  }
  const close = () => {
    setEditing(null)
    setCreating(false)
  }

  const submit = async () => {
    if (!title.trim()) return
    setSubmitting(true)
    try {
      let res: Response
      if (creating) {
        res = await fetch("/api/community/admin/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            community,
            title: title.trim(),
            body: body.trim() || null,
            position,
          }),
        })
      } else if (editing) {
        res = await fetch(`/api/community/admin/rules/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            body: body.trim() || null,
            position,
          }),
        })
      } else return
      const data = await res.json()
      if (res.ok) {
        toast({ title: isAr ? "تم الحفظ" : "Saved" })
        close()
        load()
      } else {
        toast({ title: data.error, variant: "destructive" })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (r: CommunityRule) => {
    if (!confirm(isAr ? "حذف هذه القاعدة؟" : "Delete this rule?")) return
    const res = await fetch(`/api/community/admin/rules/${r.id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      toast({ title: isAr ? "تم الحذف" : "Deleted" })
      load()
    } else {
      const data = await res.json()
      toast({ title: data.error, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 ml-1" />
          {isAr ? "إضافة قاعدة" : "Add rule"}
        </Button>
      </div>

      {loading && rules.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          {isAr ? "جارٍ التحميل…" : "Loading…"}
        </Card>
      ) : rules.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          {isAr ? "لا توجد قواعد بعد" : "No rules yet"}
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.map((r, idx) => (
            <Card key={r.id} className="p-3 flex items-start gap-3">
              <div className="text-sm font-bold text-muted-foreground w-6 text-center tabular-nums">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{r.title}</div>
                {r.body && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {r.body}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-rose-500"
                  onClick={() => remove(r)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={creating || !!editing} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {creating
                ? isAr ? "إضافة قاعدة" : "Add rule"
                : isAr ? "تعديل قاعدة" : "Edit rule"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                {isAr ? "العنوان" : "Title"}
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={160}
                placeholder={isAr ? "عنوان مختصر" : "Short title"}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                {isAr ? "النص (اختياري)" : "Body (optional)"}
              </label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                {isAr ? "ترتيب العرض" : "Position"}
              </label>
              <Input
                type="number"
                min={0}
                value={position}
                onChange={(e) => setPosition(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={submitting}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={submit} disabled={submitting || !title.trim()}>
              {submitting
                ? isAr ? "جارٍ الحفظ…" : "Saving…"
                : isAr ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
