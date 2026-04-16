"use client"

import { Video, Calendar, Clock, Download } from 'lucide-react'

export default function TeacherRecordingsPage() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Video className="w-6 h-6 text-blue-500" />
                        التسجيلات
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">إستعراض تسجيلات البث المباشر والحصص السابقة</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((item) => (
                    <div key={item} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                        <div className="bg-secondary/30 h-40 flex items-center justify-center relative">
                            <Video className="w-10 h-10 text-muted-foreground opacity-50" />
                            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">1:30:00</span>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-foreground mb-1">جلسة مراجعة الأسبوع {item}</h3>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date().toLocaleDateString('ar-EG')}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> منذ يومين</span>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                                <button className="text-sm text-blue-600 hover:underline font-medium">عرض</button>
                                <button className="text-muted-foreground hover:text-foreground"><Download className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
