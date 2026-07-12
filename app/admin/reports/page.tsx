'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Download, Users, Star, Mail, Award, Loader2, Medal, Clock, MapPin, AlertCircle, ChevronRight, Filter, Calendar, Search, FileCheck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts'
import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'

const STATUS_COLORS: Record<string, string> = { 
  mastered: '#10b981', 
  needs_session: '#f59e0b', 
  pending: '#3b82f6', 
  in_review: '#8b5cf6', 
  rejected: '#ef4444', 
  session_booked: '#0ea5e9' 
}

export default function AdminReportsPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [range, setRange] = useState('month')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?range=${range}`)
      if (res.ok) setData(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [range])

  const exportCSV = () => {
    if (!data) return
    const rows = [
      [t.admin.reportsPage.metric, t.admin.reportsPage.value],
      [t.admin.reportsPage.totalStudents, data.users?.total_students],
      [t.admin.reportsPage.totalReaders, data.users?.total_readers],
      [t.admin.reportsPage.totalRecitations, data.recitations?.total],
      [t.admin.reportsPage.mastered, data.recitations?.mastered],
      [t.admin.reportsPage.needsSession, data.recitations?.needs_session],
      [t.admin.reportsPage.pendingReview, data.recitations?.pending],
      [t.admin.reportsPage.masteryRate, `${data.recitations?.mastery_rate}%`],
      [t.admin.reportsPage.totalSessions, data.sessions?.total],
      [t.admin.reportsPage.completedSessions, data.sessions?.completed],
      [t.admin.reportsPage.cancelledSessions, data.sessions?.cancelled],
      [t.admin.reportsPage.certificatesIssued, data.certificates],
      [t.admin.reportsPage.emailsSent, data.emailsSent],
      ['', ''],
      [t.admin.reportsPage.mistakesStats, ''],
      [t.admin.reportsPage.totalMistakesLabel, data.wordMistakes?.summary?.total_mistakes || 0],
      [t.admin.reportsPage.studentsWithMistakes, data.wordMistakes?.summary?.total_students_with_mistakes || 0],
      ['', ''],
      [t.admin.reportsPage.word, t.admin.reportsPage.frequency, t.admin.reportsPage.studentsCount],
      ...(data.wordMistakes?.topWords || []).map((w: any) => [w.word, w.frequency, w.students_count])
    ]
    const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reports-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-24 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
        {(t.addedTranslations_2026?.['{isAr ? "جاري تحضير التقارير" : "Translated"}...'] || (t.addedTranslations_2026?.['جاري تحضير التقارير...'] || 'جاري تحضير التقارير...'))}
      </p>
    </div>
  )

  const tStatus = {
    mastered: t.admin.reportsPage.statusMastered,
    needs_session: t.admin.reportsPage.statusNeedsSession,
    pending: t.admin.reportsPage.statusPending,
    in_review: t.admin.reportsPage.statusInReview,
    rejected: t.admin.reportsPage.statusRejected,
    session_booked: t.admin.reportsPage.statusSessionBooked
  } as Record<string, string>;

  const recPieData = ['mastered', 'needs_session', 'pending', 'in_review', 'rejected', 'session_booked'].map(s => ({
    key: s,
    name: tStatus[s] || s,
    value: Number(data?.recitations?.[s] || 0),
    color: STATUS_COLORS[s],
  })).filter(d => d.value > 0)

  const totalPie = recPieData.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="bg-card min-h-full -m-6 lg:-m-8 p-6 lg:p-8 space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            {t.admin.reportsPage.title}
          </h1>
          <p className="text-muted-foreground font-bold tracking-wide">{t.admin.reportsPage.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-muted/50 rounded-2xl border border-border gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'week', label: t.admin.reportsPage.rangeWeek },
              { id: 'month', label: t.admin.reportsPage.rangeMonth },
              { id: '3months', label: t.admin.reportsPage.range3Months },
              { id: 'year', label: t.admin.reportsPage.rangeYear },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                  range === r.id
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button 
            onClick={exportCSV} 
            variant="outline" 
            className="rounded-2xl font-black h-11 px-6 gap-2 border-border hover:bg-muted"
          >
            <Download className="w-4 h-4 ml-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: t.admin.reportsPage.totalStudents, value: data?.users?.total_students || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: t.admin.reportsPage.totalReaders, value: data?.users?.total_readers || 0, icon: Medal, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: t.admin.reportsPage.totalSupervisors, value: data?.users?.total_supervisors || 0, icon: Star, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: t.admin.reportsPage.totalRecitations, value: data?.recitations?.total || 0, icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          { label: t.admin.reportsPage.mastered, value: data?.recitations?.mastered || 0, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
          { label: t.admin.reportsPage.masteryRate, value: `${data?.recitations?.mastery_rate || 0}%`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: t.admin.reportsPage.totalSessions, value: data?.sessions?.total || 0, icon: Users, color: 'text-sky-500', bg: 'bg-sky-500/10' },
          { label: t.admin.reportsPage.pendingReview, value: data?.recitations?.pending || 0, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: t.admin.reportsPage.needsSession, value: data?.recitations?.needs_session || 0, icon: Calendar, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { label: t.admin.reportsPage.statusInReview, value: data?.recitations?.in_review || 0, icon: Search, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: t.admin.reportsPage.certificatesIssued, value: data?.certificates || 0, icon: FileCheck, color: 'text-teal-500', bg: 'bg-teal-500/10' },
          { label: t.admin.reportsPage.emailsSent, value: data?.emailsSent || 0, icon: Mail, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' },
        ].map(card => (
          <div key={card.label} className="bg-card rounded-3xl border border-border p-5 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5 group relative overflow-hidden">
             <div className={`absolute top-0 left-0 w-1 h-full ${card.color.replace('text-', 'bg-')}`} />
             <div className="flex items-center gap-3 mb-3">
               <div className={`p-2 rounded-xl ${card.bg} border border-border group-hover:scale-110 transition-transform`}>
                 <card.icon className={`w-5 h-5 ${card.color}`} />
               </div>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{card.label}</p>
             </div>
             <p className={`text-2xl font-black ${card.color} tracking-tight`}>
               {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
             </p>
          </div>
        ))}
      </div>

      {/* Mistakes & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mistakes Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-rose-500/5 rounded-3xl border border-rose-500/10 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertCircle className="w-24 h-24 text-rose-500" />
            </div>
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">{t.admin.reportsPage.totalMistakesLabel}</p>
            <p className="text-4xl font-black text-rose-600">{data?.wordMistakes?.summary?.total_mistakes || 0}</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-rose-500/60 uppercase tracking-wide">
              <Users className="w-3.5 h-3.5" />
              {data?.wordMistakes?.summary?.total_students_with_mistakes || 0} {t.admin.reportsPage.studentsWithMistakes}
            </div>
          </div>

          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className="font-black text-xs uppercase tracking-widest text-foreground">{t.admin.reportsPage.topMistakenWords}</h3>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {(data?.wordMistakes?.topWords || []).slice(0, 6).map((w: any, i: number) => (
                <div key={i} className="flex flex-col gap-2 bg-muted/20 border border-border rounded-2xl p-3 hover:bg-muted/40 transition-colors">
                  <span className="font-black text-rose-500 text-lg text-center" dir="rtl">{w.word}</span>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">
                    <span>{w.frequency} {t.admin.reportsPage.times}</span>
                    <span>{w.students_count} {t.admin.reportsPage.students}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Activity Chart */}
        <div className="lg:col-span-2 bg-card rounded-3xl border border-border shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-lg text-foreground mb-1">{t.admin.reportsPage.dailyActivity}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{t.admin.reportsPage.last30Days}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div className="h-[280px] mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.recitations?.daily || []}>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                  contentStyle={{ 
                    borderRadius: '1.5rem', 
                    border: '1px solid hsl(var(--border))', 
                    backgroundColor: 'hsl(var(--card))',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '0.75rem 1rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    fontSize: '10px'
                  }} 
                />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 8, 8]} name={t.admin.reportsPage.recitations} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Reordered Charts Grid: Mastery, Trend, Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Mastery Rate */}
        <div className="bg-card rounded-3xl border border-border shadow-sm p-8 flex flex-col items-center">
          <h3 className="font-black text-lg text-foreground mb-8 text-center">{t.admin.reportsPage.weeklyMasteryRate}</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.masteryTrend || []}>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                  axisLine={false} 
                  tickLine={false} 
                  unit="%"
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                  contentStyle={{ 
                    borderRadius: '1.5rem', 
                    border: '1px solid hsl(var(--border))', 
                    backgroundColor: 'hsl(var(--card))',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '0.75rem 1rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    fontSize: '11px'
                  }} 
                />
                <Bar 
                  dataKey="mastery_rate" 
                  fill="#10b981" 
                  radius={[8, 8, 0, 0]} 
                  name={t.admin.reportsPage.masteryRate} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-card rounded-3xl border border-border shadow-sm p-8 flex flex-col items-center">
          <h3 className="font-black text-lg text-foreground mb-8 text-center">{t.admin.reportsPage.monthlyTrend}</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.recitations?.byMonth || []}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMastered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '1.5rem', 
                    border: '1px solid hsl(var(--border))', 
                    backgroundColor: 'hsl(var(--card))',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '0.75rem 1rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    fontSize: '11px'
                  }} 
                />
                <Area 
                   type="monotone" 
                   dataKey="total" 
                   stroke="hsl(var(--primary))" 
                   strokeWidth={4} 
                   fillOpacity={1}
                   fill="url(#colorTotal)"
                   name={t.admin.reportsPage.total} 
                />
                <Area 
                   type="monotone" 
                   dataKey="mastered" 
                   stroke="#10b981" 
                   strokeWidth={4} 
                   fillOpacity={1}
                   fill="url(#colorMastered)"
                   name={t.admin.reportsPage.statusMastered} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-card rounded-3xl border border-border shadow-sm p-8 flex flex-col items-center">
          <h3 className="font-black text-lg text-foreground mb-8 text-center">{t.admin.reportsPage.statusDistribution}</h3>
          
          <div className="flex flex-col items-center justify-center gap-10 w-full">
            <div className="relative w-36 h-36 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {recPieData.reduce((acc, d, i) => {
                  const pct = totalPie > 0 ? (d.value / totalPie) * 100 : 0
                  const offset = acc.offset
                  if (pct > 0) {
                    acc.elements.push(
                      <circle
                        key={d.key}
                        cx="18" cy="18" r="15.9"
                        fill="none"
                        stroke={d.color}
                        strokeWidth="3.5"
                        strokeDasharray={`${pct} ${100 - pct}`}
                        strokeDashoffset={`${-offset}`}
                        className="transition-all duration-1000 ease-in-out opacity-80 hover:opacity-100"
                        style={{ filter: 'drop-shadow(0 0 4px rgb(0 0 0 / 0.1))' }}
                      />
                    )
                  }
                  acc.offset += pct
                  return acc
                }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-black text-foreground tracking-tighter">{totalPie}</span>
                  <span className="block text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{t.admin.reportsPage.total}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
              {recPieData.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-2 p-2 bg-muted/10 rounded-xl border border-border/50">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tight truncate">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-foreground shrink-0">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Demographics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-3xl border border-border shadow-sm p-6 overflow-hidden relative">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full" />
          <h3 className="font-black text-xs text-muted-foreground uppercase tracking-widest mb-6 border-b border-border pb-4">{t.admin.reportsPage.genderStudents}</h3>
          <div className="space-y-6">
            {(data?.users?.gender || []).map((g: any) => {
              const total = data.users.gender.reduce((s: number, x: any) => s + parseInt(x.count), 0)
              const pct = total > 0 ? (parseInt(g.count) / total) * 100 : 0
              const isMale = g.gender === 'male'
              return (
                <div key={g.gender} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className={isMale ? 'text-blue-500' : 'text-rose-400'}>{isMale ? t.auth.male : t.auth.female}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground text-sm">{pct.toFixed(0)}%</span>
                      <span className="text-muted-foreground opacity-40">({g.count})</span>
                    </div>
                  </div>
                  <div className="h-3 bg-muted rounded-2xl overflow-hidden border border-border p-0.5">
                    <div className={`h-full rounded-2xl transition-all duration-1000 ${isMale ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border shadow-sm p-6">
          <h3 className="font-black text-xs text-muted-foreground uppercase tracking-widest mb-6 border-b border-border pb-4">{t.admin.reportsPage.sessionsDetails}</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t.admin.reportsPage.completed, value: data?.sessions?.completed || 0, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: t.admin.reportsPage.cancelled, value: data?.sessions?.cancelled || 0, color: 'text-rose-500', bg: 'bg-rose-500/10' },
              { label: t.admin.reportsPage.noShow, value: data?.sessions?.no_show || 0, color: 'text-muted-foreground', bg: 'bg-muted' },
              { label: t.admin.reportsPage.avgDuration, value: `${data?.sessions?.avg_duration || 0} ${t.admin.reportsPage.min}`, color: 'text-primary', bg: 'bg-primary/10' }
            ].map(s => (
              <div key={s.label} className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex flex-col gap-1 text-center hover:bg-muted/40 transition-colors">
                <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground opacity-60">{s.label}</span>
                <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border shadow-sm p-6">
          <h3 className="font-black text-xs text-muted-foreground uppercase tracking-widest mb-6 border-b border-border pb-4">{t.admin.reportsPage.topCities}</h3>
          <div className="space-y-3">
            {(data?.users?.byCity || []).slice(0, 5).map((c: any, i: number) => (
              <div key={c.city} className={`flex items-center justify-between p-3 rounded-2xl bg-muted/10 border border-border transition-all hover:translate-x-1 ${i === 0 ? 'border-primary/20 bg-primary/5' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${i === 0 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground opacity-40'}`}>
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-black text-foreground uppercase tracking-tight">{c.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-primary">{c.count}</span>
                  <div className="h-1 w-8 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/40 rounded-full" style={{ width: `${(c.count / data.users.byCity[0].count) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Reviewers */}
        <div className="bg-card rounded-3xl border border-border shadow-sm p-6 overflow-hidden relative group">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Medal className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="font-black text-xs uppercase tracking-widest text-foreground">{t.admin.reportsPage.topReviewers}</h3>
          </div>
          <div className="space-y-4">
            {(data?.topReviewers || []).slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between group/item">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg text-[9px] font-black flex items-center justify-center ${i === 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-muted text-muted-foreground opacity-40'}`}>{i + 1}</span>
                  <a href={`/admin/users/${r.id}`} className="text-sm font-black text-foreground hover:text-primary transition-colors truncate max-w-[120px]">{r.name}</a>
                </div>
                <div className="text-end">
                  <p className="text-sm font-black text-primary tracking-tighter">{r.reviews_count}</p>
                  <p className="text-[9px] text-emerald-500 uppercase font-black tracking-tighter opacity-60">{r.mastered_count} {t.admin.reportsPage.statusMastered}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Session Readers */}
        <div className="bg-card rounded-3xl border border-border shadow-sm p-6 overflow-hidden relative group">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="font-black text-xs uppercase tracking-widest text-foreground">{t.admin.reportsPage.topSessionReaders}</h3>
          </div>
          <div className="space-y-4">
            {(data?.topSessionReaders || []).slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between group/item">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg text-[9px] font-black flex items-center justify-center ${i === 0 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-muted text-muted-foreground opacity-40'}`}>{i + 1}</span>
                  <a href={`/admin/users/${r.id}`} className="text-sm font-black text-foreground hover:text-primary transition-colors truncate max-w-[120px]">{r.name}</a>
                </div>
                <div className="text-end">
                  <p className="text-sm font-black text-blue-500 tracking-tighter">{r.sessions_count}</p>
                  <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter opacity-40">✓ {r.completed_sessions} {t.admin.reportsPage.done}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active Students */}
        <div className="bg-card rounded-3xl border border-border shadow-sm p-6 overflow-hidden relative group">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Star className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="font-black text-xs uppercase tracking-widest text-foreground">{t.admin.reportsPage.mostActiveStudents}</h3>
          </div>
          <div className="space-y-4">
            {(data?.topStudents || []).slice(0, 5).map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between group/item">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg text-[9px] font-black flex items-center justify-center ${i === 0 ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-muted text-muted-foreground opacity-40'}`}>{i + 1}</span>
                  <div>
                    <a href={`/admin/users/${s.id}`} className="text-sm font-black text-foreground hover:text-primary transition-colors block truncate max-w-[110px]">{s.name}</a>
                    <p className="text-[9px] text-muted-foreground truncate max-w-[110px] opacity-40">{s.email}</p>
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-xs text-foreground font-black">{s.recitations} {t.admin.reportsPage.recs}</p>
                  <p className="text-[9px] text-muted-foreground font-black opacity-40">{s.bookings} {t.admin.reportsPage.sessionsCount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Contributors Table */}
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary drop-shadow-sm" />
            <h3 className="font-black text-lg text-foreground">{t.admin.reportsPage.overallTopContributors}</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest border-b border-border">
                <th className="py-4 px-6 text-center w-20 whitespace-nowrap">{t.admin.reportsPage.rank}</th>
                <th className="py-4 px-6 text-start whitespace-nowrap">{t.admin.reportsPage.reader}</th>
                <th className="py-4 px-6 whitespace-nowrap">{t.admin.reportsPage.reviews}</th>
                <th className="py-4 px-6 whitespace-nowrap">{t.admin.reportsPage.sessionsLabel}</th>
                <th className="py-4 px-6 whitespace-nowrap">{t.admin.reportsPage.total}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.topContributors || []).slice(0, 10).map((r: any, i: number) => (
                <tr key={i} className="hover:bg-muted/30 transition-all group">
                  <td className="py-4 px-6">
                    <div className="flex justify-center">
                      <span className={`w-8 h-8 rounded-xl text-xs font-black inline-flex items-center justify-center ${i === 0 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground opacity-40'}`}>{i + 1}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {r.avatar_url ? (
                          <img src={r.avatar_url} className="w-10 h-10 rounded-xl object-cover border border-border group-hover:scale-110 transition-transform" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-xs font-black text-muted-foreground group-hover:scale-110 transition-transform">
                            {r.name[0]}
                          </div>
                        )}
                        {i < 3 && (
                          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border border-card ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-amber-700'}`}>
                            <Medal className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <a href={`/admin/users/${r.id}`} className="font-black text-sm text-foreground hover:text-primary transition-colors">{r.name}</a>
                        <p className="text-[9px] font-black uppercase text-muted-foreground opacity-40 tracking-widest">{t.admin.approvedReaders}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="font-black text-sm text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg">{r.reviews}</span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="font-black text-sm text-purple-500 bg-purple-500/10 px-3 py-1 rounded-lg">{r.sessions}</span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center justify-end">
                      <span className="font-black text-2xl text-primary tracking-tighter flex items-center gap-2">
                        {r.total_contribution}
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-all group-hover:translate-x-1" />
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
