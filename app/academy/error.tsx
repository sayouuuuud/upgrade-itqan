'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import Link from 'next/link'

/**
 * Academy-wide error boundary.
 *
 * Without this file, any uncaught exception thrown during server rendering of
 * an academy page (layout, page, server components, RSC data fetches) becomes
 * an opaque 500 response, and the browser shows its own
 * "This page couldn't load" screen instead of useful UI.
 *
 * This boundary keeps the user inside the app, surfaces the actual error
 * message in development, and gives them a way to recover without losing
 * their session.
 */
export default function AcademyError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[academy/error]', error)
  }, [error])

  const isDev = process.env.NODE_ENV !== 'production'

  return (
    <div
      dir="rtl"
      className="min-h-[60vh] flex items-center justify-center p-6"
    >
      <div className="max-w-lg w-full bg-card border border-border rounded-2xl p-8 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            تعذّر تحميل الصفحة
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            حدث خطأ غير متوقّع أثناء عرض هذه الصفحة. حاول إعادة التحميل، وإن
            استمرت المشكلة عُد إلى لوحة التحكم.
          </p>
        </div>

        {isDev && (
          <pre className="text-start text-xs bg-muted text-muted-foreground p-3 rounded-md overflow-auto max-h-48 whitespace-pre-wrap">
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ''}
          </pre>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
          <Button asChild variant="outline" className="gap-2 bg-transparent">
            <Link href="/academy/student">
              <Home className="w-4 h-4" />
              لوحة التحكم
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
