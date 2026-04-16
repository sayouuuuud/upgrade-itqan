"use client"

import { FileText, Download, Filter, Calendar } from 'lucide-react'

export default function AdminReportsPage() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-500" />
                        التقارير
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">توليد واستعراض تقارير الأكاديمية</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    <Download className="w-4 h-4" />
                    تصدير تقرير مجمع
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: 'تقرير أداء الطلاب', desc: 'معدلات الإنجاز، الحضور، والدرجات' },
                    { title: 'تقرير تفاعل المعلمين', desc: 'تقييم المعلمين، التجاوب، والحصص المكتملة' },
                    { title: 'تقرير الدورات', desc: 'أكثر الدورات شعبية ومعدلات الإتمام' }
                ].map((report, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-foreground mb-2">{report.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{report.desc}</p>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            توليد التقرير
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>التقارير التفصيلية قيد التطوير...</p>
            </div>
        </div>
    )
}
