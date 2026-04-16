"use client"

import { useState, useEffect } from 'react'
import { Shield, Search, Save, AlertTriangle, BookOpen, GraduationCap, Loader2 } from 'lucide-react'

interface UserAccess {
    id: string
    name: string
    email: string
    role: string
    has_quran_access: boolean
    has_academy_access: boolean
    platform_preference: string
}

export default function AccessControlPage() {
    const [users, setUsers] = useState<UserAccess[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [saving, setSaving] = useState<string | null>(null)
    const [toast, setToast] = useState('')

    useEffect(() => { fetchUsers() }, [])

    async function fetchUsers() {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data.users || [])
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    async function toggleAccess(userId: string, field: 'has_quran_access' | 'has_academy_access', currentValue: boolean) {
        setSaving(userId)
        try {
            const res = await fetch(`/api/admin/users/${userId}/access`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: !currentValue }),
            })
            if (res.ok) {
                setUsers(prev => prev.map(u =>
                    u.id === userId ? { ...u, [field]: !currentValue } : u
                ))
                setToast('تم تحديث الصلاحيات بنجاح')
                setTimeout(() => setToast(''), 3000)
            } else {
                setToast('فشل التحديث')
                setTimeout(() => setToast(''), 3000)
            }
        } catch (err) {
            console.error(err)
            setToast('فشل التحديث')
            setTimeout(() => setToast(''), 3000)
        }
        finally { setSaving(null) }
    }

    const filtered = search
        ? users.filter(u => u.name.includes(search) || u.email.includes(search))
        : users

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Shield className="w-6 h-6 text-blue-500" />
                    التحكم بالوصول
                </h1>
                <p className="text-sm text-muted-foreground mt-1">إدارة صلاحيات وصول المستخدمين للمنصات</p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="بحث بالاسم أو البريد..."
                    className="w-full pr-10 pl-4 py-2 bg-secondary/20 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4 text-emerald-500" />المقرأة</span>
                <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4 text-blue-500" />الأكاديمية</span>
            </div>

            {/* Users Table */}
            {loading ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
                </div>
            ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-right p-3 font-medium text-muted-foreground">المستخدم</th>
                                    <th className="text-center p-3 font-medium text-muted-foreground">الدور</th>
                                    <th className="text-center p-3 font-medium text-muted-foreground">
                                        <BookOpen className="w-4 h-4 inline text-emerald-500 ml-1" />المقرأة
                                    </th>
                                    <th className="text-center p-3 font-medium text-muted-foreground">
                                        <GraduationCap className="w-4 h-4 inline text-blue-500 ml-1" />الأكاديمية
                                    </th>
                                    <th className="text-center p-3 font-medium text-muted-foreground">التفضيل</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(user => (
                                    <tr key={user.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                        <td className="p-3">
                                            <p className="font-medium text-foreground">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="px-2 py-1 text-xs rounded-full bg-muted text-foreground">{user.role}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => toggleAccess(user.id, 'has_quran_access', user.has_quran_access)}
                                                disabled={saving === user.id}
                                                className={`relative w-12 h-6 rounded-full transition-colors ${user.has_quran_access ? 'bg-emerald-500' : 'bg-muted'}`}
                                            >
                                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${user.has_quran_access ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => toggleAccess(user.id, 'has_academy_access', user.has_academy_access)}
                                                disabled={saving === user.id}
                                                className={`relative w-12 h-6 rounded-full transition-colors ${user.has_academy_access ? 'bg-blue-500' : 'bg-muted'}`}
                                            >
                                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${user.has_academy_access ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </td>
                                        <td className="p-3 text-center text-xs text-muted-foreground">{user.platform_preference || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">لا توجد نتائج</div>
                    )}
                </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">تنبيه</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">تغيير صلاحيات الوصول سيؤثر فوراً على ما يراه المستخدم في لوحة التحكم عند تسجيل دخوله التالي.</p>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-foreground text-background rounded-xl shadow-xl text-sm font-medium z-50 animate-in fade-in slide-in-from-bottom-2">
                    {toast}
                </div>
            )}
        </div>
    )
}
