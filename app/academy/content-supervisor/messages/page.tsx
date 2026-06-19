'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Input } from '@/components/ui/input'
import { ChatDateDivider } from '@/components/chat/date-divider'
import { shouldShowDateDivider } from '@/lib/chat-date'
import { Button } from '@/components/ui/button'
import { Search, Send, User, Loader2, ArrowRight, ArrowLeft, MessageSquare, Sparkles } from 'lucide-react'

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
  const { locale } = useI18n()
  const isAr = locale === 'ar'
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
    return new Date(dateStr).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const filtered = searchQuery
    ? conversations.filter(c => c.other_user_name.includes(searchQuery))
    : conversations

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-500" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="shrink-0 mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-foreground">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <MessageSquare className="w-6 h-6" />
          </div>
          {isAr ? 'الرسائل' : 'Messages'}
        </h1>
        <p className="text-muted-foreground text-sm flex items-center gap-2 mt-2">
          <Sparkles className="w-4 h-4" />
          {isAr ? 'تواصل مباشر مع المعلمين والمدراء' : 'Direct communication with teachers and administrators'}
        </p>
      </div>

      <div className="flex bg-card rounded-3xl border border-border/50 flex-1 overflow-hidden min-h-0 shadow-sm">
        {/* Sidebar */}
        <div className={`w-full md:w-[340px] ${isAr ? 'border-l' : 'border-r'} border-border/50 flex flex-col min-h-0 bg-muted/10 ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border/50 bg-card">
            <div className="relative">
              <Search className={`absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <input
                placeholder={isAr ? 'ابحث في المحادثات...' : 'Search conversations...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full h-11 ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm placeholder:text-muted-foreground`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-hide">
            {loadingConv ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                <MessageSquare className="w-10 h-10 text-muted-foreground" />
                <p className="text-muted-foreground text-sm font-medium">{isAr ? 'لا توجد محادثات بعد' : 'No conversations yet'}</p>
              </div>
            ) : filtered.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`w-full ${isAr ? 'text-right' : 'text-left'} p-3 rounded-2xl flex items-center gap-4 transition-all group border ${
                  activeConv?.id === conv.id 
                    ? 'bg-primary/5 border-primary/20 shadow-sm' 
                    : 'bg-transparent border-transparent hover:bg-background hover:border-border/50'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden transition-colors ${
                    activeConv?.id === conv.id ? 'bg-primary/20' : 'bg-primary/10 group-hover:bg-primary/15'
                  }`}>
                    {conv.other_user_avatar ? (
                      <img src={conv.other_user_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-card shadow-sm">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div className={`flex-1 min-w-0 ${isAr ? 'text-right' : 'text-left'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-sm text-foreground truncate">{conv.other_user_name}</h4>
                    <span className="text-[10px] font-medium text-muted-foreground shrink-0">{formatTime(conv.last_message_at)}</span>
                  </div>
                  <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                    {conv.last_message || (isAr ? 'اضغط لبدء المحادثة' : 'Click to start conversation')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages area */}
        <div className={`flex-1 flex flex-col min-h-0 bg-background/50 ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center border border-border/50 shadow-sm">
                <MessageSquare className="w-8 h-8 opacity-40" />
              </div>
              <p className="font-bold text-lg text-foreground/70">{isAr ? 'اختر محادثة للبدء' : 'Select a conversation to start'}</p>
              <p className="text-sm text-muted-foreground">{isAr ? 'التواصل السريع والفعال يبدأ من هنا' : 'Quick and effective communication starts here'}</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-border/50 flex items-center gap-4 shrink-0 bg-card shadow-sm z-10">
                <Button variant="ghost" size="icon" className="md:hidden shrink-0 hover:bg-muted" onClick={() => setActiveConv(null)}>
                  {isAr ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                </Button>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border border-primary/20">
                  {activeConv.other_user_avatar ? (
                    <img src={activeConv.other_user_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base text-foreground">{activeConv.other_user_name}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{isAr ? 'محادثة نشطة' : 'Active Conversation'}</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {loadingMsgs ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                  </div>
                ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id !== activeConv.other_user_id
                  const showDate = shouldShowDateDivider(messages[idx - 1]?.created_at, msg.created_at)
                  return (
                    <Fragment key={msg.id}>
                      {showDate && <ChatDateDivider date={msg.created_at} isAr={isAr} />}
                      <div className={`flex ${isMe ? (isAr ? 'justify-start' : 'justify-end') : (isAr ? 'justify-end' : 'justify-start')} animate-in slide-in-from-bottom-2`}>
                        <div className={`relative max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-card border border-border/50 rounded-bl-sm text-foreground'
                          }`}>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-1.5 font-medium flex items-center gap-1 ${isMe ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground justify-end'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    </Fragment>
                  )
                })
                )}
                <div ref={messagesEndRef} className="h-2" />
              </div>

              {/* Chat Input */}
              <div className="p-4 md:p-5 border-t border-border/50 shrink-0 bg-card">
                <form onSubmit={handleSend} className="flex gap-3">
                  <input
                    type="text"
                    placeholder={isAr ? "اكتب رسالتك هنا..." : "Type your message here..."}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    className="flex-1 rounded-2xl h-12 px-5 bg-background border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all shadow-sm"
                  />
                  <Button
                    type="submit"
                    disabled={!reply.trim() || sending}
                    className="w-12 h-12 rounded-2xl shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all group disabled:opacity-60"
                  >
                    {sending
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : <Send className={`w-5 h-5 ${isAr ? 'rotate-180' : ''} group-hover:scale-110 transition-transform`} />
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
