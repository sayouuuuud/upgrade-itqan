"use client"

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts"
import { Users, Activity } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface AcademyInsightsProps {
  totalStudents: number
  totalTeachers: number
  enrollmentsToday: number
  enrollmentsWeek: number
  activeEnrollments: number
}

const tooltipStyle = {
  borderRadius: "16px",
  border: "none",
  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
  backgroundColor: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  fontWeight: "bold" as const,
}

export function AcademyInsights({
  totalStudents,
  totalTeachers,
  enrollmentsToday,
  enrollmentsWeek,
  activeEnrollments,
}: AcademyInsightsProps) {
  const { t } = useI18n()
  const academy = (t as any).academy as Record<string, string> | undefined
  const isAr = t.locale === "ar"
  const nf = (n: number) => n.toLocaleString(isAr ? "ar-EG" : "en-US")

  const composition = [
    { name: isAr ? "الطلاب" : "Students", value: totalStudents, color: "#3b82f6" },
    { name: isAr ? "المدرسون" : "Teachers", value: totalTeachers, color: "#10b981" },
  ].filter((d) => d.value > 0)
  const compTotal = composition.reduce((s, d) => s + d.value, 0)
  const compData = composition.map((d) => ({
    ...d,
    percentage: compTotal > 0 ? Math.round((d.value / compTotal) * 100) : 0,
  }))
  const ratio = totalTeachers > 0 ? Math.round(totalStudents / totalTeachers) : 0

  const pulse = [
    { name: isAr ? "اليوم" : "Today", value: enrollmentsToday },
    { name: isAr ? "هذا الأسبوع" : "This week", value: enrollmentsWeek },
    { name: isAr ? "نشطة" : "Active", value: activeEnrollments },
  ]
  const pulseMax = Math.max(...pulse.map((d) => d.value), 1)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Community composition */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4 text-foreground">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="font-bold">{isAr ? "توزيع المجتمع" : "Community composition"}</h3>
        </div>

        {compTotal > 0 ? (
          <div className="h-[250px] w-full flex items-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={compData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                >
                  {compData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} className="hover:opacity-80 transition-opacity" />
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

        {ratio > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-2">
            {isAr ? `لكل مدرّس ~${nf(ratio)} طالب` : `~${nf(ratio)} students per teacher`}
          </p>
        )}
      </div>

      {/* Enrollment pulse */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4 text-foreground">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
            <Activity className="h-5 w-5" />
          </div>
          <h3 className="font-bold">{isAr ? "نبض التسجيلات" : "Enrollment pulse"}</h3>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pulse} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} reversed={isAr} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, pulseMax]} orientation={isAr ? "right" : "left"} />
              <RechartsTooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} formatter={(v: any) => nf(Number(v))} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}>
                {pulse.map((entry, index) => (
                  <Cell key={entry.name} fill={["#f59e0b", "#3b82f6", "#10b981"][index % 3]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
