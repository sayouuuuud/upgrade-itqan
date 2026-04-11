'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

export default function InvitationPage({ params }: { params: { inviteCode: string } }) {
  const [invitation, setInvitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const res = await fetch(`/api/academy/invitations/${params.inviteCode}`)
        if (res.ok) {
          const data = await res.json()
          setInvitation(data)
        }
      } catch (error) {
        console.error('Failed to fetch invitation:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [params.inviteCode])

  const handleAccept = async () => {
    setAccepting(true)
    try {
      const res = await fetch(`/api/academy/invitations/${params.inviteCode}/accept`, {
        method: 'POST'
      })
      if (res.ok) {
        setAccepted(true)
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error)
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">جاري التحميل...</div>
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <Card className="max-w-md shadow-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">هذه الدعوة غير صحيحة أو منتهية الصلاحية</p>
            <Button onClick={() => window.location.href = '/'}>
              العودة للرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Card className="max-w-md shadow-xl text-center">
          <CardContent className="pt-12 pb-12">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">تم قبول الدعوة!</h1>
            <p className="text-gray-600 mb-6">
              {invitation.type === 'course'
                ? `تم إضافتك إلى دورة "${invitation.course_name}"`
                : 'تم إضافتك إلى المنصة'}
            </p>
            <Button onClick={() => window.location.href = '/academy/student'}>
              انتقل إلى الأكاديمية
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">دعوة جديدة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-2">تم دعوتك من قبل</p>
            <p className="text-lg font-semibold">{invitation.invited_by_name}</p>
          </div>

          {invitation.type === 'course' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">للانضمام إلى دورة</p>
              <p className="font-semibold text-lg">{invitation.course_name}</p>
            </div>
          )}

          <div className="text-sm text-gray-600 text-center">
            {new Date(invitation.expires_at) > new Date() ? (
              <p>الدعوة صالحة حتى {new Date(invitation.expires_at).toLocaleDateString('ar-EG')}</p>
            ) : (
              <p className="text-red-600">انتهت صلاحية هذه الدعوة</p>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleAccept}
              disabled={accepting || new Date(invitation.expires_at) <= new Date()}
              className="w-full"
            >
              {accepting ? 'جاري القبول...' : 'قبول الدعوة'}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              رفض
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
