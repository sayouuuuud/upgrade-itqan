"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/status-badge"
import {
  Search, Download, Plus, Eye, UserPlus, Filter, Loader2, Clock, CheckCircle, Calendar,
  Hash, User as UserIcon, BookOpen as BookIcon, ChevronRight, Mic
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { TableSkeleton } from "@/components/admin/skeletons"
import { downloadCsv } from "@/lib/csv-export"

export default function AdminRecitationsPage() {
  const { t, locale } = useI18n()
  const a = t.admin
  const isAr = locale === "ar"

  const [recitations, setRecitations] = useState<any[]>([])
  const [readers, setReaders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [readerSearchQuery, setReaderSearchQuery] = useState("")
  const [readerFilter, setReaderFilter] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const [reassignDialog, setReassignDialog] = useState(false)
  const [selectedRecitationId, setSelectedRecitationId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchRecitations()
  }, [searchQuery, readerFilter, activeTab])

  useEffect(() => {
    fetchReaders()
  }, [])

  const fetchRecitations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (readerFilter) params.append("reader", readerFilter)
      if (activeTab === "unassigned") {
        params.append("unassigned", "true")
      } else if (activeTab !== "all") {
        params.append("status", activeTab)
      }

      const res = await fetch(`/api/admin/recitations?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setRecitations(data.recitations || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchReaders = async () => {
    try {
      const res = await fetch("/api/admin/users?role=reader")
      if (res.ok) {
        const data = await res.json()
        setReaders(data.users || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleReassign = async (readerId: string) => {
    if (!selectedRecitationId) return
    setProcessing(true)
    try {
      const res = await fetch("/api/admin/recitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recitationId: selectedRecitationId, readerId })
      })
      if (res.ok) {
        setReassignDialog(false)
        fetchRecitations()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const openReassignDialog = (recId: string) => {
    setSelectedRecitationId(recId)
    setReaderSearchQuery("")
    setReassignDialog(true)
  }

  const handleExport = () => {
    const headers = [
      "ID", t.auth.student, a.rcEmailHeader, t.admin.surahAyahs,
      t.admin.assignedReader, t.admin.sessionReader, t.reader.status, t.admin.submissionDate,
    ]
    const rows = recitations.map((rec) => [
      rec.id,
      rec.studentName || "",
      rec.studentEmail || "",
      `${rec.surah} (${rec.fromAyah}-${rec.toAyah})`,
      rec.assignedReaderName || "",
      rec.sessionReaderName || "",
      rec.status || "",
      new Date(rec.createdAt).toISOString(),
    ])
    downloadCsv(`recitations-${new Date().toISOString().slice(0, 10)}`, headers, rows)
  }

  const avatarColors = [
    "bg-primary/10 text-primary border-primary/20",
    "bg-blue-500/10 text-blue-500 border-blue-500/20",
    "bg-purple-500/10 text-purple-500 border-purple-500/20",
    "bg-orange-500/10 text-orange-500 border-orange-500/20",
    "bg-rose-500/10 text-rose-500 border-rose-500/20",
  ]

  return (
    <div className="bg-card min-h-full -m-6 lg:-m-8 p-6 lg:p-8 space-y-8" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
            <Mic className="w-8 h-8 text-primary" />
            {t.admin.recitationsManagement}
          </h1>
          <p className="text-muted-foreground font-bold tracking-wide">
            {t.admin.recitationsManagementDesc}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExport}
          disabled={recitations.length === 0}
          className="w-full md:w-auto rounded-2xl font-black border-border hover:bg-muted h-11 px-6 gap-2 shrink-0 disabled:opacity-50"
        >
          <Download className="w-4 h-4 ml-1" />
          {t.admin.exportReport}
        </Button>
      </div>

      {/* Filters & Tabs Section */}
      <div className="bg-card rounded-3xl shadow-sm border border-border p-2 space-y-4">
        {/* Status Tabs */}
        <div className="flex p-1 bg-muted/50 rounded-2xl w-full sm:w-fit gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: t.admin.allStatuses, icon: Filter },
            { id: "unassigned", label: t.admin.unassignedRecitations, icon: UserPlus, count: recitations.filter(r => !r.assignedReaderId && r.status === 'pending').length },
            { id: "pending", label: t.pending, icon: Clock },
            { id: "in_review", label: t.inReview, icon: Search },
            { id: "mastered", label: t.mastered, icon: CheckCircle },
            { id: "needs_session", label: t.needsSession, icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0 ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === 'unassigned' && tab.count && tab.count > 0 && (
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-rose-500 text-white text-[9px] flex items-center justify-center rounded-full font-black border-2 border-card shadow-lg shadow-rose-500/20">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Reader Filter Row */}
        <div className="flex flex-col lg:flex-row gap-4 p-2">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t.admin.searchRecitationsPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pr-11 pl-4 rounded-2xl border-border bg-muted/30 focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all font-bold"
            />
          </div>
          <div className="w-full lg:w-72 relative">
            <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select
              className="w-full h-12 pr-11 pl-4 rounded-2xl border border-border bg-muted/30 text-sm font-bold text-foreground outline-none focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer appearance-none"
              value={readerFilter}
              onChange={(e) => setReaderFilter(e.target.value)}
            >
              <option value="">{t.admin.allReaders}</option>
              {readers.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <ChevronRight className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none rotate-90" />
          </div>
          {(searchQuery || readerFilter || activeTab !== "all") && (
            <Button
              onClick={() => {
                setSearchQuery("")
                setReaderFilter("")
                setActiveTab("all")
              }}
              variant="ghost"
              className="h-12 px-6 text-xs font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 rounded-2xl shrink-0"
            >
              {a.rcResetFilters}
            </Button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-[11px] font-black uppercase tracking-widest border-b border-border">
                  <th className="px-6 py-5 whitespace-nowrap">ID</th>
                  <th className="px-6 py-5 whitespace-nowrap">{t.auth.student}</th>
                  <th className="px-6 py-5 whitespace-nowrap">{t.admin.surahAyahs}</th>
                  <th className="px-6 py-5 whitespace-nowrap">{t.admin.assignedReader}</th>
                  <th className="px-6 py-5 whitespace-nowrap">{t.admin.sessionReader}</th>
                  <th className="px-6 py-5 whitespace-nowrap">{t.reader.status}</th>
                  <th className="px-6 py-5 whitespace-nowrap">{t.admin.submissionDate}</th>
                  <th className="px-6 py-5 text-center whitespace-nowrap">{t.admin.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recitations.length > 0 ? recitations.map((rec, idx) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-muted/30 transition-all group border-transparent whitespace-nowrap"
                  >
                    <td className="px-6 py-5">
                      <Link href={`/admin/recitations/${rec.id}`} className="text-[10px] font-black text-muted-foreground hover:text-primary transition-colors bg-muted/50 px-2 py-1 rounded-lg border border-border">
                        #{rec.id.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 border transition-all group-hover:scale-110 ${avatarColors[idx % avatarColors.length]}`}>
                          {(rec.studentName || "S").charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/users/${rec.studentId}`} className="font-black text-foreground text-sm leading-tight group-hover:text-primary transition-colors truncate block">
                            {rec.studentName}
                          </Link>
                          <p className="text-[10px] font-bold text-muted-foreground truncate opacity-60">
                            {rec.studentEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-foreground font-bold text-xs bg-muted/30 px-3 py-1.5 rounded-xl border border-border w-fit">
                        <BookIcon className="w-3.5 h-3.5 text-primary" />
                        {rec.surah} <span className="text-muted-foreground opacity-60">({rec.fromAyah}-{rec.toAyah})</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <UserIcon className="w-3.5 h-3.5 opacity-40 shrink-0" />
                        {rec.assignedReaderId ? (
                          <Link href={`/admin/users/${rec.assignedReaderId}`} className="truncate max-w-[120px] hover:text-primary transition-colors">
                            {rec.assignedReaderName}
                          </Link>
                        ) : (
                          <span className="truncate max-w-[120px]">---</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {rec.sessionReaderName ? (
                        <div className="flex flex-col gap-0.5">
                          <Link href={`/admin/users/${rec.sessionReaderId}`} className="text-xs font-black text-primary truncate max-w-[120px] hover:underline">
                            {rec.sessionReaderName}
                          </Link>
                          {rec.bookingSlotStart && (
                            <span className="text-[10px] text-muted-foreground font-bold tracking-tighter flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-primary/40" />
                              {new Date(rec.bookingSlotStart).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest">{t.none || "---"}</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col text-[10px] font-black text-muted-foreground uppercase tracking-tight">
                        <span className="text-foreground">
                          {new Date(rec.createdAt).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                        </span>
                        <span className="opacity-40">
                          {new Date(rec.createdAt).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <Link
                          href={`/admin/recitations/${rec.id}`}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20"
                          title={t.viewDetails}
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </Link>
                        <button
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20"
                          onClick={() => openReassignDialog(rec.id)}
                        >
                          <UserPlus className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Mic className="w-12 h-12 opacity-20 mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs">{t.admin.noRecitationsFound}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info using semantic classes */}
        <div className="bg-muted/30 px-6 py-5 border-t border-border flex items-center justify-between">
          <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            {t.admin.totalResults.replace('{count}', recitations.length.toString())}
          </div>
        </div>
      </div>

      {/* Reassign Dialog */}
      <Dialog open={reassignDialog} onOpenChange={setReassignDialog}>
        <DialogContent className="rounded-3xl border-none shadow-2xl bg-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">
              {t.admin.assignReader}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-bold">
              {a.rcSelectReader}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-6">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={a.rcSearchPlaceholder}
                value={readerSearchQuery}
                onChange={(e) => setReaderSearchQuery(e.target.value)}
                className="w-full h-11 pr-11 pl-4 rounded-2xl border-border bg-muted/30 focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all font-bold"
              />
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
              {readers.filter(r => 
                !readerSearchQuery || 
                r.name.toLowerCase().includes(readerSearchQuery.toLowerCase()) || 
                r.email.toLowerCase().includes(readerSearchQuery.toLowerCase()) ||
                r.id.toLowerCase().includes(readerSearchQuery.toLowerCase())
              ).length > 0 ? readers.filter(r => 
                !readerSearchQuery || 
                r.name.toLowerCase().includes(readerSearchQuery.toLowerCase()) || 
                r.email.toLowerCase().includes(readerSearchQuery.toLowerCase()) ||
                r.id.toLowerCase().includes(readerSearchQuery.toLowerCase())
              ).map((reader) => (
              <button
                key={reader.id}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border hover:bg-card hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all text-right group/r active:scale-95"
                onClick={() => handleReassign(reader.id)}
                disabled={processing}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black group-hover/r:scale-110 transition-transform">
                    {reader.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-foreground transition-colors group-hover/r:text-primary">
                        {reader.name}
                      </p>
                      <Badge className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border pointer-events-none ${reader.is_accepting_recitations ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                        {reader.is_accepting_recitations ? t.reader.active : t.reader.inactive}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                      {t.auth.reader}
                    </p>
                  </div>
                </div>
                <div className="bg-card px-2 py-1 rounded-lg border border-border shadow-sm flex items-center gap-1">
                  <span className="text-[11px] text-primary font-black">
                    {reader.rating || "5.0"}
                  </span>
                  <span className="text-[10px] text-primary">★</span>
                </div>
              </button>
            )) : (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                <UserIcon className="w-12 h-12 opacity-20 mb-3" />
                <p className="font-black uppercase tracking-widest text-[10px]">{t.admin.noReadersFound}</p>
              </div>
            )}
            
            <button
              className="w-full flex items-center justify-center p-4 rounded-2xl bg-rose-500/10 text-rose-500 border-2 border-dashed border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all mt-6 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-rose-500/5 active:scale-95"
              onClick={() => handleReassign("")}
              disabled={processing}
            >
              {a.rcUnassignReader}
            </button>
          </div>
        </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignDialog(false)} className="rounded-2xl font-black w-full h-11 border-border">
              {t.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
