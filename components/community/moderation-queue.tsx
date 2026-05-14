"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"
import { useToast } from "@/hooks/use-toast"
import type { Community } from "@/lib/community/types"

interface ModerationQueueProps {
  community: Community
}

interface ReportRow {
  id: string
  target_type: "post" | "reply"
  target_id: string
  reason: string
  details: string | null
  status: string
  created_at: string
  reporter_name: string
}

const STATUS_TABS: { id: string; label_ar: string; label_en: string }[] = [
  { id: "open", label_ar: "مفتوحة", label_en: "Open" },
  { id: "reviewed", label_ar: "مراجَعة", label_en: "Reviewed" },
  { id: "actioned", label_ar: "تم اتخاذ إجراء", label_en: "Actioned" },
  { id: "dismissed", label_ar: "مرفوضة", label_en: "Dismissed" },
]

export function ModerationQueue({ community }: ModerationQueueProps) {
  const { locale } = useI18n()
  const { toast } = useToast()
  const isAr = locale === "ar"

  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("open")
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [community, status])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/community/forum/reports?community=${community}&status=${status}`
      )
      const data = await res.json()
      if (res.ok) setReports(data.reports || [])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    setActing(id)
    try {
      const res = await fetch(`/api/community/forum/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id))
        toast({ title: isAr ? "تم التحديث" : "Updated" })
      } else {
        toast({ title: data.error, variant: "destructive" })
      }
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold">
          {isAr ? "الإشراف على المنتدى" : "Forum moderation"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAr
            ? "البلاغات المرسلة من الأعضاء عن منشورات أو ردود."
            : "Member reports about posts and replies."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={status === t.id ? "default" : "outline"}
            onClick={() => setStatus(t.id)}
          >
            {isAr ? t.label_ar : t.label_en}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">
          {isAr ? "جارٍ التحميل…" : "Loading…"}
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {isAr ? "لا توجد بلاغات" : "No reports"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{r.target_type}</Badge>
                  <Badge>{r.reason}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(r.created_at).toLocaleString(
                      isAr ? "ar-EG" : "en-US"
                    )}
                  </span>
                </div>
                <div className="text-sm">
                  {isAr ? "البلاغ من: " : "Reporter: "}
                  <span className="font-semibold">{r.reporter_name}</span>
                </div>
                {r.details && (
                  <p className="text-sm bg-muted p-2 rounded-md">{r.details}</p>
                )}
                <div className="text-xs text-muted-foreground">
                  {isAr ? "العنصر: " : "Target ID: "}
                  <code>{r.target_id}</code>
                </div>
                {status === "open" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => updateStatus(r.id, "actioned")}
                      disabled={acting === r.id}
                    >
                      {isAr ? "اتخذت إجراء" : "Actioned"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(r.id, "reviewed")}
                      disabled={acting === r.id}
                    >
                      {isAr ? "تمت المراجعة" : "Reviewed"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateStatus(r.id, "dismissed")}
                      disabled={acting === r.id}
                      className="text-rose-600"
                    >
                      {isAr ? "تجاهل" : "Dismiss"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
