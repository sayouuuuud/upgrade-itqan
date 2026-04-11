'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Trophy, Users } from 'lucide-react'

export default function AdminCompetitionsPage() {
  const [competitions, setCompetitions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const res = await fetch('/api/academy/admin/competitions')
        if (res.ok) {
          const data = await res.json()
          setCompetitions(data)
        }
      } catch (error) {
        console.error('Failed to fetch competitions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompetitions()
  }, [])

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">المسابقات</h1>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          مسابقة جديدة
        </Button>
      </div>

      <div className="grid gap-4">
        {competitions.map((comp) => (
          <Card key={comp.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{comp.name}</h3>
                    <Badge variant={
                      comp.status === 'active' ? 'default' :
                      comp.status === 'completed' ? 'secondary' : 'outline'
                    }>
                      {comp.status === 'active' ? 'نشطة' : 
                       comp.status === 'completed' ? 'منتهية' : 'قادمة'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{comp.description}</p>
                  <div className="flex gap-4 text-sm text-gray-600 pt-2">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {comp.participants_count} مشترك
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      جائزة: {comp.prize}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit2 className="w-3 h-3 ml-1" />
                    تعديل
                  </Button>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="w-3 h-3 ml-1" />
                    حذف
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {competitions.length === 0 && (
        <Card className="text-center py-12">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 mb-4">لا توجد مسابقات</p>
          <Button>
            <Plus className="w-4 h-4 ml-2" />
            إنشاء مسابقة
          </Button>
        </Card>
      )}
    </div>
  )
}
