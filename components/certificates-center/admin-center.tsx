"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useI18n } from "@/lib/i18n/context"

// Shared admin centre, parameterised by scope. Both the academy
// (/api/academy/admin/certificates/*) and the maqraa
// (/api/admin/certificates-center/*) backends conform to the same
// contract, so the UI is identical aside from the base URL.
interface CenterContext {
  apiBase: string
  scope: "academy" | "maqraa"
}
const CenterCtx = createContext<CenterContext>({
  apiBase: "/api/academy/admin/certificates",
  scope: "academy",
})
function useApiBase() {
  return useContext(CenterCtx).apiBase
}
import {
  Award,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Upload as UploadIcon,
  XCircle,
  Globe,
  Star,
  Image as ImageIcon,
  ExternalLink,
  Search,
  Layout,
  Eye,
} from "lucide-react"
import { CertificateTemplateEditor } from "@/components/academy/certificate-editor/template-editor"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"

const KINDS = [
  { value: "course", label_ar: "الدورات", label_en: "Courses" },
  { value: "learning_path", label_ar: "المسار التعليمي", label_en: "Learning Path" },
  { value: "memorization_path", label_ar: "مسار الحفظ", label_en: "Memorization" },
  { value: "tajweed_path", label_ar: "مسار التجويد", label_en: "Tajweed" },
  { value: "series", label_ar: "السلاسل", label_en: "Series" },
  { value: "competition", label_ar: "المسابقات", label_en: "Competitions" },
  { value: "recitation", label_ar: "التلاوة", label_en: "Recitation" },
  { value: "custom", label_ar: "مخصصة", label_en: "Custom" },
] as const

const LANGUAGES = [
  { value: "ar", label_ar: "العربية", label_en: "Arabic" },
  { value: "en", label_ar: "الإنجليزية", label_en: "English" },
] as const

interface Template {
  id: string
  scope: string
  kind: string
  language: "ar" | "en"
  name: string
  description: string | null
  template_url: string
  field_positions: Record<string, unknown>
  is_default: boolean
  is_active: boolean
  created_at: string
  created_by_name?: string | null
}

interface IssuanceRequest {
  id: string
  scope: string
  kind: string
  status: string
  student_name: string
  student_email: string
  source_label: string | null
  template_id: string | null
  template_name: string | null
  language: string
  data: Record<string, unknown>
  certificate_number: string | null
  rank: number | null
  reason: string | null
  rejection_reason: string | null
  requested_at: string
  submitted_at: string | null
  approved_at: string | null
  issued_at: string | null
}

interface IssuedCert {
  id: string
  kind: string
  language: string
  certificate_number: string | null
  serial_code: string | null
  pdf_url: string | null
  issued_at: string
  source_label: string | null
  student_name: string
  student_email: string
  template_name: string | null
}

interface CertificatesAdminCenterProps {
  apiBase?: string
  scope?: "academy" | "maqraa"
  title_ar?: string
  title_en?: string
  subtitle_ar?: string
  subtitle_en?: string
}

export default function CertificatesAdminCenter({
  apiBase = "/api/academy/admin/certificates",
  scope = "academy",
  title_ar = "مركز الشهادات",
  title_en = "Certificates Center",
  subtitle_ar = "إدارة قوالب الشهادات، الإعدادات، وطلبات الإصدار للأكاديمية.",
  subtitle_en = "Manage certificate templates, settings, and issuance requests for the Academy.",
}: CertificatesAdminCenterProps = {}) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const lbl = (k: typeof KINDS[number]) => (isAr ? k.label_ar : k.label_en)
  const langLbl = (l: typeof LANGUAGES[number]) => (isAr ? l.label_ar : l.label_en)

  const [tab, setTab] = useState<"requests" | "issued" | "templates" | "settings">("requests")

  return (
    <CenterCtx.Provider value={{ apiBase, scope }}>
    <div className="space-y-8 pb-12" dir={isAr ? "rtl" : "ltr"}>
      {/* Modern Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card border border-border/40 p-6 sm:p-8 rounded-[2rem] shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <Award className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {isAr ? title_ar : title_en}
            </h1>
            <p className="text-base text-muted-foreground mt-1.5 font-medium">
              {isAr ? subtitle_ar : subtitle_en}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="bg-muted/40 p-1.5 rounded-2xl grid w-full grid-cols-2 md:grid-cols-4 gap-1.5 h-auto">
          <TabsTrigger value="requests" className="gap-2 rounded-xl py-3 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            <FileText className="w-4 h-4" />
            {isAr ? "الطلبات" : "Requests"}
          </TabsTrigger>
          <TabsTrigger value="issued" className="gap-2 rounded-xl py-3 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            <CheckCircle2 className="w-4 h-4" />
            {isAr ? "الصادرة" : "Issued"}
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2 rounded-xl py-3 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            <Sparkles className="w-4 h-4" />
            {isAr ? "القوالب" : "Templates"}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 rounded-xl py-3 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            <Settings className="w-4 h-4" />
            {isAr ? "الإعدادات" : "Settings"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-8">
          <RequestsTab isAr={isAr} kindLabel={(k) => lbl(KINDS.find((x) => x.value === k) || KINDS[0])} />
        </TabsContent>
        <TabsContent value="issued" className="mt-8">
          <IssuedTab isAr={isAr} kindLabel={(k) => lbl(KINDS.find((x) => x.value === k) || KINDS[0])} />
        </TabsContent>
        <TabsContent value="templates" className="mt-8">
          <TemplatesTab isAr={isAr} lbl={lbl} langLbl={langLbl} />
        </TabsContent>
        <TabsContent value="settings" className="mt-8">
          <SettingsTab isAr={isAr} />
        </TabsContent>
      </Tabs>
    </div>
    </CenterCtx.Provider>
  )
}

// -------- Requests Tab --------
function RequestsTab({
  isAr,
  kindLabel,
}: {
  isAr: boolean
  kindLabel: (k: string) => string
}) {
  const apiBase = useApiBase()
  const [items, setItems] = useState<IssuanceRequest[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [status, setStatus] = useState<string>("all")
  const [kind, setKind] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [activeReq, setActiveReq] = useState<IssuanceRequest | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  async function load() {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (status !== "all") qs.set("status", status)
      if (kind !== "all") qs.set("kind", kind)
      const res = await fetch(`${apiBase}/requests?${qs}`)
      const data = await res.json()
      setItems(data.requests || [])
      setCounts(data.counts || {})
    } finally {
      setLoading(false)
    }
  }

  async function loadTemplates() {
    const res = await fetch(`${apiBase}/templates`)
    const data = await res.json()
    setTemplates(data.templates || [])
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [status, kind])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTemplates()
  }, [])

  async function doAction(id: string, body: Record<string, unknown>) {
    setBusy(id)
    try {
      const res = await fetch(`${apiBase}/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        toast({
          variant: "destructive",
          title: isAr ? "تعذر تنفيذ العملية" : "Action failed",
          description: e.error || "",
        })
      } else {
        toast({ title: isAr ? "تم بنجاح" : "Done" })
        await load()
        setActiveReq(null)
        setRejectReason("")
      }
    } finally {
      setBusy(null)
    }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, { ar: string; en: string; cls: string }> = {
      data_required: { ar: "بانتظار بيانات الطالب", en: "Awaiting student data", cls: "bg-orange-100 text-orange-800 border-orange-200" },
      submitted: { ar: "بانتظار المراجعة", en: "Awaiting review", cls: "bg-blue-100 text-blue-800 border-blue-200" },
      approved: { ar: "معتمد", en: "Approved", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      issued: { ar: "تم الإصدار", en: "Issued", cls: "bg-purple-100 text-purple-800 border-purple-200" },
      rejected: { ar: "مرفوض", en: "Rejected", cls: "bg-red-100 text-red-800 border-red-200" },
    }
    const v = map[s] || { ar: s, en: s, cls: "bg-muted text-foreground border-border" }
    return <Badge className={`${v.cls} font-bold rounded-lg border shadow-sm`}>{isAr ? v.ar : v.en}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Sleek Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-card border border-border/40 p-4 rounded-3xl shadow-sm">
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <Label className="text-xs font-bold text-muted-foreground px-1">{isAr ? "الحالة" : "Status"}</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full h-11 bg-muted/30 border-0 rounded-2xl hover:bg-muted/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
              <SelectItem value="submitted">{isAr ? "بانتظار المراجعة" : "Submitted"}</SelectItem>
              <SelectItem value="data_required">{isAr ? "بانتظار البيانات" : "Awaiting data"}</SelectItem>
              <SelectItem value="approved">{isAr ? "معتمد" : "Approved"}</SelectItem>
              <SelectItem value="issued">{isAr ? "صادر" : "Issued"}</SelectItem>
              <SelectItem value="rejected">{isAr ? "مرفوض" : "Rejected"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <Label className="text-xs font-bold text-muted-foreground px-1">{isAr ? "النوع" : "Kind"}</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="w-full h-11 bg-muted/30 border-0 rounded-2xl hover:bg-muted/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
              {KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {isAr ? k.label_ar : k.label_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:ms-auto text-xs bg-muted/30 p-2 rounded-2xl">
          {(["submitted", "data_required", "approved", "issued", "rejected"] as const).map((s) => (
            <Badge key={s} variant="outline" className="font-bold py-1.5 px-3 rounded-xl border-border/50 bg-background/50 shadow-sm">
              {statusBadge(s)} <span className="mx-2 text-muted-foreground">{counts[s] || 0}</span>
            </Badge>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed border-2 border-border/60 bg-muted/10 rounded-[2rem]">
          <CardContent className="p-16 flex flex-col items-center text-center text-muted-foreground">
            <div className="w-20 h-20 bg-primary/5 text-primary/40 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{isAr ? "لا توجد طلبات" : "No requests"}</h3>
            <p>{isAr ? "لم نعثر على أي طلبات تطابق الفلاتر المحددة." : "No requests match this filter."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((r) => (
            <Card key={r.id} className="border-border/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden group">
              <CardContent className="p-0">
                <div className="bg-muted/20 border-b border-border/40 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors group-hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                      {r.student_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-base leading-none">{r.student_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{r.student_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusBadge(r.status)}
                    <Badge variant="secondary" className="rounded-lg">{kindLabel(r.kind)}</Badge>
                    <Badge variant="outline" className="gap-1 rounded-lg">
                      <Globe className="w-3 h-3" />
                      {r.language.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="px-6 py-5 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <p className="text-sm text-foreground/80 flex items-center gap-2 font-medium">
                      <Layout className="w-4 h-4 text-muted-foreground" />
                      {r.source_label || r.reason || (isAr ? "بدون مصدر محدد" : "No source")}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs">
                      {r.rank ? (
                        <span className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-1 rounded-md font-bold">
                          <Award className="w-3.5 h-3.5" />
                          {isAr ? `المركز: ${r.rank}` : `Rank: ${r.rank}`}
                        </span>
                      ) : null}
                      {r.certificate_number && (
                        <span className="flex items-center gap-1.5 text-primary bg-primary/5 px-2 py-1 rounded-md font-mono font-bold">
                          # {r.certificate_number}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end shrink-0">
                    {r.status === "submitted" && (
                      <Button
                        className="rounded-xl font-bold"
                        disabled={busy === r.id}
                        onClick={() => doAction(r.id, { action: "approve" })}
                      >
                        {busy === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {isAr ? "اعتماد" : "Approve"}
                      </Button>
                    )}
                    {(r.status === "approved" || r.status === "submitted") && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="rounded-xl font-bold" variant="secondary" onClick={() => setActiveReq(r)}>
                            <Award className="w-4 h-4" />
                            {isAr ? "إصدار" : "Issue"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl">
                          <DialogHeader>
                            <DialogTitle>{isAr ? "إصدار الشهادة" : "Issue Certificate"}</DialogTitle>
                            <DialogDescription>
                              {isAr
                                ? "اختر القالب واللغة قبل الإصدار. (توليد PDF التلقائي يأتي في التحديث القادم)"
                                : "Pick template & language before issuing. (Auto PDF generation in next update.)"}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 my-2">
                            <div className="space-y-1.5">
                              <Label className="font-bold">{isAr ? "القالب" : "Template"}</Label>
                              <Select
                                value={activeReq?.template_id || ""}
                                onValueChange={async (v) => {
                                  if (!activeReq) return
                                  await doAction(activeReq.id, {
                                    action: "assign_template",
                                    template_id: v,
                                  })
                                }}
                              >
                                <SelectTrigger className="rounded-xl h-12">
                                  <SelectValue placeholder={isAr ? "اختر القالب" : "Choose template"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  {templates
                                    .filter((tpl) => tpl.kind === (activeReq?.kind || "course"))
                                    .map((tpl) => (
                                      <SelectItem key={tpl.id} value={tpl.id}>
                                        {tpl.name} · {tpl.language.toUpperCase()}
                                        {tpl.is_default ? " · ★" : ""}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="font-bold">{isAr ? "رابط PDF (اختياري)" : "PDF URL (optional)"}</Label>
                              <Input
                                placeholder="https://…"
                                id="cert-issue-url"
                                className="rounded-xl h-12"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              className="rounded-xl font-bold px-8"
                              disabled={busy === activeReq?.id}
                              onClick={async () => {
                                if (!activeReq) return
                                const input = document.getElementById("cert-issue-url") as HTMLInputElement
                                const pdfUrl = input?.value?.trim() || undefined
                                await doAction(activeReq.id, { action: "issue", pdf_url: pdfUrl })
                              }}
                            >
                              {isAr ? "تأكيد الإصدار" : "Confirm issue"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    {r.status !== "rejected" && r.status !== "issued" && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="rounded-xl font-bold bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700" variant="ghost" onClick={() => setActiveReq(r)}>
                            <XCircle className="w-4 h-4" />
                            {isAr ? "رفض" : "Reject"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl">
                          <DialogHeader>
                            <DialogTitle>{isAr ? "رفض الطلب" : "Reject request"}</DialogTitle>
                          </DialogHeader>
                          <div className="my-2 space-y-2">
                            <Label className="font-bold">{isAr ? "سبب الرفض" : "Reason"}</Label>
                            <Textarea
                              rows={4}
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder={isAr ? "اكتب سبب الرفض" : "Reason for rejection"}
                              className="rounded-xl resize-none"
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              variant="destructive"
                              className="rounded-xl font-bold"
                              disabled={busy === activeReq?.id}
                              onClick={async () => {
                                if (!activeReq) return
                                await doAction(activeReq.id, {
                                  action: "reject",
                                  reason: rejectReason,
                                })
                              }}
                            >
                              {isAr ? "تأكيد الرفض" : "Confirm reject"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// -------- Issued Tab --------
function IssuedTab({
  isAr,
  kindLabel,
}: {
  isAr: boolean
  kindLabel: (k: string) => string
}) {
  const apiBase = useApiBase()
  const [items, setItems] = useState<IssuedCert[]>([])
  const [kind, setKind] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (kind !== "all") qs.set("kind", kind)
      if (search) qs.set("search", search)
      const res = await fetch(`${apiBase}/issued?${qs}`)
      const data = await res.json()
      setItems(data.certificates || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [kind])

  return (
    <div className="space-y-6">
      {/* Sleek Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-card border border-border/40 p-4 rounded-3xl shadow-sm">
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <Label className="text-xs font-bold text-muted-foreground px-1">{isAr ? "النوع" : "Kind"}</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="w-full h-11 bg-muted/30 border-0 rounded-2xl hover:bg-muted/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
              {KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {isAr ? k.label_ar : k.label_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 flex-[2] min-w-[280px]">
          <Label className="text-xs font-bold text-muted-foreground px-1">{isAr ? "بحث" : "Search"}</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? "ابحث بالاسم، الإيميل، رقم الشهادة..." : "Name, email, cert#..."}
                className="w-full h-11 bg-muted/30 border-0 rounded-2xl pl-4 pr-10 hover:bg-muted/50 focus-visible:ring-primary/30 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter") load()
                }}
              />
            </div>
            <Button className="h-11 px-6 rounded-2xl font-bold shadow-sm" onClick={load}>
              {isAr ? "بحث" : "Search"}
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed border-2 border-border/60 bg-muted/10 rounded-[2rem]">
          <CardContent className="p-16 flex flex-col items-center text-center text-muted-foreground">
            <div className="w-20 h-20 bg-primary/5 text-primary/40 rounded-full flex items-center justify-center mb-6">
              <Award className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{isAr ? "لا توجد شهادات" : "No certificates"}</h3>
            <p>{isAr ? "لم نعثر على أي شهادات صادرة." : "No issued certificates found."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map((c) => (
            <Card key={c.id} className="border-border/40 shadow-sm hover:shadow-lg transition-all duration-300 rounded-3xl overflow-hidden group">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="bg-muted/20 border-b border-border/40 p-5 flex items-start justify-between gap-4 transition-colors group-hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-lg shrink-0">
                      {c.student_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold leading-tight line-clamp-1">{c.student_name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.student_email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="rounded-lg">{kindLabel(c.kind)}</Badge>
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {new Date(c.issued_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                      </span>
                    </div>
                    <div className="space-y-1.5 p-3 rounded-2xl bg-muted/30 border border-border/40">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {c.source_label || c.template_name || "—"}
                      </p>
                      {c.certificate_number && (
                        <p className="font-mono text-xs font-bold text-primary flex items-center gap-1.5">
                          # {c.certificate_number}
                        </p>
                      )}
                    </div>
                  </div>
                  {c.pdf_url ? (
                    <Button asChild className="w-full rounded-xl font-bold group-hover:shadow-md transition-all">
                      <a href={c.pdf_url} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4 me-2" />
                        {isAr ? "عرض الشهادة (PDF)" : "View Certificate (PDF)"}
                      </a>
                    </Button>
                  ) : (
                    <div className="w-full text-center py-2.5 rounded-xl border border-dashed border-orange-200 bg-orange-50 text-orange-600 text-xs font-bold">
                      {isAr ? "في انتظار توليد الـ PDF..." : "Generating PDF..."}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// -------- Templates Tab --------
function TemplatesTab({
  isAr,
  lbl,
  langLbl,
}: {
  isAr: boolean
  lbl: (k: typeof KINDS[number]) => string
  langLbl: (l: typeof LANGUAGES[number]) => string
}) {
  const apiBase = useApiBase()
  const [items, setItems] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorTemplate, setEditorTemplate] = useState<Template | null>(null)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [previewing, setPreviewing] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    description: "",
    kind: "course",
    language: "ar",
    template_url: "",
    is_default: false,
  })
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/templates?include_inactive=1`)
      const data = await res.json()
      setItems(data.templates || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("image", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.url) {
        setForm((f) => ({ ...f, template_url: data.url }))
      } else {
        toast({ variant: "destructive", title: data.error || "Upload failed" })
      }
    } finally {
      setUploading(false)
    }
  }

  async function create() {
    if (!form.name || !form.template_url) {
      toast({
        variant: "destructive",
        title: isAr ? "البيانات ناقصة" : "Missing fields",
        description: isAr ? "الاسم وملف التيمبلت مطلوبان" : "Name and template file are required",
      })
      return
    }
    setCreating(true)
    try {
      const res = await fetch(`${apiBase}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast({ title: isAr ? "تم إنشاء القالب" : "Template created" })
        setShowCreate(false)
        setForm({ name: "", description: "", kind: "course", language: "ar", template_url: "", is_default: false })
        await load()
      } else {
        const e = await res.json().catch(() => ({}))
        toast({ variant: "destructive", title: e.error || "Failed" })
      }
    } finally {
      setCreating(false)
    }
  }

  async function toggleDefault(t: Template) {
    await fetch(`${apiBase}/templates/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_default: !t.is_default }),
    })
    await load()
  }

  async function toggleActive(t: Template) {
    await fetch(`${apiBase}/templates/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !t.is_active }),
    })
    await load()
  }

  async function remove(t: Template) {
    if (!confirm(isAr ? "حذف هذا القالب نهائياً؟" : "Delete this template permanently?")) return
    await fetch(`${apiBase}/templates/${t.id}?hard=1`, {
      method: "DELETE",
    })
    await load()
  }

  const grouped = useMemo(() => {
    const map: Record<string, Template[]> = {}
    items.forEach((it) => {
      const key = it.kind
      ;(map[key] ||= []).push(it)
    })
    return map
  }, [items])

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold shadow-sm px-6 h-11">
              <Plus className="w-5 h-5 me-1.5" />
              {isAr ? "قالب جديد" : "New template"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-[2rem] p-6 sm:p-8">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-black">{isAr ? "رفع قالب شهادة" : "Upload certificate template"}</DialogTitle>
              <DialogDescription className="text-base font-medium">
                {isAr
                  ? "ارفع صورة أو PDF عالي الجودة. ستحدد مواضع الحقول بصرياً في التحديث القادم."
                  : "Upload a high-resolution image or PDF. Field positions will be set visually in the next update."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="font-bold">{isAr ? "اسم القالب" : "Template name"}</Label>
                <Input className="h-12 rounded-xl bg-muted/30 focus-visible:bg-background" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-bold">{isAr ? "النوع" : "Kind"}</Label>
                  <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 focus:bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {KINDS.map((k) => (
                        <SelectItem key={k.value} value={k.value}>
                          {lbl(k)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold">{isAr ? "اللغة" : "Language"}</Label>
                  <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 focus:bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {langLbl(l)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold">{isAr ? "وصف (اختياري)" : "Description (optional)"}</Label>
                <Textarea
                  rows={2}
                  className="rounded-xl bg-muted/30 focus-visible:bg-background resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">{isAr ? "ملف التيمبلت" : "Template file"}</Label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 bg-primary/5 rounded-2xl py-8 cursor-pointer hover:border-primary/40 hover:bg-primary/10 transition-all duration-300">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    hidden
                    onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="text-sm font-bold text-primary">{isAr ? "جاري الرفع..." : "Uploading..."}</span>
                    </div>
                  ) : form.template_url ? (
                    <div className="flex flex-col items-center gap-2 text-primary">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <span className="font-bold">{isAr ? "تم رفع الملف بنجاح" : "File uploaded successfully"}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-primary/60 hover:text-primary transition-colors">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                        <UploadIcon className="w-6 h-6" />
                      </div>
                      <span className="font-bold">{isAr ? "اضغط لرفع الملف" : "Click to upload file"}</span>
                    </div>
                  )}
                </label>
              </div>
              <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-xl border border-border/40">
                <Switch
                  id="def-tpl"
                  checked={form.is_default}
                  onCheckedChange={(v) => setForm({ ...form, is_default: Boolean(v) })}
                  className="scale-110"
                />
                <Label htmlFor="def-tpl" className="font-bold cursor-pointer">
                  {isAr ? "تعيين كقالب افتراضي لهذا النوع واللغة" : "Make default for this kind/language"}
                </Label>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button onClick={create} disabled={creating || uploading} className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20">
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : isAr ? "إنشاء القالب" : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="border-dashed border-2 border-border/60 bg-muted/10 rounded-[2rem]">
          <CardContent className="p-16 flex flex-col items-center text-center text-muted-foreground">
            <div className="w-20 h-20 bg-primary/5 text-primary/40 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{isAr ? "لا توجد قوالب" : "No templates"}</h3>
            <p>{isAr ? "لم تقم بإضافة أي قوالب للشهادات بعد." : "You haven't added any certificate templates yet."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {KINDS.map((k) => {
            const list = grouped[k.value] || []
            if (list.length === 0) return null
            return (
              <div key={k.value} className="space-y-5 bg-card/50 p-6 rounded-[2rem] border border-border/40 shadow-sm">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-foreground">{lbl(k)}</h3>
                  <Badge variant="secondary" className="rounded-full px-3 text-sm">{list.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {list.map((tpl) => (
                    <Card key={tpl.id} className={`border-border/40 shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden group flex flex-col h-full ${tpl.is_active ? "" : "opacity-60 grayscale-[30%]"}`}>
                      <CardContent className="p-0 flex flex-col flex-1">
                        {/* Image Header */}
                        <div className="relative aspect-[1.414/1] bg-muted overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={tpl.template_url}
                            alt={tpl.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display = "none"
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                          <div className="absolute top-3 right-3 flex gap-2">
                            {tpl.is_default && (
                              <Badge className="bg-yellow-400 text-yellow-950 font-bold border-0 shadow-sm rounded-lg gap-1">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                {isAr ? "الافتراضي" : "Default"}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="rounded-lg shadow-sm font-bold bg-white/90 text-black border-0">
                              {tpl.language.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="absolute bottom-3 left-4 right-4 text-white z-10">
                            <p className="font-bold text-lg leading-tight line-clamp-1 drop-shadow-md">{tpl.name}</p>
                            <p className="text-xs opacity-80 mt-1 drop-shadow-sm font-medium">
                              {new Date(tpl.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 flex-1 flex flex-col justify-end gap-2.5 bg-card">
                          <Button
                            className="w-full rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors shadow-none"
                            onClick={() => {
                              setEditorTemplate(tpl)
                              setEditorOpen(true)
                            }}
                          >
                            <Layout className="w-4 h-4 me-2" />
                            {isAr ? "تعديل مواضع النصوص" : "Edit text positions"}
                          </Button>
                          <div className="grid grid-cols-2 gap-2.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl font-bold h-9"
                              disabled={previewing === tpl.id}
                              onClick={async () => {
                                setPreviewing(tpl.id)
                                try {
                                  const r = await fetch(`${apiBase}/templates/${tpl.id}/preview?format=png&t=${Date.now()}`)
                                  if (!r.ok) {
                                    toast({ variant: "destructive", title: isAr ? "تعذر إنشاء المعاينة" : "Preview failed" })
                                    return
                                  }
                                  const blob = await r.blob()
                                  setPreviewUrls((p) => ({ ...p, [tpl.id]: URL.createObjectURL(blob) }))
                                } finally {
                                  setPreviewing(null)
                                }
                              }}
                            >
                              {previewing === tpl.id ? <Loader2 className="w-4 h-4 animate-spin me-1.5" /> : <Eye className="w-4 h-4 me-1.5" />}
                              {isAr ? "معاينة" : "Preview"}
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-xl font-bold h-9" onClick={() => toggleActive(tpl)}>
                              {tpl.is_active ? (isAr ? "تعطيل" : "Disable") : (isAr ? "تفعيل" : "Enable")}
                            </Button>
                          </div>
                          <div className="flex gap-2.5">
                            <Button size="sm" variant="secondary" className="rounded-xl flex-1 font-bold h-9" onClick={() => toggleDefault(tpl)}>
                              <Star className={`w-4 h-4 me-1.5 ${tpl.is_default ? "text-yellow-500 fill-current" : ""}`} />
                              {tpl.is_default ? (isAr ? "إزالة الافتراضي" : "Unset default") : (isAr ? "تعيين كافتراضي" : "Set default")}
                            </Button>
                            <Button size="sm" variant="ghost" className="rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shrink-0 h-9 px-3" onClick={() => remove(tpl)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          {previewUrls[tpl.id] && (
                            <a
                              href={previewUrls[tpl.id]}
                              target="_blank"
                              rel="noreferrer"
                              className="block mt-3 rounded-xl overflow-hidden border border-border shadow-sm group-hover:shadow-md transition-shadow relative group/preview"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={previewUrls[tpl.id]} alt="preview" className="w-full" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-sm">
                                <ExternalLink className="w-4 h-4 me-1.5" />
                                {isAr ? "فتح بحجم كامل" : "Open full size"}
                              </div>
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CertificateTemplateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={
          editorTemplate
            ? {
                id: editorTemplate.id,
                name: editorTemplate.name,
                template_url: editorTemplate.template_url,
                field_positions: editorTemplate.field_positions as Record<
                  string,
                  { x: number; y: number }
                >,
                language: editorTemplate.language,
              }
            : null
        }
        apiBase={apiBase}
        onSaved={load}
      />
    </div>
  )
}

// -------- Settings Tab --------
function SettingsTab({ isAr }: { isAr: boolean }) {
  const apiBase = useApiBase()
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/settings`)
      const data = await res.json()
      setSettings(data.settings || {})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  function setKey(k: string, v: unknown) {
    setSettings((s) => ({ ...s, [k]: v }))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`${apiBase}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
      if (res.ok) {
        toast({ title: isAr ? "تم الحفظ" : "Saved" })
      } else {
        toast({ variant: "destructive", title: isAr ? "تعذر الحفظ" : "Save failed" })
      }
    } finally {
      setSaving(false)
    }
  }

  async function uploadAsset(key: string, file: File) {
    setUploading(key)
    try {
      const fd = new FormData()
      fd.append("image", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.url) setKey(key, data.url)
    } finally {
      setUploading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const assetField = (key: string, label: string, hint?: string) => (
    <Card className="border-border/40 shadow-sm rounded-3xl overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div>
          <Label className="font-black text-lg">{label}</Label>
          {hint && <p className="text-sm text-muted-foreground mt-1 font-medium">{hint}</p>}
        </div>
        {settings[key] ? (
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-muted/20 p-4 rounded-2xl border border-border/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={String(settings[key])}
              alt={label}
              className="w-32 h-32 object-contain bg-white rounded-xl shadow-sm border border-border/30 p-2"
            />
            <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
              <Button className="rounded-xl font-bold flex-1" asChild>
                <a href={String(settings[key])} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4 me-2" />
                  {isAr ? "عرض الصورة" : "Open Image"}
                </a>
              </Button>
              <Button variant="destructive" className="rounded-xl font-bold flex-1" onClick={() => setKey(key, null)}>
                <Trash2 className="w-4 h-4 me-2" />
                {isAr ? "إزالة" : "Remove"}
              </Button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 bg-primary/5 rounded-2xl py-10 cursor-pointer hover:border-primary/40 hover:bg-primary/10 transition-all duration-300">
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files && uploadAsset(key, e.target.files[0])}
            />
            {uploading === key ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm font-bold text-primary">{isAr ? "جاري الرفع..." : "Uploading..."}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-primary/60 hover:text-primary transition-colors">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <span className="text-base font-bold">{isAr ? "اضغط لرفع الصورة" : "Click to upload image"}</span>
              </div>
            )}
          </label>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/40 shadow-sm rounded-3xl">
          <CardContent className="p-6 space-y-4">
            <Label className="font-black text-lg">{isAr ? "اسم المنصة (عربي)" : "Platform name (Arabic)"}</Label>
            <Input
              value={String(settings.platform_name_ar ?? "")}
              onChange={(e) => setKey("platform_name_ar", e.target.value)}
              className="h-12 rounded-xl text-lg px-4 bg-muted/30 focus-visible:bg-background"
            />
          </CardContent>
        </Card>
        <Card className="border-border/40 shadow-sm rounded-3xl">
          <CardContent className="p-6 space-y-4">
            <Label className="font-black text-lg">{isAr ? "اسم المنصة (إنجليزي)" : "Platform name (English)"}</Label>
            <Input
              value={String(settings.platform_name_en ?? "")}
              onChange={(e) => setKey("platform_name_en", e.target.value)}
              className="h-12 rounded-xl text-lg px-4 bg-muted/30 focus-visible:bg-background"
            />
          </CardContent>
        </Card>
        
        {assetField(
          "logo_url",
          isAr ? "شعار المنصة" : "Platform logo",
          isAr ? "PNG بخلفية شفافة. يظهر على الشهادات." : "PNG with transparent background. Appears on certificates."
        )}
        {assetField(
          "watermark_url",
          isAr ? "العلامة المائية" : "Watermark",
          isAr ? "صورة شفافة تظهر خلف نص الشهادة." : "Transparent image shown behind certificate text."
        )}
        {assetField(
          "signature_url",
          isAr ? "التوقيع الرقمي للمدير" : "Digital signature",
          isAr ? "صورة لتوقيع مدير المنصة الرسمي." : "Image of the official platform signature."
        )}
        
        <Card className="border-border/40 shadow-sm rounded-3xl">
          <CardContent className="p-6 space-y-5">
            <div className="space-y-3">
              <Label className="font-black text-lg">{isAr ? "اسم الموقّع الافتراضي" : "Default signer name"}</Label>
              <Input
                value={String(settings.default_signer_name ?? "")}
                onChange={(e) => setKey("default_signer_name", e.target.value)}
                className="h-12 rounded-xl text-base px-4 bg-muted/30 focus-visible:bg-background"
                placeholder={isAr ? "مثال: د. أحمد محمد" : "e.g. Dr. Ahmed"}
              />
            </div>
            <div className="space-y-3">
              <Label className="font-black text-lg">{isAr ? "المسمى الوظيفي" : "Signer title"}</Label>
              <Input
                value={String(settings.default_signer_title ?? "")}
                onChange={(e) => setKey("default_signer_title", e.target.value)}
                className="h-12 rounded-xl text-base px-4 bg-muted/30 focus-visible:bg-background"
                placeholder={isAr ? "مثال: المشرف العام" : "e.g. General Manager"}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/40 shadow-sm rounded-3xl bg-gradient-to-r from-card to-muted/20">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <Label className="font-black text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {isAr ? "الإصدار التلقائي للشهادات" : "Auto-issue Certificates"}
                </Label>
                <p className="text-base text-muted-foreground font-medium">
                  {isAr
                    ? "عند تفعيل هذا الخيار، سيتم إصدار الشهادات تلقائياً للطلاب بمجرد استيفائهم لمتطلبات النجاح دون الحاجة لموافقة يدوية من الإدارة."
                    : "When enabled, certificates are issued automatically to students upon meeting success criteria, bypassing manual admin review."}
                </p>
              </div>
              <Switch
                checked={Boolean(settings.auto_issue_on_eligibility)}
                onCheckedChange={(v) => setKey("auto_issue_on_eligibility", Boolean(v))}
                className="scale-125 origin-right"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4 border-t border-border/50">
        <Button onClick={save} disabled={saving} size="lg" className="rounded-2xl font-black px-10 h-14 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
          {saving ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <CheckCircle2 className="w-5 h-5 me-2" />}
          {isAr ? "حفظ الإعدادات بالكامل" : "Save All Settings"}
        </Button>
      </div>
    </div>
  )
}
