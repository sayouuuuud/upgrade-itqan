'use client'

import { useEffect, useMemo, useRef, useState, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { ChatDateDivider } from '@/components/chat/date-divider'
import { shouldShowDateDivider, formatChatTime } from '@/lib/chat-date'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/lib/i18n/context'
import { Loader2, MessageSquare, Send, UserRound, Shield } from 'lucide-react'
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

  const selectedTeacher = useMemo(
    () => teachers.find(t => t.id === teacherId && t.child_id === childId),
    [teachers, teacherId, childId],
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
    async function fetchMessages() {
      setLoadingMessages(true)
      try {
        const res = await fetch(platform === 'maqraa' ? `/api/conversations/${conversationId}/messages` : `/api/academy/conversations/${conversationId}/messages`)
        const data = await res.json()
        if (res.ok) setMessages(data.messages || [])
      } finally {
        setLoadingMessages(false)
      }
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
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
      const res = await fetch(activeConv.platform === 'maqraa' ? `/api/conversations/${activeConv.id}/messages` : `/api/academy/conversations/${activeConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, data.message])
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
          other_user_name: platform === 'maqraa' ? (isAr ? 'إدارة المقرأة' : 'Maqraa Support') : (isAr ? 'إدارة الأكاديمية' : 'Academy Support'),
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

  if (loading) {
    return <ConversationsSkeleton />
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="space-y-2 pb-4 border-b border-border/50">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
          <MessageSquare className="w-4 h-4" />
          {isAr ? 'مراسلة الشيخ' : 'Teacher Messaging'}
        </div>
        <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
          {isAr ? 'رسائل ولي الأمر' : 'Parent Messages'}
        </h1>
        <p className="text-muted-foreground font-medium max-w-2xl">
          {isAr ? 'تواصل مباشرة مع الشيخ المرتبط بتلاوات أو دورات أو جلسات ابنك.' : "Message your child's teacher directly from the platform."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-black text-lg">{isAr ? 'بدء محادثة' : 'Start conversation'}</h2>
            {teachers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{isAr ? 'لا يوجد شيوخ مرتبطون بأبنائك بعد.' : 'No linked teachers yet.'}</p>
            ) : (
              <>
                <select
                  value={`${teacherId}:${childId}`}
                  onChange={e => {
                    const [nextTeacherId, nextChildId] = e.target.value.split(':')
                    setTeacherId(nextTeacherId)
                    setChildId(nextChildId)
                  }}
                  className="w-full h-12 rounded-2xl border border-border bg-card px-4 font-bold"
                >
                  {teachers.map(teacher => (
                    <option key={`${teacher.id}:${teacher.child_id}`} value={`${teacher.id}:${teacher.child_id}`}>
                      {teacher.name} — {teacher.child_name}
                    </option>
                  ))}
                </select>
                <Button onClick={startConversation} disabled={sending} className="w-full rounded-2xl font-bold">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? 'فتح المحادثة' : 'Open conversation')}
                </Button>
              </>
            )}

            <div className="pt-4 border-t border-border/50 space-y-2">
              
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <h3 className="font-bold text-sm text-muted-foreground">{isAr ? 'المحادثات السابقة' : 'Conversations'}</h3>
                <Button variant="outline" size="sm" onClick={() => setShowTicketDialog(true)} className="h-8 gap-1 rounded-xl text-blue-600 border-blue-200 hover:bg-blue-50">
                  <Shield className="w-3.5 h-3.5" />
                  {isAr ? 'تذكرة دعم' : 'Support Ticket'}
                </Button>
              </div>
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">{isAr ? 'لا توجد محادثات.' : 'No conversations.'}</p>
              ) : conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className="w-full flex items-center gap-3 rounded-2xl border border-border p-3 text-start hover:bg-muted/40"
                >
                  <UserRound className="w-5 h-5 text-primary" />
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{conv.other_user_name || (isAr ? 'الشيخ' : 'Teacher')}</p>
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message || (isAr ? 'لا توجد رسائل بعد' : 'No messages yet')}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-3xl border-border/50 overflow-hidden">
          <CardContent className="p-0 min-h-[560px] flex flex-col">
            <div className="p-5 border-b border-border/50 bg-muted/20">
              <h2 className="font-black">{activeConv?.other_user_name || (isAr ? 'اختر محادثة' : 'Select a conversation')}</h2>
            </div>
            <div className="flex-1 p-5 space-y-3 overflow-y-auto">
              {!activeConv ? (
                <div className="h-full flex items-center justify-center text-muted-foreground font-medium">
                  {isAr ? 'اختر أو افتح محادثة للبدء.' : 'Select or open a conversation to begin.'}
                </div>
              ) : loadingMessages ? (
                <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                messages.map((message, idx) => (
                  <Fragment key={message.id}>
                    {shouldShowDateDivider(messages[idx - 1]?.created_at, message.created_at) && (
                      <ChatDateDivider date={message.created_at} isAr={isAr} />
                    )}
                    <div className="rounded-2xl border border-border bg-card p-3">
                      <p className="text-sm font-medium whitespace-pre-wrap">{message.content}</p>
                      <p className="text-[11px] text-muted-foreground mt-2">{formatChatTime(message.created_at, isAr)}</p>
                    </div>
                  </Fragment>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t border-border/50 flex gap-3">
              <Input
                value={reply}
                onChange={e => setReply(e.target.value)}
                disabled={!activeConv || sending}
                placeholder={isAr ? 'اكتب رسالتك...' : 'Write a message...'}
                className="rounded-2xl"
              />
              <Button disabled={!activeConv || !reply.trim() || sending} className="rounded-2xl">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              {isAr ? 'فتح تذكرة دعم فني' : 'Open a Support Ticket'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {isAr ? 'اختر الجهة التي تريد التواصل معها:' : 'Choose which support team to contact:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button
              onClick={() => handleCreateTicket('academy')}
              disabled={sending}
              className="rounded-2xl h-auto py-4 flex-col gap-1 font-bold"
            >
              <Shield className="w-5 h-5" />
              {isAr ? 'دعم الأكاديمية' : 'Academy Support'}
            </Button>
            <Button
              onClick={() => handleCreateTicket('maqraa')}
              disabled={sending}
              variant="outline"
              className="rounded-2xl h-auto py-4 flex-col gap-1 font-bold"
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
