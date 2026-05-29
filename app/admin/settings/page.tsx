"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Settings,
  Globe,
  Users,
  BookOpen,
  Mic,
  Route,
  Trophy,
  Award,
  Bell,
  Shield,
  Wrench,
  Save,
  X,
  Loader2,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { useMaqraahSettings } from "./hooks/use-maqraah-settings"
import {
  SystemSettings,
  ReadersSettings,
  HalaqatSettings,
  RecitationsSettings,
  PathsSettings,
  GamificationSettings,
  CompetitionsSettings,
  NotificationsSettings,
  SecuritySettings,
  MaintenanceSettings,
} from "./_components"

const tabs = [
  { id: "system", label: "إعدادات النظام", icon: Globe, prefix: "maqraah_general_", keywords: ["اسم", "شعار", "رابط", "وصف", "لغة", "توقيت", "حساب", "تواصل", "بريد"] },
  { id: "readers", label: "المقرئون والطلبات", icon: Users, prefix: "maqraah_readers_", keywords: ["مقرئ", "طلب", "موافقة", "إجازة", "توزيع", "تقديم"] },
  { id: "halaqat", label: "الحلقات والجلسات", icon: BookOpen, prefix: "maqraah_halaqat_", keywords: ["حلقة", "جلسة", "تذكير", "تسجيل", "حضور", "فيديو"] },
  { id: "recitations", label: "التلاوات والتقييم", icon: Mic, prefix: "maqraah_recitations_", keywords: ["تلاوة", "تقييم", "صوت", "رواية", "تجويد", "درجة"] },
  { id: "paths", label: "مسارات الحفظ والتجويد", icon: Route, prefix: "maqraah_paths_", keywords: ["حفظ", "تجويد", "مسار", "ورد", "هدف", "مرحلة"] },
  { id: "gamification", label: "النقاط والمستويات", icon: Trophy, prefix: "maqraah_points_", keywords: ["نقاط", "مستوى", "شارة", "streak", "leaderboard"] },
  { id: "competitions", label: "المسابقات والشهادات", icon: Award, prefix: "maqraah_competitions_", keywords: ["مسابقة", "شهادة", "توقيع", "قالب", "إصدار"] },
  { id: "notifications", label: "الإشعارات والبريد", icon: Bell, prefix: "maqraah_notifications_", keywords: ["إشعار", "بريد", "smtp", "إيميل", "تذكير", "تقرير"] },
  { id: "security", label: "الأمان والخصوصية", icon: Shield, prefix: "maqraah_security_", keywords: ["أمان", "كلمة سر", "2fa", "ip", "جلسة", "rate limit"] },
  { id: "maintenance", label: "الصيانة", icon: Wrench, prefix: "maqraah_maintenance_", keywords: ["صيانة", "cache", "backup", "نسخة احتياطية", "تخزين"] },
]

export default function MaqraahAdminSettingsPage() {
  const {
    settings,
    metadata,
    isLoading,
    saving,
    hasUnsavedChanges,
    unsavedCount,
    updateSettings,
    saveChanges,
    discardChanges,
    resetSection,
    testSmtp,
  } = useMaqraahSettings()

  const [activeTab, setActiveTab] = useState("system")
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        if (hasUnsavedChanges) saveChanges()
      }
      if (e.key === "Escape") {
        if (hasUnsavedChanges) discardChanges()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [hasUnsavedChanges, saveChanges, discardChanges])

  const filteredTabs = tabs.filter(
    (tab) =>
      tab.label.includes(searchQuery) ||
      tab.keywords.some((kw) => kw.includes(searchQuery))
  )

  const handleResetSection = useCallback(
    (prefix: string) => {
      resetSection(prefix)
    },
    [resetSection]
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case "system":
        return (
          <SystemSettings
            settings={settings}
            metadata={metadata}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("maqraah_general_")}
          />
        )
      case "readers":
        return (
          <ReadersSettings
            settings={settings}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("maqraah_readers_")}
          />
        )
      case "halaqat":
        return (
          <HalaqatSettings
            settings={settings}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("maqraah_halaqat_")}
          />
        )
      case "recitations":
        return (
          <RecitationsSettings
            settings={settings}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("maqraah_recitations_")}
          />
        )
      case "paths":
        return (
          <PathsSettings
            settings={settings}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("maqraah_paths_")}
          />
        )
      case "gamification":
        return (
          <GamificationSettings
            settings={settings}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("maqraah_points_")}
          />
        )
      case "competitions":
        return (
          <CompetitionsSettings
            settings={settings}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("maqraah_competitions_")}
          />
        )
      case "notifications":
        return (
          <NotificationsSettings
            settings={settings}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("maqraah_notifications_")}
            onTestSmtp={testSmtp}
          />
        )
      case "security":
        return (
          <SecuritySettings
            settings={settings}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("maqraah_security_")}
          />
        )
      case "maintenance":
        return (
          <MaintenanceSettings
            settings={settings}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("maqraah_maintenance_")}
          />
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-6">
          <div className="w-64 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background -mx-6 lg:-mx-8 -mt-6 lg:-mt-8" dir="rtl">
      {/* Sticky Header */}
      <div className="sticky -top-6 lg:-top-8 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">إعدادات النظام</h1>
              <p className="text-xs text-muted-foreground">
                {tabs.find((t) => t.id === activeTab)?.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {unsavedCount} تغيير غير محفوظ
              </span>
            )}
            <Button
              variant="outline"
              onClick={discardChanges}
              disabled={!hasUnsavedChanges || saving}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              إلغاء
            </Button>
            <Button onClick={saveChanges} disabled={!hasUnsavedChanges || saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ التغييرات
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Desktop */}
        {!isMobile && (
          <aside className="w-64 border-l border-border min-h-[calc(100vh-73px)] bg-muted/30">
            <div className="p-4 sticky top-[73px]">
              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث في الإعدادات..."
                  className="pr-10 h-10"
                />
              </div>

              <ScrollArea className="h-[calc(100vh-180px)]">
                <nav className="space-y-1">
                  {filteredTabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-right",
                          activeTab === tab.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
              </ScrollArea>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          {isMobile ? (
            <Accordion
              type="single"
              collapsible
              value={activeTab}
              onValueChange={(v) => v && setActiveTab(v)}
              className="space-y-4"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <AccordionItem key={tab.id} value={tab.id} className="border rounded-xl overflow-hidden">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="font-medium">{tab.label}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {activeTab === tab.id && renderTabContent()}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          ) : (
            <div className="max-w-4xl">{renderTabContent()}</div>
          )}
        </main>
      </div>
    </div>
  )
}
