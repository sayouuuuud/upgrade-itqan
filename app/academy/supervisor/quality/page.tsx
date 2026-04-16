"use client"

import { useState, useEffect } from 'react'
import { BarChart3, Users, Clock, Star, TrendingUp, AlertCircle, Download } from 'lucide-react'

interface TeacherQuality {
    teacher_id: string
    teacher_name: string
    total_grades: number
    avg_grade: number
    avg_response_hours: number
    complaints_count: number
}

interface QualityStats {
    total_assessments: number
    average_grade: number
    average_response_time: number
    total_complaints: number
    teachers: TeacherQuality[]
}

export default function SupervisorQualityPage() {
    const [stats, setStats] = useState<QualityStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchStats() }, [])

    async function fetchStats() {
        setLoading(true)
        try {
            // Try the admin reports endpoint for quality data
            const res = await fetch('/api/academy/admin/courses')
            if (res.ok) {
                const data = await res.json()
                // Aggregate quality stats from courses data
                const teachers: TeacherQuality[] = []
                const teacherMap: Record<string, TeacherQuality> = {}

                if (data.courses) {
                    for (const course of data.courses) {
                        const tid = course.teacher_id || 'unknown'
                        if (!teacherMap[tid]) {
                            teacherMap[tid] = {
                                teacher_id: tid,
                                teacher_name: course.teacher_name || 'غير محدد',
                                total_grades: 0,
                                avg_grade: 0,
                                avg_response_hours: 0,
                                complaints_count: 0,
                            }
                        }
                        teacherMap[tid].total_grades += course.enrolled_count || 0
                    }
                }

                Object.values(teacherMap).forEach(t => teachers.push(t))

                setStats({
                    total_assessments: teachers.reduce((s, t) => s + t.total_grades, 0),
                    average_grade: teachers.length > 0 ? teachers.reduce((s, t) => s + t.avg_grade, 0) / teachers.length : 0,
                    average_response_time: 0,
                    total_complaints: 0,
                    teachers,
                })
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    if (loading) return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
            </div>
            <div className="h-64 bg-muted rounded-xl" />
        </div>
    )

    const statCards = [
        { label: 'إجمالي التقييمات', value: stats?.total_assessments || 0, icon: Star, color: 'text-yellow-500 bg-yellow-500/10' },
        { label: 'متوسط الدرجات', value: `${(stats?.average_grade || 0).toFixed(1)}%`, icon: TrendingUp, color: 'text-green-500 bg-green-500/10' },
        { label: 'متوسط وقت الاستجابة', value: `${(stats?.average_response_time || 0).toFixed(0)} ساعة`, icon: Clock, color: 'text-blue-500 bg-blue-500/10' },
        { label: 'الشكاوى', value: stats?.total_complaints || 0, icon: AlertCircle, color: 'text-red-500 bg-red-500/10' },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-blue-500" />
                        مراقبة الجودة
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">متابعة جودة التقييمات وأداء الأساتذة (قراءة فقط)</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    <Download className="w-4 h-4" />
                    تصدير تقرير
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map(card => (
                    <div key={card.label} className="bg-card border border-border rounded-xl p-5">
                        <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                            <card.icon className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{card.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Teacher Quality Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <h3 className="font-bold text-foreground">أداء الأساتذة</h3>
                </div>
                {!stats?.teachers?.length ? (
                    <div className="p-8 text-center text-muted-foreground">لا توجد بيانات كافية حتى الآن</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-right p-3 font-medium text-muted-foreground">الأستاذ</th>
                                    <th className="text-center p-3 font-medium text-muted-foreground">عدد التقييمات</th>
                                    <th className="text-center p-3 font-medium text-muted-foreground">متوسط الدرجة</th>
                                    <th className="text-center p-3 font-medium text-muted-foreground">وقت الاستجابة</th>
                                    <th className="text-center p-3 font-medium text-muted-foreground">شكاوى</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.teachers.map(teacher => (
                                    <tr key={teacher.teacher_id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                        <td className="p-3 font-medium text-foreground">{teacher.teacher_name}</td>
                                        <td className="p-3 text-center text-foreground">{teacher.total_grades}</td>
                                        <td className="p-3 text-center">
                                            <span className={`font-bold ${teacher.avg_grade >= 70 ? 'text-green-600' : teacher.avg_grade >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {teacher.avg_grade.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="p-3 text-center text-foreground">{teacher.avg_response_hours.toFixed(0)} ساعة</td>
                                        <td className="p-3 text-center">
                                            <span className={`font-bold ${teacher.complaints_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {teacher.complaints_count}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Read-only Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">وضع القراءة فقط</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">هذه الصفحة للمتابعة والمراقبة فقط. لا يمكن تعديل تقييمات الأساتذة من هنا.</p>
                </div>
            </div>
        </div>
    )
}
