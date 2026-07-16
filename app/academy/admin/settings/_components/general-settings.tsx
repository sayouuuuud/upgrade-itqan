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
import { useI18n } from "@/lib/i18n/context"

interface GeneralSettingsProps {
  settings: AcademySettings
  metadata: Record<string, { updatedAt?: string; modifiedBy?: string }>
  onUpdate: (updates: Partial<AcademySettings>) => void
  onReset?: () => void
}

const timezones = [
  { value: "Asia/Riyadh", label: "tzRiyadh" },
  { value: "Asia/Dubai", label: "tzDubai" },
  { value: "Africa/Cairo", label: "tzCairo" },
  { value: "Asia/Amman", label: "tzAmman" },
  { value: "Asia/Beirut", label: "tzBeirut" },
  { value: "Asia/Baghdad", label: "tzBaghdad" },
  { value: "Asia/Kuwait", label: "tzKuwait" },
  { value: "Europe/London", label: "tzLondon" },
  { value: "America/New_York", label: "tzNewYork" },
]

export function GeneralSettings({ settings, metadata, onUpdate, onReset }: GeneralSettingsProps) {
  const { t } = useI18n()
  const academy = (t as any).academy as Record<string, string> | undefined
  const a = t.academyAdmin

  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append("image", file)
    const res = await fetch("/api/upload", { method: "POST", body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || a.settingsUploadFailed)
    }
    const data = await res.json()
    return data.url || data.imageUrl || null
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      toast.error(a.settingsLogoSizeError)
      return
    }
    setUploadingLogo(true)
    try {
      const url = await uploadFile(file)
      if (url) {
        onUpdate({ academy_general_logo: url })
        toast.success(a.settingsLogoUploaded)
      }
    } catch (err: any) {
      toast.error(err.message || a.settingsLogoFailed)
    } finally {
      setUploadingLogo(false)
      e.target.value = ""
    }
  }

  const handleFaviconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1 * 1024 * 1024) {
      toast.error(a.settingsFaviconSizeError)
      return
    }
    setUploadingFavicon(true)
    try {
      const url = await uploadFile(file)
      if (url) {
        onUpdate({ academy_general_favicon: url })
        toast.success(a.settingsFaviconUploaded)
      }
    } catch (err: any) {
      toast.error(err.message || a.settingsFaviconFailed)
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
                <CardTitle className="text-lg">{a.gsIdentity}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{a.gsIdentityDesc}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onReset?.()} className="text-muted-foreground">
              <RotateCcw className="w-4 h-4 ml-1" />
              {a.gsRestore}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-medium text-sm">{a.gsAcademyName}</Label>
              <Input
                value={settings.academy_general_name || ""}
                onChange={(e) => onUpdate({ academy_general_name: e.target.value })}
                placeholder={a.gsAcademyNamePlaceholder}
                className="h-11"
              />
              <p className="text-[11px] text-muted-foreground">{a.gsAcademyNameHint}</p>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">{a.gsAcademyUrl}</Label>
              <Input
                dir="ltr"
                value={settings.app_url || ""}
                onChange={(e) => onUpdate({ app_url: e.target.value })}
                placeholder="https://your-domain.com"
                className="h-11"
              />
              <p className="text-[11px] text-muted-foreground">{a.gsAcademyUrlHint}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-medium text-sm">{a.gsLogo}</Label>
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
                      aria-label={a.gsDeleteLogo}
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
              <p className="text-[11px] text-muted-foreground">{a.gsLogoHint}</p>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">{a.gsFavicon}</Label>
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
                      aria-label={a.gsDeleteFavicon}
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
              <p className="text-[11px] text-muted-foreground">{a.gsFaviconHint}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.gsAcademyDescription}</Label>
            <Textarea
              value={settings.academy_general_description || ""}
              onChange={(e) => onUpdate({ academy_general_description: e.target.value })}
              placeholder={a.gsAcademyDescriptionPlaceholder}
              className="min-h-[100px] resize-none"
            />
            <p className="text-[11px] text-muted-foreground">{a.gsDescriptionHint}</p>
          </div>

          {metadata.academy_general_name?.modifiedBy && (
            <p className="text-[11px] text-muted-foreground border-t pt-3 mt-4">
              {a.gsLastModified} {metadata.academy_general_name.modifiedBy}
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
              <CardTitle className="text-lg">{a.gsContact}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.gsContactDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-medium text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {a.gsEmail}
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
                {a.gsWhatsapp}
              </Label>
              <Input
                dir="ltr"
                value={settings.academy_general_whatsapp || ""}
                onChange={(e) => onUpdate({ academy_general_whatsapp: e.target.value })}
                placeholder="+966500000000"
                className="h-11"
              />
              <p className="text-[11px] text-muted-foreground">{a.gsOptional}</p>
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
              <CardTitle className="text-lg">{a.gsLocalization}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.gsLocalizationDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="font-medium text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {a.gsTimezone}
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
                      {a[tz.label as keyof typeof a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">{a.gsTimezoneHint}</p>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm flex items-center gap-2">
                <Languages className="w-4 h-4" />
                {a.gsLanguageLabel}
              </Label>
              <Select
                value={settings.academy_general_language || "ar"}
                onValueChange={(v) => onUpdate({ academy_general_language: v })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">{a.gsArabic}</SelectItem>
                  <SelectItem value="en">{a.gsEnglish}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4" />
                {a.gsDirectionLabel}
              </Label>
              <Select
                value={settings.academy_general_direction || "rtl"}
                onValueChange={(v) => onUpdate({ academy_general_direction: v })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rtl">{a.gsDirectionRtl}</SelectItem>
                  <SelectItem value="ltr">{a.gsDirectionLtr}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
