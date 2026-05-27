"use client"

import { Video, Clock, Bell, Users, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AcademySettings } from "../hooks/use-academy-settings"

interface LiveSessionsSettingsProps {
  settings: AcademySettings
  onUpdate: (updates: Partial<AcademySettings>) => void
  onReset: () => void
}

const videoProviders = [
  { id: "livekit", name: "LiveKit", description: "مدمج مع المنصة" },
  { id: "zoom", name: "Zoom", description: "روابط خارجية" },
  { id: "google_meet", name: "Google Meet", description: "روابط خارجية" },
]

export function LiveSessionsSettings({ settings, onUpdate, onReset }: LiveSessionsSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Video Provider */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Video className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">مزود الفيديو</CardTitle>
                <CardDescription className="text-xs mt-0.5">خدمة الجلسات الحية</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
              <RotateCcw className="w-4 h-4 ml-1" />
              استعادة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-3">
            {videoProviders.map((provider) => (
              <div
                key={provider.id}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  settings.academy_sessions_provider === provider.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => onUpdate({ academy_sessions_provider: provider.id })}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      settings.academy_sessions_provider === provider.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                  />
                  <div>
                    <span className="font-medium">{provider.name}</span>
                    <p className="text-xs text-muted-foreground">{provider.description}</p>
                  </div>
                </div>
                {provider.id === "livekit" && (
                  <Badge variant="secondary">مُوصى به</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Duration & Reminders */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">المدة والتذكيرات</CardTitle>
              <CardDescription className="text-xs mt-0.5">إعدادات وقت الجلسة والتنبيهات</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="font-medium text-sm">المدة الافتراضية (دقيقة)</Label>
              <Input
                type="number"
                value={settings.academy_sessions_default_duration || 60}
                onChange={(e) => onUpdate({ academy_sessions_default_duration: parseInt(e.target.value) || 60 })}
                min={15}
                max={180}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">التذكير الأول (دقيقة قبل)</Label>
              <Input
                type="number"
                value={settings.academy_sessions_reminder_first || 60}
                onChange={(e) => onUpdate({ academy_sessions_reminder_first: parseInt(e.target.value) || 60 })}
                min={5}
                max={1440}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">التذكير الثاني (دقيقة قبل)</Label>
              <Input
                type="number"
                value={settings.academy_sessions_reminder_second || 10}
                onChange={(e) => onUpdate({ academy_sessions_reminder_second: parseInt(e.target.value) || 10 })}
                min={1}
                max={60}
                className="h-11"
              />
            </div>
          </div>

          {/* Visual Timeline */}
          <div className="p-4 bg-muted/30 rounded-xl">
            <Label className="text-sm text-muted-foreground mb-3 block">مخطط التذكيرات</Label>
            <div className="relative h-2 bg-muted rounded-full">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full" />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-warning rounded-full"
                style={{ left: "30%" }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-warning rounded-full"
                style={{ left: "80%" }}
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-success rounded-full" />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>الآن</span>
              <span>تذكير 1 (قبل {settings.academy_sessions_reminder_first || 60} د)</span>
              <span>تذكير 2 (قبل {settings.academy_sessions_reminder_second || 10} د)</span>
              <span>بداية الجلسة</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Controls */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">التحكم في الجلسات</CardTitle>
              <CardDescription className="text-xs mt-0.5">خيارات التسجيل والدخول</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">التسجيل التلقائي للجلسات</Label>
              <p className="text-xs text-muted-foreground">حفظ تسجيل الجلسة تلقائياً</p>
            </div>
            <Switch
              checked={settings.academy_sessions_auto_record ?? false}
              onCheckedChange={(v) => onUpdate({ academy_sessions_auto_record: v })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">دخول الطلاب بدون موافقة</Label>
              <p className="text-xs text-muted-foreground">
                {settings.academy_sessions_auto_admit
                  ? "الطالب يدخل مباشرة"
                  : "الأستاذ يوافق على كل طالب"}
              </p>
            </div>
            <Switch
              checked={settings.academy_sessions_auto_admit ?? true}
              onCheckedChange={(v) => onUpdate({ academy_sessions_auto_admit: v })}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-sm">مدة صلاحية الرابط بعد الانتهاء (ساعات)</Label>
            <Input
              type="number"
              value={settings.academy_sessions_link_expiry || 0}
              onChange={(e) => onUpdate({ academy_sessions_link_expiry: parseInt(e.target.value) || 0 })}
              min={0}
              max={168}
              className="h-11 max-w-xs"
            />
            <p className="text-[11px] text-muted-foreground">0 = ينتهي فور انتهاء الجلسة</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
