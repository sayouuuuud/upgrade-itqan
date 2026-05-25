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
    <div className="space-y-6 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Award className="w-7 h-7 text-primary" />
            {isAr ? title_ar : title_en}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? subtitle_ar : subtitle_en}
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="requests" className="gap-2">
            <FileText className="w-4 h-4" />
            {isAr ? "الطلبات" : "Requests"}
          </TabsTrigger>
          <TabsTrigger value="issued" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {isAr ? "الصادرة" : "Issued"}
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Sparkles className="w-4 h-4" />
            {isAr ? "القوالب" : "Templates"}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            {isAr ? "الإعدادات" : "Settings"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <RequestsTab isAr={isAr} kindLabel={(k) => lbl(KINDS.find((x) => x.value === k) || KINDS[0])} />
        </TabsContent>
        <TabsContent value="issued" className="mt-6">
          <IssuedTab isAr={isAr} kindLabel={(k) => lbl(KINDS.find((x) => x.value === k) || KINDS[0])} />
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
          <TemplatesTab isAr={isAr} lbl={lbl} langLbl={langLbl} />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
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
      data_required: { ar: "بانتظار بيانات الطالب", en: "Awaiting student data", cls: "bg-orange-100 text-orange-700" },
      submitted: { ar: "بانتظار المراجعة", en: "Awaiting review", cls: "bg-blue-100 text-blue-700" },
      approved: { ar: "معتمد", en: "Approved", cls: "bg-green-100 text-green-700" },
      issued: { ar: "تم الإصدار", en: "Issued", cls: "bg-emerald-100 text-emerald-700" },
      rejected: { ar: "مرفوض", en: "Rejected", cls: "bg-red-100 text-red-700" },
    }
    const v = map[s] || { ar: s, en: s, cls: "bg-muted text-foreground" }
    return <Badge className={v.cls}>{isAr ? v.ar : v.en}</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">{isAr ? "الحالة" : "Status"}</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
              <SelectItem value="submitted">{isAr ? "بانتظار المراجعة" : "Submitted"}</SelectItem>
              <SelectItem value="data_required">{isAr ? "بانتظار البيانات" : "Awaiting data"}</SelectItem>
              <SelectItem value="approved">{isAr ? "معتمد" : "Approved"}</SelectItem>
              <SelectItem value="issued">{isAr ? "صادر" : "Issued"}</SelectItem>
              <SelectItem value="rejected">{isAr ? "مرفوض" : "Rejected"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isAr ? "النوع" : "Kind"}</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
              {KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {isAr ? k.label_ar : k.label_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2 ms-auto text-xs">
          {(["submitted", "data_required", "approved", "issued", "rejected"] as const).map((s) => (
            <Badge key={s} variant="outline" className="font-normal">
              {statusBadge(s)} <span className="mx-1 font-bold">{counts[s] || 0}</span>
            </Badge>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{isAr ? "لا توجد طلبات في هذا التصفية" : "No requests match this filter"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <Card key={r.id} className="border-border/60">
              <CardContent className="p-4 flex flex-col md:flex-row gap-4 md:items-center">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{r.student_name}</span>
                    <span className="text-xs text-muted-foreground">{r.student_email}</span>
                    {statusBadge(r.status)}
                    <Badge variant="secondary">{kindLabel(r.kind)}</Badge>
                    <Badge variant="outline" className="gap-1">
                      <Globe className="w-3 h-3" />
                      {r.language.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {r.source_label || r.reason || (isAr ? "بدون مصدر محدد" : "No source")}
                  </p>
                  {r.rank ? (
                    <p className="text-xs">
                      {isAr ? `المركز: ${r.rank}` : `Rank: ${r.rank}`}
                    </p>
                  ) : null}
                  {r.certificate_number && (
                    <p className="text-xs font-mono text-primary">{r.certificate_number}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  {r.status === "submitted" && (
                    <Button
                      size="sm"
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
                        <Button size="sm" variant="secondary" onClick={() => setActiveReq(r)}>
                          <Award className="w-4 h-4" />
                          {isAr ? "إصدار" : "Issue"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{isAr ? "إصدار الشهادة" : "Issue Certificate"}</DialogTitle>
                          <DialogDescription>
                            {isAr
                              ? "اختر القالب واللغة قبل الإصدار. (توليد PDF التلقائي يأتي في التحديث القادم)"
                              : "Pick template & language before issuing. (Auto PDF generation in next update.)"}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label>{isAr ? "القالب" : "Template"}</Label>
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
                              <SelectTrigger>
                                <SelectValue placeholder={isAr ? "اختر القالب" : "Choose template"} />
                              </SelectTrigger>
                              <SelectContent>
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
                          <div className="space-y-1">
                            <Label>{isAr ? "رابط PDF (اختياري)" : "PDF URL (optional)"}</Label>
                            <Input
                              placeholder="https://…"
                              id="cert-issue-url"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
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
                        <Button size="sm" variant="ghost" onClick={() => setActiveReq(r)}>
                          <XCircle className="w-4 h-4" />
                          {isAr ? "رفض" : "Reject"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{isAr ? "رفض الطلب" : "Reject request"}</DialogTitle>
                        </DialogHeader>
                        <Textarea
                          rows={4}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder={isAr ? "اكتب سبب الرفض" : "Reason for rejection"}
                        />
                        <DialogFooter>
                          <Button
                            variant="destructive"
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">{isAr ? "النوع" : "Kind"}</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
              {KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {isAr ? k.label_ar : k.label_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 flex-1 min-w-60">
          <Label className="text-xs">{isAr ? "بحث" : "Search"}</Label>
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? "اسم، إيميل، رقم شهادة..." : "Name, email, cert#..."}
            />
            <Button variant="secondary" onClick={load}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Award className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{isAr ? "لا توجد شهادات صادرة بعد" : "No issued certificates yet"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{c.student_name}</p>
                    <p className="text-xs text-muted-foreground">{c.student_email}</p>
                  </div>
                  <Badge>{kindLabel(c.kind)}</Badge>
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">
                    {c.source_label || c.template_name || "—"}
                  </p>
                  {c.certificate_number && (
                    <p className="font-mono text-xs text-primary">{c.certificate_number}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.issued_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                  </p>
                </div>
                {c.pdf_url ? (
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <a href={c.pdf_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      {isAr ? "فتح الشهادة" : "Open PDF"}
                    </a>
                  </Button>
                ) : (
                  <p className="text-xs text-orange-600">
                    {isAr ? "في انتظار رفع PDF" : "Awaiting PDF"}
                  </p>
                )}
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
            <Button>
              <Plus className="w-4 h-4" />
              {isAr ? "قالب جديد" : "New template"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{isAr ? "رفع قالب شهادة" : "Upload certificate template"}</DialogTitle>
              <DialogDescription>
                {isAr
                  ? "ارفع صورة أو PDF عالي الجودة. ستحدد مواضع الحقول بصرياً في التحديث القادم."
                  : "Upload a high-resolution image or PDF. Field positions will be set visually in the next update."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>{isAr ? "اسم القالب" : "Template name"}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{isAr ? "النوع" : "Kind"}</Label>
                  <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KINDS.map((k) => (
                        <SelectItem key={k.value} value={k.value}>
                          {lbl(k)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>{isAr ? "اللغة" : "Language"}</Label>
                  <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {langLbl(l)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "وصف (اختياري)" : "Description (optional)"}</Label>
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "ملف التيمبلت" : "Template file"}</Label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl py-8 cursor-pointer hover:border-primary transition">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    hidden
                    onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                  />
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  ) : form.template_url ? (
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle2 className="w-5 h-5" />
                      {isAr ? "تم رفع الملف" : "File uploaded"}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <UploadIcon className="w-6 h-6" />
                      <span className="text-sm">{isAr ? "اضغط للرفع" : "Click to upload"}</span>
                    </div>
                  )}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="def-tpl"
                  checked={form.is_default}
                  onCheckedChange={(v) => setForm({ ...form, is_default: Boolean(v) })}
                />
                <Label htmlFor="def-tpl" className="font-normal">
                  {isAr ? "اجعله الافتراضي لهذا النوع/اللغة" : "Make default for this kind/language"}
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={creating || uploading}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : isAr ? "إنشاء" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{isAr ? "لا توجد قوالب بعد. ابدأ بإضافة قالب." : "No templates yet — add one to get started."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {KINDS.map((k) => {
            const list = grouped[k.value] || []
            if (list.length === 0) return null
            return (
              <div key={k.value} className="space-y-3">
                <h3 className="font-bold text-foreground/80">{lbl(k)}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map((tpl) => (
                    <Card key={tpl.id} className={tpl.is_active ? "" : "opacity-50"}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{tpl.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {tpl.language.toUpperCase()} · {new Date(tpl.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                            </p>
                          </div>
                          {tpl.is_default && (
                            <Badge className="bg-yellow-100 text-yellow-700 gap-1">
                              <Star className="w-3 h-3" />
                              {isAr ? "افتراضي" : "Default"}
                            </Badge>
                          )}
                        </div>
                        <a
                          href={tpl.template_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg overflow-hidden bg-muted aspect-[1.4/1] flex items-center justify-center"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={tpl.template_url}
                            alt={tpl.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display = "none"
                            }}
                          />
                        </a>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setEditorTemplate(tpl)
                              setEditorOpen(true)
                            }}
                          >
                            <Layout className="w-3 h-3" />
                            {isAr ? "تحرير المواضع" : "Edit positions"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={previewing === tpl.id}
                            onClick={async () => {
                              setPreviewing(tpl.id)
                              try {
                                const r = await fetch(
                                  `${apiBase}/templates/${tpl.id}/preview?format=png&t=${Date.now()}`,
                                )
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
                            {previewing === tpl.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                            {isAr ? "معاينة" : "Preview"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggleDefault(tpl)}>
                            <Star className="w-3 h-3" />
                            {tpl.is_default
                              ? isAr
                                ? "إزالة الافتراضي"
                                : "Unset default"
                              : isAr
                                ? "اجعله افتراضياً"
                                : "Set default"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggleActive(tpl)}>
                            {tpl.is_active ? (isAr ? "تعطيل" : "Disable") : isAr ? "تفعيل" : "Enable"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(tpl)}>
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                        {previewUrls[tpl.id] && (
                          <a
                            href={previewUrls[tpl.id]}
                            target="_blank"
                            rel="noreferrer"
                            className="block mt-2 rounded-lg overflow-hidden bg-muted"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={previewUrls[tpl.id]} alt="preview" className="w-full" />
                          </a>
                        )}
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
    <Card>
      <CardContent className="p-4 space-y-3">
        <div>
          <Label className="font-bold">{label}</Label>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
        {settings[key] ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={String(settings[key])}
              alt={label}
              className="w-24 h-24 object-contain bg-muted rounded-lg"
            />
            <div className="flex flex-col gap-1">
              <Button size="sm" variant="outline" asChild>
                <a href={String(settings[key])} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-3 h-3" />
                  {isAr ? "عرض" : "Open"}
                </a>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setKey(key, null)}>
                <Trash2 className="w-3 h-3 text-red-500" />
                {isAr ? "إزالة" : "Remove"}
              </Button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl py-6 cursor-pointer hover:border-primary transition">
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files && uploadAsset(key, e.target.files[0])}
            />
            {uploading === key ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs">{isAr ? "اضغط للرفع" : "Click to upload"}</span>
              </div>
            )}
          </label>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label className="font-bold">{isAr ? "اسم المنصة (عربي)" : "Platform name (Arabic)"}</Label>
            <Input
              value={String(settings.platform_name_ar ?? "")}
              onChange={(e) => setKey("platform_name_ar", e.target.value)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label className="font-bold">{isAr ? "اسم المنصة (إنجليزي)" : "Platform name (English)"}</Label>
            <Input
              value={String(settings.platform_name_en ?? "")}
              onChange={(e) => setKey("platform_name_en", e.target.value)}
            />
          </CardContent>
        </Card>
        {assetField(
          "logo_url",
          isAr ? "شعار المنصة" : "Platform logo",
          isAr ? "PNG بخلفية شفافة. يظهر على الشهادات." : "PNG with transparent background. Appears on certificates.",
        )}
        {assetField(
          "watermark_url",
          isAr ? "العلامة المائية" : "Watermark",
          isAr ? "صورة شفافة تظهر خلف نص الشهادة." : "Transparent image shown behind certificate text.",
        )}
        {assetField(
          "signature_url",
          isAr ? "التوقيع الرقمي" : "Digital signature",
          isAr ? "صورة لتوقيع المنصة الرسمي." : "Image of the official platform signature.",
        )}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label className="font-bold">
              {isAr ? "اسم الموقّع الافتراضي" : "Default signer name"}
            </Label>
            <Input
              value={String(settings.default_signer_name ?? "")}
              onChange={(e) => setKey("default_signer_name", e.target.value)}
            />
            <Label>{isAr ? "المسمى الوظيفي" : "Signer title"}</Label>
            <Input
              value={String(settings.default_signer_title ?? "")}
              onChange={(e) => setKey("default_signer_title", e.target.value)}
            />
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-bold">
                  {isAr ? "إصدار تلقائي عند الاستحقاق" : "Auto-issue on eligibility"}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAr
                    ? "إذا فعّلت هذا الخيار سيتم إصدار الشهادات تلقائياً دون الحاجة لمراجعة الإدارة."
                    : "If enabled, certificates are issued automatically without admin review."}
                </p>
              </div>
              <Switch
                checked={Boolean(settings.auto_issue_on_eligibility)}
                onCheckedChange={(v) => setKey("auto_issue_on_eligibility", Boolean(v))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isAr ? "حفظ الإعدادات" : "Save settings"}
        </Button>
      </div>
    </div>
  )
}
