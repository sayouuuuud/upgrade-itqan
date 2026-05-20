"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, User, Settings2, Loader2, CheckCircle, Mail, Image as ImageIcon, Phone } from "lucide-react"
import { AvatarUpload } from "@/components/avatar-upload"

export default function AdminSettingsPage() {
    const { t } = useI18n()
    const isAr = t.locale === "ar"

    /* ──────────────── Profile ──────────────── */
    const [profile, setProfile] = useState({ name: "", email: "", password: "", avatar_url: "" })
    const [profileSaving, setProfileSaving] = useState(false)
    const [profileSaved, setProfileSaved] = useState(false)

    /* ──────────────── Assignment Strategy ──────────────── */
    const [strategy, setStrategy] = useState("least_booked_today")
    const [strategySaving, setStrategySaving] = useState(false)
    const [strategySaved, setStrategySaved] = useState(false)

    /* ──────────────── Environment Settings ──────────────── */
    const [smtp, setSmtp] = useState({ host: "", port: "", user: "", password: "", secure: true, fromEmail: "", fromName: "" })
    const [smtpSaving, setSmtpSaving] = useState(false)
    const [smtpSaved, setSmtpSaved] = useState(false)

    const [storage, setStorage] = useState({ uploadthingToken: "" })
    const [storageSaving, setStorageSaving] = useState(false)
    const [storageSaved, setStorageSaved] = useState(false)

    /* ──────────────── Contact Information ──────────────── */
    const [contactInfo, setContactInfo] = useState({ email: "", phone: "", address: "" })
    const [contactSaving, setContactSaving] = useState(false)
    const [contactSaved, setContactSaved] = useState(false)

    /* ──────────────── Branding ──────────────── */
    const [branding, setBranding] = useState({ logoUrl: "", faviconUrl: "", dashboardLogoUrl: "" })
    const [brandingSaving, setBrandingSaving] = useState(false)
    const [brandingSaved, setBrandingSaved] = useState(false)

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            try {
                const [profileRes, settingsRes] = await Promise.all([
                    fetch("/api/admin/profile"),
                    fetch("/api/admin/settings"),
                ])
                if (profileRes.ok) {
                    const d = await profileRes.json()
                    if (d.user) setProfile(p => ({ ...p, name: d.user.name, email: d.user.email, avatar_url: d.user.avatar_url || "" }))
                }
                if (settingsRes.ok) {
                    const d = await settingsRes.json()

                    // Parse Strategy
                    const rawStrategy = d.settings?.reader_assignment_strategy
                    if (rawStrategy) {
                        const parsed = typeof rawStrategy === "string" ? rawStrategy.replace(/^"|"$/g, "") : rawStrategy
                        setStrategy(parsed)
                    }

                    // Parse SMTP
                    if (d.settings?.smtp_config) {
                        try {
                            const parsedSmtp = typeof d.settings.smtp_config === 'string' ? JSON.parse(d.settings.smtp_config) : d.settings.smtp_config;
                            setSmtp((prev: any) => ({ ...prev, ...parsedSmtp }));
                        } catch (e) { console.error("Could not parse SMTP settings", e) }
                    }

                    // Parse Storage (UploadThing)
                    if (d.settings?.storage_config) {
                        try {
                            const parsedStorage = typeof d.settings.storage_config === 'string' ? JSON.parse(d.settings.storage_config) : d.settings.storage_config;
                            setStorage((prev: any) => ({ ...prev, ...parsedStorage }));
                        } catch (e) { console.error("Could not parse Storage settings", e) }
                    }

                    // Parse Contact Info
                    if (d.settings?.contact_info) {
                        try {
                            const parsedContact = typeof d.settings.contact_info === 'string' ? JSON.parse(d.settings.contact_info) : d.settings.contact_info;
                            setContactInfo((prev: any) => ({ ...prev, ...parsedContact }));
                        } catch (e) { console.error("Could not parse Contact Info", e) }
                    }

                    // Parse Branding
                    if (d.settings?.branding) {
                        try {
                            const parsedBranding = typeof d.settings.branding === 'string' ? JSON.parse(d.settings.branding) : d.settings.branding;
                            setBranding((prev: any) => ({ ...prev, ...parsedBranding }));
                        } catch (e) { console.error("Could not parse Branding", e) }
                    }
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    const handleProfileSave = async () => {
        setProfileSaving(true)
        try {
            const res = await fetch("/api/admin/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
            })
            if (res.ok) {
                setProfileSaved(true)
                setProfile(p => ({ ...p, password: "" }))
                setTimeout(() => setProfileSaved(false), 3000)
            } else {
                const d = await res.json()
                alert(d.error || t.admin.errorSaving)
            }
        } catch {
            alert(t.auth.errorOccurred)
        } finally {
            setProfileSaving(false)
        }
    }

    const handleStrategySave = async () => {
        setStrategySaving(true)
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings: { reader_assignment_strategy: strategy } }),
            })
            if (res.ok) {
                setStrategySaved(true)
                setTimeout(() => setStrategySaved(false), 3000)
            } else {
                alert(t.admin.errorSaving)
            }
        } catch {
            alert(t.auth.errorOccurred)
        } finally {
            setStrategySaving(false)
        }
    }

    const handleSmtpSave = async () => {
        setSmtpSaving(true)
        try {
            const smtpPayload = {
                ...smtp,
                port: smtp.port ? Number(smtp.port) : "",
                secure: Boolean(smtp.secure),
            }
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings: { smtp_config: smtpPayload } }),
            })
            if (res.ok) {
                setSmtpSaved(true)
                setTimeout(() => setSmtpSaved(false), 3000)
            } else { alert(t.admin.errorSaving) }
        } catch { alert(t.auth.errorOccurred || t.admin.connectionError) }
        finally { setSmtpSaving(false) }
    }

    const handleStorageSave = async () => {
        setStorageSaving(true)
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings: { storage_config: storage } }),
            })
            if (res.ok) {
                setStorageSaved(true)
                setTimeout(() => setStorageSaved(false), 3000)
            } else { alert(t.admin.errorSaving) }
        } catch { alert(t.auth.errorOccurred) }
        finally { setStorageSaving(false) }
    }

    const handleContactSave = async () => {
        setContactSaving(true)
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings: { contact_info: contactInfo } }),
            })
            if (res.ok) {
                setContactSaved(true)
                setTimeout(() => setContactSaved(false), 3000)
            } else { alert(t.admin.errorSaving) }
        } catch { alert(t.auth.errorOccurred) }
        finally { setContactSaving(false) }
    }

    const handleBrandingSave = async () => {
        setBrandingSaving(true)
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings: { branding: branding } }),
            })
            if (res.ok) {
                setBrandingSaved(true)
                setTimeout(() => setBrandingSaved(false), 3000)
            } else { alert(t.admin.errorSaving) }
        } catch { alert(t.auth.errorOccurred) }
        finally { setBrandingSaving(false) }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const strategyOptions = [
        {
            value: "least_booked_today",
            icon: "🔁",
            label: t.admin.strategyFewestSessionsToday,
            desc: t.admin.strategyFewestSessionsTodayDesc,
        },
        {
            value: "least_total_bookings",
            icon: "📊",
            label: t.admin.strategyFewestTotalBookings,
            desc: t.admin.strategyFewestTotalBookingsDesc,
        },
        {
            value: "random",
            icon: "🎲",
            label: t.admin.strategyRandom,
            desc: t.admin.strategyRandomDesc,
        },
    ]

    return (
        <div className="bg-card min-h-full -m-6 lg:-m-8 p-6 lg:p-8 min-h-screen relative pb-20" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-50/50 to-transparent -z-10" />
            <div className="absolute top-20 right-[10%] w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute top-40 left-[15%] w-72 h-72 bg-amber-100/20 rounded-full blur-3xl -z-10 animate-pulse delay-700" />

            <div className="max-w-4xl mx-auto px-6 pt-10 space-y-8 relative z-10">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                            <Settings2 className="w-3 h-3" />
                            {t.admin.settings}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                            {t.admin.settings}
                        </h1>
                        <p className="text-muted-foreground font-medium max-w-md">
                            {t.admin.settingsDesc}
                        </p>
                    </div>
                </div>

            {/* ── Admin Profile ── */}
            <Card className="border-border shadow-2xl shadow-primary/5 bg-card/70 backdrop-blur-xl rounded-3xl overflow-hidden border">
                <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-foreground">
                                {t.admin.myAccount}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground font-medium text-sm">
                                {t.admin.myAccountDesc}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        <AvatarUpload
                            currentUrl={profile.avatar_url}
                            name={profile.name}
                            size="md"
                            onUploaded={async (url) => {
                                setProfile(p => ({ ...p, avatar_url: url }))
                                await fetch("/api/auth/me", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ avatar_url: url }),
                                })
                            }}
                        />
                        <div>
                            <p className="text-sm font-semibold text-foreground">{t.admin.profilePhoto}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{t.admin.clickToUpdatePhoto}</p>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="admin-name" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">{t.auth.fullName}</Label>
                            <Input
                                id="admin-name"
                                value={profile.name}
                                onChange={e => setProfile({ ...profile, name: e.target.value })}
                                placeholder={t.auth.fullName}
                                className="h-12 border-border bg-muted/30 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all border font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="admin-email" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">{t.auth.email}</Label>
                            <Input
                                id="admin-email"
                                type="email"
                                dir="ltr"
                                value={profile.email}
                                onChange={e => setProfile({ ...profile, email: e.target.value })}
                                placeholder={t.auth.email}
                                className="h-12 border-border bg-muted/30 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all border font-medium"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="admin-pass" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">{t.admin.newPassword}</Label>
                            <Input
                                id="admin-pass"
                                type="password"
                                dir="ltr"
                                value={profile.password}
                                onChange={e => setProfile({ ...profile, password: e.target.value })}
                                placeholder={t.admin.passwordLeaveBlank}
                                className="h-12 border-border bg-muted/30 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all border font-medium"
                            />
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4 flex items-center justify-end gap-4 border-t border-slate-100 mt-6">
                        <Button
                            onClick={handleProfileSave}
                            disabled={profileSaving}
                            className="h-12 px-8 bg-gradient-to-r from-[#1B5E3B] to-[#2D8C5B] hover:shadow-lg hover:shadow-emerald-900/20 text-white rounded-2xl font-bold transition-all transform active:scale-95"
                        >
                            {profileSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : t.profile.saveChanges}
                        </Button>
                        {profileSaved && (
                            <span className="flex items-center gap-2 text-sm text-emerald-600 font-bold animate-in fade-in slide-in-from-right-2">
                                <CheckCircle className="w-5 h-5" /> {t.admin.savedSuccess}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── Reader Assignment Strategy ── */}
            <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
                <CardHeader className="bg-muted/30 border-b border-border px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Settings2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-foreground">
                                {t.admin.readerAssignmentStrategy}
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-muted-foreground mt-0.5">
                                {t.admin.readerAssignmentStrategyDesc}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {strategyOptions.map((opt) => {
                            const selected = strategy === opt.value
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStrategy(opt.value)}
                                    className={`relative text-right p-5 rounded-2xl border-2 transition-all duration-200 ${selected
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-border hover:border-primary/20 hover:bg-muted/50"
                                        }`}
                                >
                                    {selected && (
                                        <span className="absolute top-3 left-3 rtl:right-3 rtl:left-auto text-[10px] bg-primary text-primary-foreground font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                            {t.active}
                                        </span>
                                    )}
                                    <div className="text-3xl mb-3">{opt.icon}</div>
                                    <p className={`text-sm font-bold mb-1 transition-colors ${selected ? "text-primary" : "text-foreground"}`}>
                                        {opt.label}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{opt.desc}</p>
                                </button>
                            )
                        })}
                    </div>

                    <div className="flex justify-end border-t border-border pt-5">
                        <Button
                            onClick={handleStrategySave}
                            disabled={strategySaving}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-11 rounded-xl shadow-sm transition-all duration-200"
                        >
                            {strategySaving
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : strategySaved
                                    ? <CheckCircle className="w-4 h-4" />
                                    : <Save className="w-4 h-4" />}
                            <span className="mx-2">
                                {strategySaved
                                    ? t.admin.savedSuccess
                                    : t.admin.saveStrategy}
                            </span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── SMTP Email Settings ── */}
            <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
                <CardHeader className="bg-muted/30 border-b border-border px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-foreground">
                                {t.admin.emailSettings}
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-muted-foreground mt-0.5">
                                {t.admin.emailSettingsDesc}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-muted-foreground uppercase tracking-widest">SMTP Host</Label>
                            <Input
                                dir="ltr"
                                value={smtp.host}
                                onChange={e => setSmtp({ ...smtp, host: e.target.value })}
                                placeholder="smtp.gmail.com"
                                className="h-11 border-border bg-muted/50 text-foreground rounded-xl focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-muted-foreground uppercase tracking-widest">SMTP Port</Label>
                            <Input
                                dir="ltr"
                                type="number"
                                value={smtp.port}
                                onChange={e => setSmtp({ ...smtp, port: e.target.value })}
                                placeholder="465"
                                className="h-11 border-border bg-muted/50 text-foreground rounded-xl focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-muted-foreground uppercase tracking-widest">{t.admin.userEmail}</Label>
                            <Input
                                dir="ltr"
                                type="email"
                                value={smtp.user}
                                onChange={e => setSmtp({ ...smtp, user: e.target.value })}
                                placeholder="example@gmail.com"
                                className="h-11 border-border bg-muted/50 text-foreground rounded-xl focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-muted-foreground uppercase tracking-widest">{t.admin.smtpPasswordLabel}</Label>
                            <Input
                                dir="ltr"
                                type="password"
                                value={smtp.password}
                                onChange={e => setSmtp({ ...smtp, password: e.target.value })}
                                placeholder="********"
                                className="h-11 border-border bg-muted/50 text-foreground rounded-xl focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-muted-foreground uppercase tracking-widest">{t.admin.fromName}</Label>
                            <Input
                                value={smtp.fromName}
                                onChange={e => setSmtp({ ...smtp, fromName: e.target.value })}
                                placeholder="إتقان الفاتحة"
                                className="h-11 border-border bg-muted/50 text-foreground rounded-xl focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-muted-foreground uppercase tracking-widest">{t.admin.fromEmail}</Label>
                            <Input
                                dir="ltr"
                                type="email"
                                value={smtp.fromEmail}
                                onChange={e => setSmtp({ ...smtp, fromEmail: e.target.value })}
                                placeholder="noreply@example.com"
                                className="h-11 border-border bg-muted/50 text-foreground rounded-xl focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
                                <Switch
                                    checked={smtp.secure}
                                    onCheckedChange={(checked) => setSmtp({ ...smtp, secure: checked })}
                                />
                                <div>
                                    <Label className="font-bold text-sm text-foreground">
                                        {isAr ? "اتصال SMTP آمن (SSL/TLS)" : "Secure SMTP connection (SSL/TLS)"}
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {isAr ? "فعّلها عادةً مع المنفذ 465، وأوقفها عادةً مع 587." : "Usually enabled for port 465 and disabled for port 587."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSmtpSave}
                            disabled={smtpSaving}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-11 rounded-xl shadow-sm transition-all duration-200"
                        >
                            {smtpSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : smtpSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            <span className="mx-2">{smtpSaved ? t.admin.savedSuccess : t.admin.saveEmailSettings}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Storage Settings (UploadThing) ── */}
            <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
                <CardHeader className="bg-muted/30 border-b border-border px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <ImageIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-foreground">
                                {t.admin.storageSettings}
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-muted-foreground mt-0.5">
                                {t.admin.storageSettingsDesc}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-muted-foreground uppercase tracking-widest">UploadThing Token</Label>
                            <Input
                                dir="ltr"
                                type="password"
                                value={storage.uploadthingToken}
                                onChange={e => setStorage({ ...storage, uploadthingToken: e.target.value })}
                                placeholder="eyJ..."
                                className="h-11 border-border bg-muted/50 text-foreground rounded-xl focus:ring-primary/20"
                            />
                            <p className="text-[10px] text-muted-foreground px-1">
                                {isAr ? "تحصل على هذا الرمز من لوحة تحكم UploadThing (API Keys -> App Token)" : "Get this from UploadThing Dashboard (API Keys -> App Token)"}
                            </p>
                        </div>
                    </div>
[diff_chunk_separator]
                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleStorageSave}
                            disabled={storageSaving}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-11 rounded-xl shadow-sm transition-all duration-200"
                        >
                            {storageSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : storageSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            <span className="mx-2">{storageSaved ? t.admin.savedSuccess : t.admin.saveStorageSettings}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Contact Settings ── */}
            <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
                <CardHeader className="bg-muted/30 border-b border-border px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Phone className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-foreground">
                                {t.admin.contactSettings}
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-muted-foreground mt-0.5">
                                {t.admin.contactSettingsDesc}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-muted-foreground uppercase tracking-widest">{t.auth.email}</Label>
                            <Input
                                dir="ltr"
                                value={contactInfo.email}
                                onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })}
                                placeholder="info@itqaan.com"
                                className="h-11 border-border bg-muted/50 text-foreground rounded-xl focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-muted-foreground uppercase tracking-widest">{t.admin.phone}</Label>
                            <Input
                                dir="ltr"
                                value={contactInfo.phone}
                                onChange={e => setContactInfo({ ...contactInfo, phone: e.target.value })}
                                placeholder="+966 50 000 0000"
                                className="h-11 border-border bg-muted/50 text-foreground rounded-xl focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label className="font-bold text-xs text-muted-foreground uppercase tracking-widest">{t.admin.address}</Label>
                            <Input
                                value={contactInfo.address}
                                onChange={e => setContactInfo({ ...contactInfo, address: e.target.value })}
                                placeholder="الرياض، المملكة العربية السعودية"
                                className="h-11 border-border bg-muted/50 text-foreground rounded-xl focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleContactSave}
                            disabled={contactSaving}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-11 rounded-xl shadow-sm transition-all duration-200"
                        >
                            {contactSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : contactSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            <span className="mx-2">{contactSaved ? t.admin.savedSuccess : t.admin.saveContactSettings}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Branding Settings ── */}
            <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
                <CardHeader className="bg-muted/30 border-b border-border px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <ImageIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-foreground">
                                {t.admin.brandingTitle}
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-muted-foreground mt-0.5">
                                {t.admin.brandingDesc}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground">{t.admin.logoLabel}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{t.admin.logoDesc || (isAr ? "الشعار الرئيسي للموقع" : "Main Website Logo")}</p>
                            <AvatarUpload
                                currentUrl={branding.logoUrl}
                                name="Logo"
                                size="md"
                                onUploaded={(url) => setBranding(prev => ({ ...prev, logoUrl: url }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground">{isAr ? "شعار لوحة التحكم" : "Dashboard Logo"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{isAr ? "يظهر في شريط السايد بار" : "Appears in the sidebar"}</p>
                            <AvatarUpload
                                currentUrl={branding.dashboardLogoUrl}
                                name="Dashboard Logo"
                                size="md"
                                onUploaded={(url) => setBranding(prev => ({ ...prev, dashboardLogoUrl: url }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground">{t.admin.faviconLabel}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{t.admin.faviconDesc}</p>
                            <AvatarUpload
                                currentUrl={branding.faviconUrl}
                                name="Favicon"
                                size="sm"
                                onUploaded={(url) => setBranding(prev => ({ ...prev, faviconUrl: url }))}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleBrandingSave}
                            disabled={brandingSaving}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-11 rounded-xl shadow-sm transition-all duration-200"
                        >
                            {brandingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : brandingSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            <span className="mx-2">{brandingSaved ? t.admin.savedSuccess : "Save Branding"}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
            </div>
        </div>
    )
}
