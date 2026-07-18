'use client'

import { useState, useEffect } from 'react'
import { Globe, Save, Eye, Search, ChevronRight, Loader2, CheckCircle } from 'lucide-react'
import { SettingsSkeleton } from '@/components/ui/skeletons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n/context'

export default function AdminSeoPage() {
    const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
    const isAr = t.locale === 'ar'

    const [settings, setSettings] = useState({
        seo_site_title: '',
        seo_site_description: '',
        seo_keywords: '',
        seo_og_image: '',
        seo_robots: 'index, follow',
        seo_google_verification: '',
        seo_twitter_site: '',
        seo_canonical_base: '',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        fetch('/api/admin/seo').then(r => r.json()).then(data => {
            if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }))
            setLoading(false)
        })
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            await fetch('/api/admin/seo', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings })
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } finally { setSaving(false) }
    }

    const previewTitle = settings.seo_site_title || t.admin.seoPreviewTitleDefault
    const previewDesc = settings.seo_site_description || ''
    const previewUrl = settings.seo_canonical_base || 'https://itqaan.com'

    if (loading) return <SettingsSkeleton />

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Globe className="w-8 h-8 text-[#1B5E3B]" />
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t.admin.seoSettings}</h1>
                        <p className="text-muted-foreground text-sm">{t.admin.seoSettingsDesc}</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto bg-[#1B5E3B] hover:bg-[#0A3527] text-white gap-2 h-11 px-6 rounded-xl shadow-sm transition-all duration-200 font-bold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? t.admin.savedSuccess : t.admin.saveSettings}
                </Button>
            </div>

            {/* Google Preview */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2 text-foreground font-bold">
                    <Search className="w-4 h-4 text-[#1B5E3B]" />
                    {t.admin.searchEnginePreview}
                </div>
                <div className="p-6">
                    <div className="border border-border rounded-xl p-5 bg-muted/50 max-w-2xl shadow-inner">
                        <p className="text-xs text-emerald-700 dark:text-emerald-500 mb-1 font-mono flex items-center gap-1">
                            {previewUrl} <ChevronRight className="w-3 h-3 opacity-30" />
                        </p>
                        <p className="text-[#1a0dab] dark:text-[#8ab4f8] text-xl font-medium hover:underline cursor-pointer line-clamp-1 mb-1">{previewTitle}</p>
                        <p className="text-[#4d5156] dark:text-[#bdc1c6] text-sm line-clamp-2 leading-relaxed">{previewDesc || t.admin.seoDescPlaceholder}</p>
                    </div>
                </div>
            </div>

            {/* Main SEO Settings */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30 font-bold text-foreground">
                    {t.admin.basicSettings}
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-foreground">{t.admin.siteTitle}</Label>
                        <Input
                            value={settings.seo_site_title}
                            onChange={e => setSettings(p => ({ ...p, seo_site_title: e.target.value }))}
                            placeholder={t.admin.seoSiteTitlePlaceholder}
                            className="max-w-xl border-border bg-muted/30 text-foreground rounded-xl focus:ring-[#1B5E3B]/20"
                        />
                        <div className="flex justify-between max-w-xl px-1">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t.admin.idealChars.replace('{count}', '50-60')}</p>
                            <p className={`text-[10px] font-black ${settings.seo_site_title.length > 60 ? 'text-red-500' : 'text-emerald-500'}`}>{settings.seo_site_title.length} / 60</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-foreground">{t.admin.metaDescription}</Label>
                        <textarea
                            value={settings.seo_site_description}
                            onChange={e => setSettings(p => ({ ...p, seo_site_description: e.target.value }))}
                            rows={4}
                            className="w-full max-w-xl border border-border bg-muted/30 text-foreground rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20 transition-all"
                            placeholder={t.admin.seoSiteDescriptionPlaceholder}
                        />
                        <div className="flex justify-between max-w-xl px-1">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t.admin.idealDescChars}</p>
                            <p className={`text-[10px] font-black ${settings.seo_site_description.length > 160 ? 'text-red-500' : 'text-emerald-500'}`}>{settings.seo_site_description.length} / 160</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-foreground">{t.admin.keywords}</Label>
                            <Input value={settings.seo_keywords} onChange={e => setSettings(p => ({ ...p, seo_keywords: e.target.value }))} placeholder={t.admin.seoKeywordsPlaceholder} className="border-border bg-muted/30 text-foreground rounded-xl focus:ring-[#1B5E3B]/20" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-foreground">{t.admin.ogImageURL}</Label>
                            <Input value={settings.seo_og_image} onChange={e => setSettings(p => ({ ...p, seo_og_image: e.target.value }))} placeholder="https://..." className="border-border bg-muted/30 text-foreground rounded-xl focus:ring-[#1B5E3B]/20" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced & Verification */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30 font-bold text-foreground">
                    {t.admin.verificationSocial}
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-foreground">{t.admin.canonicalURL}</Label>
                            <Input value={settings.seo_canonical_base} onChange={e => setSettings(p => ({ ...p, seo_canonical_base: e.target.value }))} placeholder="https://itqaan.com" className="border-border bg-muted/30 text-foreground rounded-xl focus:ring-[#1B5E3B]/20" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-foreground">Robots</Label>
                            <select
                                value={settings.seo_robots}
                                onChange={e => setSettings(p => ({ ...p, seo_robots: e.target.value }))}
                                className="w-full border border-border bg-muted/30 text-foreground rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[position:left_10px_center] rtl:bg-[position:right_10px_center]"
                            >
                                <option value="index, follow">index, follow (recommended)</option>
                                <option value="noindex, follow">noindex, follow</option>
                                <option value="index, nofollow">index, nofollow</option>
                                <option value="noindex, nofollow">noindex, nofollow</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-foreground">Google Search Console Verification</Label>
                            <Input value={settings.seo_google_verification} onChange={e => setSettings(p => ({ ...p, seo_google_verification: e.target.value }))} placeholder="google-site-verification=..." className="border-border bg-muted/30 text-foreground rounded-xl focus:ring-[#1B5E3B]/20" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-foreground">Twitter / X Account</Label>
                            <Input value={settings.seo_twitter_site} onChange={e => setSettings(p => ({ ...p, seo_twitter_site: e.target.value }))} placeholder="@username" className="border-border bg-muted/30 text-foreground rounded-xl focus:ring-[#1B5E3B]/20" />
                        </div>
                    </div>
                </div>
            </div>

            {/* JSON-LD Schema info */}
            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 p-6">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shadow-sm shrink-0 border border-emerald-200 dark:border-emerald-500/30">
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="font-bold text-emerald-900 dark:text-emerald-300 text-lg">{t.admin.jsonLdReady}</p>
                        <p className="text-emerald-700/80 dark:text-emerald-400/80 text-sm mt-1 leading-relaxed">
                            {t.admin.jsonLdDesc}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
