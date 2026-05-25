'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

const RequestBaseCtx = createContext<string>('/academy/student/certificates/request')
function useRequestBase() {
  return useContext(RequestBaseCtx)
}
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Hourglass,
  Inbox,
  Loader2,
  Sparkles,
  User,
  XCircle,
} from 'lucide-react'

interface CertificateRequest {
  id: string
  kind: string
  status: string
  source_label: string | null
  template_name: string | null
  language: string
  rejection_reason: string | null
  requested_at: string
  submitted_at: string | null
  approved_at: string | null
  issued_at: string | null
  certificate_number: string | null
  pdf_url: string | null
  reason: string | null
  rank: number | null
  teacher_name?: string | null
  legacy?: boolean
}

interface CertificatesPayload {
  data_required: CertificateRequest[]
  submitted: CertificateRequest[]
  approved: CertificateRequest[]
  rejected: CertificateRequest[]
  issued: CertificateRequest[]
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

interface StudentCertificatesCenterProps {
  apiBase?: string
  requestBase?: string
  title_ar?: string
  title_en?: string
  subtitle_ar?: string
  subtitle_en?: string
}

export default function StudentCertificatesCenter({
  apiBase = '/api/academy/student/certificates',
  requestBase = '/academy/student/certificates/request',
  title_ar = 'شهاداتي',
  title_en = 'My Certificates',
  subtitle_ar = 'كل شهاداتك في مكان واحد — الصادرة، قيد المراجعة، والتي تنتظر إكمال بياناتها.',
  subtitle_en = 'All your certificates in one place — issued, pending review, and awaiting your data.',
}: StudentCertificatesCenterProps = {}) {
  const { locale } = useI18n()
  return (
    <RequestBaseCtx.Provider value={requestBase}>
      <CenterInner
        apiBase={apiBase}
        title_ar={title_ar}
        title_en={title_en}
        subtitle_ar={subtitle_ar}
        subtitle_en={subtitle_en}
      />
    </RequestBaseCtx.Provider>
  )
}

interface InnerProps {
  apiBase: string
  title_ar: string
  title_en: string
  subtitle_ar: string
  subtitle_en: string
}

function CenterInner({
  apiBase,
  title_ar,
  title_en,
  subtitle_ar,
  subtitle_en,
}: InnerProps) {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const [data, setData] = useState<CertificatesPayload>({
    data_required: [],
    submitted: [],
    approved: [],
    rejected: [],
    issued: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(apiBase)
      .then((r) => r.json())
      .then((d) => {
        setData({
          data_required: d.data_required || [],
          submitted: d.submitted || [],
          approved: d.approved || [],
          rejected: d.rejected || [],
          issued: d.issued || [],
        })
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const kindLabel = (k: string) =>
    isAr ? KIND_LABEL_AR[k] || k : KIND_LABEL_EN[k] || k

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div
      className="max-w-6xl mx-auto space-y-8 pb-12"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div id="data-required" className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <Award className="w-4 h-4" />
            {isAr ? title_ar : title_en}
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {isAr ? title_ar : title_en}
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl">
            {isAr ? subtitle_ar : subtitle_en}
          </p>
        </div>
      </div>

      {/* ─── Action required ───────────────────────────────────────── */}
      {data.data_required.length > 0 && (
        <Section
          title={isAr ? 'تحتاج إكمال بيانات' : 'Action required'}
          tone="amber"
          icon={Sparkles}
          count={data.data_required.length}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.data_required.map((r) => (
              <ActionCard
                key={r.id}
                request={r}
                kindLabel={kindLabel}
                isAr={isAr}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ─── In review ─────────────────────────────────────────────── */}
      {data.submitted.length + data.approved.length > 0 && (
        <Section
          title={isAr ? 'قيد المراجعة' : 'In review'}
          tone="blue"
          icon={Hourglass}
          count={data.submitted.length + data.approved.length}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...data.submitted, ...data.approved].map((r) => (
              <StatusCard
                key={r.id}
                request={r}
                kindLabel={kindLabel}
                isAr={isAr}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ─── Issued ────────────────────────────────────────────────── */}
      <Section
        title={isAr ? 'الشهادات الصادرة' : 'Issued certificates'}
        tone="emerald"
        icon={CheckCircle2}
        count={data.issued.length}
      >
        {data.issued.length === 0 ? (
          <Card className="border border-border/50 shadow-sm bg-card overflow-hidden rounded-3xl">
            <CardContent className="p-16 text-center space-y-6">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-12 h-12 text-primary/40" />
              </div>
              <h3 className="text-2xl font-black text-foreground">
                {isAr ? 'لا توجد شهادات حتى الآن' : 'No certificates yet'}
              </h3>
              <p className="text-muted-foreground font-medium leading-relaxed max-w-sm mx-auto">
                {isAr
                  ? 'أكمل الدورات والمسارات والمسابقات لتحصل على شهادات معتمدة.'
                  : 'Finish courses, paths, and competitions to earn approved certificates.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.issued.map((cert) => (
              <IssuedCard
                key={cert.id}
                cert={cert}
                kindLabel={kindLabel}
                isAr={isAr}
              />
            ))}
          </div>
        )}
      </Section>

      {/* ─── Rejected ─────────────────────────────────────────────── */}
      {data.rejected.length > 0 && (
        <Section
          title={isAr ? 'طلبات مرفوضة' : 'Rejected requests'}
          tone="rose"
          icon={XCircle}
          count={data.rejected.length}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.rejected.map((r) => (
              <StatusCard
                key={r.id}
                request={r}
                kindLabel={kindLabel}
                isAr={isAr}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

type Tone = 'amber' | 'blue' | 'emerald' | 'rose'

const TONE_CLASSES: Record<Tone, { dot: string; text: string; bg: string }> = {
  amber: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  blue: { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
  emerald: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  rose: { dot: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
}

function Section({
  title,
  tone,
  icon: Icon,
  count,
  children,
}: {
  title: string
  tone: Tone
  icon: React.ElementType
  count: number
  children: React.ReactNode
}) {
  const cls = TONE_CLASSES[tone]
  return (
    <section className="space-y-4">
      <header className="flex items-center gap-3">
        <span
          className={`w-9 h-9 rounded-2xl flex items-center justify-center ${cls.bg} ${cls.text}`}
        >
          <Icon className="w-4 h-4" />
        </span>
        <h2 className="text-xl font-black tracking-tight">{title}</h2>
        <span className="text-sm font-bold text-muted-foreground">
          ({count})
        </span>
      </header>
      {children}
    </section>
  )
}

function ActionCard({
  request,
  kindLabel,
  isAr,
}: {
  request: CertificateRequest
  kindLabel: (k: string) => string
  isAr: boolean
}) {
  const requestBase = useRequestBase()
  return (
    <Card className="border-amber-200/60 bg-amber-50/40 hover:shadow-md transition rounded-3xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
              {kindLabel(request.kind)}
            </p>
            <h3 className="text-lg font-black truncate">
              {request.source_label ||
                (isAr ? 'شهادة جاهزة للإصدار' : 'New certificate ready')}
            </h3>
            {request.reason && (
              <p className="text-sm text-amber-800 mt-1">{request.reason}</p>
            )}
          </div>
        </div>
        <Link href={`${requestBase}/${request.id}`}>
          <Button className="w-full" variant="default">
            <FileText className="w-4 h-4 me-2" />
            {isAr ? 'إكمال بيانات الشهادة' : 'Complete certificate details'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function StatusCard({
  request,
  kindLabel,
  isAr,
}: {
  request: CertificateRequest
  kindLabel: (k: string) => string
  isAr: boolean
}) {
  const requestBase = useRequestBase()
  const statusLabel: Record<string, { ar: string; en: string; tone: Tone }> = {
    submitted: {
      ar: 'في انتظار اعتماد الإدارة',
      en: 'Pending admin approval',
      tone: 'blue',
    },
    approved: {
      ar: 'تم الاعتماد — قيد الإصدار',
      en: 'Approved — issuing',
      tone: 'blue',
    },
    rejected: {
      ar: 'مرفوض',
      en: 'Rejected',
      tone: 'rose',
    },
  }
  const s = statusLabel[request.status] || statusLabel.submitted
  const tone = TONE_CLASSES[s.tone]
  return (
    <Card className="rounded-3xl hover:shadow-md transition">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <span
            className={`w-10 h-10 rounded-2xl ${tone.bg} ${tone.text} flex items-center justify-center shrink-0`}
          >
            <Clock className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold uppercase tracking-wide ${tone.text}`}>
              {kindLabel(request.kind)}
            </p>
            <h3 className="text-lg font-black truncate">
              {request.source_label || (isAr ? 'شهادة' : 'Certificate')}
            </h3>
            <p className={`text-sm mt-1 ${tone.text}`}>
              {isAr ? s.ar : s.en}
            </p>
          </div>
        </div>
        {request.rejection_reason && (
          <p className="text-xs text-rose-600 bg-rose-50 rounded-xl p-3">
            {isAr ? 'سبب الرفض: ' : 'Reason: '}
            {request.rejection_reason}
          </p>
        )}
        {request.status === 'rejected' && (
          <Link href={`${requestBase}/${request.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              {isAr ? 'إعادة الإرسال' : 'Resubmit'}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

function IssuedCard({
  cert,
  kindLabel,
  isAr,
}: {
  cert: CertificateRequest
  kindLabel: (k: string) => string
  isAr: boolean
}) {
  const date = cert.issued_at || cert.approved_at || cert.requested_at
  return (
    <Card className="group border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 bg-card overflow-hidden rounded-3xl relative">
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10">
        <Award className="w-32 h-32 text-primary -rotate-12 translate-x-8 -translate-y-8" />
      </div>
      <CardContent className="p-0">
        <div className="p-6 pb-0 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-muted-foreground uppercase">
                {kindLabel(cert.kind)}
              </p>
              <h3 className="text-lg font-bold truncate">
                {cert.source_label || (isAr ? 'شهادة معتمدة' : 'Certificate')}
              </h3>
            </div>
          </div>
          <div className="space-y-2 pt-4 border-t border-border/50">
            {cert.teacher_name && (
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                <User className="w-4 h-4 text-primary/70 shrink-0" />
                <span>
                  {isAr ? 'الأستاذ: ' : 'Teacher: '}
                  {cert.teacher_name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary/70 shrink-0" />
              <span dir="ltr">
                {new Date(date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              </span>
            </div>
            {cert.certificate_number && (
              <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground/80">
                <span>{cert.certificate_number}</span>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 pb-6 pt-4">
          {cert.pdf_url ? (
            <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer">
              <Button variant="default" className="w-full">
                <Download className="w-4 h-4 me-2" />
                {isAr ? 'تحميل الشهادة' : 'Download'}
              </Button>
            </a>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              <Inbox className="w-4 h-4 me-2" />
              {isAr ? 'لا يوجد ملف بعد' : 'No file yet'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
