'use client'

import { useState, useEffect } from 'react'
import { Home, Save, AlertTriangle, Eye, EyeOff, Megaphone, Loader2, CheckCircle, Layout, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useI18n } from '@/lib/i18n/context'

export default function AdminHomepagePage() {
    const { t } = useI18n()
    const isAr = t.locale === 'ar'

    const [settings, setSettings] = useState<Record<string, any>>({
        homepage_hero_title: 'إتقانُ التِلاوة',
        homepage_hero_subtitle: 'ورحلةُ التَعَلُّم',
        homepage_hero_description: 'مِنبرٌ علميٌّ يجمع بين أكاديميَّةٍ راسخةٍ للدُّروسِ والشَّهادات، ومَقْرأةٍ روحانيَّةٍ للحفظِ والتَّسميعِ بإشرافِ المقرِئينَ المُجازين.',
        homepage_cta_primary_text: 'الأكاديميَّة',
        homepage_cta_primary_link: '/academy/student',
        homepage_cta_secondary_text: 'المَقْرأة',
        homepage_cta_secondary_link: '/student',
        homepage_primary_color: '#0F2A44',
        homepage_accent_color: '#B08D57',
        homepage_show_stats: true,
        homepage_show_features: true,
        homepage_show_testimonials: true,
        maintenance_mode: false,
        maintenance_message: 'الموقع تحت الصيانة حاليًا، نعود قريبًا 🔧',
        maintenance_banner_color: '#f59e0b',
        maintenance_full_page: false,
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        fetch('/api/admin/homepage').then(r => r.json()).then(data => {
            if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }))
            setLoading(false)
        })
    }, [])

    const set = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }))

    const handleSave = async () => {
        setSaving(true)
        try {
            await fetch('/api/admin/homepage', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings })
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } finally { setSaving(false) }
    }

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-[#1B5E3B]" /></div>

    const isMaintenance = settings.maintenance_mode === true || settings.maintenance_mode === 'true'

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Home className="w-8 h-8 text-[#1B5E3B]" />
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t.admin.adminHomepage.title}</h1>
                        <p className="text-muted-foreground text-sm">{t.admin.adminHomepage.description}</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-[#1B5E3B] hover:bg-[#1B5E3B]/90 text-white gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? t.admin.adminHomepage.saved : t.admin.adminHomepage.save}
                </Button>
            </div>

            {/* Maintenance Alert if on */}
            {isMaintenance && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-amber-800 dark:text-amber-300">{t.admin.adminHomepage.maintenanceActiveTitle}</p>
                        <p className="text-amber-700 dark:text-amber-400 text-sm">{t.admin.adminHomepage.maintenanceActiveDesc}</p>
                    </div>
                </div>
            )}

            {/* 🔧 Maintenance Mode */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                    <Megaphone className="w-5 h-5 text-amber-500" />
                    <h2 className="font-semibold text-foreground text-lg">{t.admin.adminHomepage.maintenanceMode}</h2>
                </div>

                <div className="flex items-center justify-between gap-4 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20">
                    <div>
                        <p className="font-medium text-foreground">{t.admin.adminHomepage.enableMaintenance}</p>
                        <p className="text-sm text-muted-foreground">{t.admin.adminHomepage.enableMaintenanceDesc}</p>
                    </div>
                    <Switch
                        checked={!!isMaintenance}
                        onCheckedChange={v => set('maintenance_mode', v)}
                        className="data-[state=checked]:bg-amber-500"
                    />
                </div>

                <div className="space-y-2">
                    <Label>{t.admin.adminHomepage.maintenanceMessage}</Label>
                    <textarea
                        value={settings.maintenance_message}
                        onChange={e => set('maintenance_message', e.target.value)}
                        rows={3}
                        className="w-full border border-border bg-muted/30 text-foreground rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>{t.admin.adminHomepage.bannerColor}</Label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={settings.maintenance_banner_color} onChange={e => set('maintenance_banner_color', e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent" />
                            <Input value={settings.maintenance_banner_color} onChange={e => set('maintenance_banner_color', e.target.value)} className="flex-1 font-mono text-sm bg-muted/30 border-border text-foreground" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                        <div>
                            <p className="font-medium text-foreground text-sm">{t.admin.adminHomepage.fullMaintenancePage}</p>
                            <p className="text-xs text-muted-foreground">{t.admin.adminHomepage.fullMaintenancePageDesc}</p>
                        </div>
                        <Switch checked={!!settings.maintenance_full_page} onCheckedChange={v => set('maintenance_full_page', v)} />
                    </div>
                </div>
            </div>

            {/* 🏠 Hero Section */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                    <Type className="w-5 h-5 text-blue-500" />
                    <h2 className="font-semibold text-foreground text-lg">{t.admin.adminHomepage.heroSection}</h2>
                </div>

                <div className="space-y-2">
                    <Label>{t.admin.adminHomepage.heroTitle}</Label>
                    <Input value={settings.homepage_hero_title} onChange={e => set('homepage_hero_title', e.target.value)} className="bg-muted/30 border-border text-foreground" />
                </div>

                <div className="space-y-2">
                    <Label>{t.admin.adminHomepage.heroSubtitle}</Label>
                    <textarea value={settings.homepage_hero_subtitle} onChange={e => set('homepage_hero_subtitle', e.target.value)} rows={2} className="w-full border border-border bg-muted/30 text-foreground rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/30" />
                </div>

                <div className="space-y-2">
                    <Label>{isAr ? 'وصف البطل (تحت العنوان)' : 'Hero Description'}</Label>
                    <textarea value={settings.homepage_hero_description || ''} onChange={e => set('homepage_hero_description', e.target.value)} rows={4} className="w-full border border-border bg-muted/30 text-foreground rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/30" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>{t.admin.adminHomepage.primaryCtaText}</Label>
                        <Input value={settings.homepage_cta_primary_text} onChange={e => set('homepage_cta_primary_text', e.target.value)} className="bg-muted/30 border-border text-foreground" />
                    </div>
                    <div className="space-y-2">
                        <Label>{t.admin.adminHomepage.primaryCtaLink}</Label>
                        <Input value={settings.homepage_cta_primary_link} onChange={e => set('homepage_cta_primary_link', e.target.value)} className="bg-muted/30 border-border text-foreground" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>{t.admin.adminHomepage.secondaryCtaText}</Label>
                        <Input value={settings.homepage_cta_secondary_text} onChange={e => set('homepage_cta_secondary_text', e.target.value)} className="bg-muted/30 border-border text-foreground" />
                    </div>
                    <div className="space-y-2">
                        <Label>{isAr ? 'رابط الزر الثاني' : 'Secondary CTA Link'}</Label>
                        <Input value={settings.homepage_cta_secondary_link || ''} onChange={e => set('homepage_cta_secondary_link', e.target.value)} className="bg-muted/30 border-border text-foreground" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                    <div className="space-y-2">
                        <Label>{isAr ? 'اللون الأساسي (العنوان)' : 'Primary Color (Title)'}</Label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={settings.homepage_primary_color || '#0F2A44'} onChange={e => set('homepage_primary_color', e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent" />
                            <Input value={settings.homepage_primary_color || '#0F2A44'} onChange={e => set('homepage_primary_color', e.target.value)} className="flex-1 font-mono text-sm bg-muted/30 border-border text-foreground" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>{isAr ? 'لون التمييز (العنوان الثانوي)' : 'Accent Color (Subtitle)'}</Label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={settings.homepage_accent_color || '#B08D57'} onChange={e => set('homepage_accent_color', e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent" />
                            <Input value={settings.homepage_accent_color || '#B08D57'} onChange={e => set('homepage_accent_color', e.target.value)} className="flex-1 font-mono text-sm bg-muted/30 border-border text-foreground" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 🔲 Sections Visibility */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                    <Layout className="w-5 h-5 text-purple-500" />
                    <h2 className="font-semibold text-foreground text-lg">{t.admin.adminHomepage.pageSections}</h2>
                </div>

                {[
                    { key: 'homepage_show_stats', label: t.admin.adminHomepage.statsSection, desc: t.admin.adminHomepage.statsSectionDesc },
                    { key: 'homepage_show_features', label: t.admin.adminHomepage.featuresSection, desc: t.admin.adminHomepage.featuresSectionDesc },
                    { key: 'homepage_show_testimonials', label: t.admin.adminHomepage.testimonialsSection, desc: t.admin.adminHomepage.testimonialsSectionDesc },
                ].map(item => (
                    <div key={item.key} className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
                        <div>
                            <p className="font-medium text-foreground">{item.label}</p>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {(settings[item.key] === true || settings[item.key] === 'true') ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                            <Switch
                                checked={settings[item.key] === true || settings[item.key] === 'true'}
                                onCheckedChange={v => set(item.key, v)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
