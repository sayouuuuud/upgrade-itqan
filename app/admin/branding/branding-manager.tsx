"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ImageIcon,
  Save,
  Loader2,
  CheckCircle,
  Upload,
  Phone,
  Mail,
  MapPin,
  Share2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SettingsSkeleton } from "@/components/ui/skeletons"

type Branding = { logoUrl: string; dashboardLogoUrl: string; faviconUrl: string }
type Social = { twitter: string; facebook: string; instagram: string; youtube: string; telegram: string; whatsapp: string }
type Contact = { email: string; phone: string; address: string; social: Social }

const LOGO_FIELDS: { key: keyof Branding; labelAr: string; descAr: string }[] = [
  { key: "logoUrl", labelAr: "الشعار الرئيسي", descAr: "يظهر في الموقع الخارجي والرسائل" },
  { key: "dashboardLogoUrl", labelAr: "شعار لوحة التحكم", descAr: "يظهر في لوحات المستخدمين" },
  { key: "faviconUrl", labelAr: "أيقونة المتصفح (Favicon)", descAr: "تظهر في تبويب المتصفح" },
]

export function BrandingManager() {
  const router = useRouter()
  const [branding, setBranding] = useState<Branding>({ logoUrl: "", dashboardLogoUrl: "", faviconUrl: "" })
  const [contact, setContact] = useState<Contact>({
    email: "",
    phone: "",
    address: "",
    social: { twitter: "", facebook: "", instagram: "", youtube: "", telegram: "", whatsapp: "" },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState<keyof Branding | null>(null)
  const fileInputs = {
    logoUrl: useRef<HTMLInputElement>(null),
    dashboardLogoUrl: useRef<HTMLInputElement>(null),
    faviconUrl: useRef<HTMLInputElement>(null),
  }

  useEffect(() => {
    fetch("/api/admin/branding")
      .then((r) => r.json())
      .then((data) => {
        if (data.branding) setBranding((p) => ({ ...p, ...data.branding }))
        if (data.contactInfo)
          setContact((p) => ({ ...p, ...data.contactInfo, social: { ...p.social, ...(data.contactInfo.social ?? {}) } }))
      })
      .finally(() => setLoading(false))
  }, [])

  const handleUpload = async (key: keyof Branding, file: File) => {
    setUploading(key)
    try {
      const fd = new FormData()
      fd.append("image", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (res.ok && data.url) {
        setBranding((p) => ({ ...p, [key]: data.url }))
      }
    } finally {
      setUploading(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branding, contactInfo: contact }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <SettingsSkeleton />

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">الهوية البصرية وبيانات التواصل</h1>
            <p className="text-sm text-muted-foreground text-pretty">
              تحكّم في شعارات المنصة وأيقونة المتصفح ومعلومات التواصل وروابط التواصل الاجتماعي.
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "تم الحفظ" : "حفظ التغييرات"}
        </Button>
      </div>

      {/* Logos */}
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-base font-semibold text-card-foreground mb-4">الشعارات والأيقونات</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {LOGO_FIELDS.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label className="text-sm font-medium">{f.labelAr}</Label>
              <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-border bg-muted/40 overflow-hidden">
                {branding[f.key] ? (
                  // Use a plain img to support arbitrary external/local logo URLs.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={branding[f.key] || "/placeholder.svg"} alt={f.labelAr} className="max-h-full max-w-full object-contain" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <Input
                value={branding[f.key]}
                onChange={(e) => setBranding((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder="/branding/logo.png"
                dir="ltr"
                className="text-sm"
              />
              <input
                ref={fileInputs[f.key]}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(f.key, file)
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-2"
                disabled={uploading === f.key}
                onClick={() => fileInputs[f.key].current?.click()}
              >
                {uploading === f.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                رفع صورة
              </Button>
              <p className="text-xs text-muted-foreground">{f.descAr}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact info */}
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-base font-semibold text-card-foreground mb-4">معلومات التواصل</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Mail className="h-3.5 w-3.5" /> البريد الإلكتروني
            </Label>
            <Input value={contact.email} onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))} dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Phone className="h-3.5 w-3.5" /> رقم الهاتف
            </Label>
            <Input value={contact.phone} onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))} dir="ltr" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="h-3.5 w-3.5" /> العنوان
            </Label>
            <Input value={contact.address} onChange={(e) => setContact((p) => ({ ...p, address: e.target.value }))} />
          </div>
        </div>
      </section>

      {/* Social links */}
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-card-foreground mb-4">
          <Share2 className="h-4 w-4 text-primary" /> روابط التواصل الاجتماعي
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(Object.keys(contact.social) as (keyof Social)[]).map((key) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-sm font-medium capitalize">{key}</Label>
              <Input
                value={contact.social[key]}
                onChange={(e) => setContact((p) => ({ ...p, social: { ...p.social, [key]: e.target.value } }))}
                placeholder={`https://...`}
                dir="ltr"
                className="text-sm"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
