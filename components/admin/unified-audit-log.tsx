'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Activity, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { useI18n } from "@/lib/i18n/context";

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface AuditEntry {
  id: string
  action: string
  platform: 'maqraa' | 'academy' | 'site'
  entity_type: string | null
  entity_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  actor_name: string | null
  actor_email: string | null
  actor_email_resolved: string | null
}

const PLATFORM_COLORS: Record<string, string> = {
  maqraa:  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  academy: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  site:    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
}

const getPlatformLabel = (platform: string, isAr: boolean) => {
  const labels: Record<string, { ar: string; en: string }> = {
    maqraa: { ar: 'المقرأة', en: 'Maqraa' },
    academy: { ar: 'الأكاديمية', en: 'Academy' },
    site: { ar: 'الموقع', en: 'Public Site' },
  }
  return labels[platform]?.[isAr ? 'ar' : 'en'] || platform
}

function AuditLogTab() {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const [platform, setPlatform] = useState('all')
  const [action,   setAction]   = useState('')
  const [from,     setFrom]     = useState('')
  const [to,       setTo]       = useState('')
  const [page,     setPage]     = useState(0)
  const limit = 50

  const buildUrl = useCallback(() => {
    const p = new URLSearchParams()
    if (platform !== 'all') p.set('platform', platform)
    if (action)   p.set('action', action)
    if (from)     p.set('from', from)
    if (to)       p.set('to', to)
    p.set('limit',  String(limit))
    p.set('offset', String(page * limit))
    return `/api/admin/audit-log?${p.toString()}`
  }, [platform, action, from, to, page])

  const { data, isLoading, mutate } = useSWR<{
    logs: AuditEntry[]
    total: number
    platforms: string[]
    actions: string[]
  }>(buildUrl(), fetcher, { keepPreviousData: true })

  const totalPages = Math.ceil((data?.total ?? 0) / limit)
  const PaginationPrevIcon = isAr ? ChevronRight : ChevronLeft
  const PaginationNextIcon = isAr ? ChevronLeft : ChevronRight

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={platform} onValueChange={v => { setPlatform(v); setPage(0) }}>
              <SelectTrigger><SelectValue placeholder={isAr ? "المنصة" : "Platform"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل المنصات" : "All Platforms"}</SelectItem>
                {(data?.platforms ?? ['maqraa','academy','site']).map(p => (
                  <SelectItem key={p} value={p}>{getPlatformLabel(p, isAr)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pr-9"
                placeholder={isAr ? "بحث في الحدث..." : "Search event..."}
                value={action}
                onChange={e => { setAction(e.target.value); setPage(0) }}
              />
            </div>

            <Input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(0) }} />
            <Input type="date" value={to}   onChange={e => { setTo(e.target.value);   setPage(0) }} />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3 px-5">
          <div>
            <CardTitle className="text-base">{isAr ? "سجل الأحداث الحساسة" : "Sensitive Events Log"}</CardTitle>
            <CardDescription>{data?.total ?? 0} {isAr ? "حدث إجمالاً" : "Total events"}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 ml-1" /> {isAr ? "تحديث" : "Refresh"}</Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">{isAr ? "جاري التحميل..." : "Loading..."}</div>
          ) : !data?.logs?.length ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">{isAr ? "لا توجد أحداث" : "No events"}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-muted/50 border-b">
                  <tr className={isAr ? "text-right" : "text-left"}>
                    <th className="px-4 py-2 font-medium">{isAr ? "الحدث" : "Event"}</th>
                    <th className="px-4 py-2 font-medium">{isAr ? "المنصة" : "Platform"}</th>
                    <th className="px-4 py-2 font-medium">{isAr ? "المنفِّذ" : "Executor"}</th>
                    <th className="px-4 py-2 font-medium">{isAr ? "الكيان" : "Entity"}</th>
                    <th className="px-4 py-2 font-medium">{isAr ? "التاريخ" : "Date"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.logs.map(log => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-left" dir="ltr">{log.action}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLATFORM_COLORS[log.platform] ?? ''}`}>
                          {getPlatformLabel(log.platform, isAr)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{log.actor_name ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{log.actor_email_resolved ?? log.actor_email ?? ''}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {log.entity_type ? `${log.entity_type}${log.entity_id ? ` #${log.entity_id.slice(0,8)}` : ''}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd MMM yyyy – HH:mm', { locale: isAr ? ar : enUS })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-muted-foreground">
                {isAr ? "صفحة " : "Page "}{page + 1} {isAr ? "من " : "of "}{totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <PaginationPrevIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <PaginationNextIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Activity Logs (Operations) ───────────────────────────────────────────────

interface ActivityEntry {
  id: string
  action: string
  entity_type: string | null
  description: string | null
  status: string | null
  ip_address: string | null
  created_at: string
  user_name: string | null
  user_email: string | null
  user_role: string | null
}

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  error:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
}

function ActivityLogTab() {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const [search, setSearch]   = useState('')
  const [action, setAction]   = useState('all')
  const [from,   setFrom]     = useState('')
  const [to,     setTo]       = useState('')
  const [page,   setPage]     = useState(1)
  const limit = 50

  const buildUrl = useCallback(() => {
    const p = new URLSearchParams()
    if (search)        p.set('search', search)
    if (action !== 'all') p.set('action', action)
    if (from)          p.set('dateFrom', from)
    if (to)            p.set('dateTo', to)
    p.set('page', String(page))
    return `/api/admin/activity-logs?${p.toString()}`
  }, [search, action, from, to, page])

  const { data, isLoading, mutate } = useSWR<{
    logs: ActivityEntry[]
    total: number
    actions: string[]
    page: number
    limit: number
  }>(buildUrl(), fetcher, { keepPreviousData: true })

  const totalPages = Math.ceil((data?.total ?? 0) / limit)
  const PaginationPrevIcon = isAr ? ChevronRight : ChevronLeft
  const PaginationNextIcon = isAr ? ChevronLeft : ChevronRight

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={action} onValueChange={v => { setAction(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder={isAr ? "نوع الفعل" : "Action Type"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل الأفعال" : "All Actions"}</SelectItem>
                {(data?.actions ?? []).map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pr-9"
                placeholder={isAr ? "بحث..." : "Search..."}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
            </div>

            <Input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }} />
            <Input type="date" value={to}   onChange={e => { setTo(e.target.value);   setPage(1) }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3 px-5">
          <div>
            <CardTitle className="text-base">{isAr ? "سجل نشاط العمليات" : "Operations Activity Log"}</CardTitle>
            <CardDescription>{data?.total ?? 0} {isAr ? "حدث إجمالاً" : "Total events"}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 ml-1" /> {isAr ? "تحديث" : "Refresh"}</Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">{isAr ? "جاري التحميل..." : "Loading..."}</div>
          ) : !data?.logs?.length ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">{isAr ? "لا يوجد نشاط" : "No activity"}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-muted/50 border-b">
                  <tr className={isAr ? "text-right" : "text-left"}>
                    <th className="px-4 py-2 font-medium">{isAr ? "الفعل" : "Action"}</th>
                    <th className="px-4 py-2 font-medium">{isAr ? "الحالة" : "Status"}</th>
                    <th className="px-4 py-2 font-medium">{isAr ? "المستخدم" : "User"}</th>
                    <th className="px-4 py-2 font-medium">{isAr ? "الوصف" : "Description"}</th>
                    <th className="px-4 py-2 font-medium">{isAr ? "التاريخ" : "Date"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.logs.map(log => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-left" dir="ltr">{log.action}</td>
                      <td className="px-4 py-3">
                        {log.status && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[log.status] ?? 'bg-gray-100 text-gray-800'}`}>
                            {log.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{log.user_name ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{log.user_email ?? ''}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate">
                        {log.description ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd MMM yyyy – HH:mm', { locale: isAr ? ar : enUS })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-muted-foreground">
                {isAr ? "صفحة " : "Page "}{page} {isAr ? "من " : "of "}{totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <PaginationPrevIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <PaginationNextIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Unified Component ─────────────────────────────────────────────────────────

export default function UnifiedAuditLog() {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isAr ? "سجل التدقيق الموحد" : "Unified Audit Log"}</h1>
        <p className="text-muted-foreground mt-1">
          {isAr ? "مراقبة شاملة لأحداث الحوكمة ونشاط العمليات عبر المنصتين" : "Comprehensive monitoring of governance events and operations activity across platforms"}</p>
      </div>

      <Tabs defaultValue="governance" dir={isAr ? "rtl" : "ltr"}>
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="governance" className="gap-2">
            <Shield className="h-4 w-4" />
            {isAr ? "الحوكمة" : "Governance"}</TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            {isAr ? "العمليات" : "Operations"}</TabsTrigger>
        </TabsList>

        <TabsContent value="governance" className="mt-6">
          <AuditLogTab />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityLogTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
