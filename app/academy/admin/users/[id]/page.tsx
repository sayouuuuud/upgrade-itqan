"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    Activity,
    AlertCircle,
    Award,
    BarChart3,
    BookMarked,
    BookOpen,
    Calendar,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Flame,
    Globe,
    Info,
    Laptop,
    Loader2,
    Mail,
    MessageSquare,
    Phone,
    Shield,
    Sparkles,
    Star,
    Trash2,
    Trophy,
    User as UserIcon,
    Users as UsersIcon,
    UserCheck,
    UserPlus,
    Plus,
    X,
    XCircle,
} from "lucide-react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts'
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type AcademyUserData = {
    user: {
        id: string
        name: string
        email: string | null
        phone: string | null
        role: string
        avatar_url: string | null
        bio: string | null
        is_active: boolean | null
        created_at: string
        last_login_at: string | null
        user_city: string | null
        is_online: boolean
        has_quran_access: boolean | null
        has_academy_access: boolean | null
        platform_preference: string | null
        academy_roles: string[] | null
        halaqah_id: string | null
        halaqah_name: string | null
        halaqah_teacher_name: string | null
        approval_status: string | null
    }
    points: {
        total: number
        level: string
        streak_days: number
        longest_streak: number
        last_activity: string | null
        badges_count: number
    }
    roleMetrics: any
    history: any[]
    activityData: { date: string; count: number }[]
    lastSession: { ip_address: string | null; user_agent: string | null; last_active_at: string | null } | null
    country: string | null
}

const SPECIALIZATIONS = [
    { key: 'sira',    label: 'السيرة النبوية' },
    { key: 'fiqh',    label: 'الفقه' },
    { key: 'aqeedah', label: 'العقيدة' },
    { key: 'tajweed', label: 'التجويد' },
    { key: 'tafseer', label: 'التفسير' },
    { key: 'arabic',  label: 'اللغة العربية' },
]

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { t } = useI18n()
    const router = useRouter()
    const isAr = t.locale === "ar"
    const [data, setData] = useState<AcademyUserData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("info")
    const [isDeleting, setIsDeleting] = useState(false)
    const [isUpdatingAccess, setIsUpdatingAccess] = useState(false)
    const [userSpecs, setUserSpecs] = useState<{ specialization: string; set_by: string }[]>([])
    const [specSaving, setSpecSaving] = useState<string | null>(null)
    const { id } = use(params)

    const toggleAdminSpec = async (key: string) => {
        const existing = userSpecs.find(s => s.specialization === key)
        setSpecSaving(key)
        try {
            if (existing) {
                await fetch(`/api/admin/users/${id}/specializations`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ specialization: key }),
                })
                setUserSpecs(prev => prev.filter(s => s.specialization !== key))
            } else {
                await fetch(`/api/admin/users/${id}/specializations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ specialization: key }),
                })
                setUserSpecs(prev => [...prev, { specialization: key, set_by: 'admin' }])
            }
        } finally {
            setSpecSaving(null)
        }
    }

    const handleAccessUpdate = async (
        field: 'has_quran_access' | 'has_academy_access' | 'platform_preference',
        value: any,
    ) => {
        if (!data) return
        setIsUpdatingAccess(true)
        try {
            const res = await fetch(`/api/admin/users/${id}/access`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            })
            if (!res.ok) throw new Error(t.admin.errorUpdatingUser || "Failed to update access")

            setData({
                ...data,
                user: { ...data.user, [field]: value }
            })
        } catch (err: any) {
            alert(err.message)
        } finally {
            setIsUpdatingAccess(false)
        }
    }

    const handleDeleteUser = async () => {
        if (!window.confirm(isAr ? "هل أنت متأكد من حذف هذا المستخدم نهائياً؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to permanently delete this user? This action cannot be undone.")) {
            return
        }
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error(t.admin.failedToDeleteUser || "Failed to delete user")
            router.push('/academy/admin/users')
        } catch (err: any) {
            alert(err.message)
            setIsDeleting(false)
        }
    }

    useEffect(() => {
        async function fetchData() {
            try {
                const [userRes, specsRes] = await Promise.all([
                    fetch(`/api/academy/admin/users/${id}`),
                    fetch(`/api/admin/users/${id}/specializations`),
                ])
                if (!userRes.ok) throw new Error(t.admin.failedToLoadData)
                const [json, specsJson] = await Promise.all([
                    userRes.json(),
                    specsRes.ok ? specsRes.json() : { specializations: [] },
                ])
                setData(json)
                setUserSpecs(specsJson.specializations || [])
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id, t.admin.failedToLoadData])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">{t.loading}</p>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-destructive">
                <AlertCircle className="w-12 h-12" />
                <p className="text-lg font-bold">{error || t.admin.userNotFound}</p>
                <Button onClick={() => router.back()} variant="outline">{t.back}</Button>
            </div>
        )
    }

    const { user, points, roleMetrics } = data

    const roleLabel = (role: string): string => {
        switch (role) {
            case 'student':            return (t.student.studentLabel || t.auth.student)
            case 'teacher':            return (t.auth.teacher || 'Teacher')
            case 'parent':             return (t.auth.parent || 'Parent')
            case 'reader':             return (t.reader.readerLabel || t.auth.reader)
            case 'student_supervisor': return (t.auth.studentSupervisor || 'Student Supervisor')
            case 'reciter_supervisor': return (t.auth.reciterSupervisor || 'Reciter Supervisor')
            case 'admin':              return t.auth.admin
            case 'academy_admin':      return isAr ? 'أدمن الأكاديمية' : 'Academy Admin'
            default:                   return role
        }
    }

    const approvalBadge = () => {
        if (user.role !== 'teacher' || !user.approval_status) return null
        const map: Record<string, { label: string; cls: string }> = {
            approved:         { label: isAr ? 'مدرّس موافق عليه'   : 'Approved',         cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
            pending_approval: { label: isAr ? 'قيد المراجعة'        : 'Pending Approval', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' },
            rejected:         { label: isAr ? 'مرفوض'              : 'Rejected',         cls: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30' },
            auto_approved:    { label: isAr ? 'موافق تلقائي'        : 'Auto-Approved',    cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
        }
        const e = map[user.approval_status]
        if (!e) return null
        return (
            <Badge variant="outline" className={`px-3 py-1 font-bold border ${e.cls}`}>{e.label}</Badge>
        )
    }

    const formatDate = (d: string | null | undefined) =>
        d ? new Date(d).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : '---'

    const statCards: { label: string; value: number | string; icon: any; color: string; bg: string }[] = []
    if (user.role === 'student') {
        statCards.push(
            { label: isAr ? 'الدورات المسجَّلة' : 'Enrolled Courses', value: roleMetrics?.enrollments?.total ?? 0,         icon: BookOpen,    color: 'text-blue-500',    bg: 'bg-blue-500/10' },
            { label: isAr ? 'دورات مكتملة'      : 'Completed Courses', value: roleMetrics?.enrollments?.completed ?? 0,    icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: isAr ? 'دروس مكتملة'       : 'Lessons Completed', value: roleMetrics?.lessons?.completed ?? 0,        icon: BookMarked,   color: 'text-violet-500',  bg: 'bg-violet-500/10' },
            { label: isAr ? 'مهام مُنجزة'        : 'Tasks Completed',   value: roleMetrics?.tasks?.completed ?? 0,          icon: ClipboardList, color: 'text-amber-500',  bg: 'bg-amber-500/10' },
            { label: isAr ? 'مهام معلَّقة'        : 'Tasks Pending',     value: roleMetrics?.tasks?.pending ?? 0,            icon: AlertCircle,  color: 'text-orange-500',  bg: 'bg-orange-500/10' },
            { label: isAr ? 'حضور الجلسات'      : 'Sessions Attended', value: roleMetrics?.attendance?.present ?? 0,       icon: UserCheck,    color: 'text-cyan-500',    bg: 'bg-cyan-500/10' },
            { label: isAr ? 'مجموع النقاط'      : 'Total Points',      value: points.total,                                 icon: Trophy,       color: 'text-yellow-500',  bg: 'bg-yellow-500/10' },
            { label: isAr ? 'سلسلة أيام'        : 'Streak (days)',     value: points.streak_days,                           icon: Flame,        color: 'text-red-500',     bg: 'bg-red-500/10' },
            { label: isAr ? 'الشارات'           : 'Badges',            value: points.badges_count,                          icon: Award,        color: 'text-pink-500',    bg: 'bg-pink-500/10' },
        )
    } else if (user.role === 'teacher') {
        statCards.push(
            { label: isAr ? 'دورات يملكها'    : 'Courses Owned',   value: roleMetrics?.courses?.total ?? 0,      icon: BookOpen,       color: 'text-blue-500',    bg: 'bg-blue-500/10' },
            { label: isAr ? 'حلقات يديرها'    : 'Halaqat Managed', value: roleMetrics?.halaqat?.total ?? 0,      icon: UsersIcon,      color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: isAr ? 'طلاب يدرّسهم'    : 'Students Taught', value: roleMetrics?.students_taught ?? 0,     icon: UserCheck,      color: 'text-violet-500',  bg: 'bg-violet-500/10' },
            { label: isAr ? 'جلسات مجدولة'    : 'Sessions',        value: roleMetrics?.sessions?.total ?? 0,     icon: Calendar,       color: 'text-amber-500',   bg: 'bg-amber-500/10' },
            { label: isAr ? 'جلسات مكتملة'    : 'Sessions Done',   value: roleMetrics?.sessions?.completed ?? 0, icon: CheckCircle2,   color: 'text-cyan-500',    bg: 'bg-cyan-500/10' },
            { label: isAr ? 'مهام أنشأها'     : 'Tasks Assigned',  value: roleMetrics?.tasks_assigned ?? 0,      icon: ClipboardList,  color: 'text-orange-500',  bg: 'bg-orange-500/10' },
        )
    } else if (user.role === 'parent') {
        statCards.push(
            { label: isAr ? 'أبناء مرتبطون'    : 'Linked Children',   value: roleMetrics?.children?.active ?? 0,   icon: UsersIcon,      color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: isAr ? 'طلبات معلَّقة'    : 'Pending Requests',  value: roleMetrics?.children?.pending ?? 0,  icon: UserPlus,       color: 'text-amber-500',   bg: 'bg-amber-500/10' },
            { label: isAr ? 'طلبات مرفوضة'    : 'Rejected Requests', value: roleMetrics?.children?.rejected ?? 0, icon: XCircle,        color: 'text-red-500',     bg: 'bg-red-500/10' },
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <button onClick={() => router.push('/academy/admin/users')} className="hover:text-primary transition-colors">
                        {t.admin.users}
                    </button>
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                    <span className="font-bold text-foreground">{user.name}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Badge variant={user.is_active ? "default" : "destructive"} className="px-3 py-1 font-bold">
                        {user.is_active ? t.active : t.blocked}
                    </Badge>
                    {approvalBadge()}
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 font-bold px-4 rounded-xl h-9 border-primary/20 hover:bg-primary/5 hover:border-primary/50 text-foreground transition-all active:scale-95 shadow-sm"
                        onClick={() => router.push(`/academy/admin/conversations?userId=${id}&userRole=${user.role}`)}
                    >
                        <MessageSquare className="w-4 h-4 text-primary" />
                        {t.admin.messageUser || "Message User"}
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2 font-bold px-4 rounded-xl bg-destructive hover:bg-destructive/90 h-9 shadow-lg shadow-destructive/20 transition-all active:scale-95"
                        onClick={() => handleDeleteUser()}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        {t.admin.deleteUser || "Delete"}
                    </Button>
                </div>
            </div>

            {/* Profile Overview Card */}
            <Card className="border-border shadow-2xl shadow-black/5 bg-card/60 backdrop-blur-xl rounded-3xl overflow-hidden border">
                <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-start gap-6">
                            <div className="relative w-24 h-24 shrink-0 shadow-xl group">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-emerald-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                                <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-primary/5 to-emerald-500/5 flex items-center justify-center text-primary font-black text-4xl border border-primary/10 overflow-hidden backdrop-blur-sm">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        user.name.charAt(0)
                                    )}
                                </div>
                                {user.is_online && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-card" title={t.admin.onlineNow} />
                                )}
                            </div>
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <h2 className="text-2xl font-black text-foreground">{user.name}</h2>
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize font-black px-4 py-1 rounded-full">
                                        {roleLabel(user.role)}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-muted-foreground text-sm font-bold">
                                    <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-xl border border-border/50 backdrop-blur-sm"><Mail className="w-4 h-4 text-primary/70" /> {user.email || "---"}</span>
                                    {user.phone && <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-xl border border-border/50 backdrop-blur-sm"><Phone className="w-4 h-4 text-primary/70" /> {user.phone}</span>}
                                    <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-xl border border-border/50 backdrop-blur-sm">
                                        <Calendar className="w-4 h-4 text-primary/70" />
                                        {t.admin.joinDate}: {formatDate(user.created_at)}
                                    </span>
                                    {user.halaqah_name && (
                                        <span className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 backdrop-blur-sm text-emerald-700 dark:text-emerald-400">
                                            <UsersIcon className="w-4 h-4" /> {isAr ? 'الحلقة' : 'Halaqah'}: {user.halaqah_name}{user.halaqah_teacher_name ? ` — ${user.halaqah_teacher_name}` : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* TABS Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-muted/50 p-1.5 rounded-2xl flex w-full overflow-x-auto overflow-y-hidden hide-scrollbar justify-start mb-8 gap-2 border border-border/50 shadow-inner backdrop-blur-md shrink-0">
                    <TabsTrigger value="info" className="whitespace-nowrap shrink-0 rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg text-muted-foreground hover:text-foreground font-black gap-2 px-6 py-3 transition-all">
                        <Info className="w-4 h-4" />
                        {t.admin.basicInfo}
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="whitespace-nowrap shrink-0 rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg text-muted-foreground hover:text-foreground font-black gap-2 px-6 py-3 transition-all">
                        <BarChart3 className="w-4 h-4" />
                        {isAr ? 'إحصائيات الأكاديمية' : 'Academy Stats'}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="whitespace-nowrap shrink-0 rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg text-muted-foreground hover:text-foreground font-black gap-2 px-6 py-3 transition-all">
                        <ClipboardList className="w-4 h-4" />
                        {user.role === 'student' ? (isAr ? 'الدورات المسجَّلة' : 'Enrollments')
                            : user.role === 'teacher' ? (isAr ? 'الدورات' : 'Courses')
                            : user.role === 'parent'  ? (isAr ? 'الأبناء المرتبطون' : 'Linked Children')
                            : (isAr ? 'السجل' : 'Activity')}
                    </TabsTrigger>
                </TabsList>

                {/* INFO TAB */}
                <TabsContent value="info" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-3xl bg-card/60 backdrop-blur-xl border">
                            <CardHeader className="border-b border-border/50 pb-4 mb-4 bg-muted/20 rounded-t-3xl">
                                <CardTitle className="text-base font-black text-foreground flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    {t.admin.accountDetails}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-border/30">
                                    <span className="text-muted-foreground font-bold">{t.auth.role}</span>
                                    <Badge variant="outline" className="bg-muted/50 text-foreground capitalize border-border/50 font-bold">
                                        {roleLabel(user.role)}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border/30">
                                    <span className="text-muted-foreground font-bold">{t.admin.joinDate}</span>
                                    <span className="text-foreground font-black">{formatDate(user.created_at)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border/30">
                                    <span className="text-muted-foreground font-bold">{t.admin.lastLogin}</span>
                                    <span className="text-foreground font-black">{user.last_login_at ? new Date(user.last_login_at).toLocaleString(isAr ? 'ar-SA' : 'en-US') : "---"}</span>
                                </div>
                                {user.user_city && (
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-muted-foreground font-bold flex items-center gap-2">
                                            <Globe className="w-4 h-4" />
                                            {isAr ? "مدينة مواقيت الصلاة" : "Prayer City"}
                                        </span>
                                        <span className="text-foreground font-black">{user.user_city}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-3xl bg-card/60 backdrop-blur-xl border">
                            <CardHeader className="border-b border-border/50 pb-4 mb-4 bg-muted/20 rounded-t-3xl">
                                <CardTitle className="text-base font-black text-foreground flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    {t.admin.technicalData}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-border/30">
                                    <span className="text-muted-foreground font-bold flex items-center gap-2.5">
                                        <Globe className="w-4 h-4 text-muted-foreground/50" /> {t.admin.country}
                                    </span>
                                    <span className="text-foreground font-black bg-muted/30 px-3 py-1 rounded-xl border border-border/20">{data.country || "N/A"}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border/30">
                                    <span className="text-muted-foreground font-bold flex items-center gap-2.5">
                                        <Globe className="w-4 h-4 text-muted-foreground/50" /> {t.admin.ipAddress}
                                    </span>
                                    <span className="text-foreground font-black font-mono text-sm bg-muted/30 px-3 py-1 rounded-xl border border-border/20">{data.lastSession?.ip_address || "N/A"}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border/30">
                                    <span className="text-muted-foreground font-bold flex items-center gap-2.5">
                                        <Laptop className="w-4 h-4 text-muted-foreground/50" /> {isAr ? 'الجهاز والمتصفح' : 'Device & Browser'}
                                    </span>
                                    <span className="text-foreground font-black text-xs max-w-[200px] truncate bg-muted/30 px-3 py-1 rounded-xl border border-border/20 flex-shrink-0" title={data.lastSession?.user_agent || undefined}>
                                        {data.lastSession?.user_agent || "N/A"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Access Control Card */}
                    <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-3xl bg-card/60 backdrop-blur-xl border mt-6 overflow-hidden">
                        <CardHeader className="border-b border-border/50 pb-4 mb-4 bg-muted/20 rounded-t-3xl">
                            <CardTitle className="text-base font-black text-foreground flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Shield className="w-5 h-5" />
                                </div>
                                {isAr ? 'التحكم بالصلاحيات' : 'Access Control'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-border/30">
                                <span className="text-muted-foreground font-bold">{isAr ? 'وصول القرآن الكريم' : 'Quran Access'}</span>
                                <select
                                    className="h-9 rounded-xl border border-border/50 bg-muted/30 px-3 text-sm font-bold disabled:opacity-50"
                                    value={String(!!user.has_quran_access)}
                                    onChange={(e) => handleAccessUpdate('has_quran_access', e.target.value === 'true')}
                                    disabled={isUpdatingAccess}
                                >
                                    <option value="true">{isAr ? 'مسموح' : 'Allowed'}</option>
                                    <option value="false">{isAr ? 'محظور' : 'Blocked'}</option>
                                </select>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-border/30">
                                <span className="text-muted-foreground font-bold">{isAr ? 'وصول الأكاديمية' : 'Academy Access'}</span>
                                <select
                                    className="h-9 rounded-xl border border-border/50 bg-muted/30 px-3 text-sm font-bold disabled:opacity-50"
                                    value={String(!!user.has_academy_access)}
                                    onChange={(e) => handleAccessUpdate('has_academy_access', e.target.value === 'true')}
                                    disabled={isUpdatingAccess}
                                >
                                    <option value="true">{isAr ? 'مسموح' : 'Allowed'}</option>
                                    <option value="false">{isAr ? 'محظور' : 'Blocked'}</option>
                                </select>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                                <span className="text-muted-foreground font-bold">{isAr ? 'تفضيل المنصة' : 'Platform Preference'}</span>
                                <select
                                    className="h-9 rounded-xl border border-border/50 bg-muted/30 px-3 text-sm font-bold disabled:opacity-50"
                                    value={user.platform_preference || ''}
                                    onChange={(e) => handleAccessUpdate('platform_preference', e.target.value)}
                                    disabled={isUpdatingAccess}
                                >
                                    <option value="both">{isAr ? 'بدون تحديد ( اختيار المنصة عند الدخول )' : 'None (Choose on login)'}</option>
                                    <option value="quran">{isAr ? 'القرآن الكريم' : 'Quran Platform'}</option>
                                    <option value="academy">{isAr ? 'الأكاديمية' : 'Academy'}</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Specializations Card */}
                    <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-3xl bg-card/60 backdrop-blur-xl border mt-6 overflow-hidden">
                        <CardHeader className="border-b border-border/50 pb-4 mb-4 bg-muted/20 rounded-t-3xl">
                            <CardTitle className="text-base font-black text-foreground flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <BookMarked className="w-5 h-5" />
                                </div>
                                التخصصات الدراسية
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">
                                التخصصات التي يحددها الأدمن ملزمة للمستخدم ولا يمكنه حذفها. التخصصات التي يضيفها المستخدم بنفسه تظهر بشكل مختلف.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3">
                                {SPECIALIZATIONS.map(({ key, label }) => {
                                    const active = userSpecs.find(s => s.specialization === key)
                                    const saving = specSaving === key
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            disabled={!!saving}
                                            onClick={() => toggleAdminSpec(key)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all ${
                                                active
                                                    ? active.set_by === 'admin'
                                                        ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                                                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                                    : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                                            }`}
                                        >
                                            {saving ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : active ? (
                                                <X className="w-3.5 h-3.5" />
                                            ) : (
                                                <Plus className="w-3.5 h-3.5" />
                                            )}
                                            {label}
                                            {active && active.set_by !== 'admin' && (
                                                <span className="text-[10px] opacity-60">(المستخدم)</span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                            {userSpecs.length === 0 && (
                                <p className="text-xs text-muted-foreground mt-3">لا توجد تخصصات — المستخدم يرى جميع الدورات.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Teacher application card (if any) */}
                    {user.role === 'teacher' && roleMetrics?.application && (
                        <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-3xl bg-card/60 backdrop-blur-xl border mt-6 overflow-hidden">
                            <CardHeader className="border-b border-border/50 pb-4 mb-4 bg-muted/20 rounded-t-3xl">
                                <CardTitle className="text-base font-black text-foreground flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <ClipboardList className="w-5 h-5" />
                                    </div>
                                    {isAr ? 'حالة التقديم كمدرس' : 'Teacher Application Status'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{isAr ? 'الحالة' : 'Status'}</p>
                                    <p className="font-black">{roleMetrics.application.status || '---'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{isAr ? 'تاريخ المراجعة' : 'Reviewed At'}</p>
                                    <p className="font-black">{formatDate(roleMetrics.application.reviewed_at)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{isAr ? 'بواسطة' : 'Reviewer'}</p>
                                    <p className="font-black">{roleMetrics.application.reviewer_name || '---'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* STATS TAB */}
                <TabsContent value="stats" className="space-y-8">
                    {statCards.length === 0 ? (
                        <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-3xl bg-card/60 backdrop-blur-xl border">
                            <CardContent className="p-12 text-center text-muted-foreground">
                                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p className="font-bold">{isAr ? 'لا توجد إحصائيات أكاديمية لهذا الدور.' : 'No academy stats for this role.'}</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {statCards.map((stat, i) => (
                                <Card key={i} className="border-border/50 shadow-2xl shadow-black/5 bg-card/60 backdrop-blur-xl rounded-3xl border group hover:shadow-emerald-500/5 transition-all">
                                    <CardContent className="p-7">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                                <h3 className="text-4xl font-black text-foreground">{stat.value}</h3>
                                            </div>
                                            <div className={`p-4 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform duration-500`}>
                                                <stat.icon className={`w-7 h-7 ${stat.color}`} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Level + streak summary if available */}
                    {(points.total > 0 || points.streak_days > 0 || points.badges_count > 0) && (
                        <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-3xl bg-card/60 backdrop-blur-xl border overflow-hidden">
                            <CardHeader className="border-b border-border/50 pb-5 mb-4 bg-muted/20">
                                <CardTitle className="text-base font-black text-foreground flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-600">
                                        <Star className="w-5 h-5" />
                                    </div>
                                    {isAr ? 'مستوى المستخدم والإنجازات' : 'Level & Achievements'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase">{isAr ? 'المستوى' : 'Level'}</p>
                                    <p className="text-2xl font-black capitalize">{points.level || 'beginner'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase">{isAr ? 'أطول سلسلة' : 'Longest Streak'}</p>
                                    <p className="text-2xl font-black">{points.longest_streak}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase">{isAr ? 'آخر نشاط' : 'Last Activity'}</p>
                                    <p className="text-sm font-black">{formatDate(points.last_activity)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase">{isAr ? 'الشارات' : 'Badges'}</p>
                                    <p className="text-2xl font-black">{points.badges_count}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 14-day academy activity chart */}
                    <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-3xl bg-card/60 backdrop-blur-xl border overflow-hidden">
                        <CardHeader className="border-b border-border/50 pb-5 mb-4 bg-muted/20">
                            <CardTitle className="text-base font-black text-foreground flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Activity className="w-5 h-5" />
                                </div>
                                {isAr ? 'نشاط الأكاديمية خلال 14 يوماً' : 'Academy Activity (14 days)'}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">
                                {isAr ? 'يشمل: تقدم الدروس + تسليم المهام + حضور الجلسات.' : 'Includes: lesson progress + task submissions + session attendance.'}
                            </p>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.activityData}>
                                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                            tickFormatter={(val) => {
                                                const d = new Date(val);
                                                return d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' });
                                            }}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                borderRadius: '16px',
                                                border: '1px solid hsl(var(--border))',
                                                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
                                                fontSize: '12px',
                                                fontWeight: '900'
                                            }}
                                            labelFormatter={(val) => {
                                                const d = new Date(val);
                                                return d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
                                            }}
                                        />
                                        <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* HISTORY TAB */}
                <TabsContent value="history" className="space-y-6">
                    {data.history && data.history.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {user.role === 'student' && data.history.map((e: any) => (
                                <Card key={e.id} className="border-border/50 shadow-sm rounded-2xl bg-card overflow-hidden hover:shadow-md transition-shadow group relative">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 p-5">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div className="flex-grow space-y-1">
                                            <Link href={`/academy/admin/courses/${e.course_id}`} className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                                {e.course_title}
                                            </Link>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                {e.teacher_name && (
                                                    <span className="flex items-center gap-1.5"><UserIcon className="w-4 h-4" /> {e.teacher_name}</span>
                                                )}
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" /> {formatDate(e.enrolled_at)}
                                                </span>
                                                <Badge variant="outline" className="capitalize font-bold">{e.status}</Badge>
                                                <span className="font-bold">{e.progress_percentage}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {user.role === 'teacher' && data.history.map((c: any) => (
                                <Card key={c.id} className="border-border/50 shadow-sm rounded-2xl bg-card overflow-hidden hover:shadow-md transition-shadow group relative">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 p-5">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div className="flex-grow space-y-1">
                                            <Link href={`/academy/admin/courses/${c.id}`} className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                                {c.course_title}
                                            </Link>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" /> {formatDate(c.created_at)}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <UsersIcon className="w-4 h-4" /> {c.students_count} {isAr ? 'طالب' : 'students'}
                                                </span>
                                                <Badge variant={c.is_active ? 'default' : 'destructive'} className="font-bold">
                                                    {c.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'مؤرشف' : 'Archived')}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {user.role === 'parent' && data.history.map((c: any) => (
                                <Card key={c.id} className="border-border/50 shadow-sm rounded-2xl bg-card overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 p-5">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center overflow-hidden">
                                            {c.child_avatar ? <img src={c.child_avatar} alt={c.child_name} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6" />}
                                        </div>
                                        <div className="flex-grow space-y-1">
                                            <Link href={`/academy/admin/users/${c.child_id}`} className="text-lg font-bold text-foreground hover:text-primary transition-colors">
                                                {c.child_name}
                                            </Link>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                <Badge variant="outline" className="capitalize font-bold">{c.relation}</Badge>
                                                <Badge
                                                    variant={c.status === 'active' ? 'default' : c.status === 'rejected' ? 'destructive' : 'outline'}
                                                    className="font-bold capitalize"
                                                >
                                                    {c.status}
                                                </Badge>
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" /> {formatDate(c.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border border-border/50 shadow-sm rounded-2xl bg-card text-muted-foreground min-h-[300px] flex items-center justify-center">
                            <div className="p-12 text-center text-muted-foreground/40">
                                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>
                                    {user.role === 'student' ? (isAr ? 'لا توجد دورات مسجَّلة' : 'No enrollments')
                                        : user.role === 'teacher' ? (isAr ? 'لم ينشئ هذا المدرّس أي دورة' : 'This teacher has no courses')
                                        : user.role === 'parent'  ? (isAr ? 'لا يوجد أبناء مرتبطون' : 'No linked children')
                                        : (isAr ? 'لا توجد بيانات' : 'No data')}
                                </p>
                            </div>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
