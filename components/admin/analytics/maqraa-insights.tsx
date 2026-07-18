"use client"

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts"
import { ClipboardList, Mic, TrendingUp } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface MaqraaInsightsProps {
  statusDistribution: Record<string, number>
  readersActivity: { name: string; reviews: number }[]
  recitationsOverTime: { date: string; count: number }[]
}

// Theme-aligned palette (primary green + supporting accents, no violet).
const STATUS_COLORS = ["#0B3D2E", "#10b981", "#f59e0b", "#3b82f6", "#14b8a6", "#ef4444"]

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  mastered: { ar: "متقن", en: "Mastered" },
  in_review: { ar: "قيد المراجعة", en: "In review" },
  pending: { ar: "قيد الانتظار", en: "Pending" },
  session_booked: { ar: "جلسة محجوزة", en: "Session booked" },
  needs_session: { ar: "يحتاج جلسة", en: "Needs session" },
  rejected: { ar: "مرفوض", en: "Rejected" },
}

const tooltipStyle = {
  borderRadius: "16px",
  border: "none",
  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
  backgroundColor: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  fontWeight: "bold" as const,
}

export function MaqraaInsights({ statusDistribution, readersActivity, recitationsOverTime }: MaqraaInsightsProps) {
  const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
  const isAr = t.locale === "ar"
  const nf = (n: number) => n.toLocaleString(isAr ? "ar-EG" : "en-US")

  const statusEntries = Object.entries(statusDistribution || {})
    .map(([key, count]) => ({ key, count: Number(count) || 0 }))
    .filter((d) => d.count > 0)
  const statusTotal = statusEntries.reduce((s, d) => s + d.count, 0)
  const statusData = statusEntries
    .map((d) => ({
      name: STATUS_LABELS[d.key] ? (isAr ? STATUS_LABELS[d.key].ar : STATUS_LABELS[d.key].en) : d.key,
      value: d.count,
      percentage: statusTotal > 0 ? Math.round((d.count / statusTotal) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value)

  const readers = (readersActivity || []).filter((r) => r.reviews > 0)
  const maxReviews = Math.max(...readers.map((r) => r.reviews), 1)

  const trend = (recitationsOverTime || []).map((d) => ({ date: d.date, count: Number(d.count) || 0 }))
  const trendTotal = trend.reduce((s, d) => s + d.count, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recitation status distribution */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4 text-foreground">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <ClipboardList className="h-5 w-5" />
            </div>
            <h3 className="font-bold">{isAr ? "حالة التلاوات" : "Recitation status"}</h3>
          </div>

          {statusData.length > 0 ? (
            <div className="h-[250px] w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} className="hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={tooltipStyle} formatter={(v: any) => nf(Number(v))} />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value, entry: any) => (
                      <span className={`text-xs font-bold text-foreground/70 ${isAr ? "mr-2" : "ml-2"}`}>
                        {value} ({entry.payload.percentage || 0}%)
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">{t.admin.analytics.noData}</div>
          )}
        </div>

        {/* Top readers by reviews */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 text-foreground">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Mic className="h-5 w-5" />
            </div>
            <h3 className="font-bold">{isAr ? "أنشط القراء" : "Most active readers"}</h3>
          </div>

          {readers.length > 0 ? (
            <div className="space-y-4">
              {readers.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 w-32">
                    <span className="text-sm font-medium w-6 text-muted-foreground/60 group-hover:text-primary transition-colors">#{index + 1}</span>
                    <span className="text-sm font-medium text-foreground/80 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-1 mx-4">
                    <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/20" style={{ width: `${(item.reviews / maxReviews) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground w-12 text-left">{nf(item.reviews)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">{t.admin.analytics.noData}</div>
          )}
        </div>
      </div>

      {/* Recitations trend */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-foreground">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-bold">{isAr ? "اتجاه التلاوات" : "Recitations trend"}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {isAr ? "الإجمالي" : "Total"}: <span className="font-bold text-foreground">{nf(trendTotal)}</span>
          </p>
        </div>

        {trend.length > 0 && trendTotal > 0 ? (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="recitationsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B3D2E" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0B3D2E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} reversed={isAr} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} orientation={isAr ? "right" : "left"} />
                <RechartsTooltip contentStyle={tooltipStyle} formatter={(v: any) => nf(Number(v))} />
                <Area type="monotone" dataKey="count" stroke="#0B3D2E" strokeWidth={2.5} fill="url(#recitationsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[240px] flex items-center justify-center text-muted-foreground">{t.admin.analytics.noData}</div>
        )}
      </div>
    </div>
  )
}
