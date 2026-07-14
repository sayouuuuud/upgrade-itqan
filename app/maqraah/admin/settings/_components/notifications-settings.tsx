"use client"

import { useState } from "react"
import { Bell, Mail, Send, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SectionCard, ToggleRow } from "./section-card"
import type { MaqraahSettings } from "../hooks/use-maqraah-settings"
import { useI18n } from "@/lib/i18n/context"

interface Props {
  settings: MaqraahSettings
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset?: () => void
  onTestSmtp?: (smtp: MaqraahSettings["smtp_config"]) => Promise<boolean>
}

export function NotificationsSettings({ settings, onUpdate, onReset, onTestSmtp }: Props) {
  const { t } = useI18n()
  const a = t.admin
  const [testing, setTesting] = useState(false)
  const [smtpStatus, setSmtpStatus] = useState<"idle" | "success" | "error">("idle")

  const smtp = settings.smtp_config || {}
  const events = settings.maqraah_notifications_events || {}

  const emailEvents: Record<string, string> = {
    session_reminder: a.nsetEventSessionReminder,
    recitation_evaluated: a.nsetEventRecitationEvaluated,
    new_badge: a.nsetEventNewBadge,
    level_up: a.nsetEventLevelUp,
    streak_warning: a.nsetEventStreakWarning,
    competition_announcement: a.nsetEventCompetitionAnnouncement,
    certificate_issued: a.nsetEventCertificateIssued,
  }

  const weekDays = [
    { value: "sunday", label: a.nsetDaySunday },
    { value: "monday", label: a.nsetDayMonday },
    { value: "tuesday", label: a.nsetDayTuesday },
    { value: "wednesday", label: a.nsetDayWednesday },
    { value: "thursday", label: a.nsetDayThursday },
    { value: "friday", label: a.nsetDayFriday },
    { value: "saturday", label: a.nsetDaySaturday },
  ]

  const updateSmtp = (updates: Partial<NonNullable<MaqraahSettings["smtp_config"]>>) => {
    onUpdate({ smtp_config: { ...smtp, ...updates } })
  }

  const toggleEvent = (eventId: string) => {
    onUpdate({ maqraah_notifications_events: { ...events, [eventId]: !events[eventId] } })
  }

  const handleTestSmtp = async () => {
    setTesting(true)
    setSmtpStatus("idle")
    const success = await onTestSmtp(smtp)
    setSmtpStatus(success ? "success" : "error")
    setTesting(false)
  }

  return (
    <div className="space-y-6">
      <SectionCard icon={Bell} title={a.nsetNotificationChannels} description={a.nsetNotificationChannelsDesc} onReset={onReset}>
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow label={a.nsetInApp} description={a.nsetInAppDesc} checked={settings.maqraah_notifications_in_app_enabled ?? true} onChange={(v) => onUpdate({ maqraah_notifications_in_app_enabled: v })} />
          <ToggleRow label={a.nsetEmail} description={a.nsetEmailDesc} checked={settings.maqraah_notifications_email_enabled ?? true} onChange={(v) => onUpdate({ maqraah_notifications_email_enabled: v })} />
        </div>
      </SectionCard>

      <SectionCard icon={Send} title={a.nsetSmtpSettings} description={a.nsetSmtpSettingsDesc}>
        {smtpStatus === "success" && (
          <Badge variant="default" className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 ml-1" />{a.nsetSmtpConnected}
          </Badge>
        )}
        {smtpStatus === "error" && (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 ml-1" />{a.nsetSmtpFailed}
          </Badge>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm">SMTP Host</Label>
            <Input dir="ltr" value={smtp.host || ""} onChange={(e) => updateSmtp({ host: e.target.value })} placeholder="smtp.gmail.com" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">SMTP Port</Label>
            <Input dir="ltr" value={smtp.port || ""} onChange={(e) => updateSmtp({ port: e.target.value })} placeholder="587" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm">SMTP User</Label>
            <Input dir="ltr" type="email" value={smtp.user || ""} onChange={(e) => updateSmtp({ user: e.target.value })} placeholder="user@example.com" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">SMTP Password</Label>
            <Input dir="ltr" type="password" value={smtp.password || ""} onChange={(e) => updateSmtp({ password: e.target.value })} placeholder="••••••••" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm">{a.nsetFromName}</Label>
            <Input value={smtp.fromName || ""} onChange={(e) => updateSmtp({ fromName: e.target.value })} placeholder="Itqan Academy" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{a.nsetFromEmail}</Label>
            <Input dir="ltr" type="email" value={smtp.fromEmail || ""} onChange={(e) => updateSmtp({ fromEmail: e.target.value })} placeholder="noreply@example.com" />
          </div>
        </div>
        <Button onClick={handleTestSmtp} disabled={testing || !smtp.host || !smtp.port || !smtp.user || !smtp.password} className="w-full md:w-auto">
          {testing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Send className="w-4 h-4 ml-2" />}
          {a.nsetTestConnection}
        </Button>
      </SectionCard>

      <SectionCard icon={Mail} title={a.nsetEmailEvents} description={a.nsetEmailEventsDesc}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(emailEvents).map(([id, label]) => (
            <div key={id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors" onClick={() => toggleEvent(id)}>
              <Checkbox checked={events[id] ?? false} onCheckedChange={() => toggleEvent(id)} />
              <Label className="cursor-pointer text-sm">{label}</Label>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Clock} title={a.nsetSchedules} description={a.nsetSchedulesDesc}>
        <ToggleRow label={a.nsetParentReport} description={a.nsetParentReportDesc} checked={settings.maqraah_notifications_parent_report_enabled ?? true} onChange={(v) => onUpdate({ maqraah_notifications_parent_report_enabled: v })} />
        <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted/50 rounded-xl">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{a.nsetReportDay}</Label>
            <Select value={settings.maqraah_notifications_parent_report_day || "sunday"} onValueChange={(v) => onUpdate({ maqraah_notifications_parent_report_day: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {weekDays.map((d) => (<SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{a.nsetReportHour}</Label>
            <Input type="number" min={0} max={23} value={settings.maqraah_notifications_parent_report_hour ?? 20} onChange={(e) => onUpdate({ maqraah_notifications_parent_report_hour: Number(e.target.value) })} />
          </div>
        </div>
        <div className="space-y-2 max-w-xs">
          <Label className="text-sm">{a.nsetSessionReminderHours}</Label>
          <Input type="number" min={0} value={settings.maqraah_notifications_session_reminder_hour ?? 5} onChange={(e) => onUpdate({ maqraah_notifications_session_reminder_hour: Number(e.target.value) })} />
        </div>
      </SectionCard>
    </div>
  )
}
