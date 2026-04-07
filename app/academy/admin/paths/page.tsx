'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react'

export default function AdminPathsPage() {
  const [paths, setPaths] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const res = await fetch('/api/academy/admin/paths')
        if (res.ok) {
          const data = await res.json()
          setPaths(data)
        }
      } catch (error) {
        console.error('Failed to fetch paths:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPaths()
  }, [])

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">مسارات التعلم</h1>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          مسار جديد
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paths.map((path) => (
          <Card key={path.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{path.name}</CardTitle>
                <Badge>{path.level}</Badge>
              </div>
              <p className="text-sm text-gray-600">{path.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span>{path.courses_count} دورات</span>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit2 className="w-3 h-3 ml-1" />
                  تعديل
                </Button>
                <Button size="sm" variant="destructive" className="flex-1">
                  <Trash2 className="w-3 h-3 ml-1" />
                  حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {paths.length === 0 && (
        <Card className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">لا توجد مسارات تعليمية</p>
        </Card>
      )}
    </div>
  )
}
