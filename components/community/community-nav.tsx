"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Home,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import type { Community } from "@/lib/community/types"

interface CommunityNavProps {
  community: Community
  canModerate: boolean
  canReview: boolean
  alsoHasCommunities: Community[]
}

export function CommunityNav({
  community,
  canModerate,
  canReview,
  alsoHasCommunities,
}: CommunityNavProps) {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const pathname = usePathname()

  const base = `/community/${community}`

  const tabs = [
    {
      href: `${base}/forum`,
      label_ar: "النقاش",
      label_en: "Discussion",
      icon: MessageSquare,
    },
    {
      href: `${base}/consultations`,
      label_ar: "الاستشارات",
      label_en: "Consultations",
      icon: Sparkles,
    },
    {
      href: `${base}/articles`,
      label_ar: "المقالات",
      label_en: "Articles",
      icon: BookOpen,
    },
  ]

  return (
    <div
      className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="container mx-auto px-3 py-2 flex items-center gap-2 overflow-x-auto">
        <Link
          href="/"
          className="text-sm flex items-center gap-1 text-muted-foreground hover:text-foreground px-2 py-1"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isAr ? "الرئيسية" : "Home"}
          </span>
        </Link>

        <span className="text-muted-foreground">/</span>

        <span className="text-sm font-semibold">
          {community === "academy"
            ? isAr ? "أكاديمية" : "Academy"
            : isAr ? "مقرأة" : "Maqraa"}
        </span>

        {alsoHasCommunities.length > 1 && (
          <Link
            href={`/community/${
              community === "academy" ? "maqraa" : "academy"
            }/forum`}
            className="text-xs text-primary hover:underline"
          >
            ({isAr ? "تبديل" : "switch"})
          </Link>
        )}

        <div className="flex-1" />

        <div className="flex gap-1">
          {tabs.map((t) => {
            const active = pathname.startsWith(t.href)
            const Icon = t.icon
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`text-sm px-3 py-1.5 rounded-md flex items-center gap-1 ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isAr ? t.label_ar : t.label_en}
                </span>
              </Link>
            )
          })}
          {canReview && (
            <Link
              href={`${base}/articles/review`}
              className={`text-sm px-3 py-1.5 rounded-md flex items-center gap-1 ${
                pathname.startsWith(`${base}/articles/review`)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isAr ? "مراجعة" : "Review"}
              </span>
            </Link>
          )}
          {canModerate && (
            <Link
              href={`${base}/moderation`}
              className={`text-sm px-3 py-1.5 rounded-md flex items-center gap-1 ${
                pathname.startsWith(`${base}/moderation`)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isAr ? "إشراف" : "Mod"}
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
