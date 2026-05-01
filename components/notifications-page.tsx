"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import {
    Bell, CheckCheck, Mic, Calendar, Award, MessageSquare,
    UserCheck, UserX, Loader2, BookOpen, ChevronRight, Settings,
    Inbox, HardDrive, Clock, X, Filter
} from "lucide-react"

type Notification = {
    id: string
    type: string
    title: string
    message: string
    category: string
    link: string | null
    is_read: boolean
    created_at: string
    related_recitation_id: string | null
    related_booking_id: string | null
}

type FilterOptions = {
    type: string | null
    category: string | null
    readStatus: 'all' | 'read' | 'unread'
    dateRange: 'all' | 'today' | 'week' | 'month'
}

const TYPE_ICON: Record<string, React.ElementType> = {
    recitation_received: Mic,
    recitation_reviewed: BookOpen,
    mastered: Award,
    needs_session: Calendar,
    session_booked: Calendar,
    session_reminder: Calendar,
    new_reader_application: UserCheck,
    reader_approved: UserCheck,
    reader_rejected: UserX,
    new_recitation_admin: Mic,
    new_message: MessageSquare,
    new_announcement: Bell,
    new_contact_message: MessageSquare,
    general: Bell,
}

const TYPE_LABELS: Record<string, string> = {
    recitation_received: "تقرير جديد",
    recitation_reviewed: "تقرير تم مراجعته",
    mastered: "اتقان",
    needs_session: "جلسة مطلوبة",
    session_booked: "جلسة محجوزة",
    session_reminder: "تذكير الجلسة",
    new_reader_application: "طلب قارئ جديد",
    reader_approved: "قارئ موافق عليه",
    reader_rejected: "قارئ مرفوض",
    new_recitation_admin: "تقرير جديد للمسؤول",
    new_message: "رسالة جديدة",
    new_announcement: "إعلان جديد",
    new_contact_message: "رسالة تواصل",
    general: "عام",
}

const CATEGORY_LABELS: Record<string, string> = {
    recitation: "التقارير",
    session: "الجلسات",
    account: "الحساب",
    message: "الرسائل",
    announcement: "الإعلانات",
    booking: "الحجوزات",
    general: "عام",
}

const TYPE_COLOR: Record<string, string> = {
    mastered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    needs_session: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    session_booked: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    session_reminder: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    recitation_received: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    recitation_reviewed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    new_reader_application: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    reader_approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    reader_rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    new_message: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    new_announcement: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    new_contact_message: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    general: "bg-muted text-muted-foreground border-border",
}

export default function NotificationsPage() {
    const { t, locale } = useI18n()
    const pathname = usePathname()
    const isAr = locale === "ar"
    const isReader = pathname.startsWith('/reader')
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [markingAll, setMarkingAll] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    
    // Filter state
    const [filters, setFilters] = useState<FilterOptions>({
        type: null,
        category: null,
        readStatus: 'all',
        dateRange: 'all'
    })
    const [showFilters, setShowFilters] = useState(false)

    const load = useCallback(async (pageNum = 1) => {
        if (pageNum === 1) setLoading(true)
        else setLoadingMore(true)

        const res = await fetch(`/api/notifications?page=${pageNum}`)
        if (res.ok) {
            const d = await res.json()
            if (pageNum === 1) {
                setNotifications(d.notifications || [])
            } else {
                setNotifications(prev => {
                    const existingIds = new Set(prev.map(n => n.id))
                    const newNotifs = (d.notifications || []).filter((n: Notification) => !existingIds.has(n.id))
                    return [...prev, ...newNotifs]
                })
            }
            setHasMore(d.hasMore || false)
            setUnreadCount(d.unreadCount || 0)
        }

        if (pageNum === 1) setLoading(false)
        else setLoadingMore(false)
    }, [])

    useEffect(() => {
        load(1)
        setPage(1)
    }, [load])

    const markAllRead = async () => {
        setMarkingAll(true)
        await fetch("/api/notifications", { method: "PATCH" })
        setNotifications(p => p.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
        setMarkingAll(false)
    }

    const markOneRead = async (id: string) => {
        const notif = notifications.find(n => n.id === id)
        if (!notif || notif.is_read) return

        await fetch(`/api/notifications/${id}`, { method: "PATCH" })
        setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    const getTimeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime()
        const m = Math.floor(diff / 60000)
        const h = Math.floor(diff / 3600000)
        const d = Math.floor(diff / 86400000)
        if (m < 1) return t.now
        if (m < 60) return `${t.minutesAgo} ${m}`
        if (h < 24) return `${t.hoursAgo} ${h}`
        return `${t.daysAgo} ${d}`
    }

    // Date range filter helper
    const isWithinDateRange = (date: string, range: string): boolean => {
        const notifDate = new Date(date).getTime()
        const now = Date.now()
        const oneDay = 24 * 60 * 60 * 1000
        
        switch (range) {
            case 'today':
                return now - notifDate < oneDay
            case 'week':
                return now - notifDate < 7 * oneDay
            case 'month':
                return now - notifDate < 30 * oneDay
            default:
                return true
        }
    }

    // Apply all filters
    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            if (filters.type && n.type !== filters.type) return false
            if (filters.category && n.category !== filters.category) return false
            if (filters.readStatus === 'read' && !n.is_read) return false
            if (filters.readStatus === 'unread' && n.is_read) return false
            if (!isWithinDateRange(n.created_at, filters.dateRange)) return false
            return true
        })
    }, [notifications, filters])

    // Check if any filters are active
    const hasActiveFilters = filters.type || filters.category || filters.readStatus !== 'all' || filters.dateRange !== 'all'
    
    // Reset filters
    const resetFilters = () => {
        setFilters({
            type: null,
            category: null,
            readStatus: 'all',
            dateRange: 'all'
        })
    }

    return (
        <div className={cn(
            "overflow-x-hidden",
            isReader && "bg-card min-h-full -m-6 lg:-m-8 p-6 lg:p-8"
        )} dir={isAr ? "rtl" : "ltr"}>
            <div className="max-w-4xl mx-auto pb-20 overflow-x-hidden">
            {/* Premium Header Zone */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-4">
                        <Bell className="w-9 h-9 text-primary" />
                        {t.notifications.title}
                    </h1>
                    <div className="flex items-center gap-3">
                        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">
                          {unreadCount > 0 
                            ? t.notifications.unreadCount.replace('{unread}', unreadCount.toString()) 
                            : t.notifications.allRead}
                        </p>
                        {unreadCount > 0 && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                          </span>
                        )}
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "group flex items-center justify-center gap-2 text-[11px] md:text-xs font-black uppercase tracking-widest px-4 md:px-8 py-3 md:py-4 rounded-2xl transition-all hover:-translate-y-1 active:scale-95 border-2 flex-1 md:flex-none",
                            showFilters 
                                ? "border-primary bg-primary/10 text-primary" 
                                : "border-border bg-muted/50 text-foreground hover:border-primary/30"
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        تصفية
                    </button>

                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            disabled={markingAll}
                            className="group flex items-center justify-center gap-2 text-[11px] md:text-xs font-black uppercase tracking-widest text-primary-foreground bg-primary px-4 md:px-8 py-3 md:py-4 rounded-2xl hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-70 flex-1 md:flex-none"
                        >
                            {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4 transition-transform group-hover:scale-110 ml-1" />}
                            {t.notifications.markAllRead}
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-card border-2 border-primary/20 rounded-3xl p-8 mb-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Type Filter */}
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-3">النوع</label>
                            <select
                                value={filters.type || ''}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value || null })}
                                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">جميع الأنواع</option>
                                {Object.entries(TYPE_LABELS).map(([type, label]) => (
                                    <option key={type} value={type}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-3">الفئة</label>
                            <select
                                value={filters.category || ''}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value || null })}
                                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">جميع الفئات</option>
                                {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                                    <option key={cat} value={cat}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Read Status Filter */}
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-3">الحالة</label>
                            <select
                                value={filters.readStatus}
                                onChange={(e) => setFilters({ ...filters, readStatus: e.target.value as any })}
                                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="all">الكل</option>
                                <option value="unread">غير المقروءة</option>
                                <option value="read">المقروءة</option>
                            </select>
                        </div>

                        {/* Date Range Filter */}
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-3">النطاق الزمني</label>
                            <select
                                value={filters.dateRange}
                                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="all">كل الفترات</option>
                                <option value="today">اليوم</option>
                                <option value="week">هذا الأسبوع</option>
                                <option value="month">هذا الشهر</option>
                            </select>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="mt-6 w-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground bg-muted/30 border-2 border-dashed border-border px-6 py-3 rounded-xl hover:border-primary/50 hover:text-primary transition-all"
                        >
                            <X className="w-4 h-4" />
                            إعادة تعيين الفلاتر
                        </button>
                    )}
                </div>
            )}

            {/* Results info */}
            {hasActiveFilters && (
                <div className="mb-6 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-2xl px-6 py-3">
                    <p className="text-sm font-bold text-foreground">
                        {filteredNotifications.length} من {notifications.length} إشعار
                    </p>
                    <button
                        onClick={resetFilters}
                        className="text-xs font-bold text-primary hover:underline"
                    >
                        مسح الفلاتر
                    </button>
                </div>
            )}

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
                <div className="bg-card border-2 border-dashed border-border rounded-[40px] p-24 text-center shadow-none flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-8 border border-border shadow-inner">
                        <Bell className="w-10 h-10 text-muted-foreground opacity-20" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight uppercase tracking-widest">
                        {hasActiveFilters ? "لا توجد إشعارات مطابقة" : t.notifications.noNotifications}
                    </h3>
                    <p className="text-muted-foreground font-bold max-w-sm mx-auto leading-relaxed">
                        {hasActiveFilters 
                            ? "جرب تغيير الفلاتر للعثور على الإشعارات" 
                            : t.notifications.noNotificationsDesc}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredNotifications.map(n => {
                        const Icon = TYPE_ICON[n.type] || Bell
                        const iconClass = TYPE_COLOR[n.type] || "bg-muted text-muted-foreground border-border"
                        const isUnread = !n.is_read

                        const inner = (
                            <div
                                className={`group relative flex items-start gap-6 bg-card rounded-[32px] p-6 transition-all duration-500 cursor-pointer border border-border overflow-hidden
                                    ${isUnread
                                        ? "shadow-2xl shadow-primary/5 ring-1 ring-primary/20 bg-gradient-to-l from-card to-primary/[0.03]"
                                        : "shadow-sm hover:shadow-xl hover:shadow-muted/50 hover:border-primary/20 hover:-translate-y-1"
                                    }`}
                                onClick={() => { if (isUnread) markOneRead(n.id) }}
                            >
                                {/* Unread indicator stripe */}
                                {isUnread && (
                                    <div className="absolute right-0 top-6 bottom-6 w-1.5 bg-primary rounded-r-full" />
                                )}

                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${iconClass}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0 py-1 text-right">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-2">
                                        <h4 className={`text-lg font-black tracking-tight group-hover:text-primary transition-colors ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                                            {n.title}
                                        </h4>
                                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter text-muted-foreground/60 bg-muted/50 px-3 py-1.5 rounded-xl border border-border shrink-0">
                                            <Clock className="w-3 h-3 text-primary" />
                                            {getTimeAgo(n.created_at)}
                                        </div>
                                    </div>
                                    <p className={`text-sm leading-relaxed max-w-2xl ${isUnread ? "text-foreground/80 font-bold" : "text-muted-foreground font-medium"}`}>
                                        {n.message}
                                    </p>
                                </div>
                                {n.link && (
                                    <div className="shrink-0 self-center hidden sm:flex items-center justify-center w-10 h-10 rounded-2xl bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 border border-border group-hover:border-primary/20">
                                        <ChevronRight className={`w-5 h-5 transition-transform duration-500 group-hover:-translate-x-1 ${isAr ? "rotate-180" : ""}`} />
                                    </div>
                                )}
                            </div>
                        )

                        return n.link ? (
                            <Link key={n.id} href={n.link} onClick={() => { if (isUnread) markOneRead(n.id) }} className="block outline-none focus-visible:ring-4 focus-visible:ring-primary/20 rounded-[32px]">
                                {inner}
                            </Link>
                        ) : (
                            <div key={n.id}>{inner}</div>
                        )
                    })}
                </div>
            )}

            {/* Load More Button */}
            {hasMore && (
                <div className="mt-12 flex justify-center">
                    <button
                        onClick={() => {
                            const nextPage = page + 1
                            setPage(nextPage)
                            load(nextPage)
                        }}
                        disabled={loadingMore}
                        className="group flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-foreground bg-muted/50 border-2 border-border px-10 py-4 rounded-2xl hover:border-primary/30 hover:bg-card hover:shadow-xl hover:shadow-muted/50 transition-all active:scale-95 disabled:opacity-50 min-w-[200px]"
                    >
                        {loadingMore ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : <Inbox className="w-4 h-4 text-primary transition-transform group-hover:scale-125 ml-1" />}
                        {loadingMore ? t.loading : t.notifications.showMore}
                    </button>
                </div>
            )}

            {/* Loading state for filter operation */}
            {loading && (
                <div className="flex justify-center items-center min-h-[500px]">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            )}
            </div>
        </div>
    )
}
