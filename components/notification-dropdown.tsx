"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, Loader2, CheckCheck, MessageSquare, Mic, Calendar, Award, BookOpen, UserCheck, UserX, Megaphone } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"

type Notification = {
    id: string
    type: string
    title: string
    message: string
    is_read: boolean
    created_at: string
    link: string | null
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
    general: Bell,
}

const TYPE_COLOR: Record<string, string> = {
    mastered: "text-emerald-600 bg-emerald-50",
    needs_session: "text-blue-600 bg-blue-50",
    session_booked: "text-purple-600 bg-purple-50",
    session_reminder: "text-amber-600 bg-amber-50",
    new_reader_application: "text-blue-600 bg-blue-50",
    reader_approved: "text-emerald-600 bg-emerald-50",
    reader_rejected: "text-red-600 bg-red-50",
    new_message: "text-indigo-600 bg-indigo-50",
    new_announcement: "text-rose-600 bg-rose-50",
    general: "text-slate-500 bg-slate-50",
}

export function NotificationDropdown({ role, unreadCount, onRefresh }: { role: string; unreadCount: number; onRefresh: () => void }) {
    const { t, locale } = useI18n()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const [markingAll, setMarkingAll] = useState(false)
    const [clearing, setClearing] = useState(false)

    const fetchLatest = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/notifications?page=1")
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications.slice(0, 5))
            }
        } finally {
            setLoading(false)
        }
    }

    const markAllRead = async () => {
        setMarkingAll(true)
        try {
            const res = await fetch("/api/notifications", { method: "PATCH" })
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
                onRefresh()
            }
        } finally {
            setMarkingAll(false)
        }
    }

    const clearAll = async () => {
        if (!confirm(t.notifications.clearAllConfirm)) return
        setClearing(true)
        try {
            const res = await fetch("/api/notifications", { method: "DELETE" })
            if (res.ok) {
                setNotifications([])
                onRefresh()
            }
        } finally {
            setClearing(false)
        }
    }

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime()
        const m = Math.floor(diff / 60000)
        const h = Math.floor(diff / 3600000)
        const d = Math.floor(diff / 86400000)
        if (m < 1) return t.now
        if (m < 60) return `${t.minutesAgo} ${m}`
        if (h < 24) return `${t.hoursAgo} ${h}`
        return `${t.daysAgo} ${d}`
    }

    return (
        <DropdownMenu onOpenChange={(open) => open && fetchLatest()}>
            <DropdownMenuTrigger asChild>
                <button suppressHydrationWarning className="relative p-2.5 text-muted-foreground hover:text-primary transition-colors rounded-xl hover:bg-muted border border-transparent hover:border-border outline-none">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1 border-2 border-background shadow-sm animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 p-0 rounded-2xl border-border shadow-xl overflow-hidden mt-2">
                <div className="p-4 bg-muted/50 flex items-center justify-between">
                    <DropdownMenuLabel className="p-0 font-bold text-foreground">
                        {t.notifications.title}
                    </DropdownMenuLabel>
                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAllRead(); }}
                                disabled={markingAll || clearing}
                                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                            >
                                {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                                {t.notifications.markAll}
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); clearAll(); }}
                                disabled={markingAll || clearing}
                                className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                            >
                                {clearing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                {t.notifications.clearAll}
                            </button>
                        )}
                    </div>
                </div>
                <DropdownMenuSeparator className="m-0" />
                <div className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="p-10 flex justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-10 text-center text-muted-foreground text-sm">
                            <Bell className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            {t.notifications.noNotifications}
                        </div>
                    ) : (
                        notifications.map((n) => {
                            const Icon = TYPE_ICON[n.type] || Bell
                            const color = TYPE_COLOR[n.type] || "text-muted-foreground bg-muted"
                            return (
                                <DropdownMenuItem key={n.id} asChild className="p-0 focus:bg-muted transition-colors pointer-cursor border-b border-border last:border-0">
                                    <Link href={n.link || `/${role}/notifications`} className="flex items-start gap-4 p-4 outline-none">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-current opacity-80 ${color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`text-sm font-bold truncate ${n.is_read ? "text-muted-foreground" : "text-foreground"}`}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {timeAgo(n.created_at)}
                                                </span>
                                            </div>
                                            <p className={`text-xs mt-1 line-clamp-2 ${n.is_read ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                                                {n.message}
                                            </p>
                                            {!n.is_read && <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />}
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                            )
                        })
                    )}
                </div>
                <DropdownMenuSeparator className="m-0" />
                <div className="p-2">
                    <Button asChild variant="ghost" className="w-full justify-center text-xs font-bold text-primary rounded-xl py-2 h-auto hover:bg-primary/5">
                        <Link href={`/${role}/notifications`}>
                            {t.notifications.viewAll}
                        </Link>
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
