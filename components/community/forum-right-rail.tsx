"use client"

// Right rail for the Reddit-style forum: community info card with stats,
// the rules list (editable by admins on the manage page), and top
// contributors. Loads its own data so the parent doesn't have to.

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Award, Info, Users, MessageSquare, Reply } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import type { Community, CommunityRule } from "@/lib/community/types"

interface ForumRightRailProps {
  community: Community
}

interface Stats {
  totals: { posts: string; replies: string }
  members_count: number
  top_contributors: Array<{
    id: string
    name: string
    avatar_url: string | null
    role: string
    score: string
  }>
  categories: Array<{ category: string; count: string }>
}

export function ForumRightRail({ community }: ForumRightRailProps) {
  const { locale } = useI18n()
  const isAr = locale === "ar"

  const [stats, setStats] = useState<Stats | null>(null)
  const [rules, setRules] = useState<CommunityRule[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [s, r] = await Promise.all([
          fetch(`/api/community/stats?community=${community}`).then((res) =>
            res.json()
          ),
          fetch(`/api/community/admin/rules?community=${community}`).then(
            (res) => res.json()
          ),
        ])
        if (cancelled) return
        if (s && !s.error) setStats(s)
        if (r && Array.isArray(r.rules)) setRules(r.rules)
      } catch {
        // ignore
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [community])

  const title =
    community === "academy"
      ? isAr ? "مجتمع الأكاديمية" : "Academy Community"
      : isAr ? "مجتمع المقرأة" : "Maqraa Community"
  const subtitle =
    community === "academy"
      ? isAr
        ? "مساحة الطلاب والمعلمين وأولياء الأمور"
        : "Space for students, teachers and parents"
      : isAr
        ? "مساحة المقرئين والطلاب لتدارس القرآن"
        : "Reciters and students discussing Qur'an"

  return (
    <aside className="space-y-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-l from-primary/15 to-primary/5">
          <div className="font-bold text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border text-center [&>div]:py-2.5">
          <div>
            <div className="text-base font-bold tabular-nums">
              {stats?.totals.posts ?? "—"}
            </div>
            <div className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5">
              <MessageSquare className="w-3 h-3" />
              {isAr ? "منشور" : "Posts"}
            </div>
          </div>
          <div>
            <div className="text-base font-bold tabular-nums">
              {stats?.totals.replies ?? "—"}
            </div>
            <div className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5">
              <Reply className="w-3 h-3" />
              {isAr ? "تعليق" : "Replies"}
            </div>
          </div>
          <div>
            <div className="text-base font-bold tabular-nums">
              {stats?.members_count ?? "—"}
            </div>
            <div className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5">
              <Users className="w-3 h-3" />
              {isAr ? "عضو" : "Members"}
            </div>
          </div>
        </div>
      </div>

      {rules.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 border-b border-border">
            <Info className="w-3.5 h-3.5" />
            {isAr ? "قواعد المنتدى" : "Forum rules"}
          </div>
          <ol className="px-3 py-2 space-y-2 text-sm">
            {rules.map((r, idx) => (
              <li key={r.id}>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-muted-foreground font-bold w-4 shrink-0">
                    {idx + 1}.
                  </span>
                  <span className="font-medium">{r.title}</span>
                </div>
                {r.body && (
                  <p className="text-xs text-muted-foreground pr-5 mt-0.5">
                    {r.body}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {stats && stats.top_contributors.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 border-b border-border">
            <Award className="w-3.5 h-3.5" />
            {isAr ? "الأكثر مشاركة" : "Top contributors"}
          </div>
          <ul className="px-2 py-2 space-y-1.5">
            {stats.top_contributors.map((u, i) => (
              <li
                key={u.id}
                className="flex items-center gap-2 px-1.5 py-1 rounded-md"
              >
                <span className="text-xs w-4 text-muted-foreground tabular-nums">
                  {i + 1}.
                </span>
                <span className="w-7 h-7 rounded-full bg-muted overflow-hidden inline-flex items-center justify-center">
                  {u.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-3 h-3 text-muted-foreground" />
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{u.name}</div>
                  <div className="text-[10px] text-muted-foreground capitalize">
                    {u.role.replace(/_/g, " ")}
                  </div>
                </span>
                <Badge variant="secondary" className="h-5 px-1.5 font-normal">
                  {u.score}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}
