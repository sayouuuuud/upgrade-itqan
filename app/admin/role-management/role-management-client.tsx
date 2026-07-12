"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, ShieldCheck, Users, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/lib/i18n/context"

type RoleCatalogEntry = {
  id: string
  labelAr: string
  labelEn: string
  group: "admin" | "academy" | "maqraa" | "general"
  summaryAr: string
  summaryEn: string
  capabilitiesAr: string[]
  capabilitiesEn: string[]
  assignableAsPrimary: boolean
  tone: "amber" | "emerald" | "blue" | "slate"
}

type AdminUser = {
  id: string
  name: string
  email: string | null
  role: string
  academy_roles: string[] | null
}

const TONE_STYLES: Record<RoleCatalogEntry["tone"], string> = {
  amber: "border-amber-500/30 bg-amber-500/5",
  emerald: "border-emerald-500/30 bg-emerald-500/5",
  blue: "border-blue-500/30 bg-blue-500/5",
  slate: "border-border bg-card/60",
}

const TONE_BADGE: Record<RoleCatalogEntry["tone"], string> = {
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  slate: "bg-muted text-muted-foreground border-border",
}

const GROUP_LABELS: Record<RoleCatalogEntry["group"], { ar: string; en: string }> = {
  admin: { ar: "الإدارة العليا", en: "Super Administration" },
  maqraa: { ar: "المقرأة", en: "Maqraa" },
  academy: { ar: "الأكاديمية", en: "Academy" },
  general: { ar: "أدوار عامة", en: "General Roles" },
}

export function RoleManagementClient() {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const [catalog, setCatalog] = useState<RoleCatalogEntry[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/roles")
        if (!res.ok) throw new Error("failed")
        const json = await res.json()
        setCatalog(json.catalog ?? [])
        setCounts(json.counts ?? {})
        setAdmins(json.admins ?? [])
      } catch {
        // keep empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const filteredAdmins = admins.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(query.toLowerCase()),
  )

  const grouped = (["admin", "maqraa", "academy", "general"] as const).map((group) => ({
    group,
    roles: catalog.filter((r) => r.group === group),
  }))

  const DirectionIcon = isAr ? ChevronLeft : ChevronRight

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">
              {isAr ? "إدارة الأدوار والصلاحيات" : "Roles and Permissions Management"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAr ? "نظرة شاملة على كل الأدوار في المنصة وما يملكه كل دور من صلاحيات." : "Comprehensive overview of all platform roles and permissions."}
            </p>
          </div>
        </div>
      </div>

      {/* Role catalogue */}
      <div className="space-y-6">
        {grouped.map(({ group, roles }) =>
          roles.length === 0 ? null : (
            <div key={group} className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wide text-muted-foreground">
                {isAr ? GROUP_LABELS[group].ar : GROUP_LABELS[group].en}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {roles.map((role) => (
                  <Card key={role.id} className={`rounded-3xl border ${TONE_STYLES[role.tone]}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-black text-foreground">
                          {isAr ? role.labelAr : role.labelEn}
                        </CardTitle>
                        <Badge variant="outline" className={`shrink-0 rounded-full font-bold ${TONE_BADGE[role.tone]}`}>
                          {counts[role.id] ?? 0}
                        </Badge>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {isAr ? role.summaryAr : role.summaryEn}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1.5">
                        {(isAr ? role.capabilitiesAr : role.capabilitiesEn).map((cap, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                            <span className="leading-relaxed">{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ),
        )}
      </div>

      {/* Admin users quick access */}
      <Card className="rounded-3xl border border-border bg-card/60">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-black text-foreground">
              <Users className="h-5 w-5 text-primary" />
              {isAr ? "المستخدمون الإداريون" : "Administrative Users"}
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isAr ? "ابحث بالاسم أو البريد..." : "Search by name or email..."}
                className="rounded-xl pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAdmins.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {isAr ? "لا يوجد مستخدمون مطابقون." : "No matching users found."}
            </p>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredAdmins.map((user) => {
                const primaryRoleObj = catalog.find((c) => c.id === user.role)
                const primaryLabel = primaryRoleObj ? (isAr ? primaryRoleObj.labelAr : primaryRoleObj.labelEn) : user.role

                return (
                  <div key={user.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email || "—"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {primaryLabel && (
                        <Badge variant="outline" className="rounded-full font-bold">
                          {primaryLabel}
                        </Badge>
                      )}
                      {(user.academy_roles ?? []).map((r) => {
                        const secRoleObj = catalog.find((c) => c.id === r)
                        const secLabel = secRoleObj ? (isAr ? secRoleObj.labelAr : secRoleObj.labelEn) : r
                        return (
                          <Badge key={r} variant="secondary" className="rounded-full text-xs">
                            {secLabel}
                          </Badge>
                        )
                      })}
                      <Button asChild size="sm" variant="outline" className="gap-1 rounded-xl font-bold">
                        <Link href={`/admin/users/${user.id}/roles`}>
                          {isAr ? "تعديل الأدوار" : "Edit Roles"}
                          <DirectionIcon className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
