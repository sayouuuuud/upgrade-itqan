'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, MessageSquare, CheckCircle } from 'lucide-react'

export default function AdminFiqhPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch('/api/academy/admin/fiqh')
        if (res.ok) {
          const data = await res.json()
          setQuestions(data)
        }
      } catch (error) {
        console.error('Failed to fetch fiqh questions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [])

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">أسئلة الفقه</h1>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          سؤال جديد
        </Button>
      </div>

      <div className="space-y-3">
        {questions.map((q) => (
          <Card key={q.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{q.title}</h3>
                    <Badge variant={q.status === 'answered' ? 'default' : 'secondary'}>
                      {q.status === 'answered' ? 'مجاب' : 'معلق'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{q.content}</p>
                  {q.answer && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                      <p className="font-semibold text-green-900 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        الإجابة
                      </p>
                      <p className="text-green-700 line-clamp-2">{q.answer}</p>
                    </div>
                  )}
                  <div className="flex gap-4 text-xs text-gray-500 pt-2">
                    <span>بواسطة: {q.author_name}</span>
                    <span>{new Date(q.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost">
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {questions.length === 0 && (
        <Card className="text-center py-12">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">لا توجد أسئلة فقهية</p>
        </Card>
      )}
    </div>
  )
}
