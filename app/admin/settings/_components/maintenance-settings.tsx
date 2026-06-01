"use client"

import { useState } from "react"
import useSWR from "swr"
import { Wrench, Trash2, Download, Loader2, HardDrive, CheckCircle, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { SectionCard, ToggleRow } from "./section-card"
import type { MaqraahSettings } from "../hooks/use-maqraah-settings"

interface Props {
  settings: MaqraahSettings
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset: () => void
}

const providerLabels: Record<string, string> = {
  s3: "Amazon S3",
  cloudinary: "Cloudinary",
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function MaintenanceSettings({ settings, onUpdate, onReset }: Props) {
  const [clearingCache, setClearingCache] = useState(false)
  const [backingUp, setBackingUp] = useState(false)

  const { data: storageStatus, isLoading: storageLoading } = useSWR<{ providers: Record<string, boolean> }>(
    "/api/admin/settings/storage-status",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  const allowedIps = settings.maqraah_maintenance_allowed_ips || []

  const updateAllowedIps = (text: string) => {
    const ips = text
      .split(/[\n,]/)
      .map((ip) => ip.trim())
      .filter(Boolean)
    onUpdate({ maqraah_maintenance_allowed_ips: ips })
  }

  const handleClearCache = async () => {
    setClearingCache(true)
    try {
      const res = await fetch("/api/admin/settings/clear-cache", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "فشل")
      toast.success(data.message || "تم مسح الـ Cache بنجاح")
    } catch (err: any) {
      toast.error(err.message || "فشل في مسح الـ Cache")
    } finally {
      setClearingCache(false)
    }
  }

  const handleBackup = async () => {
    setBackingUp(true)
    try {
      const res = await fetch("/api/admin/settings/backup")
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "فشل في إنشاء النسخة الاحتياطية")
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `maqraah-settings-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("تم تحميل النسخة الاحتياطية")
    } catch (err: any) {
      toast.error(err.message || "فشل في إنشاء النسخة الاحتياطية")
    } finally {
      setBackingUp(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard icon={Wrench} title="وضع الصيانة" description="إيقاف الوصول مؤقتاً للمستخدمين" onReset={onReset}>
        <ToggleRow
          label="تفعيل وضع الصيانة"
          description="سيتم منع وصول المستخدمين عدا العناوين المسموح بها"
          checked={settings.maqraah_maintenance_mode ?? false}
          onChange={(v) => onUpdate({ maqraah_maintenance_mode: v })}
          destructive
        />
        <div className="space-y-2">
          <Label className="text-sm">رسالة الصيانة</Label>
          <Textarea
            rows={2}
            value={settings.maqraah_maintenance_message || ""}
            onChange={(e) => onUpdate({ maqraah_maintenance_message: e.target.value })}
            placeholder="المقرأة تحت الصيانة، نعود قريباً."
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">عناوين IP المسموح لها أثناء الصيانة</Label>
          <Textarea
            dir="ltr"
            rows={3}
            value={allowedIps.join("\n")}
            onChange={(e) => updateAllowedIps(e.target.value)}
            placeholder="192.168.1.1&#10;10.0.0.5"
          />
        </div>
      </SectionCard>

      <SectionCard icon={HardDrive} title="حالة مزودات التخزين" description="حالة اتصال خدمات رفع الملفات">
        <div className="space-y-3">
          {Object.entries(providerLabels).map(([id, name]) => {
            const connected = storageStatus?.providers?.[id] ?? false
            return (
              <div key={id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="font-medium text-sm">{name}</span>
                {storageLoading ? (
                  <Badge variant="secondary">
                    <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                    جاري الفحص
                  </Badge>
                ) : connected ? (
                  <Badge variant="default" className="bg-success text-success-foreground">
                    <CheckCircle className="w-3 h-3 ml-1" />
                    متصل
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="w-3 h-3 ml-1" />
                    غير مكوّن
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard icon={Wrench} title="إجراءات النظام" description="أدوات الصيانة والنسخ الاحتياطي">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                مسح الذاكرة المؤقتة
              </Label>
              <p className="text-xs text-muted-foreground">إعادة تحميل الإعدادات من قاعدة البيانات</p>
            </div>
            <Button variant="outline" onClick={handleClearCache} disabled={clearingCache}>
              {clearingCache ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Trash2 className="w-4 h-4 ml-2" />}
              مسح
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium flex items-center gap-2">
                <Download className="w-4 h-4" />
                نسخة احتياطية للإعدادات
              </Label>
              <p className="text-xs text-muted-foreground">تحميل ملف JSON بكل الإعدادات</p>
            </div>
            <Button variant="outline" onClick={handleBackup} disabled={backingUp}>
              {backingUp ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Download className="w-4 h-4 ml-2" />}
              تحميل
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
