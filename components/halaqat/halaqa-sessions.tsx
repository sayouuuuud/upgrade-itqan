"use client"

import { useCallback, useEffect, useState } from 'react'
import {
  Plus,
  Loader2,
  CalendarClock,
  BookOpen,
  Radio,
  CheckCircle2,
  ClipboardCheck,
  X,
  Trash2,
  Pencil,
  Users,
} from 'lucide-react'
import { SURAHS } from '@/lib/quran-data'
import { useI18n } from '@/lib/i18n/context'

interface SessionRow {
  id: string
  title: string
  description: string | null
  agenda: string | null
  surah_name: string | null
  surah_number: number | null
  ayah_from: number | null
  ayah_to: number | null
  juz_number: number | null
  wird_note: string | null
  scheduled_at: string | null
  duration_minutes: number | null
  status: 'scheduled' | 'live' | 'ended' | 'cancelled'
  recording_url: string | null
  present_count: number
  evaluation_count: number
}

interface RosterRow {
  student_id: string
  student_name: string
  student_email: string
  avatar_url: string | null
  attendance_status: string | null
  memorization_score: number | null
  tajweed_score: number | null
  fluency_score: number | null
  verdict: string | null
  strengths: string | null
  notes: string | null
  next_surah_name: string | null
  next_surah_number: number | null
  next_ayah_from: number | null
  next_ayah_to: number | null
  next_wird_note: string | null
}

const STATUS_LABELS_STATIC: Record<string, { ar: string; en: string; cls: string }> = {
  scheduled: { ar: 'مجدولة', en: 'Scheduled', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
  live: { ar: 'مباشرة', en: 'Live', cls: 'bg-red-500 text-white' },
  ended: { ar: 'منتهية', en: 'Ended', cls: 'bg-secondary text-muted-foreground' },
  cancelled: { ar: 'ملغاة', en: 'Cancelled', cls: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400' },
}

const VERDICT_LABELS_STATIC: Record<string, { ar: string; en: string }> = {
  excellent: { ar: 'ممتاز', en: 'Excellent' },
  passed: { ar: 'اجتاز', en: 'Passed' },
  needs_work: { ar: 'يحتاج مراجعة', en: 'Needs work' },
  repeat: { ar: 'إعادة', en: 'Repeat' },
}

function fmtDate(iso: string | null, unspecifiedLabel = 'N/A') {
  if (!iso) return unspecifiedLabel
  return new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

export function HalaqaSessions({ halaqaId, canManage }: { halaqaId: string; canManage: boolean }) {
  const { t } = useI18n()
  const app = (t as any).app as Record<string, string> | undefined
  const th = (t as any).halaqat as Record<string, string> | undefined

  const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
    scheduled: { label: th?.statusScheduled ?? 'مجدولة', cls: STATUS_LABELS_STATIC.scheduled.cls },
    live: { label: th?.statusLive ?? 'مباشرة', cls: STATUS_LABELS_STATIC.live.cls },
    ended: { label: th?.statusEnded ?? 'منتهية', cls: STATUS_LABELS_STATIC.ended.cls },
    cancelled: { label: th?.statusCancelled ?? 'ملغاة', cls: STATUS_LABELS_STATIC.cancelled.cls },
  }

  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<SessionRow | null>(null)
  const [rosterSession, setRosterSession] = useState<SessionRow | null>(null)
  const [myEvalSession, setMyEvalSession] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/halaqat/${halaqaId}/sessions`)
      if (r.ok) {
        const json = await r.json()
        setSessions(json.sessions || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [halaqaId])

  useEffect(() => {
    load()
  }, [load])

  async function deleteSession(id: string) {
    if (!confirm(th?.deleteSessionConfirm ?? 'حذف هذه الجلسة وكل تقييماتها؟')) return
    const r = await fetch(`/api/halaqat/${halaqaId}/sessions/${id}`, { method: 'DELETE' })
    if (r.ok) load()
  }

  async function setStatus(id: string, status: string) {
    const r = await fetch(`/api/halaqat/${halaqaId}/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (r.ok) load()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{sessions.length} {th?.sessions ?? 'جلسة'}</p>
          <button
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> {th?.newSession ?? 'جلسة جديدة'}
          </button>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground">
          {th?.noSessions ?? 'لا توجد جلسات مجدولة بعد'}
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map((s) => {
            const st = STATUS_LABELS[s.status] || STATUS_LABELS.scheduled
            return (
              <div key={s.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold truncate">{s.title}</h4>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="w-3.5 h-3.5" /> {fmtDate(s.scheduled_at)}
                      </span>
                      {s.surah_name && (
                        <span className="inline-flex items-center gap-1 bg-secondary/60 px-2 py-0.5 rounded-full">
                          <BookOpen className="w-3.5 h-3.5" /> {s.surah_name}
                          {s.ayah_from ? ` (${s.ayah_from}${s.ayah_to ? `-${s.ayah_to}` : ''})` : ''}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {s.present_count} {th?.attendance ?? 'حضور'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ClipboardCheck className="w-3.5 h-3.5" /> {s.evaluation_count} {th?.evaluation ?? 'تقييم'}
                      </span>
                    </div>
                    {s.wird_note && <p className="text-xs text-muted-foreground mt-2">{s.wird_note}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/60">
                  {!canManage && (
                    <button
                      onClick={() => setMyEvalSession(myEvalSession === s.id ? null : s.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      {myEvalSession === s.id
                        ? (th?.hideEval ?? 'إخفاء تقييمي')
                        : (th?.showEval ?? 'تقييمي وورد المتابعة')}
                    </button>
                  )}
                  {canManage && (
                    <>
                      <button
                        onClick={() => setRosterSession(s)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" /> {th?.attendanceEval ?? 'التقييم والحضور'}
                      </button>
                      {s.status === 'scheduled' && (
                        <button
                          onClick={() => setStatus(s.id, 'live')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold"
                        >
                          <Radio className="w-3.5 h-3.5" /> {th?.startSession ?? 'بدء'}
                        </button>
                      )}
                      {s.status === 'live' && (
                        <button
                          onClick={() => setStatus(s.id, 'ended')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background rounded-lg text-xs font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> {th?.endSession ?? 'إنهاء'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditing(s)
                          setShowForm(true)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/70 rounded-lg text-xs font-bold"
                      >
                        <Pencil className="w-3.5 h-3.5" /> {th?.editSession ?? 'تعديل'}
                      </button>
                      <button
                        onClick={() => deleteSession(s.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-xs font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {th?.deleteSession ?? 'حذف'}
                      </button>
                    </>
                  )}
                </div>
                {!canManage && myEvalSession === s.id && (
                  <StudentSessionDetail halaqaId={halaqaId} sessionId={s.id} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <SessionForm
          halaqaId={halaqaId}
          session={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      )}

      {rosterSession && (
        <RosterModal
          halaqaId={halaqaId}
          session={rosterSession}
          onClose={() => {
            setRosterSession(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function SessionForm({
  halaqaId,
  session,
  onClose,
  onSaved,
}: {
  halaqaId: string
  session: SessionRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const th = (t as any).halaqat as Record<string, string> | undefined
  const [title, setTitle] = useState(session?.title || '')
  const [scheduledAt, setScheduledAt] = useState(
    session?.scheduled_at ? new Date(session.scheduled_at).toISOString().slice(0, 16) : ''
  )
  const [duration, setDuration] = useState(session?.duration_minutes || 60)
  const [surahNumber, setSurahNumber] = useState<number | ''>(session?.surah_number || '')
  const [ayahFrom, setAyahFrom] = useState<number | ''>(session?.ayah_from || '')
  const [ayahTo, setAyahTo] = useState<number | ''>(session?.ayah_to || '')
  const [wirdNote, setWirdNote] = useState(session?.wird_note || '')
  const [agenda, setAgenda] = useState(session?.agenda || '')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!title.trim()) {
      alert(th?.fieldTitleRequired ?? th?.titleRequired ?? 'Session title is required')
      return
    }
    setSaving(true)
    const surah = surahNumber ? SURAHS.find((s) => s.number === Number(surahNumber)) : null
    const payload = {
      title: title.trim(),
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      duration_minutes: Number(duration) || 60,
      surah_number: surahNumber || null,
      surah_name: surah?.name || null,
      ayah_from: ayahFrom || null,
      ayah_to: ayahTo || null,
      wird_note: wirdNote || null,
      agenda: agenda || null,
    }
    const url = session
      ? `/api/halaqat/${halaqaId}/sessions/${session.id}`
      : `/api/halaqat/${halaqaId}/sessions`
    const r = await fetch(url, {
      method: session ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (r.ok) onSaved()
    else {
      const err = await r.json().catch(() => ({}))
      alert(err.error || th?.sessionSaveFail || th?.saveFailed || 'Failed to save session')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-lg">{session ? (th?.formEditTitle ?? th?.editSession ?? 'Edit Session') : (th?.formNewTitle ?? th?.newSession ?? 'New Session')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label={th?.fieldTitle ?? 'Session Title'}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              placeholder={th?.fieldTitlePlaceholder ?? 'e.g. Weekly session - Al-Baqarah'}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={th?.fieldDate ?? th?.scheduledAt ?? 'Scheduled At'}>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </Field>
            <Field label={th?.fieldDuration ?? th?.durationMinutes ?? 'Duration (min)'}>
              <input
                type="number"
                min={5}
                max={360}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </Field>
          </div>
          <Field label={'الورد (السورة)'}>
            <select
              value={surahNumber}
              onChange={(e) => setSurahNumber(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="">{th?.fieldNoSurah ?? '— None —'}</option>
              {SURAHS.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={th?.fieldFromAyah ?? th?.ayahFrom ?? 'From Ayah'}>
              <input
                type="number"
                min={1}
                value={ayahFrom}
                onChange={(e) => setAyahFrom(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </Field>
            <Field label={th?.fieldToAyah ?? th?.ayahTo ?? 'To Ayah'}>
              <input
                type="number"
                min={1}
                value={ayahTo}
                onChange={(e) => setAyahTo(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </Field>
          </div>
          <Field label={th?.fieldWirdNote ?? th?.wirdFollowUp ?? 'Wird Note'}>
            <input
              value={wirdNote}
              onChange={(e) => setWirdNote(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              placeholder={th?.fieldWirdPlaceholder ?? 'e.g. Memorization + previous page review'}
            />
          </Field>
          <Field label={th?.fieldAgenda ?? 'Agenda / Details'}>
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
            />
          </Field>
        </div>
        <div className="p-5 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg font-bold text-muted-foreground hover:bg-muted">
            {th?.cancelBtn ?? th?.cancel ?? 'Cancel'}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {th?.saveBtn ?? th?.save ?? 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RosterModal({
  halaqaId,
  session,
  onClose,
}: {
  halaqaId: string
  session: SessionRow
  onClose: () => void
}) {
  const { t } = useI18n()
  const th = (t as any).halaqat as Record<string, string> | undefined

  const verdictLabels: Record<string, string> = {
    excellent: th?.verdictExcellent ?? VERDICT_LABELS_STATIC.excellent.ar,
    passed: th?.verdictPassed ?? VERDICT_LABELS_STATIC.passed.ar,
    needs_work: th?.verdictNeedsWork ?? VERDICT_LABELS_STATIC.needs_work.ar,
    repeat: th?.verdictRepeat ?? VERDICT_LABELS_STATIC.repeat.ar,
  }

  const [roster, setRoster] = useState<RosterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStudent, setActiveStudent] = useState<string | null>(null)

  const load = useCallback(async () => {
    const r = await fetch(`/api/halaqat/${halaqaId}/sessions/${session.id}`)
    if (r.ok) {
      const json = await r.json()
      setRoster(json.roster || [])
    }
    setLoading(false)
  }, [halaqaId, session.id])

  useEffect(() => {
    load()
  }, [load])

  async function setAttendance(studentId: string, status: string) {
    await fetch(`/api/halaqat/${halaqaId}/sessions/${session.id}/roster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, attendance_status: status }),
    })
    load()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-bold text-lg">{th?.attendanceEval ?? 'التقييم والحضور'}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{session.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : roster.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {th?.noStudents ?? 'لا يوجد طلاب في الحلقة'}
            </p>
          ) : (
            roster.map((r) => (
              <div key={r.student_id} className="bg-secondary/30 border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center shrink-0">
                    <span className="font-bold text-sm">{r.student_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate text-sm">{r.student_name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {(['present', 'late', 'absent', 'excused'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setAttendance(r.student_id, st)}
                          className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                            r.attendance_status === st
                              ? st === 'present'
                                ? 'bg-emerald-600 text-white'
                                : st === 'absent'
                                  ? 'bg-rose-600 text-white'
                                  : st === 'late'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-blue-600 text-white'
                              : 'bg-background text-muted-foreground hover:bg-secondary'
                          }`}
                        >
                          {st === 'present'
                            ? (th?.attendPresent ?? 'حاضر')
                            : st === 'absent'
                              ? (th?.attendAbsent ?? 'غائب')
                              : st === 'late'
                                ? (th?.attendLate ?? 'متأخر')
                                : (th?.attendExcused ?? 'بعذر')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.verdict && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                        {verdictLabels[r.verdict] ?? r.verdict}
                      </span>
                    )}
                    <button
                      onClick={() => setActiveStudent(activeStudent === r.student_id ? null : r.student_id)}
                      className="text-xs font-bold text-emerald-600 hover:underline"
                    >
                      {r.verdict || r.notes
                        ? (th?.editEval ?? 'تعديل التقييم')
                        : (th?.evaluation ?? 'تقييم')}
                    </button>
                  </div>
                </div>
                {activeStudent === r.student_id && (
                  <EvaluationForm
                    halaqaId={halaqaId}
                    sessionId={session.id}
                    row={r}
                    onSaved={() => {
                      setActiveStudent(null)
                      load()
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function EvaluationForm({
  halaqaId,
  sessionId,
  row,
  onSaved,
}: {
  halaqaId: string
  sessionId: string
  row: RosterRow
  onSaved: () => void
}) {
  const { t } = useI18n()
  const th = (t as any).halaqat as Record<string, string> | undefined

  const verdictLabels: Record<string, string> = {
    excellent: th?.verdictExcellent ?? VERDICT_LABELS_STATIC.excellent.ar,
    passed: th?.verdictPassed ?? VERDICT_LABELS_STATIC.passed.ar,
    needs_work: th?.verdictNeedsWork ?? VERDICT_LABELS_STATIC.needs_work.ar,
    repeat: th?.verdictRepeat ?? VERDICT_LABELS_STATIC.repeat.ar,
  }

  const [mem, setMem] = useState<number | ''>(row.memorization_score ?? '')
  const [taj, setTaj] = useState<number | ''>(row.tajweed_score ?? '')
  const [flu, setFlu] = useState<number | ''>(row.fluency_score ?? '')
  const [verdict, setVerdict] = useState(row.verdict || '')
  const [notes, setNotes] = useState(row.notes || '')
  const [nextSurah, setNextSurah] = useState<number | ''>(row.next_surah_number ?? '')
  const [nextFrom, setNextFrom] = useState<number | ''>(row.next_ayah_from ?? '')
  const [nextTo, setNextTo] = useState<number | ''>(row.next_ayah_to ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const surah = nextSurah ? SURAHS.find((s) => s.number === Number(nextSurah)) : null
    const r = await fetch(`/api/halaqat/${halaqaId}/sessions/${sessionId}/roster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: row.student_id,
        evaluation: {
          memorization_score: mem === '' ? null : mem,
          tajweed_score: taj === '' ? null : taj,
          fluency_score: flu === '' ? null : flu,
          verdict: verdict || null,
          notes: notes || null,
          next_surah_number: nextSurah || null,
          next_surah_name: surah?.name || null,
          next_ayah_from: nextFrom || null,
          next_ayah_to: nextTo || null,
        },
      }),
    })
    setSaving(false)
    if (r.ok) onSaved()
  }

  return (
    <div className="border-t border-border bg-background/60 p-3 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <ScoreInput label={th?.scoreMemorization ?? 'الحفظ'} value={mem} onChange={(v) => setMem(v)} />
        <ScoreInput label={th?.scoreTajweed ?? 'التجويد'} value={taj} onChange={(v) => setTaj(v)} />
        <ScoreInput label={th?.scoreFluency ?? 'الطلاقة'} value={flu} onChange={(v) => setFlu(v)} />
      </div>
      <div>
        <label className="text-xs font-bold text-muted-foreground">{th?.verdict ?? 'التقدير'}</label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {(Object.entries(verdictLabels) as [string, string][]).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setVerdict(verdict === k ? '' : k)}
              className={`text-xs px-2.5 py-1 rounded-full font-bold transition-colors ${
                verdict === k ? 'bg-emerald-600 text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/70'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-muted-foreground">{th?.notes ?? 'ملاحظات'}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-3 sm:col-span-1">
          <label className="text-xs font-bold text-muted-foreground">{th?.nextWird ?? 'الورد القادم'}</label>
          <select
            value={nextSurah}
            onChange={(e) => setNextSurah(e.target.value ? Number(e.target.value) : '')}
            className="w-full mt-1 px-2 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="">{'— سورة —'}</option>
            {SURAHS.map((s) => (
              <option key={s.number} value={s.number}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground">{th?.ayahFrom ?? 'من'}</label>
          <input
            type="number"
            min={1}
            value={nextFrom}
            onChange={(e) => setNextFrom(e.target.value ? Number(e.target.value) : '')}
            className="w-full mt-1 px-2 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground">{th?.ayahTo ?? 'إلى'}</label>
          <input
            type="number"
            min={1}
            value={nextTo}
            onChange={(e) => setNextTo(e.target.value ? Number(e.target.value) : '')}
            className="w-full mt-1 px-2 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {th?.saveEvaluation ?? 'حفظ التقييم'}

        </button>
      </div>
    </div>
  )
}

function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | ''
  onChange: (v: number | '') => void
}) {
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground">{label} (/10)</label>
      <input
        type="number"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
        className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground block mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function StudentSessionDetail({ halaqaId, sessionId }: { halaqaId: string; sessionId: string }) {
  const { t } = useI18n()
  const th = (t as any).halaqat as Record<string, string> | undefined

  const verdictLabels: Record<string, string> = {
    excellent: th?.verdictExcellent ?? VERDICT_LABELS_STATIC.excellent.ar,
    passed: th?.verdictPassed ?? VERDICT_LABELS_STATIC.passed.ar,
    needs_work: th?.verdictNeedsWork ?? VERDICT_LABELS_STATIC.needs_work.ar,
    repeat: th?.verdictRepeat ?? VERDICT_LABELS_STATIC.repeat.ar,
  }

  const [row, setRow] = useState<RosterRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(`/api/halaqat/${halaqaId}/sessions/${sessionId}`)
        if (r.ok) {
          const json = await r.json()
          const mine = (json.roster || [])[0] || null
          if (!cancelled) {
            setRow(mine)
            setEmpty(!mine)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [halaqaId, sessionId])

  if (loading) {
    return (
      <div className="border-t border-border bg-background/60 p-4 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (empty || !row) {
    return (
      <div className="border-t border-border bg-background/60 p-4 text-center text-xs text-muted-foreground">
        {th?.noEvalYet ?? 'لم يتم تسجيل تقييم لهذه الجلسة بعد'}

      </div>
    )
  }

  const hasEval =
    row.memorization_score != null ||
    row.tajweed_score != null ||
    row.fluency_score != null ||
    row.verdict ||
    row.notes
  const hasNextWird = row.next_surah_name || row.next_wird_note

  return (
    <div className="border-t border-border bg-background/60 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">{th?.attendance ?? 'الحضور:'}</span>
        <span
          className={`font-bold px-2 py-0.5 rounded-full ${
            row.attendance_status === 'present'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
              : row.attendance_status === 'absent'
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                : 'bg-secondary text-muted-foreground'
          }`}
        >
          {row.attendance_status === 'present'
            ? (th?.attendPresent ?? 'حاضر')
            : row.attendance_status === 'absent'
              ? (th?.attendAbsent ?? 'غائب')
              : row.attendance_status === 'late'
                ? (th?.attendLate ?? 'متأخر')
                : row.attendance_status === 'excused'
                  ? (th?.attendExcused ?? 'بعذر')
                  : (th?.attendUnregistered ?? 'غير مسجل')}
        </span>
        {row.verdict && (
          <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
            {verdictLabels[row.verdict] ?? row.verdict}
          </span>
        )}
      </div>

      {hasEval && (
        <div className="grid grid-cols-3 gap-2">
          <ScorePill label={th?.scoreMemorization ?? 'الحفظ'} value={row.memorization_score} />
          <ScorePill label={th?.scoreTajweed ?? 'التجويد'} value={row.tajweed_score} />
          <ScorePill label={th?.scoreFluency ?? 'الطلاقة'} value={row.fluency_score} />
        </div>
      )}

      {row.notes && (
        <div className="text-xs">
          <span className="font-bold text-muted-foreground">{th?.teacherNotes ?? 'ملاحظات المعلم:'} </span>
          <span className="text-foreground">{row.notes}</span>
        </div>
      )}

      {hasNextWird && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-900/30 p-3">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> {th?.wirdFollowUp ?? 'ورد المتابعة'}
          </p>
          {row.next_surah_name && (
            <p className="text-sm font-bold">
              {row.next_surah_name}
              {row.next_ayah_from
                ? ` (${row.next_ayah_from}${row.next_ayah_to ? `-${row.next_ayah_to}` : ''})`
                : ''}
            </p>
          )}
          {row.next_wird_note && <p className="text-xs text-muted-foreground mt-1">{row.next_wird_note}</p>}
        </div>
      )}
    </div>
  )
}

function ScorePill({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg bg-secondary/40 border border-border p-2 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-extrabold text-lg">{value != null ? value : '—'}</p>
    </div>
  )
}
