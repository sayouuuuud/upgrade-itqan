'use client'

import { CheckCircle2, Lock, Flag, Trophy, XCircle, Clock, ChevronLeft, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

export interface StudentStage {
  id: string
  order_index: number
  name: string
  description?: string | null
  advance_count?: number | null
  min_verses?: number | null
  status: string // locked | active | completed
}

export interface StudentStageEntry {
  stage_id: string | null
  status: string // pending | evaluated | qualified | eliminated | winner
  score?: number | null
  rank?: number | null
  submission_url?: string | null
}

/** Human label + token-based styling for the student's status within a stage. */
function statusBadge(status: string, isFinal: boolean, tr: (s: string) => string) {
  switch (status) {
    case 'qualified':
      return { label: tr('تأهّلت'), cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', Icon: CheckCircle2 }
    case 'winner':
      return { label: tr('فائز'), cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', Icon: Trophy }
    case 'eliminated':
      return { label: tr('لم تتأهّل'), cls: 'bg-muted text-muted-foreground', Icon: XCircle }
    case 'evaluated':
      return { label: isFinal ? tr('تم التقييم') : tr('بانتظار الترحيل'), cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', Icon: CheckCircle2 }
    case 'pending':
      return { label: tr('بانتظار التقييم'), cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400', Icon: Clock }
    default:
      return null
  }
}

/**
 * Student-facing round progress for a multi-stage competition. Renders a
 * timeline of stages, highlights the active round, shows the student's status
 * in each stage they participated in, and surfaces the active stage's
 * requirements (description + minimum verses).
 *
 * Returns null for single-stage competitions so classic contests are unchanged.
 */
export function StageProgress({
  stages,
  activeStage,
  entries,
}: {
  stages: StudentStage[]
  activeStage: StudentStage | null
  entries: StudentStageEntry[]
}) {
  const { t } = useI18n()
  const app = (t as any).app as Record<string, string> | undefined
  // Bilingual fallback: look up the Arabic literal in the 2026 dictionary
  // (English in en.ts), else render the Arabic literal as-is.
  const tr = (s: string) => (t as any).addedTranslations_2026?.[s] || s

  if (!stages || stages.length <= 1) return null

  const sorted = [...stages].sort((a, b) => a.order_index - b.order_index)
  const maxOrder = Math.max(...sorted.map((s) => s.order_index))
  const activeEntry = activeStage ? entries.find((e) => e.stage_id === activeStage.id) : null

  return (
    <section className="bg-card border border-border rounded-2xl p-5 space-y-4" aria-label={tr('مراحل المسابقة')}>
      <div className="flex items-center gap-2">
        <Flag className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold">{tr('مراحل المسابقة')}</h2>
      </div>

      {/* Timeline */}
      <ol className="flex flex-wrap items-center gap-2">
        {sorted.map((stage, i) => {
          const entry = entries.find((e) => e.stage_id === stage.id)
          const isActive = activeStage?.id === stage.id
          const isFinal = stage.order_index >= maxOrder
          const badge = entry ? statusBadge(entry.status, isFinal, tr) : null
          return (
            <li key={stage.id} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                  isActive && 'border-primary bg-primary/10 font-bold text-primary',
                  !isActive && stage.status === 'completed' && 'border-border bg-muted/50 text-muted-foreground',
                  !isActive && stage.status === 'locked' && 'border-border text-muted-foreground',
                )}
              >
                {stage.status === 'completed' && !isActive ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : stage.status === 'locked' ? (
                  <Lock className="w-4 h-4 shrink-0" />
                ) : isFinal ? (
                  <Trophy className="w-4 h-4 shrink-0" />
                ) : (
                  <Flag className="w-4 h-4 shrink-0" />
                )}
                <span>{stage.name}</span>
                {badge && (
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', badge.cls)}>
                    <badge.Icon className="w-3 h-3" />
                    {badge.label}
                  </span>
                )}
              </div>
              {i < sorted.length - 1 && <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />}
            </li>
          )
        })}
      </ol>

      {/* Active stage requirements */}
      {activeStage && (
        <div className="rounded-xl bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-bold text-foreground">
            {`${tr('المرحلة الحالية')}: `}
            {activeStage.name}
          </p>
          {activeStage.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{activeStage.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {activeStage.min_verses ? (
              <span className="inline-flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {`${tr('الحد الأدنى')}: ${activeStage.min_verses} ${tr('آيات')}`}
              </span>
            ) : null}
            {activeStage.advance_count != null ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {`${tr('يتأهّل أعلى')} ${activeStage.advance_count}`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Trophy className="w-3.5 h-3.5" />
                {tr('المرحلة النهائية')}
              </span>
            )}
          </div>
          {/* Student-specific call-out for the active stage. */}
          {activeEntry?.status === 'eliminated' && (
            <p className="text-sm font-bold text-muted-foreground">{tr('لم تتأهّل لهذه المرحلة، نتمنى لك التوفيق في المرات القادمة.')}</p>
          )}
        </div>
      )}
    </section>
  )
}
