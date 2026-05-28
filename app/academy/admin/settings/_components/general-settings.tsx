"use client"

import { useState } from "react"
import { Globe, Upload, Mail, Phone, Clock, Languages, ArrowLeftRight, RotateCcw, Loader2, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
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
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append("image", file)
    const res = await fetch("/api/upload", { method: "POST", body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "فشل رفع الملف")
    }
    const data = await res.json()
    return data.url || data.imageUrl || null
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      toast.error("حجم الشعار يجب أن يكون أقل من 4MB")
      return
    }
    setUploadingLogo(true)
    try {
      const url = await uploadFile(file)
      if (url) {
        onUpdate({ academy_general_logo: url })
        toast.success("تم رفع الشعار")
      }
    } catch (err: any) {
      toast.error(err.message || "فشل رفع الشعار")
    } finally {
      setUploadingLogo(false)
      e.target.value = ""
    }
  }

  const handleFaviconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1 * 1024 * 1024) {
      toast.error("حجم الـ Favicon يجب أن يكون أقل من 1MB")
      return
    }
    setUploadingFavicon(true)
    try {
      const url = await uploadFile(file)
      if (url) {
        onUpdate({ academy_general_favicon: url })
        toast.success("تم رفع الـ Favicon")
      }
    } catch (err: any) {
      toast.error(err.message || "فشل رفع الـ Favicon")
    } finally {
      setUploadingFavicon(false)
      e.target.value = ""
    }
  }

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
                  <div className="relative">
                    <img
                      src={settings.academy_general_logo || "/placeholder.svg"}
                      alt="Logo"
                      className="w-16 h-16 object-contain rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdate({ academy_general_logo: "" })}
                      className="absolute -top-2 -left-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                      aria-label="حذف الشعار"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    {uploadingLogo ? (
                      <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="flex-1"
                  disabled={uploadingLogo}
                  onChange={handleLogoChange}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">حد أقصى 4MB. PNG/JPG/SVG/WEBP</p>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">Favicon</Label>
              <div className="flex items-center gap-3">
                {settings.academy_general_favicon ? (
                  <div className="relative">
                    <img
                      src={settings.academy_general_favicon || "/placeholder.svg"}
                      alt="Favicon"
                      className="w-8 h-8 object-contain rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdate({ academy_general_favicon: "" })}
                      className="absolute -top-2 -left-2 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                      aria-label="حذف الـ Favicon"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                    {uploadingFavicon ? (
                      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/png,image/x-icon,image/svg+xml"
                  className="flex-1"
                  disabled={uploadingFavicon}
                  onChange={handleFaviconChange}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">32x32 بكسل، حد أقصى 1MB</p>
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
