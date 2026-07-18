"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { MessageSquare, Mail, User, Calendar, Clock, ExternalLink, CheckCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ContactMessage {
    id: string
    name: string
    email: string
    subject: string
    message: string
    created_at: string
    is_read?: boolean
}

export default function ContactMessagesPage() {
    const { t, locale } = useI18n()
    const isAr = locale === "ar"
    const [messages, setMessages] = useState<ContactMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)

    useEffect(() => {
        fetchMessages()
    }, [])

    const fetchMessages = async () => {
        try {
            const res = await fetch("/api/admin/contact-messages")
            if (res.ok) {
                const data = await res.json()
                setMessages(data.messages || [])
            }
        } catch (error) {
            console.error("Failed to fetch contact messages:", error)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (messageId: string) => {
        try {
            await fetch("/api/admin/contact-messages", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messageId, action: "mark_read" })
            })
            setMessages(prev => 
                prev.map(msg => 
                    msg.id === messageId ? { ...msg, is_read: true } : msg
                )
            )
            if (selectedMessage?.id === messageId) {
                setSelectedMessage(prev => prev ? { ...prev, is_read: true } : null)
            }
        } catch (error) {
            console.error("Failed to mark message as read:", error)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8" dir={isAr ? "rtl" : "ltr"}>
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
                        <Mail className="w-8 h-8 text-primary" />
                        {isAr ? "رسائل التواصل" : "Contact Messages"}
                    </h1>
                    <p className="text-muted-foreground font-bold tracking-wide">{isAr ? "إدارة الرسائل الواردة من نموذج التواصل" : "Manage incoming messages from the contact form"}</p>
                </div>
                {selectedMessage && (
                    <Button 
                        variant="outline" 
                        onClick={() => setSelectedMessage(null)}
                        className="lg:hidden rounded-2xl font-black border-border hover:bg-muted"
                    >
                        {isAr ? "العودة للقائمة" : "Back to List"}
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Messages List */}
                <div className={`lg:col-span-1 ${selectedMessage ? 'hidden lg:block' : 'block'}`}>
                    <Card className="bg-card border-border rounded-3xl shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border p-5">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-3">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                {isAr ? "جميع الرسائل" : "All Messages"} ({messages.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[600px] overflow-y-auto divide-y divide-border">
                            {messages.length === 0 ? (
                                <p className="text-muted-foreground text-center py-10 font-bold">{isAr ? "لا توجد رسائل" : "No messages"}</p>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`p-5 cursor-pointer transition-all hover:bg-muted/30 flex gap-4 ${
                                            selectedMessage?.id === message.id
                                                ? "bg-primary/5 border-r-4 border-r-primary"
                                                : ""
                                        }`}
                                        onClick={() => {
                                            setSelectedMessage(message)
                                            if (!message.is_read) {
                                                markAsRead(message.id)
                                            }
                                        }}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${!message.is_read ? 'bg-primary/10 text-primary border-primary/20 shadow-sm shadow-primary/10' : 'bg-muted text-muted-foreground border-border'}`}>
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0 text-right">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className={`text-sm font-black truncate ${!message.is_read ? "text-foreground" : "text-muted-foreground"}`}>{message.name}</p>
                                                {!message.is_read && (
                                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-sm shadow-primary/50"></div>
                                                )}
                                            </div>
                                            <p className="text-[11px] font-bold text-muted-foreground truncate mb-1">{message.email}</p>
                                            <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/60 mb-2">
                                                {formatDate(message.created_at)}
                                            </p>
                                            {message.subject && (
                                                <p className="text-[11px] text-foreground font-medium truncate bg-muted/30 px-2 py-1 rounded-lg">{message.subject}</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Message Details */}
                <div className={`lg:col-span-2 ${!selectedMessage ? 'hidden lg:block' : 'block'}`}>
                    {selectedMessage ? (
                        <Card className="bg-card border-border rounded-3xl shadow-sm overflow-hidden sticky top-6">
                            <CardHeader className="bg-muted/20 border-b border-border p-6">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                                    <div className="space-y-4 text-right">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-inner">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-xl font-black text-foreground">{selectedMessage.name}</h2>
                                                    {!selectedMessage.is_read && (
                                                        <Badge className="bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest rounded-lg h-5">{isAr ? "جديدة" : "New"}</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-muted-foreground">{selectedMessage.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-4 pt-2">
                                            <div className="flex items-center gap-2 text-[11px] font-black text-muted-foreground bg-muted p-2 rounded-xl border border-border">
                                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                                <span>{formatDate(selectedMessage.created_at)}</span>
                                            </div>
                                            {selectedMessage.subject && (
                                                <div className="flex items-center gap-2 text-[11px] font-black text-muted-foreground bg-muted p-2 rounded-xl border border-border">
                                                    <span className="text-primary">{isAr ? "الموضوع:" : "Subject:"}</span>
                                                    <span>{selectedMessage.subject}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        className="rounded-2xl font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 h-11 px-6 shrink-0 gap-2"
                                        onClick={() => window.open(`mailto:${selectedMessage.email}`, '_blank')}
                                    >
                                        <Mail className="w-4 h-4 ml-1" />
                                        {isAr ? "الرد عبر البريد" : "Reply via Email"}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="bg-muted/10 border border-border rounded-3xl p-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <MessageSquare className="w-20 h-20 text-primary" />
                                    </div>
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-primary mb-4">{isAr ? "محتوى الرسالة:" : "Message Content:"}</h4>
                                    <p className="text-foreground font-medium leading-relaxed whitespace-pre-wrap relative z-10">{selectedMessage.message}</p>
                                </div>
                                {!selectedMessage.is_read && (
                                    <div className="mt-6 flex justify-end">
                                        <Button
                                            onClick={() => markAsRead(selectedMessage.id)}
                                            variant="outline"
                                            className="rounded-2xl border-border hover:bg-muted font-black text-xs h-10 px-6 gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4 ml-1" />
                                            {isAr ? "تحديد كمقروءة" : "Mark as read"}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-card border-border border-dashed border-2 rounded-3xl shadow-none py-24">
                            <CardContent className="flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border border-border mb-6 shadow-inner">
                                    <Mail className="w-10 h-10 text-muted-foreground opacity-20" />
                                </div>
                                <h3 className="text-xl font-black text-muted-foreground mb-2 uppercase tracking-widest">{isAr ? "اختر رسالة للعرض" : "Select a message to view"}</h3>
                                <p className="text-muted-foreground font-bold max-w-xs">{isAr ? "اختر رسالة من القائمة لعرض تفاصيلها والرد عليها" : "Select a message from the list to view details and reply"}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
