'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Award,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Save,
  Sparkles,
  Trophy,
  User,
  XCircle,
} from 'lucide-react'

interface CertRequest {
  id: string
  student_id: string
  scope: string
  kind: string
  source_table: string | null
  source_id: string | null
  source_label: string | null
  status: string
  template_id: string | null
  template_name: string | null
  language: string
  data: Record<string, string> | null
  rejection_reason: string | null
  rank: number | null
  reason: string | null
  pdf_url: string | null
  teacher_name?: string | null
}

const KIND_LABEL_AR: Record<string, string> = {
  course: 'دورة',
  learning_path: 'مسار تعليمي',
  memorization_path: 'مسار حفظ',
  tajweed_path: 'مسار تجويد',
  series: 'سلسلة',
  competition: 'مسابقة',
  recitation: 'تلاوة',
  custom: 'إنجاز',
}
const KIND_LABEL_EN: Record<string, string> = {
  course: 'Course',
  learning_path: 'Learning Path',
  memorization_path: 'Memorization Path',
  tajweed_path: 'Tajweed Path',
  series: 'Series',
  competition: 'Competition',
  recitation: 'Recitation',
  custom: 'Achievement',
}

interface StudentRequestFormProps {
  id: string
  apiBase: string
  backHref: string
}

export default function StudentCertificateRequestForm({
  id,
  apiBase,
  backHref,
}: StudentRequestFormProps) {
  const router = useRouter()
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [request, setRequest] = useState<CertRequest | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state — what the student fills.
  const [displayName, setDisplayName] = useState('')
  const [arabicName, setArabicName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmAccurate, setConfirmAccurate] = useState(false)

  useEffect(() => {
    fetch(`${apiBase}/requests/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error)
        } else {
          setRequest(d.request)
          const data = d.request.data || {}
          setDisplayName(data.display_name || '')
          setArabicName(data.arabic_name || '')
          setPhone(data.phone || '')
          setNotes(data.notes || '')
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [id])

  const submit = async () => {
    if (!confirmAccurate) {
      alert(
        isAr
          ? 'يرجى تأكيد صحة البيانات قبل الإرسال'
          : 'Please confirm the details are accurate before submitting',
      )
      return
    }
    setSaving(true)
    try {
      const res = await fetch(
        `${apiBase}/requests/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'submit',
            data: {
              display_name: displayName,
              arabic_name: arabicName,
              phone,
              notes,
            },
          }),
        },
      )
      if (res.ok) {
        router.push(backHref)
      } else {
        const d = await res.json().catch(() => null)
        alert(d?.error || (isAr ? 'فشل الإرسال' : 'Submit failed'))
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }
  if (error || !request) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-black">
          {isAr ? 'تعذر تحميل الطلب' : 'Failed to load request'}
        </h2>
        <p className="text-muted-foreground mt-2">{error}</p>
      </div>
    )
  }

  const kindLabel = isAr
    ? KIND_LABEL_AR[request.kind] || request.kind
    : KIND_LABEL_EN[request.kind] || request.kind

  const Arrow = isAr ? ArrowRight : ArrowLeft
  const locked = !['data_required', 'rejected', 'submitted'].includes(
    request.status,
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <Arrow className="w-4 h-4" />
        {isAr ? 'العودة لمركز الشهادات' : 'Back to certificates centre'}
      </Link>

      <Card className="rounded-3xl border-amber-200/50 bg-gradient-to-br from-amber-50/60 to-background">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              {request.kind === 'competition' ? (
                <Trophy className="w-6 h-6" />
              ) : (
                <Award className="w-6 h-6" />
              )}
            </span>
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                {kindLabel}
              </p>
              <h1 className="text-2xl font-black tracking-tight">
                {request.source_label ||
                  (isAr ? 'شهادة جاهزة للإصدار' : 'New certificate')}
              </h1>
              {request.reason && (
                <p className="text-sm text-amber-800 mt-1">{request.reason}</p>
              )}
            </div>
          </div>
          {request.teacher_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              {isAr ? 'الأستاذ: ' : 'Teacher: '}
              {request.teacher_name}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-black">
              {isAr ? 'بياناتك على الشهادة' : 'Your details on the certificate'}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? 'اكتب اسمك كما تريده أن يظهر على الشهادة بالضبط. سيتم إصدار شهادتك تلقائيًا فور الإرسال.'
              : 'Type your name exactly as you want it on the certificate. Your certificate is issued automatically as soon as you submit.'}
          </p>

          {request.rejection_reason && (
            <div className="text-sm rounded-2xl bg-rose-50 border border-rose-200 p-4 space-y-1">
              <p className="font-bold text-rose-700">
                {isAr ? 'تم رفض الطلب السابق' : 'Previous request rejected'}
              </p>
              <p className="text-rose-800">{request.rejection_reason}</p>
            </div>
          )}

          <Field
            label={isAr ? 'الاسم على الشهادة (ثلاثي على الأقل)' : 'Name on certificate'}
            required
          >
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={locked}
              placeholder={
                isAr ? 'مثال: محمد علي عبد الرحمن' : 'e.g. Mohamed Ali Abdulrahman'
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-amber-500"
            />
          </Field>

          <Field
            label={
              isAr
                ? 'الاسم بالعربية (إن لم تكن اللغة الأم)'
                : 'Arabic spelling (if different)'
            }
          >
            <input
              type="text"
              value={arabicName}
              onChange={(e) => setArabicName(e.target.value)}
              disabled={locked}
              placeholder={isAr ? 'اختياري' : 'Optional'}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-amber-500"
              dir="rtl"
            />
          </Field>

          <Field
            label={isAr ? 'رقم الهاتف للتواصل' : 'Contact phone'}
          >
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={locked}
              placeholder={isAr ? 'اختياري — للتواصل عند الحاجة' : 'Optional'}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-amber-500"
              dir="ltr"
            />
          </Field>

          <Field
            label={isAr ? 'ملاحظات إضافية للإدارة' : 'Notes for the admin'}
          >
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={locked}
              placeholder={
                isAr
                  ? 'أي ملاحظات تريد إضافتها على الطلب'
                  : 'Any extra notes to share with the admin'
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500"
            />
          </Field>

          {!locked && (
            <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmAccurate}
                onChange={(e) => setConfirmAccurate(e.target.checked)}
                className="mt-1 h-4 w-4 accent-amber-600"
              />
              <span className="text-sm font-medium">
                {isAr
                  ? 'أقر بأن البيانات أعلاه صحيحة وأن الشهادة سوف تصدر بهذه الصياغة بالضبط.'
                  : 'I confirm the details above are correct and the certificate will be issued with this exact wording.'}
              </span>
            </label>
          )}

          {!locked ? (
            <Button
              onClick={submit}
              disabled={saving || !displayName.trim()}
              className="w-full"
              size="lg"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 me-2" />
              )}
              {request.status === 'rejected'
                ? isAr
                  ? 'إعادة الإرسال وإصدار الشهادة'
                  : 'Resubmit & issue'
                : isAr
                  ? 'إصدار الشهادة'
                  : 'Issue my certificate'}
            </Button>
          ) : (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">
                {isAr
                  ? 'تم استلام بياناتك. ستجد شهادتك في "الشهادات الصادرة" بمجرد جاهزيتها.'
                  : 'Your details were received. You will find your certificate under "Issued certificates" once it is ready.'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-2 text-sm font-bold">
      <span>
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  )
}
