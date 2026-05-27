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

interface NotificationsEmailSettingsProps {
  settings: AcademySettings
  onUpdate: (updates: Partial<AcademySettings>) => void
  onReset: () => void
  onTestSmtp: (smtp: AcademySettings["smtp_config"]) => Promise<boolean>
}

const emailEvents = [
  { id: "course_approved", label: "قبول/رفض دورة" },
  { id: "new_task", label: "مهمة جديدة" },
  { id: "session_reminder_1h", label: "تذكير جلسة (قبل ساعة)" },
  { id: "session_reminder_10m", label: "تذكير جلسة (قبل 10 دقائق)" },
  { id: "new_badge", label: "شارة جديدة" },
  { id: "level_up", label: "ترقية مستوى" },
  { id: "streak_warning", label: "تحذير Streak" },
  { id: "parent_report", label: "تقرير ولي الأمر الأسبوعي" },
  { id: "werd_reminder", label: "تذكير الورد اليومي" },
]

const weekDays = [
  { value: "sunday", label: "الأحد" },
  { value: "monday", label: "الإثنين" },
  { value: "tuesday", label: "الثلاثاء" },
  { value: "wednesday", label: "الأربعاء" },
  { value: "thursday", label: "الخميس" },
  { value: "friday", label: "الجمعة" },
  { value: "saturday", label: "السبت" },
]

export function NotificationsEmailSettings({
  settings,
  onUpdate,
  onReset,
  onTestSmtp,
}: NotificationsEmailSettingsProps) {
  const [testing, setTesting] = useState(false)
  const [smtpStatus, setSmtpStatus] = useState<"idle" | "success" | "error">("idle")

  const smtp = settings.smtp_config || {}
  const events = settings.academy_notifications_events || []

  const updateSmtp = (updates: Partial<AcademySettings["smtp_config"]>) => {
    onUpdate({ smtp_config: { ...smtp, ...updates } })
  }

  const toggleEvent = (eventId: string) => {
    const newEvents = events.includes(eventId)
      ? events.filter((e) => e !== eventId)
      : [...events, eventId]
    onUpdate({ academy_notifications_events: newEvents })
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
      {/* General Toggles */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">قنوات الإشعارات</CardTitle>
                <CardDescription className="text-xs mt-0.5">تفعيل/تعطيل قنوات التنبيهات</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
              <RotateCcw className="w-4 h-4 ml-1" />
              استعادة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-500" />
              <div className="space-y-0.5">
                <Label className="font-medium">الإشعارات داخل المنصة</Label>
                <p className="text-xs text-muted-foreground">جرس الإشعارات في الواجهة</p>
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
                <Label className="font-medium">البريد الإلكتروني</Label>
                <p className="text-xs text-muted-foreground">إرسال إيميلات للأحداث</p>
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
                <CardTitle className="text-lg">إعدادات SMTP</CardTitle>
                <CardDescription className="text-xs mt-0.5">خادم البريد الإلكتروني</CardDescription>
              </div>
            </div>
            {smtpStatus === "success" && (
              <Badge variant="default" className="bg-success text-success-foreground">
                <CheckCircle className="w-3 h-3 ml-1" />
                متصل
              </Badge>
            )}
            {smtpStatus === "error" && (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 ml-1" />
                خطأ
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
              <Label className="font-medium text-sm">من (الاسم)</Label>
              <Input
                value={smtp.fromName || ""}
                onChange={(e) => updateSmtp({ fromName: e.target.value })}
                placeholder="أكاديمية إتقان"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">من (الإيميل)</Label>
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
            اختبار الاتصال
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
              <CardTitle className="text-lg">أحداث البريد</CardTitle>
              <CardDescription className="text-xs mt-0.5">اختر الأحداث التي ترسل إيميلات</CardDescription>
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
                  checked={events.includes(event.id)}
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
              <CardTitle className="text-lg">التوقيتات</CardTitle>
              <CardDescription className="text-xs mt-0.5">مواعيد التقارير والتذكيرات الدورية</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="p-4 bg-muted/50 rounded-xl space-y-4">
            <Label className="font-medium">تقرير ولي الأمر الأسبوعي</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">اليوم</Label>
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
                <Label className="text-sm text-muted-foreground">الساعة</Label>
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
            <Label className="font-medium">تذكير الورد اليومي</Label>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">الساعة</Label>
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
