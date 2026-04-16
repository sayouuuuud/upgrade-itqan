'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Download, Filter, Calendar, ChevronDown, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const mockChildren = [
  { id: 'all', name: 'جميع الأبناء' },
  { id: 'stu-1', name: 'عبدالله محمد' },
  { id: 'stu-2', name: 'عائشة محمد' }
]

const mockReports = [
  {
    id: 1,
    childName: 'عبدالله محمد',
    course: 'الفقه الميسر - المستوى الأول',
    item: 'الواجب الأول: أحكام الطهارة',
    type: 'assignment',
    status: 'completed',
    grade: '95/100',
    date: '2026-04-10'
  },
  {
    id: 2,
    childName: 'عبدالله محمد',
    course: 'تلاوة وتجويد',
    item: 'جلسة التسميع الأسبوعية',
    type: 'session',
    status: 'absent',
    grade: '-',
    date: '2026-04-12'
  },
  {
    id: 3,
    childName: 'عائشة محمد',
    course: 'السيرة النبوية',
    item: 'اختبار نصف الدورة',
    type: 'exam',
    status: 'completed',
    grade: '100/100',
    date: '2026-04-14'
  }
]

export default function ParentReportsPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'

  const [selectedChild, setSelectedChild] = useState('all')
  const [period, setPeriod] = useState('month')
  const [reportsData, setReportsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/academy/parent/reports')
        if (res.ok) {
          const data = await res.json()
          setReportsData(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const uniqueChildren = Array.from(new Set(reportsData.map(r => r.childName)))
  const filterChildren = [{ id: 'all', name: isAr ? 'جميع الأبناء' : 'All Children' }, ...uniqueChildren.map(name => ({ id: name, name }))]

  const filteredReports = reportsData.filter(r => selectedChild === 'all' || r.childName === selectedChild)

  if (loading) {
    return <div className="p-8 text-center">{isAr ? "جاري التحميل..." : "Loading..."}</div>
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border/50">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <FileText className="w-4 h-4" />
            {isAr ? "تقارير الأداء" : "Performance Reports"}
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {isAr ? "التقارير الأكاديمية" : "Academic Reports"}
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl">
            {isAr
              ? "متابعة دقيقة لدرجات أبنائك، نسب الحضور، والمهام المسلمة."
              : "Detailed tracking of your children's grades, attendance, and submitted assignments."}
          </p>
        </div>
        <Button className="h-12 px-6 rounded-2xl bg-card border border-border text-foreground font-bold shadow-sm hover:bg-muted transition-all">
          <Download className={`w-5 h-5 ${isAr ? "ml-2" : "mr-2"}`} />
          {isAr ? "تصدير كـ PDF" : "Export as PDF"}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <select
            value={selectedChild}
            onChange={e => setSelectedChild(e.target.value)}
            className="w-full h-14 pl-4 pr-12 rounded-2xl border border-border bg-card font-bold appearance-none focus:ring-2 focus:ring-primary/20"
          >
            {filterChildren.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Filter className={`absolute ${isAr ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none`} />
        </div>

        <div className="relative flex-1">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="w-full h-14 pl-4 pr-12 rounded-2xl border border-border bg-card font-bold appearance-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="week">{isAr ? "اخر اسبوع" : "Past Week"}</option>
            <option value="month">{isAr ? "آخر شهر" : "Past Month"}</option>
            <option value="term">{isAr ? "الفصل الدراسي الحالي" : "Current Term"}</option>
          </select>
          <Calendar className={`absolute ${isAr ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none`} />
        </div>
      </div>

      <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right text-muted-foreground">
            <thead className="text-xs text-foreground uppercase bg-muted/30 border-b border-border/50 font-bold">
              <tr>
                <th scope="col" className="px-6 py-5 rounded-tl-lg">{isAr ? "الطالب" : "Student"}</th>
                <th scope="col" className="px-6 py-5">{isAr ? "الدورة" : "Course"}</th>
                <th scope="col" className="px-6 py-5">{isAr ? "النشاط" : "Activity"}</th>
                <th scope="col" className="px-6 py-5">{isAr ? "التاريخ" : "Date"}</th>
                <th scope="col" className="px-6 py-5">{isAr ? "الحالة" : "Status"}</th>
                <th scope="col" className="px-6 py-5 rounded-tr-lg">{isAr ? "الدرجة" : "Grade"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredReports.map(report => (
                <tr key={report.id} className="bg-card hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground">
                    {report.childName}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {report.course}
                  </td>
                  <td className="px-6 py-4 font-bold">
                    {report.item}
                  </td>
                  <td className="px-6 py-4 dir-ltr text-right">
                    {report.date}
                  </td>
                  <td className="px-6 py-4">
                    {report.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isAr ? "مكتمل" : "Completed"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                        <XCircle className="w-3.5 h-3.5" />
                        {isAr ? "غائب" : "Absent"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-black text-foreground">
                    {report.grade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredReports.length === 0 && (
          <div className="p-12 text-center text-muted-foreground font-medium">
            {isAr ? "لا توجد تقارير مطابقة لمعايير البحث." : "No reports match the filter criteria."}
          </div>
        )}
      </Card>
    </div>
  )
}
