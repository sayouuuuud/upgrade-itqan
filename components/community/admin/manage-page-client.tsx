"use client"

// Client-side tabbed UI for /community/[community]/admin/manage.

import { useState } from "react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  FileText,
  Flag,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { PostsPanel } from "./posts-panel"
import { MembersPanel } from "./members-panel"
import { RulesPanel } from "./rules-panel"
import { ModerationQueue } from "../moderation-queue"
import type { Community } from "@/lib/community/types"

interface ManagePageClientProps {
  community: Community
}

export function ManagePageClient({ community }: ManagePageClientProps) {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const [tab, setTab] = useState("posts")

  const title =
    community === "academy"
      ? isAr ? "إدارة منتدى الأكاديمية" : "Manage Academy forum"
      : isAr ? "إدارة منتدى المقرأة" : "Manage Maqraa forum"

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        {isAr
          ? "تحكم كامل في المنشورات والأعضاء والقواعد والبلاغات."
          : "Full control over posts, members, rules, and reports."}
      </p>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="posts" className="gap-1.5">
            <FileText className="w-4 h-4" />
            {isAr ? "المنشورات" : "Posts"}
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="w-4 h-4" />
            {isAr ? "الأعضاء" : "Members"}
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <Flag className="w-4 h-4" />
            {isAr ? "البلاغات" : "Reports"}
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            {isAr ? "القواعد" : "Rules"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          <PostsPanel community={community} />
        </TabsContent>
        <TabsContent value="members" className="mt-4">
          <MembersPanel community={community} />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <ModerationQueue community={community} />
        </TabsContent>
        <TabsContent value="rules" className="mt-4">
          <RulesPanel community={community} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
