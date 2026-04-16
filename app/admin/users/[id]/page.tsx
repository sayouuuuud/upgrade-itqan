"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    Activity,
    AlertCircle,
    BarChart3,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Globe,
    Info,
    Laptop,
    List,
    Loader2,
    Mail,
    MessageSquare,
    Mic,
    Mic2,
    Pause,
    Phone,
    Play,
    Shield,
    Star,
    TrendingUp,
    User as UserIcon,
    XCircle,
    ClipboardList,
    Award,
    Trash2,
    AlertTriangle,
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
import { StatusBadge } from "@/components/status-badge"

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { t } = useI18n()
    const router = useRouter()
    const isAr = t.locale === "ar"
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("info")
    const [isDeleting, setIsDeleting] = useState(false)
    const [isUpdatingAccess, setIsUpdatingAccess] = useState(false)
    const { id } = use(params)

    const handleAccessUpdate = async (field: 'has_quran_access' | 'has_academy_access' | 'platform_preference', value: any) => {
        setIsUpdatingAccess(true)
        try {
            const res = await fetch(`/api/admin/users/${id}/access`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            })
            if (!res.ok) throw new Error(t.admin.errorUpdatingUser || "Failed to update access")

            // Assuming successful update, update local state
            setData({
                ...data,
                user: {
                    ...data.user,
                    [field]: value
                }
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
            router.push('/admin/users')
        } catch (err: any) {
            alert(err.message)
            setIsDeleting(false)
        }
    }

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(`/api/admin/users/${id}`)
                if (!res.ok) throw new Error(t.admin.failedToLoadData)
                const json = await res.json()
                setData(json)
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

    const { user, metrics, lastSession } = data

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <button onClick={() => router.push('/admin/users')} className="hover:text-primary transition-colors">
                        {t.admin.users}
                    </button>
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                    <span className="font-bold text-foreground">{user.name}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Badge variant={user.is_active ? "default" : "destructive"} className="px-3 py-1 font-bold">
                        {user.is_active ? t.active : t.blocked}
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 font-bold px-4 rounded-xl h-9 border-primary/20 hover:bg-primary/5 hover:border-primary/50 text-foreground transition-all active:scale-95 shadow-sm"
                        onClick={() => router.push(`/admin/conversations?userId=${id}&userRole=${user.role}`)}
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
                        {/* User Info Left Side (RTL -> Right Side) */}
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
                                        {user.role === 'student' ? (t.student.studentLabel || t.auth.student) :
                                            user.role === 'reader' ? (t.reader.readerLabel || t.auth.reader) :
                                                user.role === 'student_supervisor' ? (t.auth.studentSupervisor || "Student Supervisor") :
                                                    user.role === 'reciter_supervisor' ? (t.auth.reciterSupervisor || "Reciter Supervisor") :
                                                        user.role === 'admin' ? t.auth.admin : user.role}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-muted-foreground text-sm font-bold">
                                    <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-xl border border-border/50 backdrop-blur-sm"><Mail className="w-4 h-4 text-primary/70" /> {user.email || "---"}</span>
                                    {user.phone && <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-xl border border-border/50 backdrop-blur-sm"><Phone className="w-4 h-4 text-primary/70" /> {user.phone}</span>}
                                    <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-xl border border-border/50 backdrop-blur-sm">
                                        <Calendar className="w-4 h-4 text-primary/70" />
                                        {t.admin.joinDate}: {new Date(user.created_at).toLocaleDateString(t.locale === 'ar' ? 'ar-SA' : 'en-US')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-center sm:justify-start gap-3 shrink-0">
                            <Button
                                variant="outline"
                                className="gap-2 font-bold px-6 rounded-2xl h-11 border-primary/20 hover:bg-primary/5 hover:border-primary/50 text-foreground transition-all active:scale-95 shadow-md"
                                onClick={() => router.push(`/admin/conversations?userId=${id}&userRole=${user.role}`)}
                            >
                                <MessageSquare className="w-5 h-5 text-primary" />
                                {t.admin.messageUser || "Message User"}
                            </Button>
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
                        {t.admin.statistics}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="whitespace-nowrap shrink-0 rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg text-muted-foreground hover:text-foreground font-black gap-2 px-6 py-3 transition-all">
                        <ClipboardList className="w-4 h-4" />
                        {user.role === 'student' ? t.admin.studentRecitationsHistory : t.admin.readerReviewsHistory}
                    </TabsTrigger>
                    {user.role === 'student' && (
                        <TabsTrigger value="errors" className="whitespace-nowrap shrink-0 rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg text-muted-foreground hover:text-foreground font-black gap-2 px-6 py-3 transition-all">
                            <AlertCircle className="w-4 h-4" />
                            {t.admin.errorsLog || "Errors Log"}
                        </TabsTrigger>
                    )}
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
                                        {user.role === 'student' ? (t.student.studentLabel || t.auth.student) :
                                            user.role === 'reader' ? (t.reader.readerLabel || t.auth.reader) :
                                                user.role === 'student_supervisor' ? (t.auth.studentSupervisor || "Student Supervisor") :
                                                    user.role === 'reciter_supervisor' ? (t.auth.reciterSupervisor || "Reciter Supervisor") :
                                                        user.role === 'admin' ? t.auth.admin : user.role}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border/30">
                                    <span className="text-muted-foreground font-bold">{t.admin.joinDate}</span>
                                    <span className="text-foreground font-black">{new Date(user.created_at).toLocaleDateString(t.locale === 'ar' ? 'ar-SA' : 'en-US')}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-muted-foreground font-bold">{t.admin.lastLogin}</span>
                                    <span className="text-foreground font-black">{user.last_login_at ? new Date(user.last_login_at).toLocaleString(t.locale === 'ar' ? 'ar-SA' : 'en-US') : "---"}</span>
                                </div>
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
                                    <span className="text-foreground font-black text-xs max-w-[200px] truncate bg-muted/30 px-3 py-1 rounded-xl border border-border/20 flex-shrink-0" title={data.lastSession?.user_agent}>
                                        {data.lastSession?.user_agent || "N/A"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Reader Profile Additional Info */}
                    {user.role === 'reader' && (
                        <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-3xl bg-card/60 backdrop-blur-xl border mt-6 overflow-hidden">
                            <CardHeader className="border-b border-border/50 pb-4 mb-4 bg-muted/20 rounded-t-3xl">
                                <CardTitle className="text-base font-black text-foreground flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <ClipboardList className="w-5 h-5" />
                                    </div>
                                    {isAr ? 'بيانات التسجيل (مقرئ)' : 'Registration Details (Reader)'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center py-2.5 border-b border-border/30">
                                        <span className="text-muted-foreground font-bold">{isAr ? 'الاسم الثلاثي' : 'Triple Full Name'}</span>
                                        <span className="text-foreground font-black">{user.full_name_triple || "---"}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2.5 border-b border-border/30">
                                        <span className="text-muted-foreground font-bold">{isAr ? 'المدينة' : 'City'}</span>
                                        <span className="text-foreground font-black">{user.city || "---"}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2.5 border-b border-border/30">
                                        <span className="text-muted-foreground font-bold">{isAr ? 'التخصص' : 'Specialization'}</span>
                                        <span className="text-foreground font-black">{user.specialization || "---"}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center py-2.5 border-b border-border/30">
                                        <span className="text-muted-foreground font-bold">{isAr ? 'المؤهل' : 'Qualification'}</span>
                                        <span className="text-foreground font-black">{user.qualification || "---"}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2.5 border-b border-border/30">
                                        <span className="text-muted-foreground font-bold">{isAr ? 'الأجزاء المحفوظة' : 'Memorized Parts'}</span>
                                        <span className="text-foreground font-black">{user.memorized_parts || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2.5 border-b border-border/30">
                                        <span className="text-muted-foreground font-bold">{isAr ? 'سنوات الخبرة' : 'Years of Experience'}</span>
                                        <span className="text-foreground font-black">{user.years_of_experience || 0}</span>
                                    </div>
                                </div>
                                {user.certificate_file_url && (
                                    <div className="md:col-span-2 pt-6">
                                        <Button asChild variant="outline" className="w-full border-dashed border-border group hover:bg-emerald-500/5 hover:border-emerald-500/50 transition-all rounded-2xl h-12 font-black">
                                            <a href={user.certificate_file_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                                    <Award className="w-4 h-4" />
                                                </div>
                                                {isAr ? 'عرض الشهادة المرفقة' : 'View Attached Certificate'}
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Access Control Card */}
                    <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-3xl bg-card/60 backdrop-blur-xl border mt-6 overflow-hidden">
                        <CardHeader className="border-b border-border/50 pb-4 mb-4 bg-muted/20 rounded-t-3xl">
                            <CardTitle className="text-base font-black text-foreground flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    <Shield className="w-5 h-5" />
                                </div>
                                {isAr ? 'صلاحيات الوصول' : 'Access Permissions'}
                                {isUpdatingAccess && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-auto rtl:ml-auto rtl:mr-0" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-border/30">
                                <div>
                                    <span className="text-foreground font-bold block">{isAr ? 'منصة القرآن الكريم' : 'Quran Platform Access'}</span>
                                    <span className="text-xs text-muted-foreground">{isAr ? 'السماح بالدخول لمقرأة إتقان' : 'Allow access to Quran recitation platform'}</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={user.has_quran_access}
                                        onChange={(e) => handleAccessUpdate('has_quran_access', e.target.checked)}
                                        disabled={isUpdatingAccess}
                                    />
                                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-border/30">
                                <div>
                                    <span className="text-foreground font-bold block">{isAr ? 'منصة الأكاديمية (LMS)' : 'Academy Platform Access (LMS)'}</span>
                                    <span className="text-xs text-muted-foreground">{isAr ? 'السماح بالدخول للأكاديمية والدورات' : 'Allow access to Academy courses'}</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={user.has_academy_access}
                                        onChange={(e) => handleAccessUpdate('has_academy_access', e.target.checked)}
                                        disabled={isUpdatingAccess}
                                    />
                                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <div>
                                    <span className="text-foreground font-bold block">{isAr ? 'المنصة الافتراضية' : 'Default Platform Preference'}</span>
                                    <span className="text-xs text-muted-foreground">{isAr ? 'تحديد المنصة التي سيتم توجيه المستخدم لها عند تسجيل الدخول' : 'Platform to redirect to at login'}</span>
                                </div>
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
                </TabsContent>

                {/* STATS TAB */}
                <TabsContent value="stats" className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { label: t.admin.completedSessions, value: metrics.sessions.completed, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            { label: t.admin.noShows, value: metrics.sessions.noShow, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
                            { label: t.admin.totalRecitations, value: metrics.recitations.monthly, icon: Mic, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        ].map((stat, i) => (
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

                    {/* Weekly Performance */}
                    <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-3xl bg-card/60 backdrop-blur-xl border overflow-hidden">
                        <CardHeader className="border-b border-border/50 pb-5 mb-4 bg-muted/20">
                            <CardTitle className="text-base font-black text-foreground flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Activity className="w-5 h-5" />
                                </div>
                                {t.admin.recitationActivity14Days}
                            </CardTitle>
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
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                        />
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
                                        <Bar
                                            dataKey="count"
                                            fill="#10b981"
                                            radius={[6, 6, 0, 0]}
                                            barSize={32}
                                        />
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
                            {data.history.map((item: any) => (
                                <Card key={item.id} className="border-border/50 shadow-sm rounded-2xl bg-card overflow-hidden hover:shadow-md transition-shadow group relative">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 p-5">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                            <Mic2 className="w-6 h-6" />
                                        </div>
                                        <div className="flex-grow space-y-1 relative">
                                            <Link href={`/admin/recitations/${item.id}`} className="absolute inset-0 z-10">
                                                <span className="sr-only">{t.admin.viewDetails}</span>
                                            </Link>
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                                    {t.reader.surah} {item.surah_name}
                                                    <span className="text-muted-foreground text-sm font-normal mr-2">
                                                        ({t.reader.ayahs} {item.ayah_from} - {item.ayah_to})
                                                    </span>
                                                </h4>
                                                <StatusBadge status={item.status} className="h-6 relative z-20 pointer-events-none" />
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5 line-clamp-1">
                                                    <UserIcon className="w-4 h-4" />
                                                    {user.role === 'student' ? (
                                                        <p className="text-xs text-muted-foreground/60 mt-1">
                                                            {item.evaluator_name ? `${t.admin.evaluator}: ${item.evaluator_name}` : t.admin.pendingEvaluation}
                                                        </p>
                                                    ) : (
                                                        `${t.admin.student}: ${item.student_name}`
                                                    )}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(item.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </span>

                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 hidden md:flex relative z-20">
                                        <Link href={`/admin/recitations/${item.id}`} className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-colors">
                                            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                                        </Link>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border border-border/50 shadow-sm rounded-2xl bg-card text-muted-foreground min-h-[300px] flex items-center justify-center relative">
                            <div className="p-12 text-center text-muted-foreground/40">
                                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>{user.role === 'student' ? t.admin.noStudentRecitations : t.admin.noReaderReviews}</p>
                            </div>
                        </Card>
                    )}
                </TabsContent>

                {/* CHAT TAB - REMOVED for Phase 4 */}

                {/* ERRORS TAB (Student only) */}
                {user.role === 'student' && (
                    <TabsContent value="errors" className="space-y-6">
                        {data.errorsLog && data.errorsLog.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {data.errorsLog.map((error: any, idx: number) => (
                                    <Card key={idx} className="border-red-500/20 shadow-2xl shadow-black/5 rounded-3xl bg-card/60 backdrop-blur-xl overflow-hidden border">
                                        <CardHeader className="bg-red-500/10 pb-4 border-b border-red-500/10">
                                            <CardTitle className="text-base font-black text-red-700 dark:text-red-400 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 rounded-lg bg-red-500/20">
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </div>
                                                    <span>{t.reader.surah} {error.surah_name}</span>
                                                </div>
                                                <span className="text-red-700/60 dark:text-red-400/60 font-black text-xs">{new Date(error.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-4">
                                            {error.error_markers && error.error_markers.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {error.error_markers.map((m: any, i: number) => (
                                                        <Badge key={i} variant="outline" className="bg-red-500/5 text-red-600 dark:text-red-400 border-red-500/20 font-black px-3 py-1 rounded-xl">
                                                            {m.type === 'tajweed' ? (isAr ? 'تجويد' : 'Tajweed') : (isAr ? 'نطق' : 'Pronunciation')}: {m.note}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-foreground text-sm font-bold leading-relaxed italic">
                                                "{error.detailed_feedback}"
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-3xl bg-card/60 backdrop-blur-xl text-muted-foreground min-h-[300px] flex items-center justify-center relative border">
                                <div className="p-12 text-center">
                                    <AlertCircle className="w-16 h-16 mx-auto mb-6 opacity-20 text-red-500" />
                                    <p className="text-lg font-black">{isAr ? 'لا يوجد سجل أخطاء مسجل لهذا الطالب.' : 'No errors log recorded for this student.'}</p>
                                </div>
                            </Card>
                        )}
                    </TabsContent>
                )}
            </Tabs>
        </div >
    )
}
