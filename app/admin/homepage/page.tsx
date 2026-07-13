'use client'

import { useState, useEffect } from 'react'
import {
  Home, Save, AlertTriangle, Eye, EyeOff, Megaphone, Loader2, CheckCircle,
  Layout, Type, Palette, Sparkles, Route, MessageSquareQuote, PanelBottom, Navigation,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useI18n } from '@/lib/i18n/context'
import {
  DEFAULT_HOMEPAGE_CONTENT, DEFAULT_HOMEPAGE_COLORS, DEFAULT_HOMEPAGE_FLAGS, asBool,
} from '@/lib/homepage-content'
import { SectionCard, BiField, BiArea, PlainField, ColorField, Repeater } from './_components/editors'

type AnyMap = Record<string, any>

const COLOR_FIELDS: { key: string; ar: string; en: string }[] = [
  { key: 'homepage_color_navy', ar: 'الكحلي (الأساسي)', en: 'Navy (primary)' },
  { key: 'homepage_color_green', ar: 'الأخضر', en: 'Green' },
  { key: 'homepage_color_bronze', ar: 'البرونزي', en: 'Bronze' },
  { key: 'homepage_color_gold', ar: 'الذهبي', en: 'Gold' },
  { key: 'homepage_color_parchment', ar: 'الورقي (خلفية فاتحة)', en: 'Parchment (light bg)' },
  { key: 'homepage_color_cream', ar: 'الكريمي', en: 'Cream' },
  { key: 'homepage_color_ink', ar: 'الحبر (النص)', en: 'Ink (text)' },
  { key: 'homepage_color_dark', ar: 'الداكن (خلفية داكنة)', en: 'Dark (dark bg)' },
]

export default function AdminHomepagePage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const tr = (ar: string, en: string) => (isAr ? ar : en)

  const [settings, setSettings] = useState<AnyMap>({
    ...DEFAULT_HOMEPAGE_CONTENT,
    ...DEFAULT_HOMEPAGE_COLORS,
    ...DEFAULT_HOMEPAGE_FLAGS,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/homepage')
      .then(r => r.json())
      .then(data => {
        if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }))
      })
      .finally(() => setLoading(false))
  }, [])

  const set = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }))
  const get = (key: string) => (settings[key] != null ? settings[key] : (DEFAULT_HOMEPAGE_CONTENT as AnyMap)[key])

  const handleReset = async () => {
    setResetting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/homepage/reset', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `${res.status}`)
      // Revert local state to defaults so the form reflects the reset immediately
      setSettings({
        ...DEFAULT_HOMEPAGE_CONTENT,
        ...DEFAULT_HOMEPAGE_COLORS,
        ...DEFAULT_HOMEPAGE_FLAGS,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e?.message || tr('فشل إعادة الضبط', 'Reset failed'))
    } finally {
      setResetting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      let data: any = null
      try {
        data = await res.json()
      } catch {
        // non-JSON response
      }
      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.error ||
            (res.status === 401
              ? tr('انتهت الجلسة، سجّل الدخول مرة أخرى', 'Session expired, please sign in again')
              : `${res.status} ${res.statusText}`),
        )
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e?.message || tr('فشل الحفظ', 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B5E3B]" />
      </div>
    )

  const isMaintenance = asBool(settings.maintenance_mode, false)
  const pillarAcademy = (get('homepage_pillar_academy') || {}) as AnyMap
  const pillarMaqraa = (get('homepage_pillar_maqraa') || {}) as AnyMap

  const tabCls = 'gap-1.5 data-[state=active]:bg-[#1B5E3B] data-[state=active]:text-white'

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      {/* Sticky header — negative margin exactly cancels the <main> p-6 lg:p-8 padding
          so the bar sticks flush to the very top of the scroll viewport */}
      <div className="sticky top-[-1.5rem] lg:top-[-2rem] z-20 -mt-6 lg:-mt-8 -mx-6 lg:-mx-8 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3 px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Home className="w-8 h-8 text-[#1B5E3B]" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">{tr('إدارة الصفحة الرئيسية', 'Homepage Management')}</h1>
              <p className="text-muted-foreground text-sm">{tr('تحكَّم في كل نص ولون وقسم في الصفحة الرئيسية', 'Control every text, color and section of the homepage')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Reset to defaults */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={resetting || saving}
                  className="gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  {resetting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <RotateCcw className="w-4 h-4" />}
                  {tr('إعادة الضبط', 'Reset to defaults')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tr('إعادة الضبط إلى القيم الافتراضية؟', 'Reset to default values?')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {tr(
                      'سيُحذف كل ما حفظته وستعود الصفحة الرئيسية إلى نصوصها وألوانها الأصلية. لا يمكن التراجع.',
                      'All saved changes will be deleted and the homepage will revert to its original texts and colours. This cannot be undone.'
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tr('إلغاء', 'Cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReset}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {tr('نعم، أعد الضبط', 'Yes, reset')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button onClick={handleSave} disabled={saving || resetting} className="bg-[#1B5E3B] hover:bg-[#1B5E3B]/90 text-white gap-2 shrink-0">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? tr('تم الحفظ', 'Saved') : tr('حفظ التغييرات', 'Save changes')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
        {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">{tr('تعذّر حفظ التغييرات', 'Could not save changes')}</p>
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {isMaintenance && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">{tr('وضع الصيانة مُفعَّل', 'Maintenance mode is on')}</p>
            <p className="text-amber-700 dark:text-amber-400 text-sm">{tr('الزوار يرون رسالة الصيانة الآن.', 'Visitors currently see the maintenance message.')}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="brand" dir={isAr ? 'rtl' : 'ltr'} className="w-full">
        <TabsList className="flex flex-wrap h-auto justify-start gap-1 bg-muted/50 p-1">
          <TabsTrigger value="brand" className={tabCls}><Navigation className="w-4 h-4" />{tr('الهوية والقائمة', 'Brand & Nav')}</TabsTrigger>
          <TabsTrigger value="hero" className={tabCls}><Type className="w-4 h-4" />{tr('الواجهة', 'Hero')}</TabsTrigger>
          <TabsTrigger value="pillars" className={tabCls}><Layout className="w-4 h-4" />{tr('المنصَّتان', 'Pillars')}</TabsTrigger>
          <TabsTrigger value="features" className={tabCls}><Sparkles className="w-4 h-4" />{tr('المميزات', 'Features')}</TabsTrigger>
          <TabsTrigger value="journey" className={tabCls}><Route className="w-4 h-4" />{tr('المسار', 'Journey')}</TabsTrigger>
          <TabsTrigger value="voices" className={tabCls}><MessageSquareQuote className="w-4 h-4" />{tr('الآراء', 'Voices')}</TabsTrigger>
          <TabsTrigger value="cta" className={tabCls}><Sparkles className="w-4 h-4" />{tr('الدعوة', 'CTA')}</TabsTrigger>
          <TabsTrigger value="footer" className={tabCls}><PanelBottom className="w-4 h-4" />{tr('التذييل', 'Footer')}</TabsTrigger>
          <TabsTrigger value="colors" className={tabCls}><Palette className="w-4 h-4" />{tr('الألوان', 'Colors')}</TabsTrigger>
          <TabsTrigger value="settings" className={tabCls}><Megaphone className="w-4 h-4" />{tr('الإعدادات', 'Settings')}</TabsTrigger>
        </TabsList>

        {/* ============ BRAND & NAV ============ */}
        <TabsContent value="brand" className="space-y-6 mt-6">
          <SectionCard title={tr('الهوية والشعار', 'Brand & Logo')}>
            <BiField label={tr('اسم العلامة', 'Brand name')} value={get('homepage_brand_name')} onChange={v => set('homepage_brand_name', v)} />
            <BiField label={tr('الوصف أسفل الاسم', 'Tagline')} value={get('homepage_brand_tagline')} onChange={v => set('homepage_brand_tagline', v)} />
            <PlainField label={tr('رابط الشعار (اختياري — اتركه فارغًا للنجمة الافتراضية)', 'Logo URL (optional — empty = default star)')} value={get('homepage_logo_url')} onChange={v => set('homepage_logo_url', v)} placeholder="/logo.png" />
          </SectionCard>

          <SectionCard title={tr('أزرار الدخول', 'Auth buttons')}>
            <div className="grid sm:grid-cols-2 gap-5">
              <BiField label={tr('نص زر الدخول', 'Login text')} value={get('homepage_login_text')} onChange={v => set('homepage_login_text', v)} />
              <BiField label={tr('نص زر التسجيل', 'Register text')} value={get('homepage_register_text')} onChange={v => set('homepage_register_text', v)} />
              <BiField label={tr('نص التسجيل (مختصر للجوال)', 'Register short (mobile)')} value={get('homepage_register_short')} onChange={v => set('homepage_register_short', v)} />
            </div>
          </SectionCard>

          <SectionCard title={tr('قائمة التنقل', 'Navigation menu')}>
            <Repeater
              label={tr('عنصر تنقل', 'Nav item')}
              items={(get('homepage_nav') || []) as AnyMap[]}
              onChange={v => set('homepage_nav', v)}
              newItem={() => ({ href: '#', label: { ar: '', en: '' } })}
              renderItem={(item, update) => (
                <div className="space-y-3">
                  <BiField label={tr('النص', 'Label')} value={item.label} onChange={v => update({ label: v })} />
                  <PlainField label={tr('الرابط', 'Link')} value={item.href} onChange={v => update({ href: v })} placeholder="#section" />
                </div>
              )}
            />
          </SectionCard>
        </TabsContent>

        {/* ============ HERO ============ */}
        <TabsContent value="hero" className="space-y-6 mt-6">
          <SectionCard title={tr('قسم الواجهة (Hero)', 'Hero section')}>
            <BiField label={tr('البسملة', 'Bismillah')} value={get('homepage_hero_bismillah')} onChange={v => set('homepage_hero_bismillah', v)} />
            <BiField label={tr('العنوان الرئيسي', 'Main title')} value={get('homepage_hero_title')} onChange={v => set('homepage_hero_title', v)} />
            <BiField label={tr('العنوان الفرعي', 'Subtitle')} value={get('homepage_hero_subtitle')} onChange={v => set('homepage_hero_subtitle', v)} />
            <BiArea label={tr('الوصف', 'Description')} value={get('homepage_hero_description')} onChange={v => set('homepage_hero_description', v)} rows={4} />
            <BiField label={tr('نص التمرير لأسفل', 'Scroll text')} value={get('homepage_scroll_text')} onChange={v => set('homepage_scroll_text', v)} />
          </SectionCard>

          <SectionCard title={tr('أزرار الواجهة', 'Hero buttons')}>
            <div className="grid sm:grid-cols-2 gap-5">
              <BiField label={tr('نص الزر الأول', 'Primary button text')} value={get('homepage_cta_primary_text')} onChange={v => set('homepage_cta_primary_text', v)} />
              <PlainField label={tr('رابط الزر الأول', 'Primary link')} value={get('homepage_cta_primary_link')} onChange={v => set('homepage_cta_primary_link', v)} />
              <BiField label={tr('نص الزر الثاني', 'Secondary button text')} value={get('homepage_cta_secondary_text')} onChange={v => set('homepage_cta_secondary_text', v)} />
              <PlainField label={tr('رابط الزر الثاني', 'Secondary link')} value={get('homepage_cta_secondary_link')} onChange={v => set('homepage_cta_secondary_link', v)} />
            </div>
          </SectionCard>

          <SectionCard title={tr('الإحصائيات', 'Statistics')}>
            <Repeater
              label={tr('إحصائية', 'Stat')}
              items={(get('homepage_stats') || []) as AnyMap[]}
              onChange={v => set('homepage_stats', v)}
              newItem={() => ({ v: 0, s: '+', label: { ar: '', en: '' } })}
              renderItem={(item, update) => (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <PlainField label={tr('القيمة (رقم)', 'Value (number)')} value={item.v} onChange={v => update({ v: Number(v) || 0 })} type="number" />
                    <PlainField label={tr('اللاحقة (+ % /7 …)', 'Suffix (+ % /7 …)')} value={item.s} onChange={v => update({ s: v })} />
                  </div>
                  <BiField label={tr('التسمية', 'Label')} value={item.label} onChange={v => update({ label: v })} />
                </div>
              )}
            />
          </SectionCard>
        </TabsContent>

        {/* ============ PILLARS ============ */}
        <TabsContent value="pillars" className="space-y-6 mt-6">
          <SectionCard title={tr('ترويسة قسم المنصَّتين', 'Pillars header')}>
            <BiField label={tr('العنوان الصغير', 'Eyebrow')} value={get('homepage_pillars_eyebrow')} onChange={v => set('homepage_pillars_eyebrow', v)} />
            <BiField label={tr('العنوان', 'Title')} value={get('homepage_pillars_title')} onChange={v => set('homepage_pillars_title', v)} />
            <BiField label={tr('العنوان الفرعي', 'Subtitle')} value={get('homepage_pillars_subtitle')} onChange={v => set('homepage_pillars_subtitle', v)} />
          </SectionCard>

          {([
            { key: 'homepage_pillar_academy', data: pillarAcademy, title: tr('المنصَّة الأولى (الأكاديميَّة)', 'Pillar 1 (Academy)') },
            { key: 'homepage_pillar_maqraa', data: pillarMaqraa, title: tr('المنصَّة الثانية (المَقْرأة)', 'Pillar 2 (Maqra’ah)') },
          ]).map(p => {
            const updatePillar = (patch: AnyMap) => set(p.key, { ...p.data, ...patch })
            return (
              <SectionCard key={p.key} title={p.title}>
                <div className="grid sm:grid-cols-2 gap-5">
                  <BiField label={tr('الرقم', 'Number')} value={p.data.number} onChange={v => updatePillar({ number: v })} />
                  <BiField label={tr('الشارة', 'Badge')} value={p.data.badge} onChange={v => updatePillar({ badge: v })} />
                </div>
                <BiField label={tr('العنوان', 'Title')} value={p.data.title} onChange={v => updatePillar({ title: v })} />
                <BiArea label={tr('الوصف', 'Description')} value={p.data.desc} onChange={v => updatePillar({ desc: v })} />
                <div className="grid sm:grid-cols-2 gap-5">
                  <BiField label={tr('نص الزر', 'Button text')} value={p.data.cta} onChange={v => updatePillar({ cta: v })} />
                  <PlainField label={tr('رابط الزر', 'Button link')} value={p.data.link} onChange={v => updatePillar({ link: v })} />
                </div>
                <Repeater
                  label={tr('ميزة', 'Feature')}
                  items={(p.data.features || []) as AnyMap[]}
                  onChange={v => updatePillar({ features: v })}
                  newItem={() => ({ t: { ar: '', en: '' }, d: { ar: '', en: '' } })}
                  renderItem={(item, update) => (
                    <div className="space-y-3">
                      <BiField label={tr('العنوان', 'Title')} value={item.t} onChange={v => update({ t: v })} />
                      <BiField label={tr('الوصف', 'Detail')} value={item.d} onChange={v => update({ d: v })} />
                    </div>
                  )}
                />
              </SectionCard>
            )
          })}
        </TabsContent>

        {/* ============ FEATURES ============ */}
        <TabsContent value="features" className="space-y-6 mt-6">
          <SectionCard title={tr('ترويسة المميزات', 'Features header')}>
            <BiField label={tr('العنوان الصغير', 'Eyebrow')} value={get('homepage_features_eyebrow')} onChange={v => set('homepage_features_eyebrow', v)} />
            <BiField label={tr('العنوان', 'Title')} value={get('homepage_features_title')} onChange={v => set('homepage_features_title', v)} />
            <BiArea label={tr('العنوان الفرعي', 'Subtitle')} value={get('homepage_features_subtitle')} onChange={v => set('homepage_features_subtitle', v)} />
          </SectionCard>

          <SectionCard title={tr('بطاقات المميزات', 'Feature cards')} desc={tr('الأيقونات تُعيَّن تلقائيًا حسب الترتيب.', 'Icons are auto-assigned by order.')}>
            <Repeater
              label={tr('ميزة', 'Feature')}
              items={(get('homepage_features') || []) as AnyMap[]}
              onChange={v => set('homepage_features', v)}
              newItem={() => ({ num: { ar: '', en: '' }, t: { ar: '', en: '' }, d: { ar: '', en: '' } })}
              renderItem={(item, update) => (
                <div className="space-y-3">
                  <BiField label={tr('الرقم', 'Number')} value={item.num} onChange={v => update({ num: v })} />
                  <BiField label={tr('العنوان', 'Title')} value={item.t} onChange={v => update({ t: v })} />
                  <BiArea label={tr('الوصف', 'Description')} value={item.d} onChange={v => update({ d: v })} rows={2} />
                </div>
              )}
            />
          </SectionCard>
        </TabsContent>

        {/* ============ JOURNEY ============ */}
        <TabsContent value="journey" className="space-y-6 mt-6">
          <SectionCard title={tr('ترويسة المسار', 'Journey header')}>
            <BiField label={tr('العنوان الصغير', 'Eyebrow')} value={get('homepage_journey_eyebrow')} onChange={v => set('homepage_journey_eyebrow', v)} />
            <BiField label={tr('العنوان', 'Title')} value={get('homepage_journey_title')} onChange={v => set('homepage_journey_title', v)} />
            <BiField label={tr('العنوان الفرعي', 'Subtitle')} value={get('homepage_journey_subtitle')} onChange={v => set('homepage_journey_subtitle', v)} />
            <BiField label={tr('جملة اللقاء (أسفل القسم)', 'Meeting line (bottom)')} value={get('homepage_journey_meet_text')} onChange={v => set('homepage_journey_meet_text', v)} />
          </SectionCard>

          <SectionCard title={tr('بابُ الأكاديميَّة', 'Academy door')}>
            <BiField label={tr('اسم الباب', 'Door label')} value={get('homepage_journey_academy_label')} onChange={v => set('homepage_journey_academy_label', v)} />
            <BiField label={tr('وصف مختصر', 'Tagline')} value={get('homepage_journey_academy_tagline')} onChange={v => set('homepage_journey_academy_tagline', v)} />
            <Repeater
              label={tr('خطوة', 'Step')}
              items={(get('homepage_journey_academy_steps') || []) as AnyMap[]}
              onChange={v => set('homepage_journey_academy_steps', v)}
              newItem={() => ({ n: { ar: '', en: '' }, t: { ar: '', en: '' }, d: { ar: '', en: '' } })}
              renderItem={(item, update) => (
                <div className="space-y-3">
                  <BiField label={tr('الرقم', 'Number')} value={item.n} onChange={v => update({ n: v })} />
                  <BiField label={tr('العنوان', 'Title')} value={item.t} onChange={v => update({ t: v })} />
                  <BiArea label={tr('الوصف', 'Description')} value={item.d} onChange={v => update({ d: v })} rows={2} />
                </div>
              )}
            />
          </SectionCard>

          <SectionCard title={tr('بابُ المَقْرأة', 'Maqra’ah door')}>
            <BiField label={tr('اسم الباب', 'Door label')} value={get('homepage_journey_maqraa_label')} onChange={v => set('homepage_journey_maqraa_label', v)} />
            <BiField label={tr('وصف مختصر', 'Tagline')} value={get('homepage_journey_maqraa_tagline')} onChange={v => set('homepage_journey_maqraa_tagline', v)} />
            <Repeater
              label={tr('خطوة', 'Step')}
              items={(get('homepage_journey_maqraa_steps') || []) as AnyMap[]}
              onChange={v => set('homepage_journey_maqraa_steps', v)}
              newItem={() => ({ n: { ar: '', en: '' }, t: { ar: '', en: '' }, d: { ar: '', en: '' } })}
              renderItem={(item, update) => (
                <div className="space-y-3">
                  <BiField label={tr('الرقم', 'Number')} value={item.n} onChange={v => update({ n: v })} />
                  <BiField label={tr('العنوان', 'Title')} value={item.t} onChange={v => update({ t: v })} />
                  <BiArea label={tr('الوصف', 'Description')} value={item.d} onChange={v => update({ d: v })} rows={2} />
                </div>
              )}
            />
          </SectionCard>
        </TabsContent>

        {/* ============ VOICES ============ */}
        <TabsContent value="voices" className="space-y-6 mt-6">
          <SectionCard title={tr('ترويسة الآراء', 'Voices header')}>
            <BiField label={tr('العنوان الصغير', 'Eyebrow')} value={get('homepage_testimonials_eyebrow')} onChange={v => set('homepage_testimonials_eyebrow', v)} />
            <BiField label={tr('العنوان', 'Title')} value={get('homepage_testimonials_title')} onChange={v => set('homepage_testimonials_title', v)} />
          </SectionCard>

          {([
            { key: 'homepage_testimonials_top', title: tr('الصف العلوي', 'Top row') },
            { key: 'homepage_testimonials_bottom', title: tr('الصف السفلي', 'Bottom row') },
          ]).map(row => (
            <SectionCard key={row.key} title={row.title}>
              <Repeater
                label={tr('شهادة', 'Testimonial')}
                items={(get(row.key) || []) as AnyMap[]}
                onChange={v => set(row.key, v)}
                newItem={() => ({ q: { ar: '', en: '' }, n: { ar: '', en: '' }, r: { ar: '', en: '' } })}
                renderItem={(item, update) => (
                  <div className="space-y-3">
                    <BiArea label={tr('الاقتباس', 'Quote')} value={item.q} onChange={v => update({ q: v })} rows={2} />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <BiField label={tr('الاسم', 'Name')} value={item.n} onChange={v => update({ n: v })} />
                      <BiField label={tr('الصفة', 'Role')} value={item.r} onChange={v => update({ r: v })} />
                    </div>
                  </div>
                )}
              />
            </SectionCard>
          ))}
        </TabsContent>

        {/* ============ FINAL CTA ============ */}
        <TabsContent value="cta" className="space-y-6 mt-6">
          <SectionCard title={tr('قسم الدعوة الأخير', 'Final CTA section')}>
            <BiField label={tr('العنوان', 'Title')} value={get('homepage_cta_title')} onChange={v => set('homepage_cta_title', v)} />
            <BiArea label={tr('الوصف', 'Description')} value={get('homepage_cta_desc')} onChange={v => set('homepage_cta_desc', v)} />
            <BiField label={tr('الحديث / الاقتباس', 'Hadith / quote')} value={get('homepage_cta_hadith')} onChange={v => set('homepage_cta_hadith', v)} />
            <div className="grid sm:grid-cols-2 gap-5 pt-2 border-t border-border">
              <BiField label={tr('نص الزر الأول', 'Primary button')} value={get('homepage_cta_button_primary')} onChange={v => set('homepage_cta_button_primary', v)} />
              <PlainField label={tr('رابط الزر الأول', 'Primary link')} value={get('homepage_cta_button_primary_link')} onChange={v => set('homepage_cta_button_primary_link', v)} />
              <BiField label={tr('نص الزر الثاني', 'Secondary button')} value={get('homepage_cta_button_secondary')} onChange={v => set('homepage_cta_button_secondary', v)} />
              <PlainField label={tr('رابط الزر الثاني', 'Secondary link')} value={get('homepage_cta_button_secondary_link')} onChange={v => set('homepage_cta_button_secondary_link', v)} />
            </div>
          </SectionCard>
        </TabsContent>

        {/* ============ FOOTER ============ */}
        <TabsContent value="footer" className="space-y-6 mt-6">
          <SectionCard title={tr('وصف التذييل', 'Footer description')}>
            <BiArea label={tr('الوصف', 'Description')} value={get('homepage_footer_desc')} onChange={v => set('homepage_footer_desc', v)} />
          </SectionCard>

          <SectionCard title={tr('أعمدة الروابط', 'Link columns')}>
            <Repeater
              label={tr('عمود', 'Column')}
              items={(get('homepage_footer_columns') || []) as AnyMap[]}
              onChange={v => set('homepage_footer_columns', v)}
              newItem={() => ({ title: { ar: '', en: '' }, links: [] })}
              itemLabel={i => tr(`العمود ${i + 1}`, `Column ${i + 1}`)}
              renderItem={(col, updateCol) => (
                <div className="space-y-3">
                  <BiField label={tr('عنوان العمود', 'Column title')} value={col.title} onChange={v => updateCol({ title: v })} />
                  <Repeater
                    label={tr('رابط', 'Link')}
                    items={(col.links || []) as AnyMap[]}
                    onChange={v => updateCol({ links: v })}
                    newItem={() => ({ label: { ar: '', en: '' }, href: '/' })}
                    renderItem={(link, updateLink) => (
                      <div className="space-y-3">
                        <BiField label={tr('النص', 'Label')} value={link.label} onChange={v => updateLink({ label: v })} />
                        <PlainField label={tr('الرابط', 'Link')} value={link.href} onChange={v => updateLink({ href: v })} />
                      </div>
                    )}
                  />
                </div>
              )}
            />
          </SectionCard>

          <SectionCard title={tr('أسفل التذييل', 'Footer bottom')}>
            <BiField label={tr('حقوق النشر', 'Copyright')} value={get('homepage_footer_copyright')} onChange={v => set('homepage_footer_copyright', v)} />
            <div className="grid sm:grid-cols-2 gap-5">
              <BiField label={tr('نص "صُنِع بِـ" (قبل القلب)', 'Made-with prefix')} value={get('homepage_footer_made_pre')} onChange={v => set('homepage_footer_made_pre', v)} />
              <BiField label={tr('نص ما بعد القلب', 'Made-with suffix')} value={get('homepage_footer_made_post')} onChange={v => set('homepage_footer_made_post', v)} />
            </div>
          </SectionCard>
        </TabsContent>

        {/* ============ COLORS ============ */}
        <TabsContent value="colors" className="space-y-6 mt-6">
          <SectionCard
            title={tr('ألوان الصفحة', 'Page colors')}
            desc={tr('غيِّر اللون الأساسي وتُشتَقُّ منه باقي الدرجات تلقائيًا. القيم الافتراضية مطابقة للشكل الحالي.', 'Change a base color and all its shades are derived automatically. Defaults match the current look.')}
          >
            <div className="grid sm:grid-cols-2 gap-5">
              {COLOR_FIELDS.map(cf => (
                <ColorField
                  key={cf.key}
                  label={tr(cf.ar, cf.en)}
                  value={settings[cf.key]}
                  fallback={DEFAULT_HOMEPAGE_COLORS[cf.key]}
                  onChange={v => set(cf.key, v)}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSettings(prev => ({ ...prev, ...DEFAULT_HOMEPAGE_COLORS }))}
              className="mt-2"
            >
              {tr('إعادة الألوان للافتراضي', 'Reset colors to default')}
            </Button>
          </SectionCard>
        </TabsContent>

        {/* ============ SETTINGS / MAINTENANCE / VISIBILITY ============ */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          <SectionCard title={tr('إظهار الأقسام', 'Section visibility')}>
            {[
              { key: 'homepage_show_stats', ar: 'قسم الإحصائيات', en: 'Statistics section' },
              { key: 'homepage_show_features', ar: 'قسم المميزات', en: 'Features section' },
              { key: 'homepage_show_testimonials', ar: 'قسم الآراء', en: 'Testimonials section' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
                <p className="font-medium text-foreground">{tr(item.ar, item.en)}</p>
                <div className="flex items-center gap-2">
                  {asBool(settings[item.key], true) ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  <Switch checked={asBool(settings[item.key], true)} onCheckedChange={v => set(item.key, v)} />
                </div>
              </div>
            ))}
          </SectionCard>

          <SectionCard title={tr('وضع الصيانة', 'Maintenance mode')}>
            <div className="flex items-center justify-between gap-4 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20">
              <div>
                <p className="font-medium text-foreground">{tr('تفعيل وضع الصيانة', 'Enable maintenance')}</p>
                <p className="text-sm text-muted-foreground">{tr('يُظهر شريط صيانة أعلى الصفحة.', 'Shows a maintenance banner at the top.')}</p>
              </div>
              <Switch checked={isMaintenance} onCheckedChange={v => set('maintenance_mode', v)} className="data-[state=checked]:bg-amber-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">{tr('رسالة الصيانة', 'Maintenance message')}</Label>
              <textarea
                value={settings.maintenance_message || ''}
                onChange={e => set('maintenance_message', e.target.value)}
                rows={3}
                className="w-full border border-border bg-muted/30 text-foreground rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <ColorField label={tr('لون الشريط', 'Banner color')} value={settings.maintenance_banner_color} fallback="#f59e0b" onChange={v => set('maintenance_banner_color', v)} />
              <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-foreground text-sm">{tr('صفحة صيانة كاملة', 'Full maintenance page')}</p>
                  <p className="text-xs text-muted-foreground">{tr('يُخفي ا��صفحة بالكامل ويعرض الرسالة فقط.', 'Hides the whole page and shows only the message.')}</p>
                </div>
                <Switch checked={asBool(settings.maintenance_full_page, false)} onCheckedChange={v => set('maintenance_full_page', v)} />
              </div>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
