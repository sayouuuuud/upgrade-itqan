'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Send, MessageSquare, Plus, X, UserCircle2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface Conversation {
  id: string
  parent_id: string
  reader_id: string
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

interface Child {
  id: string
  child_id: string
  child_name: string
  status: string
}

interface Reader {
  id: string
  name: string
  email: string
}

function ParentReaderMessagesContent() {
  const sp = useSearchParams()
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [composer, setComposer] = useState('')
  const [sending, setSending] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const [newChildId, setNewChildId] = useState('')
  const [readers, setReaders] = useState<Reader[]>([])
  const [newReaderId, setNewReaderId] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newContent, setNewContent] = useState('')
  const [creating, setCreating] = useState(false)

  const loadConversations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/academy/parent/reader-conversations')
      const data = await res.json()
      if (res.ok) setConversations(data.conversations || [])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadChildren = useCallback(async () => {
    const res = await fetch('/api/academy/parent/children')
    const data = await res.json()
    if (res.ok) {
      const active = (data.children || []).filter((c: Child) => c.status === 'active')
      setChildren(active)
      const childIdParam = sp.get('child_id')
      if (childIdParam && active.find((c: Child) => c.child_id === childIdParam)) {
        setNewChildId(childIdParam)
        setShowNew(true)
      } else if (active.length > 0) {
        setNewChildId(active[0].child_id)
      }
    }
  }, [sp])

  useEffect(() => {
    loadConversations()
    loadChildren()
  }, [loadConversations, loadChildren])

  useEffect(() => {
    if (!newChildId) {
      setReaders([])
      return
    }
    const load = async () => {
      const res = await fetch(`/api/academy/parent/children/${newChildId}/readers`)
      const data = await res.json()
      if (res.ok) {
        setReaders(data.readers || [])
        if (data.readers?.[0]) setNewReaderId(data.readers[0].id)
      }
    }
    load()
  }, [newChildId])

  const openConversation = async (id: string) => {
    setActiveId(id)
    const res = await fetch(`/api/academy/parent/reader-conversations/${id}/messages`)
    const data = await res.json()
    if (res.ok) setMessages(data.messages || [])
  }

  const sendMessage = async () => {
    if (!activeId || !composer.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/academy/parent/reader-conversations/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: composer.trim() }),
      })
      if (res.ok) {
        setComposer('')
        await openConversation(activeId)
        await loadConversations()
      }
    } finally {
      setSending(false)
    }
  }

  const startConversation = async () => {
    if (!newChildId || !newReaderId || !newContent.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/academy/parent/reader-conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: newChildId,
          reader_id: newReaderId,
          subject: newSubject || null,
          content: newContent.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok && data.conversation_id) {
        setShowNew(false)
        setNewSubject('')
        setNewContent('')
        await loadConversations()
        await openConversation(data.conversation_id)
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <MessageSquare className="w-4 h-4" />
            {isAr ? 'الرسائل' : 'Messages'}
          </div>
          <h1 className="text-3xl font-black">
            {isAr ? 'مراسلة المقرئين' : 'Message Readers'}
          </h1>
        </div>
        <Button onClick={() => setShowNew(!showNew)}>
          {showNew ? <X className="w-4 h-4 me-2" /> : <Plus className="w-4 h-4 me-2" />}
          {showNew ? (isAr ? 'إلغاء' : 'Cancel') : isAr ? 'محادثة جديدة' : 'New conversation'}
        </Button>
      </div>

      {showNew && (
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-3">
            <div>
              <label className="text-sm font-bold mb-1 block">{isAr ? 'الابن' : 'Child'}</label>
              <select
                value={newChildId}
                onChange={(e) => setNewChildId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border bg-card"
              >
                {children.map((c) => (
                  <option key={c.child_id} value={c.child_id}>
                    {c.child_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold mb-1 block">{isAr ? 'المقرئ' : 'Reader'}</label>
              {readers.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {isAr
                    ? 'لا يوجد مقرئون مرتبطون بالابن حالياً.'
                    : 'No readers currently linked to this child.'}
                </div>
              ) : (
                <select
                  value={newReaderId}
                  onChange={(e) => setNewReaderId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border bg-card"
                >
                  {readers.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <Input
              placeholder={isAr ? 'الموضوع (اختياري)' : 'Subject (optional)'}
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <textarea
              placeholder={isAr ? 'اكتب رسالتك...' : 'Write your message...'}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-xl border bg-card resize-none"
            />
            <Button
              onClick={startConversation}
              disabled={creating || !newReaderId || !newContent.trim()}
              className="w-full"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : isAr ? 'إرسال' : 'Send'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4 min-h-[60vh]">
        <Card className="md:col-span-1 rounded-2xl">
          <CardContent className="p-3">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground text-sm">
                {isAr ? 'لا توجد محادثات بعد.' : 'No conversations yet.'}
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
                            {isAr ? `بخصوص: ${c.child_name}` : `About: ${c.child_name}`}
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
                    const isMe = conv && m.sender_id === conv.parent_id
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

export default function ParentReaderMessagesPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
      <ParentReaderMessagesContent />
    </Suspense>
  )
}
