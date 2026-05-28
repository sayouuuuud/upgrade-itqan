"use client"

import { useState } from "react"
import { Wrench, AlertTriangle, Trash2, RefreshCw, Download, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { AcademySettings } from "../hooks/use-academy-settings"

interface MaintenanceSettingsProps {
  settings: AcademySettings
  onUpdate: (updates: Partial<AcademySettings>) => void
}

export function MaintenanceSettings({ settings, onUpdate }: MaintenanceSettingsProps) {
  const [clearingCache, setClearingCache] = useState(false)
  const [backingUp, setBackingUp] = useState(false)

  const allowedIps = settings.academy_maintenance_allowed_ips || []

  const updateAllowedIps = (text: string) => {
    const ips = text
      .split(/[\n,]/)
      .map((ip) => ip.trim())
      .filter(Boolean)
    onUpdate({ academy_maintenance_allowed_ips: ips })
  }

  const handleClearCache = async () => {
    setClearingCache(true)
    try {
      const res = await fetch("/api/academy/admin/settings/clear-cache", { method: "POST" })
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
      const res = await fetch("/api/academy/admin/settings/backup")
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "فشل في إنشاء النسخة الاحتياطية")
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `itqan-settings-backup-${new Date().toISOString().split("T")[0]}.json`
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
      {/* Maintenance Mode */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">وضع الصيانة</CardTitle>
              <CardDescription className="text-xs mt-0.5">إيقاف المنصة مؤقتاً للصيانة</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium text-destructive">تفعيل وضع الصيانة</Label>
              <p className="text-xs text-destructive/80">سيتم حجب المنصة عن جميع المستخدمين</p>
            </div>
            <Switch
              checked={settings.academy_maintenance_enabled ?? false}
              onCheckedChange={(v) => onUpdate({ academy_maintenance_enabled: v })}
            />
          </div>

          {settings.academy_maintenance_enabled && (
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-sm text-destructive">
                وضع الصيانة مُفعّل! المنصة محجوبة عن المستخدمين العاديين.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Label className="font-medium text-sm">رسالة الصيانة</Label>
            <Textarea
              value={settings.academy_maintenance_message || ""}
              onChange={(e) => onUpdate({ academy_maintenance_message: e.target.value })}
              placeholder="المنصة تحت الصيانة، سنعود قريباً..."
              className="min-h-[100px] resize-none"
            />
            <p className="text-[11px] text-muted-foreground">تظهر للمستخدمين عند محاولة الدخول</p>
          </div>

          <div className="space-y-3">
            <Label className="font-medium text-sm">IPs مستثناة من الصيانة</Label>
            <Textarea
              value={allowedIps.join("\n")}
              onChange={(e) => updateAllowedIps(e.target.value)}
              placeholder="192.168.1.1&#10;10.0.0.1&#10;..."
              className="min-h-[80px] resize-none font-mono text-sm"
              dir="ltr"
            />
            <p className="text-[11px] text-muted-foreground">
              IP واحد في كل سطر. هذه الـ IPs تستطيع الوصول حتى أثناء الصيانة.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">إجراءات النظام</CardTitle>
              <CardDescription className="text-xs mt-0.5">عمليات الصيانة والنسخ الاحتياطي</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Clear Cache */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                مسح الـ Cache
              </Label>
              <p className="text-xs text-muted-foreground">إزالة البيانات المؤقتة المخزنة</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={clearingCache}>
                  {clearingCache ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 ml-2" />
                  )}
                  مسح
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد مسح الـ Cache</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم حذف جميع البيانات المؤقتة. قد يؤدي ذلك إلى بطء مؤقت في تحميل الصفحات.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearCache}>تأكيد المسح</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Backup */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium flex items-center gap-2">
                <Download className="w-4 h-4" />
                نسخة احتياطية فورية
              </Label>
              <p className="text-xs text-muted-foreground">تصدير الإعدادات والبيانات (JSON)</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={backingUp}>
                  {backingUp ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <Download className="w-4 h-4 ml-2" />
                  )}
                  تصدير
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد النسخ الاحتياطي</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم تحميل ملف JSON يحتوي على جميع الإعدادات. هل تريد المتابعة؟
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBackup}>تأكيد التصدير</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
