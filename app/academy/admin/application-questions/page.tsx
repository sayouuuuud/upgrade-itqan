"use client"

import { useState, useEffect } from "react"
import {
    Plus, Trash2, Loader2, Save, ListChecks, Mic, FileText,
    AlignLeft, Type, ChevronDown, GripVertical, EyeOff, Eye
} from "lucide-react"

type Question = {
    id: string
    role_target: "teacher" | "reader"
    label: string
    description: string | null
    type: "text" | "textarea" | "select" | "audio" | "file"
    options: string[] | null
    is_required: boolean
    sort_order: number
    is_active: boolean
}

const TYPE_LABELS: Record<Question["type"], { label: string; icon: any }> = {
    text: { label: "نص قصير", icon: Type },
    textarea: { label: "نص طويل", icon: AlignLeft },
    select: { label: "قائمة اختيار", icon: ChevronDown },
    audio: { label: "تسجيل صوتي", icon: Mic },
    file: { label: "ملف PDF", icon: FileText },
}

export default function ApplicationQuestionsPage() {
    const [tab, setTab] = useState<"teacher" | "reader">("teacher")
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [adding, setAdding] = useState(false)
    const [newQ, setNewQ] = useState<Partial<Question>>({
        type: "text",
        is_required: false,
        is_active: true,
        sort_order: 0,
    })
    const [newOptionsRaw, setNewOptionsRaw] = useState("")

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/application-questions?role=${tab}`)
            if (res.ok) {
                const j = await res.json()
                setQuestions(j.data || [])
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [tab])

    const updateQ = async (id: string, patch: Partial<Question>) => {
        setSaving(id)
        try {
            const res = await fetch(`/api/admin/application-questions/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            })
            if (res.ok) {
                const j = await res.json()
                setQuestions(prev => prev.map(q => q.id === id ? j.data : q))
            }
        } finally {
            setSaving(null)
        }
    }

    const removeQ = async (id: string) => {
        if (!confirm("حذف هذا السؤال نهائياً؟")) return
        setSaving(id)
        try {
            await fetch(`/api/admin/application-questions/${id}`, { method: "DELETE" })
            setQuestions(prev => prev.filter(q => q.id !== id))
        } finally {
            setSaving(null)
        }
    }

    const create = async () => {
        if (!newQ.label || !newQ.label.trim()) {
            alert("العنوان مطلوب")
            return
        }
        setAdding(true)
        try {
            const opts = newQ.type === "select"
                ? newOptionsRaw.split("\n").map(s => s.trim()).filter(Boolean)
                : null
            const res = await fetch("/api/admin/application-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role_target: tab,
                    label: newQ.label,
                    description: newQ.description || null,
                    type: newQ.type,
                    options: opts,
                    is_required: !!newQ.is_required,
                    sort_order: questions.length + 1,
                }),
            })
            if (res.ok) {
                const j = await res.json()
                setQuestions(prev => [...prev, j.data])
                setNewQ({ type: "text", is_required: false, is_active: true, sort_order: 0 })
                setNewOptionsRaw("")
            } else {
                alert("فشل الإضافة")
            }
        } finally {
            setAdding(false)
        }
    }

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ListChecks className="w-6 h-6 text-primary" />
                        أسئلة طلب الانضمام
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        تحكم في الأسئلة التي يراها المتقدم لطلب انضمامه (مدرس / مقرئ).
                    </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-1 flex">
                    <button
                        onClick={() => setTab("teacher")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === "teacher" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                            }`}
                    >
                        المدرسين
                    </button>
                    <button
                        onClick={() => setTab("reader")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === "reader" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                            }`}
                    >
                        المقرئين
                    </button>
                </div>
            </div>

            {/* Existing questions */}
            <div className="space-y-3">
                {loading && (
                    <div className="bg-card border border-border rounded-xl p-12 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                )}
                {!loading && questions.length === 0 && (
                    <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                        لا توجد أسئلة بعد. أضف أول سؤال أدناه.
                    </div>
                )}
                {!loading && questions.map((q, idx) => {
                    const TypeIcon = TYPE_LABELS[q.type].icon
                    return (
                        <div
                            key={q.id}
                            className={`bg-card border rounded-xl p-4 space-y-3 transition-all ${q.is_active ? "border-border" : "border-border/40 opacity-60"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex flex-col items-center gap-1 mt-1 text-muted-foreground">
                                    <GripVertical className="w-4 h-4" />
                                    <span className="text-xs font-bold">{idx + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0 space-y-2">
                                    <input
                                        type="text"
                                        defaultValue={q.label}
                                        onBlur={e => {
                                            if (e.target.value !== q.label) updateQ(q.id, { label: e.target.value })
                                        }}
                                        className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                    <textarea
                                        defaultValue={q.description || ""}
                                        rows={1}
                                        placeholder="وصف اختياري للسؤال"
                                        onBlur={e => {
                                            const v = e.target.value || null
                                            if ((v || "") !== (q.description || "")) updateQ(q.id, { description: v })
                                        }}
                                        className="w-full px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs text-muted-foreground focus:ring-2 focus:ring-primary/20 outline-none resize-y"
                                    />
                                    <div className="flex flex-wrap items-center gap-3 text-xs">
                                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-md font-bold">
                                            <TypeIcon className="w-3.5 h-3.5" />
                                            {TYPE_LABELS[q.type].label}
                                        </span>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={q.is_required}
                                                onChange={e => updateQ(q.id, { is_required: e.target.checked })}
                                                className="rounded"
                                            />
                                            <span>مطلوب</span>
                                        </label>
                                        <button
                                            onClick={() => updateQ(q.id, { is_active: !q.is_active })}
                                            className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-muted rounded-md font-bold"
                                            title={q.is_active ? "إخفاء" : "إظهار"}
                                        >
                                            {q.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                            {q.is_active ? "ظاهر" : "مخفي"}
                                        </button>
                                    </div>
                                    {q.type === "select" && (
                                        <textarea
                                            defaultValue={(q.options || []).join("\n")}
                                            rows={3}
                                            placeholder="خيار في كل سطر"
                                            onBlur={e => {
                                                const opts = e.target.value.split("\n").map(s => s.trim()).filter(Boolean)
                                                updateQ(q.id, { options: opts })
                                            }}
                                            className="w-full px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-y"
                                        />
                                    )}
                                </div>
                                <div className="flex flex-col gap-1.5 shrink-0">
                                    {saving === q.id && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                                    <button
                                        onClick={() => removeQ(q.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                        title="حذف"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* New question */}
            <div className="bg-card border border-dashed border-primary/30 rounded-xl p-5 space-y-3">
                <h2 className="font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" /> إضافة سؤال جديد
                </h2>
                <input
                    type="text"
                    value={newQ.label || ""}
                    onChange={e => setNewQ({ ...newQ, label: e.target.value })}
                    placeholder="عنوان السؤال (مثال: لماذا تريد الانضمام؟)"
                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <textarea
                    value={newQ.description || ""}
                    onChange={e => setNewQ({ ...newQ, description: e.target.value })}
                    placeholder="وصف اختياري"
                    rows={2}
                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-y"
                />
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={newQ.type}
                        onChange={e => setNewQ({ ...newQ, type: e.target.value as any })}
                        className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                        {Object.entries(TYPE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!!newQ.is_required}
                            onChange={e => setNewQ({ ...newQ, is_required: e.target.checked })}
                            className="rounded"
                        />
                        مطلوب
                    </label>
                </div>
                {newQ.type === "select" && (
                    <textarea
                        value={newOptionsRaw}
                        onChange={e => setNewOptionsRaw(e.target.value)}
                        placeholder="خيارات القائمة (خيار في كل سطر)"
                        rows={3}
                        className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-y"
                    />
                )}
                <button
                    onClick={create}
                    disabled={adding}
                    className="w-full px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-lg font-bold flex items-center justify-center gap-2"
                >
                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    إضافة السؤال
                </button>
            </div>
        </div>
    )
}
