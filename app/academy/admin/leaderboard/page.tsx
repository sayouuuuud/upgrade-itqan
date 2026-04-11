'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Medal, Trophy, Zap } from 'lucide-react'

export default function AdminLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/academy/admin/leaderboard')
        if (res.ok) {
          const data = await res.json()
          setLeaderboard(data)
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">لوحة المتصدرين</h1>

      <div className="space-y-2">
        {leaderboard.map((entry, index) => (
          <Card key={entry.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold w-10 text-center">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{entry.name}</p>
                    <p className="text-sm text-gray-600">{entry.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">النقاط</p>
                    <p className="text-2xl font-bold text-amber-600">{entry.total_points}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">المهام</p>
                    <p className="text-2xl font-bold text-blue-600">{entry.tasks_completed}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">الشارات</p>
                    <p className="text-2xl font-bold text-purple-600">{entry.badges_count}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {leaderboard.length === 0 && (
        <Card className="text-center py-12">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">لا توجد بيانات</p>
        </Card>
      )}
    </div>
  )
}
