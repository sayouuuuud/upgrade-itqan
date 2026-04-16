'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Mail, CheckCircle } from 'lucide-react'

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'expired'>('all')

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const res = await fetch('/api/academy/admin/invitations')
        if (res.ok) {
          const data = await res.json()
          setInvitations(data)
        }
      } catch (error) {
        console.error('Failed to fetch invitations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvitations()
  }, [])

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  const filteredInvitations = invitations.filter(i =>
    filter === 'all' ? true : i.status === filter
  )

  const statusColor: Record<string, 'secondary' | 'default' | 'destructive'> = {
    pending: 'secondary',
    accepted: 'default',
    expired: 'destructive'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">الدعوات</h1>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          دعوة جديدة
        </Button>
      </div>

      <div className="flex gap-2">
        {(['all', 'pending', 'accepted', 'expired'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'الكل' :
              f === 'pending' ? 'معلقة' :
                f === 'accepted' ? 'مقبولة' : 'منتهية'}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredInvitations.map((inv) => (
          <Card key={inv.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{inv.email}</p>
                    <Badge variant={statusColor[inv.status as keyof typeof statusColor]}>
                      {inv.status === 'pending' ? 'معلقة' :
                        inv.status === 'accepted' ? 'مقبولة' : 'منتهية'}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>البريد المُرسِل: {inv.invited_by_name}</p>
                    <p>تاريخ الإرسال: {new Date(inv.created_at).toLocaleDateString('ar-EG')}</p>
                    {inv.status === 'accepted' && (
                      <p className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        تم القبول في: {new Date(inv.accepted_at).toLocaleDateString('ar-EG')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {inv.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline">
                        <Mail className="w-3 h-3 ml-1" />
                        إعادة إرسال
                      </Button>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="w-3 h-3 ml-1" />
                        حذف
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInvitations.length === 0 && (
        <Card className="text-center py-12">
          <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">لا توجد دعوات</p>
        </Card>
      )}
    </div>
  )
}
