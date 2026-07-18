"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Loader2, CheckCircle, Settings2 } from "lucide-react"
import { AvatarUpload } from "@/components/avatar-upload"

export default function SupervisorProfilePage() {
    const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
    const isAr = t.locale === "ar"

    const [profile, setProfile] = useState({ name: "", email: "", password: "", avatar_url: "" })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        async function loadProfile() {
            try {
                const res = await fetch("/api/admin/profile")
                if (res.ok) {
                    const data = await res.json()
                    if (data.user) {
                        setProfile({
                            name: data.user.name,
                            email: data.user.email,
                            password: "",
                            avatar_url: data.user.avatar_url || ""
                        })
                    }
                }
            } catch (err) {
                console.error("Failed to load profile", err)
            } finally {
                setLoading(false)
            }
        }
        loadProfile()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch("/api/admin/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
            })
            if (res.ok) {
                setSaved(true)
                setProfile(p => ({ ...p, password: "" }))
                setTimeout(() => setSaved(false), 3000)
            } else {
                const d = await res.json()
                alert(d.error || t.admin.errorSaving)
            }
        } catch {
            alert(t.auth.errorOccurred)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="bg-card min-h-full -m-6 lg:-m-8 p-6 lg:p-8 min-h-screen relative pb-20" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
            <div className="absolute top-20 right-[10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute top-40 left-[15%] w-72 h-72 bg-accent/5 rounded-full blur-3xl -z-10 animate-pulse delay-700" />

            <div className="max-w-4xl mx-auto px-6 pt-10 space-y-8 relative z-10">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                            <Settings2 className="w-3 h-3" />
                            {t.student.profile}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                            {t.student.profile}
                        </h1>
                        <p className="text-muted-foreground font-medium max-w-md">
                            {t.admin.myAccountDesc}
                        </p>
                    </div>
                </div>

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
                                    // Also update session
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
                                <Label htmlFor="profile-name" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">{t.auth.fullName}</Label>
                                <Input
                                    id="profile-name"
                                    value={profile.name}
                                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                                    placeholder={t.auth.fullName}
                                    className="h-12 border-border bg-muted/30 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all border font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profile-email" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">{t.auth.email}</Label>
                                <Input
                                    id="profile-email"
                                    type="email"
                                    dir="ltr"
                                    value={profile.email}
                                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                                    placeholder={t.auth.email}
                                    className="h-12 border-border bg-muted/30 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all border font-medium"
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="profile-pass" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">{t.admin.newPassword}</Label>
                                <Input
                                    id="profile-pass"
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
                        <div className="pt-4 flex items-center justify-end gap-4 border-t border-border mt-6">
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="h-12 px-8 bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 rounded-2xl font-bold transition-all transform active:scale-95"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : t.profile.saveChanges}
                            </Button>
                            {saved && (
                                <span className="flex items-center gap-2 text-sm text-primary font-bold animate-in fade-in slide-in-from-right-2">
                                    <CheckCircle className="w-5 h-5" /> {t.admin.savedSuccess}
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
