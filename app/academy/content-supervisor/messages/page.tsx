'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Send, User, Loader2, ArrowRight, MessageSquare } from 'lucide-react'

interface Conversation {
  id: string
  other_user_id: string
  other_user_name: string
  other_user_avatar: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number
}

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

export default function ContentSupervisorMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [loadingConv, setLoadingConv] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchConversations() }, [])

  async function fetchConversations() {
    try {
      const res = await fetch('/api/academy/conversations')
      const data = await res.json()
      if (res.ok) setConversations(data.conversations || [])
    } catch { /* ignore */ }
    finally { setLoadingConv(false) }
  }

  useEffect(() => {
    if (!activeConv) return
    const fetchMsgs = async () => {
      setLoadingMsgs(true)
      try {
        const res = await fetch(`/api/academy/conversations/${activeConv.id}/messages`)
        const data = await res.json()
        if (res.ok) {
          setMessages(data.messages || [])
          setConversations(prev => prev.map(c =>
            c.id === activeConv.id ? { ...c, unread_count: 0 } : c
          ))
        }
      } catch { /* ignore */ }
      finally { setLoadingMsgs(false) }
    }
    fetchMsgs()
    const interval = setInterval(fetchMsgs, 5000)
    return () => clearInterval(interval)
  }, [activeConv])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim() || !activeConv) return
    const content = reply
    setReply('')
    setSending(true)
    try {
      const res = await fetch(`/api/academy/conversations/${activeConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (res.ok && data.message) {
        setMessages(prev => [...prev, data.message])
        setConversations(prev =>
          prev.map(c => c.id === activeConv.id
            ? { ...c, last_message: content, last_message_at: new Date().toISOString() }
            : c
          ).sort((a, b) =>
            new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
          )
        )
      }
    } catch { /* ignore */ }
    finally { setSending(false) }
  }

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  }

  const filtered = searchQuery
    ? conversations.filter(c => c.other_user_name.includes(searchQuery))
    : conversations

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]" dir="rtl">
      <div className="shrink-0 mb-4">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          الرسائل
        </h1>
        <p className="text-sm text-muted-foreground mt-1">تواصل مباشر مع المعلمين والمدراء</p>
      </div>

      <div className="flex bg-card rounded-2xl border border-border flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className={`w-full md:w-80 border-l border-border/50 flex flex-col min-h-0 ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-border/50">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-9 h-10 rounded-xl bg-muted/30 border-border/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingConv ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground text-sm font-medium">
                لا توجد محادثات بعد
              </div>
            ) : filtered.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition-colors ${
                  activeConv?.id === conv.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                }`}
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-card">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-foreground truncate">{conv.other_user_name}</h4>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(conv.last_message_at)}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                    {conv.last_message || 'بدء محادثة'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages area */}
        <div className={`flex-1 flex flex-col min-h-0 ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 opacity-30" />
              </div>
              <p className="font-bold">اختر محادثة للبدء</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3.5 border-b border-border/50 flex items-center gap-3 shrink-0 bg-card">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveConv(null)}>
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-bold text-foreground">{activeConv.other_user_name}</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {loadingMsgs ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender_id !== activeConv.other_user_id
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-bl-sm'
                            : 'bg-muted border border-border rounded-br-sm text-foreground'
                        }`}>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70 text-left' : 'text-muted-foreground text-right'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-border/50 shrink-0">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    placeholder="اكتب رسالتك..."
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    className="flex-1 rounded-xl h-11 bg-muted/30"
                  />
                  <Button
                    type="submit"
                    disabled={!reply.trim() || sending}
                    className="w-11 h-11 rounded-xl shrink-0"
                  >
                    {sending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4 rotate-180" />
                    }
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
