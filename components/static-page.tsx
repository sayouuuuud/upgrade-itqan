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
    <div dir={isAr ? "rtl" : "ltr"}>
      {/* Page Hero */}
      <div className="bg-[#0B3D2E] text-white py-14 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-5">
            <BookOpen className="w-6 h-6 text-[#D4A843]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white text-balance">
            {title}
          </h1>
          <p className="mt-3 text-sm text-white/50">
            {isAr ? "آخر تحديث:" : "Last updated:"}{" "}
            <span className="text-white/70">{updatedAt}</span>
          </p>
          {/* Decorative gold divider */}
          <div className="mt-6 mx-auto w-16 h-0.5 bg-[#D4A843]/60 rounded-full" />
        </div>
      </div>

      {/* Content */}
      <div className="bg-background py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-2xl p-6 md:p-10 shadow-sm border border-border/40">
            <div
              className="
                prose prose-neutral dark:prose-invert max-w-none leading-relaxed
                prose-headings:text-foreground prose-headings:font-bold
                prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
                prose-h2:border-b prose-h2:border-[#0B3D2E]/15 prose-h2:pb-3
                prose-h2:text-[#0B3D2E] dark:prose-h2:text-[#4ade80]
                prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-foreground
                prose-p:text-muted-foreground prose-p:leading-8
                prose-strong:text-foreground
                prose-li:text-muted-foreground prose-li:leading-8
                prose-a:text-[#1B5E3B] prose-a:font-medium hover:prose-a:underline
                prose-ol:text-muted-foreground
                prose-ul:text-muted-foreground
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
