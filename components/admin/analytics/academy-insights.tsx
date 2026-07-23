"use client"

import { useState } from "react"
import { DonutChart } from "@/components/ui/donut-chart"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Users } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface AcademyInsightsProps {
  totalStudents: number
  totalTeachers: number
}

export function AcademyInsights({
  totalStudents,
  totalTeachers,
}: AcademyInsightsProps) {
  const { t } = useI18n()
  const isAr = t.locale === "ar"
  const nf = (n: number) => n.toLocaleString(isAr ? "ar-EG" : "en-US")
  const [hoveredRole, setHoveredRole] = useState<string | null>(null)

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

  return (
    <div className="w-full">
      {/* Community composition */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4 text-foreground">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="font-bold">{isAr ? "توزيع المجتمع" : "Community composition"}</h3>
        </div>

        {compTotal > 0 ? (() => {
          const donutData = compData.map((d, index) => ({
              value: d.value,
              label: d.name,
              color: `var(--chart-${(index % 5) + 1})`,
              percentage: d.percentage
          }))
          
          const activeSegment = donutData.find(s => s.label === hoveredRole)
          const displayValue = activeSegment?.value ?? compTotal
          const displayLabel = activeSegment?.label ?? (isAr ? "المجتمع" : "Community")

          return (
            <div className="flex flex-col md:flex-row items-center gap-6 justify-center mt-4 h-full min-h-[250px]">
              <div className="relative flex items-center justify-center shrink-0">
                  <DonutChart
                      data={donutData}
                      size={180}
                      strokeWidth={20}
                      onSegmentHover={(segment) => setHoveredRole(segment?.label ?? null)}
                      centerContent={
                          <AnimatePresence mode="wait">
                              <motion.div
                                  key={displayLabel}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ duration: 0.2, ease: "circOut" }}
                                  className="flex flex-col items-center justify-center text-center"
                              >
                                  <p className="text-muted-foreground text-[10px] font-medium truncate max-w-[100px]">
                                      {displayLabel}
                                  </p>
                                  <p className="text-xl font-bold text-foreground">
                                      {nf(displayValue)}
                                  </p>
                              </motion.div>
                          </AnimatePresence>
                      }
                  />
              </div>
              <div className="flex flex-col gap-2 flex-1 w-full max-w-sm justify-center">
                  {donutData.map((segment, index) => (
                      <motion.div
                          key={segment.label}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                          className={cn(
                              "flex items-center gap-3 p-2 rounded-xl border transition-all duration-200 cursor-pointer",
                              hoveredRole === segment.label 
                                  ? "bg-card border-primary/40 shadow-sm scale-[1.02]" 
                                  : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border/50"
                          )}
                          onMouseEnter={() => setHoveredRole(segment.label)}
                          onMouseLeave={() => setHoveredRole(null)}
                      >
                          <div
                              className="h-3 w-3 shrink-0 rounded-full shadow-sm"
                              style={{ backgroundColor: segment.color }}
                          />
                          <span className="text-sm font-medium text-foreground truncate flex-1">
                              {segment.label}
                          </span>
                          <span className="text-xs font-bold text-foreground bg-background px-2 py-1 rounded-md shadow-sm border border-border/50">
                              {segment.percentage}%
                          </span>
                      </motion.div>
                  ))}
              </div>
            </div>
          )
        })() : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">{t.admin.analytics.noData}</div>
        )}

        {ratio > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-2">
            {isAr ? `لكل مدرّس ~${nf(ratio)} طالب` : `~${nf(ratio)} students per teacher`}
          </p>
        )}
      </div>
    </div>
  )
}
