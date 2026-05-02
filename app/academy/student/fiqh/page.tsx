'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { HelpCircle, Send } from 'lucide-react'

const CATEGORIES = [
  'عقيدة',
  'فقه',
  'تفسير',
  'حديث',
  'سيرة',
  'أخلاق',
  'أسرة',
  'أخرى',
]

interface FiqhQuestion {
  id: string
  question: string
  category: string
  answer: string | null
  answered_by: string | null
  is_published: boolean
  created_at: string
}

export default function StudentFiqhPage() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [category, setCategory] = useState('فقه')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: questions, isLoading, mutate } = useSWR<FiqhQuestion[]>(
    session ? '/api/academy/student/fiqh' : null,
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/academy/student/fiqh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, category }),
      })

      if (res.ok) {
        setQuestion('')
        setCategory('فقه')
        setIsOpen(false)
        mutate()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg w-64"></div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">الأسئلة الفقهية</h1>
          <p className="text-slate-500 mt-2">اطرح أسئلتك الفقهية على العلماء والمشرفين</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <HelpCircle className="w-4 h-4" />
              سؤال جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>اطرح سؤالك الفقهي</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">التصنيف</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">السؤال</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="اكتب سؤالك بوضوح..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg min-h-32"
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال السؤال'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {questions && questions.length > 0 ? (
          questions.map((q) => (
            <Card key={q.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">
                        {q.category}
                      </span>
                      {q.is_published && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          موجود جواب
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-base">{q.question}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              {q.answer && (
                <CardContent className="space-y-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-600 font-medium mb-2">الإجابة:</p>
                    <p className="text-slate-700">{q.answer}</p>
                    {q.answered_by && (
                      <p className="text-xs text-slate-500 mt-2">الجواب من: {q.answered_by}</p>
                    )}
                  </div>
                </CardContent>
              )}
              <CardContent className="text-xs text-slate-500">
                {new Date(q.created_at).toLocaleDateString('ar')}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              لم تطرح أي أسئلة حتى الآن. ابدأ بطرح سؤالك الأول!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

