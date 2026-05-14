'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function VerifyMailingListPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [teacherName, setTeacherName] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/public/mailing-list/verify/${token}`)
      .then(async r => {
        const d = await r.json()
        if (r.ok && d.success) {
          setTeacherName(d.teacher_name)
          setStatus('ok')
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
            <p>جاري تأكيد الاشتراك...</p>
          </>
        )}
        {status === 'ok' && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" />
            <h1 className="text-2xl font-bold">تم تأكيد اشتراكك! 🎉</h1>
            <p className="text-slate-600">
              هتوصلك إيميلات لما الشيخ {teacherName || 'المتابع'} ينزل دروس جديدة.
            </p>
            <Link
              href="/"
              className="inline-block mt-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              زيارة المنصة
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto text-red-500" />
            <h1 className="text-2xl font-bold">رابط غير صالح</h1>
            <p className="text-slate-600">
              اللينك ده مش صالح أو منتهي الصلاحية. حاول تشترك تاني من صفحة الدرس.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
