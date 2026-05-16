"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import {
  UserCheck, UserX, Clock, ChevronRight, GraduationCap,
  BookOpen, Phone, MapPin, CheckCircle, XCircle, AlertCircle,
  Loader2, Mail, Calendar, FileText, ExternalLink, Globe,
  ShieldCheck, BadgeCheck, Search, Trash2, User as UserIcon, Mic,
  RefreshCcw
} from "lucide-react"
import AdminAudioPlayer from "@/components/admin/audio-player"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type AppStatus = "pending_approval" | "approved" | "rejected" | "auto_approved"

type Application = {
  id: string
  name: string
  email: string
  gender: string
  approval_status: AppStatus
  created_at: string
  full_name_triple: string | null
  phone: string | null
  city: string | null
  nationality: string | null
  qualification: string | null
  memorized_parts: string | null
  years_of_experience: number | null
  certificate_file_url: string | null
  audio_url: string | null
  pdf_url: string | null
  rejection_reason: string | null
  rejection_count: number | null
  submitted_at: string | null
  responses: Record<string, any> | null
}

export default function ReaderApplicationsPage() {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | AppStatus>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const loadApps = async () => {
    setFetchError(null)
    try {
      const res = await fetch("/api/admin/reader-applications")
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const msg =
          (data && (data.error || data.detail)) ||
          (isAr ? `فشل تحميل الطلبات (${res.status})` : `Failed to load applications (${res.status})`)
        setFetchError(typeof msg === "string" ? msg : (isAr ? "فشل تحميل الطلبات" : "Failed to load applications"))
        setApplications([])
        return
      }
      setApplications(data.applications || [])
      const firstPending = (data.applications || []).find((a: Application) => a.approval_status === "pending_approval")
      if (firstPending) setSelectedId(firstPending.id)
      else if (data.applications?.length > 0) setSelectedId(data.applications[0].id)
    } catch (err: any) {
      console.error(err)
      setFetchError(err?.message || (isAr ? "تعذّر الاتصال بالخادم" : "Network error"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = applications.filter((app) => {
    const matchesFilter = filter === "all" ||
      (filter === "approved" ? (app.approval_status === "approved" || app.approval_status === "auto_approved") : app.approval_status === filter)
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.full_name_triple?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const counts = {
    all: applications.length,
    pending_approval: applications.filter(a => a.approval_status === "pending_approval").length,
    approved: applications.filter(a => ['approved', 'auto_approved'].includes(a.approval_status)).length,
    rejected: applications.filter(a => a.approval_status === "rejected").length,
  }

  const handleAction = async (userId: string, action: "approve" | "reject", reason?: string) => {
    setProcessingId(userId)
    try {
      const res = await fetch("/api/admin/reader-applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, rejection_reason: reason })
      })

      if (res.ok) {
        const data = await res.json()
        setApplications(prev => prev.map(a => a.id === userId ? { ...a, approval_status: data.status } : a))
        setRejectionDialogOpen(false)
        setRejectionReason("")
        setRejectingUserId(null)
      } else {
        alert(t.admin.errorProcessingApplication)
      }
    } catch {
      alert(t.auth.errorOccurred)
    } finally {
      setProcessingId(null)
    }
  }

  const openRejectDialog = (userId: string) => {
    setRejectingUserId(userId)
    setRejectionReason("")
    setRejectionDialogOpen(true)
  }

  const confirmReject = () => {
    if (rejectingUserId) {
      handleAction(rejectingUserId, "reject", rejectionReason)
    }
  }

  const handleDelete = async (userId: string) => {
    setProcessingId(userId)
    try {
      const res = await fetch(`/api/admin/reader-applications?userId=${userId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setApplications(prev => prev.filter(a => a.id !== userId))
        setSelectedId(null)
      } else {
        alert(isAr ? "حدث خطأ أثناء الحذف" : "Error deleting application")
      }
    } catch {
      alert(t.auth.errorOccurred)
    } finally {
      setProcessingId(null)
    }
  }

  const selectedApp = applications.find(a => a.id === selectedId)

  const statusConfig: Record<AppStatus, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
    pending_approval: {
      label: t.admin.pendingApproval,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    approved: {
      label: t.approved,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
      icon: <CheckCircle className="w-3.5 h-3.5" />,
    },
    auto_approved: {
      label: t.approved,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
    rejected: {
      label: t.rejected,
      color: "text-destructive",
      bg: "bg-destructive/10 border-destructive/20",
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
  }

  return (
    <div className="bg-card min-h-full flex flex-col lg:h-[calc(100vh-120px)] overflow-y-auto lg:overflow-hidden -m-6 lg:-m-8 p-0" dir={isAr ? "rtl" : "ltr"}>
      {/* Header Bar */}
      <div className="bg-card border-b border-border p-5 md:p-8 flex flex-col lg:flex-row justify-between lg:items-center gap-6 z-10 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-4">
            <BadgeCheck className="w-8 h-8 text-primary" />
            {t.admin.readerApplications}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-bold tracking-wide">{t.admin.readerApplicationsDesc}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={isAr ? "البحث عن طلب..." : "Search applications..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-11 pl-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm focus:ring-4 focus:ring-primary/10 transition-all font-bold text-foreground outline-none"
            />
          </div>
          {counts.pending_approval > 0 && (
            <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/5 animate-pulse shrink-0">
              <AlertCircle className="w-3.5 h-3.5" />
              {counts.pending_approval} {isAr ? "طلبات بانتظار المراجعة" : "Pending Reviews"}
            </div>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="px-6 py-3">
          <div className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="break-all">{fetchError}</span>
            </div>
            <button
              onClick={loadApps}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-xl transition-colors shrink-0"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              {isAr ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1 overflow-visible lg:overflow-hidden relative">
        {/* Sidebar List */}
        <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-l border-border bg-card/50 backdrop-blur-sm flex flex-col shrink-0 lg:overflow-hidden relative min-h-[400px] lg:min-h-0">
          {/* Filter Tabs */}
          <div className="p-4 border-b border-border flex gap-2 overflow-x-auto no-scrollbar shrink-0 bg-muted/30">
            {["all", "pending_approval", "approved", "rejected"].map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k as any)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  filter === k
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {k === 'all' ? t.all : k === 'pending_approval' ? t.admin.pendingApproval : k === 'approved' ? t.approved : t.rejected}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-muted/30 rounded-3xl animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                  <UserCheck className="w-8 h-8 text-muted-foreground opacity-20" />
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">{t.admin.noApplicationsFound}</p>
              </div>
            ) : filtered.map((app) => {
              const status = statusConfig[app.approval_status] || statusConfig.pending_approval
              return (
                <button
                  key={app.id}
                  onClick={() => setSelectedId(app.id)}
                  className={cn(
                    "group w-full p-5 rounded-[28px] border-2 transition-all text-right flex flex-col gap-3 relative overflow-hidden",
                    selectedId === app.id
                      ? "bg-primary/5 border-primary shadow-xl shadow-primary/5 active:scale-95"
                      : "bg-card border-transparent hover:border-border hover:bg-muted/30"
                  )}
                >
                  {selectedId === app.id && (
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-primary" />
                  )}
                  <div className="flex justify-between items-center">
                    <span className={cn("text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg border", status.bg, status.color)}>
                      {status.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold tracking-tighter">
                      {new Date(app.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-all duration-500",
                      selectedId === app.id ? "bg-primary text-primary-foreground shadow-2xl scale-110" : "bg-muted text-muted-foreground border border-border"
                    )}>
                      {app.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-foreground text-sm truncate group-hover:text-primary transition-colors">{app.name}</h3>
                      <p className="text-[10px] text-muted-foreground truncate font-bold uppercase tracking-tight opacity-70 mt-0.5">{app.email}</p>
                    </div>
                  </div>
                  {selectedId === app.id && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-opacity">
                      <ChevronRight className={cn("w-5 h-5 text-primary transition-all", isAr ? "rotate-180" : "")} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Detail Content */}
        <div className="flex-1 lg:overflow-y-auto no-scrollbar bg-card/20 p-6 md:p-10 min-h-[500px] lg:min-h-0">
          {selectedApp ? (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
              {/* Hero Card */}
              <div className="bg-card rounded-[40px] p-8 md:p-12 shadow-2xl shadow-foreground/5 border border-border relative overflow-hidden group transition-all duration-500 hover:shadow-primary/5">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-emerald-400 to-primary" />
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors" />

                <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
                  <div className="w-28 h-28 bg-gradient-to-br from-primary to-emerald-600 rounded-[32px] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-primary/20 transition-all duration-700 group-hover:rotate-6 group-hover:scale-110">
                    {selectedApp.name.charAt(0)}
                  </div>

                  <div className="flex-1 space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div>
                        <h2 className="text-4xl font-black text-foreground tracking-tight leading-tight">{selectedApp.full_name_triple || selectedApp.name}</h2>
                        <div className="flex flex-wrap items-center gap-6 mt-4">
                          <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs bg-muted/50 px-3 py-2 rounded-xl border border-border">
                            <Mail className="w-4 h-4 text-primary" />
                            {selectedApp.email}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs bg-muted/50 px-3 py-2 rounded-xl border border-border">
                            <Phone className="w-4 h-4 text-primary" />
                            {selectedApp.phone || "---"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {selectedApp.approval_status === "pending_approval" ? (
                          <>
                            <Button
                              onClick={() => openRejectDialog(selectedApp.id)}
                              disabled={!!processingId}
                              variant="outline"
                              className="rounded-2xl h-14 px-8 border-destructive/20 text-destructive font-black text-xs uppercase tracking-widest hover:bg-destructive/10 transition-all"
                            >
                              {isAr ? "رفض الطلب" : "Reject"}
                            </Button>
                            <Button
                              onClick={() => handleAction(selectedApp.id, "approve")}
                              disabled={!!processingId}
                              className="rounded-2xl h-14 px-10 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
                            >
                              {processingId === selectedApp.id ? <Loader2 className="w-5 h-5 animate-spin" /> : isAr ? "اعتماد القارئ" : "Approve Reader"}
                            </Button>
                          </>
                        ) : (
                          (() => {
                            const status = statusConfig[selectedApp.approval_status] || statusConfig.pending_approval
                            return (
                              <div className={cn("h-14 px-8 rounded-2xl border-2 flex items-center gap-3 font-black text-[11px] uppercase tracking-widest", status.bg, status.color)}>
                                {status.icon}
                                {status.label}
                              </div>
                            )
                          })()
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              disabled={!!processingId}
                              variant="outline"
                              className="w-14 h-14 rounded-2xl border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/40 transition-all p-0"
                            >
                              <Trash2 className="w-6 h-6" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[40px] border-none shadow-2xl p-10 bg-card max-w-lg">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-2xl font-black text-destructive flex items-center gap-3">
                                <Trash2 className="w-7 h-7" />
                                {isAr ? "حذف طلب المقرئ" : "Delete Reader Application"}
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground font-bold leading-relaxed pt-2">
                                {isAr
                                  ? `هل أنت متأكد من حذف طلب التسجيل الخاص بـ "${selectedApp.full_name_triple || selectedApp.name}"? سيتم حذف الحساب وجميع البيانات المرتبطة نهائياً.`
                                  : `Are you sure you want to delete the application for "${selectedApp.full_name_triple || selectedApp.name}"? This action is permanent.`}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="pt-6 gap-3">
                              <AlertDialogCancel className="rounded-2xl h-12 font-black border-border">{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(selectedApp.id)}
                                className="rounded-2xl h-12 bg-destructive text-destructive-foreground font-black hover:bg-destructive/90 shadow-xl shadow-destructive/20"
                              >
                                {processingId === selectedApp.id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : (isAr ? "حذف نهائياً" : "Delete Permanently")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio test */}
              {selectedApp.audio_url && (
                <div className="bg-card border border-border rounded-[32px] p-6 space-y-3">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Mic className="w-4 h-4 text-blue-600" />
                    {isAr ? "الاختبار الصوتي" : "Audio Test"}
                  </h3>
                  <AdminAudioPlayer src={selectedApp.audio_url} label={isAr ? "تسجيل المتقدم" : "Applicant recording"} />
                </div>
              )}

              {/* Previous rejection reason */}
              {selectedApp.approval_status === "rejected" && selectedApp.rejection_reason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                  <p className="text-xs font-black text-red-700 dark:text-red-300 mb-1 uppercase tracking-widest">
                    {isAr ? "سبب الرفض" : "Rejection reason"}
                  </p>
                  <p className="text-sm text-red-900 dark:text-red-200 whitespace-pre-wrap">{selectedApp.rejection_reason}</p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: GraduationCap, label: t.readerRegister.qualification, val: selectedApp.qualification || "---", color: "blue" },
                  { icon: BookOpen, label: t.readerRegister.memorizedParts, val: `${selectedApp.memorized_parts || "---"} ${isAr ? "جزءاً" : "Parts"}`, color: "emerald" },
                  { icon: Clock, label: t.readerRegister.years_of_experience, val: `${selectedApp.years_of_experience || 0} ${t.years}`, color: "purple" },
                  { icon: Globe, label: t.readerRegister.nationality, val: selectedApp.nationality || "---", color: "orange" }
                ].map((stat, i) => (
                   <div key={i} className="bg-card p-6 md:p-8 rounded-[32px] border border-border shadow-sm flex flex-col gap-2 group hover:border-primary/20 transition-all duration-500">
                    <div className={cn(
                        "p-3 w-fit rounded-2xl group-hover:scale-110 transition-transform duration-500",
                        stat.color === 'blue' && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                        stat.color === 'emerald' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        stat.color === 'purple' && "bg-purple-500/10 text-purple-600 dark:text-purple-400",
                        stat.color === 'orange' && "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    )}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-2">{stat.label}</span>
                    <span className="text-foreground font-black text-xl tracking-tight leading-tight group-hover:text-primary transition-colors">{stat.val}</span>
                  </div>
                ))}
              </div>

              {/* Documents & Detailed Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Documents Card */}
                <div className="bg-card rounded-[32px] p-8 border border-border shadow-sm overflow-hidden flex flex-col group">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-black text-foreground tracking-tight">{isAr ? "الوثائق المرفقة" : "Documents"}</h3>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    {selectedApp.certificate_file_url ? (
                      selectedApp.certificate_file_url.split(',').filter(Boolean).map((url, idx) => (
                        <Dialog key={idx}>
                          <DialogTrigger asChild>
                             <button className="w-full h-20 px-5 bg-muted/30 border border-border rounded-2xl flex items-center justify-between transition-all hover:bg-card hover:border-primary/20 group/doc">
                              <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-primary/10 text-primary rounded-xl group-hover/doc:scale-110 transition-all">
                                  <FileText className="w-6 h-6" />
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-black text-foreground mb-1">{isAr ? `وثيقة ${idx + 1}` : `Document ${idx + 1}`}</p>
                                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">{isAr ? "اضغط للمراجعة" : "Click to review"}</p>
                                </div>
                              </div>
                              <ExternalLink className="w-5 h-5 text-muted-foreground group-hover/doc:text-primary transition-colors" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl h-[95vh] p-0 overflow-hidden bg-card border-none rounded-[40px] flex flex-col shadow-2xl">
                            <DialogHeader className="p-6 border-b border-border flex flex-row items-center justify-between shrink-0 bg-muted/30">
                              <DialogTitle className="flex items-center gap-3 text-lg font-black text-foreground" dir="ltr">
                                <span className="truncate max-w-md">{selectedApp.full_name_triple || selectedApp.name}</span>
                                <Badge variant="outline" className="rounded-lg">{isAr ? `وثيقة ${idx + 1}` : `Document ${idx + 1}`}</Badge>
                              </DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-auto p-6 bg-muted/20 flex flex-col items-center">
                              {(() => {
                                const isUploadThing = url.includes('utfs.io') || url.includes('uploadthing.com')
                                const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i) || false
                                const isPdf = url.toLowerCase().includes('.pdf') ||
                                  (isUploadThing && !isImage)

                                return (
                                  <div className="w-full max-w-4xl">
                                    {isPdf ? (
                                      <div className="w-full aspect-[1/1.4] rounded-[32px] overflow-hidden shadow-2xl border-4 border-card">
                                        <iframe src={`${url}#view=FitH`} className="w-full h-full border-none bg-white" title={`Document ${idx + 1}`} />
                                      </div>
                                    ) : (
                                      <img src={url} alt={`Document ${idx + 1}`} className="w-full h-auto rounded-[32px] shadow-2xl border border-border bg-white" />
                                    )}
                                  </div>
                                )
                              })()}
                            </div>
                            <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-3 shrink-0">
                               <button onClick={() => window.open(url, '_blank')} className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                {isAr ? "تحميل الملف" : "Download File"}
                               </button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))
                    ) : (
                      <div className="py-12 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center opacity-40">
                        <FileText className="w-10 h-10 mb-2" />
                        <span className="text-xs font-black uppercase tracking-widest">{isAr ? "لا توجد وثائق" : "No documents"}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Details Card */}
                <div className="bg-primary text-primary-foreground rounded-[32px] p-8 shadow-2xl shadow-primary/20 relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                  
                  <h3 className="text-xl font-black mb-8 flex items-center gap-3 relative">
                    <ShieldCheck className="w-6 h-6" />
                    {isAr ? "معلومات إضافية" : "Additional Info"}
                  </h3>

                  <div className="grid grid-cols-1 gap-8 relative flex-1">
                    {[
                      { icon: MapPin, label: isAr ? "المدينة والمنطقة" : "City & Region", val: selectedApp.city || "---" },
                      { icon: UserIcon, label: t.readerRegister.gender, val: selectedApp.gender === 'male' ? t.auth.male : t.auth.female },
                      { icon: Calendar, label: isAr ? "تاريخ تقديم الطلب" : "Application Date", val: new Date(selectedApp.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) },
                      { icon: BadgeCheck, label: isAr ? "وقت التقديم" : "Application Time", val: new Date(selectedApp.created_at).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }) }
                    ].map((detail, i) => (
                      <div key={i} className="flex items-center gap-5 group">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 transition-transform duration-500 group-hover:scale-110">
                          <detail.icon className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{detail.label}</p>
                          <p className="text-lg font-black tracking-tight">{detail.val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
              <div className="w-32 h-32 bg-muted/50 rounded-[48px] border border-border shadow-inner flex items-center justify-center mb-8 animate-bounce transition-all duration-1000">
                <UserCheck className="w-12 h-12 text-muted-foreground opacity-20" />
              </div>
              <h3 className="text-2xl font-black text-foreground uppercase tracking-widest">{isAr ? "اختر طلباً للمراجعة" : "Choose an application"}</h3>
              <p className="text-muted-foreground font-bold max-w-sm mx-auto mt-4 leading-relaxed">
                {isAr ? "سيتم عرض جميع التفاصيل والوثائق والمؤهلات هنا بمجرد اختيار طلب من القائمة." : "Detailed credentials and certificates will be visible upon selection."}
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 bg-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-destructive flex items-center gap-3">
              <XCircle className="w-6 h-6" />
              {isAr ? "رفض طلب المقرئ" : "Reject Reader Application"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-muted-foreground text-sm">
              {isAr ? "يرجى إدخال سبب الرفض (اختياري). سيتم إرسال هذا السبب للمتقدم عبر البريد الإلكتروني." : "Please enter a rejection reason (optional). This will be sent to the applicant via email."}
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={isAr ? "سبب الرفض..." : "Rejection reason..."}
              className="w-full h-32 p-4 bg-muted/50 border border-border rounded-2xl text-sm resize-none focus:ring-2 focus:ring-destructive/20 outline-none"
            />
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setRejectionDialogOpen(false)}
                className="flex-1 h-12 rounded-xl font-bold"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={confirmReject}
                disabled={!!processingId}
                className="flex-1 h-12 rounded-xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {processingId ? <Loader2 className="w-5 h-5 animate-spin" /> : (isAr ? "تأكيد الرفض" : "Confirm Reject")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
