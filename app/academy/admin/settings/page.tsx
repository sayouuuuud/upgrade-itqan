"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Settings,
  Globe,
  UserPlus,
  Video,
  VideoIcon,
  Trophy,
  Bell,
  MessageSquare,
  Shield,
  Wrench,
  Save,
  X,
  Loader2,
  Search,
  ChevronDown,
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
import { useAcademySettings } from "./hooks/use-academy-settings"
import {
  GeneralSettings,
  RegistrationSettings,
  CoursesContentSettings,
  LiveSessionsSettings,
  GamificationSettings,
  NotificationsEmailSettings,
  ForumFiqhSettings,
  SecurityPrivacySettings,
  MaintenanceSettings,
} from "./_components"

const tabs = [
  { id: "general", label: "الإعدادات العامة", icon: Globe, keywords: ["اسم", "شعار", "رابط", "وصف", "لغة", "توقيت"] },
  { id: "registration", label: "التسجيل والقبول", icon: UserPlus, keywords: ["تسجيل", "طالب", "أستاذ", "موافقة", "حقول"] },
  { id: "courses", label: "الدورات والمحتوى", icon: Video, keywords: ["دورة", "فيديو", "ملف", "تخزين", "تحميل", "علامة مائية"] },
  { id: "sessions", label: "الجلسات الحية", icon: VideoIcon, keywords: ["جلسة", "فيديو", "تذكير", "zoom", "livekit"] },
  { id: "gamification", label: "النقاط والمستويات", icon: Trophy, keywords: ["نقاط", "مستوى", "شارة", "streak", "leaderboard"] },
  { id: "notifications", label: "الإشعارات والبريد", icon: Bell, keywords: ["إشعار", "بريد", "smtp", "إيميل", "تذكير"] },
  { id: "forum", label: "المنتدى والفقه", icon: MessageSquare, keywords: ["منتدى", "فقه", "سؤال", "موضوع", "كلمات ممنوعة"] },
  { id: "security", label: "الأمان والخصوصية", icon: Shield, keywords: ["أمان", "كلمة سر", "2fa", "ip", "جلسة", "rate limit"] },
  { id: "maintenance", label: "الصيانة", icon: Wrench, keywords: ["صيانة", "cache", "backup", "نسخة احتياطية"] },
]

export default function AcademyAdminSettingsPage() {
  const {
    settings,
    metadata,
    isLoading,
    saving,
    hasUnsavedChanges,
    unsavedCount,
    updateSetting,
    updateSettings,
    saveChanges,
    discardChanges,
    resetSection,
    testSmtp,
  } = useAcademySettings()

  const [activeTab, setActiveTab] = useState("general")
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobile, setIsMobile] = useState(false)

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Keyboard shortcut for save
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

  // Filter tabs by search
  const filteredTabs = tabs.filter(
    (tab) =>
      tab.label.includes(searchQuery) ||
      tab.keywords.some((kw) => kw.includes(searchQuery))
  )

  // Reset section handler
  const handleResetSection = useCallback(
    (prefix: string) => {
      resetSection(prefix)
    },
    [resetSection]
  )

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <GeneralSettings
            settings={settings}
            metadata={metadata}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("academy_general_")}
          />
        )
      case "registration":
        return (
          <RegistrationSettings
            settings={settings}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("academy_registration_")}
          />
        )
      case "courses":
        return (
          <CoursesContentSettings
            settings={settings}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("academy_courses_")}
          />
        )
      case "sessions":
        return (
          <LiveSessionsSettings
            settings={settings}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("academy_sessions_")}
          />
        )
      case "gamification":
        return (
          <GamificationSettings
            settings={settings}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("academy_gamification_")}
          />
        )
      case "notifications":
        return (
          <NotificationsEmailSettings
            settings={settings}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("academy_notifications_")}
            onTestSmtp={testSmtp}
          />
        )
      case "forum":
        return (
          <ForumFiqhSettings
            settings={settings}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("academy_forum_")}
          />
        )
      case "security":
        return (
          <SecurityPrivacySettings
            settings={settings}
            onUpdate={updateSettings}
            onReset={() => handleResetSection("academy_security_")}
          />
        )
      case "maintenance":
        return <MaintenanceSettings settings={settings} onUpdate={updateSettings} />
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
            {Array.from({ length: 9 }).map((_, i) => (
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
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">إعدادات الأكاديمية</h1>
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
            <Button
              onClick={saveChanges}
              disabled={!hasUnsavedChanges || saving}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
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
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث في الإعدادات..."
                  className="pr-10 h-10"
                />
              </div>

              {/* Tabs */}
              <ScrollArea className="h-[calc(100vh-180px)]">
                <nav className="space-y-1">
                  {filteredTabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          activeTab === tab.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4" />
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
          {/* Mobile Accordion */}
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
