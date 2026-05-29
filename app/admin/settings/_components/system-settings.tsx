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

interface Props {
  settings: MaqraahSettings
  metadata: Record<string, { updatedAt?: string; modifiedBy?: string }>
  onUpdate: (updates: Partial<MaqraahSettings>) => void
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
]

const strategies = [
  { value: "least_booked_today", label: "الأقل حجزاً اليوم" },
  { value: "least_total_bookings", label: "الأقل حجوزاً إجمالاً" },
  { value: "random", label: "عشوائي" },
]

type BrandingField = "logoUrl" | "faviconUrl" | "dashboardLogoUrl"

export function SystemSettings({ settings, metadata, onUpdate, onReset }: Props) {
  const branding = settings.branding || {}
  const contact = settings.contact_info || {}

  const [uploadingField, setUploadingField] = useState<BrandingField | null>(null)

  // Admin profile (self-contained, saved via /api/admin/profile)
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

  const handleImageUpload = async (field: BrandingField, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 4MB")
      return
    }
    setUploadingField(field)
    try {
      const url = await uploadFile(file)
      if (url) {
        updateBranding(field, url)
        toast.success("تم رفع الملف")
      }
    } catch (err: any) {
      toast.error(err.message || "فشل رفع الملف")
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
        toast.success("تم حفظ بيانات الحساب")
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || "فشل حفظ بيانات الحساب")
      }
    } catch {
      toast.error("حدث خطأ أثناء الحفظ")
    } finally {
      setProfileSaving(false)
    }
  }

  const imageFields: { field: BrandingField; label: string; hint: string }[] = [
    { field: "logoUrl", label: "الشعار الرئيسي", hint: "يظهر في الواجهة العامة وصفحات الدخول" },
    { field: "dashboardLogoUrl", label: "شعار لوحة التحكم", hint: "يظهر داخل لوحات التحكم" },
    { field: "faviconUrl", label: "أيقونة الموقع (Favicon)", hint: "أيقونة التبويب في المتصفح" },
  ]

  return (
    <div className="space-y-6">
      {/* Admin Profile */}
      <SectionCard icon={User} title="حساب المشرف" description="بيانات الدخول الخاصة بك">
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
              toast.success("تم تحديث الصورة")
            }}
          />
          <div>
            <p className="text-sm font-semibold text-foreground">الصورة الشخصية</p>
            <p className="text-xs text-muted-foreground mt-0.5">اضغط لتحديث صورتك</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm">الاسم الكامل</Label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="الاسم الكامل"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">البريد الإلكتروني</Label>
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
            <Label className="text-sm">كلمة مرور جديدة</Label>
            <Input
              type="password"
              dir="ltr"
              value={profile.password}
              onChange={(e) => setProfile({ ...profile, password: e.target.value })}
              placeholder="اتركها فارغة للإبقاء على الحالية"
              className="h-11"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleProfileSave} disabled={profileSaving}>
            {profileSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
            حفظ بيانات الحساب
          </Button>
        </div>
      </SectionCard>

      {/* Identity */}
      <SectionCard icon={Globe} title="هوية النظام" description="اسم ووصف المنصة" onReset={onReset}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-medium text-sm">اسم المنصة</Label>
            <Input
              value={settings.maqraah_general_name || ""}
              onChange={(e) => onUpdate({ maqraah_general_name: e.target.value })}
              placeholder="مقرأة إتقان"
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
            <p className="text-[11px] text-muted-foreground">يُستخدم في روابط الدعوات والإيميلات</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-medium text-sm">وصف المنصة</Label>
          <Textarea
            value={settings.maqraah_general_description || ""}
            onChange={(e) => onUpdate({ maqraah_general_description: e.target.value })}
            placeholder="وصف مختصر يظهر في نتائج البحث..."
            className="min-h-[90px] resize-none"
          />
          <p className="text-[11px] text-muted-foreground">للـ SEO meta description</p>
        </div>
        {metadata.maqraah_general_name?.modifiedBy && (
          <p className="text-[11px] text-muted-foreground border-t pt-3 mt-2">
            آخر تعديل بواسطة: {metadata.maqraah_general_name.modifiedBy}
            {metadata.maqraah_general_name.updatedAt && (
              <> • {new Date(metadata.maqraah_general_name.updatedAt).toLocaleString("ar-EG")}</>
            )}
          </p>
        )}
      </SectionCard>

      {/* Branding / Logos */}
      <SectionCard icon={ImageIcon} title="الشعارات والأيقونات" description="شعار المنصة ولوحة التحكم وأيقونة الموقع">
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
                      aria-label={`حذف ${label}`}
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

      {/* Contact */}
      <SectionCard icon={Mail} title="معلومات التواصل" description="بيانات الاتصال الرسمية (تظهر للعامة)">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-medium text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" />
              البريد الرسمي
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
              رقم الهاتف / واتساب
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
              العنوان
            </Label>
            <Input
              value={contact.address || ""}
              onChange={(e) => updateContact("address", e.target.value)}
              placeholder="المدينة، الدولة"
              className="h-11"
            />
          </div>
        </div>
      </SectionCard>

      {/* Localization */}
      <SectionCard icon={Clock} title="التوطين" description="المنطقة الزمنية واللغة">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="font-medium text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              المنطقة الزمنية
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
            <p className="text-[11px] text-muted-foreground">مهم للجلسات والتذكيرات</p>
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm flex items-center gap-2">
              <Languages className="w-4 h-4" />
              اللغة الافتراضية
            </Label>
            <Select
              value={settings.maqraah_general_language || "ar"}
              onValueChange={(v) => onUpdate({ maqraah_general_language: v })}
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
              value={settings.maqraah_general_direction || "rtl"}
              onValueChange={(v) => onUpdate({ maqraah_general_direction: v })}
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
      </SectionCard>

      {/* Reader assignment */}
      <SectionCard icon={Shuffle} title="توزيع المقرئين" description="كيفية إسناد الطلاب للمقرئين عند الحجز">
        <div className="space-y-2 max-w-sm">
          <Label className="font-medium text-sm">استراتيجية التوزيع</Label>
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
          <p className="text-[11px] text-muted-foreground">تُطبَّق على الحجوزات الجديدة</p>
        </div>
      </SectionCard>
    </div>
  )
}
