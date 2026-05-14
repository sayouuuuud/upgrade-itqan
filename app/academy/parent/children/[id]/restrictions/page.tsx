'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loader2, Lock, Unlock, ShieldAlert, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { SURAHS } from '@/lib/quran-surahs'

interface Restriction {
  id: string
  restriction_type: 'surah' | 'memorization_path' | 'tajweed_path'
  target_id: string
  is_blocked: boolean
}

interface PathOption {
  id: string
  title: string
  level: string | null
}

export default function RestrictionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight
  const [restrictions, setRestrictions] = useState<Restriction[]>([])
  const [memPaths, setMemPaths] = useState<PathOption[]>([])
  const [tajPaths, setTajPaths] = useState<PathOption[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/academy/parent/children/${id}/restrictions`)
      const data = await res.json()
      if (res.ok) {
        setRestrictions(data.restrictions || [])
        setMemPaths(data.paths?.memorization || [])
        setTajPaths(data.paths?.tajweed || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const isBlocked = (type: Restriction['restriction_type'], targetId: string | number) =>
    restrictions.some(
      (r) => r.restriction_type === type && r.target_id === targetId.toString() && r.is_blocked
    )

  const toggle = async (
    type: Restriction['restriction_type'],
    targetId: string | number,
    nextBlocked: boolean
  ) => {
    const key = `${type}:${targetId}`
    setSavingKey(key)
    try {
      const res = await fetch(`/api/academy/parent/children/${id}/restrictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restriction_type: type,
          target_id: targetId.toString(),
          is_blocked: nextBlocked,
        }),
      })
      if (res.ok) await load()
    } finally {
      setSavingKey(null)
    }
  }

  const filteredSurahs = SURAHS.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.name_ar.includes(search) ||
      s.name_en.toLowerCase().includes(q) ||
      s.number.toString() === search
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <Link
        href={`/academy/parent/children/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronIcon className="w-4 h-4" />
        {isAr ? 'العودة لصفحة الابن' : 'Back to child'}
      </Link>

      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldAlert className="w-4 h-4" />
          {isAr ? 'تقييد المحتوى' : 'Content Restrictions'}
        </div>
        <h1 className="text-3xl font-black">
          {isAr ? 'تحديد المحتوى المتاح للابن' : 'Configure allowed content'}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          {isAr
            ? 'بشكل افتراضي يستطيع الابن الوصول لكل المحتوى. يمكنك حظر سور أو مسارات معينة وستمنع المنصة الابن من تقديم تلاوة أو التسجيل في تلك المسارات.'
            : 'By default, your child can access all content. You can block specific surahs or paths, and the platform will prevent recitation submissions or enrollment in blocked items.'}
        </p>
      </div>

      <Tabs defaultValue="surahs">
        <TabsList className="grid grid-cols-3 w-full max-w-xl">
          <TabsTrigger value="surahs">{isAr ? 'السور' : 'Surahs'}</TabsTrigger>
          <TabsTrigger value="memorization">{isAr ? 'مسارات الحفظ' : 'Memorization'}</TabsTrigger>
          <TabsTrigger value="tajweed">{isAr ? 'مسارات التجويد' : 'Tajweed'}</TabsTrigger>
        </TabsList>

        <TabsContent value="surahs" className="mt-4 space-y-4">
          <div className="relative">
            <Search className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
            <Input
              placeholder={isAr ? 'ابحث باسم السورة أو رقمها' : 'Search by name or number'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`h-11 ${isAr ? 'pr-10' : 'pl-10'}`}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto p-1">
            {filteredSurahs.map((s) => {
              const blocked = isBlocked('surah', s.number)
              const key = `surah:${s.number}`
              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => toggle('surah', s.number, !blocked)}
                  disabled={savingKey === key}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-start transition-all ${
                    blocked
                      ? 'bg-red-50 border-red-300 hover:bg-red-100'
                      : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <div>
                    <div className="font-bold">
                      {s.number}. {isAr ? s.name_ar : s.name_en}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {blocked
                        ? isAr
                          ? 'محظورة'
                          : 'Blocked'
                        : isAr
                        ? 'متاحة'
                        : 'Allowed'}
                    </div>
                  </div>
                  {savingKey === key ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : blocked ? (
                    <Lock className="w-4 h-4 text-red-600" />
                  ) : (
                    <Unlock className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="memorization" className="mt-4">
          <PathList
            paths={memPaths}
            type="memorization_path"
            isBlocked={isBlocked}
            onToggle={toggle}
            savingKey={savingKey}
            isAr={isAr}
          />
        </TabsContent>

        <TabsContent value="tajweed" className="mt-4">
          <PathList
            paths={tajPaths}
            type="tajweed_path"
            isBlocked={isBlocked}
            onToggle={toggle}
            savingKey={savingKey}
            isAr={isAr}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PathList({
  paths,
  type,
  isBlocked,
  onToggle,
  savingKey,
  isAr,
}: {
  paths: PathOption[]
  type: 'memorization_path' | 'tajweed_path'
  isBlocked: (t: 'memorization_path' | 'tajweed_path', targetId: string) => boolean
  onToggle: (
    t: 'memorization_path' | 'tajweed_path',
    targetId: string,
    blocked: boolean
  ) => Promise<void>
  savingKey: string | null
  isAr: boolean
}) {
  if (paths.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          {isAr ? 'لا توجد مسارات متاحة حالياً.' : 'No paths available.'}
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="space-y-2">
      {paths.map((p) => {
        const blocked = isBlocked(type, p.id)
        const key = `${type}:${p.id}`
        return (
          <Card key={p.id} className="rounded-xl">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold">{p.title}</div>
                {p.level && <div className="text-xs text-muted-foreground">{p.level}</div>}
              </div>
              <Button
                variant={blocked ? 'destructive' : 'outline'}
                onClick={() => onToggle(type, p.id, !blocked)}
                disabled={savingKey === key}
              >
                {savingKey === key ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : blocked ? (
                  <>
                    <Lock className="w-4 h-4 me-2" /> {isAr ? 'محظورة — اضغط لرفع الحظر' : 'Blocked — unblock'}
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 me-2" /> {isAr ? 'متاحة — اضغط للحظر' : 'Allowed — block'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
