"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Send, Link2, MessageSquare, Loader2, Trash2, Edit2, PlusCircle, Search, ShieldAlert } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useSearchParams, useRouter } from "next/navigation"
import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton"

type Conversation = {
  id: string
  student_id: string
  reader_id: string
  last_message_preview: string | null
  last_message_at: string | null
  unread_count_reader: number
  student_name: string | null
  student_avatar?: string | null
  admin_name?: string | null
  admin_avatar?: string | null
}

type Message = {
  id: string
  sender_id: string
  message_text: string
  created_at: string
  updated_at?: string
}

function ReaderChatContent() {
  const { t } = useI18n()
  const reader = (t as any).reader as Record<string, string> | undefined
  const isAr = t.locale === "ar"
  const searchParams = useSearchParams()
  const router = useRouter()

  const urlUserId = searchParams.get('userId')
  const urlUserRole = searchParams.get('userRole')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)

  const [messageText, setMessageText] = useState("")
  const [linkText, setLinkText] = useState("")
  const [sending, setSending] = useState(false)

  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null)

  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [chatType, setChatType] = useState<"student" | "admin">("student")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    async function loadConversations(init = false) {
      try {
        const res = await fetch("/api/conversations")
        if (res.ok) {
          const data = await res.json()
          setConversations(data.conversations || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (init) setLoadingConvs(false)
      }
    }
    loadConversations(true)
    const interval = setInterval(() => loadConversations(false), 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!loadingConvs && urlUserId && urlUserRole === "student") {
      const existingConv = conversations.find(c => c.student_id === urlUserId)
      if (existingConv) {
        setSelectedConvId(existingConv.id)
      } else {
        startConversation(urlUserId, false)
      }
      router.replace("/reader/chat")
    }
  }, [loadingConvs, urlUserId, urlUserRole, conversations, router])

  useEffect(() => {
    if (!selectedConvId) return

    if (pollRef.current) clearInterval(pollRef.current)

    async function loadMessages(init = false) {
      if (init) setLoadingMsgs(true)
      try {
        const res = await fetch(`/api/conversations/${selectedConvId}/messages`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])

          // Mark as read in local state
          setConversations(prev =>
            prev.map(c => c.id === selectedConvId ? { ...c, unread_count_reader: 0 } : c)
          )
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (init) {
          setLoadingMsgs(false)
          scrollToBottom()
        }
      }
    }
    loadMessages(true)

    pollRef.current = setInterval(() => loadMessages(false), 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [selectedConvId])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const currentConv = conversations.find(c => c.id === selectedConvId)

  const getOtherPartyName = (c: Conversation) => c.student_name || c.admin_name || ((t.addedTranslations_2026?.['الدعم الفني'] || (t.addedTranslations_2026?.['الدعم الفني'] || 'الدعم الفني')))
  const getOtherPartyAvatar = (c: Conversation) => c.student_avatar || c.admin_avatar
  const getOtherPartyRole = (c: Conversation) => c.student_id ? ((t.addedTranslations_2026?.['طالب'] || (t.addedTranslations_2026?.['طالب'] || 'طالب'))) : ((t.addedTranslations_2026?.['الدعم الفني'] || (t.addedTranslations_2026?.['الدعم الفني'] || 'الدعم الفني')))

  const handleSend = async () => {
    if ((!messageText.trim() && !linkText.trim()) || !selectedConvId) return

    const fullMessage = linkText.trim()
      ? `${messageText}\n${linkText}`
      : messageText

    setSending(true)

    if (editingMessage) {
      const oldMsgId = editingMessage.id
      setMessages(p => p.map(m => m.id === oldMsgId ? { ...m, message_text: fullMessage, updated_at: new Date().toISOString() } : m))
      setEditingMessage(null)
      setMessageText("")
      setLinkText("")

      try {
        await fetch(`/api/conversations/${selectedConvId}/messages/${oldMsgId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message_text: fullMessage }),
        })
      } finally { setSending(false) }
      return
    }

    try {
      const res = await fetch(`/api/conversations/${selectedConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullMessage }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages([...messages, data.message])

        // Update last message in conv list
        setConversations(prev => {
          const updated = [...prev]
          const curIdx = updated.findIndex(c => c.id === selectedConvId)
          if (curIdx > -1) {
            updated[curIdx] = {
              ...updated[curIdx],
              last_message_preview: data.message.message_text.substring(0, 100),
              last_message_at: data.message.created_at
            }
          }
          // Sort bringing recent to top
          return updated.sort((a, b) => {
            if (!a.last_message_at) return 1
            if (!b.last_message_at) return -1
            return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
          })
        })

        setMessageText("")
        setLinkText("")
        scrollToBottom()
      } else {
        const errorData = await res.json().catch(() => ({}))
        alert(errorData.error || ((t.addedTranslations_2026?.['فشل إرسال الرسالة'] || (t.addedTranslations_2026?.['فشل إرسال الرسالة'] || 'فشل إرسال الرسالة'))))
      }
    } catch {
      alert((t.addedTranslations_2026?.['حدث خطأ في الإتصال'] || (t.addedTranslations_2026?.['حدث خطأ في الإتصال'] || 'حدث خطأ في الإتصال')))
    } finally {
      setSending(false)
    }
  }

  const handleDeleteMessage = async (msgId: string) => {
    if (!selectedConvId || !confirm((t.addedTranslations_2026?.['هل أنت متأكد من حذف هذه الرسالة؟'] || (t.addedTranslations_2026?.['هل أنت متأكد من حذف هذه الرسالة؟'] || 'هل أنت متأكد من حذف هذه الرسالة؟')))) return
    setMessages(p => p.filter(m => m.id !== msgId))
    try {
      await fetch(`/api/conversations/${selectedConvId}/messages/${msgId}`, { method: "DELETE" })
    } catch { } // Optimistic update
  }

  const handleDeleteConversation = async () => {
    if (!selectedConvId || !confirm((t.addedTranslations_2026?.['هل أنت متأكد من حذف هذه المحادثة نهائياً لكلا الطرفين؟'] || (t.addedTranslations_2026?.['هل أنت متأكد من حذف هذه المحادثة نهائياً لكلا الطرفين؟'] || 'هل أنت متأكد من حذف هذه المحادثة نهائياً لكلا الطرفين؟')))) return
    setDeletingConvId(selectedConvId)
    try {
      await fetch(`/api/conversations/${selectedConvId}`, { method: "DELETE" })
      setConversations(p => p.filter(c => c.id !== selectedConvId))
      setSelectedConvId(null)
      setMessages([])
    } finally {
      setDeletingConvId(null)
    }
  }

  // Handle Search internally
  useEffect(() => {
    if (chatType !== "student") return
    const delayDebounceFn = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }
      setSearching(true)
      try {
        const res = await fetch(`/api/reader/search?q=${encodeURIComponent(searchQuery)}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.students || [])
        }
      } catch (err) { console.error('Student search failed:', err) }
      finally { setSearching(false) }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, chatType])

  const startConversation = async (participantId?: string, isTicket: boolean = false) => {
    setCreating(true)
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isTicket ? {
          otherRole: "admin",
          is_ticket: true
        } : {
          participantId,
          otherRole: "student",
          is_ticket: false
        })
      })

      if (res.ok) {
        const data = await res.json()
        const newConv = data.conversation
        setConversations(prev => {
          const exists = prev.find(c => c.id === newConv.id)
          if (exists) return prev
          return [newConv, ...prev]
        })
        setSelectedConvId(newConv.id)
        setIsNewChatOpen(false)
      } else {
        alert((t.addedTranslations_2026?.['فشل إنشاء المحادثة'] || (t.addedTranslations_2026?.['فشل إنشاء المحادثة'] || 'فشل إنشاء المحادثة')))
      }
    } catch {
      alert((t.addedTranslations_2026?.['حدث خطأ'] || (t.addedTranslations_2026?.['حدث خطأ'] || 'حدث خطأ')))
    } finally {
      setCreating(false)
    }
  }

  const avatarColors = [
    "bg-sky-100 text-sky-600",
    "bg-emerald-100 text-emerald-600",
    "bg-amber-100 text-amber-600",
    "bg-purple-100 text-purple-600",
  ]

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {(t.addedTranslations_2026?.['المحادثات'] || (t.addedTranslations_2026?.['المحادثات'] || 'المحادثات'))}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {(t.addedTranslations_2026?.['تواصل مع الطلاب حول ملاحظات التلاوة والمواعيد'] || (t.addedTranslations_2026?.['تواصل مع الطلاب حول ملاحظات التلاوة والمواعيد'] || 'تواصل مع الطلاب حول ملاحظات التلاوة والمواعيد'))}
        </p>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="border-border lg:col-span-1 flex flex-col h-full overflow-hidden shadow-sm">
          <CardHeader className="pb-3 border-b border-border bg-muted flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-bold text-foreground">
              {(t.addedTranslations_2026?.['قائمة المحادثات'] || (t.addedTranslations_2026?.['قائمة المحادثات'] || 'قائمة المحادثات'))}
            </CardTitle>
            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-2 bg-background">
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">{(t.addedTranslations_2026?.['محادثة جديدة'] || (t.addedTranslations_2026?.['محادثة جديدة'] || 'محادثة جديدة'))}</span>
                </Button>
              </DialogTrigger>
              {isNewChatOpen && (
                <DialogContent className="max-w-md" dir={isAr ? "rtl" : "ltr"}>
                  <DialogHeader>
                    <DialogTitle>{(t.addedTranslations_2026?.['بدء محادثة جديدة'] || (t.addedTranslations_2026?.['بدء محادثة جديدة'] || 'بدء محادثة جديدة'))}</DialogTitle>
                  </DialogHeader>

                  <div className="flex bg-muted p-1 rounded-xl mb-4 mt-2">
                    <button
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${chatType === "student" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted-foreground/10"}`}
                      onClick={() => setChatType("student")}
                    >
                      {(t.addedTranslations_2026?.['مع طالب'] || (t.addedTranslations_2026?.['مع طالب'] || 'مع طالب'))}
                    </button>
                    <button
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${chatType === "admin" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted-foreground/10"}`}
                      onClick={() => setChatType("admin")}
                    >
                      <ShieldAlert className="w-4 h-4" />
                      {(t.addedTranslations_2026?.['تذكرة دعم فني'] || (t.addedTranslations_2026?.['تذكرة دعم فني'] || 'تذكرة دعم فني'))}
                    </button>
                  </div>

                  {chatType === "student" && (
                    <div className="space-y-4 min-h-[300px]">
                      <div className="relative">
                        <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-3 rtl:right-3 ltr:left-3 rtl:translate-x-0 ltr:-translate-x-0" />
                        <Input
                          placeholder={(t.addedTranslations_2026?.['ابحث عن طالب بالاسم أو الإيميل...'] || (t.addedTranslations_2026?.['ابحث عن طالب بالاسم أو الإيميل...'] || 'ابحث عن طالب بالاسم أو الإيميل...'))}
                          className="pl-9 rtl:pr-9 rtl:pl-3 bg-muted/50 border-border"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {searching ? (
                          <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                        ) : searchResults.length === 0 ? (
                          <div className="text-center p-4 text-sm text-muted-foreground">
                            {searchQuery ? ((t.addedTranslations_2026?.['لا توجد نتائج'] || (t.addedTranslations_2026?.['لا توجد نتائج'] || 'لا توجد نتائج'))) : ((t.addedTranslations_2026?.['يرجى البحث باسم الطالب للبدء'] || (t.addedTranslations_2026?.['يرجى البحث باسم الطالب للبدء'] || 'يرجى البحث باسم الطالب للبدء')))}
                          </div>
                        ) : (
                          searchResults.map(s => (
                            <button
                              key={s.id}
                              onClick={() => startConversation(s.id, false)}
                              disabled={creating}
                              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-primary/5 transition-all text-right disabled:opacity-50"
                            >
                              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                                {s.avatar_url ? <img src={s.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : s.name[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-foreground truncate">{s.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                              </div>
                              <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {chatType === "admin" && (
                    <div className="space-y-4 py-6 text-center">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        {(t.addedTranslations_2026?.['تواصل مع الإدارة'] || (t.addedTranslations_2026?.['تواصل مع الإدارة'] || 'تواصل مع الإدارة'))}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
                        {(t.addedTranslations_2026?.['سيتم فتح تذكرة دعم فني جديدة للتواصل مع مشرفي الموقع حول أي استفسارات أو مشاكل تقنية.'] || (t.addedTranslations_2026?.['سيتم فتح تذكرة دعم فني جديدة للتواصل مع مشرفي الموقع حول أي استفسارات أو مشاكل تقنية.'] || 'سيتم فتح تذكرة دعم فني جديدة للتواصل مع مشرفي الموقع حول أي استفسارات أو مشاكل تقنية.'))}
                      </p>
                      <Button 
                        onClick={() => startConversation(undefined, true)}
                        disabled={creating}
                        className="w-full max-w-xs mx-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12"
                      >
                        {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : ((t.addedTranslations_2026?.['فتح تذكرة الدعم المحادثة'] || (t.addedTranslations_2026?.['فتح تذكرة الدعم المحادثة'] || 'فتح تذكرة الدعم المحادثة')))}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              )}
            </Dialog>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#0B3D2E]" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground mb-2" />
                <p>{(t.addedTranslations_2026?.['لا توجد محادثات سابقة'] || (t.addedTranslations_2026?.['لا توجد محادثات سابقة'] || 'لا توجد محادثات سابقة'))}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {conversations.map((conv, idx) => {
                  const colorClass = avatarColors[idx % avatarColors.length]
                  const isSelected = selectedConvId === conv.id
                  const hasUnread = conv.unread_count_reader > 0

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full flex items-center gap-3 p-4 text-right transition-colors hover:bg-muted relative ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""
                        }`}
                    >
                      <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-bold text-lg ${colorClass}`}>
                        {getOtherPartyAvatar(conv) ? (
                          <img src={getOtherPartyAvatar(conv)!} alt={getOtherPartyName(conv)} className="w-full h-full rounded-full object-cover" />
                        ) : (getOtherPartyName(conv)[0] || (t.addedTranslations_2026?.['م'] || 'م'))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                          <p className={`text-sm truncate ${hasUnread ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>
                            {getOtherPartyName(conv)}
                          </p>
                          {conv.last_message_at && (
                            <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap ml-2">
                              {new Date(conv.last_message_at).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${hasUnread ? "font-medium text-slate-700" : "text-slate-500"}`}>
                          {conv.last_message_preview || (t.addedTranslations_2026?.['بدء محادثة جديدة'] || 'بدء محادثة جديدة')}
                        </p>
                      </div>
                      {hasUnread && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#D4A843]" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="border-border lg:col-span-2 flex flex-col h-full overflow-hidden shadow-sm">
          {currentConv ? (
            <>
              <CardHeader className="border-b border-border pb-4 bg-card flex flex-row items-center gap-3 space-y-0">
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm bg-emerald-100 text-emerald-600`}>
                  {getOtherPartyAvatar(currentConv) ? (
                    <img src={getOtherPartyAvatar(currentConv)!} alt={getOtherPartyName(currentConv)} className="w-full h-full rounded-full object-cover" />
                  ) : (getOtherPartyName(currentConv)[0] || (t.addedTranslations_2026?.['م'] || 'م'))}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base text-slate-800">{getOtherPartyName(currentConv)}</CardTitle>
                  <p className="text-xs text-slate-500">{getOtherPartyRole(currentConv)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={handleDeleteConversation}
                  disabled={deletingConvId === currentConv.id}
                  title={(t.addedTranslations_2026?.['حذف المحادثة'] || (t.addedTranslations_2026?.['حذف المحادثة'] || 'حذف المحادثة'))}
                >
                  {deletingConvId === currentConv.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </Button>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20 space-y-4">
                {loadingMsgs ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0B3D2E]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
                    <p>{(t.addedTranslations_2026?.['أرسل رسالة للترحيب بالطالب'] || (t.addedTranslations_2026?.['أرسل رسالة للترحيب بالطالب'] || 'أرسل رسالة للترحيب بالطالب'))}</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const isReader = msg.sender_id === currentConv.reader_id
                      const isLast = idx === messages.length - 1
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isReader ? "justify-start" : "justify-end"} group relative`}
                        >
                          {isReader && (
                            <div className="absolute -top-3 rtl:right-0 ltr:left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-card border border-border shadow-sm rounded-lg overflow-hidden py-1 px-1 z-10">
                              <button
                                onClick={() => {
                                  setEditingMessage(msg)
                                  setMessageText(msg.message_text)
                                  setLinkText("")
                                }}
                                className="p-1.5 text-slate-400 hover:text-[#0B3D2E] hover:bg-slate-50 rounded transition-colors"
                                title={(t.addedTranslations_2026?.['تعديل'] || (t.addedTranslations_2026?.['تعديل'] || 'تعديل'))}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1.5 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                title={(t.addedTranslations_2026?.['حذف'] || (t.addedTranslations_2026?.['حذف'] || 'حذف'))}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isReader
                              ? "bg-[#0B3D2E] text-white rounded-br-sm"
                              : "bg-card border border-border text-foreground rounded-bl-sm"
                              }`}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.message_text}</p>
                            <div className={`text-[10px] mt-2 flex items-center justify-between ${isReader ? "text-emerald-100/70" : "text-slate-400"
                              }`}>
                              <span>{new Date(msg.created_at).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                              {msg.updated_at && <span className="ml-2 rtl:mr-2 rtl:ml-0 opacity-70 italic">{(t.addedTranslations_2026?.['(مُعدلة)'] || (t.addedTranslations_2026?.['(مُعدلة)'] || '(مُعدلة)'))}</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </CardContent>

              {/* Input */}
              <div className="border-t border-border p-4 bg-card space-y-3">
                {editingMessage && (
                  <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-500 p-2 rounded-lg text-xs mb-2 border border-amber-200/50 dark:border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{(t.addedTranslations_2026?.['تعديل الرسالة...'] || (t.addedTranslations_2026?.['تعديل الرسالة...'] || 'تعديل الرسالة...'))}</span>
                    </div>
                    <button onClick={() => { setEditingMessage(null); setMessageText(""); setLinkText("") }} className="hover:underline font-bold">
                      {(t.addedTranslations_2026?.['إلغاء'] || (t.addedTranslations_2026?.['إلغاء'] || 'إلغاء'))}
                    </button>
                  </div>
                )}
                {!editingMessage && (
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <Input
                      placeholder={(t.addedTranslations_2026?.['أضف رابطًا (ميت، زوم، إلخ) - اختياري'] || (t.addedTranslations_2026?.['أضف رابطًا (ميت، زوم، إلخ) - اختياري'] || 'أضف رابطًا (ميت، زوم، إلخ) - اختياري'))}
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                      className="h-9 text-xs bg-muted border-border flex-1"
                      dir="ltr"
                    />
                  </div>
                )}
                <div className="flex items-end gap-3">
                  <Textarea
                    placeholder={(t.addedTranslations_2026?.['اكتب رسالتك...'] || (t.addedTranslations_2026?.['اكتب رسالتك...'] || 'اكتب رسالتك...'))}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={2}
                    className="resize-none border-border bg-muted focus-visible:ring-[#0B3D2E]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="h-11 w-11 shrink-0 bg-[#D4A843] hover:bg-[#C49A3A] text-white rounded-xl shadow-sm"
                    onClick={handleSend}
                    disabled={(!messageText.trim() && !linkText.trim()) || sending}
                    aria-label={(t.addedTranslations_2026?.['إرسال'] || (t.addedTranslations_2026?.['إرسال'] || 'إرسال'))}
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rtl:-scale-x-100" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
              <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="font-medium">{(t.addedTranslations_2026?.['اختر محادثة للبدء في التواصل'] || (t.addedTranslations_2026?.['اختر محادثة للبدء في التواصل'] || 'اختر محادثة للبدء في التواصل'))}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function ReaderChatPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <ReaderChatContent />
    </Suspense>
  )
}
