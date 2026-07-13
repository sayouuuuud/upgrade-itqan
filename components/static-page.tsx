"use client"

import useSWR from "swr"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useI18n } from "@/lib/i18n/context"
import { Loader2 } from "lucide-react"

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
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground text-sm">
        {isAr ? "تعذّر تحميل الصفحة" : "Failed to load page"}
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
    <div className="bg-background min-h-[80vh] py-16" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-3xl p-8 md:p-12 shadow-sm border border-border/40">
          <h1 className="text-3xl font-black text-foreground mb-2 text-center text-balance">
            {title}
          </h1>
          <p className="text-center text-xs text-muted-foreground mb-10">
            {isAr ? "آخر تحديث:" : "Last updated:"} {updatedAt}
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed
            prose-headings:text-foreground prose-headings:font-bold
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-3
            prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
            prose-p:text-muted-foreground prose-p:leading-8
            prose-strong:text-foreground
            prose-li:text-muted-foreground prose-li:leading-8
            prose-a:text-[#1B5E3B] hover:prose-a:underline
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
