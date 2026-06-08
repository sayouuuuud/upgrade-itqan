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
  XCircle,
} from 'lucide-react'
import { CertRequest } from './types'
import { motion } from 'framer-motion'

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      initial="hidden" 
      animate="show" 
      variants={containerVariants}
      className="max-w-3xl mx-auto space-y-8 pb-12" 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <motion.div variants={itemVariants}>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted px-4 py-2 rounded-xl transition-all w-fit"
        >
          <Arrow className="w-4 h-4" />
          {isAr ? 'العودة لمركز الشهادات' : 'Back to certificates centre'}
        </Link>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-amber-50 to-orange-50/30 shadow-sm ring-1 ring-amber-500/10">
          <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <CardContent className="p-8 relative z-10 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 ring-1 ring-white/20">
                {request.kind === 'competition' ? (
                  <Trophy className="w-8 h-8" />
                ) : (
                  <Award className="w-8 h-8" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-xs font-black text-amber-700/80 uppercase tracking-widest">
                  {kindLabel}
                </p>
                <h1 className="text-3xl font-black tracking-tight text-amber-950 text-balance leading-tight">
                  {request.source_label || (isAr ? 'شهادة جاهزة للإصدار' : 'New certificate')}
                </h1>
                {request.reason && (
                  <p className="text-base font-medium text-amber-800/80 text-pretty pt-1 leading-relaxed max-w-xl">{request.reason}</p>
                )}
              </div>
            </div>
            
            {request.teacher_name && (
              <div className="flex items-center gap-3 text-sm font-bold text-amber-900/60 mt-6 pt-5 border-t border-amber-200/50">
                <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-amber-700" />
                </span>
                <span>
                  {isAr ? 'الأستاذ: ' : 'Teacher: '}
                  <span className="text-amber-950 ml-1">{request.teacher_name}</span>
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="rounded-3xl border border-border/50 shadow-sm overflow-hidden bg-card">
          <CardContent className="p-8 space-y-8">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-100/50 flex items-center justify-center shrink-0 ring-1 ring-amber-200">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </span>
              <div>
                <h2 className="text-xl font-black text-foreground text-balance tracking-tight">
                  {isAr ? 'بياناتك على الشهادة' : 'Your details on the certificate'}
                </h2>
                <p className="text-sm font-medium text-muted-foreground text-pretty mt-1">
                  {isAr
                    ? 'اكتب اسمك كما تريده أن يظهر على الشهادة بالضبط. سيقوم المدرس بمراجعتها لاحقاً.'
                    : 'Type your name exactly as you want it. Your teacher will review it.'}
                </p>
              </div>
            </div>

            {request.rejection_reason && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-sm font-medium rounded-2xl bg-rose-50/50 ring-1 ring-inset ring-rose-200/50 p-5 space-y-2"
              >
                <div className="flex items-center gap-2 text-rose-700 font-bold">
                  <XCircle className="w-4 h-4" />
                  <p>{isAr ? 'تم رفض الطلب السابق' : 'Previous request rejected'}</p>
                </div>
                <p className="text-rose-800 text-pretty leading-relaxed pl-6">{request.rejection_reason}</p>
              </motion.div>
            )}

            <div className="space-y-6">
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
                  className="w-full rounded-2xl border border-transparent bg-muted/50 px-5 py-4 text-base font-medium outline-none focus:bg-background focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 hover:bg-muted/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="w-full rounded-2xl border border-transparent bg-muted/50 px-5 py-4 text-base font-medium outline-none focus:bg-background focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 hover:bg-muted/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="w-full rounded-2xl border border-transparent bg-muted/50 px-5 py-4 text-base font-medium outline-none focus:bg-background focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 hover:bg-muted/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed tabular-nums"
                  dir="ltr"
                />
              </Field>

              <Field label={isAr ? 'ملاحظات إضافية' : 'Additional notes'}>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={locked}
                  placeholder={
                    isAr
                      ? 'أي ملاحظات تريد إضافتها على الطلب للإدارة أو المعلم'
                      : 'Any extra notes to share with the admin or teacher'
                  }
                  className="w-full rounded-2xl border border-transparent bg-muted/50 px-5 py-4 text-base font-medium outline-none focus:bg-background focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 hover:bg-muted/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
              </Field>
            </div>

            {!locked && (
              <label className="flex items-start gap-4 rounded-2xl border border-amber-200/60 bg-amber-50/40 p-5 cursor-pointer hover:bg-amber-50 transition-colors group">
                <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={confirmAccurate}
                    onChange={(e) => setConfirmAccurate(e.target.checked)}
                    className="peer h-5 w-5 appearance-none rounded-md border-2 border-amber-300 bg-white checked:border-amber-600 checked:bg-amber-600 outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 transition-all cursor-pointer"
                  />
                  <CheckCircle2 className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={3} />
                </div>
                <span className="text-sm font-bold text-amber-900/90 text-pretty leading-relaxed select-none group-hover:text-amber-950 transition-colors">
                  {isAr
                    ? 'أقر بأن البيانات أعلاه صحيحة وأن الشهادة سوف تصدر بهذه الصياغة بالضبط ولا يمكن تعديلها لاحقاً.'
                    : 'I confirm the details above are correct and the certificate will be issued with this exact wording.'}
                </span>
              </label>
            )}

            {!locked ? (
              <Button
                onClick={submit}
                disabled={saving || !displayName.trim() || !confirmAccurate}
                className="w-full h-14 text-base font-bold active:scale-[0.96] rounded-2xl transition-all shadow-sm hover:shadow-md disabled:hover:shadow-sm"
                size="lg"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 me-2 animate-spin" />
                ) : (
                  <Save className="w-5 h-5 me-2" />
                )}
                {request.status === 'rejected'
                  ? isAr
                    ? 'إعادة إرسال الطلب للاعتماد'
                    : 'Resubmit for approval'
                  : isAr
                  ? 'إرسال الطلب للاعتماد النهائي'
                  : 'Submit for final approval'}
              </Button>
            ) : (
              <div className="rounded-2xl bg-emerald-50/50 ring-1 ring-inset ring-emerald-200/50 p-6 flex items-start gap-4">
                <span className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </span>
                <div className="space-y-1 pt-0.5">
                  <p className="font-bold text-emerald-900">
                    {isAr ? 'تم استلام طلبك بنجاح!' : 'Request received successfully!'}
                  </p>
                  <p className="text-sm font-medium text-emerald-800/80 text-pretty leading-relaxed">
                    {isAr
                      ? 'الطلب الآن بانتظار اعتماد المدرّس المسؤول أو الإدارة. ستجد شهادتك في قسم "الشهادات الصادرة" بمجرد اعتمادها.'
                      : 'Request is awaiting approval from the course teacher or an admin. You will find your certificate under "Issued certificates" once approved.'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
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
    <label className="block space-y-3">
      <div className="flex items-center gap-1.5 px-1">
        <span className="text-sm font-bold text-foreground">
          {label}
        </span>
        {required && <span className="text-rose-500 font-black">*</span>}
      </div>
      {children}
    </label>
  )
}
