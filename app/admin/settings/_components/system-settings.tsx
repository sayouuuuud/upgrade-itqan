"use client"

import { useEffect, useState } from "react"
import {
  Globe,
  Upload,
  Mail,
  Phone,
  MapPin,
  Clock,
  Languages,
  ArrowLeftRight,
  Shuffle,
  X,
  Loader2,
  User,
  Image as ImageIcon,
  Share2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AvatarUpload } from "@/components/avatar-upload"
import { toast } from "sonner"
import type { MaqraahSettings } from "../hooks/use-maqraah-settings"
import { SectionCard } from "./section-card"
import { useI18n } from "@/lib/i18n/context"

interface Props {
  settings: MaqraahSettings
  metadata: Record<string, { updatedAt?: string; modifiedBy?: string }>
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset: () => void
}

type BrandingField = "logoUrl" | "faviconUrl" | "dashboardLogoUrl"

export function SystemSettings({ settings, metadata, onUpdate, onReset }: Props) {
  const { t } = useI18n()
  const a = t.admin
  const branding = settings.branding || {}
  const contact = settings.contact_info || {}
  const social = settings.social_links || {}

  const timezones = [
    { value: "Asia/Riyadh", label: a.tzRiyadh },
    { value: "Asia/Dubai", label: a.tzDubai },
    { value: "Africa/Cairo", label: a.tzCairo },
    { value: "Asia/Amman", label: a.tzAmman },
    { value: "Asia/Beirut", label: a.tzBeirut },
    { value: "Asia/Baghdad", label: a.tzBaghdad },
    { value: "Asia/Kuwait", label: a.tzKuwait },
    { value: "Europe/London", label: a.tzLondon },
  ]

  const strategies = [
    { value: "least_booked_today", label: a.ssStrategyLeastBookedToday },
    { value: "least_total_bookings", label: a.ssStrategyLeastTotal },
    { value: "random", label: a.ssStrategyRandom },
  ]

  const [uploadingField, setUploadingField] = useState<BrandingField | null>(null)

  const [profile, setProfile] = useState({ name: "", email: "", password: "", avatar_url: "" })
  const [profileSaving, setProfileSaving] = useState(false)

  useEffect(() => {
    let active = true
    fetch("/api/admin/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.user) {
          setProfile((p) => ({
            ...p,
            name: d.user.name || "",
            email: d.user.email || "",
            avatar_url: d.user.avatar_url || "",
          }))
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const updateBranding = (field: BrandingField, value: string) => {
    onUpdate({ branding: { ...branding, [field]: value } })
  }

  const updateContact = (field: "email" | "phone" | "address", value: string) => {
    onUpdate({ contact_info: { ...contact, [field]: value } })
  }

  const updateSocial = (field: "twitter" | "facebook" | "instagram" | "youtube", value: string) => {
    onUpdate({ social_links: { ...social, [field]: value } })
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append("image", file)
    const res = await fetch("/api/upload", { method: "POST", body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || a.ssImageUploadFailed)
    }
    const data = await res.json()
    return data.url || data.imageUrl || null
  }

  const handleImageUpload = async (field: BrandingField, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      toast.error(a.ssImageSizeError)
      return
    }
    setUploadingField(field)
    try {
      const url = await uploadFile(file)
      if (url) {
        updateBranding(field, url)
        toast.success(a.ssImageUploaded)
      }
    } catch (err: any) {
      toast.error(err.message || a.ssImageUploadFailed)
    } finally {
      setUploadingField(null)
      e.target.value = ""
    }
  }

  const handleProfileSave = async () => {
    setProfileSaving(true)
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })
      if (res.ok) {
        setProfile((p) => ({ ...p, password: "" }))
        toast.success(a.ssProfileSaved)
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || a.ssProfileSaveFailed)
      }
    } catch {
      toast.error(a.ssProfileSaveError)
    } finally {
      setProfileSaving(false)
    }
  }

  const imageFields: { field: BrandingField; label: string; hint: string }[] = [
    { field: "logoUrl", label: a.ssLogoMain, hint: a.ssLogoMainHint },
    { field: "dashboardLogoUrl", label: a.ssLogoDashboard, hint: a.ssLogoDashboardHint },
    { field: "faviconUrl", label: a.ssFavicon, hint: a.ssFaviconHint },
  ]

  return (
    <div className="space-y-6">
      <SectionCard icon={User} title={a.ssAdminProfile} description={a.ssAdminProfileDesc}>
        <div className="flex items-center gap-4">
          <AvatarUpload
            currentUrl={profile.avatar_url}
            name={profile.name}
            size="md"
            onUploaded={async (url) => {
              setProfile((p) => ({ ...p, avatar_url: url }))
              await fetch("/api/admin/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatar_url: url }),
              })
              toast.success(a.ssImageUpdated)
            }}
          />
          <div>
            <p className="text-sm font-semibold text-foreground">{a.ssPhotoLabel}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{a.ssPhotoHint}</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm">{a.ssFullName}</Label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder={a.ssFullNamePlaceholder}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{a.ssEmail}</Label>
            <Input
              type="email"
              dir="ltr"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="admin@example.com"
              className="h-11"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-sm">{a.ssNewPassword}</Label>
            <Input
              type="password"
              dir="ltr"
              value={profile.password}
              onChange={(e) => setProfile({ ...profile, password: e.target.value })}
              placeholder={a.ssNewPasswordPlaceholder}
              className="h-11"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleProfileSave} disabled={profileSaving}>
            {profileSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
            {a.ssSaveProfile}
          </Button>
        </div>
      </SectionCard>

      <SectionCard icon={Globe} title={a.ssIdentity} description={a.ssIdentityDesc} onReset={onReset}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.ssPlatformName}</Label>
            <Input
              value={settings.maqraah_general_name || ""}
              onChange={(e) => onUpdate({ maqraah_general_name: e.target.value })}
              placeholder={a.ssPlatformNamePlaceholder}
              className="h-11"
            />
            <p className="text-[11px] text-muted-foreground">{a.ssPlatformNameHint}</p>
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.ssAppUrl}</Label>
            <Input
              dir="ltr"
              value={settings.app_url || ""}
              onChange={(e) => onUpdate({ app_url: e.target.value })}
              placeholder="https://your-domain.com"
              className="h-11"
            />
            <p className="text-[11px] text-muted-foreground">{a.ssAppUrlHint}</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-medium text-sm">{a.ssPlatformDescription}</Label>
          <Textarea
            value={settings.maqraah_general_description || ""}
            onChange={(e) => onUpdate({ maqraah_general_description: e.target.value })}
            placeholder={a.ssPlatformDescPlaceholder}
            className="min-h-[90px] resize-none"
          />
          <p className="text-[11px] text-muted-foreground">{a.ssPlatformDescHint}</p>
        </div>
        {metadata.maqraah_general_name?.modifiedBy && (
          <p className="text-[11px] text-muted-foreground border-t pt-3 mt-2">
            {a.ssLastModifiedBy} {metadata.maqraah_general_name.modifiedBy}
            {metadata.maqraah_general_name.updatedAt && (
              <> • {new Date(metadata.maqraah_general_name.updatedAt).toLocaleString(t.locale === "ar" ? "ar-EG" : "en-US")}</>
            )}
          </p>
        )}
      </SectionCard>

      <SectionCard icon={ImageIcon} title={a.ssBranding} description={a.ssBrandingDesc}>
        <div className="grid gap-5 md:grid-cols-3">
          {imageFields.map(({ field, label, hint }) => (
            <div key={field} className="space-y-2">
              <Label className="font-medium text-sm">{label}</Label>
              <div className="flex items-center gap-3">
                {branding[field] ? (
                  <div className="relative">
                    <img
                      src={branding[field] || "/placeholder.svg"}
                      alt={label}
                      className="w-16 h-16 object-contain rounded-lg border bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => updateBranding(field, "")}
                      className="absolute -top-2 -left-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                      aria-label={a.ssDeleteImage.replace('{label}', label)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                    {uploadingField === field ? (
                      <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
              <Input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon"
                disabled={uploadingField === field}
                onChange={(e) => handleImageUpload(field, e)}
              />
              <p className="text-[11px] text-muted-foreground">{hint}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Mail} title={a.ssContact} description={a.ssContactDesc}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-medium text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {a.ssOfficialEmail}
            </Label>
            <Input
              type="email"
              dir="ltr"
              value={contact.email || ""}
              onChange={(e) => updateContact("email", e.target.value)}
              placeholder="contact@example.com"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {a.ssPhone}
            </Label>
            <Input
              dir="ltr"
              value={contact.phone || ""}
              onChange={(e) => updateContact("phone", e.target.value)}
              placeholder="+966500000000"
              className="h-11"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="font-medium text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {a.ssAddress}
            </Label>
            <Input
              value={contact.address || ""}
              onChange={(e) => updateContact("address", e.target.value)}
              placeholder={a.ssAddressPlaceholder}
              className="h-11"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Share2} title={a.ssSocialLinks} description={a.ssSocialLinksDesc}>
        <div className="grid gap-4 md:grid-cols-2">
          {(["twitter", "facebook", "instagram", "youtube"] as const).map((platform) => (
            <div key={platform} className="space-y-2">
              <Label className="font-medium text-sm capitalize">{platform}</Label>
              <Input
                dir="ltr"
                value={social[platform] || ""}
                onChange={(e) => updateSocial(platform, e.target.value)}
                placeholder={`https://${platform}.com/...`}
                className="h-11"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Clock} title={a.ssLocalization} description={a.ssLocalizationDesc}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="font-medium text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {a.ssTimezone}
            </Label>
            <Select
              value={settings.maqraah_general_timezone || "Asia/Riyadh"}
              onValueChange={(v) => onUpdate({ maqraah_general_timezone: v })}
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
            <p className="text-[11px] text-muted-foreground">{a.ssTimezoneHint}</p>
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm flex items-center gap-2">
              <Languages className="w-4 h-4" />
              {a.ssDefaultLanguage}
            </Label>
            <Select
              value={settings.maqraah_general_language || "ar"}
              onValueChange={(v) => onUpdate({ maqraah_general_language: v })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">{a.ssArabic}</SelectItem>
                <SelectItem value="en">{a.ssEnglish}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              {a.ssInterfaceDirection}
            </Label>
            <Select
              value={settings.maqraah_general_direction || "rtl"}
              onValueChange={(v) => onUpdate({ maqraah_general_direction: v })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rtl">{a.ssRtl}</SelectItem>
                <SelectItem value="ltr">{a.ssLtr}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Shuffle} title={a.ssReaderAssignment} description={a.ssReaderAssignmentDesc}>
        <div className="space-y-2 max-w-sm">
          <Label className="font-medium text-sm">{a.ssAssignmentStrategy}</Label>
          <Select
            value={settings.reader_assignment_strategy || "least_booked_today"}
            onValueChange={(v) => onUpdate({ reader_assignment_strategy: v })}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {strategies.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">{a.ssAssignmentHint}</p>
        </div>
      </SectionCard>
    </div>
  )
}
