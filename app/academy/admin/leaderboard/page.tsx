'use client'

import { useEffect, useMemo, useState } from 'react'
import { Award, Crown, Flame, Loader2, Medal, Search, Star, Trophy, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

type Entry = {
  id: string
  rank: number
  name: string
  email: string
  avatar_url?: string | null
  total_points: number
  current_level: number
  streak_days: number
  tasks_completed: number
  badges_count: number
  halaqa_name?: string | null
}

const PERIODS = [
  { value: 'all_time', label: 'كل الوقت' },
  { value: 'monthly', label: 'شهري' },
  { value: 'weekly', label: 'أسبوعي' },
] as const

export default function AdminLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<Entry[]>([])
  const [summary, setSummary] = useState({ users_count: 0, points_total: 0, badges_total: 0, tasks_total: 0 })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'all_time' | 'monthly' | 'weekly'>('all_time')
  const [scope, setScope] = useState<'platform' | 'halaqa'>('platform')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ period, scope, limit: '100' })
        const res = await fetch(`/api/academy/admin/leaderboard?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setLeaderboard(data.data || [])
          setSummary(data.summary || { users_count: 0, points_total: 0, badges_total: 0, tasks_total: 0 })
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [period, scope])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return leaderboard
    return leaderboard.filter((entry) => [entry.name, entry.email, entry.halaqa_name].filter(Boolean).some((value) => value!.toLowerCase().includes(term)))
  }, [leaderboard, search])

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#132f4c] via-[#184e77] to-[#d97706] p-8 text-white shadow-xl">
        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-bold backdrop-blur">
              <Trophy className="h-4 w-4" /> ترتيب الطلاب حسب النقاط
            </div>
            <h1 className="text-3xl font-black lg:text-4xl">لوحة المتصدرين</h1>
            <p className="max-w-2xl text-sm leading-7 text-white/80">عرض إداري واضح لترتيب الطلاب على مستوى المنصة أو الحلقات، مع النقاط والمهام والشارات.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="المستخدمون" value={summary.users_count} icon={Users} />
        <SummaryCard label="إجمالي النقاط" value={summary.points_total} icon={Star} />
        <SummaryCard label="الشارات" value={summary.badges_total} icon={Award} />
        <SummaryCard label="المهام المكتملة" value={summary.tasks_total} icon={Flame} />
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setScope('platform')} className={cn('rounded-2xl px-4 py-2.5 text-sm font-bold transition', scope === 'platform' ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground')}>المنصة كاملة</button>
            <button onClick={() => setScope('halaqa')} className={cn('rounded-2xl px-4 py-2.5 text-sm font-bold transition', scope === 'halaqa' ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground')}>الحلقات</button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث باسم أو بريد..." className="w-full rounded-2xl border border-border bg-background py-2.5 pe-9 ps-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 sm:w-72" />
            </div>
            <div className="flex gap-2">
              {PERIODS.map((item) => (
                <button key={item.value} onClick={() => setPeriod(item.value)} className={cn('rounded-2xl px-4 py-2.5 text-sm font-bold transition', period === item.value ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground hover:text-foreground')}>{item.label}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-80 items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-amber-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center">
          <Trophy className="mx-auto mb-4 h-14 w-14 text-muted-foreground/40" />
          <p className="font-black">لا توجد بيانات</p>
          <p className="mt-1 text-sm text-muted-foreground">لا توجد نتائج مطابقة للفلاتر الحالية.</p>
        </div>
      ) : (
        <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="space-y-3">
            {filtered.map((entry) => <LeaderboardCard key={entry.id} entry={entry} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Trophy }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-black">{Number(value || 0).toLocaleString('ar-EG')}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><Icon className="h-6 w-6" /></div>
      </div>
    </div>
  )
}

function LeaderboardCard({ entry }: { entry: Entry }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-4 transition hover:shadow-sm lg:flex-row lg:items-center">
      <div className="flex items-center gap-4 lg:w-2/5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-lg font-black">
          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-amber-100 font-black text-blue-800">
          {entry.avatar_url ? <img src={entry.avatar_url} alt="" className="h-full w-full object-cover" /> : entry.name?.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-black">{entry.name}</p>
          <p className="truncate text-sm text-muted-foreground">{entry.email}</p>
          {entry.halaqa_name && <p className="mt-1 text-xs text-muted-foreground">{entry.halaqa_name}</p>}
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric icon={Star} label="النقاط" value={entry.total_points} tone="text-amber-600" />
        <Metric icon={Crown} label="المستوى" value={entry.current_level} tone="text-blue-600" />
        <Metric icon={Medal} label="الشارات" value={entry.badges_count} tone="text-purple-600" />
        <Metric icon={Flame} label="المهام" value={entry.tasks_completed} tone="text-emerald-600" />
      </div>
    </article>
  )
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Trophy; label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3 text-center">
      <p className="mb-1 flex items-center justify-center gap-1 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</p>
      <p className={cn('text-xl font-black', tone)}>{Number(value || 0).toLocaleString('ar-EG')}</p>
    </div>
  )
}
