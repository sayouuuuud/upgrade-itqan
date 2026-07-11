"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Bell, Globe, Loader2, Mail, Save, Shield, Wrench } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

interface SystemSettings {
  system_name?: string
  system_description?: string
  system_timezone?: string
  system_language?: string
  app_url?: string
  system_maintenance?: { enabled?: boolean; message?: string }
  system_security?: { sessionTimeout?: number; maxLoginAttempts?: number; require2fa?: boolean }
  system_privacy?: { analyticsEnabled?: boolean; cookieConsentRequired?: boolean }
  system_notifications?: { inAppEnabled?: boolean; emailEnabled?: boolean }
  smtp_config?: { host?: string; port?: number; user?: string; password?: string; fromEmail?: string; fromName?: string }
}

const defaults: SystemSettings = {
  system_name: "إتقان",
  system_timezone: "Asia/Riyadh",
  system_language: "ar",
  system_maintenance: { enabled: false, message: "الموقع تحت الصيانة، نعود قريباً." },
  system_security: { sessionTimeout: 30, maxLoginAttempts: 5, require2fa: false },
  system_privacy: { analyticsEnabled: true, cookieConsentRequired: true },
  system_notifications: { inAppEnabled: true, emailEnabled: true },
  smtp_config: { port: 587 },
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error("تعذر تحميل الإعدادات")
  return response.json()
}

export default function SystemSettingsPage() {
  const { data, isLoading, mutate } = useSWR("/api/admin/system-settings", fetcher)
  const saved = useMemo(() => Object.entries(data?.settings || {}).reduce((result, [key, entry]: [string, any]) => ({ ...result, [key]: entry?.value ?? entry }), defaults), [data])
  const [changes, setChanges] = useState<Partial<SystemSettings>>({})
  const [saving, setSaving] = useState(false)
  const settings = { ...saved, ...changes }

  const update = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => setChanges((current) => ({ ...current, [key]: value }))
  const updateGroup = <K extends keyof SystemSettings>(key: K, value: Record<string, unknown>) => update(key, { ...((settings[key] as object) || {}), ...value } as SystemSettings[K])

  const save = async () => {
    if (!Object.keys(changes).length) return toast.info("لا توجد تغييرات للحفظ")
    setSaving(true)
    try {
      const response = await fetch("/api/admin/system-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: changes }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setChanges({})
      await mutate()
      toast.success("تم حفظ إعدادات النظام")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل حفظ الإعدادات")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="size-7 animate-spin text-primary" /><span className="sr-only">جاري تحميل الإعدادات</span></div>

  return (
    <main className="flex flex-col gap-6" dir="rtl">
      <header className="flex flex-col gap-4 rounded-xl border bg-card p-6 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-balance text-2xl font-bold text-foreground">إعدادات النظام</h1><p className="mt-1 text-sm leading-6 text-muted-foreground">إعدادات الموقع العامة التي يديرها السوبر فايزر فقط.</p></div>
        <Button onClick={save} disabled={saving || !Object.keys(changes).length}>{saving ? <Loader2 className="ml-2 size-4 animate-spin" /> : <Save className="ml-2 size-4" />}حفظ التغييرات</Button>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsCard icon={Globe} title="هوية الموقع والنظام" description="اسم الموقع ووصفه ورابطه وإعدادات اللغة والتوقيت.">
          <Field label="اسم الموقع"><Input value={settings.system_name || ""} onChange={(event) => update("system_name", event.target.value)} /></Field>
          <Field label="وصف الموقع"><Textarea value={settings.system_description || ""} onChange={(event) => update("system_description", event.target.value)} /></Field>
          <div className="grid gap-4 md:grid-cols-2"><Field label="رابط الموقع"><Input dir="ltr" value={settings.app_url || ""} onChange={(event) => update("app_url", event.target.value)} /></Field><Field label="المنطقة الزمنية"><Input dir="ltr" value={settings.system_timezone || ""} onChange={(event) => update("system_timezone", event.target.value)} /></Field></div>
        </SettingsCard>

        <SettingsCard icon={Wrench} title="الصيانة" description="تشغيل وضع الصيانة ورسالة الزوار على مستوى الموقع كله.">
          <Toggle label="تفعيل وضع الصيانة" checked={settings.system_maintenance?.enabled ?? false} onCheckedChange={(enabled) => updateGroup("system_maintenance", { enabled })} />
          <Field label="رسالة الصيانة"><Textarea value={settings.system_maintenance?.message || ""} onChange={(event) => updateGroup("system_maintenance", { message: event.target.value })} /></Field>
        </SettingsCard>

        <SettingsCard icon={Shield} title="الأمان والخصوصية" description="سياسات الدخول والخصوصية العامة لجميع المنصات.">
          <div className="grid gap-4 md:grid-cols-2"><Field label="مهلة الجلسة (دقيقة)"><Input type="number" value={settings.system_security?.sessionTimeout || 30} onChange={(event) => updateGroup("system_security", { sessionTimeout: Number(event.target.value) })} /></Field><Field label="محاولات الدخول القصوى"><Input type="number" value={settings.system_security?.maxLoginAttempts || 5} onChange={(event) => updateGroup("system_security", { maxLoginAttempts: Number(event.target.value) })} /></Field></div>
          <Toggle label="فرض التحقق بخطوتين للإدارة" checked={settings.system_security?.require2fa ?? false} onCheckedChange={(require2fa) => updateGroup("system_security", { require2fa })} />
          <Toggle label="طلب موافقة ملفات الارتباط" checked={settings.system_privacy?.cookieConsentRequired ?? true} onCheckedChange={(cookieConsentRequired) => updateGroup("system_privacy", { cookieConsentRequired })} />
        </SettingsCard>

        <SettingsCard icon={Bell} title="الإشعارات العامة" description="قنوات الإشعار العامة للموقع دون إعدادات أكاديمية أو مقرأة تخصصية.">
          <Toggle label="إشعارات داخل الموقع" checked={settings.system_notifications?.inAppEnabled ?? true} onCheckedChange={(inAppEnabled) => updateGroup("system_notifications", { inAppEnabled })} />
          <Toggle label="الإشعارات عبر البريد" checked={settings.system_notifications?.emailEnabled ?? true} onCheckedChange={(emailEnabled) => updateGroup("system_notifications", { emailEnabled })} />
        </SettingsCard>

        <SettingsCard icon={Mail} title="إعدادات البريد" description="خادم SMTP الموحد المستخدم في رسائل الموقع." className="xl:col-span-2">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><Field label="الخادم"><Input dir="ltr" value={settings.smtp_config?.host || ""} onChange={(event) => updateGroup("smtp_config", { host: event.target.value })} /></Field><Field label="المنفذ"><Input dir="ltr" type="number" value={settings.smtp_config?.port || 587} onChange={(event) => updateGroup("smtp_config", { port: Number(event.target.value) })} /></Field><Field label="اسم المستخدم"><Input dir="ltr" value={settings.smtp_config?.user || ""} onChange={(event) => updateGroup("smtp_config", { user: event.target.value })} /></Field><Field label="كلمة المرور"><Input dir="ltr" type="password" value={settings.smtp_config?.password || ""} onChange={(event) => updateGroup("smtp_config", { password: event.target.value })} /></Field><Field label="بريد المرسل"><Input dir="ltr" type="email" value={settings.smtp_config?.fromEmail || ""} onChange={(event) => updateGroup("smtp_config", { fromEmail: event.target.value })} /></Field><Field label="اسم المرسل"><Input value={settings.smtp_config?.fromName || ""} onChange={(event) => updateGroup("smtp_config", { fromName: event.target.value })} /></Field></div>
        </SettingsCard>
      </div>
    </main>
  )
}

function SettingsCard({ icon: Icon, title, description, children, className = "" }: { icon: typeof Globe; title: string; description: string; children: React.ReactNode; className?: string }) { return <Card className={className}><CardHeader><div className="flex items-start gap-3"><div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="size-5" /></div><div><CardTitle className="text-lg">{title}</CardTitle><CardDescription className="mt-1 leading-6">{description}</CardDescription></div></div></CardHeader><CardContent className="flex flex-col gap-4">{children}</CardContent></Card> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="flex flex-col gap-2"><Label>{label}</Label>{children}</div> }
function Toggle({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) { return <div className="flex items-center justify-between rounded-lg border p-4"><Label className="cursor-pointer leading-6">{label}</Label><Switch checked={checked} onCheckedChange={onCheckedChange} /></div> }
