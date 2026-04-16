"use client"

import { GraduationCap, Users, Plus, BookOpen } from 'lucide-react'

export default function TeacherHalaqatPage() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <GraduationCap className="w-6 h-6 text-blue-500" />
                        حلقاتي
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">إدارة الحلقات القرآنية والمتابعة</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-6 hover:border-blue-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-foreground">حلقة الصحابة</h3>
                            <p className="text-sm text-muted-foreground mt-1 text-emerald-600 font-medium">مفتوحة</p>
                        </div>
                        <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">عدد الطلاب:</span>
                            <span className="font-bold">12 طالب</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">المسار:</span>
                            <span className="font-medium">التجويد المتقدم</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">اللقاء القادم:</span>
                            <span className="font-medium text-blue-600">اليوم، 10:00 مساءً</span>
                        </div>
                    </div>

                    <button className="w-full py-2 bg-secondary/50 hover:bg-secondary text-foreground text-sm font-medium rounded-lg transition-colors border border-border">
                        إدارة الحلقة
                    </button>
                </div>

                {/* Empty State for Add */}
                <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-muted-foreground hover:border-blue-500/50 hover:text-blue-600 transition-colors cursor-pointer min-h-[250px]">
                    <Plus className="w-8 h-8 mb-2" />
                    <p className="font-medium">طلب فتح حلقة جديدة</p>
                </div>
            </div>
        </div>
    )
}
