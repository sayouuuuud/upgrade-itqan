'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Database, Download, Upload, RefreshCcw, Loader2, CheckCircle,
    AlertTriangle, Archive, Settings2, Palette,
} from 'lucide-react'
import { SettingsSkeleton } from '@/components/ui/skeletons'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'
import { parseBackup, backupFilename, type BackupKind } from '@/lib/admin/backup'

type Msg = { type: 'success' | 'error'; text: string }

export default function AdminBackupPage() {
    const { t } = useI18n()
    const lang = t.admin
    const isAr = t.locale === 'ar'

    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState<string | null>(null)
    const [messages, setMessages] = useState<Msg[]>([])

    const loadStats = async () => {
        try {
            const res = await fetch('/api/admin/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stats' }),
            })
            if (res.ok) setStats(await res.json())
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadStats() }, [])

    const addMsg = (type: Msg['type'], text: string) => {
        setMessages(p => [{ type, text }, ...p].slice(0, 5))
        setTimeout(() => setMessages(p => p.slice(0, -1)), 6000)
    }

    // Localized label for a detected backup kind.
    const kindLabel = (kind: BackupKind): string =>
        kind === 'database' ? lang.bkKindDatabase
            : kind === 'settings' ? lang.bkKindSettings
                : lang.bkKindTheme

    // ── Export ────────────────────────────────────────────────────────────────
    const triggerDownload = (blob: Blob, kind: BackupKind) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = backupFilename(kind)
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleExport = async (kind: BackupKind) => {
        setBusy(`export-${kind}`)
        try {
            let res: Response
            if (kind === 'database') {
                res = await fetch('/api/admin/backup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'export' }),
                })
            } else if (kind === 'settings') {
                res = await fetch('/api/admin/settings/backup')
            } else {
                res = await fetch('/api/admin/theme/backup')
            }
            if (!res.ok) throw new Error()
            triggerDownload(await res.blob(), kind)
            addMsg('success', lang.bkExportSuccess)
        } catch {
            addMsg('error', lang.bkExportFailed)
        } finally {
            setBusy(null)
        }
    }

    // ── Import (with smart client-side validation) ──────────────────────────────
    const handleImport = async (kind: BackupKind, file: File) => {
        setBusy(`import-${kind}`)
        try {
            const raw = await file.text()

            // 1) Validate the file kind BEFORE sending anything to the server.
            const parsed = parseBackup(raw, kind)
            if (!parsed.ok) {
                if (parsed.reason === 'invalid_json') {
                    addMsg('error', lang.bkInvalidFile)
                } else if (parsed.reason === 'not_backup') {
                    addMsg('error', lang.bkNotBackupFile)
                } else if (parsed.reason === 'wrong_kind' && parsed.detectedKind) {
                    const detected = kindLabel(parsed.detectedKind)
                    const tmpl =
                        kind === 'database' ? lang.bkWrongKindDatabase
                            : kind === 'settings' ? lang.bkWrongKindSettings
                                : lang.bkWrongKindTheme
                    addMsg('error', tmpl.replace('{kind}', detected))
                }
                return
            }

            if (!confirm(lang.bkImportConfirm)) return

            // 2) Send the raw file to the matching endpoint (server re-validates).
            const endpoint =
                kind === 'database' ? '/api/admin/backup'
                    : kind === 'settings' ? '/api/admin/settings/backup'
                        : '/api/admin/theme/backup'
            const payload =
                kind === 'database' ? { action: 'restore', raw } : { raw }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json().catch(() => ({}))

            if (res.ok) {
                addMsg('success', data.message || lang.bkImportSuccess)
                await loadStats()
            } else if (data?.error === 'INVALID_BACKUP') {
                addMsg('error', lang.bkNotBackupFile)
            } else {
                addMsg('error', data?.error || lang.bkImportFailed)
            }
        } catch {
            addMsg('error', lang.bkReadError)
        } finally {
            setBusy(null)
        }
    }

    if (loading) return <SettingsSkeleton />

    const tableRows = [
        { label: lang.bkUsers, key: 'users' },
        { label: lang.bkRecitations, key: 'recitations' },
        { label: lang.bkBookings, key: 'bookings' },
        { label: lang.bkReviews, key: 'reviews' },
        { label: lang.bkNotifications, key: 'notifications' },
        { label: lang.bkMessages, key: 'messages' },
        { label: lang.bkAnnouncements, key: 'announcements' },
        { label: lang.bkEmailTemplates, key: 'email_templates' },
    ]

    const sections: {
        kind: BackupKind
        title: string
        desc: string
        icon: React.ReactNode
        accent: string
    }[] = [
            {
                kind: 'database',
                title: lang.bkSectionDatabase,
                desc: lang.bkSectionDatabaseDesc,
                icon: <Database className="w-5 h-5" />,
                accent: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20',
            },
            {
                kind: 'settings',
                title: lang.bkSectionSettings,
                desc: lang.bkSectionSettingsDesc,
                icon: <Settings2 className="w-5 h-5" />,
                accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20',
            },
            {
                kind: 'theme',
                title: lang.bkSectionTheme,
                desc: lang.bkSectionThemeDesc,
                icon: <Palette className="w-5 h-5" />,
                accent: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20',
            },
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
                <div
                    key={i}
                    className={`flex items-center gap-3 p-4 rounded-xl border ${m.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-500/10 dark:border-green-900 dark:text-green-300'
                            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-900 dark:text-red-300'
                        }`}
                >
                    {m.type === 'success'
                        ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                    <p className="text-sm font-medium">{m.text}</p>
                </div>
            ))}

            {/* DB stats */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6" dir={isAr ? 'rtl' : 'ltr'}>
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-500" />
                        <h2 className="font-semibold text-foreground">{lang.bkDbStats}</h2>
                    </div>
                    <Button
                        onClick={() => { setLoading(true); loadStats() }}
                        variant="outline"
                        size="sm"
                        className="border-border hover:bg-muted"
                    >
                        <RefreshCcw className="w-4 h-4 me-2" />
                        {lang.bkRefresh}
                    </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {tableRows.map(row => (
                        <div key={row.key} className="bg-muted rounded-lg p-3 text-center">
                            <p className="text-xl font-bold text-foreground">
                                {(stats?.tables?.[row.key] || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{row.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Backup sections — each with Export + Import */}
            <div className="space-y-4">
                {sections.map(section => (
                    <BackupSection
                        key={section.kind}
                        section={section}
                        busy={busy}
                        lang={lang}
                        onExport={() => handleExport(section.kind)}
                        onImport={(file) => handleImport(section.kind, file)}
                    />
                ))}
            </div>

            {/* Clear cache */}
            <div className="bg-card rounded-xl border border-amber-200 dark:border-amber-900 shadow-sm p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg flex items-center justify-center">
                            <RefreshCcw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">{lang.bkClearCache}</p>
                            <p className="text-xs text-muted-foreground">{lang.bkClearCacheDesc}</p>
                        </div>
                    </div>
                    <Button
                        onClick={async () => {
                            setBusy('clear_cache')
                            try {
                                const res = await fetch('/api/admin/backup', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'clear_cache' }),
                                })
                                const d = await res.json()
                                addMsg(res.ok ? 'success' : 'error', d.message || lang.bkClearCacheSuccess)
                            } finally { setBusy(null) }
                        }}
                        disabled={busy === 'clear_cache'}
                        variant="outline"
                        className="border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                    >
                        {busy === 'clear_cache'
                            ? <Loader2 className="w-4 h-4 animate-spin me-2" />
                            : <RefreshCcw className="w-4 h-4 me-2" />}
                        {lang.bkClearCacheNow}
                    </Button>
                </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-500/10 border border-amber-200 dark:border-amber-900 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700 dark:text-amber-300 text-sm">{lang.bkWarning}</p>
            </div>
        </div>
    )
}

// ── Single backup section card (Export + Import) ────────────────────────────
function BackupSection({
    section, busy, lang, onExport, onImport,
}: {
    section: { kind: BackupKind; title: string; desc: string; icon: React.ReactNode; accent: string }
    busy: string | null
    lang: any
    onExport: () => void
    onImport: (file: File) => void
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    const exporting = busy === `export-${section.kind}`
    const importing = busy === `import-${section.kind}`

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${section.accent}`}>
                    {section.icon}
                </div>
                <div>
                    <p className="font-semibold text-foreground">{section.title}</p>
                    <p className="text-xs text-muted-foreground">{section.desc}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                    onClick={onExport}
                    disabled={exporting || importing}
                    variant="outline"
                    className="w-full border-border hover:bg-muted"
                >
                    {exporting
                        ? <Loader2 className="w-4 h-4 animate-spin me-2" />
                        : <Download className="w-4 h-4 me-2" />}
                    {exporting ? lang.bkExporting : lang.bkExport}
                </Button>

                <div className="relative">
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".json,application/json"
                        onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) onImport(f)
                            e.target.value = '' // allow re-selecting the same file
                        }}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        disabled={exporting || importing}
                    />
                    <Button
                        disabled={exporting || importing}
                        className="w-full bg-[#1B5E3B] hover:bg-[#164d31] text-white pointer-events-none"
                    >
                        {importing
                            ? <Loader2 className="w-4 h-4 animate-spin me-2" />
                            : <Upload className="w-4 h-4 me-2" />}
                        {importing ? lang.bkImporting : lang.bkImport}
                    </Button>
                </div>
            </div>
        </div>
    )
}
