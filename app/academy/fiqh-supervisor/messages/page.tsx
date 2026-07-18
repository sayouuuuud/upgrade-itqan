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

export default function FiqhSupervisorMessagesPage() {
  const { t } = useI18n();
  const academy = (t as any).academy as Record<string, string> | undefined

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
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-inner">
            <MessageSquare className="w-6 h-6" />
          </div>
          {(t.addedTranslations_2026?.['الرسائل والمحادثات'] || (t.addedTranslations_2026?.['الرسائل والمحادثات'] || 'الرسائل والمحادثات'))}
        </h1>
        <p className="text-muted-foreground text-sm flex items-center gap-2 mt-2 font-medium">
          <Sparkles className="w-4 h-4 text-amber-500" />
          {(t.addedTranslations_2026?.['تواصل مباشر مع فريق الإدارة والمعلمين'] || (t.addedTranslations_2026?.['تواصل مباشر مع فريق الإدارة والمعلمين'] || 'تواصل مباشر مع فريق الإدارة والمعلمين'))}
        </p>
      </div>

      <div className="flex bg-card/60 backdrop-blur-xl rounded-[32px] border border-white/20 dark:border-white/5 flex-1 overflow-hidden min-h-0 shadow-2xl shadow-black/5">
        {/* Sidebar */}
        <div className={`w-full md:w-[340px] ${isAr ? 'border-l' : 'border-r'} border-border/50 flex flex-col min-h-0 bg-muted/20 ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border/50 bg-card/40">
            <div className="relative group">
              <Search className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors`} />
              <input
                placeholder={(t.addedTranslations_2026?.['ابحث في المحادثات...'] || (t.addedTranslations_2026?.['ابحث في المحادثات...'] || 'ابحث في المحادثات...'))}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full h-12 ${isAr ? 'pr-12 pl-4' : 'pl-12 pr-4'} bg-background border-2 border-border focus:border-primary rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner placeholder:text-muted-foreground`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
            {loadingConv ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border border-border shadow-inner">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm font-bold">{(t.addedTranslations_2026?.['لا توجد محادثات بعد'] || (t.addedTranslations_2026?.['لا توجد محادثات بعد'] || 'لا توجد محادثات بعد'))}</p>
              </div>
            ) : filtered.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`w-full ${isAr ? 'text-right' : 'text-left'} p-3.5 rounded-[20px] flex items-center gap-4 transition-all group border ${
                  activeConv?.id === conv.id 
                    ? 'bg-primary/5 border-primary/20 shadow-md shadow-primary/5' 
                    : 'bg-transparent border-transparent hover:bg-background hover:border-border/50 hover:shadow-sm'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden transition-colors border ${
                    activeConv?.id === conv.id ? 'bg-primary/20 border-primary/30' : 'bg-primary/10 border-primary/10 group-hover:bg-primary/15'
                  }`}>
                    {conv.other_user_avatar ? (
                      <img src={conv.other_user_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className={`w-5 h-5 ${activeConv?.id === conv.id ? 'text-primary' : 'text-muted-foreground'}`} />
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
                    <span className="text-[10px] font-bold text-muted-foreground shrink-0 bg-muted/50 px-1.5 py-0.5 rounded-md border border-border/50">{formatTime(conv.last_message_at)}</span>
                  </div>
                  <p className={`text-xs truncate font-medium ${conv.unread_count > 0 ? 'text-foreground font-black' : 'text-muted-foreground'}`}>
                    {conv.last_message || ((t.addedTranslations_2026?.['اضغط لبدء المحادثة'] || (t.addedTranslations_2026?.['اضغط لبدء المحادثة'] || 'اضغط لبدء المحادثة')))}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages area */}
        <div className={`flex-1 flex flex-col min-h-0 relative ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4 relative z-10">
              <div className="w-24 h-24 rounded-[32px] bg-muted/50 flex items-center justify-center border border-white/10 shadow-inner">
                <MessageSquare className="w-10 h-10 opacity-40 text-primary" />
              </div>
              <p className="font-black text-xl text-foreground/70">{(t.addedTranslations_2026?.['اختر محادثة للبدء'] || (t.addedTranslations_2026?.['اختر محادثة للبدء'] || 'اختر محادثة للبدء'))}</p>
              <p className="text-sm font-bold text-muted-foreground bg-muted px-4 py-2 rounded-xl">{(t.addedTranslations_2026?.['التواصل السريع والفعال يبدأ من هنا'] || (t.addedTranslations_2026?.['التواصل السريع والفعال يبدأ من هنا'] || 'التواصل السريع والفعال يبدأ من هنا'))}</p>
            </div>
          ) : (
            <div className="flex flex-col h-full relative z-10">
              {/* Chat Header */}
              <div className="px-6 py-5 border-b border-white/10 dark:border-white/5 flex items-center gap-4 shrink-0 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-sm z-10">
                <Button variant="ghost" size="icon" className="md:hidden shrink-0 hover:bg-muted" onClick={() => setActiveConv(null)}>
                  {isAr ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                </Button>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border border-primary/20 shadow-inner">
                  {activeConv.other_user_avatar ? (
                    <img src={activeConv.other_user_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-lg text-foreground">{activeConv.other_user_name}</h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {(t.addedTranslations_2026?.['محادثة نشطة'] || (t.addedTranslations_2026?.['محادثة نشطة'] || 'محادثة نشطة'))}
                  </p>
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
                        <div className={`relative max-w-[85%] md:max-w-[75%] px-5 py-4 rounded-[24px] text-sm shadow-md ${
                          isMe
                            ? 'bg-gradient-to-br from-primary to-blue-600 text-primary-foreground rounded-br-sm border border-white/10'
                            : 'bg-white dark:bg-card border border-border/50 rounded-bl-sm text-foreground'
                          }`}>
                          <p className="whitespace-pre-wrap leading-relaxed font-medium">{msg.content}</p>
                          <p className={`text-[10px] mt-2 font-bold flex items-center gap-1 ${isMe ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground justify-end'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    </Fragment>
                  )
                })
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Chat Input */}
              <div className="p-4 md:p-6 border-t border-white/10 dark:border-white/5 shrink-0 bg-white/40 dark:bg-black/20 backdrop-blur-md">
                <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
                  <div className="relative flex-1 group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-500 rounded-2xl opacity-0 group-focus-within:opacity-20 transition duration-500 blur" />
                    <input
                      type="text"
                      placeholder={(t.addedTranslations_2026?.['اكتب رسالتك هنا...'] || (t.addedTranslations_2026?.['اكتب رسالتك هنا...'] || 'اكتب رسالتك هنا...'))}
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      className="relative w-full rounded-2xl h-14 px-6 bg-background border-2 border-border focus:border-transparent text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all shadow-inner placeholder:font-medium"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!reply.trim() || sending}
                    className="w-14 h-14 rounded-2xl shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {sending
                      ? <Loader2 className="w-6 h-6 animate-spin" />
                      : <Send className={`w-6 h-6 ${isAr ? 'rotate-180 -translate-x-0.5' : 'translate-x-0.5'} group-hover:scale-110 transition-transform`} />
                    }
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
