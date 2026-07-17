"use client"

import { useState } from "react"
import { Bell, Mail, Send, Clock, CheckCircle, XCircle, Loader2, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AcademySettings } from "../hooks/use-academy-settings"
import { useI18n } from "@/lib/i18n/context"

interface NotificationsEmailSettingsProps {
  settings: AcademySettings
  onUpdate: (updates: Partial<AcademySettings>) => void
  onReset?: () => void
  onTestSmtp?: (smtp: AcademySettings["smtp_config"]) => Promise<boolean>
}

export function NotificationsEmailSettings({
  settings,
  onUpdate,
  onReset,
  onTestSmtp,
}: NotificationsEmailSettingsProps) {
  const { t } = useI18n()
  const academy = (t as any).academy as Record<string, string> | undefined
  const a = t.academyAdmin
  const [testing, setTesting] = useState(false)
  const [smtpStatus, setSmtpStatus] = useState<"idle" | "success" | "error">("idle")

  const emailEvents = [
    { id: "course_approved", label: a.neEventCourseApproved },
    { id: "new_task", label: a.neEventNewTask },
    { id: "session_reminder_1h", label: a.neEventReminder1h },
    { id: "session_reminder_10m", label: a.neEventReminder10m },
    { id: "new_badge", label: a.neEventNewBadge },
    { id: "level_up", label: a.neEventLevelUp },
    { id: "streak_warning", label: a.neEventStreakWarning },
    { id: "parent_report", label: a.neEventParentReport },
    { id: "werd_reminder", label: a.neEventWerdReminder },
  ]

  const weekDays = [
    { value: "sunday", label: a.neParentReportDay },
    { value: "monday", label: a.neWeekdayMonday },
    { value: "tuesday", label: a.neWeekdayTuesday },
    { value: "wednesday", label: a.neWeekdayWednesday },
    { value: "thursday", label: a.neWeekdayThursday },
    { value: "friday", label: a.neWeekdayFriday },
    { value: "saturday", label: a.neWeekdaySaturday },
  ]

  const smtp = settings.smtp_config || {}
  
  // Robust parser for academy_notifications_events supporting both array and record formats
  const rawEvents = settings.academy_notifications_events || {}
  const events: Record<string, boolean> = {}

  if (Array.isArray(rawEvents)) {
    rawEvents.forEach((ev) => {
      if (typeof ev === "string") {
        events[ev] = true
      }
    })
  } else if (rawEvents && typeof rawEvents === "object") {
    Object.entries(rawEvents).forEach(([key, val]) => {
      events[key] = !!val
    })
  }

  const updateSmtp = (updates: Partial<AcademySettings["smtp_config"]>) => {
    onUpdate({ smtp_config: { ...smtp, ...updates } })
  }

  const toggleEvent = (eventId: string) => {
    const updated = {
      ...events,
      [eventId]: !events[eventId],
    }
    onUpdate({ academy_notifications_events: updated })
  }

  const handleTestSmtp = async () => {
    setTesting(true)
    setSmtpStatus("idle")
    const success = await onTestSmtp?.(smtp)
    setSmtpStatus(success ? "success" : "error")
    setTesting(false)
  }

  return (
    <div className="space-y-6">
      {/* General Toggles */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{a.neNotificationChannels}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{a.neNotificationChannelsDesc}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onReset?.()} className="text-muted-foreground">
              <RotateCcw className="w-4 h-4 ml-1" />
              {a.gsRestore}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-500" />
              <div className="space-y-0.5">
                <Label className="font-medium">{a.neInApp}</Label>
                <p className="text-xs text-muted-foreground">{a.neInAppDesc}</p>
              </div>
            </div>
            <Switch
              checked={settings.academy_notifications_in_app_enabled ?? true}
              onCheckedChange={(v) => onUpdate({ academy_notifications_in_app_enabled: v })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-green-500" />
              <div className="space-y-0.5">
                <Label className="font-medium">{a.neEmailLabel}</Label>
                <p className="text-xs text-muted-foreground">{a.neEmailDesc}</p>
              </div>
            </div>
            <Switch
              checked={settings.academy_notifications_email_enabled ?? true}
              onCheckedChange={(v) => onUpdate({ academy_notifications_email_enabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMTP Settings */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Send className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{a.neSmtpSettings}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{a.neSmtpSettingsDesc}</CardDescription>
              </div>
            </div>
            {smtpStatus === "success" && (
              <Badge variant="default" className="bg-success text-success-foreground">
                <CheckCircle className="w-3 h-3 ml-1" />
                {a.neConnected}
              </Badge>
            )}
            {smtpStatus === "error" && (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 ml-1" />
                {a.neErrorMsg}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-medium text-sm">SMTP Host</Label>
              <Input
                dir="ltr"
                value={smtp.host || ""}
                onChange={(e) => updateSmtp({ host: e.target.value })}
                placeholder="smtp.gmail.com"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">SMTP Port</Label>
              <Input
                dir="ltr"
                value={smtp.port || ""}
                onChange={(e) => updateSmtp({ port: e.target.value })}
                placeholder="587"
                className="h-11"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-medium text-sm">SMTP User</Label>
              <Input
                dir="ltr"
                type="email"
                value={smtp.user || ""}
                onChange={(e) => updateSmtp({ user: e.target.value })}
                placeholder="user@example.com"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">SMTP Password</Label>
              <Input
                dir="ltr"
                type="password"
                value={smtp.password || ""}
                onChange={(e) => updateSmtp({ password: e.target.value })}
                placeholder="••••••••"
                className="h-11"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-medium text-sm">{a.neFromNameLabel}</Label>
              <Input
                value={smtp.fromName || ""}
                onChange={(e) => updateSmtp({ fromName: e.target.value })}
                placeholder={a.neFromNamePlaceholder}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">{a.neFromEmailLabel}</Label>
              <Input
                dir="ltr"
                type="email"
                value={smtp.fromEmail || ""}
                onChange={(e) => updateSmtp({ fromEmail: e.target.value })}
                placeholder="noreply@example.com"
                className="h-11"
              />
            </div>
          </div>

          <Button
            onClick={handleTestSmtp}
            disabled={testing || !smtp.host || !smtp.port || !smtp.user || !smtp.password}
            className="w-full md:w-auto"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : (
              <Send className="w-4 h-4 ml-2" />
            )}
            {a.neTestConnection}
          </Button>
        </CardContent>
      </Card>

      {/* Email Events */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{a.neEmailEvents}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.neEmailEventsDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {emailEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => toggleEvent(event.id)}
              >
                <Checkbox
                  checked={!!events[event.id]}
                  onCheckedChange={() => toggleEvent(event.id)}
                />
                <Label className="cursor-pointer text-sm">{event.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timing Settings */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{a.neTiming}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.neTimingDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="p-4 bg-muted/50 rounded-xl space-y-4">
            <Label className="font-medium">{a.neParentReport}</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">{a.neParentReportDay}</Label>
                <Select
                  value={settings.academy_notifications_parent_report_day || "sunday"}
                  onValueChange={(v) => onUpdate({ academy_notifications_parent_report_day: v })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekDays.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">{a.neParentReportTime}</Label>
                <Input
                  type="time"
                  value={settings.academy_notifications_parent_report_time || "08:00"}
                  onChange={(e) => onUpdate({ academy_notifications_parent_report_time: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-xl space-y-4">
            <Label className="font-medium">{a.neWerdReminder}</Label>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{a.neParentReportTime}</Label>
              <Input
                type="time"
                value={settings.academy_notifications_werd_reminder_time || "06:00"}
                onChange={(e) => onUpdate({ academy_notifications_werd_reminder_time: e.target.value })}
                className="h-11 max-w-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
