"use client"

import useSWR from "swr"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useI18n } from "@/lib/i18n/context"
import { Loader2, BookOpen } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface StaticPageProps {
  slug: string
}

interface PageData {
  slug: string
  title_ar: string
  title_en: string
  content_ar: string
  content_en: string
  meta_desc_ar: string
  meta_desc_en: string
  updated_at: string
}

export function StaticPage({ slug }: StaticPageProps) {
  const { locale } = useI18n()
  const isAr = locale === "ar"

  const { data, error, isLoading } = useSWR<{ page: PageData }>(
    `/api/content-pages/${slug}`,
    fetcher
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B5E3B]" />
      </div>
    )
  }

  if (error || !data?.page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-[#0B3D2E]/10 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-[#1B5E3B]" />
        </div>
        <p className="text-muted-foreground text-sm">
          {isAr ? "الصفحة غير متاحة حاليًا" : "This page is currently unavailable"}
        </p>
      </div>
    )
  }

  const page = data.page
  const title = isAr ? page.title_ar : page.title_en
  const content = isAr ? page.content_ar : page.content_en
  const updatedAt = new Date(page.updated_at).toLocaleDateString(
    isAr ? "ar-EG" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  )

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen bg-hp-parchment text-hp-ink dark:bg-hp-dark dark:text-hp-cream transition-colors duration-500">
      {/* Page Hero */}
      <div className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden border-b border-hp-navy/10 dark:border-hp-parchment/10">
        <div className="absolute inset-0 bg-hp-navy-deep opacity-[0.03] dark:opacity-20 pointer-events-none" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-hp-gold/10 text-hp-gold mb-6 ring-1 ring-hp-gold/20">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-hp-navy dark:text-hp-cream tracking-tight text-balance mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            {title}
          </h1>
          <p className="text-sm md:text-base text-hp-ink/60 dark:text-hp-cream/60 flex items-center justify-center gap-2">
            <span>{isAr ? "آخر تحديث:" : "Last updated:"}</span>
            <span className="font-medium text-hp-navy dark:text-hp-gold">{updatedAt}</span>
          </p>
          <div className="mt-8 mx-auto w-16 h-0.5 bg-hp-gold/60 rounded-full" />
        </div>
      </div>

      {/* Content */}
      <div className="py-12 md:py-20 relative z-10 bg-hp-parchment dark:bg-hp-dark transition-colors duration-500">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-hp-card dark:bg-hp-dark-2 rounded-3xl p-8 md:p-12 shadow-sm border border-hp-navy/5 dark:border-hp-cream/5 ring-1 ring-black/[0.02] dark:ring-white/[0.02]">
            <div
              className="
                prose prose-neutral dark:prose-invert max-w-none
                prose-headings:text-hp-navy dark:prose-headings:text-hp-cream prose-headings:font-bold prose-headings:tracking-tight
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-hp-navy/10 dark:prose-h2:border-hp-cream/10 prose-h2:pb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-hp-ink/80 dark:prose-p:text-hp-cream/80 prose-p:leading-relaxed prose-p:text-[1.05rem]
                prose-strong:text-hp-navy dark:prose-strong:text-hp-cream prose-strong:font-semibold
                prose-li:text-hp-ink/80 dark:prose-li:text-hp-cream/80 prose-li:leading-relaxed
                prose-a:text-hp-gold prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                prose-ul:my-6 prose-ol:my-6
                prose-hr:border-hp-navy/10 dark:prose-hr:border-hp-cream/10 prose-hr:my-10
              "
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
