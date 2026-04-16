'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { BookOpen, AlertCircle, Plus, Loader2, ArrowRight, User as UserIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface Question {
  id: string
  question: string
  answer: string | null
  category: string
  is_published: boolean
  is_anonymous: boolean
  student_name: string
  asked_at: string
  answered_at: string | null
}

export default function StudentFiqhPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const [questions, setQuestions] = useState<Question[]>([])
  const [view, setView] = useState('all') // 'all' or 'mine'
  const [loading, setLoading] = useState(true)

  const [isAskOpen, setIsAskOpen] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [newCategory, setNewCategory] = useState('worship')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null)

  const categories = [
    { id: 'worship', label: isAr ? 'العبادات' : 'Worship' },
    { id: 'transactions', label: isAr ? 'المعاملات' : 'Transactions' },
    { id: 'family', label: isAr ? 'الأسرة' : 'Family' },
    { id: 'other', label: isAr ? 'أخرى' : 'Other' },
  ]

  useEffect(() => {
    fetchQuestions()
  }, [view])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/academy/fiqh?view=${view}`)
      const data = await res.json()
      if (res.ok) setQuestions(data.questions || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/academy/fiqh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQuestion, category: newCategory, isAnonymous })
      })
      if (res.ok) {
        setIsAskOpen(false)
        setNewQuestion('')
        setIsAnonymous(false)
        setView('mine')
        fetchQuestions() // Refresh
      }
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  if (activeQuestion) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12" dir={isAr ? "rtl" : "ltr"}>
        <Button variant="ghost" onClick={() => setActiveQuestion(null)} className="mb-2">
          {isAr ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowRight className="w-4 h-4 mr-2 rotate-180" />}
          {isAr ? "العودة للأسئلة" : "Back to Questions"}
        </Button>

        <Card className="border-border shadow-sm border-t-4 border-t-primary">
          <CardContent className="p-6 md:p-8 space-y-8">
            {/* Question */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded-sm">
                  {categories.find(c => c.id === activeQuestion.category)?.label || activeQuestion.category}
                </span>
                <span className="text-xs text-muted-foreground">{formatTime(activeQuestion.asked_at)}</span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-foreground leading-relaxed">
                <span className="text-primary font-black ml-2">Q:</span>
                {activeQuestion.question}
              </h2>
              <div className="flex items-center gap-2 pt-2">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{activeQuestion.student_name}</span>
              </div>
            </div>

            {/* Answer */}
            {activeQuestion.answer ? (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative">
                <div className="absolute top-0 right-6 translate-y-[-50%] bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                  {isAr ? "الإجابة" : "Answer"}
                </div>
                <div className="mt-2 space-y-4">
                  <p className="whitespace-pre-wrap leading-relaxed font-medium text-foreground/90">
                    {activeQuestion.answer}
                  </p>
                  <p className="text-xs text-muted-foreground pt-4 border-t border-primary/10">
                    {activeQuestion.answered_at ? formatTime(activeQuestion.answered_at) : ''}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 border border-border rounded-2xl p-6 text-center text-muted-foreground">
                <AlertCircle className="w-8 h-8 opacity-50 mx-auto mb-2" />
                <p className="font-medium">{isAr ? "في انتظار إجابة اللجنة العلمية..." : "Waiting for Answer..."}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            {isAr ? "فتاوى وأحكام" : "Fiqh Questions"}
          </h1>
          <p className="text-muted-foreground font-medium">
            {isAr ? "اسأل في الفقه والأحكام واقرأ فتاوى اللجنة العلمية." : "Ask about Fiqh and rulings, and read answers from the committee."}
          </p>
        </div>
        <Button onClick={() => setIsAskOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          {isAr ? "اسأل سؤالاً" : "Ask Question"}
        </Button>
      </div>

      <div className="flex bg-muted p-1 rounded-full w-full max-w-sm mb-6 border border-border relative z-0">
        <div
          className="absolute inset-y-1 bg-card rounded-full shadow-sm transition-all duration-300 -z-10"
          style={{
            width: 'calc(50% - 4px)',
            left: view === (isAr ? 'mine' : 'all') ? '4px' : 'calc(50%)'
          }}
        />
        <button
          onClick={() => setView('all')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-full transition-colors ${view === 'all' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}
        >
          {isAr ? "الفتاوى العامة" : "Public Questions"}
        </button>
        <button
          onClick={() => setView('mine')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-full transition-colors ${view === 'mine' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}
        >
          {isAr ? "أسئلتي" : "My Questions"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : questions.length === 0 ? (
          <Card className="col-span-full border-dashed bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-bold text-foreground mb-1">{isAr ? "لا توجد أسئلة" : "No questions"}</p>
              <p className="text-sm text-muted-foreground">{isAr ? "اطرح سؤالك الأول الآن" : "Ask your first question now"}</p>
            </CardContent>
          </Card>
        ) : (
          questions.map(q => (
            <Card key={q.id} onClick={() => setActiveQuestion(q)} className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md h-full flex flex-col group">
              <CardContent className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-4">
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-sm">
                    {categories.find(c => c.id === q.category)?.label || q.category}
                  </span>

                  <h3 className="font-bold text-base text-foreground line-clamp-2 leading-relaxed group-hover:text-primary transition-colors">
                    {q.question}
                  </h3>

                  {q.answer ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {q.answer}
                    </p>
                  ) : (
                    <div className="inline-flex py-1 px-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                      {isAr ? "قيد المراجعة والإجابة" : "Awaiting Answer"}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <UserIcon className="w-3.5 h-3.5" />
                    {q.student_name}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatTime(q.asked_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isAskOpen} onOpenChange={setIsAskOpen}>
        <DialogContent className="sm:max-w-[500px] border-border bg-card">
          <DialogHeader>
            <DialogTitle>{isAr ? "طرح سؤال فقهي" : "Ask Fiqh Question"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4" dir={isAr ? "rtl" : "ltr"}>
            <div className="space-y-1">
              <label className="text-sm font-bold text-foreground">{isAr ? "السؤال" : "Question"}</label>
              <Textarea
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                rows={4}
                placeholder={isAr ? "اكتب سؤالك بوضوح وتفصيل..." : "Write your question clearly..."}
                className="resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-foreground">{isAr ? "التصنيف" : "Category"}</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full border-border bg-card p-2 rounded-md border focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={(val) => setIsAnonymous(!!val)} />
              <label htmlFor="anonymous" className="text-sm font-medium leading-none cursor-pointer">
                {isAr ? "طرح كسؤال غير معروف (لن يظهر اسمك في الفتاوى العامة)" : "Ask anonymously (your name won't appear publicly)"}
              </label>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse sm:justify-start">
            <Button onClick={handleAskQuestion} disabled={!newQuestion.trim() || submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "إرسال السؤال" : "Submit Question")}
            </Button>
            <Button variant="ghost" onClick={() => setIsAskOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
