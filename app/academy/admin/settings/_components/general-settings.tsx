"use client"

import { Globe, Upload, Mail, Phone, Clock, Languages, ArrowLeftRight, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AcademySettings } from "../hooks/use-academy-settings"

interface GeneralSettingsProps {
  settings: AcademySettings
  metadata: Record<string, { updatedAt?: string; modifiedBy?: string }>
  onUpdate: (updates: Partial<AcademySettings>) => void
  onReset: () => void
}

const timezones = [
  { value: "Asia/Riyadh", label: "الرياض (GMT+3)" },
  { value: "Asia/Dubai", label: "دبي (GMT+4)" },
  { value: "Africa/Cairo", label: "القاهرة (GMT+2)" },
  { value: "Asia/Amman", label: "عمّان (GMT+3)" },
  { value: "Asia/Beirut", label: "بيروت (GMT+2)" },
  { value: "Asia/Baghdad", label: "بغداد (GMT+3)" },
  { value: "Asia/Kuwait", label: "الكويت (GMT+3)" },
  { value: "Europe/London", label: "لندن (GMT+0)" },
  { value: "America/New_York", label: "نيويورك (GMT-5)" },
]

export function GeneralSettings({ settings, metadata, onUpdate, onReset }: GeneralSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Identity Card */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">الهوية</CardTitle>
                <CardDescription className="text-xs mt-0.5">اسم وشعار الأكاديمية</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
              <RotateCcw className="w-4 h-4 ml-1" />
              استعادة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-medium text-sm">اسم الأكاديمية</Label>
              <Input
                value={settings.academy_general_name || ""}
                onChange={(e) => onUpdate({ academy_general_name: e.target.value })}
                placeholder="أكاديمية إتقان"
                className="h-11"
              />
              <p className="text-[11px] text-muted-foreground">يظهر في العنوان والإيميلات</p>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">رابط الموقع (App URL)</Label>
              <Input
                dir="ltr"
                value={settings.app_url || ""}
                onChange={(e) => onUpdate({ app_url: e.target.value })}
                placeholder="https://your-domain.com"
                className="h-11"
              />
              <p className="text-[11px] text-muted-foreground">يُستخدم في روابط الدعوات</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-medium text-sm">شعار الأكاديمية</Label>
              <div className="flex items-center gap-3">
                {settings.academy_general_logo ? (
                  <img
                    src={settings.academy_general_logo}
                    alt="Logo"
                    className="w-16 h-16 object-contain rounded-lg border"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="flex-1"
                  onChange={(e) => {
                    // Handle file upload - would integrate with Vercel Blob
                    const file = e.target.files?.[0]
                    if (file) {
                      // TODO: Upload to Vercel Blob
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">Favicon</Label>
              <div className="flex items-center gap-3">
                {settings.academy_general_favicon ? (
                  <img
                    src={settings.academy_general_favicon}
                    alt="Favicon"
                    className="w-8 h-8 object-contain rounded border"
                  />
                ) : (
                  <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/png,image/x-icon,image/svg+xml"
                  className="flex-1"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">32x32 بكسل</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-sm">وصف الأكاديمية</Label>
            <Textarea
              value={settings.academy_general_description || ""}
              onChange={(e) => onUpdate({ academy_general_description: e.target.value })}
              placeholder="وصف مختصر للأكاديمية يظهر في نتائج البحث..."
              className="min-h-[100px] resize-none"
            />
            <p className="text-[11px] text-muted-foreground">للـ SEO meta description</p>
          </div>

          {metadata.academy_general_name?.modifiedBy && (
            <p className="text-[11px] text-muted-foreground border-t pt-3 mt-4">
              آخر تعديل بواسطة: {metadata.academy_general_name.modifiedBy}
              {metadata.academy_general_name.updatedAt && (
                <> • {new Date(metadata.academy_general_name.updatedAt).toLocaleString("ar-EG")}</>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Contact Card */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">التواصل</CardTitle>
              <CardDescription className="text-xs mt-0.5">معلومات الاتصال</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-medium text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" />
                البريد الرسمي
              </Label>
              <Input
                type="email"
                dir="ltr"
                value={settings.academy_general_contact_email || ""}
                onChange={(e) => onUpdate({ academy_general_contact_email: e.target.value })}
                placeholder="contact@example.com"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm flex items-center gap-2">
                <Phone className="w-4 h-4" />
                رقم الواتساب
              </Label>
              <Input
                dir="ltr"
                value={settings.academy_general_whatsapp || ""}
                onChange={(e) => onUpdate({ academy_general_whatsapp: e.target.value })}
                placeholder="+966500000000"
                className="h-11"
              />
              <p className="text-[11px] text-muted-foreground">اختياري</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Localization Card */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">التوطين</CardTitle>
              <CardDescription className="text-xs mt-0.5">المنطقة الزمنية واللغة</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="font-medium text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                المنطقة الزمنية
              </Label>
              <Select
                value={settings.academy_general_timezone || "Asia/Riyadh"}
                onValueChange={(v) => onUpdate({ academy_general_timezone: v })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">مهم للجلسات والتذكيرات</p>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm flex items-center gap-2">
                <Languages className="w-4 h-4" />
                اللغة الافتراضية
              </Label>
              <Select
                value={settings.academy_general_language || "ar"}
                onValueChange={(v) => onUpdate({ academy_general_language: v })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4" />
                اتجاه الواجهة
              </Label>
              <Select
                value={settings.academy_general_direction || "rtl"}
                onValueChange={(v) => onUpdate({ academy_general_direction: v })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rtl">من اليمين لليسار (RTL)</SelectItem>
                  <SelectItem value="ltr">من اليسار لليمين (LTR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
