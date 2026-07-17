'use client'

import { useEffect, useState } from 'react'
import { Gavel, Loader2, Plus, Search, Trash2, X, Mic, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

interface Judge {
  id: string
  judge_id: string
  name: string | null
  email: string | null
  role: string
}

interface Candidate {
  id: string
  name: string | null
  email: string | null
  role: string
}

interface Props {
  /** API base, e.g. "/api/admin/competitions" or "/api/academy/admin/competitions" */
  apiBase: string
  competition: { id: string; title: string }
  accent?: 'primary' | 'emerald'
  onClose: () => void
}

function RoleBadge({ role, jm }: { role: string; jm?: Record<string, string> }) {
  const isTeacher = role === 'teacher'
  const roleLabel: Record<string, string> = {
    teacher: jm?.roleTeacher ?? 'Teacher',
    reader: jm?.roleReader ?? 'Reader',
    student_supervisor: jm?.roleStudentSupervisor ?? 'Student Supervisor',
    reciter_supervisor: jm?.roleReciterSupervisor ?? 'Reciter Supervisor',
    admin: jm?.roleAdmin ?? 'Admin',
    academy_admin: jm?.roleAcademyAdmin ?? 'Academy Admin',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
        isTeacher
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      )}
    >
      {isTeacher ? <GraduationCap className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
      {roleLabel[role] || role}
    </span>
  )
}

export function JudgesManager({ apiBase, competition, accent = 'primary', onClose }: Props) {
  const { t } = useI18n()
  const app = (t as any).app as Record<string, string> | undefined
  const jm = (t as any).judgesManager as Record<string, string> | undefined

  const [judges, setJudges] = useState<Judge[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const accentBtn =
    accent === 'emerald'
      ? 'bg-emerald-600 hover:bg-emerald-700'
      : 'bg-primary hover:bg-primary/90'

  const load = async (searchTerm = '') => {
    try {
      const url = `${apiBase}/${competition.id}/judges${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setJudges(data.judges || [])
        setCandidates(data.candidates || [])
      } else {
        const d = await res.json().catch(() => null)
        setError(d?.error || (jm?.loadFail ?? 'Failed to load judges'))
      }
    } catch {
      setError(jm?.loadFail ?? 'Failed to load judges')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competition.id])

  // Debounced candidate search.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`${apiBase}/${competition.id}/judges?search=${encodeURIComponent(search)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setCandidates(d.candidates || []))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const assignedIds = new Set(judges.map((j) => j.judge_id))
  const available = candidates.filter((c) => !assignedIds.has(c.id))

  const addJudge = async (judgeId: string) => {
    setBusyId(judgeId)
    setError(null)
    try {
      const res = await fetch(`${apiBase}/${competition.id}/judges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judge_id: judgeId }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok) setJudges(data.judges || [])
      else setError(data?.error || (jm?.addFail ?? 'Failed to add judge'))
    } finally {
      setBusyId(null)
    }
  }

  const removeJudge = async (judgeId: string) => {
    setBusyId(judgeId)
    setError(null)
    try {
      const res = await fetch(`${apiBase}/${competition.id}/judges?judge_id=${judgeId}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => null)
      if (res.ok) setJudges(data.judges || [])
      else setError(data?.error || (jm?.removeFail ?? 'Failed to remove judge'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <Gavel className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-black">{jm?.title ?? 'Competition Judges'}</h3>
              <p className="truncate text-sm text-muted-foreground">{competition.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 transition hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
            </div>
          ) : (
            <>
              {/* Assigned judges */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-muted-foreground">
                  {jm?.assignedJudges ?? 'Assigned Judges'} ({judges.length})
                </h4>
                {judges.length === 0 ? (
                  <p className="rounded-xl border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                    {jm?.noJudges ?? 'No judges assigned yet'}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {judges.map((j) => (
                      <li
                        key={j.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-bold">{j.name || (jm?.noName ?? 'No name')}</span>
                            <RoleBadge role={j.role} jm={jm} />
                          </div>
                          {j.email && (
                            <p className="truncate text-xs text-muted-foreground">{j.email}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeJudge(j.judge_id)}
                          disabled={busyId === j.judge_id}
                          className="shrink-0 rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                          aria-label={jm?.removeJudge ?? 'Remove judge'}
                        >
                          {busyId === j.judge_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add judges */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-muted-foreground">
                  {jm?.addJudgeHeading ?? 'Add Judge (teacher, reader, or supervisor)'}
                </h4>
                <div className="relative">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={jm?.searchPlaceholder ?? 'Search by name or email...'}
                    className="w-full rounded-xl border border-border bg-background py-2.5 pr-10 pl-3 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {available.length === 0 ? (
                  <p className="rounded-xl border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                    {search ? (jm?.noResults ?? 'No matching results') : (jm?.noCandidates ?? 'No available candidates to add')}
                  </p>
                ) : (
                  <ul className="max-h-64 space-y-2 overflow-y-auto">
                    {available.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-bold">{c.name || (jm?.noName ?? 'No name')}</span>
                            <RoleBadge role={c.role} jm={jm} />
                          </div>
                          {c.email && (
                            <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                          )}
                        </div>
                        <button
                          onClick={() => addJudge(c.id)}
                          disabled={busyId === c.id}
                          className={cn(
                            'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold text-white transition disabled:opacity-50',
                            accentBtn
                          )}
                        >
                          {busyId === c.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          {jm?.assign ?? 'Assign'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
