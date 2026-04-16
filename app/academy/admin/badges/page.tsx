"use client"

import { Award, Plus, Sparkles } from 'lucide-react'

export default function AdminBadgesPage() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Award className="w-6 h-6 text-blue-500" />
                        الشارات
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">إدارة الشارات والأوسمة للمتميزين</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    <Plus className="w-4 h-4" /> إضافة شارة جديدة
                </button>
            </div>

            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-foreground mb-2">لا يوجد شارات</h3>
                <p>قم بإنشاء الشارات الأولى للطلاب المتفوقين</p>
            </div>
        </div>
    )
}
