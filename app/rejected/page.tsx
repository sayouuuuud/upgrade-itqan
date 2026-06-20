'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle, RefreshCcw, LogOut, Loader2, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/context'

export default function RejectedPage() {
  const router = useRouter()
  const { t, dir } = useI18n()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReapply = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/reapply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        // Redirect after showing success message
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(data.error || t?.rejectedPage?.toastErrorReapply || 'حدث خطأ أثناء إعادة التقديم')
      }
    } catch (err) {
      setError(t?.rejectedPage?.toastErrorConnection || 'حدث خطأ في الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch {
      router.push('/login')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4" dir={dir}>
        <Card className="w-full max-w-md text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl">{t?.rejectedPage?.successTitle}</CardTitle>
            <CardDescription>
              {t?.rejectedPage?.successDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t?.rejectedPage?.redirecting}
            </p>
            <Button variant="outline" onClick={() => router.push('/login')} className="gap-2">
              {t?.rejectedPage?.btnGoNow}
              <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4" dir={dir}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl">{t?.rejectedPage?.rejectedTitle}</CardTitle>
          <CardDescription className="mt-2">
            {t?.rejectedPage?.rejectedDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <h4 className="font-medium mb-2">{t?.rejectedPage?.tipsTitle}</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>{t?.rejectedPage?.tip1}</li>
              <li>{t?.rejectedPage?.tip2}</li>
              <li>{t?.rejectedPage?.tip3}</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button 
              onClick={handleReapply} 
              disabled={loading}
              className="w-full gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCcw className="w-4 h-4" />
              )}
              {t?.rejectedPage?.btnReapply}
            </Button>

            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full gap-2"
            >
              <LogOut className="w-4 h-4" />
              {t?.rejectedPage?.btnLogout}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
