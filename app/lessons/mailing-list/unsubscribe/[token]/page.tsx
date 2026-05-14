'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2 } from 'lucide-react'

export default function UnsubscribeMailingListPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [status, setStatus] = useState<'loading' | 'ok'>('loading')
  const [teacherName, setTeacherName] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/public/mailing-list/unsubscribe/${token}`)
      .then(async r => {
        const d = await r.json()
        setTeacherName(d.teacher_name || null)
        setEmail(d.email || null)
        setStatus('ok')
      })
      .catch(() => setStatus('ok'))
  }, [token])

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
        {status === 'loading' ? (
          <>
            <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
            <p>جاري إلغاء الاشتراك...</p>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" />
            <h1 className="text-2xl font-bold">تم إلغاء اشتراكك</h1>
            <p className="text-slate-600">
              {email ? <><span dir="ltr" className="font-mono">{email}</span> </> : ''}
              مش هيوصله أي إيميلات تانية من الشيخ {teacherName || 'ده'}.
            </p>
            <Link href="/" className="inline-block mt-2 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-800 text-white">
              العودة للموقع
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
