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
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [teacherId, setTeacherId] = useState('')
  const [childId, setChildId] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
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
        const [teachersRes] = await Promise.all([
          fetch('/api/academy/parent/teachers'),
          fetchConversations(),
        ])
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
              ? isAr
                ? 'إدارة المقرأة'
                : 'Maqraa Support'
              : isAr
              ? 'إدارة الأكاديمية'
              : 'Academy Support',
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
              {isAr ? 'الرسائل' : 'Messages'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isAr ? 'تواصل مع معلمي أبنائك' : "Message your children's teachers"}
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
                placeholder={isAr ? 'بحث...' : 'Search...'}
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
                {isAr ? 'تذكرة دعم' : 'Support'}
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
                    {isAr ? 'جديد' : 'New'}
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
                  {isAr ? 'لا توجد محادثات' : 'No conversations'}
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
                            {conv.other_user_name || (isAr ? 'الشيخ' : 'Teacher')}
                          </h4>
                          {conv.is_ticket && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">
                              {isAr ? 'دعم' : 'Support'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conv.last_message || (isAr ? 'لا توجد رسائل' : 'No messages')}
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
                  {isAr ? 'اختر محادثة' : 'Select a conversation'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? 'اختر محادثة من القائمة للبدء'
                    : 'Choose a conversation from the list to begin'}
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
                <Avatar className="w-9 h-9">
                  <AvatarImage src={activeConv.other_user_avatar || undefined} />
                  <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xs">
                    {activeConv.other_user_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-foreground truncate">
                    {activeConv.other_user_name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {activeConv.is_ticket
                      ? isAr
                        ? 'تذكرة دعم'
                        : 'Support Ticket'
                      : isAr
                      ? 'محادثة'
                      : 'Conversation'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {loadingMessages ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">
                      {isAr ? 'لا توجد رسائل بعد.' : 'No messages yet.'}
                    </p>
                  </div>
                ) : (
                  messages.map((message, idx) => (
                    <Fragment key={message.id}>
                      {shouldShowDateDivider(
                        messages[idx - 1]?.created_at,
                        message.created_at
                      ) && <ChatDateDivider date={message.created_at} isAr={isAr} />}
                      <div className="rounded-2xl border border-border bg-card p-3 max-w-2xl">
                        <p className="text-sm font-medium whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-2">
                          {formatChatTime(message.created_at, isAr)}
                        </p>
                      </div>
                    </Fragment>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <form
                onSubmit={sendMessage}
                className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm flex gap-3"
              >
                <Input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  disabled={!activeConv || sending}
                  placeholder={isAr ? 'اكتب رسالتك...' : 'Write a message...'}
                  className="rounded-xl"
                />
                <Button
                  disabled={!activeConv || !reply.trim() || sending}
                  className="rounded-xl px-4"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
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
              {isAr ? 'فتح تذكرة دعم' : 'Open Support Ticket'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {isAr ? 'اختر الجهة التي تريد التواصل معها:' : 'Choose which support team to contact:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button
              onClick={() => handleCreateTicket('academy')}
              disabled={sending}
              className="rounded-xl h-auto py-4 flex-col gap-1 font-bold"
            >
              <Shield className="w-5 h-5" />
              {isAr ? 'دعم الأكاديمية' : 'Academy Support'}
            </Button>
            <Button
              onClick={() => handleCreateTicket('maqraa')}
              disabled={sending}
              variant="outline"
              className="rounded-xl h-auto py-4 flex-col gap-1 font-bold"
            >
              <Shield className="w-5 h-5" />
              {isAr ? 'دعم المقرأة' : 'Maqraa Support'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
