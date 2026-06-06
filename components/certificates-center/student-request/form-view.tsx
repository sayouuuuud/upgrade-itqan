import Link from 'next/link'
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
} from 'lucide-react'
import { CertRequest } from './types'

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

interface FormViewProps {
  request: CertRequest
  isAr: boolean
  backHref: string
  displayName: string
  setDisplayName: (v: string) => void
  arabicName: string
  setArabicName: (v: string) => void
  phone: string
  setPhone: (v: string) => void
  notes: string
  setNotes: (v: string) => void
  confirmAccurate: boolean
  setConfirmAccurate: (v: boolean) => void
  submit: () => void
  saving: boolean
}

export function FormView({
  request,
  isAr,
  backHref,
  displayName,
  setDisplayName,
  arabicName,
  setArabicName,
  phone,
  setPhone,
  notes,
  setNotes,
  confirmAccurate,
  setConfirmAccurate,
  submit,
  saving,
}: FormViewProps) {
  const kindLabel = isAr
    ? KIND_LABEL_AR[request.kind] || request.kind
    : KIND_LABEL_EN[request.kind] || request.kind

  const Arrow = isAr ? ArrowRight : ArrowLeft
  const locked = !['data_required', 'rejected', 'submitted'].includes(request.status)

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Arrow className="w-4 h-4" />
        {isAr ? 'العودة لمركز الشهادات' : 'Back to certificates centre'}
      </Link>

      <Card className="rounded-2xl border-amber-200/50 bg-gradient-to-br from-amber-50/60 to-background">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
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
              <h1 className="text-2xl font-black tracking-tight text-balance">
                {request.source_label || (isAr ? 'شهادة جاهزة للإصدار' : 'New certificate')}
              </h1>
              {request.reason && (
                <p className="text-sm text-amber-800 mt-1 text-pretty">{request.reason}</p>
              )}
            </div>
          </div>
          {request.teacher_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 pt-4 border-t border-amber-100">
              <User className="w-4 h-4" />
              {isAr ? 'الأستاذ: ' : 'Teacher: '}
              {request.teacher_name}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-black text-balance">
              {isAr ? 'بياناتك على الشهادة' : 'Your details on the certificate'}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground text-pretty">
            {isAr
              ? 'اكتب اسمك كما تريده أن يظهر على الشهادة بالضبط. بعد الإرسال يراجع طلبك المدرّس المسؤول عن الدورة أو الإدارة، ثم تُصدر شهادتك.'
              : 'Type your name exactly as you want it on the certificate. After you submit, the course teacher or an admin reviews your request, then your certificate is issued.'}
          </p>

          {request.rejection_reason && (
            <div className="text-sm rounded-xl bg-rose-50 border border-rose-200 p-4 space-y-1">
              <p className="font-bold text-rose-700">
                {isAr ? 'تم رفض الطلب السابق' : 'Previous request rejected'}
              </p>
              <p className="text-rose-800 text-pretty">{request.rejection_reason}</p>
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
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-amber-500 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-amber-500 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              dir="rtl"
            />
          </Field>

          <Field label={isAr ? 'رقم الهاتف للتواصل' : 'Contact phone'}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={locked}
              placeholder={isAr ? 'اختياري — للتواصل عند الحاجة' : 'Optional'}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-amber-500 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed tabular-nums"
              dir="ltr"
            />
          </Field>

          <Field label={isAr ? 'ملاحظات إضافية للإدارة' : 'Notes for the admin'}>
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
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </Field>

          {!locked && (
            <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 cursor-pointer hover:bg-amber-50 transition-colors">
              <input
                type="checkbox"
                checked={confirmAccurate}
                onChange={(e) => setConfirmAccurate(e.target.checked)}
                className="mt-1 h-4 w-4 accent-amber-600 rounded"
              />
              <span className="text-sm font-medium text-pretty">
                {isAr
                  ? 'أقر بأن البيانات أعلاه صحيحة وأن الشهادة سوف تصدر بهذه الصياغة بالضبط.'
                  : 'I confirm the details above are correct and the certificate will be issued with this exact wording.'}
              </span>
            </label>
          )}

          {!locked ? (
            <Button
              onClick={submit}
              disabled={saving || !displayName.trim() || !confirmAccurate}
              className="w-full active:scale-[0.96] rounded-xl transition-transform"
              size="lg"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 me-2" />
              )}
              {request.status === 'rejected'
                ? isAr
                  ? 'إعادة الإرسال للاعتماد'
                  : 'Resubmit for approval'
                : isAr
                ? 'إرسال الطلب للاعتماد'
                : 'Submit for approval'}
            </Button>
          ) : (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-sm font-medium text-emerald-800 text-pretty">
                {isAr
                  ? 'تم استلام بياناتك وطلبك الآن بانتظار اعتماد المدرّس المسؤول أو الإدارة. ستجد شهادتك في "الشهادات الصادرة" بمجرد اعتمادها.'
                  : 'Your details were received and your request is now awaiting approval from the course teacher or an admin. You will find your certificate under "Issued certificates" once it is approved.'}
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
