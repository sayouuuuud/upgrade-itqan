'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Mail,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react'

interface TeacherRequest {
  id: string
  status: string
  kind: string
  language: string
  data: Record<string, string> | null
  source_label: string | null
  source_id: string | null
  rejection_reason: string | null
  certificate_number: string | null
  pdf_url: string | null
  requested_at: string
  submitted_at: string | null
  approved_at: string | null
  issued_at: string | null
  student_name: string | null
  student_email: string | null
  course_title: string | null
}

const API = '/api/academy/teacher/certificates'

const STATUS_TABS = [
  { key: 'submitted', ar: 'بانتظار الاعتماد', en: 'Awaiting approval' },
  { key: 'issued', ar: 'صادرة', en: 'Issued' },
  { key: 'rejected', ar: 'مرفوضة', en: 'Rejected' },
  { key: 'all', ar: 'الكل', en: 'All' },
] as const

export default function TeacherCertificatesCenter() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const [tab, setTab] = useState<string>('submitted')
  const [rows, setRows] = useState<TeacherRequest[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = (status: string) => {
    setLoading(true)
    fetch(`${API}/requests?status=${status}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.requests || [])
        setCounts(d.counts || {})
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const act = async (id: string, action: 'approve' | 'reject') => {
    let reason: string | null = null
    if (action === 'reject') {
      reason =
        window.prompt(
          isAr ? 'سبب الرفض (اختياري):' : 'Rejection reason (optional):',
        ) || ''
    }
    setBusyId(id)
    try {
      const res = await fetch(`${API}/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      const d = await res.json().catch(() => null)
      if (!res.ok) {
        alert(d?.error || (isAr ? 'فشل تنفيذ الإجراء' : 'Action failed'))
        return
      }
      load(tab)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          {isAr ? 'اعتماد الشهادات' : 'Certificate approvals'}
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          {isAr ? 'شهادات دوراتي' : 'My course certificates'}
        </h1>
        <p className="text-muted-foreground font-medium max-w-2xl">
          {isAr
            ? 'راجع بيانات الطلاب الذين أكملوا دوراتك واعتمد إصدار شهاداتهم.'
            : 'Review the data of students who finished your courses and approve issuing their certificates.'}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s.key}
            onClick={() => setTab(s.key)}
            className={`px-4 py-2 rounded-2xl text-sm font-bold transition border ${
              tab === s.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {isAr ? s.ar : s.en}
            {counts[s.key] != null && s.key !== 'all' && (
              <span className="ms-2 opacity-80">({counts[s.key]})</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="rounded-3xl border-border/60">
          <CardContent className="p-16 text-center space-y-4">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
              <Award className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-black">
              {isAr ? 'لا توجد طلبات هنا' : 'No requests here'}
            </h3>
            <p className="text-muted-foreground font-medium">
              {isAr
                ? 'ستظهر طلبات الطلاب بمجرد إكمالهم لبياناتهم.'
                : 'Student requests appear once they complete their data.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rows.map((r) => (
            <RequestCard
              key={r.id}
              r={r}
              isAr={isAr}
              busy={busyId === r.id}
              onApprove={() => act(r.id, 'approve')}
              onReject={() => act(r.id, 'reject')}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RequestCard({
  r,
  isAr,
  busy,
  onApprove,
  onReject,
}: {
  r: TeacherRequest
  isAr: boolean
  busy: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const data = r.data || {}
  const pending = r.status === 'submitted'
  const issued = r.status === 'issued'
  const rejected = r.status === 'rejected'

  const date = r.submitted_at || r.requested_at

  return (
    <Card className="rounded-3xl border-border/60 hover:shadow-md transition">
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-black truncate">
                {r.course_title || r.source_label || (isAr ? 'دورة' : 'Course')}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                <User className="w-4 h-4 shrink-0" />
                <span className="truncate">{r.student_name || '—'}</span>
              </div>
              {r.student_email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground/80 mt-0.5">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate" dir="ltr">
                    {r.student_email}
                  </span>
                </div>
              )}
            </div>
          </div>
          <StatusBadge status={r.status} isAr={isAr} />
        </div>

        {/* Student-submitted data */}
        <div className="rounded-2xl bg-muted/50 border border-border/50 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <DataRow
            label={isAr ? 'الاسم على الشهادة' : 'Name on certificate'}
            value={data.display_name}
            strong
          />
          <DataRow
            label={isAr ? 'الاسم بالعربية' : 'Arabic name'}
            value={data.arabic_name}
          />
          <DataRow
            label={isAr ? 'الهاتف' : 'Phone'}
            value={data.phone}
            ltr
          />
          <DataRow
            label={isAr ? 'تاريخ الطلب' : 'Requested'}
            value={new Date(date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
            ltr
          />
          {data.notes && (
            <div className="sm:col-span-2">
              <DataRow label={isAr ? 'ملاحظات' : 'Notes'} value={data.notes} />
            </div>
          )}
        </div>

        {rejected && r.rejection_reason && (
          <p className="text-xs text-rose-600 bg-rose-50 rounded-xl p-3">
            {isAr ? 'سبب الرفض: ' : 'Reason: '}
            {r.rejection_reason}
          </p>
        )}

        {/* Actions */}
        {pending && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={onApprove} disabled={busy} className="flex-1 min-w-[160px]">
              {busy ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <BadgeCheck className="w-4 h-4 me-2" />
              )}
              {isAr ? 'اعتماد وإصدار الشهادة' : 'Approve & issue'}
            </Button>
            <Button
              onClick={onReject}
              disabled={busy}
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <XCircle className="w-4 h-4 me-2" />
              {isAr ? 'رفض' : 'Reject'}
            </Button>
          </div>
        )}

        {issued && r.pdf_url && (
          <a href={r.pdf_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 me-2" />
              {isAr ? 'عرض الشهادة الصادرة' : 'View issued certificate'}
            </Button>
          </a>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status, isAr }: { status: string; isAr: boolean }) {
  const map: Record<
    string,
    { ar: string; en: string; cls: string; Icon: React.ElementType }
  > = {
    submitted: {
      ar: 'بانتظار الاعتماد',
      en: 'Awaiting approval',
      cls: 'bg-amber-50 text-amber-700 border-amber-200',
      Icon: Clock,
    },
    approved: {
      ar: 'تم الاعتماد',
      en: 'Approved',
      cls: 'bg-blue-50 text-blue-700 border-blue-200',
      Icon: CheckCircle2,
    },
    issued: {
      ar: 'صادرة',
      en: 'Issued',
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Icon: CheckCircle2,
    },
    rejected: {
      ar: 'مرفوضة',
      en: 'Rejected',
      cls: 'bg-rose-50 text-rose-700 border-rose-200',
      Icon: XCircle,
    },
    data_required: {
      ar: 'بانتظار بيانات الطالب',
      en: 'Awaiting student data',
      cls: 'bg-muted text-muted-foreground border-border',
      Icon: Clock,
    },
  }
  const s = map[status] || map.submitted
  const { Icon } = s
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${s.cls}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {isAr ? s.ar : s.en}
    </span>
  )
}

function DataRow({
  label,
  value,
  strong,
  ltr,
}: {
  label: string
  value?: string | null
  strong?: boolean
  ltr?: boolean
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p
        className={`${strong ? 'font-black text-foreground' : 'font-medium'} ${
          !value ? 'text-muted-foreground/60' : ''
        }`}
        dir={ltr ? 'ltr' : undefined}
      >
        {value || '—'}
      </p>
    </div>
  )
}
