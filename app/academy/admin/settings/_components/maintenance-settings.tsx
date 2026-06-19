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
import { useI18n } from "@/lib/i18n/context"

interface MaintenanceSettingsProps {
  settings: AcademySettings
  onUpdate: (updates: Partial<AcademySettings>) => void
}

export function MaintenanceSettings({ settings, onUpdate }: MaintenanceSettingsProps) {
  const { t } = useI18n()
  const a = t.academyAdmin
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
      if (!res.ok) throw new Error(data.error || a.mtErrorFallback)
      toast.success(data.message || a.mtCacheClearedSuccess)
    } catch (err: any) {
      toast.error(err.message || a.mtCacheClearedFailed)
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
        throw new Error(err.error || a.mtBackupFailed)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `itqan-settings-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success(a.mtBackupSuccess)
    } catch (err: any) {
      toast.error(err.message || a.mtBackupFailed)
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
              <CardTitle className="text-lg">{a.mtTitle}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.mtDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium text-destructive">{a.mtEnable}</Label>
              <p className="text-xs text-destructive/80">{a.mtEnableDesc}</p>
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
                {a.mtActiveWarning}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Label className="font-medium text-sm">{a.mtMessage}</Label>
            <Textarea
              value={settings.academy_maintenance_message || ""}
              onChange={(e) => onUpdate({ academy_maintenance_message: e.target.value })}
              placeholder={a.mtMaintenancePlaceholder}
              className="min-h-[100px] resize-none"
            />
            <p className="text-[11px] text-muted-foreground">{a.mtMessageHint}</p>
          </div>

          <div className="space-y-3">
            <Label className="font-medium text-sm">{a.mtExcludedIps}</Label>
            <Textarea
              value={allowedIps.join("\n")}
              onChange={(e) => updateAllowedIps(e.target.value)}
              placeholder="192.168.1.1&#10;10.0.0.1&#10;..."
              className="min-h-[80px] resize-none font-mono text-sm"
              dir="ltr"
            />
            <p className="text-[11px] text-muted-foreground">
              {a.mtExcludedIpsHint}
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
              <CardTitle className="text-lg">{a.mtSystemActions}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.mtSystemActionsDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Clear Cache */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                {a.mtClearCache}
              </Label>
              <p className="text-xs text-muted-foreground">{a.mtClearCacheDesc}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={clearingCache}>
                  {clearingCache ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 ml-2" />
                  )}
                  {a.mtClear}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{a.mtConfirmClearCache}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {a.mtConfirmClearCacheDesc}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{a.mtCancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearCache}>{a.mtConfirmClear}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Backup */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium flex items-center gap-2">
                <Download className="w-4 h-4" />
                {a.mtBackup}
              </Label>
              <p className="text-xs text-muted-foreground">{a.mtBackupDesc}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={backingUp}>
                  {backingUp ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <Download className="w-4 h-4 ml-2" />
                  )}
                  {a.mtExport}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{a.mtConfirmBackup}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {a.mtConfirmBackupDesc}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{a.mtCancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBackup}>{a.mtConfirmExport}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
