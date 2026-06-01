"use client"

import useSWR from "swr"
import { Video, Upload, HardDrive, Download, Droplet, RotateCcw, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AcademySettings } from "../hooks/use-academy-settings"

interface CoursesContentSettingsProps {
  settings: AcademySettings
  onUpdate: (updates: Partial<AcademySettings>) => void
  onReset: () => void
}

const storageProviderMeta = [
  { id: "s3", name: "Amazon S3" },
  { id: "cloudinary", name: "Cloudinary" },
]

const videoQualities = [
  { value: "480p", label: "480p (SD)" },
  { value: "720p", label: "720p (HD)" },
  { value: "1080p", label: "1080p (Full HD)" },
]

const watermarkPositions = [
  { value: "top-left", label: "أعلى يسار" },
  { value: "top-right", label: "أعلى يمين" },
  { value: "bottom-left", label: "أسفل يسار" },
  { value: "bottom-right", label: "أسفل يمين" },
  { value: "center", label: "الوسط" },
]

const defaultFormats = ["mp4", "webm", "mov", "pdf", "docx", "pptx", "mp3", "wav"]

export function CoursesContentSettings({ settings, onUpdate, onReset }: CoursesContentSettingsProps) {
  const allowedFormats = settings.academy_courses_allowed_formats || defaultFormats

  const { data: storageStatus, isLoading: storageLoading } = useSWR<{
    providers: Record<string, boolean>
  }>("/api/academy/admin/settings/storage-status", (url: string) => fetch(url).then((r) => r.json()), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  const storageProviders = storageProviderMeta.map((p) => ({
    ...p,
    connected: storageStatus?.providers?.[p.id] ?? false,
  }))

  const toggleFormat = (format: string) => {
    const newFormats = allowedFormats.includes(format)
      ? allowedFormats.filter((f) => f !== format)
      : [...allowedFormats, format]
    onUpdate({ academy_courses_allowed_formats: newFormats })
  }

  return (
    <div className="space-y-6">
      {/* Approval */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Video className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">مراجعة المحتوى</CardTitle>
                <CardDescription className="text-xs mt-0.5">التحكم في سير عمل نشر الدروس</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
              <RotateCcw className="w-4 h-4 ml-1" />
              استعادة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">موافقة مشرف المحتوى قبل النشر</Label>
              <p className="text-xs text-muted-foreground">
                {settings.academy_courses_approval_required
                  ? "الدرس يذهب لـ «انتظار المراجعة» قبل النشر"
                  : "الأستاذ ينشر مباشرة بدون مراجعة"}
              </p>
            </div>
            <Switch
              checked={settings.academy_courses_approval_required ?? true}
              onCheckedChange={(v) => onUpdate({ academy_courses_approval_required: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* File Limits */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">حدود الملفات</CardTitle>
              <CardDescription className="text-xs mt-0.5">الحجم الأقصى والصيغ المسموحة</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-medium text-sm">الحد الأقصى لحجم الفيديو (MB)</Label>
              <Input
                type="number"
                value={settings.academy_courses_max_video_size || 500}
                onChange={(e) => onUpdate({ academy_courses_max_video_size: parseInt(e.target.value) || 500 })}
                min={1}
                max={5000}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">الحد الأقصى لحجم المرفقات (MB)</Label>
              <Input
                type="number"
                value={settings.academy_courses_max_attachment_size || 50}
                onChange={(e) => onUpdate({ academy_courses_max_attachment_size: parseInt(e.target.value) || 50 })}
                min={1}
                max={500}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="font-medium text-sm">الصيغ المسموح بها</Label>
            <div className="flex flex-wrap gap-2">
              {defaultFormats.map((format) => (
                <Badge
                  key={format}
                  variant={allowedFormats.includes(format) ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => toggleFormat(format)}
                >
                  .{format}
                </Badge>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">اضغط لتفعيل/تعطيل الصيغة</p>
          </div>
        </CardContent>
      </Card>

      {/* Storage Provider */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <HardDrive className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">خدمة التخزين</CardTitle>
              <CardDescription className="text-xs mt-0.5">مزود تخزين الفيديوهات والملفات</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-3">
            {storageProviders.map((provider) => (
              <div
                key={provider.id}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  settings.academy_courses_storage_provider === provider.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => onUpdate({ academy_courses_storage_provider: provider.id })}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      settings.academy_courses_storage_provider === provider.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                  />
                  <span className="font-medium">{provider.name}</span>
                </div>
                {storageLoading ? (
                  <Badge variant="secondary">
                    <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                    جاري الفحص
                  </Badge>
                ) : provider.connected ? (
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
            ))}
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-sm">جودة الفيديو الافتراضية</Label>
            <Select
              value={settings.academy_courses_default_quality || "720p"}
              onValueChange={(v) => onUpdate({ academy_courses_default_quality: v })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {videoQualities.map((q) => (
                  <SelectItem key={q.value} value={q.value}>
                    {q.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Download & Watermark */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">التحميل والحماية</CardTitle>
              <CardDescription className="text-xs mt-0.5">خيارات تحميل الدروس والعلامة المائية</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">السماح بتحميل الدروس</Label>
              <p className="text-xs text-muted-foreground">يمكن للطلاب تنزيل الفيديوهات والمرفقات</p>
            </div>
            <Switch
              checked={settings.academy_courses_download_enabled ?? false}
              onCheckedChange={(v) => onUpdate({ academy_courses_download_enabled: v })}
            />
          </div>

          <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-medium flex items-center gap-2">
                  <Droplet className="w-4 h-4" />
                  العلامة المائية
                </Label>
                <p className="text-xs text-muted-foreground">إضافة نص على الفيديوهات</p>
              </div>
              <Switch
                checked={settings.academy_courses_watermark_enabled ?? false}
                onCheckedChange={(v) => onUpdate({ academy_courses_watermark_enabled: v })}
              />
            </div>

            {settings.academy_courses_watermark_enabled && (
              <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-sm">نص العلامة المائية</Label>
                  <Input
                    value={settings.academy_courses_watermark_text || ""}
                    onChange={(e) => onUpdate({ academy_courses_watermark_text: e.target.value })}
                    placeholder="أكاديمية إتقان"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">الموضع</Label>
                  <Select
                    value={settings.academy_courses_watermark_position || "bottom-right"}
                    onValueChange={(v) => onUpdate({ academy_courses_watermark_position: v })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {watermarkPositions.map((pos) => (
                        <SelectItem key={pos.value} value={pos.value}>
                          {pos.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
