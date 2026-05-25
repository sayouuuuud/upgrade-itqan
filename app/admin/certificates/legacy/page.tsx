"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import {
    Award, FileText, CheckCircle, ExternalLink,
    Loader2, Clock, Plus, Trash2, Building, Image as ImageIcon,
    Settings, GraduationCap, ChevronRight, Download
} from "lucide-react"

interface University {
    id: string
    name: string
}

interface AuthorizedEntity {
    id: string
    name: string
    seal_url: string | null
}

interface CertificateApplication {
    id: string
    student_id: string
    university?: string
    college?: string
    city?: string
    entity_id?: string
    entity_name?: string
    entity_other?: string
    phone?: string
    age?: number
    pdf_file_url?: string
    certificate_issued: boolean
    certificate_url?: string
    certificate_pdf_url?: string
    student_name: string
    student_email: string
    ceremony_date?: string
    effective_ceremony_date?: string
    effective_ceremony_message?: string
    is_custom_ceremony?: boolean
    recitation_status?: string
    created_at: string
}

export default function CertificatesDashExtendedPage() {
    const { t, locale } = useI18n()
    const isAr = locale === "ar"

    const [activeTab, setActiveTab] = useState<"applications" | "entities" | "universities" | "settings">("applications")
    const [applications, setApplications] = useState<CertificateApplication[]>([])
    const [universities, setUniversities] = useState<University[]>([])
    const [entities, setEntities] = useState<AuthorizedEntity[]>([])

    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"pending" | "issued" | "all">("pending")
    const [issuingId, setIssuingId] = useState<string | null>(null)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const [globalCeremony, setGlobalCeremony] = useState<{ date: string | null, message: string }>({ date: null, message: "" })
    const [platformSealUrl, setPlatformSealUrl] = useState<string | null>(null)

    // Form states
    const [newUniName, setNewUniName] = useState("")
    const [newEntity, setNewEntity] = useState({ name: "", seal_url: "" })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadData()
    }, [filter])

    async function loadData() {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/certificates?status=${filter}`)
            if (res.ok) {
                const data = await res.json()
                setApplications(data.applications || [])
                setUniversities(data.universities || [])
                setEntities(data.entities || [])
                setGlobalCeremony(data.globalCeremony || { date: null, message: "" })
                setPlatformSealUrl(data.platformSealUrl || null)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (action: string, body: any) => {
        setIsSubmitting(true)
        try {
            const res = await fetch("/api/admin/certificates", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, ...body })
            })
            if (res.ok) {
                await loadData()
                return await res.json()
            } else {
                const err = await res.json()
                alert(err.error || "Operation failed")
            }
        } catch (err) {
            alert("Connection error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleIssue = async (id: string) => {
        if (!confirm(t.admin.certificates.confirmIssue)) return
        setIssuingId(id)
        await handleAction("issue", { id })
        setIssuingId(null)
    }

    const handleAddUniversity = async () => {
        if (!newUniName.trim()) return
        await handleAction("add_university", { name: newUniName })
        setNewUniName("")
    }

    const handleDeleteUniversity = async (id: string) => {
        if (!confirm(isAr ? "هل أنت متأكد من حذف هذه الجامعة؟" : "Are you sure?")) return
        await handleAction("delete_university", { id })
    }

    const handleAddEntity = async () => {
        if (!newEntity.name.trim()) return
        await handleAction("add_entity", newEntity)
        setNewEntity({ name: "", seal_url: "" })
    }

    const handleDeleteEntity = async (id: string) => {
        if (!confirm(isAr ? "هل أنت متأكد من حذف هذه الجهة؟" : "Are you sure?")) return
        await handleAction("delete_entity", { id })
    }

    const handleUploadSeal = async (file: File, callback: (url: string) => void) => {
        const formData = new FormData()
        formData.append("image", file)
        formData.append("folder", "seals")
        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData })
            const data = await res.json()
            if (res.ok && data.url) callback(data.url)
        } catch (err) {
            alert("Upload failed")
        }
    }

    const counts = {
        pending: applications.filter(a => !a.certificate_issued).length,
        issued: applications.filter(a => a.certificate_issued).length,
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Award className="w-7 h-7 text-primary" />
                        {t.admin.certificates.title}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isAr ? "إدارة طلبات إصدار الشهادات والجهات المعتمدة والجامعات" : "Manage certificate requests, entities, and universities"}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 bg-muted p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab("applications")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "applications" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        {isAr ? "الطلبات" : "Applications"}
                    </button>
                    <button
                        onClick={() => setActiveTab("entities")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "entities" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        {isAr ? "الجهات" : "Entities"}
                    </button>
                    <button
                        onClick={() => setActiveTab("universities")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "universities" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        {isAr ? "الجامعات" : "Universities"}
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "settings" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* TAB: Applications */}
            {activeTab === "applications" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilter("pending")}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all border ${filter === "pending"
                                ? "border-primary bg-primary text-primary-foreground shadow-md"
                                : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted"
                                }`}
                        >
                            {t.admin.certificates.pendingIssue}
                            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">{counts.pending}</span>
                        </button>
                        <button
                            onClick={() => setFilter("issued")}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all border ${filter === "issued"
                                ? "border-primary bg-primary text-primary-foreground shadow-md"
                                : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted"
                                }`}
                        >
                            {t.admin.certificates.issued}
                            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">{counts.issued}</span>
                        </button>
                        <button
                            onClick={() => setFilter("all")}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all border ${filter === "all"
                                ? "border-primary bg-primary text-primary-foreground shadow-md"
                                : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted"
                                }`}
                        >
                            {t.admin.certificates.all}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="bg-card rounded-2xl border border-border p-12 flex justify-center shadow-sm">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : applications.length === 0 ? (
                            <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm">
                                <Award className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                                <p className="text-muted-foreground font-medium">{t.admin.certificates.noApplications}</p>
                            </div>
                        ) : applications.map((app) => {
                            const isExpanded = expandedId === app.id
                            return (
                                <div key={app.id} className={`bg-card rounded-2xl border transition-all shadow-sm overflow-hidden ${isExpanded ? "border-primary/30 ring-1 ring-primary/10" : "border-border hover:border-border/60"}`}>
                                    <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer select-none" onClick={() => setExpandedId(isExpanded ? null : app.id)}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${app.certificate_issued ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                                                <Award className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground">{app.student_name}</h3>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1 font-medium">
                                                    <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {app.university || "---"}</span>
                                                    <span className="text-muted-foreground/30">|</span>
                                                    <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {app.entity_name || app.entity_other || (isAr ? "منصة إتقان" : "Itqaan")}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {app.certificate_issued ? (
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">
                                                    <CheckCircle className="w-3 h-3" /> {t.admin.certificates.issued}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 uppercase tracking-wider">
                                                    <Clock className="w-3 h-3" /> {t.admin.certificates.pendingIssue}
                                                </span>
                                            )}
                                            {!app.certificate_issued && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleIssue(app.id); }}
                                                    disabled={issuingId === app.id}
                                                    className="bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                                                >
                                                    {issuingId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                                                    {t.admin.certificates.issueCertificate}
                                                </button>
                                            )}
                                          <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="border-t border-border bg-muted/10 p-6 animate-in fade-in duration-200">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{t.admin.certificates.email}</p>
                                                    <p className="text-sm font-bold text-foreground break-all">{app.student_email}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{t.admin.certificates.city}</p>
                                                    <p className="text-sm font-bold text-foreground">{app.city || "---"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{t.admin.certificates.college}</p>
                                                    <p className="text-sm font-bold text-foreground">{app.college || "---"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{isAr ? "رقم الجوال" : "Phone"}</p>
                                                    <p className="text-sm font-bold text-foreground" dir="ltr">{app.phone || "---"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{isAr ? "العمر" : "Age"}</p>
                                                    <p className="text-sm font-bold text-foreground">{app.age || "---"}</p>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {app.certificate_issued && (
                                                        <div className="flex gap-2">
                                                            {app.certificate_url && (
                                                                <a href={app.certificate_url} target="_blank" className="flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 w-fit">
                                                                    <ExternalLink className="w-3.5 h-3.5" /> {t.admin.certificates.digitalCertLink}
                                                                </a>
                                                            )}
                                                            <a
                                                                href={`/api/certificate/download?student_id=${app.student_id}`}
                                                                download
                                                                className="flex items-center gap-2 text-xs text-teal-600 font-bold bg-teal-50 px-3 py-2 rounded-lg border border-teal-100 w-fit"
                                                            >
                                                                <Download className="w-3.5 h-3.5" /> {isAr ? "تحميل PDF" : "Download PDF"}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* TAB: Entities */}
            {activeTab === "entities" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-card p-6 rounded-2xl border border-border shadow-sm h-fit space-y-4">
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                            <Plus className="w-5 h-5 text-[#C9A227]" />
                            {isAr ? "إضافة جهة جديدة" : "Add New Entity"}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wider">{isAr ? "اسم الجهة" : "Entity Name"}</label>
                                <input
                                    type="text"
                                    value={newEntity.name}
                                    onChange={e => setNewEntity({ ...newEntity, name: e.target.value })}
                                    placeholder={isAr ? "مثال: مؤسسة مكة المكرمة" : "e.g. Makkah Foundation"}
                                    className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wider">{isAr ? "الختم الخاص" : "Custom Seal"}</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-border bg-muted/30 overflow-hidden flex items-center justify-center shrink-0">
                                        {newEntity.seal_url ? (
                                            <img src={newEntity.seal_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="seal-upload"
                                        className="hidden"
                                        onChange={e => {
                                            const file = e.target.files?.[0]
                                            if (file) handleUploadSeal(file, url => setNewEntity({ ...newEntity, seal_url: url }))
                                        }}
                                    />
                                    <label htmlFor="seal-upload" className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-xs font-bold cursor-pointer transition-colors border border-border text-foreground">
                                        {isAr ? "رفع ختم" : "Upload Seal"}
                                    </label>
                                </div>
                            </div>
                            <button
                                onClick={handleAddEntity}
                                disabled={isSubmitting || !newEntity.name}
                                className="w-full py-3 bg-[#1B5E3B] hover:bg-[#124028] disabled:bg-muted text-white rounded-xl font-bold shadow-lg shadow-[#1B5E3B]/10 transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {isAr ? "حفظ الجهة" : "Save Entity"}
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {entities.map(entity => (
                            <div key={entity.id} className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-muted/30 border border-border overflow-hidden flex items-center justify-center">
                                        {entity.seal_url ? (
                                            <img src={entity.seal_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <Award className="w-6 h-6 text-[#C9A227] opacity-50" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground text-sm">{entity.name}</h4>
                                        <p className="text-[10px] text-muted-foreground font-medium">{entity.seal_url ? (isAr ? "ختم مفعل" : "Seal Active") : (isAr ? "ختم المنصة" : "Platform Seal")}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteEntity(entity.id)}
                                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: Universities */}
            {activeTab === "universities" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-card p-6 rounded-2xl border border-border shadow-sm h-fit space-y-4">
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-[#C9A227]" />
                            {isAr ? "إضافة جامعة جديدة" : "Add New University"}
                        </h3>
                        <div>
                            <input
                                type="text"
                                value={newUniName}
                                onChange={e => setNewUniName(e.target.value)}
                                placeholder={isAr ? "اسم الجامعة..." : "University name..."}
                                className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                            />
                        </div>
                        <button
                            onClick={handleAddUniversity}
                            disabled={isSubmitting || !newUniName}
                            className="w-full py-3 bg-[#1B5E3B] hover:bg-[#124028] disabled:bg-muted text-white rounded-xl font-bold shadow-lg shadow-[#1B5E3B]/10 transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {isAr ? "إضافة" : "Add"}
                        </button>
                    </div>

                    <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                            {universities.map((uni, idx) => (
                                <div key={uni.id} className={`p-4 flex items-center justify-between group border-border ${idx % 2 === 0 ? "md:border-e" : ""} ${idx < universities.length - 2 ? "border-b" : ""}`}>
                                    <span className="text-sm font-bold text-foreground">{uni.name}</span>
                                    <button
                                        onClick={() => handleDeleteUniversity(uni.id)}
                                        className="p-1 px-2 text-[10px] bg-destructive/10 text-destructive rounded-md font-bold transition-opacity flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" /> {isAr ? "حذف" : "Del"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: Settings */}
            {activeTab === "settings" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6 max-w-2xl mx-auto">
                    {/* Platform Seal */}
                    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-[#C9A227]" />
                            {t.admin.certificates.platformSeal}
                        </h2>
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="w-24 h-24 border-2 border-dashed border-border rounded-full flex items-center justify-center overflow-hidden bg-muted/30">
                                    {platformSealUrl ? (
                                        <img src={platformSealUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <Award className="w-8 h-8 text-muted-foreground/30" />
                                    )}
                                </div>
                                <input
                                    type="file"
                                    id="p-seal"
                                    className="hidden"
                                    onChange={e => {
                                        const file = e.target.files?.[0]
                                        if (file) handleUploadSeal(file, url => handleAction("set_platform_seal", { url }))
                                    }}
                                />
                                <label htmlFor="p-seal" className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity">
                                    {isAr ? "تغيير" : "Change"}
                                </label>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground">{isAr ? "الختم الافتراضي" : "Default Seal"}</p>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    {isAr ? "يستخدم هذا الختم لجميع الشهادات التي لا تنتمي لجهة محددة بختم خاص." : "This seal is used for all certificates that do not belong to a specific entity with a custom seal."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ceremony Settings */}
                    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Clock className="w-5 h-5 text-[#C9A227]" />
                            {t.admin.certificates.unifiedCeremony}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wider">{t.admin.certificates.ceremonyDate}</label>
                                <input
                                    type="datetime-local"
                                    value={globalCeremony.date || ""}
                                    onChange={(e) => setGlobalCeremony(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-foreground transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wider">{t.admin.certificates.additionalMessage}</label>
                                <input
                                    type="text"
                                    value={globalCeremony.message}
                                    onChange={(e) => setGlobalCeremony(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder={t.admin.certificates.ceremonyPlaceholder}
                                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-foreground transition-all"
                                />
                            </div>
                            <button
                                onClick={() => handleAction("set_global_ceremony", globalCeremony)}
                                disabled={isSubmitting}
                                className="w-full py-3 bg-[#1B5E3B] hover:bg-[#124028] disabled:bg-muted text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {t.admin.certificates.saveUnifiedDate}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
