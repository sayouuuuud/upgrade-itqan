"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
    MessagesSquare, Search, MessageCircle,
    CheckCircle, XCircle, Loader2, User, BookOpen,
    Shield, Send, MessageSquare
} from "lucide-react"
import {
    Tabs, TabsList, TabsTrigger, TabsContent
} from "@/components/ui/tabs"
import { TableSkeleton, ConversationsSkeleton } from "@/components/admin/skeletons"

// --- TYPES ---
type Conversation = {
    id: string
    admin_id: string
    student_id: string | null
    reader_id: string | null
    student_name: string | null
    student_avatar: string | null
    reader_name: string | null
    reader_avatar: string | null
    last_message_preview: string | null
    last_message_at: string | null
    is_ticket?: boolean
    ticket_status?: string
    assigned_supervisor_id?: string | null
    supervisor_name?: string | null
    message_count?: number
    is_active?: boolean
}

type Message = {
    id: string
    message_text: string
    sender_id: string
    sender_name: string
    sender_role: string
    sender_avatar: string | null
    created_at: string
}

// --- COMPONENTS ---

function SupervisionTab({ isAr, t }: { isAr: boolean, t: any }) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)

    const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [loadingMessages, setLoadingMessages] = useState(false)

    const fetchConvos = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page) })
            if (search) params.set('search', search)
            const res = await fetch(`/api/admin/conversations?${params}`)
            if (res.ok) {
                const data = await res.json()
                setConversations(data.conversations || [])
                setTotal(data.total || 0)
            }
        } finally {
            setLoading(false)
        }
    }, [page, search])

    useEffect(() => {
        const t = setTimeout(fetchConvos, 300)
        return () => clearTimeout(t)
    }, [fetchConvos])

    const openConvo = async (c: Conversation) => {
        setSelectedConvo(c)
        setLoadingMessages(true)
        try {
            const res = await fetch(`/api/admin/conversations/${c.id}`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data.messages)
            }
        } finally {
            setLoadingMessages(false)
        }
    }

    const toggleActive = async (id: string, is_active: boolean) => {
        await fetch('/api/admin/conversations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, is_active: !is_active }),
        })
        fetchConvos()
    }

    const totalPages = Math.ceil(total / 20)

    return (
        <div className="space-y-6">
            <div className="relative max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-all" />
                <Input
                    className="pr-10 bg-card border-border focus:bg-card transition-all rounded-xl"
                    placeholder={a.cvSearchPlaceholder}
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                />
            </div>

            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
                    <h3 className="font-bold text-foreground">
                        {t.admin.supervision} <span className="text-muted-foreground font-normal text-sm">({total})</span>
                    </h3>
                </div>

                {loading ? (
                    <TableSkeleton rows={5} cols={4} />
                ) : conversations.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 font-medium">{a.cvNoConversations}</div>
                ) : (
                    <div className="divide-y divide-border">
                        {conversations.map(c => (
                            <div key={c.id} className="flex items-center gap-4 p-5 hover:bg-muted/10 transition-colors">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                                    <MessagesSquare className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0 text-right">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="flex items-center gap-1.5 text-sm font-bold text-foreground bg-muted px-2 py-0.5 rounded-lg">
                                            <User className="w-3.5 h-3.5 text-muted-foreground" /> {c.student_name}
                                        </span>
                                        <span className="text-border text-xs">↔</span>
                                        <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">
                                            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" /> {c.reader_name}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate mb-2">{c.last_message_preview || a.cvNoMessagesYet}</p>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                                            <MessageCircle className="w-3 h-3" />
                                            {c.message_count} {a.cvMessages}
                                        </span>
                                        {c.last_message_at && (
                                            <span className="text-[11px] font-bold text-muted-foreground">
                                                {new Date(c.last_message_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                                            </span>
                                        )}
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${c.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                                            {c.is_active ? a.cvActive : a.cvClosed}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button variant="outline" size="sm" onClick={() => openConvo(c)} className="rounded-xl border-border hover:bg-muted h-9 px-4 font-bold text-xs gap-2">
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        {a.cvView}
                                    </Button>
                                    <Button
                                        variant="ghost" size="sm"
                                        onClick={() => toggleActive(c.id, c.is_active || false)}
                                        className={`rounded-xl h-9 w-9 p-0 ${c.is_active ? 'hover:bg-red-500/10 hover:text-red-500' : 'hover:bg-emerald-500/10 hover:text-emerald-500'}`}
                                        title={c.is_active ? a.cvCloseConversation : a.cvOpenConversation}
                                    >
                                        {c.is_active
                                            ? <XCircle className="w-4 h-4" />
                                            : <CheckCircle className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-5 border-t border-border bg-muted/10">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-xl font-bold">{t.previous}</Button>
                        <span className="text-sm font-bold text-muted-foreground">{a.cvPage.replace('{page}', String(page)).replace('{total}', String(totalPages))}</span>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl font-bold">{t.next}</Button>
                    </div>
                )}
            </div>

            <Dialog open={!!selectedConvo} onOpenChange={() => setSelectedConvo(null)}>
                <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 overflow-hidden border-none rounded-3xl shadow-2xl bg-card">
                    <DialogHeader className="p-6 pb-4 border-b border-border bg-card">
                        <DialogTitle className="text-right text-foreground font-black text-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <span>{a.cvConversationDetails}</span>
                            </div>
                            <span className="text-sm font-bold text-muted-foreground">{selectedConvo ? `${selectedConvo.student_name} ↔ ${selectedConvo.reader_name}` : ''}</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 text-right bg-muted/10">
                        {loadingMessages ? (
                            <div className="flex flex-col items-center justify-center p-12 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-muted-foreground font-bold text-sm tracking-wide">{t.loading}</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <p className="text-center text-muted-foreground font-bold text-sm py-12">{a.cvNoMessages}</p>
                        ) : (
                            messages.map(m => (
                                <div key={m.id} className={`flex gap-3 ${m.sender_role === 'reader' ? '' : 'flex-row-reverse'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 shadow-sm border ${m.sender_role === 'reader' ? 'bg-card text-emerald-400 border-border' : 'bg-card text-blue-400 border-border'}`}>
                                        {m.sender_name?.[0] || '?'}
                                    </div>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${m.sender_role === 'reader'
                                        ? 'bg-card border border-emerald-500/10 text-emerald-100 rounded-tr-none'
                                        : 'bg-card border border-blue-500/10 text-blue-100 rounded-tl-none'}`}>
                                        <div className="flex items-center justify-between gap-4 mb-1.5">
                                            <span className={`text-[11px] font-black uppercase tracking-wider ${m.sender_role === 'reader' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                                {m.sender_name} · {m.sender_role === 'reader' ? a.cvReader : a.cvStudent}
                                            </span>
                                            <span className="text-[10px] font-bold text-muted-foreground">
                                                {new Date(m.created_at).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="leading-relaxed font-medium">{m.message_text}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function ContactMessagesTab({ isAr, t }: { isAr: boolean, t: any }) {
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchMessages = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/contact-messages')
            if (res.ok) {
                const data = await res.json()
                setMessages(data.messages)
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchMessages()
    }, [fetchMessages])

    const updateStatus = async (id: string, status: string) => {
        const res = await fetch('/api/admin/contact-messages', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
        })
        if (res.ok) {
            fetchMessages()
        }
    }

    const deleteMessage = async (id: string) => {
        if (!confirm(a.cvDeleteMessageConfirm)) return
        const res = await fetch(`/api/admin/contact-messages?id=${id}`, {
            method: 'DELETE',
        })
        if (res.ok) {
            fetchMessages()
        }
    }

    return (
        <div className="space-y-6 text-right" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
                    <h3 className="font-bold text-foreground">
                        {t.admin.contactMessages} <span className="text-muted-foreground font-normal text-sm">({messages.length})</span>
                    </h3>
                </div>

                {loading ? (
                    <div className="flex justify-center p-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
                ) : messages.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground font-medium">{a.cvNoMessages}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-muted/50 text-muted-foreground text-[11px] font-black uppercase tracking-widest border-b border-border">
                                    <th className="px-6 py-4 font-black whitespace-nowrap">{t.admin.senderName}</th>
                                    <th className="px-6 py-4 font-black whitespace-nowrap">{t.admin.contactSubject}</th>
                                    <th className="px-6 py-4 font-black whitespace-nowrap">{t.admin.contactMessage}</th>
                                    <th className="px-6 py-4 font-black whitespace-nowrap">{t.admin.date}</th>
                                    <th className="px-6 py-4 font-black text-center whitespace-nowrap">{t.admin.status}</th>
                                    <th className="px-6 py-4 font-black text-center whitespace-nowrap">{t.admin.action}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {messages.map((m) => (
                                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-foreground whitespace-nowrap">{m.name}</div>
                                            <div className="text-[11px] text-muted-foreground font-medium">{m.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-foreground">{m.subject || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-muted-foreground max-w-md line-clamp-2 leading-relaxed" title={m.message}>
                                                {m.message}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-muted-foreground whitespace-nowrap">
                                            {new Date(m.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${m.status === 'unread' ? 'bg-orange-500/10 text-orange-400' :
                                                m.status === 'read' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                                                }`}>
                                                {t.admin[m.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {m.status === 'unread' && (
                                                    <Button variant="ghost" size="sm" onClick={() => updateStatus(m.id, 'read')} className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-500/10 rounded-lg" title={t.admin.markAsRead}>
                                                        <CheckCircle className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {m.status !== 'replied' && (
                                                    <Button variant="ghost" size="sm" onClick={() => updateStatus(m.id, 'replied')} className="h-8 w-8 p-0 text-emerald-400 hover:bg-emerald-500/10 rounded-lg" title={t.admin.markAsReplied}>
                                                        <MessageSquare className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" onClick={() => deleteMessage(m.id)} className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10 rounded-lg" title={t.delete}>
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

function DirectChatTab({ isAr, t }: { isAr: boolean, t: any }) {
    const searchParams = useSearchParams()
    const initialUserId = searchParams.get("userId")
    const initialUserRole = searchParams.get("userRole")

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConv, setActiveConv] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [text, setText] = useState("")
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)
    const [loadingMsgs, setLoadingMsgs] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const pollRef = useRef<NodeJS.Timeout | null>(null)
    const didInit = useRef(false)

    const openConversation = useCallback(async (conv: Conversation) => {
        setActiveConv(conv)
        setLoadingMsgs(true)
        if (pollRef.current) clearInterval(pollRef.current)
        try {
            const res = await fetch(`/api/conversations/${conv.id}/messages`)
            const d = await res.json()
            setMessages(d.messages || [])
        } finally { setLoadingMsgs(false) }
        pollRef.current = setInterval(async () => {
            const res = await fetch(`/api/conversations/${conv.id}/messages`)
            const d = await res.json()
            setMessages(d.messages || [])
        }, 5000)
    }, [])

    useEffect(() => {
        fetch("/api/auth/me").then(r => r.json()).then(d => setCurrentUserId(d.user?.id || null))
    }, [])

    useEffect(() => {
        let firstRun = true
        async function fetchConvs() {
            if (firstRun) setLoading(true)
            try {
                const res = await fetch("/api/conversations")
                const d = await res.json()
                const convs: Conversation[] = d.conversations || []
                setConversations(convs)

                setActiveConv(prev => {
                    if (!prev) return null;
                    const updated = convs.find(c => c.id === prev.id);
                    return updated || prev;
                });

                if (!didInit.current && initialUserId && initialUserRole) {
                    didInit.current = true
                    const existing = convs.find(c =>
                        !c.is_ticket && (
                            (initialUserRole === "student" && c.student_id === initialUserId) ||
                            (initialUserRole === "reader" && c.reader_id === initialUserId)
                        )
                    )
                    if (existing) {
                        openConversation(existing)
                    } else {
                        const cr = await fetch("/api/conversations", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: initialUserId, userRole: initialUserRole }),
                        })
                        if (cr.ok) {
                            const cd = await cr.json()
                            const newConvRes = await fetch("/api/conversations")
                            const allConvs = (await newConvRes.json()).conversations || []
                            setConversations(allConvs)
                            const newConv = allConvs.find((c: Conversation) => c.id === cd.conversation.id)
                            if (newConv) openConversation(newConv)
                        }
                    }
                } else if (!didInit.current && convs.length > 0) {
                    didInit.current = true
                }
            } finally {
                if (firstRun) setLoading(false)
                firstRun = false
            }
        }
        fetchConvs()
        const interval = setInterval(fetchConvs, 5000)
        return () => clearInterval(interval)
    }, [initialUserId, initialUserRole, openConversation])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

    const sendMessage = async () => {
        if (!text.trim() || !activeConv) return
        setSending(true)
        const optimistic: Message = {
            id: `tmp-${Date.now()}`,
            message_text: text,
            sender_id: currentUserId || "",
            sender_name: a.cvYou,
            sender_role: "admin",
            sender_avatar: null,
            created_at: new Date().toISOString(),
        }
        setMessages(p => [...p, optimistic])
        setText("")
        try {
            await fetch(`/api/conversations/${activeConv.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: optimistic.message_text }),
            })
            const res = await fetch(`/api/conversations/${activeConv.id}/messages`)
            const d = await res.json()
            setMessages(d.messages || [])
        } finally { setSending(false) }
    }

    const getOtherPartyName = (c: Conversation) => c.student_name || c.reader_name || a.cvUser
    const getOtherPartyAvatar = (c: Conversation) => c.student_avatar || c.reader_avatar
    const getOtherPartyRole = (c: Conversation) => c.student_id ? a.cvStudent : a.cvReader

    if (loading) return <ConversationsSkeleton />

    return (
        <div className="flex flex-col lg:flex-row-reverse gap-6 lg:h-[650px]">
            {/* Sidebar */}
            <div className="w-full lg:w-72 shrink-0 bg-card border border-border rounded-3xl overflow-hidden flex flex-col shadow-sm h-[350px] lg:h-full">
                <div className="px-5 py-4 border-b border-border bg-muted/30">
                    <p className="font-black text-sm text-foreground tracking-wide uppercase">
                        {t.admin.directChat} <span className="text-muted-foreground font-bold ml-1">({conversations.filter(c => !c.is_ticket).length})</span>
                    </p>
                </div>
                <div className="overflow-y-auto flex-1">
                    {conversations.filter(c => !c.is_ticket).length === 0 ? (
                        <div className="p-10 text-center space-y-3">
                            <MessageSquare className="w-10 h-10 text-muted mx-auto" />
                            <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                                {a.cvGoToProfile}
                            </p>
                        </div>
                    ) : (
                        conversations.filter(c => !c.is_ticket).map(c => {
                            const name = getOtherPartyName(c)
                            const avatar = getOtherPartyAvatar(c)
                            const role = getOtherPartyRole(c)
                            const isActive = activeConv?.id === c.id
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => openConversation(c)}
                                    className={`w-full text-right px-5 py-4 border-b border-border transition-all hover:bg-muted/30 ${isActive ? "bg-primary/10 border-r-4 border-r-primary" : ""}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-sm font-black shadow-sm border transition-all ${isActive ? 'bg-primary text-primary-foreground border-transparent' : 'bg-card text-emerald-400 border-border'}`}>
                                            {avatar ? (
                                                <img src={avatar} alt={name} className="w-full h-full rounded-2xl object-cover" />
                                            ) : (name[0] || "U")}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-black truncate mb-0.5 ${isActive ? 'text-primary' : 'text-foreground'}`}>{name}</p>
                                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{role}</p>
                                            {c.last_message_preview && (
                                                <p className="text-[11px] text-muted-foreground truncate mt-1 opacity-80">{c.last_message_preview}</p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-card border border-border rounded-3xl overflow-hidden flex flex-col shadow-sm h-[500px] lg:h-auto">
                {!activeConv || activeConv.is_ticket ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border border-border shadow-inner">
                            <MessageSquare className="w-10 h-10 opacity-30" />
                        </div>
                        <p className="text-sm font-black tracking-widest uppercase">{a.cvSelectConversation}</p>
                    </div>
                ) : (
                    <>
                        <div className="px-6 py-4 border-b border-border flex items-center gap-4 bg-muted/20">
                            <div className="w-10 h-10 rounded-xl bg-muted text-emerald-400 flex items-center justify-center text-sm font-black shadow-sm border border-border">
                                {getOtherPartyAvatar(activeConv) ? (
                                    <img src={getOtherPartyAvatar(activeConv)!} alt="" className="w-full h-full rounded-xl object-cover" />
                                ) : (getOtherPartyName(activeConv)[0])}
                            </div>
                            <div className="text-right">
                                <p className="font-black text-foreground text-sm leading-tight">{getOtherPartyName(activeConv)}</p>
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">{getOtherPartyRole(activeConv)}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/10">
                            {loadingMsgs ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.loading}</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10 gap-3">
                                    <MessageSquare className="w-12 h-12 opacity-20" />
                                    <p className="text-xs font-black uppercase tracking-widest">{a.cvStartConversation}</p>
                                </div>
                            ) : (
                                messages.map(m => {
                                    const isMe = m.sender_id === currentUserId
                                    return (
                                        <div key={m.id} className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-md transition-all ${isMe
                                                ? "bg-primary text-primary-foreground rounded-br-sm border-none"
                                                : "bg-card border border-border text-foreground rounded-bl-sm shadow-emerald-500/5"
                                                }`}>
                                                {!isMe && <p className="text-[10px] font-black mb-1.5 text-emerald-400 uppercase tracking-wider">{m.sender_name}</p>}
                                                <p className="leading-relaxed text-[14px]">{m.message_text}</p>
                                                <div className={`text-[9px] mt-2 flex items-center justify-between ${isMe ? "text-emerald-100/70" : "text-muted-foreground"}`}>
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{new Date(m.created_at).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={bottomRef} />
                        </div>

                        <div className="border-t border-border px-6 py-4 flex flex-row-reverse gap-3 bg-card">
                            <button
                                onClick={sendMessage}
                                disabled={!text.trim() || sending}
                                className="h-12 px-6 bg-primary text-primary-foreground rounded-2xl font-black text-sm hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center shrink-0"
                            >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                            <input
                                type="text"
                                value={text}
                                onChange={e => setText(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && sendMessage()}
                                placeholder={a.cvTypeMessage}
                                className="flex-1 bg-muted/30 border border-border rounded-2xl px-5 py-2.5 h-12 text-right text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary/20 focus:bg-card outline-none placeholder:text-muted-foreground transition-all"
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function TicketsTab({ isAr, t }: { isAr: boolean, t: any }) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConv, setActiveConv] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [text, setText] = useState("")
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)
    const [loadingMsgs, setLoadingMsgs] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
    const [supervisors, setSupervisors] = useState<any[]>([])
    const bottomRef = useRef<HTMLDivElement>(null)
    const pollRef = useRef<NodeJS.Timeout | null>(null)

    const openConversation = useCallback(async (conv: Conversation) => {
        setActiveConv(conv)
        setLoadingMsgs(true)
        if (pollRef.current) clearInterval(pollRef.current)
        try {
            const res = await fetch(`/api/conversations/${conv.id}/messages`)
            const d = await res.json()
            setMessages(d.messages || [])
        } finally { setLoadingMsgs(false) }
        pollRef.current = setInterval(async () => {
            const res = await fetch(`/api/conversations/${conv.id}/messages`)
            const d = await res.json()
            setMessages(d.messages || [])
        }, 5000)
    }, [])

    const updateTicketStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/admin/conversations`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ticket_status: status }),
            })
            if (res.ok) {
                const cRes = await fetch("/api/conversations")
                const cd = await cRes.json()
                const convs = (cd.conversations || []).filter((c: Conversation) => c.is_ticket)
                setConversations(convs)
                const updatedConv = convs.find((c: Conversation) => c.id === id)
                if (updatedConv) setActiveConv(updatedConv)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const delegateTicket = async (id: string, supervisorId: string) => {
        try {
            const res = await fetch(`/api/admin/conversations`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, assigned_supervisor_id: supervisorId || null }),
            })
            if (res.ok) {
                const cRes = await fetch("/api/conversations")
                const cd = await cRes.json()
                const convs = (cd.conversations || []).filter((c: Conversation) => c.is_ticket)
                setConversations(convs)
                const updatedConv = convs.find((c: Conversation) => c.id === id)
                if (updatedConv) setActiveConv(updatedConv)
            }
        } catch (error) {
            console.error(error)
        }
    }
    useEffect(() => {
        fetch("/api/auth/me").then(r => r.json()).then(d => {
            setCurrentUserId(d.user?.id || null)
            setCurrentUserRole(d.user?.role || null)
        })
        fetch("/api/admin/users?role=supervisors").then(r => r.json()).then(d => setSupervisors(d.users || []))
    }, [])

    useEffect(() => {
        let firstRun = true
        async function fetchConvs() {
            if (firstRun) setLoading(true)
            try {
                const res = await fetch("/api/conversations")
                const d = await res.json()
                const convs: Conversation[] = (d.conversations || []).filter((c: Conversation) => c.is_ticket)
                setConversations(convs)
            } finally {
                if (firstRun) setLoading(false)
                firstRun = false
            }
        }
        fetchConvs()
        const interval = setInterval(fetchConvs, 5000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

    const sendMessage = async () => {
        if (!text.trim() || !activeConv) return
        setSending(true)
        const optimistic: Message = {
            id: `tmp-${Date.now()}`,
            message_text: text,
            sender_id: currentUserId || "",
            sender_name: a.cvYou,
            sender_role: "admin",
            sender_avatar: null,
            created_at: new Date().toISOString(),
        }
        setMessages(p => [...p, optimistic])
        setText("")
        try {
            await fetch(`/api/conversations/${activeConv.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: optimistic.message_text }),
            })
            const cRes = await fetch("/api/conversations")
            const cd = await cRes.json()
            const updatedConv = cd.conversations.find((c: Conversation) => c.id === activeConv.id)
            if (updatedConv) setActiveConv(updatedConv)

            const res = await fetch(`/api/conversations/${activeConv.id}/messages`)
            const d = await res.json()
            setMessages(d.messages || [])
        } finally { setSending(false) }
    }

    const getOtherPartyName = (c: Conversation) => c.student_name || c.reader_name || a.cvUser
    const getOtherPartyAvatar = (c: Conversation) => c.student_avatar || c.reader_avatar
    const getOtherPartyRole = (c: Conversation) => c.student_id ? a.cvStudent : a.cvReader

    if (loading) return <ConversationsSkeleton />

    return (
        <div className="flex flex-col lg:flex-row-reverse gap-6 lg:h-[650px]">
            {/* Sidebar */}
            <div className="w-full lg:w-72 shrink-0 bg-card border border-border rounded-3xl overflow-hidden flex flex-col shadow-sm h-[350px] lg:h-full">
                <div className="px-5 py-4 border-b border-border bg-muted/30">
                    <p className="font-black text-sm text-foreground tracking-wide uppercase">
                        {a.cvSupportTickets} <span className="text-muted-foreground font-bold ml-1">({conversations.length})</span>
                    </p>
                </div>
                <div className="overflow-y-auto flex-1">
                    {conversations.length === 0 ? (
                        <div className="p-10 text-center space-y-3">
                            <Shield className="w-10 h-10 text-muted mx-auto" />
                            <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                                {a.cvNoTickets}
                            </p>
                        </div>
                    ) : (
                        conversations.map(c => {
                            const name = getOtherPartyName(c)
                            const avatar = getOtherPartyAvatar(c)
                            const role = getOtherPartyRole(c)
                            const isActive = activeConv?.id === c.id
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => openConversation(c)}
                                    className={`w-full text-right px-5 py-4 border-b border-border transition-all hover:bg-muted/30 ${isActive ? "bg-primary/10 border-r-4 border-r-primary" : ""}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-sm font-black shadow-sm border transition-all ${isActive ? 'bg-primary text-primary-foreground border-transparent' : 'bg-card text-emerald-400 border-border'}`}>
                                            {avatar ? (
                                                <img src={avatar} alt={name} className="w-full h-full rounded-2xl object-cover" />
                                            ) : (name[0] || "U")}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-black truncate mb-0.5 ${isActive ? 'text-primary' : 'text-foreground'}`}>{name}</p>
                                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{role}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${c.ticket_status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                                    {c.ticket_status || 'open'}
                                                </span>
                                                {c.supervisor_name && (
                                                    <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                                                        <Shield className="w-2.5 h-2.5" />
                                                        {c.supervisor_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-card border border-border rounded-3xl overflow-hidden flex flex-col shadow-sm">
                {!activeConv ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border border-border shadow-inner">
                            <Shield className="w-10 h-10 opacity-30" />
                        </div>
                        <p className="text-sm font-black tracking-widest uppercase">{a.cvSelectTicket}</p>
                    </div>
                ) : (
                    <>
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-muted text-emerald-400 flex items-center justify-center text-sm font-black shadow-sm border border-border">
                                    {getOtherPartyAvatar(activeConv) ? (
                                        <img src={getOtherPartyAvatar(activeConv)!} alt="" className="w-full h-full rounded-xl object-cover" />
                                    ) : (getOtherPartyName(activeConv)[0])}
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-foreground text-sm leading-tight">{getOtherPartyName(activeConv)}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">{getOtherPartyRole(activeConv)}</p>
                                        <span className="text-[10px] text-muted-foreground font-black">·</span>
                                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-tighter">{a.cvTicketNumber}{activeConv.id.slice(-4)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {currentUserRole === 'admin' && (
                                    <select
                                        className="bg-muted/50 border border-border rounded-xl px-3 py-1.5 text-xs font-black text-foreground outline-none"
                                        value={activeConv.assigned_supervisor_id || ""}
                                        onChange={(e) => delegateTicket(activeConv.id, e.target.value)}
                                    >
                                        <option value="">{a.cvAssignSupervisor}</option>
                                        {supervisors.map(s => (
                                            <option key={s.id} value={s.id}>{s.full_name}</option>
                                        ))}
                                    </select>
                                )}
                                <select
                                    className="bg-muted/50 border border-border rounded-xl px-3 py-1.5 text-xs font-black text-foreground outline-none"
                                    value={activeConv.ticket_status || "open"}
                                    onChange={(e) => updateTicketStatus(activeConv.id, e.target.value)}
                                >
                                    <option value="open">{a.cvOpen}</option>
                                    <option value="resolved">{a.cvResolved}</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/10">
                            {loadingMsgs ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.loading}</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <p className="text-xs font-black uppercase tracking-widest">{a.cvNoMessagesDots}</p>
                                </div>
                            ) : (
                                messages.map(m => {
                                    const isMe = m.sender_id === currentUserId
                                    return (
                                        <div key={m.id} className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-md transition-all ${isMe
                                                ? "bg-primary text-primary-foreground rounded-br-sm border-none"
                                                : "bg-card border border-border text-foreground rounded-bl-sm shadow-emerald-500/5"
                                                }`}>
                                                {!isMe && <p className="text-[10px] font-black mb-1.5 text-emerald-400 uppercase tracking-wider">{m.sender_name}</p>}
                                                <p className="leading-relaxed text-[14px]">{m.message_text}</p>
                                                <div className={`text-[9px] mt-2 flex items-center justify-between ${isMe ? "text-emerald-100/70" : "text-muted-foreground"}`}>
                                                    <span>{new Date(m.created_at).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={bottomRef} />
                        </div>

                        <div className="border-t border-border px-6 py-4 flex flex-row-reverse gap-3 bg-card">
                            <button
                                onClick={sendMessage}
                                disabled={!text.trim() || sending || activeConv.ticket_status === 'resolved'}
                                className="h-12 px-6 bg-primary text-primary-foreground rounded-2xl font-black text-sm hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center shrink-0"
                            >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                            <input
                                type="text"
                                value={text}
                                onChange={e => setText(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && sendMessage()}
                                disabled={activeConv.ticket_status === 'resolved'}
                                placeholder={activeConv.ticket_status === 'resolved' ? a.cvTicketResolved : a.cvTypeReply}
                                className="flex-1 bg-muted/30 border border-border rounded-2xl px-5 py-2.5 h-12 text-right text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary/20 focus:bg-card outline-none placeholder:text-muted-foreground transition-all"
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

const AdminConversationsContent = () => {
    const { t, locale } = useI18n()
    const a = t.admin
    const searchParams = useSearchParams()
    const isAr = locale === "ar"

    // Initialize tab based on URL parameters
    const [activeTab, setActiveTab] = useState<"supervision" | "direct-chat" | "tickets">(() => {
        return searchParams.get('userId') ? "direct-chat" : "supervision"
    })

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8" dir={isAr ? "rtl" : "ltr"}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="text-right">
                    <h1 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
                        <MessagesSquare className="w-8 h-8 text-primary" />
                        {t.admin.conversations}
                    </h1>
                    <p className="text-muted-foreground font-bold tracking-wide">{t.admin.conversationsSub}</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
                <TabsList className="bg-card border border-border p-1 rounded-2xl mb-8 flex w-full overflow-x-auto justify-start no-scrollbar gap-1">
                    <TabsTrigger value="supervision" className="rounded-xl px-8 font-black text-xs uppercase transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {t.admin.supervision}
                    </TabsTrigger>
                    <TabsTrigger value="direct-chat" className="rounded-xl px-8 font-black text-xs uppercase transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {t.admin.directChat}
                    </TabsTrigger>
                    <TabsTrigger value="tickets" className="rounded-xl px-8 font-black text-xs uppercase transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {a.cvTickets}
                    </TabsTrigger>
                    <TabsTrigger value="contact" className="rounded-xl px-8 font-black text-xs uppercase transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {t.admin.contactMessages}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="supervision">
                    <SupervisionTab isAr={isAr} t={t} />
                </TabsContent>
                <TabsContent value="direct-chat">
                    <DirectChatTab isAr={isAr} t={t} />
                </TabsContent>
                <TabsContent value="tickets">
                    <TicketsTab isAr={isAr} t={t} />
                </TabsContent>
                <TabsContent value="contact">
                    <ContactMessagesTab isAr={isAr} t={t} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default function AdminConversationsPage() {
    return (
        <Suspense fallback={<ConversationsSkeleton />}>
            <AdminConversationsContent />
        </Suspense>
    )
}
