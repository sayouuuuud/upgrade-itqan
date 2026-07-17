"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    ScrollText, Search, Filter, Download, CheckCircle, XCircle,
    Clock, Loader2, User, ChevronDown
} from "lucide-react"

const STATUS_COLOR: Record<string, string> = {
    success: 'text-emerald-400',
    failed: 'text-red-400',
    pending: 'text-amber-400',
}

export default function AdminActivityLogsPage() {
    const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
    const isAr = t.locale === 'ar'

    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [availableActions, setAvailableActions] = useState<string[]>([])

    const [search, setSearch] = useState('')
    const [filterAction, setFilterAction] = useState('')
    const [filterDateFrom, setFilterDateFrom] = useState('')
    const [filterDateTo, setFilterDateTo] = useState('')

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page) })
            if (search) params.set('search', search)
            if (filterAction) params.set('action', filterAction)
            if (filterDateFrom) params.set('dateFrom', filterDateFrom)
            if (filterDateTo) params.set('dateTo', filterDateTo)
            const res = await fetch(`/api/admin/activity-logs?${params}`)
            if (res.ok) {
                const data = await res.json()
                setLogs(data.logs || [])
                setTotal(data.total || 0)
                if (data.actions?.length) setAvailableActions(data.actions)
            }
        } finally {
            setLoading(false)
        }
    }, [page, search, filterAction, filterDateFrom, filterDateTo])

    useEffect(() => {
        const timeout = setTimeout(fetchLogs, 300)
        return () => clearTimeout(timeout)
    }, [fetchLogs])

    const totalPages = Math.ceil(total / 50)

    const handleExport = () => {
        const headers = [
            t.admin.logDate, t.admin.logUser, t.admin.role || 'Role',
            t.admin.logAction, t.admin.logType, t.admin.logDescription,
            t.admin.logStatus, t.admin.logIp
        ]
        const csv = [
            headers.join(','),
            ...logs.map(l => [
                new Date(l.created_at).toISOString(),
                l.user_name || t.admin.system,
                l.user_role || '',
                l.action,
                l.entity_type || '',
                l.description || '',
                l.status,
                l.ip_address || '',
            ].join(','))
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ScrollText className="w-8 h-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t.admin.activityLogs}</h1>
                        <p className="text-sm text-muted-foreground mt-1">{t.admin.activityLogsDesc}</p>
                    </div>
                </div>
                <Button variant="outline" onClick={handleExport} className="border-border hover:bg-muted font-bold gap-2 rounded-xl text-foreground">
                    <Download className="w-4 h-4" /> {t.admin.exportCsv}
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                    <Input
                        className={`${isAr ? 'pr-10' : 'pl-10'} border-border focus:ring-primary/20 rounded-xl bg-muted/30 text-foreground`}
                        placeholder={t.admin.searchLogsPlaceholder}
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                    />
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <select
                        className="h-10 rounded-xl border border-border bg-muted/30 px-3 text-sm min-w-[180px] focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                        value={filterAction}
                        onChange={e => { setFilterAction(e.target.value); setPage(1) }}
                    >
                        <option value="">{t.admin.allActions}</option>
                        {availableActions.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <div className="flex flex-wrap items-center gap-2">
                        <Input type="date" className="w-40 h-10 border-border rounded-xl bg-muted/30 text-foreground" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
                        <span className="text-muted-foreground">{t.admin.dateTo}</span>
                        <Input type="date" className="w-40 h-10 border-border rounded-xl bg-muted/30 text-foreground" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
                    </div>
                    {(search || filterAction || filterDateFrom || filterDateTo) && (
                        <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterAction(''); setFilterDateFrom(''); setFilterDateTo(''); setPage(1) }} className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl">
                            {t.admin.clearFilters}
                        </Button>
                    )}
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden text-foreground">
                <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        {t.admin.currentLogs}
                        <span className="text-muted-foreground font-normal text-xs bg-muted/50 px-2 py-0.5 rounded-full">({total})</span>
                    </h3>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : logs.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                            <ScrollText className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                        <p className="text-muted-foreground font-medium">{t.admin.noLogsFound}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-muted-foreground bg-muted/30">
                                    <th className={`${isAr ? 'text-right' : 'text-left'} py-4 px-5 font-bold whitespace-nowrap`}>{t.admin.logDate}</th>
                                    <th className={`${isAr ? 'text-right' : 'text-left'} py-4 px-5 font-bold whitespace-nowrap`}>{t.admin.logUser}</th>
                                    <th className={`${isAr ? 'text-right' : 'text-left'} py-4 px-5 font-bold whitespace-nowrap`}>{t.admin.logAction}</th>
                                    <th className={`${isAr ? 'text-right' : 'text-left'} py-4 px-5 font-bold whitespace-nowrap`}>{t.admin.logType}</th>
                                    <th className={`${isAr ? 'text-right' : 'text-left'} py-4 px-5 font-bold whitespace-nowrap`}>{t.admin.logDescription}</th>
                                    <th className="py-4 px-5 font-bold text-center whitespace-nowrap">{t.admin.logStatus}</th>
                                    <th className={`${isAr ? 'text-right' : 'text-left'} py-4 px-5 font-bold whitespace-nowrap`}>{t.admin.logIp}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(l => (
                                    <tr key={l.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                        <td className="py-4 px-5 text-xs text-gray-500 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground">
                                                    {new Date(l.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                                                </span>
                                                <span>
                                                    {new Date(l.created_at).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-primary border border-border">
                                                    {l.user_name?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">{l.user_name || t.admin.system}</p>
                                                    {l.user_role && (
                                                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">
                                                            {l.user_role === 'admin' ? t.profile.roles.admin : l.user_role === 'reader' ? t.profile.roles.reader : t.profile.roles.student}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 whitespace-nowrap">
                                            <span className="text-xs bg-muted text-foreground px-2 py-1 rounded-md font-mono border border-border">
                                                {l.action}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 text-xs font-medium text-muted-foreground capitalize whitespace-nowrap">{l.entity_type || '—'}</td>
                                        <td className="py-4 px-5 text-xs text-gray-500 max-w-[250px] truncate" title={l.description}>{l.description || '—'}</td>
                                        <td className="py-4 px-5 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${l.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                                l.status === 'failed' ? 'bg-rose-500/10 text-rose-400' :
                                                    'bg-amber-500/10 text-amber-400'
                                                }`}>
                                                {l.status === 'success' ? t.admin.logStatusSuccess : l.status === 'failed' ? t.admin.logStatusFailed : t.admin.logStatusPending}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 text-xs text-muted-foreground/60 font-mono">{l.ip_address || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-5 border-t border-gray-50 bg-gray-50/20">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg h-9 font-bold border-border bg-card text-foreground">
                            {t.admin.previous}
                        </Button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-600">{t.admin.paginationPage} {page}</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-sm text-gray-400">{totalPages}</span>
                        </div>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg h-9 font-bold border-border bg-card text-foreground">
                            {t.admin.next}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
