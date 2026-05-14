'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Library, Search, Loader2, BookOpen, Eye, Plus } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface Q {
  id: string
  title: string | null
  question: string
  answer: string | null
  category_name_ar: string | null
  category_slug: string | null
  is_anonymous: boolean
  published_at: string | null
  views_count: number
  asker_name: string | null
  officer_name: string | null
}

interface Cat {
  id: string
  slug: string
  name_ar: string
  name_en: string | null
}

export default function PublicFiqhLibrary() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const [questions, setQuestions] = useState<Q[]>([])
  const [categories, setCategories] = useState<Cat[]>([])
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ view: 'library', public: '1' })
      if (search.trim()) params.set('q', search.trim())
      if (activeCat) params.set('category', activeCat)
      const res = await fetch(`/api/academy/fiqh?${params.toString()}`)
      const data = await res.json()
      if (res.ok) setQuestions(data.questions || [])
    } finally {
      setLoading(false)
    }
  }, [search, activeCat])

  useEffect(() => {
    fetch('/api/academy/fiqh/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <Library className="w-4 h-4" />
            {isAr ? 'مكتبة الفتاوى' : 'Fiqh Library'}
          </div>
          <h1 className="text-3xl font-black">
            {isAr ? 'مكتبة الأسئلة الفقهية' : 'Public Fiqh Library'}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            {isAr
              ? 'أسئلة فقهية أجاب عنها المسؤولون المتخصصون ووافق أصحابها على نشرها لينتفع بها الجميع.'
              : 'Questions answered by specialized officers and published with the asker’s consent.'}
          </p>
        </div>
        <Button asChild>
          <Link href="/academy/student/fiqh">
            <Plus className="w-4 h-4 me-2" />
            {isAr ? 'أرسل سؤالك' : 'Ask a question'}
          </Link>
        </Button>
      </div>

      <div className="flex gap-3 flex-col md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4 start-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'ابحث في الفتاوى...' : 'Search fatwas...'}
            className="ps-10"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveCat(null)}
          className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-colors ${
            activeCat === null
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border hover:bg-muted'
          }`}
        >
          {isAr ? 'الكل' : 'All'}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCat(c.slug)}
            className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-colors ${
              activeCat === c.slug
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border hover:bg-muted'
            }`}
          >
            {c.name_ar}
          </button>
        ))}
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto opacity-60 mb-3" />
            {search || activeCat
              ? isAr
                ? 'لا توجد نتائج مطابقة. جرّب تعديل البحث أو التصنيف.'
                : 'No matching results. Try a different search or filter.'
              : isAr
              ? 'المكتبة فارغة بعد. كن أول من يسأل!'
              : 'Library is empty. Be the first to ask!'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {questions.map((q) => (
            <Link key={q.id} href={`/academy/fiqh/${q.id}`}>
              <Card className="rounded-2xl hover:shadow-md transition-shadow h-full">
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {q.category_name_ar && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                        {q.category_name_ar}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg line-clamp-2">
                    {q.title || q.question.slice(0, 80) + (q.question.length > 80 ? '…' : '')}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{q.question}</p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <div className="truncate">
                      {q.officer_name && <span>{isAr ? 'المسؤول:' : 'Officer:'} {q.officer_name}</span>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Eye className="w-3 h-3" />
                      {q.views_count || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
