'use client'

import { useState, useEffect } from 'react'
import { Database, Download, Trash2, RefreshCcw, Loader2, CheckCircle, AlertTriangle, Archive } from 'lucide-react'
import { SettingsSkeleton } from '@/components/ui/skeletons'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'

export default function AdminBackupPage() {
    const { t } = useI18n()
    const lang = t.admin
    const isAr = t.locale === 'ar'

    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [messages, setMessages] = useState<{ type: 'success' | 'error', text: string }[]>([])

    const loadStats = async () => {
        try {
            const res = await fetch('/api/admin/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stats' }) })
            if (res.ok) setStats(await res.json())
        } finally { setLoading(false) }
    }

    useEffect(() => { loadStats() }, [])

    const addMsg = (type: 'success' | 'error', text: string) => {
        setMessages(p => [{ type, text }, ...p].slice(0, 5))
        setTimeout(() => setMessages(p => p.slice(1)), 5000)
    }

    const handleExport = async () => {
        setActionLoading('export')
        try {
            const res = await fetch('/api/admin/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'export' }) })
            if (res.ok) {
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `itqaan-backup-${new Date().toISOString().split('T')[0]}.json`
                a.click()
                URL.revokeObjectURL(url)
                addMsg('success', lang.bkExportSuccess)
            }
        } catch { addMsg('error', lang.bkExportFailed) }
        finally { setActionLoading(null) }
    }

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!confirm(lang.bkRestoreConfirm)) return

        setActionLoading('restore')
        try {
            const reader = new FileReader()
            reader.onload = async (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string)
                    const res = await fetch('/api/admin/backup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'restore', data: json })
                    })
                    const data = await res.json()
                    if (res.ok) {
                        addMsg('success', data.message || lang.bkRestoreSuccess)
                        await loadStats()
                    } else {
                        addMsg('error', data.error || lang.bkRestoreFailed)
                    }
                } catch {
                    addMsg('error', lang.bkInvalidFile)
                } finally {
                    setActionLoading(null)
                }
            }
            reader.readAsText(file)
        } catch {
            addMsg('error', lang.bkReadError)
            setActionLoading(null)
        }
    }

    const handleAction = async (action: string, label: string, confirmMsg: string) => {
        if (confirmMsg && !confirm(confirmMsg)) return
        setActionLoading(action)
        try {
            const res = await fetch('/api/admin/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
            const data = await res.json()
            if (res.ok) {
                addMsg('success', data.message || label)
                await loadStats()
            } else {
                addMsg('error', data.error || lang.bkErrorOccurred)
            }
        } finally { setActionLoading(null) }
    }

    if (loading) return <SettingsSkeleton />

    const tableRows: { label: string, key: string }[] = [
        { label: lang.bkUsers, key: 'users' },
        { label: lang.bkRecitations, key: 'recitations' },
        { label: lang.bkBookings, key: 'bookings' },
        { label: lang.bkReviews, key: 'reviews' },
        { label: lang.bkNotifications, key: 'notifications' },
        { label: lang.bkActivityLogs, key: 'activity_logs' },
        { label: lang.bkPageViews, key: 'page_views' },
        { label: lang.bkMessages, key: 'messages' },
        { label: lang.bkAnnouncements, key: 'announcements' },
        { label: lang.bkEmailTemplates, key: 'email_templates' },
    ]

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex items-center gap-3">
                <Archive className="w-8 h-8 text-[#1B5E3B]" />
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{lang.bkTitle}</h1>
                    <p className="text-muted-foreground text-sm">{lang.bkDesc}</p>
                </div>
            </div>

            {/* Messages */}
            {messages.map((m, i) => (
                <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border ${m.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {m.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                    <p className="text-sm font-medium">{m.text}</p>
                </div>
            ))}

            {/* DB Size + Stats */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 font-arabic" dir={isAr ? 'rtl' : 'ltr'}>
                <div className="flex items-center gap-2 mb-5">
                    <Database className="w-5 h-5 text-blue-500" />
                    <h2 className="font-semibold text-foreground">{lang.bkDbStats}</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {tableRows.map(row => (
                        <div key={row.key} className="bg-muted rounded-lg p-3 text-center">
                            <p className="text-xl font-bold text-foreground">{(stats?.tables?.[row.key] || 0).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground mt-1">{row.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">{lang.bkExportData}</p>
                            <p className="text-xs text-muted-foreground">{lang.bkExportDataDesc}</p>
                        </div>
                    </div>
                    <Button onClick={handleExport} disabled={actionLoading === 'export'} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                        {actionLoading === 'export' ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Download className="w-4 h-4 me-2" />}
                        {lang.bkExportNow}
                    </Button>
                </div>

                {/* Refresh Stats */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <RefreshCcw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">{lang.bkRefreshStats}</p>
                            <p className="text-xs text-muted-foreground">{lang.bkRefreshStatsDesc}</p>
                        </div>
                    </div>
                    <Button onClick={() => { setLoading(true); loadStats() }} variant="outline" className="w-full border-border hover:bg-muted">
                        <RefreshCcw className="w-4 h-4 me-2" />
                        {lang.bkRefresh}
                    </Button>
                </div>

                {/* Restore Data */}
                <div className="bg-card rounded-xl border border-blue-200 dark:border-blue-900 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <RefreshCcw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">{lang.bkRestoreData}</p>
                            <p className="text-xs text-muted-foreground">{lang.bkRestoreDataDesc}</p>
                        </div>
                    </div>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleRestore}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={actionLoading === 'restore'}
                        />
                        <Button disabled={actionLoading === 'restore'} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            {actionLoading === 'restore' ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <RefreshCcw className="w-4 h-4 me-2" />}
                            {lang.bkUploadImport}
                        </Button>
                    </div>
                </div>

                {/* Clear Cache */}
                <div className="bg-card rounded-xl border border-amber-200 dark:border-amber-900 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg flex items-center justify-center">
                            <RefreshCcw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">{lang.bkClearCache}</p>
                            <p className="text-xs text-muted-foreground">{lang.bkClearCacheDesc}</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => handleAction('clear_cache', lang.bkClearCacheSuccess, '')}
                        disabled={actionLoading === 'clear_cache'}
                        variant="outline"
                        className="w-full border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                    >
                        {actionLoading === 'clear_cache' ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <RefreshCcw className="w-4 h-4 me-2" />}
                        {lang.bkClearCacheNow}
                    </Button>
                </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-500/10 border border-amber-200 dark:border-amber-900 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                    {lang.bkWarning}
                </p>
            </div>
        </div >
    )
}
