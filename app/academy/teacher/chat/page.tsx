'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Send, User, Loader2, ArrowRight, UserPlus, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

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
}

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

export default function TeacherChatPage() {
  const { locale } = useI18n()
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

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch conversations
  useEffect(() => {
    fetchConversations()
  }, [])

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

  const startConversation = async (studentId: string) => {
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
        await fetchConversations()
        const newConv = conversations.find(c => c.id === data.conversationId) ||
          { id: data.conversationId, other_user_id: studentId, other_user_name: students.find(s => s.id === studentId)?.name || '', other_user_avatar: null, last_message: null, last_message_at: null, unread_count: 0 }
        setActiveConv(newConv)
        setShowNewConv(false)
      }
    } catch {
      // ignore
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
          {isAr ? "تواصل مع الطلاب" : "Student Messages"}
        </h1>
        <p className="text-muted-foreground font-medium">
          {isAr ? "أجب على استفسارات طلابك." : "Reply to your students' questions."}
        </p>
      </div>

      <div className="flex bg-card rounded-3xl border border-border shadow-sm flex-1 overflow-hidden min-h-0">

        {/* Sidebar (Conversations) */}
        <div className={`w-full md:w-80 border-${isAr ? 'l' : 'r'} border-border/50 flex flex-col min-h-0 ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border/50 space-y-3">
            <div className="relative">
              <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <Input
                placeholder={isAr ? "ابحث عن طالب..." : "Search student..."}
                className={`pl-9 pr-9 h-10 rounded-xl bg-muted/30 border-border/50 focus:bg-card`}
              />
            </div>
            <Button
              onClick={() => setShowNewConv(true)}
              className="w-full rounded-xl h-10 gap-2 font-bold"
            >
              <UserPlus className="w-4 h-4" />
              {isAr ? "محادثة جديدة" : "New Conversation"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 overflow-x-hidden custom-scrollbar">
            {loadingConv ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : conversations.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground text-sm font-medium">
                {isAr ? "لا توجد أي محادثات حالياً" : "No conversations yet"}
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
                    {isAr ? "طالب بالأكاديمية" : "Academy Student"}
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

      {/* New Conversation Modal */}
      {showNewConv && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewConv(false)}>
          <Card className="w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="font-bold text-lg">{isAr ? "بدء محادثة جديدة" : "Start New Conversation"}</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowNewConv(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 border-b border-border shrink-0">
              <div className="relative">
                <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <Input
                  placeholder={isAr ? "ابحث عن طالب..." : "Search student..."}
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
                    ? (isAr ? "لا يوجد طلاب مسجلين لديك" : "No students enrolled")
                    : (isAr ? "لا توجد نتائج" : "No results found")
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
