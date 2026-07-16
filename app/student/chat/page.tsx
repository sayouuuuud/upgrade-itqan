"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, Send, MessageSquare, Trash2, Edit2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

type Conversation = {
    id: string
    reader_name: string | null
    reader_avatar: string | null
    admin_id: string | null
    admin_name: string | null
    admin_avatar: string | null
    last_message_preview: string | null
    last_message_at: string | null
    unread_count_student: number
    is_ticket?: boolean
    ticket_status?: string
}

type Message = {
    id: string
    message_text: string
    sender_id: string
    sender_name: string
    sender_role: string
    sender_avatar: string | null
    created_at: string
    updated_at?: string
}

export default function StudentChatPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col max-w-6xl mx-auto animate-pulse">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-muted rounded" />
                        <div className="h-4 w-72 bg-muted rounded" />
                    </div>
                    <div className="h-10 w-32 bg-muted rounded-xl" />
                </div>
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row-reverse gap-6">
                    <div className="border border-border w-full lg:w-1/3 rounded-2xl bg-card p-4 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex gap-3">
                                <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-4 bg-muted rounded w-1/3" />
                                    <div className="h-3 bg-muted rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border border-border w-full lg:w-2/3 rounded-2xl bg-card p-6 flex flex-col justify-center items-center">
                        <div className="w-16 h-16 rounded-full bg-muted mb-4" />
                        <div className="h-4 w-48 bg-muted rounded" />
                    </div>
                </div>
            </div>
        }>
            <StudentChatInner />
        </Suspense>
    )
}

function StudentChatInner() {
    const { t, locale } = useI18n()
    const { toast } = useToast()
    const isAr = locale === "ar"
    const searchParams = useSearchParams()
    const withReaderId = searchParams.get("with")

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConv, setActiveConv] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])

    const [messageText, setMessageText] = useState("")
    const [sending, setSending] = useState(false)
    const [loadingConvs, setLoadingConvs] = useState(true)
    const [loadingMsgs, setLoadingMsgs] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    const [activeTab, setActiveTab] = useState("messages")
    const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false)
    const [newTicketMessage, setNewTicketMessage] = useState("")
    const [creatingTicket, setCreatingTicket] = useState(false)

    const bottomRef = useRef<HTMLDivElement>(null)
    const pollRef = useRef<NodeJS.Timeout | null>(null)

    // Edit and Delete states
    const [editingMessage, setEditingMessage] = useState<Message | null>(null)
    const [deletingConvId, setDeletingConvId] = useState<string | null>(null)

    const openConversation = useCallback(async (conv: Conversation) => {
        setActiveConv(conv)
        setLoadingMsgs(true)
        if (pollRef.current) clearInterval(pollRef.current)
        try {
            const res = await fetch(`/api/conversations/${conv.id}/messages?_t=${Date.now()}`, { cache: "no-store" })
            if (res.ok) {
                const d = await res.json()
                setMessages(d.messages || [])

                // Mark as read in local state
                setConversations(prev =>
                    prev.map(c => c.id === conv.id ? { ...c, unread_count_student: 0 } : c)
                )
            }
        } finally { setLoadingMsgs(false); scrollToBottom() }

        pollRef.current = setInterval(async () => {
            const res = await fetch(`/api/conversations/${conv.id}/messages?_t=${Date.now()}`, { cache: "no-store" })
            if (res.ok) {
                const d = await res.json()
                setMessages(d.messages || [])
            }
        }, 5000)
    }, [])

    useEffect(() => {
        fetch("/api/auth/me").then(r => r.json()).then(d => setCurrentUserId(d.user?.id || null))

        // Fetch conversations
        const fetchConvs = async (init = false) => {
            try {
                const r = await fetch("/api/conversations")
                if (r.ok) {
                    const d = await r.json()
                    const convs = d.conversations || []
                    setConversations(convs)
                    
                    // If we have an active conversation, find its latest version in the fresh list
                    // to prevent state-drift or resets, but only update if it actually exists there.
                    setActiveConv(prev => {
                        if (!prev) return null;
                        const updated = convs.find((c: Conversation) => c.id === prev.id);
                        return updated || prev;
                    });

                    if (init) {
                        if (withReaderId) {
                            // Find or create conversation with this specific reader
                            const me = await fetch("/api/auth/me").then(r => r.json())
                            const myId = me.user?.id
                            if (myId) {
                                try {
                                    const res = await fetch("/api/conversations", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ studentId: myId, readerId: withReaderId }),
                                    })
                                    if (res.ok) {
                                        const convData = await res.json()
                                        const targetConvId = convData.conversation?.id
                                        // Refresh and find it
                                        const r2 = await fetch("/api/conversations")
                                        if (r2.ok) {
                                            const d2 = await r2.json()
                                            const allConvs = d2.conversations || []
                                            setConversations(allConvs)
                                            const target = allConvs.find((c: Conversation) => c.id === targetConvId)
                                            if (target) { openConversation(target); return }
                                        }
                                    }
                                } catch { }
                            }
                        }
                    }
                }
            } finally {
                if (init) setLoadingConvs(false)
            }
        }

        fetchConvs(true)
        const interval = setInterval(() => fetchConvs(false), 5000)
        return () => clearInterval(interval)
    }, [openConversation, withReaderId])

    const scrollToBottom = () => {
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
    }

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

    const handleSend = async () => {
        if (!messageText.trim() || !activeConv) return
        const fullMessage = messageText

        setSending(true)

        if (editingMessage) {
            // Edit existing message
            const oldMsgId = editingMessage.id
            setMessages(p => p.map(m => m.id === oldMsgId ? { ...m, message_text: fullMessage, updated_at: new Date().toISOString() } : m))
            setEditingMessage(null)
            setMessageText("")

            try {
                await fetch(`/api/conversations/${activeConv.id}/messages/${oldMsgId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message_text: fullMessage }),
                })
            } finally { setSending(false) }
            return
        }

        const optimisticMsg: Message = {
            id: `tmp-${Date.now()}`,
            message_text: fullMessage,
            sender_id: currentUserId || "",
            sender_name: t.student.you,
            sender_role: "student",
            sender_avatar: null,
            created_at: new Date().toISOString(),
        }
        setMessages(p => [...p, optimisticMsg])

        // Update last message in conv list optimistically
        setConversations(prev => {
            const updated = [...prev]
            const curIdx = updated.findIndex(c => c.id === activeConv.id)
            if (curIdx > -1) {
                updated[curIdx] = {
                    ...updated[curIdx],
                    last_message_preview: fullMessage.substring(0, 100),
                    last_message_at: optimisticMsg.created_at
                }
            }
            return updated.sort((a, b) => {
                if (!a.last_message_at) return 1
                if (!b.last_message_at) return -1
                return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
            })
        })

        scrollToBottom()

        try {
            const postRes = await fetch(`/api/conversations/${activeConv.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: fullMessage }),
            })

            if (!postRes.ok) {
                const errorData = await postRes.json().catch(() => ({}))
                toast({
                    variant: "destructive",
                    title: isAr ? '' : "Alert",
                    description: errorData.error || (isAr ? '' : "Failed to send message")
                })
                
                // Revert optimistic update
                const res = await fetch(`/api/conversations/${activeConv.id}/messages?_t=${Date.now()}`, { cache: "no-store" })
                if (res.ok) {
                    const d = await res.json()
                    setMessages(d.messages || [])
                }
                return
            }

            const successData = await postRes.json().catch(() => ({}))
            setMessageText("") // Clear upon successful response
            
            if (successData.message) {
                // Replace tmp message with real message from DB, preserving UI metadata
                setMessages(p => p.map(m => m.id === optimisticMsg.id ? { 
                    ...successData.message, 
                    sender_name: optimisticMsg.sender_name, 
                    sender_role: optimisticMsg.sender_role,
                    sender_avatar: optimisticMsg.sender_avatar 
                } : m))
            } else {
                const res = await fetch(`/api/conversations/${activeConv.id}/messages?_t=${Date.now()}`, { cache: "no-store" })
                if (res.ok) {
                    const d = await res.json()
                    setMessages(d.messages || [])
                }
            }
        } catch (err) {
            toast({
                variant: "destructive",
                title: isAr ? '' : "Error",
                description: isAr ? '' : "Connection error occurred"
            })
        } finally { setSending(false) }
    }

    const handleDeleteMessage = async (msgId: string) => {
        if (!activeConv || !confirm(t.sessionsPage.messageDeleteConfirmation)) return
        setMessages(p => p.filter(m => m.id !== msgId))
        try {
            await fetch(`/api/conversations/${activeConv.id}/messages/${msgId}`, { method: "DELETE" })
        } catch { } // Optimistic
    }

    const handleDeleteConversation = async () => {
        if (!activeConv || !confirm(t.sessionsPage.conversationDeleteConfirmation)) return
        setDeletingConvId(activeConv.id)
        try {
            await fetch(`/api/conversations/${activeConv.id}`, { method: "DELETE" })
            setConversations(p => p.filter(c => c.id !== activeConv.id))
            setActiveConv(null)
            setMessages([])
        } finally {
            setDeletingConvId(null)
        }
    }

    const avatarColors = [
        "bg-sky-100 text-sky-600",
        "bg-emerald-100 text-emerald-600",
        "bg-amber-100 text-amber-600",
        "bg-purple-100 text-purple-600",
    ]

    const handleCreateTicket = async () => {
        if (!newTicketMessage.trim()) return;
        setCreatingTicket(true);
        try {
            // 1. Create ticket
            const res = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isTicket: true }),
            });
            
            if (res.ok) {
                const convData = await res.json();
                const targetConvId = convData.conversation?.id;

                // 2. Send the initial message immediately
                const msgRes = await fetch(`/api/conversations/${targetConvId}/messages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: newTicketMessage }),
                });

                if (msgRes.ok) {
                    // Refresh UI
                    const r2 = await fetch("/api/conversations");
                    if (r2.ok) {
                        const d2 = await r2.json();
                        const allConvs = d2.conversations || [];
                        setConversations(allConvs);
                        const target = allConvs.find((c: Conversation) => c.id === targetConvId);

                        setIsTicketDialogOpen(false);
                        setNewTicketMessage("");
                        setActiveTab("tickets");

                        if (target) {
                            openConversation(target);
                            // Show success message
                            toast({
                                title: isAr ? '' : "Success",
                                description: t.sessionsPage.ticketSuccessToast
                            });
                        }
                    }
                } else {
                    const errorData = await msgRes.json();
                    toast({
                        variant: "destructive",
                        title: isAr ? '' : "Error",
                        description: errorData.error || (isAr ? '' : "Error sending message")
                    });
                }
            } else {
                const errorData = await res.json();
                toast({
                    variant: "destructive",
                    title: isAr ? '' : "Error",
                    description: errorData.error || (isAr ? '' : "Error creating ticket")
                });
            }
        } catch (e) {
            console.error(e);
            toast({
                variant: "destructive",
                title: isAr ? '' : "Error",
                description: isAr ? '' : "An error occurred"
            });
        } finally {
            setCreatingTicket(false);
        }
    }

    const currentConv = conversations.find(c => c.id === activeConv?.id) || activeConv

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                        {t.student.messagesTitle}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t.student.chatDescription || (isAr ? '' : "Here you can read messages and notes sent by the reciter regarding your recitation.")}
                    </p>
                </div>
                <Button
                    onClick={() => setIsTicketDialogOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    <MessageSquare className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t.sessionsPage.ticketCreateBtn}
                </Button>
            </div>


            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setActiveConv(null); setMessages([]); }} className="flex-1 min-h-0 flex flex-col">
                <div className="flex justify-end mb-6">
                    <TabsList className="bg-muted p-1 border border-border shadow-sm h-12 rounded-full overflow-hidden flex-row-reverse">
                        <TabsTrigger 
                            value="tickets" 
                            className="rounded-full font-bold gap-2 px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all text-sm h-full flex items-center"
                        >
                            <span className="text-xl font-light opacity-50 mb-0.5">⋮</span>
                            {t.sessionsPage.ticketListTitle}
                        </TabsTrigger>
                        <TabsTrigger 
                            value="messages" 
                            className="rounded-full font-bold gap-2 px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all text-sm h-full flex items-center"
                        >
                            <MessageSquare className="w-4 h-4" />
                            {t.student.messagesTitle || (isAr ? '' : "Messages")}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 min-h-0 flex flex-col lg:flex-row-reverse gap-6">
                    {/* Conversations List */}
                    <Card className="border-border w-full lg:w-1/3 flex flex-col h-full overflow-hidden shadow-sm">
                        <CardHeader className="pb-3 border-b border-border bg-muted/30">
                        <CardTitle className="text-base font-bold text-foreground/80">
                                {activeTab === "messages" ? t.student.conversationsHeader : t.sessionsPage.ticketListTitle}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-y-auto">
                             {loadingConvs ? (
                                <div className="p-4 space-y-4 animate-pulse">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="flex gap-3 items-center">
                                            <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
                                            <div className="flex-1 space-y-2 py-1">
                                                <div className="h-4 bg-muted rounded w-1/2" />
                                                <div className="h-3 bg-muted rounded w-3/4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : conversations.filter(c => activeTab === "tickets" ? c.is_ticket : !c.is_ticket).length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                                    <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-2" />
                                    <p className="font-medium text-muted-foreground">
                                        {activeTab === "messages" ? (t.student.noConversationsYet || (isAr ? '' : "No messages currently.")) : t.sessionsPage.noTicketsYet}
                                    </p>
                                    <p className="text-xs text-muted-foreground/60 mt-1 text-center">
                                        {activeTab === "messages" ? (t.student.noMessagesDesc || (isAr ? '' : "The reciter's notes or any messages related to your recitation will appear here.")) : ""}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {conversations.filter(c => activeTab === "tickets" ? c.is_ticket : !c.is_ticket).map((c, idx) => {
                                        const colorClass = avatarColors[idx % avatarColors.length]
                                        const isSelected = activeConv?.id === c.id
                                        const hasUnread = c.unread_count_student > 0
                                        const name = c.is_ticket ? t.sessionsPage.supportTeamName : (c.admin_id ? t.admin?.administration || '' : (c.reader_name || t.student.certifiedReaderFallback))

                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => openConversation(c)}
                                                className={`w-full flex items-center gap-3 p-4 text-right transition-colors hover:bg-muted/50 relative ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""
                                                    }`}
                                            >
                                                <div className="relative">
                                                    <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-bold text-lg ${c.admin_id || c.is_ticket ? 'bg-amber-500/10 text-amber-700 dark:text-amber-500' : colorClass}`}>
                                                        {(c.admin_avatar || c.reader_avatar) ? (
                                                              <img src={(c.admin_avatar || c.reader_avatar)!} alt={name} className="w-full h-full rounded-full object-cover" />
                                                        ) : (name[0] || t.userFallbackLetter)}
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex justify-between items-baseline mb-1 gap-2">
                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                            <p className={`text-sm truncate ${hasUnread ? "font-extrabold text-primary" : "font-semibold text-foreground"}`}>
                                                                {name}
                                                            </p>
                                                            {c.is_ticket && (
                                                                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400">
                                                                    {t.sessionsPage.ticketBadge}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {c.last_message_at && (
                                                            <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                                                                {new Date(c.last_message_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { day: 'numeric', month: 'short' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-center gap-2">
                                                        <p className={`text-xs truncate ${hasUnread ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                                                            {c.last_message_preview || t.student.startConversationMsg}
                                                        </p>
                                                        {hasUnread && (
                                                            <span className="shrink-0 w-2 h-2 rounded-full bg-red-500 flex animate-pulse" />
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Chat Area */}
                    <Card className="border-border w-full lg:w-2/3 flex flex-col h-full overflow-hidden shadow-sm">
                        {currentConv ? (
                            <>
                                <CardHeader className="pb-4 flex flex-row items-center gap-3 space-y-0 border-b border-border bg-muted/20">
                                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${currentConv.admin_id || currentConv.is_ticket ? 'bg-amber-500/10 text-amber-700 dark:text-amber-500' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                                        {(currentConv.admin_avatar || currentConv.reader_avatar) ? (
                                            <img src={(currentConv.admin_avatar || currentConv.reader_avatar)!} alt="avatar" className="w-full h-full rounded-full object-cover" />
                                        ) : (currentConv.is_ticket ? (isAr ? '' : 'S') : currentConv.admin_id ? (t.admin?.administration?.[0] || '') : (currentConv.reader_name?.[0] || t.userFallbackLetter))}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <CardTitle className="text-base text-foreground truncate max-w-full">
                                                {currentConv.is_ticket ? t.sessionsPage.supportTeamName : (currentConv.admin_id ? (t.admin?.administration || '') : (currentConv.reader_name || t.student.certifiedReaderFallback))}
                                            </CardTitle>
                                            {currentConv.is_ticket && (
                                                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400">
                                                    {t.sessionsPage.ticketBadge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {currentConv.is_ticket ? t.sessionsPage.supportTeamDesc : (currentConv.admin_id ? (isAr ? '' : "Platform Admin") : t.student.certifiedReaderFallback)}
                                        </p>
                                    </div>
                                    {!currentConv.is_ticket && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={handleDeleteConversation}
                                            disabled={deletingConvId === currentConv.id}
                                            title={isAr ? '' : "Delete Conversation"}
                                        >
                                            {deletingConvId === currentConv.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                        </Button>
                                    )}
                                </CardHeader>

                                <CardContent className="flex-1 overflow-y-auto p-5 space-y-6">
                                    {/* Messages */}
                                    {loadingMsgs ? (
                                        <div className="space-y-4 p-4 animate-pulse">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                                                    <div className="h-12 w-48 bg-muted rounded-2xl" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                            <MessageSquare className="w-12 h-12 text-muted-foreground/20 mb-3 opacity-50" />
                                            <p className="font-medium text-muted-foreground">
                                                {isAr ? '' : "No messages currently."}
                                            </p>
                                            <p className="text-xs text-muted-foreground/60 mt-1 text-center">
                                                {isAr ? '' : "The reciter's notes or any messages related to your recitation will appear here."}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((msg) => {
                                                const isMe = msg.sender_id === currentUserId
                                                return (
                                                    <div
                                                        key={msg.id}
                                                        className={`flex ${isMe ? "justify-start" : "justify-end"} group relative`}
                                                    >
                                                        {isMe && !currentConv.is_ticket && (
                                                            <div className="absolute -top-3 rtl:right-0 ltr:left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-card border border-border shadow-sm rounded-lg overflow-hidden py-1 px-1 z-10">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingMessage(msg)
                                                                        setMessageText(msg.message_text)
                                                                    }}
                                                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded transition-colors"
                                                                    title={isAr ? '' : "Edit"}
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded transition-colors"
                                                                    title={isAr ? '' : "Delete"}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        <div
                                                            className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-3 text-sm shadow-md transition-all ${isMe
                                                                ? "bg-primary text-primary-foreground rounded-br-sm list-item-box-me"
                                                                : "bg-card border border-border text-foreground rounded-bl-sm list-item-box-reader shadow-emerald-500/5"
                                                                }`}
                                                        >
                                                            {!isMe && (
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <p className="text-[11px] font-bold text-accent">
                                                                        {msg.sender_role === 'admin' ? t.admin?.administration || '' : msg.sender_name}
                                                                    </p>
                                                                    <span className="text-[9px] text-muted-foreground font-medium whitespace-nowrap">
                                                                        {new Date(msg.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { day: 'numeric', month: 'short' })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="space-y-2.5">
                                                                <p className="whitespace-pre-wrap leading-relaxed text-[14px]">{msg.message_text}</p>
                                                            </div>
                                                            <div className={`text-[9px] mt-2 flex items-center justify-between ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                                                                }`}>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span>{new Date(msg.created_at).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                                                                    {isMe && (
                                                                        <span className="flex items-center">
                                                                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                <path d="M4 12.89L9.11 18L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                                                <path d="M4 7.89L9.11 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40" />
                                                                            </svg>
                                                                            <span className="sr-only">{isAr ? '' : "Read"}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {msg.updated_at && <span className="opacity-70 italic font-medium">{isAr ? '' : "(edited)"}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            <div ref={bottomRef} />
                                        </>
                                    )}
                                </CardContent>

                                {/* Input */}
                                <div className="p-4 border-t border-border bg-card">
                                    {currentConv.is_ticket && (currentConv.ticket_status === 'closed' || currentConv.ticket_status === 'resolved') ? (
                                        <div className="text-center p-3 bg-muted text-muted-foreground rounded-xl text-sm border border-border">
                                            {t.sessionsPage.ticketClosedMsg}
                                        </div>
                                    ) : (
                                        <>
                                            {editingMessage && (
                                                <div className="flex items-center justify-between bg-accent/10 text-accent p-2 rounded-lg text-xs mb-2 border border-accent/20">
                                                    <div className="flex items-center gap-2">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                        <span>{t.sessionsPage.editingMessageLabel}</span>
                                                    </div>
                                                    <button onClick={() => { setEditingMessage(null); setMessageText("") }} className="hover:underline font-bold">
                                                        {t.sessionsPage.cancelEditBtn}
                                                    </button>
                                                </div>
                                            )}
                                            <div className="flex items-end gap-3">
                                                <Textarea
                                                    placeholder={t.student.writeMessagePlaceholder || (isAr ? '' : "Type your message...")}
                                                    value={messageText}
                                                    onChange={(e) => setMessageText(e.target.value)}
                                                    rows={1}
                                                    disabled={sending}
                                                    className="resize-none border-border bg-muted focus-visible:ring-primary min-h-[44px] py-2.5"
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" && !e.shiftKey) {
                                                            e.preventDefault()
                                                            handleSend()
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    size="icon"
                                                    className="h-11 w-11 shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-sm"
                                                    onClick={handleSend}
                                                    disabled={!messageText.trim() || sending}
                                                    aria-label={isAr ? '' : "Send"}
                                                >
                                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rtl:-scale-x-100" />}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                                <MessageSquare className="w-16 h-16 text-muted-foreground/20 mb-4" />
                                <p className="font-medium text-muted-foreground">
                                    {isAr ? '' : "Select a conversation to start chatting"}
                                </p>
                            </div>
                        )}
                    </Card>
                </div>
            </Tabs >

            <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
                <DialogContent className="sm:max-w-md bg-card p-0 border-border rounded-2xl overflow-hidden shadow-2xl">
                    <DialogHeader className="p-6 bg-muted/30 border-b border-border">
                        <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            {t.sessionsPage.ticketCreateBtn}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm mt-1.5">
                            {isAr ? '' : "Please describe your issue or inquiry, and we will get back to you as soon as possible."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="space-y-2 text-right">
                                <label className="text-sm font-bold text-foreground/80">{isAr ? '' : "Message text"}</label>
                                <Textarea
                                    placeholder={t.student.writeMessagePlaceholder || (isAr ? '' : "Write details here...")}
                                    value={newTicketMessage}
                                    onChange={(e) => setNewTicketMessage(e.target.value)}
                                    rows={5}
                                    className="resize-none bg-muted border-border focus-visible:ring-primary"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-muted/30 border-t border-border sm:justify-start flex-row-reverse">
                        <Button
                            type="button"
                            disabled={!newTicketMessage.trim() || creatingTicket}
                            onClick={handleCreateTicket}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground sm:ml-auto"
                        >
                            {creatingTicket && <Loader2 className="w-4 h-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" />}
                            {isAr ? '' : "Submit Ticket"}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsTicketDialogOpen(false)}
                            className="text-muted-foreground hover:bg-muted sm:mr-2"
                        >
                            {t.sessionsPage.cancelEditBtn}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
