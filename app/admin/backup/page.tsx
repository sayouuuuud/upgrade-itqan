'use client'

import { useState, useEffect } from 'react'
import { Database, Download, Trash2, RefreshCcw, Loader2, CheckCircle, AlertTriangle, Archive } from 'lucide-react'
import { SettingsSkeleton } from '@/components/ui/skeletons'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'

export default function AdminBackupPage() {
    const { t } = useI18n()
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
                addMsg('success', isAr ? 'تم تصدير النسخة الاحتياطية بنجاح' : 'Backup exported successfully')
            }
        } catch { addMsg('error', isAr ? 'فشل التصدير' : 'Export failed') }
        finally { setActionLoading(null) }
    }

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!confirm(isAr ? 'هل أنت متأكد من استرداد البيانات؟ قد يؤدي ذلك لتكرار بعض السجلات.' : 'Are you sure you want to restore data? This might cause duplicate records.')) return

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
                        addMsg('success', data.message || (isAr ? 'تم استرداد البيانات بنجاح' : 'Data restored successfully'))
                        await loadStats()
                    } else {
                        addMsg('error', data.error || (isAr ? 'فشل استرداد البيانات' : 'Restore failed'))
                    }
                } catch {
                    addMsg('error', isAr ? 'ملف غير صالح' : 'Invalid file format')
                } finally {
                    setActionLoading(null)
                }
            }
            reader.readAsText(file)
        } catch {
            addMsg('error', isAr ? 'خطأ في قراءة الملف' : 'Error reading file')
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
                addMsg('error', data.error || (isAr ? 'حدث خطأ' : 'Error occurred'))
            }
        } finally { setActionLoading(null) }
    }

    if (loading) return <SettingsSkeleton />

    const tableRows: { label: string, key: string }[] = [
        { label: isAr ? 'المستخدمون' : 'Users', key: 'users' },
        { label: isAr ? 'التلاوات' : 'Recitations', key: 'recitations' },
        { label: isAr ? 'الجلسات' : 'Bookings', key: 'bookings' },
        { label: isAr ? 'المراجعات' : 'Reviews', key: 'reviews' },
        { label: isAr ? 'الإشعارات' : 'Notifications', key: 'notifications' },
        { label: isAr ? 'سجل الأنشطة' : 'Activity Logs', key: 'activity_logs' },
        { label: isAr ? 'زيارات الصفحات' : 'Page Views', key: 'page_views' },
        { label: isAr ? 'الرسائل' : 'Messages', key: 'messages' },
        { label: isAr ? 'الإعلانات' : 'Announcements', key: 'announcements' },
        { label: isAr ? 'قوالب البريد' : 'Email Templates', key: 'email_templates' },
    ]

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex items-center gap-3">
                <Archive className="w-8 h-8 text-[#1B5E3B]" />
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{isAr ? 'النسخ الاحتياطي وإدارة البيانات' : 'Backup & Data Management'}</h1>
                    <p className="text-muted-foreground text-sm">{isAr ? 'تصدير واستيراد البيانات وإدارة التخزين' : 'Export, import data and manage storage'}</p>
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
                    <h2 className="font-semibold text-foreground">{isAr ? 'إحصائيات قاعدة البيانات' : 'Database Statistics'}</h2>
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
                            <p className="font-semibold text-foreground">{isAr ? 'تصدير البيانات' : 'Export Data'}</p>
                            <p className="text-xs text-muted-foreground">{isAr ? 'تنزيل JSON كامل للبيانات' : 'Download full JSON dump'}</p>
                        </div>
                    </div>
                    <Button onClick={handleExport} disabled={actionLoading === 'export'} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                        {actionLoading === 'export' ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Download className="w-4 h-4 me-2" />}
                        {isAr ? 'تصدير الآن' : 'Export Now'}
                    </Button>
                </div>

                {/* Refresh Stats */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <RefreshCcw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">{isAr ? 'تحديث الإحصائيات' : 'Refresh Stats'}</p>
                            <p className="text-xs text-muted-foreground">{isAr ? 'إعادة تحميل بيانات قاعدة البيانات' : 'Reload database statistics'}</p>
                        </div>
                    </div>
                    <Button onClick={() => { setLoading(true); loadStats() }} variant="outline" className="w-full border-border hover:bg-muted">
                        <RefreshCcw className="w-4 h-4 me-2" />
                        {isAr ? 'تحديث' : 'Refresh'}
                    </Button>
                </div>

                {/* Restore Data */}
                <div className="bg-card rounded-xl border border-blue-200 dark:border-blue-900 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <RefreshCcw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">{isAr ? 'استرداد البيانات' : 'Restore Data'}</p>
                            <p className="text-xs text-muted-foreground">{isAr ? 'رفع ملف JSON لاستعادة البيانات' : 'Upload JSON file to restore'}</p>
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
                            {isAr ? 'رفع واستيراد' : 'Upload & Import'}
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
                            <p className="font-semibold text-foreground">{isAr ? 'تفريغ الكاش' : 'Clear Cache'}</p>
                            <p className="text-xs text-muted-foreground">{isAr ? 'تحديث الموقع وإعادة تحميل البيانات' : 'Refresh site and reload content'}</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => handleAction('clear_cache', isAr ? 'تم تفريغ الكاش بنجاح' : 'Cache cleared successfully', '')}
                        disabled={actionLoading === 'clear_cache'}
                        variant="outline"
                        className="w-full border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                    >
                        {actionLoading === 'clear_cache' ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <RefreshCcw className="w-4 h-4 me-2" />}
                        {isAr ? 'مسح الكاش الآن' : 'Clear Cache Now'}
                    </Button>
                </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-500/10 border border-amber-200 dark:border-amber-900 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                    {isAr
                        ? 'تحذير: عمليات المسح لا يمكن التراجع عنها. تأكد من وجود نسخة احتياطية قبل المتابعة.'
                        : 'Warning: Deletion operations cannot be undone. Make sure you have a backup before proceeding.'}
                </p>
            </div>
        </div >
    )
}
