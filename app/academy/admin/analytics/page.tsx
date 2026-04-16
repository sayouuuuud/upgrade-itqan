"use client"

import { BarChart3, TrendingUp, Users, BookOpen } from 'lucide-react'

export default function AdminAnalyticsPage() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-blue-500" />
                    التحليلات
                </h1>
                <p className="text-sm text-muted-foreground mt-1">نظرة عامة على أداء ومقاييس الأكاديمية</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'إجمالي الطلاب', value: '+1,200', icon: Users, color: 'text-blue-500' },
                    { label: 'الدورات النشطة', value: '45', icon: BookOpen, color: 'text-green-500' },
                    { label: 'معدل الإتمام', value: '78%', icon: TrendingUp, color: 'text-yellow-500' },
                    { label: 'ساعات المشاهدة', value: '4,500', icon: BarChart3, color: 'text-purple-500' }
                ].map((stat, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                        <div className={`p-3 rounded-lg bg-secondary/30 ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-6 h-80 flex items-center justify-center text-muted-foreground">
                    مخطط نمو التسجيل (قريباً)
                </div>
                <div className="bg-card border border-border rounded-xl p-6 h-80 flex items-center justify-center text-muted-foreground">
                    توزيع الطلاب حسب المستوى (قريباً)
                </div>
            </div>
        </div>
    )
}
