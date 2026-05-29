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

interface Props {
  settings: MaqraahSettings
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset: () => void
  onTestSmtp: (smtp: MaqraahSettings["smtp_config"]) => Promise<boolean>
}

const emailEvents: Record<string, string> = {
  session_reminder: "تذكير الجلسة",
  recitation_evaluated: "تقييم تلاوة",
  new_badge: "شارة جديدة",
  level_up: "ترقية مستوى",
  streak_warning: "تحذير سلسلة المواظبة",
  competition_announcement: "إعلان مسابقة",
  certificate_issued: "إصدار شهادة",
}

const weekDays = [
  { value: "sunday", label: "الأحد" },
  { value: "monday", label: "الإثنين" },
  { value: "tuesday", label: "الثلاثاء" },
  { value: "wednesday", label: "الأربعاء" },
  { value: "thursday", label: "الخميس" },
  { value: "friday", label: "الجمعة" },
  { value: "saturday", label: "السبت" },
]

export function NotificationsSettings({ settings, onUpdate, onReset, onTestSmtp }: Props) {
  const [testing, setTesting] = useState(false)
  const [smtpStatus, setSmtpStatus] = useState<"idle" | "success" | "error">("idle")

  const smtp = settings.smtp_config || {}
  const events = settings.maqraah_notifications_events || {}

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
      <SectionCard
        icon={Bell}
        title="قنوات الإشعارات"
        description="تفعيل/تعطيل قنوات التنبيهات"
        onReset={onReset}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow
            label="الإشعارات داخل المنصة"
            description="جرس الإشعارات في الواجهة"
            checked={settings.maqraah_notifications_in_app_enabled ?? true}
            onChange={(v) => onUpdate({ maqraah_notifications_in_app_enabled: v })}
          />
          <ToggleRow
            label="البريد الإلكتروني"
            description="إرسال إيميلات للأحداث"
            checked={settings.maqraah_notifications_email_enabled ?? true}
            onChange={(v) => onUpdate({ maqraah_notifications_email_enabled: v })}
          />
        </div>
      </SectionCard>

      <SectionCard icon={Send} title="إعدادات SMTP" description="خادم البريد الإلكتروني (مشترك مع باقي النظام)">
        {smtpStatus === "success" && (
          <Badge variant="default" className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 ml-1" />
            تم الإرسال بنجاح
          </Badge>
        )}
        {smtpStatus === "error" && (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 ml-1" />
            فشل الاتصال
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
            <Label className="text-sm">من (الاسم)</Label>
            <Input value={smtp.fromName || ""} onChange={(e) => updateSmtp({ fromName: e.target.value })} placeholder="مقرأة إتقان" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">من (الإيميل)</Label>
            <Input dir="ltr" type="email" value={smtp.fromEmail || ""} onChange={(e) => updateSmtp({ fromEmail: e.target.value })} placeholder="noreply@example.com" />
          </div>
        </div>
        <Button
          onClick={handleTestSmtp}
          disabled={testing || !smtp.host || !smtp.port || !smtp.user || !smtp.password}
          className="w-full md:w-auto"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Send className="w-4 h-4 ml-2" />}
          اختبار الاتصال
        </Button>
      </SectionCard>

      <SectionCard icon={Mail} title="أحداث البريد" description="اختر الأحداث التي ترسل إشعارات">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(emailEvents).map(([id, label]) => (
            <div
              key={id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => toggleEvent(id)}
            >
              <Checkbox checked={events[id] ?? false} onCheckedChange={() => toggleEvent(id)} />
              <Label className="cursor-pointer text-sm">{label}</Label>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Clock} title="التوقيتات" description="مواعيد التقارير والتذكيرات الدورية">
        <ToggleRow
          label="تقرير ولي الأمر الأسبوعي"
          description="إرسال تقرير دوري لأولياء الأمور"
          checked={settings.maqraah_notifications_parent_report_enabled ?? true}
          onChange={(v) => onUpdate({ maqraah_notifications_parent_report_enabled: v })}
        />
        <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted/50 rounded-xl">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">يوم التقرير</Label>
            <Select
              value={settings.maqraah_notifications_parent_report_day || "sunday"}
              onValueChange={(v) => onUpdate({ maqraah_notifications_parent_report_day: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weekDays.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">ساعة الإرسال (0-23)</Label>
            <Input
              type="number"
              min={0}
              max={23}
              value={settings.maqraah_notifications_parent_report_hour ?? 20}
              onChange={(e) => onUpdate({ maqraah_notifications_parent_report_hour: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="space-y-2 max-w-xs">
          <Label className="text-sm">تذكير الجلسة قبلها بـ (ساعات)</Label>
          <Input
            type="number"
            min={0}
            value={settings.maqraah_notifications_session_reminder_hour ?? 5}
            onChange={(e) => onUpdate({ maqraah_notifications_session_reminder_hour: Number(e.target.value) })}
          />
        </div>
      </SectionCard>
    </div>
  )
}
