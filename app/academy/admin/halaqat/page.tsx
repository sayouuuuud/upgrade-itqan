"use client"

import { GraduationCap, Plus, Users } from 'lucide-react'

export default function AdminHalaqatPage() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <GraduationCap className="w-6 h-6 text-blue-500" />
                        الحلقات
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">تكوين وإدارة حلقات التحفيظ والمتابعة</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    <Plus className="w-4 h-4" /> إنشاء حلقة جديدة
                </button>
            </div>

            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-foreground mb-2">لا توجد حلقات نشطة</h3>
                <p>قم بإنشاء الحلقات وتعيين المعلمين والطلاب لها</p>
            </div>
        </div>
    )
}
