"use client"

import dynamic from "next/dynamic"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContentPagesManager } from "@/components/admin/content-pages-manager"
import { Home, FileText } from "lucide-react"

// Load the homepage editor lazily to avoid pulling its heavy deps into the initial bundle
const HomepageEditor = dynamic(
  () => import("@/app/admin/homepage/page"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
        جاري تحميل محرر الصفحة الرئيسية...
      </div>
    ),
  }
)

import { useI18n } from "@/lib/i18n/context"

export default function ContentPagesPage() {
  const { t } = useI18n()
  const isAr = t.locale === 'ar'
  
  return (
    <Tabs defaultValue="homepage" className="w-full">
      <TabsList className="mb-6 gap-1 bg-muted/50 p-1">
        <TabsTrigger value="homepage" className="gap-2 data-[state=active]:bg-[#1B5E3B] data-[state=active]:text-white">
          <Home className="w-4 h-4" />
          {isAr ? "الصفحة الرئيسية" : "Homepage"}
        </TabsTrigger>
        <TabsTrigger value="static" className="gap-2 data-[state=active]:bg-[#1B5E3B] data-[state=active]:text-white">
          <FileText className="w-4 h-4" />
          {isAr ? "الصفحات الثابتة" : "Static Pages"}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="homepage">
        <HomepageEditor />
      </TabsContent>

      <TabsContent value="static">
        <ContentPagesManager />
      </TabsContent>
    </Tabs>
  )
}
