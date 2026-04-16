"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { HelpCircle, Clock, User, Filter, Eye, CheckCircle, XCircle, MessageSquare } from 'lucide-react'

interface FiqhQuestion {
    id: string
    question: string
    student_name: string
    student_id: string
    category: string
    status: string // 'new' | 'in_review' | 'answered' | 'rejected'
    created_at: string
    answer?: string
}

export default function SupervisorFiqhPage() {
    const [questions, setQuestions] = useState<FiqhQuestion[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('new')

    useEffect(() => { fetchQuestions() }, [statusFilter])

    async function fetchQuestions() {
        setLoading(true)
        try {
            const res = await fetch(`/api/academy/fiqh?status=${statusFilter}`)
            if (res.ok) {
                const data = await res.json()
                setQuestions(data.questions || [])
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    const getStatusBadge = (status: string) => {
        const map: Record<string, { label: string; cls: string }> = {
            'new': { label: 'جديد', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
            'in_review': { label: 'قيد المراجعة', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
            'answered': { label: 'مُجاب', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
            'rejected': { label: 'مرفوض', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
        }
        const s = map[status] || map['new']
        return <span className={`px-2 py-1 text-xs rounded-full ${s.cls}`}>{s.label}</span>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <HelpCircle className="w-6 h-6 text-blue-500" />
                        الأسئلة الفقهية
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">مراجعة الأسئلة الفقهية والإجابة عليها</p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-secondary/20 border border-border rounded-lg text-sm text-foreground">
                        <option value="new">جديدة</option>
                        <option value="in_review">قيد المراجعة</option>
                        <option value="answered">مُجابة</option>
                        <option value="rejected">مرفوضة</option>
                        <option value="">الكل</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'جديدة', value: questions.filter(q => q.status === 'new').length, color: 'text-blue-600' },
                    { label: 'قيد المراجعة', value: questions.filter(q => q.status === 'in_review').length, color: 'text-yellow-600' },
                    { label: 'مُجابة', value: questions.filter(q => q.status === 'answered').length, color: 'text-green-600' },
                    { label: 'مرفوضة', value: questions.filter(q => q.status === 'rejected').length, color: 'text-red-600' },
                ].map(stat => (
                    <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse"><div className="h-4 bg-muted rounded w-2/3 mb-3" /><div className="h-3 bg-muted rounded w-1/3" /></div>)}
                </div>
            ) : questions.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground">لا توجد أسئلة</h3>
                    <p className="text-sm text-muted-foreground">لا توجد أسئلة بهذا الفلتر</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {questions.map(q => (
                        <Link key={q.id} href={`/academy/supervisor/fiqh/${q.id}`}
                            className="block bg-card border border-border rounded-xl p-5 hover:border-blue-500/30 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground line-clamp-2">{q.question}</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{q.student_name}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(q.created_at).toLocaleDateString('ar-EG')}</span>
                                        <span className="px-2 py-0.5 bg-muted rounded-full">{q.category}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {getStatusBadge(q.status)}
                                    <Eye className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
