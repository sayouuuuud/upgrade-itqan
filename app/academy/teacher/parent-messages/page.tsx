'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Send, MessageSquare, UserCircle2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface Conversation {
  id: string
  parent_id: string
  teacher_id: string
  child_id: string | null
  subject: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  other_user_id: string
  other_user_name: string
  other_user_avatar: string | null
  child_name: string | null
}

interface Message {
  id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender_name: string | null
}

export default function TeacherParentMessagesPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [composer, setComposer] = useState('')
  const [sending, setSending] = useState(false)

  const loadConversations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/academy/parent/conversations')
      const data = await res.json()
      if (res.ok) setConversations(data.conversations || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const openConversation = async (id: string) => {
    setActiveId(id)
    const res = await fetch(`/api/academy/parent/conversations/${id}/messages`)
    const data = await res.json()
    if (res.ok) setMessages(data.messages || [])
    await loadConversations()
  }

  const sendMessage = async () => {
    if (!activeId || !composer.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/academy/parent/conversations/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: composer.trim() }),
      })
      if (res.ok) {
        setComposer('')
        await openConversation(activeId)
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
          <MessageSquare className="w-4 h-4" />
          {isAr ? 'رسائل أولياء الأمور' : 'Parent Messages'}
        </div>
        <h1 className="text-3xl font-black">
          {isAr ? 'محادثات أولياء الأمور' : 'Conversations with Parents'}
        </h1>
      </div>

      <div className="grid md:grid-cols-3 gap-4 min-h-[60vh]">
        <Card className="md:col-span-1 rounded-2xl">
          <CardContent className="p-3">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground text-sm">
                {isAr ? 'لا توجد محادثات.' : 'No conversations.'}
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className={`w-full text-start p-3 rounded-xl transition-colors ${
                      activeId === c.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserCircle2 className="w-8 h-8 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 justify-between">
                          <span className="font-bold truncate">{c.other_user_name}</span>
                          {c.unread_count > 0 && (
                            <span className="text-[10px] font-bold bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                        {c.child_name && (
                          <div className="text-xs text-muted-foreground truncate">
                            {isAr ? `الطالب: ${c.child_name}` : `Student: ${c.child_name}`}
                          </div>
                        )}
                        {c.last_message && (
                          <div className="text-xs text-muted-foreground truncate">
                            {c.last_message}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 rounded-2xl flex flex-col">
          <CardContent className="p-4 flex-1 flex flex-col gap-3 min-h-[50vh]">
            {!activeId ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                {isAr ? 'اختر محادثة لعرضها' : 'Select a conversation'}
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[55vh]">
                  {messages.map((m) => {
                    const conv = conversations.find((c) => c.id === activeId)
                    const isMe = conv && m.sender_id === conv.teacher_id
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] p-3 rounded-2xl ${
                            isMe
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                          <div className="text-[10px] opacity-70 mt-1">
                            {new Date(m.created_at).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-2 border-t pt-3">
                  <Input
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder={isAr ? 'اكتب رسالتك...' : 'Type your message...'}
                  />
                  <Button onClick={sendMessage} disabled={sending || !composer.trim()}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
