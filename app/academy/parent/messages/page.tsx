'use client'

import { useEffect, useMemo, useRef, useState, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { ChatDateDivider } from '@/components/chat/date-divider'
import { shouldShowDateDivider, formatChatTime } from '@/lib/chat-date'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n/context'
import {
  Loader2,
  MessageSquare,
  Send,
  UserRound,
  Shield,
  Search,
  ArrowUpRight,
  Inbox,
} from 'lucide-react'
import { ConversationsSkeleton } from '@/components/ui/skeletons'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface TeacherOption {
  id: string
  name: string
  email: string
  child_id: string
  child_name: string
}

interface Conversation {
  id: string
  other_user_id: string
  other_user_name: string
  other_user_avatar: string | null
  other_user_role?: string
  student_id?: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  platform?: 'maqraa' | 'academy'
  is_ticket?: boolean
}

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

export default function ParentMessagesPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [teacherId, setTeacherId] = useState('')
  const [childId, setChildId] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.id === teacherId && t.child_id === childId),
    [teachers, teacherId, childId]
  )

  async function fetchConversations() {
    const res = await fetch('/api/academy/conversations')
    const data = await res.json()
    if (res.ok) setConversations(data.conversations || [])
  }

  useEffect(() => {
    async function load() {
      try {
        const [teachersRes, meRes] = await Promise.all([
          fetch('/api/academy/parent/teachers'),
          fetch('/api/auth/me'),
          fetchConversations(),
        ])
        const meData = await meRes.json().catch(() => null)
        if (meRes.ok && meData?.user) setCurrentUserId(meData.user.id)
        const teachersData = await teachersRes.json()
        if (teachersRes.ok) {
          const list: TeacherOption[] = teachersData.teachers || []
          setTeachers(list)
          if (list[0]) {
            setTeacherId(list[0].id)
            setChildId(list[0].child_id)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!activeConv) return
    const conversationId = activeConv.id
    const platform = activeConv.platform
    let cancelled = false

    async function fetchMessages(initial: boolean) {
      if (initial) setLoadingMessages(true)
      try {
        const url =
          platform === 'maqraa'
            ? `/api/conversations/${conversationId}/messages`
            : `/api/academy/conversations/${conversationId}/messages`
        const res = await fetch(url)
        const data = await res.json()
        if (!cancelled && res.ok) {
          const next: Message[] = data.messages || []
          // Only update state when the message list actually changed,
          // so background polling doesn't cause a visible refresh/scroll jump.
          setMessages((prev) => {
            if (
              prev.length === next.length &&
              prev[prev.length - 1]?.id === next[next.length - 1]?.id
            ) {
              return prev
            }
            return next
          })
        }
      } finally {
        if (!cancelled && initial) setLoadingMessages(false)
      }
    }

    fetchMessages(true)
    const interval = setInterval(() => fetchMessages(false), 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [activeConv])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function startConversation() {
    if (!teacherId || !childId) return
    setSending(true)
    try {
      const res = await fetch('/api/academy/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: teacherId, childId }),
      })
      const data = await res.json()
      if (res.ok && data.conversationId) {
        await fetchConversations()
        setActiveConv({
          id: data.conversationId,
          other_user_id: teacherId,
          other_user_name: selectedTeacher?.name || '',
          other_user_avatar: null,
          student_id: childId,
          last_message: null,
          last_message_at: null,
          unread_count: 0,
          platform: 'academy',
        })
      }
    } finally {
      setSending(false)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!activeConv || !reply.trim()) return
    const content = reply.trim()
    setReply('')
    setSending(true)
    try {
      const url =
        activeConv.platform === 'maqraa'
          ? `/api/conversations/${activeConv.id}/messages`
          : `/api/academy/conversations/${activeConv.id}/messages`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessages((prev) => [...prev, data.message])
        await fetchConversations()
      }
    } finally {
      setSending(false)
    }
  }

  async function handleCreateTicket(platform: 'maqraa' | 'academy') {
    setSending(true)
    setShowTicketDialog(false)
    try {
      const url = platform === 'maqraa' ? '/api/conversations' : '/api/academy/conversations'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTicket: true }),
      })
      const data = await res.json()
      if (res.ok && data.conversationId) {
        await fetchConversations()
        setActiveConv({
          id: data.conversationId,
          other_user_id: 'admin',
          other_user_name:
            platform === 'maqraa'
              ? t.parentPages?.messages?.maqraaSupportTitle
              : t.parentPages?.messages?.academySupportTitle,
          other_user_avatar: null,
          last_message: null,
          last_message_at: null,
          unread_count: 0,
          platform: platform,
          is_ticket: true,
        })
      }
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return conv.other_user_name?.toLowerCase().includes(q)
  })

  if (loading) {
    return <ConversationsSkeleton />
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black text-foreground">
              {t.parentPages?.messages?.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t.parentPages?.messages?.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar — Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-e border-border/50 flex flex-col bg-background ${
            activeConv ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search + New */}
          <div className="p-3 border-b border-border/50 space-y-3">
            <div className="relative">
              <Search
                className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`}
              />
              <Input
                placeholder={t.parentPages?.messages?.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`h-9 rounded-xl text-sm ${isAr ? 'pr-9' : 'pl-9'}`}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowTicketDialog(true)}
                variant="outline"
                size="sm"
                className="flex-1 h-9 rounded-xl text-xs font-bold"
              >
                <Shield className="w-3.5 h-3.5 me-1" />
                {t.parentPages?.messages?.supportTicket}
              </Button>
              <Button
                onClick={startConversation}
                disabled={sending || !teacherId}
                size="sm"
                className="flex-1 h-9 rounded-xl text-xs font-bold"
              >
                {sending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <MessageSquare className="w-3.5 h-3.5 me-1" />
                    {t.parentPages?.messages?.new}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {t.parentPages?.messages?.noConversations}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredConversations.map((conv) => {
                  const isActive = activeConv?.id === conv.id
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConv(conv)}
                      className={`w-full flex items-center gap-3 p-4 text-start transition-colors ${
                        isActive
                          ? 'bg-primary/5 border-s-2 border-s-primary'
                          : 'hover:bg-muted/30'
                      }`}
                    >
                      <Avatar className="w-11 h-11 shrink-0">
                        <AvatarImage src={conv.other_user_avatar || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground font-bold text-sm">
                          {conv.other_user_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground truncate">
                            {conv.other_user_name || t.parentPages?.messages?.teacher}
                          </h4>
                          {conv.is_ticket && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">
                              {t.parentPages?.messages?.support}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conv.last_message || t.parentPages?.messages?.noMessages}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {conv.unread_count > 0 && (
                          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                            {conv.unread_count}
                          </span>
                        )}
                        {conv.last_message_at && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatChatTime(conv.last_message_at, isAr)}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main — Chat View */}
        <div
          className={`flex-1 flex flex-col bg-muted/10 ${
            activeConv ? 'flex' : 'hidden md:flex'
          }`}
        >
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-1">
                  {t.parentPages?.messages?.selectConversation}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.parentPages?.messages?.selectConversationDesc}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3 border-b border-border/50 bg-background/80 backdrop-blur-sm flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden h-8 w-8 p-0 rounded-lg me-1"
                  onClick={() => setActiveConv(null)}
                >
                  <ArrowUpRight
                    className={`w-4 h-4 ${isAr ? 'rotate-[270deg]' : 'rotate-[90deg]'}`}
                  />
                </Button>
                <div className="relative shrink-0">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={activeConv.other_user_avatar || undefined} />
                    <AvatarFallback
                      className={`font-bold text-xs ${
                        activeConv.is_ticket
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {activeConv.is_ticket ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        activeConv.other_user_name?.charAt(0) || '?'
                      )}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-foreground truncate">
                    {activeConv.other_user_name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {activeConv.is_ticket ? (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                        {t.parentPages?.messages?.supportTicket}
                      </Badge>
                    ) : (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <UserRound className="w-3 h-3" />
                        {t.parentPages?.messages?.teacher}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1">
                {loadingMessages ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="w-7 h-7 text-primary/60" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t.parentPages?.messages?.noMessagesYet}
                    </p>
                    <p className="text-xs text-muted-foreground/70 max-w-xs">
                      {t.parentPages?.messages?.startConversationDesc}
                    </p>
                  </div>
                ) : (
                  messages.map((message, idx) => {
                    const isOwn = currentUserId != null && message.sender_id === currentUserId
                    const prev = messages[idx - 1]
                    const grouped =
                      prev != null &&
                      prev.sender_id === message.sender_id &&
                      !shouldShowDateDivider(prev.created_at, message.created_at)
                    return (
                      <Fragment key={message.id}>
                        {shouldShowDateDivider(prev?.created_at, message.created_at) && (
                          <ChatDateDivider date={message.created_at} isAr={isAr} />
                        )}
                        <div
                          className={`flex items-end gap-2 ${grouped ? 'mt-0.5' : 'mt-3'} ${
                            isOwn ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          {!isOwn ? (
                            <Avatar className={`w-7 h-7 shrink-0 ${grouped ? 'invisible' : ''}`}>
                              <AvatarImage src={activeConv.other_user_avatar || undefined} />
                              <AvatarFallback className="bg-muted text-muted-foreground font-bold text-[10px]">
                                {activeConv.other_user_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <span className="w-7 shrink-0" />
                          )}
                          <div
                            className={`group max-w-[78%] sm:max-w-md rounded-2xl px-3.5 py-2 shadow-sm ${
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-ee-md'
                                : 'bg-card border border-border/60 text-foreground rounded-es-md'
                            }`}
                          >
                            <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed break-words">
                              {message.content}
                            </p>
                            <p
                              className={`text-[10px] mt-1 ${
                                isOwn
                                  ? 'text-primary-foreground/70 text-end'
                                  : 'text-muted-foreground text-end'
                              }`}
                            >
                              {formatChatTime(message.created_at, isAr)}
                            </p>
                          </div>
                        </div>
                      </Fragment>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <form
                onSubmit={sendMessage}
                className="p-3 sm:p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/30 p-1.5 focus-within:border-primary/40 focus-within:bg-background transition-colors">
                  <Input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    disabled={!activeConv || sending}
                    placeholder={t.parentPages?.messages?.writeMessage}
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-9"
                  />
                  <Button
                    type="submit"
                    disabled={!activeConv || !reply.trim() || sending}
                    size="icon"
                    className="rounded-xl h-9 w-9 shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Support Ticket Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              {t.parentPages?.messages?.openSupportTicket}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t.parentPages?.messages?.chooseSupportTeam}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button
              onClick={() => handleCreateTicket('academy')}
              disabled={sending}
              className="rounded-xl h-auto py-4 flex-col gap-1 font-bold"
            >
              <Shield className="w-5 h-5" />
              {t.parentPages?.messages?.academySupport}
            </Button>
            <Button
              onClick={() => handleCreateTicket('maqraa')}
              disabled={sending}
              variant="outline"
              className="rounded-xl h-auto py-4 flex-col gap-1 font-bold"
            >
              <Shield className="w-5 h-5" />
              {t.parentPages?.messages?.maqraaSupport}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
