'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  GraduationCap,
  Languages,
  Menu,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { docsGroups, docsGuides, getGuide, type DocsGuide, type DocsLocale } from '@/lib/docs/content'

const iconMap = {
  start: BookOpen,
  student: GraduationCap,
  reader: UserRound,
  teacher: BookOpen,
  parent: UsersRound,
  supervisor: ShieldCheck,
  admin: ShieldCheck,
  support: CircleHelp,
}

const ui = {
  ar: {
    home: 'مركز المساعدة', back: 'العودة إلى المنصة', search: 'ابحث في الأدلة...', searchTitle: 'البحث في مركز المساعدة',
    noResults: 'لا توجد نتائج مطابقة. جرّب كلمات أخرى.', start: 'ابدأ من هنا', startDesc: 'دليل واضح لكل خطوة، من إنشاء الحساب إلى استخدام أدوات دورك.',
    guides: 'الأدلة حسب الدور', popular: 'كل ما تحتاجه لاستخدام مُتْقِن', audience: 'هذا الدليل مخصص لـ', contents: 'في هذا الدليل',
    requirements: 'اتبع الخطوات التالية', note: 'ملاحظة مهمة', reviewed: 'تمت مراجعة الدليل', prev: 'السابق', next: 'التالي', menu: 'قائمة الأدلة',
  },
  en: {
    home: 'Help Center', back: 'Back to platform', search: 'Search the guides...', searchTitle: 'Search the help center',
    noResults: 'No matching results. Try different words.', start: 'Start here', startDesc: 'Clear guidance for every step, from account setup to the tools for your role.',
    guides: 'Guides by role', popular: 'Everything you need to use Motqin', audience: 'This guide is for', contents: 'In this guide',
    requirements: 'Follow these steps', note: 'Important note', reviewed: 'Guide reviewed', prev: 'Previous', next: 'Next', menu: 'Guide menu',
  },
}

function normalize(value: string) {
  return value.toLocaleLowerCase().normalize('NFKD').replace(/[ًٌٍَُِّْـ]/g, '')
}

function LanguageButton({ locale, onChange }: { locale: DocsLocale; onChange: (locale: DocsLocale) => void }) {
  const nextLocale = locale === 'ar' ? 'en' : 'ar'
  return (
    <Button variant="outline" size="sm" onClick={() => onChange(nextLocale)} aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}>
      <Languages data-icon="inline-start" />
      {locale === 'ar' ? 'English' : 'العربية'}
    </Button>
  )
}

function SearchBox({ locale, compact = false }: { locale: DocsLocale; compact?: boolean }) {
  const t = ui[locale]
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return []
    return docsGuides.filter((guide) => normalize([
      guide.title[locale], guide.description[locale], guide.audience[locale], ...guide.keywords[locale],
      ...guide.sections.flatMap((section) => [section.title[locale], section.intro?.[locale] ?? '', ...section.steps[locale]]),
    ].join(' ')).includes(q)).slice(0, 8)
  }, [locale, query])

  return (
    <div className="relative w-full">
      <Search className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground', locale === 'ar' ? 'right-4' : 'left-4', compact ? 'size-4' : 'size-5')} aria-hidden="true" />
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} aria-label={t.searchTitle} className={cn('bg-card shadow-sm', locale === 'ar' ? 'pr-11 pl-10' : 'pl-11 pr-10', compact ? 'h-10' : 'h-14 rounded-xl text-base')} />
      {query && <button type="button" onClick={() => setQuery('')} className={cn('absolute top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground', locale === 'ar' ? 'left-3' : 'right-3')} aria-label={locale === 'ar' ? 'مسح البحث' : 'Clear search'}><X className="size-4" /></button>}
      {query && (
        <div className="absolute inset-x-0 top-full mt-2 max-h-96 overflow-y-auto rounded-xl border bg-popover p-2 text-popover-foreground shadow-xl">
          {results.length ? results.map((guide) => {
            const Icon = iconMap[guide.icon]
            return <Link key={guide.slug} href={`/docs/${guide.slug}?lang=${locale}`} className="flex items-start gap-3 rounded-lg p-3 hover:bg-muted"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"><Icon className="size-4" /></span><span className="flex min-w-0 flex-col gap-1"><strong className="text-sm">{guide.title[locale]}</strong><span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{guide.description[locale]}</span></span></Link>
          }) : <p className="p-5 text-center text-sm text-muted-foreground">{t.noResults}</p>}
        </div>
      )}
    </div>
  )
}

function Header({ locale, onLocaleChange, onMenu }: { locale: DocsLocale; onLocaleChange: (locale: DocsLocale) => void; onMenu?: () => void }) {
  const t = ui[locale]
  return <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-6"><Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label={t.menu}><Menu /></Button><Link href={`/docs?lang=${locale}`} className="flex items-center gap-3 font-heading text-lg font-bold"><span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><BookOpen className="size-5" /></span><span>{t.home}</span></Link><div className="ms-auto hidden w-full max-w-sm md:block"><SearchBox locale={locale} compact /></div><LanguageButton locale={locale} onChange={onLocaleChange} /><Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href="/">{t.back}{locale === 'ar' ? <ArrowLeft data-icon="inline-end" /> : <ArrowRight data-icon="inline-end" />}</Link></Button></div></header>
}

function GuideCard({ guide, locale }: { guide: DocsGuide; locale: DocsLocale }) {
  const Icon = iconMap[guide.icon]
  const Arrow = locale === 'ar' ? ChevronLeft : ChevronRight
  return <Link href={`/docs/${guide.slug}?lang=${locale}`} className="group flex min-h-48 flex-col rounded-xl border bg-card p-5 text-card-foreground shadow-sm transition-transform hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"><span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"><Icon className="size-5" /></span><h3 className="mt-5 text-balance font-heading text-xl font-bold">{guide.title[locale]}</h3><p className="mt-2 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">{guide.description[locale]}</p><span className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">{locale === 'ar' ? 'اقرأ الدليل' : 'Read guide'}<Arrow className="size-4 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" /></span></Link>
}

function Sidebar({ locale, activeSlug, open, onClose }: { locale: DocsLocale; activeSlug: string; open: boolean; onClose: () => void }) {
  return <><button type="button" aria-label={locale === 'ar' ? 'إغلاق القائمة' : 'Close menu'} onClick={onClose} className={cn('fixed inset-0 z-40 bg-foreground/30 lg:hidden', open ? 'block' : 'hidden')} /><aside className={cn('fixed inset-y-0 z-50 w-72 overflow-y-auto border-e bg-background p-5 transition-transform lg:sticky lg:top-16 lg:z-0 lg:block lg:h-[calc(100vh-4rem)] lg:translate-x-0', locale === 'ar' ? 'right-0' : 'left-0', open ? 'translate-x-0' : locale === 'ar' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')}><div className="mb-5 flex items-center justify-between lg:hidden"><strong>{ui[locale].menu}</strong><Button variant="ghost" size="icon" onClick={onClose}><X /><span className="sr-only">{locale === 'ar' ? 'إغلاق' : 'Close'}</span></Button></div><nav aria-label={ui[locale].menu} className="flex flex-col gap-6">{docsGroups.map((group) => <div key={group.id} className="flex flex-col gap-2"><p className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{group.label[locale]}</p>{docsGuides.filter((guide) => guide.group === group.id).map((guide) => <Link key={guide.slug} href={`/docs/${guide.slug}?lang=${locale}`} onClick={onClose} className={cn('rounded-lg px-3 py-2 text-sm leading-relaxed transition-colors hover:bg-muted', activeSlug === guide.slug ? 'bg-secondary font-semibold text-secondary-foreground' : 'text-muted-foreground')}>{guide.title[locale]}</Link>)}</div>)}</nav></aside></>
}

export function DocsExplorer({ slug }: { slug?: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const locale: DocsLocale = searchParams.get('lang') === 'en' ? 'en' : 'ar'
  const t = ui[locale]
  const guide = slug ? getGuide(slug) : undefined

  function changeLocale(next: DocsLocale) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`
    const path = slug ? `/docs/${slug}` : '/docs'
    router.replace(`${path}?lang=${next}`, { scroll: false })
  }

  if (!guide) {
    return <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-background text-foreground"><Header locale={locale} onLocaleChange={changeLocale} /><main><section className="border-b bg-secondary/50"><div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center md:py-24"><span className="rounded-full border bg-card px-4 py-1.5 text-sm font-semibold text-primary">{t.start}</span><div className="flex max-w-3xl flex-col gap-4"><h1 className="text-balance font-heading text-4xl font-black md:text-6xl">{t.popular}</h1><p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">{t.startDesc}</p></div><div className="relative z-20 w-full max-w-2xl"><SearchBox locale={locale} /></div></div></section><section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20"><div className="mb-8 flex flex-col gap-2"><h2 className="font-heading text-3xl font-bold">{t.guides}</h2><p className="text-muted-foreground">{locale === 'ar' ? 'اختر دورك للوصول إلى خطوات العمل التي تحتاجها.' : 'Choose your role to find the exact steps you need.'}</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{docsGuides.map((item) => <GuideCard key={item.slug} guide={item} locale={locale} />)}</div></section></main><footer className="border-t"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6"><p>{locale === 'ar' ? 'مركز مساعدة مُتْقِن — دليل استخدام المنصة.' : 'Motqin Help Center — your platform guide.'}</p><Link href="/contact" className="font-semibold text-primary hover:underline">{locale === 'ar' ? 'تواصل مع الدعم' : 'Contact support'}</Link></div></footer></div>
  }

  const index = docsGuides.findIndex((item) => item.slug === guide.slug)
  const previous = index > 0 ? docsGuides[index - 1] : undefined
  const next = index < docsGuides.length - 1 ? docsGuides[index + 1] : undefined
  return <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-background text-foreground"><Header locale={locale} onLocaleChange={changeLocale} onMenu={() => setMenuOpen(true)} /><div className="mx-auto flex max-w-7xl"><Sidebar locale={locale} activeSlug={guide.slug} open={menuOpen} onClose={() => setMenuOpen(false)} /><main className="min-w-0 flex-1 px-4 py-8 md:px-8 lg:px-12 lg:py-12"><div className="mx-auto max-w-3xl"><nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground"><Link href={`/docs?lang=${locale}`} className="hover:text-foreground">{t.home}</Link><ChevronLeft className={cn('size-4', locale === 'en' && 'rotate-180')} /><span className="truncate text-foreground">{guide.title[locale]}</span></nav><header className="flex flex-col gap-5 border-b pb-8"><span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{docsGroups.find((group) => group.id === guide.group)?.label[locale]}</span><h1 className="text-balance font-heading text-4xl font-black md:text-5xl">{guide.title[locale]}</h1><p className="text-pretty text-lg leading-relaxed text-muted-foreground">{guide.description[locale]}</p><div className="flex flex-wrap gap-3 text-sm"><span className="rounded-lg border bg-card px-3 py-2"><strong>{t.audience}:</strong> {guide.audience[locale]}</span><span className="rounded-lg border bg-card px-3 py-2 text-muted-foreground">{t.reviewed}: {guide.reviewedAt}</span></div></header><aside className="my-8 rounded-xl border bg-card p-5"><h2 className="mb-3 font-heading text-lg font-bold">{t.contents}</h2><ol className="flex flex-col gap-2">{guide.sections.map((section, sectionIndex) => <li key={section.id}><a href={`#${section.id}`} className="flex items-center gap-3 rounded-md py-1 text-sm text-muted-foreground hover:text-primary"><span className="font-mono text-xs text-primary">{String(sectionIndex + 1).padStart(2, '0')}</span>{section.title[locale]}</a></li>)}</ol></aside><article className="flex flex-col gap-12">{guide.sections.map((section, sectionIndex) => <section key={section.id} id={section.id} className="scroll-mt-24"><div className="mb-5 flex items-start gap-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm font-bold text-primary-foreground">{sectionIndex + 1}</span><div className="flex flex-col gap-2"><h2 className="text-balance font-heading text-2xl font-bold md:text-3xl">{section.title[locale]}</h2>{section.intro && <p className="leading-relaxed text-muted-foreground">{section.intro[locale]}</p>}</div></div><h3 className="sr-only">{t.requirements}</h3><ol className="flex flex-col gap-3">{section.steps[locale].map((step, stepIndex) => <li key={step} className="flex gap-3 rounded-xl border bg-card p-4 leading-relaxed"><CheckCircle2 className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" /><span><span className="sr-only">{stepIndex + 1}. </span>{step}</span></li>)}</ol>{section.note && <div className="mt-4 rounded-xl border-s-4 border-s-primary bg-secondary p-4"><strong className="block text-sm text-secondary-foreground">{t.note}</strong><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{section.note[locale]}</p></div>}</section>)}</article><nav aria-label={locale === 'ar' ? 'التنقل بين الأدلة' : 'Guide navigation'} className="mt-14 grid gap-3 border-t pt-8 sm:grid-cols-2">{previous ? <Link href={`/docs/${previous.slug}?lang=${locale}`} className="rounded-xl border bg-card p-4 hover:border-primary/40"><span className="text-xs text-muted-foreground">{t.prev}</span><span className="mt-1 flex items-center gap-2 font-semibold">{locale === 'ar' ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}{previous.title[locale]}</span></Link> : <span />}{next && <Link href={`/docs/${next.slug}?lang=${locale}`} className="rounded-xl border bg-card p-4 text-end hover:border-primary/40"><span className="text-xs text-muted-foreground">{t.next}</span><span className="mt-1 flex items-center justify-end gap-2 font-semibold">{next.title[locale]}{locale === 'ar' ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}</span></Link>}</nav></div></main></div></div>
}
