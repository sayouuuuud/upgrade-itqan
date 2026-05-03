'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, Check, X, Loader2, UserCheck, Clock, AlertCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { toast } from 'sonner'

interface ParentRequest {
  id: string
  parent_id: string
  parent_name: string
  parent_email: string
  parent_avatar: string | null
  relation: string
  status: 'pending' | 'active' | 'rejected'
  created_at: string
}

const relationLabels: Record<string, { ar: string; en: string }> = {
  father: { ar: 'أب', en: 'Father' },
  mother: { ar: 'أم', en: 'Mother' },
  guardian: { ar: 'ولي أمر', en: 'Guardian' },
  other: { ar: 'آخر', en: 'Other' },
}

export default function ParentRequestsPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  
  const [requests, setRequests] = useState<ParentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/academy/student/parent-requests')
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Failed to fetch parent requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    setActionLoading(requestId)
    try {
      const res = await fetch('/api/academy/student/parent-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message)
        // Update local state
        setRequests(prev => prev.map(r => 
          r.id === requestId 
            ? { ...r, status: action === 'approve' ? 'active' : 'rejected' }
            : r
        ))
      } else {
        toast.error(data.error || 'حدث خطأ')
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setActionLoading(null)
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const otherRequests = requests.filter(r => r.status !== 'pending')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isAr ? 'طلبات ربط أولياء الأمور' : 'Parent Link Requests'}</h1>
        <p className="text-muted-foreground mt-1">
          {isAr 
            ? 'هنا يمكنك قبول أو رفض طلبات ربط حسابك من أولياء الأمور'
            : 'Here you can approve or reject parent link requests'}
        </p>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-lg">
                {isAr ? 'طلبات في الانتظار' : 'Pending Requests'}
              </CardTitle>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                {pendingRequests.length}
              </Badge>
            </div>
            <CardDescription>
              {isAr 
                ? 'هذه الطلبات تحتاج إلى موافقتك أو رفضك'
                : 'These requests need your approval or rejection'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map(request => (
              <div 
                key={request.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-background rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={request.parent_avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {request.parent_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.parent_name}</p>
                    <p className="text-sm text-muted-foreground">{request.parent_email}</p>
                    <Badge variant="outline" className="mt-1">
                      {relationLabels[request.relation]?.[isAr ? 'ar' : 'en'] || request.relation}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleAction(request.id, 'approve')}
                    disabled={actionLoading === request.id}
                    className="gap-2"
                  >
                    {actionLoading === request.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {isAr ? 'قبول' : 'Approve'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(request.id, 'reject')}
                    disabled={actionLoading === request.id}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                    {isAr ? 'رفض' : 'Reject'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Pending Requests */}
      {pendingRequests.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <UserCheck className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-2">
                {isAr ? 'لا توجد طلبات معلقة' : 'No Pending Requests'}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {isAr 
                  ? 'عندما يطلب ولي أمر ربط حسابه بحسابك، سيظهر الطلب هنا لتتمكن من الموافقة أو الرفض'
                  : 'When a parent requests to link their account to yours, the request will appear here'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {otherRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isAr ? 'سجل الطلبات' : 'Request History'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {otherRequests.map(request => (
                <div 
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.parent_avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {request.parent_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{request.parent_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {relationLabels[request.relation]?.[isAr ? 'ar' : 'en'] || request.relation}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={request.status === 'active' ? 'default' : 'secondary'}
                    className={request.status === 'active' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }
                  >
                    {request.status === 'active' 
                      ? (isAr ? 'مربوط' : 'Linked')
                      : (isAr ? 'مرفوض' : 'Rejected')
                    }
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                {isAr ? 'ملاحظة مهمة' : 'Important Note'}
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                {isAr 
                  ? 'عند قبول طلب ولي الأمر، سيتمكن من متابعة تقدمك الدراسي ودرجاتك. يمكنك إلغاء الربط في أي وقت.'
                  : 'When you approve a parent request, they will be able to track your academic progress and grades. You can unlink at any time.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
