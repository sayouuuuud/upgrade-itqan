'use client'
import { useState, useEffect, useRef, Suspense, Fragment } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChatDateDivider } from '@/components/chat/date-divider'
import { shouldShowDateDivider } from '@/lib/chat-date'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Send, User, Loader2, ArrowRight, UserPlus, X, Shield, Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { PageLoadingSkeleton } from '@/components/ui/page-loading-skeleton'

interface Student {
  id: string
  name: string
  email: string
}

interface Conversation {
  id: string
  other_user_id: string
  other_user_name: string
  other_user_avatar: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  is_ticket?: boolean
  ticket_status?: string
}

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

function ChatContent() {
  const searchParams = useSearchParams()
  const { locale, t } = useI18n()
  const isAr = locale === 'ar'
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [loadingConv, setLoadingConv] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const [showNewConv, setShowNewConv] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [creatingConv, setCreatingConv] = useState(false)
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/academy/conversations')
      const data = await res.json()
      if (res.ok) {
        setConversations(data.conversations || [])
        return data.conversations || []
      }
    } catch {
      // ignore
    } finally {
      setLoadingConv(false)
    }
    return []
  }

  // Initial load & URL params
  useEffect(() => {
    const init = async () => {
      const convs = await fetchConversations()
      
      const studentId = searchParams?.get('studentId')
      if (studentId) {
        const existingConv = convs.find((c: any) => c.other_user_id === studentId)
        if (existingConv) {
          setActiveConv(existingConv)
        } else {
          // Need to start conversation
          await startConversation(studentId, convs)
        }
        // Clean up URL
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/academy/teacher/chat')
        }
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const fetchStudents = async () => {
    setLoadingStudents(true)
    try {
      const res = await fetch('/api/academy/teacher/students')
      const data = await res.json()
      if (res.ok) {
        setStudents(data.data || [])
      }
    } catch {
      // ignore
    } finally {
      setLoadingStudents(false)
    }
  }

  const startConversation = async (studentId: string, currentConvs?: Conversation[]) => {
    setCreatingConv(true)
    try {
      const res = await fetch('/api/academy/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: studentId })
      })
      const data = await res.json()
      if (res.ok && data.conversationId) {
        // Refresh conversations and select the new one
        const updatedConvs = await fetchConversations()
        const newConv = updatedConvs.find((c: any) => c.id === data.conversationId) ||
          { id: data.conversationId, other_user_id: studentId, other_user_name: students.find(s => s.id === studentId)?.name || (t.addedTranslations_2026?.['طالب'] || (t.addedTranslations_2026?.['طالب'] || 'طالب')), other_user_avatar: null, last_message: null, last_message_at: null, unread_count: 0 }
        
        // Update local list instantly if missing
        if (!updatedConvs.find((c: any) => c.id === data.conversationId)) {
           setConversations(prev => [newConv, ...prev])
        }
        
        setActiveConv(newConv)
        setShowNewConv(false)
      } else {
        console.error('Failed to create conversation', data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCreatingConv(false)
    }
  }

  // When opening new conversation modal, fetch students
  useEffect(() => {
    if (showNewConv && students.length === 0) {
      fetchStudents()
    }
  }, [showNewConv])

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  )


  const handleCreateTicket = async () => {
    if (creatingConv) return

    // If a support ticket already exists, just open it (2nd click → open).
    const existingTicket = conversations.find(c => c.is_ticket)
    if (existingTicket) {
      setActiveConv(existingTicket)
      return
    }

    setCreatingConv(true)
    try {
      const res = await fetch('/api/academy/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTicket: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data?.error || ((t.addedTranslations_2026?.['تعذر فتح التذكرة'] || (t.addedTranslations_2026?.['تعذر فتح التذكرة'] || 'تعذر فتح التذكرة'))))
        return
      }
      const newConvs = await fetchConversations()
      const found = newConvs.find((c: any) => c.id === data.conversationId)
      if (found) setActiveConv(found)
    } catch {
      // ignore
    } finally {
      setCreatingConv(false)
    }
  }

  const handleDeleteConversation = async (convId: string) => {
    if (!confirm((t.addedTranslations_2026?.['هل تريد حذف هذه المحادثة نهائياً؟'] || (t.addedTranslations_2026?.['هل تريد حذف هذه المحادثة نهائياً؟'] || 'هل تريد حذف هذه المحادثة نهائياً؟')))) return
    setDeletingConvId(convId)
    try {
      const res = await fetch(`/api/academy/conversations/${convId}`, { method: 'DELETE' })
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== convId))
        setActiveConv(prev => (prev?.id === convId ? null : prev))
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data?.error || ((t.addedTranslations_2026?.['تعذر حذف المحادثة'] || (t.addedTranslations_2026?.['تعذر حذف المحادثة'] || 'تعذر حذف المحادثة'))))
      }
    } catch {
      // ignore
    } finally {
      setDeletingConvId(null)
    }
  }

  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeConv) return
    const fetchMsgs = async (isBackground = false) => {
      if (!isBackground) setLoadingMsgs(true)
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
        if (!isBackground) setLoadingMsgs(false)
      }
    }

    fetchMsgs()

    // Polling setup (every 5 seconds)
    const interval = setInterval(() => fetchMsgs(true), 5000)
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
          {(t.addedTranslations_2026?.['تواصل مع الطلاب'] || (t.addedTranslations_2026?.['تواصل مع الطلاب'] || 'تواصل مع الطلاب'))}
        </h1>
        <p className="text-muted-foreground font-medium">
          {(t.addedTranslations_2026?.['أجب على استفسارات طلابك.'] || (t.addedTranslations_2026?.['أجب على استفسارات طلابك.'] || 'أجب على استفسارات طلابك.'))}
        </p>
      </div>

      <div className="flex bg-card rounded-3xl border border-border shadow-sm flex-1 overflow-hidden min-h-0">

        {/* Sidebar (Conversations) */}
        <div className={`w-full md:w-80 border-${isAr ? 'l' : 'r'} border-border/50 flex flex-col min-h-0 ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border/50 space-y-3">
            <div className="relative">
              <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <Input
                placeholder={(t.addedTranslations_2026?.['ابحث عن طالب...'] || (t.addedTranslations_2026?.['ابحث عن طالب...'] || 'ابحث عن طالب...'))}
                className={`pl-9 pr-9 h-10 rounded-xl bg-muted/30 border-border/50 focus:bg-card`}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowNewConv(true)}
                className="flex-1 justify-center rounded-xl h-10 gap-2 font-bold px-2"
              >
                <UserPlus className="w-4 h-4" />
                <span className="truncate">{(t.addedTranslations_2026?.['محادثة'] || (t.addedTranslations_2026?.['محادثة'] || 'محادثة'))}</span>
              </Button>
              <Button
                onClick={handleCreateTicket}
                disabled={creatingConv}
                variant="outline"
                className="flex-1 justify-center rounded-xl h-10 gap-2 font-bold px-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950"
              >
                <Shield className="w-4 h-4" />
                <span className="truncate">{(t.addedTranslations_2026?.['الدعم'] || (t.addedTranslations_2026?.['الدعم'] || 'الدعم'))}</span>
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 overflow-x-hidden custom-scrollbar">
            {loadingConv ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : conversations.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground text-sm font-medium">
                {(t.addedTranslations_2026?.['لا توجد أي محادثات حالياً'] || (t.addedTranslations_2026?.['لا توجد أي محادثات حالياً'] || 'لا توجد أي محادثات حالياً'))}
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full text-start p-3 rounded-2xl flex items-center gap-3 transition-colors ${activeConv?.id === conv.id ? 'bg-primary/10' : 'hover:bg-muted/50 cursor-pointer'}`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                      {conv.is_ticket ? <Shield className="w-6 h-6 text-blue-500" /> : <User className="w-6 h-6 text-blue-500" />}
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-card">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="font-bold text-sm text-foreground truncate">
                        {conv.is_ticket ? ((t.addedTranslations_2026?.['الدعم الفني'] || (t.addedTranslations_2026?.['الدعم الفني'] || 'الدعم الفني'))) : conv.other_user_name}
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-medium shrink-0">{formatTime(conv.last_message_at)}</span>
                    </div>
                    <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}`}>
                      {conv.last_message || ((t.addedTranslations_2026?.['بدء محادثة جديدة'] || (t.addedTranslations_2026?.['بدء محادثة جديدة'] || 'بدء محادثة جديدة')))}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content (Messages) */}
        <div className={`flex-1 flex flex-col min-h-0 ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <Send className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-bold text-lg">{(t.addedTranslations_2026?.['اختر محادثة للبدء'] || (t.addedTranslations_2026?.['اختر محادثة للبدء'] || 'اختر محادثة للبدء'))}</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-border/50 flex items-center gap-4 shrink-0 bg-card z-10 shadow-sm relative">
                <Button variant="ghost" size="icon" className="md:hidden shrink-0 mr-[-8px] ml-1" onClick={() => setActiveConv(null)}>
                  <ArrowRight className={`w-5 h-5 ${isAr ? '' : 'rotate-180'}`} />
                </Button>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                  {activeConv.is_ticket ? <Shield className="w-5 h-5 text-blue-500" /> : <User className="w-5 h-5 text-blue-500" />}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">
                    {activeConv.is_ticket ? ((t.addedTranslations_2026?.['الدعم الفني'] || (t.addedTranslations_2026?.['الدعم الفني'] || 'الدعم الفني'))) : activeConv.other_user_name}
                  </h3>
                  {activeConv.is_ticket ? (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 rounded-full hidden sm:inline-block">
                      {(t.addedTranslations_2026?.['تذكرة دعم فني'] || (t.addedTranslations_2026?.['تذكرة دعم فني'] || 'تذكرة دعم فني'))}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 rounded-full hidden sm:inline-block">
                      {(t.addedTranslations_2026?.['طالب بالأكاديمية'] || (t.addedTranslations_2026?.['طالب بالأكاديمية'] || 'طالب بالأكاديمية'))}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteConversation(activeConv.id)}
                  disabled={deletingConvId === activeConv.id}
                  title={(t.addedTranslations_2026?.['حذف المحادثة'] || (t.addedTranslations_2026?.['حذف المحادثة'] || 'حذف المحادثة'))}
                  className={`${isAr ? 'mr-auto' : 'ml-auto'} shrink-0 text-muted-foreground hover:text-red-600 hover:bg-red-500/10`}
                >
                  {deletingConvId === activeConv.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </Button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('/chat-bg.png')] bg-repeat bg-opacity-5">
                {loadingMsgs ? (
                  <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender_id !== activeConv.other_user_id
                    const showDate = shouldShowDateDivider(messages[idx - 1]?.created_at, msg.created_at)

                    return (
                      <Fragment key={msg.id}>
                        {showDate && <ChatDateDivider date={msg.created_at} isAr={isAr} />}
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
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
                      </Fragment>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-border/50 shrink-0 bg-card">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    placeholder={(t.addedTranslations_2026?.['اكتب رسالتك هنا...'] || (t.addedTranslations_2026?.['اكتب رسالتك هنا...'] || 'اكتب رسالتك هنا...'))}
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

      {/* New Conversation Modal */}
      {showNewConv && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewConv(false)}>
          <Card className="w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="font-bold text-lg">{(t.addedTranslations_2026?.['بدء محادثة جديدة'] || (t.addedTranslations_2026?.['بدء محادثة جديدة'] || 'بدء محادثة جديدة'))}</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowNewConv(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 border-b border-border shrink-0">
              <div className="relative">
                <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <Input
                  placeholder={(t.addedTranslations_2026?.['ابحث عن طالب...'] || (t.addedTranslations_2026?.['ابحث عن طالب...'] || 'ابحث عن طالب...'))}
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className={`${isAr ? 'pr-9' : 'pl-9'} h-10 rounded-xl`}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingStudents ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground text-sm">
                  {students.length === 0
                    ? ((t.addedTranslations_2026?.['لا يوجد طلاب مسجلين لديك'] || (t.addedTranslations_2026?.['لا يوجد طلاب مسجلين لديك'] || 'لا يوجد طلاب مسجلين لديك')))
                    : ((t.addedTranslations_2026?.['لا توجد نتائج'] || (t.addedTranslations_2026?.['لا توجد نتائج'] || 'لا توجد نتائج')))
                  }
                </div>
              ) : (
                filteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => startConversation(student.id)}
                    disabled={creatingConv}
                    className="w-full text-start p-3 rounded-xl flex items-center gap-3 hover:bg-muted/50 transition-colors disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                      <User className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                    </div>
                    {creatingConv && <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function TeacherChatPage() {
    
  const { t } = useI18n()
  const academyTeacher = (t as any).academyTeacher as Record<string, string> | undefined
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <ChatContent />
    </Suspense>
  )
}
