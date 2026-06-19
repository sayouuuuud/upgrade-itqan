"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    BookOpen, Search, Edit, CheckCircle, XCircle,
    TrendingUp, Star, Users, Loader2, Phone, MapPin, ChevronRight, User, Mail, Shield, ShieldAlert,
    Clock, AlertCircle, MessageSquare
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminReadersPage() {
    const { t, locale } = useI18n()
    const a = t.admin
    const isAr = locale === 'ar'
    const router = useRouter()

    const [readers, setReaders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [filterGender, setFilterGender] = useState('')

    const [editReader, setEditReader] = useState<any>(null)
    const [editForm, setEditForm] = useState<any>({})
    const [saving, setSaving] = useState(false)

    const fetchReaders = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), status: 'approved' })
            if (search) params.set('search', search)
            if (filterGender) params.set('gender', filterGender)
            const res = await fetch(`/api/admin/readers?${params}`)
            if (res.ok) {
                const data = await res.json()
                setReaders(data.readers || [])
                setTotal(data.total || 0)
            }
        } finally {
            setLoading(false)
        }
    }, [page, search, filterGender])

    useEffect(() => {
        const timeout = setTimeout(fetchReaders, 300)
        return () => clearTimeout(timeout)
    }, [fetchReaders])

    const openEdit = (r: any) => {
        setEditReader(r)
        setEditForm({
            name: r.name || '',
            phone: r.phone || '',
            city: r.city || '',
            qualification: r.qualification || '',
            memorized_parts: r.memorized_parts || '',
            years_of_experience: r.years_of_experience || 0,
            is_active: !!r.is_active,
            is_accepting_recitations: !!r.is_accepting_recitations,
            is_accepting_students: !!r.is_accepting_students,
            availability_mode: r.availability_mode || 'automatic',
            max_total_slots: r.max_total_slots || 50,
        })
    }

    const handleSave = async () => {
        if (!editReader) return
        setSaving(true)
        try {
            await fetch('/api/admin/readers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editReader.id, ...editForm }),
            })
            setEditReader(null)
            fetchReaders()
        } finally {
            setSaving(false)
        }
    }

    const toggleActive = async (id: string, current: boolean) => {
        await fetch('/api/admin/readers', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, is_active: !current }),
        })
        fetchReaders()
    }

    const totalPages = Math.ceil(total / 20)

    const avatarColors = [
        "from-blue-500/20 to-blue-500/10 text-blue-500 border-blue-500/20",
        "from-emerald-500/20 to-emerald-500/10 text-emerald-500 border-emerald-500/20",
        "from-purple-500/20 to-purple-500/10 text-purple-500 border-purple-500/20",
        "from-orange-500/20 to-orange-500/10 text-orange-500 border-orange-500/20",
        "from-rose-500/20 to-rose-500/10 text-rose-500 border-rose-500/20",
    ]

    return (
        <div className="bg-card min-h-full -m-6 lg:-m-8 p-6 lg:p-8 space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                   <h1 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
                       <Shield className="w-8 h-8 text-primary" />
                       {t.admin.adminReaders.title}
                   </h1>
                   <p className="text-muted-foreground font-bold tracking-wide">{t.admin.adminReaders.description}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-3xl shadow-sm border border-border p-2 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        className="h-12 pr-11 pl-4 rounded-2xl border-border bg-muted/30 focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all font-bold" 
                        placeholder={t.admin.adminReaders.searchPlaceholder} 
                        value={search} 
                        onChange={e => { setSearch(e.target.value); setPage(1) }} 
                    />
                </div>
                <div className="w-full md:w-64 relative">
                    <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <select
                        className="w-full h-12 pr-11 pl-4 rounded-2xl border border-border bg-muted/30 text-sm font-bold text-foreground outline-none focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer appearance-none"
                        value={filterGender}
                        onChange={e => { setFilterGender(e.target.value); setPage(1) }}
                    >
                        <option value="">{t.admin.adminReaders.allGenders}</option>
                        <option value="male">{t.auth.male}</option>
                        <option value="female">{t.auth.female}</option>
                    </select>
                    <ChevronRight className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none rotate-90" />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
                            <div className="flex items-start gap-4">
                                <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                                <div className="space-y-3 flex-1">
                                    <Skeleton className="h-6 w-36" />
                                    <Skeleton className="h-4 w-48" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-5 w-20 rounded-full" />
                                        <Skeleton className="h-5 w-20 rounded-full" />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-border grid grid-cols-3 gap-4">
                                <div className="space-y-2 text-center">
                                    <Skeleton className="h-8 w-12 mx-auto" />
                                    <Skeleton className="h-3 w-16 mx-auto" />
                                </div>
                                <div className="space-y-2 text-center">
                                    <Skeleton className="h-8 w-12 mx-auto" />
                                    <Skeleton className="h-3 w-16 mx-auto" />
                                </div>
                                <div className="space-y-2 text-center">
                                    <Skeleton className="h-8 w-12 mx-auto" />
                                    <Skeleton className="h-3 w-16 mx-auto" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {readers.map((r, idx) => (
                        <div key={r.id} className={`bg-card border rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group relative overflow-hidden ${!r.is_active ? 'border-rose-500/20 bg-rose-500/[0.02]' : 'border-border'}`}>
                            <div className="flex items-start justify-between gap-4 relative z-10">
                                <div className="flex items-start gap-4">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center font-black text-xl shrink-0 shadow-lg group-hover:scale-110 transition-transform border ${avatarColors[idx % avatarColors.length]}`}>
                                        {r.name?.[0] || 'S'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <Link href={`/admin/users/${r.id}`} className="hover:text-primary transition-colors">
                                                <h3 className="font-black text-lg text-foreground truncate max-w-[180px]">{r.name}</h3>
                                            </Link>
                                            <Badge className={`text-[9px] font-black uppercase tracking-widest border pointer-events-none ${r.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-sm shadow-emerald-500/5' : 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-sm shadow-rose-500/5'}`}>
                                                {r.is_active ? t.admin.adminReaders.active : t.admin.adminReaders.inactive}
                                            </Badge>
                                        </div>
                                        <p className="text-xs font-bold text-muted-foreground opacity-60 flex items-center gap-1.5 mb-3">
                                            <Mail className="w-3.5 h-3.5" />
                                            {r.email}
                                        </p>
                                        
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <Badge variant="outline" className={`text-[9px] font-bold h-6 rounded-lg border-border ${r.is_accepting_recitations ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-muted text-muted-foreground'}`}>
                                                {r.is_accepting_recitations ? t.reader.active : t.reader.inactive} {a.rdEvaluation}
                                            </Badge>
                                            <Badge variant="outline" className={`text-[9px] font-bold h-6 rounded-lg border-border ${r.is_accepting_students ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-muted text-muted-foreground'}`}>
                                                {r.is_accepting_students ? t.admin.adminReaders.sessionsActive : t.reader.inactive} {a.rdSessions}
                                            </Badge>
                                            <Badge variant="secondary" className="text-[9px] font-bold h-6 rounded-lg px-2 bg-muted/50 text-muted-foreground border-border uppercase">
                                                {r.gender === 'male' ? t.auth.male : r.gender === 'female' ? t.auth.female : '---'}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground/60 uppercase tracking-tight">
                                            {r.phone && <span className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-lg border border-border/50"><Phone className="w-3 h-3 text-primary/60" />{r.phone}</span>}
                                            {r.city && <span className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-lg border border-border/50"><MapPin className="w-3 h-3 text-primary/60" />{r.city}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="rounded-xl border-border hover:bg-primary hover:text-white hover:border-primary transition-all w-9 h-9" 
                                        onClick={() => router.push(`/admin/conversations?userId=${r.id}&userRole=reader`)}
                                        title={t.admin.messageUser || "Message"}
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="rounded-xl border-border hover:bg-primary hover:text-white hover:border-primary transition-all w-9 h-9" 
                                        onClick={() => openEdit(r)}
                                        title={t.admin.adminReaders.editReader || "Edit"}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className={`rounded-xl border-border transition-all w-9 h-9 ${r.is_active ? 'hover:bg-rose-500 hover:border-rose-500 hover:text-white' : 'hover:bg-emerald-500 hover:border-emerald-500 hover:text-white'}`} 
                                        onClick={() => toggleActive(r.id, r.is_active)}
                                    >
                                        {r.is_active ? <ShieldAlert className="w-4 h-4 text-rose-500 group-hover:text-white" /> : <Shield className="w-4 h-4 text-emerald-500 group-hover:text-white" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-border group-hover:border-primary/20 transition-colors">
                                <div className="text-center group-hover:scale-105 transition-transform">
                                    <p className="text-2xl font-black text-foreground tracking-tighter">{r.total_reviews_completed || 0}</p>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{t.admin.adminReaders.reviewsLabel}</p>
                                </div>
                                <div className="text-center group-hover:scale-105 transition-transform">
                                    <p className="text-2xl font-black text-foreground tracking-tighter">{r.sessions_done || 0}</p>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{t.admin.adminReaders.sessionsLabel}</p>
                                </div>
                                <div className="text-center group-hover:scale-105 transition-transform">
                                    <p className="text-2xl font-black text-primary tracking-tighter">
                                        {r.total_sessions_booked > 0 
                                            ? `${Math.round((r.sessions_done / r.total_sessions_booked) * 100)}%` 
                                            : '—'}
                                    </p>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{t.admin.adminReaders.completionRateLabel}</p>
                                </div>
                            </div>

                            {/* Waiting Metrics */}
                            {(r.waiting_sessions_count > 0 || r.pending_reviews_count > 0) && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {r.waiting_sessions_count > 0 && (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
                                            <Clock className="w-3 h-3" />
                                            <span className="text-[10px] font-black">
                                                {r.waiting_sessions_count} {a.rdWaitingSession}
                                            </span>
                                        </div>
                                    )}
                                    {r.pending_reviews_count > 0 && (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                                            <AlertCircle className="w-3 h-3" />
                                            <span className="text-[10px] font-black">
                                                {r.pending_reviews_count} {a.rdPendingReview}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {r.qualification && (
                                <div className="mt-4 pt-4 border-t border-dashed border-border flex items-center gap-2 group-hover:bg-primary/5 -mx-6 px-6 py-3 transition-colors">
                                    <BookOpen className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                                    <p className="text-[10px] font-bold text-muted-foreground line-clamp-1 leading-relaxed">
                                        <span className="text-foreground/80">{a.rdQualification}</span> {r.qualification}
                                        {r.memorized_parts && (
                                          <>
                                            <span className="mx-2 opacity-30">·</span>
                                            <span className="text-primary truncate">{a.bkgMemorizedParts.replace('{count}', String(r.memorized_parts))}</span>
                                          </>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {readers.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-card rounded-3xl border border-dashed border-border">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                        <BookOpen className="w-8 h-8 text-muted-foreground opacity-30" />
                    </div>
                    <p className="font-black uppercase tracking-widest text-xs text-muted-foreground">{t.admin.adminReaders.noReadersYet}</p>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-6 mt-8 bg-card border border-border p-4 rounded-3xl shadow-sm w-fit mx-auto">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={page <= 1} 
                        onClick={() => setPage(p => p - 1)} 
                        className="rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all px-4"
                    >
                        {a.rdPrevious}
                    </Button>
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">{t.admin.adminReaders.page}</span>
                        <span className="text-sm font-black text-foreground">{page} <span className="text-muted-foreground opacity-40 mx-1">/</span> {totalPages}</span>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={page >= totalPages} 
                        onClick={() => setPage(p => p + 1)} 
                        className="rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all px-4"
                    >
                        {a.rdNext}
                    </Button>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editReader} onOpenChange={() => setEditReader(null)}>
                <DialogContent className="rounded-3xl border-none shadow-2xl bg-card max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-foreground">{t.admin.adminReaders.editReader}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.admin.adminReaders.name}</Label>
                                <Input 
                                    className="h-12 rounded-2xl border-border bg-muted/30 focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                                    value={editForm.name || ''} 
                                    onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.admin.adminReaders.phone}</Label>
                                <Input 
                                    className="h-12 rounded-2xl border-border bg-muted/30 focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                                    value={editForm.phone || ''} 
                                    onChange={e => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} 
                                    dir="ltr" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.admin.adminReaders.city}</Label>
                                <Input 
                                    className="h-12 rounded-2xl border-border bg-muted/30 focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                                    value={editForm.city || ''} 
                                    onChange={e => setEditForm((f: any) => ({ ...f, city: e.target.value }))} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.admin.adminReaders.qualification}</Label>
                                <Input 
                                    className="h-12 rounded-2xl border-border bg-muted/30 focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                                    value={editForm.qualification || ''} 
                                    onChange={e => setEditForm((f: any) => ({ ...f, qualification: e.target.value }))} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.admin.adminReaders.memorizedParts}</Label>
                                <Input 
                                    className="h-12 rounded-2xl border-border bg-muted/30 focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                                    value={editForm.memorized_parts || ''} 
                                    onChange={e => setEditForm((f: any) => ({ ...f, memorized_parts: e.target.value }))} 
                                    type="number" min={0} max={30} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.admin.adminReaders.yearsExperience}</Label>
                                <Input 
                                    className="h-12 rounded-2xl border-border bg-muted/30 focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                                    value={editForm.years_of_experience || 0} 
                                    onChange={e => setEditForm((f: any) => ({ ...f, years_of_experience: Number(e.target.value) }))} 
                                    type="number" min={0} 
                                />
                            </div>
                            <div className="sm:col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.reader.maxTotalSlots}</Label>
                                <Input 
                                    className="h-12 rounded-2xl border-border bg-muted/30 focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                                    value={editForm.max_total_slots || 0} 
                                    onChange={e => setEditForm((f: any) => ({ ...f, max_total_slots: Number(e.target.value) }))} 
                                    type="number" min={0} 
                                />
                            </div>
                        </div>

                        <div className="border-t border-border pt-8 mt-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary mb-5 block border-b border-primary/10 pb-2 w-fit">
                              {a.rdAccountPermissions}
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className={`flex items-center gap-3 p-4 border rounded-2xl transition-all cursor-pointer group/opt ${editForm.is_active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted border-border'}`} onClick={() => setEditForm((f: any) => ({ ...f, is_active: !f.is_active }))}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${editForm.is_active ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground/30'}`}>
                                      {editForm.is_active && <CheckCircle className="w-4 h-4 text-white" />}
                                    </div>
                                    <Label className="cursor-pointer font-black text-xs uppercase tracking-tight group-hover/opt:text-primary transition-colors">{t.admin.adminReaders.accountActive}</Label>
                                </div>
                                <div className={`flex items-center gap-3 p-4 border rounded-2xl transition-all cursor-pointer group/opt ${editForm.is_accepting_recitations ? 'bg-primary/5 border-primary/20' : 'bg-muted border-border'}`} onClick={() => setEditForm((f: any) => ({ ...f, is_accepting_recitations: !f.is_accepting_recitations }))}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${editForm.is_accepting_recitations ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                                      {editForm.is_accepting_recitations && <CheckCircle className="w-4 h-4 text-white" />}
                                    </div>
                                    <Label className="cursor-pointer font-black text-xs uppercase tracking-tight group-hover/opt:text-primary transition-colors">{t.admin.adminReaders.evaluationActive}</Label>
                                </div>
                                <div className={`flex items-center gap-3 p-4 border rounded-2xl transition-all cursor-pointer group/opt ${editForm.is_accepting_students ? 'bg-purple-500/5 border-purple-500/20' : 'bg-muted border-border'}`} onClick={() => setEditForm((f: any) => ({ ...f, is_accepting_students: !f.is_accepting_students }))}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${editForm.is_accepting_students ? 'border-purple-500 bg-purple-500' : 'border-muted-foreground/30'}`}>
                                      {editForm.is_accepting_students && <CheckCircle className="w-4 h-4 text-white" />}
                                    </div>
                                    <Label className="cursor-pointer font-black text-xs uppercase tracking-tight group-hover/opt:text-primary transition-colors">{t.admin.adminReaders.sessionsActive}</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-3 sm:gap-0">
                        <Button 
                            variant="outline" 
                            onClick={() => setEditReader(null)} 
                            className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 border-border"
                        >
                          {t.admin.adminReaders.cancel}
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" 
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                            {t.admin.adminReaders.saveChanges}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
