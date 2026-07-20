"use client"

import { Globe, Smartphone, Monitor, Tablet } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useState } from "react"
import { DonutChart } from "@/components/ui/donut-chart"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface VisitorStatsProps {
    countryData: { country: string; count: number }[]
    deviceData: { device_type: string; count: number; percentage: number }[]
}

const DeviceIcon = ({ type }: { type: string }) => {
    switch (type.toLowerCase()) {
        case "desktop":
            return <Monitor className="h-4 w-4" />
        case "mobile":
            return <Smartphone className="h-4 w-4" />
        case "tablet":
            return <Tablet className="h-4 w-4" />
        default:
            return <Monitor className="h-4 w-4" />
    }
}

export function VisitorStats({ countryData, deviceData }: VisitorStatsProps) {
    const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
    const isAr = t.locale === 'ar'
    const [hoveredDevice, setHoveredDevice] = useState<string | null>(null)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Countries Stats */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 transition-colors">
                <div className="flex items-center gap-2 mb-6 text-foreground">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <Globe className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold">{t.admin.analytics.topCountries}</h3>
                </div>

                <div className="space-y-4">
                    {countryData.map((item, index) => (
                        <div key={item.country} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3 w-32">
                                <span className="text-sm font-medium w-6 text-muted-foreground/60 group-hover:text-primary transition-colors">
                                    #{index + 1}
                                </span>
                                <span className="text-sm font-medium text-foreground/80 truncate">
                                    {(() => {
                                        try {
                                            if (item.country === "Unknown" || !item.country || item.country.length !== 2) {
                                                return t.admin.analytics.unknown
                                            }
                                            return new Intl.DisplayNames([t.locale], { type: 'region' }).of(item.country) || item.country
                                        } catch {
                                            return item.country === "Unknown" ? t.admin.analytics.unknown : item.country
                                        }
                                    })()}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 flex-1 mx-4">
                                <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full shadow-sm shadow-blue-500/20"
                                        style={{
                                            width: `${(item.count / Math.max(...countryData.map((d) => d.count), 1)) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <span className="text-sm font-bold text-foreground w-12 text-left">
                                {item.count.toLocaleString()}
                            </span>
                        </div>
                    ))}

                    {countryData.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">{t.admin.analytics.noData}</div>
                    )}
                </div>
            </div>

            {/* Devices Stats */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 transition-colors">
                <div className="flex items-center gap-2 mb-6 text-foreground">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                        <Smartphone className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold">{t.admin.analytics.usedDevices}</h3>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6 justify-center mt-4 h-full min-h-[250px]">
                    {(() => {
                        // Pre-initialize allowed types to ensure they always show in legend
                        const allowedTypes = ['desktop', 'mobile', 'tablet'];
                        const aggregated = allowedTypes.map(type => ({
                            device_type: type,
                            count: 0,
                            percentage: 0
                        }));

                        deviceData.forEach(curr => {
                            const rawType = (curr.device_type || '').toLowerCase();
                            
                            // Check for keywords in the detailed string (e.g., "Chrome — Windows (Desktop)")
                            let type = '';
                            if (rawType.includes('desktop')) type = 'desktop';
                            else if (rawType.includes('mobile') || rawType.includes('iphone') || rawType.includes('android')) type = 'mobile';
                            else if (rawType.includes('tablet') || rawType.includes('ipad')) type = 'tablet';
                            
                            const existing = aggregated.find(d => d.device_type === type);
                            if (existing) {
                                existing.count += curr.count;
                            }
                        });

                        const total = aggregated.reduce((sum, d) => sum + d.count, 0);
                        const finalData = aggregated.map(d => ({
                            ...d,
                            percentage: total > 0 ? Math.round((d.count / total) * 100) : 0
                        })).sort((a, b) => b.count - a.count);
                        
                        const donutData = finalData.map((d, index) => ({
                            value: d.count,
                            label: d.device_type === 'desktop' ? t.admin.analytics.desktop : d.device_type === 'mobile' ? t.admin.analytics.mobile : d.device_type === 'tablet' ? t.admin.analytics.tablet : t.admin.analytics.unknown,
                            color: `var(--chart-${(index % 5) + 1})`,
                            percentage: d.percentage
                        }));
                        
                        const activeSegment = donutData.find(s => s.label === hoveredDevice)
                        const displayValue = activeSegment?.value ?? total
                        const displayLabel = activeSegment?.label ?? t.admin.analytics.usedDevices
                        const displayPercentage = activeSegment ? activeSegment.percentage : 100

                        return (
                            <>
                                <div className="relative flex items-center justify-center shrink-0">
                                    <DonutChart
                                        data={donutData}
                                        size={180}
                                        strokeWidth={20}
                                        onSegmentHover={(segment) => setHoveredDevice(segment?.label ?? null)}
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
                                                        {displayValue.toLocaleString(isAr ? "ar-EG" : "en-US")}
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
                                                hoveredDevice === segment.label 
                                                    ? "bg-card border-primary/40 shadow-sm scale-[1.02]" 
                                                    : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border/50"
                                            )}
                                            onMouseEnter={() => setHoveredDevice(segment.label)}
                                            onMouseLeave={() => setHoveredDevice(null)}
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
                            </>
                        )
                    })()}
                </div>
            </div>
        </div>
    )
}
