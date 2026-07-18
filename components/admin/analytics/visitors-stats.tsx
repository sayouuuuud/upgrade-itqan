"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts"
import { Globe, Smartphone, Monitor, Tablet } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface VisitorStatsProps {
    countryData: { country: string; count: number }[]
    deviceData: { device_type: string; count: number; percentage: number }[]
}

const COLORS = ["#0B3D2E", "#10b981", "#f59e0b", "#3b82f6", "#8884d8"]

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

                <div className="h-[250px] w-full flex items-center">
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
                        
                        // Ensure we only have data if there's at least one count, or keep them all if that's preferred.
                        // User specifically asked "Where is the tablet", so keeping all three is better.

                        return (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={finalData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={85}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="device_type"
                                        stroke="none"
                                    >
                                        {finalData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={COLORS[index % COLORS.length]} 
                                                className="hover:opacity-80 transition-opacity"
                                            />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        contentStyle={{ 
                                            borderRadius: '16px', 
                                            border: 'none', 
                                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                            backgroundColor: 'hsl(var(--card))',
                                            color: 'hsl(var(--foreground))',
                                            fontWeight: 'bold'
                                        }} 
                                    />
                                    <Legend
                                        layout="vertical"
                                        verticalAlign="middle"
                                        align="right"
                                        formatter={(value, entry: any) => {
                                            const label = value === 'desktop' ? t.admin.analytics.desktop : value === 'mobile' ? t.admin.analytics.mobile : value === 'tablet' ? t.admin.analytics.tablet : t.admin.analytics.unknown;
                                            return <span className={`text-xs font-bold text-foreground/70 ${isAr ? 'mr-3' : 'ml-3'}`}>{label} ({entry.payload.percentage || 0}%)</span>
                                        }}
                                        iconType="circle"
                                        iconSize={8}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )
                    })()}
                </div>
            </div>
        </div>
    )
}
