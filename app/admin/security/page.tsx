'use client'

import { useState, useEffect } from 'react'
import { Shield, Lock, Unlock, AlertTriangle, CheckCircle, User, Clock, Monitor, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'

export default function AdminSecurityPage() {
    const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
    const isAr = t.locale === 'ar'
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/security')
            if (res.ok) setData(await res.json())
        } finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleUnlock = async (userId: string, action: 'unlock' | 'lock') => {
        setActionLoading(userId)
        try {
            await fetch('/api/admin/security', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action })
            })
            await load()
        } finally { setActionLoading(null) }
    }

    if (loading) return (
        <div className="flex justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#1B5E3B]" />
        </div>
    )

    const stats = data?.stats || {}

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-[#1B5E3B]" />
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t.admin.securityCenter}</h1>
                    <p className="text-muted-foreground text-sm">{t.admin.securityCenterDesc}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: t.admin.loginsToday, value: stats.logins_today || 0, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' },
                    { label: t.admin.failedToday, value: stats.failed_today || 0, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20' },
                    { label: t.admin.failedWeek, value: stats.failed_week || 0, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' },
                    { label: t.admin.lockedAccounts, value: stats.locked_accounts || 0, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100/50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20' },
                    { label: t.admin.activeAccounts, value: stats.active_accounts || 0, color: 'text-[#1B5E3B] dark:text-emerald-500', bg: 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} border rounded-2xl p-5 text-center shadow-sm`}>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Locked Accounts */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-border bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Lock className="w-5 h-5 text-red-500" />
                        <h2 className="font-bold text-foreground">{t.admin.lockedAccounts}</h2>
                    </div>
                    {(data?.lockedAccounts?.length || 0) > 0 && (
                        <span className="bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">
                            {data.lockedAccounts.length} {t.admin.accountsCount}
                        </span>
                    )}
                </div>
                {!data?.lockedAccounts?.length ? (
                    <div className="px-6 py-16 text-center">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="text-muted-foreground font-medium">{t.admin.allAccountsSecure}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                            <tr>
                                {[t.admin.logUser, t.auth.role, t.admin.lockedAt, t.admin.attempts, t.admin.action]
                                    .map(h => <th key={h} className="px-5 py-4 font-bold text-start whitespace-nowrap">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.lockedAccounts.map((acc: any) => (
                                <tr key={acc.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-red-500 border border-border">
                                                {acc.name?.[0] || <User className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">{acc.name}</p>
                                                <p className="text-xs text-muted-foreground">{acc.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${acc.role === 'admin' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                                            acc.role === 'reader' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                            }`}>
                                            {acc.role === 'admin' ? t.admin.adminRole :
                                                acc.role === 'reader' ? (t.reader?.readerLabel || t.auth.reader) :
                                                    (t.student?.studentLabel || t.auth.student)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(acc.locked_at).toLocaleString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className="font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-100 dark:border-red-500/20">{acc.failed_attempts}</span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleUnlock(acc.id, 'unlock')}
                                            disabled={!!actionLoading}
                                            className="border-emerald-100 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 font-bold rounded-lg h-8 gap-1.5"
                                        >
                                            {actionLoading === acc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
                                            {t.admin.unlockBtn}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Failed Login Attempts */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <h2 className="font-semibold text-foreground">{t.admin.failedLoginAttempts}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                {[t.admin.logUser, t.admin.detailsLabel, t.admin.ipAddressLabel, t.admin.timeLabel]
                                    .map(h => <th key={h} className="px-4 py-3 text-muted-foreground font-medium text-start whitespace-nowrap">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {(data?.failedLogins || []).slice(0, 20).map((log: any) => (
                                <tr key={log.id} className="hover:bg-red-500/10">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-foreground">{log.user_name || '—'}</p>
                                        <p className="text-xs text-muted-foreground">{log.user_email || '—'}</p>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{log.description || '—'}</td>
                                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{log.ip_address || '—'}</td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(log.created_at).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Successful Logins */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                    <User className="w-5 h-5 text-green-500" />
                    <h2 className="font-semibold text-foreground">{t.admin.recentSuccessfulLogins}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                {[t.admin.logUser, t.auth.role, t.admin.ipAddressLabel, t.admin.timeLabel]
                                    .map(h => <th key={h} className="px-4 py-3 text-muted-foreground font-medium text-start whitespace-nowrap">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {(data?.recentLogins || []).map((log: any) => (
                                <tr key={log.id} className="hover:bg-green-500/10">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-foreground">{log.user_name || '—'}</p>
                                        <p className="text-xs text-muted-foreground">{log.user_email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${log.user_role === 'admin' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : log.user_role === 'reader' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-muted text-muted-foreground border border-border'}`}>
                                            {log.user_role === 'admin' ? t.auth.admin : log.user_role === 'reader' ? t.auth.reader : t.auth.student}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ip_address || '—'}</td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(log.created_at).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
