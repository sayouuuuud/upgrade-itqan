'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Send, User, Loader2, ArrowRight, MessageSquarePlus, X, BookOpen } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

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

interface TeacherOption {
  id: string
  name: string
  avatar_url: string | null
  bio: string | null
  courses: string[] | null
}

export default function StudentChatPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <StudentChatPageInner />
    </Suspense>
  )
}

function StudentChatPageInner() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [loadingConv, setLoadingConv] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // "New conversation" dialog state
  const [showNew, setShowNew] = useState(false)
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [teachersLoading, setTeachersLoading] = useState(false)
  const [startingChatWith, setStartingChatWith] = useState<string | null>(null)
  const [newSearch, setNewSearch] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/academy/conversations')
      const data = await res.json()
      if (res.ok) {
        setConversations(data.conversations || [])
      }
    } catch {
      // ignore
    } finally {
      setLoadingConv(false)
    }
  }

  // Fetch conversations
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConversations()
  }, [])

  // Allow other pages to deep-link via ?teacherId=... to start / open a chat.
  useEffect(() => {
    const teacherId = searchParams.get('teacherId')
    if (!teacherId) return
    ;(async () => {
      try {
        const res = await fetch('/api/academy/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otherUserId: teacherId }),
        })
        const data = await res.json()
        if (res.ok && data.conversationId) {
          await fetchConversations()
          setConversations(prev => {
            const conv = prev.find(c => c.id === data.conversationId)
            if (conv) setActiveConv(conv)
            return prev
          })
        }
      } catch {
        // ignore
      } finally {
        // Strip the param so refreshes don't trigger again.
        router.replace('/academy/student/chat')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const openNewChatDialog = async () => {
    setShowNew(true)
    if (teachers.length > 0) return
    setTeachersLoading(true)
    try {
      const res = await fetch('/api/academy/student/teachers')
      if (res.ok) {
        const data = await res.json()
        setTeachers(data.teachers || [])
      }
    } finally {
      setTeachersLoading(false)
    }
  }

  const startConversation = async (teacherId: string) => {
    setStartingChatWith(teacherId)
    try {
      const res = await fetch('/api/academy/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: teacherId }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data?.error || (isAr ? 'تعذر فتح المحادثة' : 'Could not start conversation'))
        return
      }
      setShowNew(false)
      await fetchConversations()
      // Open the new conversation immediately.
      setConversations(prev => {
        const found = prev.find(c => c.id === data.conversationId)
        if (found) setActiveConv(found)
        return prev
      })
      // If the freshly fetched list didn't include the new conv yet (race),
      // construct a placeholder so the chat panel opens right away.
      setActiveConv(prev => {
        if (prev) return prev
        const teacher = teachers.find(tch => tch.id === teacherId)
        if (!teacher) return prev
        return {
          id: data.conversationId,
          other_user_id: teacher.id,
          other_user_name: teacher.name,
          other_user_avatar: teacher.avatar_url,
          last_message: null,
          last_message_at: null,
          unread_count: 0,
        }
      })
    } finally {
      setStartingChatWith(null)
    }
  }

  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeConv) return
    const fetchMsgs = async () => {
      setLoadingMsgs(true)
      try {
        const res = await fetch(`/api/academy/conversations/${activeConv.id}/messages`)
        const data = await res.json()
        if (res.ok) {
          setMessages(data.messages || [])

          // Clear unread count locally
          setConversations(prev => prev.map(c =>
            c.id === activeConv.id ? { ...c, unread_count: 0 } : c
          ))
        }
      } catch {
        // ignore
      } finally {
        setLoadingMsgs(false)
      }
    }

    fetchMsgs()

    // Polling setup (every 5 seconds)
    const interval = setInterval(fetchMsgs, 5000)
    return () => clearInterval(interval)
  }, [activeConv])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim() || !activeConv) return

    const messageContent = reply
    setReply('')
    setSending(true)

    try {
      const res = await fetch(`/api/academy/conversations/${activeConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent })
      })
      const data = await res.json()
      if (res.ok && data.message) {
        setMessages(prev => [...prev, data.message])

        // Update conversation preview
        setConversations(prev => prev.map(c =>
          c.id === activeConv.id
            ? { ...c, last_message: messageContent, last_message_at: new Date().toISOString() }
            : c
        ).sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()))
      }
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 h-[calc(100vh-100px)] flex flex-col" dir={isAr ? "rtl" : "ltr"}>
      <div className="space-y-1 shrink-0">
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          {isAr ? "الرسائل الخاصة" : "Messages"}
        </h1>
        <p className="text-muted-foreground font-medium">
          {isAr ? "تواصل مع أساتذتك بكل سهولة." : "Communicate with your teachers easily."}
        </p>
      </div>

      <div className="flex bg-card rounded-3xl border border-border shadow-sm flex-1 overflow-hidden min-h-0">

        {/* Sidebar (Conversations) */}
        <div className={`w-full md:w-80 border-${isAr ? 'l' : 'r'} border-border/50 flex flex-col min-h-0 ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border/50 space-y-3">
            <Button
              onClick={openNewChatDialog}
              className="w-full justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              <MessageSquarePlus className="w-4 h-4" />
              {isAr ? 'بدء محادثة جديدة' : 'New conversation'}
            </Button>
            <div className="relative">
              <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={isAr ? "ابحث عن أستاذ..." : "Search teacher..."}
                className={`pl-9 pr-9 h-10 rounded-xl bg-muted/30 border-border/50 focus:bg-card`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
            {loadingConv ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : conversations.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground text-sm font-medium space-y-3">
                <p>{isAr ? "لا توجد أي محادثات حالياً" : "No conversations yet"}</p>
                <Button onClick={openNewChatDialog} variant="outline" className="gap-2">
                  <MessageSquarePlus className="w-4 h-4" />
                  {isAr ? 'ابدأ محادثة مع المدرس' : 'Message a teacher'}
                </Button>
              </div>
            ) : (
              conversations
                .filter(c => !searchTerm.trim() || c.other_user_name.toLowerCase().includes(searchTerm.toLowerCase().trim()))
                .map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full text-start p-3 rounded-2xl flex items-center gap-3 transition-colors ${activeConv?.id === conv.id ? 'bg-primary/10' : 'hover:bg-muted/50 cursor-pointer'}`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                      <User className="w-6 h-6 text-blue-500" />
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-card">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="font-bold text-sm text-foreground truncate">{conv.other_user_name}</h4>
                      <span className="text-[10px] text-muted-foreground font-medium shrink-0">{formatTime(conv.last_message_at)}</span>
                    </div>
                    <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}`}>
                      {conv.last_message || (isAr ? 'بدء محادثة جديدة' : 'Start a new conversation')}
                    </p>
                  </div>
                </button>
              )))
            }
          </div>
        </div>

        {/* Main Content (Messages) */}
        <div className={`flex-1 flex flex-col min-h-0 ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <Send className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-bold text-lg">{isAr ? "اختر محادثة للبدء" : "Select a conversation to start"}</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-border/50 flex items-center gap-4 shrink-0 bg-card z-10 shadow-sm relative">
                <Button variant="ghost" size="icon" className="md:hidden shrink-0 mr-[-8px] ml-1" onClick={() => setActiveConv(null)}>
                  <ArrowRight className={`w-5 h-5 ${isAr ? '' : 'rotate-180'}`} />
                </Button>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <User className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{activeConv.other_user_name}</h3>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 rounded-full hidden sm:inline-block">
                    {isAr ? "أستاذ الأكاديمية" : "Academy Teacher"}
                  </span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('/chat-bg.png')] bg-repeat bg-opacity-5">
                {loadingMsgs ? (
                  <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender_id !== activeConv.other_user_id

                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted border border-border rounded-bl-sm text-foreground'
                          }`}>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {formatTime(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-border/50 shrink-0 bg-card">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    placeholder={isAr ? "اكتب رسالتك هنا..." : "Type your message..."}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="flex-1 rounded-2xl h-12 bg-muted/30 border-border/50 focus:bg-card"
                  />
                  <Button
                    type="submit"
                    disabled={!reply.trim() || sending}
                    className={`w-12 h-12 rounded-2xl shrink-0 ${reply.trim() ? 'bg-primary text-primary-foreground shadow-md hover:shadow-lg' : 'bg-muted text-muted-foreground'}`}
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />}
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>

      </div>

      {showNew && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowNew(false)}
        >
          <div
            className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{isAr ? 'بدء محادثة مع المدرس' : 'Message a teacher'}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAr ? 'يمكنك التواصل مع مدرسي الدورات التي التحقت بها.' : 'You can chat with the teachers of any course you are enrolled in.'}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowNew(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 border-b border-border/50">
              <div className="relative">
                <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <Input
                  value={newSearch}
                  onChange={e => setNewSearch(e.target.value)}
                  placeholder={isAr ? 'ابحث عن مدرّس...' : 'Search a teacher...'}
                  className="pl-9 pr-9 h-10 rounded-xl bg-muted/30"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {teachersLoading ? (
                <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : teachers.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground text-sm">
                  {isAr
                    ? 'لا يوجد مدرسون متاحون للمحادثة. سجّل في دورة أولاً لتظهر هنا.'
                    : 'No teachers available yet. Enroll in a course first to message its teacher.'}
                </div>
              ) : (
                teachers
                  .filter(tch => !newSearch.trim() || tch.name.toLowerCase().includes(newSearch.toLowerCase().trim()))
                  .map(tch => (
                    <button
                      key={tch.id}
                      onClick={() => startConversation(tch.id)}
                      disabled={startingChatWith === tch.id}
                      className="w-full text-start p-3 rounded-2xl border border-border hover:border-blue-500/40 hover:bg-blue-500/5 transition-colors flex items-center gap-3"
                    >
                      <div className="w-11 h-11 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 overflow-hidden">
                        {tch.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={tch.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-foreground truncate">{tch.name}</h4>
                        {tch.courses && tch.courses.length > 0 && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {tch.courses.join(' • ')}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-bold text-blue-600 shrink-0">
                        {startingChatWith === tch.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : (isAr ? 'مراسلة' : 'Message')}
                      </span>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
