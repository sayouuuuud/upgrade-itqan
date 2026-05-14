"use client"

import { useEffect, useState } from "react"
import { Loader2, Video, X, Users, User as UserIcon, Link2, Lock } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

type Provider = "zoom" | "google_meet" | "other"
type Audience = "all" | "specific"

interface Student {
  id: string
  name: string | null
  email: string | null
}

interface Invite {
  student_id: string
  name: string | null
  email: string | null
  meeting_link: string
  meeting_provider: string | null
  sent_at: string
}

interface CurrentSession {
  id: string
  meeting_link: string | null
  meeting_provider: string | null
  meeting_password: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  sessionId: string
  sessionTitle: string
  onSent?: () => void
}

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: "zoom", label: "Zoom" },
  { value: "google_meet", label: "Google Meet" },
  { value: "other", label: "آخر" },
]

export function SendMeetingLinkModal({ open, onClose, sessionId, sessionTitle, onSent }: Props) {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Data
  const [students, setStudents] = useState<Student[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [current, setCurrent] = useState<CurrentSession | null>(null)

  // Form
  const [provider, setProvider] = useState<Provider>("zoom")
  const [link, setLink] = useState("")
  const [password, setPassword] = useState("")
  const [audience, setAudience] = useState<Audience>("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [publishAnnouncement, setPublishAnnouncement] = useState(true)
  const [announcementTitle, setAnnouncementTitle] = useState("")
  const [announcementContent, setAnnouncementContent] = useState("")

  useEffect(() => {
    if (!open) return
    setError(null)
    setSuccess(null)
    setLoading(true)
    fetch(`/api/academy/teacher/sessions/${sessionId}/meeting-link`)
      .then(async r => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "تعذر تحميل البيانات")
        return r.json()
      })
      .then(d => {
        setStudents(d.students || [])
        setInvites(d.invites || [])
        setCurrent(d.session || null)
        if (d.session?.meeting_link) setLink(d.session.meeting_link)
        if (d.session?.meeting_provider) setProvider(d.session.meeting_provider as Provider)
        if (d.session?.meeting_password) setPassword(d.session.meeting_password)
      })
      .catch(e => setError(e instanceof Error ? e.message : "خطأ"))
      .finally(() => setLoading(false))
  }, [open, sessionId])

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!link.trim() || !/^https?:\/\//i.test(link.trim())) {
      setError("الرجاء إدخال رابط صحيح يبدأ بـ http(s)")
      return
    }
    if (audience === "specific" && selectedIds.size === 0) {
      setError("اختر طالباً واحداً على الأقل")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/academy/teacher/sessions/${sessionId}/meeting-link`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          link: link.trim(),
          provider,
          audience,
          studentIds: audience === "specific" ? Array.from(selectedIds) : undefined,
          publishAnnouncement,
          meetingPassword: password.trim() || null,
          announcementTitle: announcementTitle.trim() || undefined,
          announcementContent: announcementContent.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "تعذر الحفظ")
      setSuccess(
        audience === "all"
          ? `تم إرسال الرابط لجميع طلاب الكورس (${data.recipientsCount} طالب)`
          : `تم إرسال الرابط للطلاب المحددين (${data.recipientsCount} طالب)`
      )
      onSent?.()
      // Close after a short delay
      setTimeout(() => onClose(), 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            إرسال رابط الجلسة
          </DialogTitle>
          <DialogDescription>
            {sessionTitle} — أرسل رابط Zoom أو Google Meet لطلاب الكورس
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current state */}
            {current?.meeting_link && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">الرابط الحالي للجلسة:</div>
                <div className="break-all text-blue-900 dark:text-blue-200">{current.meeting_link}</div>
              </div>
            )}

            {/* Provider */}
            <div className="space-y-2">
              <Label>مقدم الخدمة</Label>
              <div className="flex gap-2 flex-wrap">
                {PROVIDERS.map(p => (
                  <button
                    type="button"
                    key={p.value}
                    onClick={() => setProvider(p.value)}
                    className={[
                      "px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                      provider === p.value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-card text-foreground border-border hover:bg-muted",
                    ].join(" ")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Link */}
            <div className="space-y-2">
              <Label htmlFor="meeting-link" className="flex items-center gap-1.5">
                <Link2 className="w-4 h-4" /> رابط الانضمام
              </Label>
              <Input
                id="meeting-link"
                type="url"
                value={link}
                onChange={e => setLink(e.target.value)}
                placeholder="https://zoom.us/j/123... or https://meet.google.com/abc-..."
                dir="ltr"
                required
              />
            </div>

            {/* Password (optional) */}
            <div className="space-y-2">
              <Label htmlFor="meeting-password" className="flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> كلمة المرور (اختياري)
              </Label>
              <Input
                id="meeting-password"
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="ز.ب. 12345"
                dir="ltr"
              />
            </div>

            {/* Audience */}
            <div className="space-y-3">
              <Label>الجمهور المستهدف</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAudience("all")}
                  className={[
                    "p-3 rounded-lg border-2 text-start transition-colors flex items-start gap-2",
                    audience === "all"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-border bg-card hover:bg-muted",
                  ].join(" ")}
                >
                  <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">كل طلاب الكورس</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      يعدّل رابط الجلسة الافتراضي ({students.length} طالب)
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAudience("specific")}
                  className={[
                    "p-3 rounded-lg border-2 text-start transition-colors flex items-start gap-2",
                    audience === "specific"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-border bg-card hover:bg-muted",
                  ].join(" ")}
                >
                  <UserIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">طلاب محددون</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      رابط خاص لكل طالب يختاره
                    </div>
                  </div>
                </button>
              </div>

              {audience === "specific" && (
                <div className="border border-border rounded-lg p-3 max-h-56 overflow-y-auto space-y-1.5">
                  {students.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      لا يوجد طلاب مسجلون في هذا الكورس بعد
                    </div>
                  ) : (
                    students.map(s => {
                      const isSelected = selectedIds.has(s.id)
                      const existingInvite = invites.find(i => i.student_id === s.id)
                      return (
                        <label
                          key={s.id}
                          className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleStudent(s.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{s.name || s.email || s.id}</div>
                            {s.email && <div className="text-xs text-muted-foreground truncate">{s.email}</div>}
                          </div>
                          {existingInvite && (
                            <span className="text-xs text-green-600 dark:text-green-400 shrink-0">
                              له رابط مرسل
                            </span>
                          )}
                        </label>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* Announcement */}
            <div className="space-y-3 border-t border-border pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={publishAnnouncement}
                  onCheckedChange={v => setPublishAnnouncement(!!v)}
                />
                <span className="text-sm font-medium">نشر الرابط أيضاً كإعلان لطلاب الكورس</span>
              </label>
              {publishAnnouncement && (
                <div className="space-y-3 pe-6">
                  <div>
                    <Label htmlFor="ann-title" className="text-xs">عنوان الإعلان (اختياري)</Label>
                    <Input
                      id="ann-title"
                      value={announcementTitle}
                      onChange={e => setAnnouncementTitle(e.target.value)}
                      placeholder={`رابط الجلسة: ${sessionTitle}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ann-content" className="text-xs">محتوى الإعلان (اختياري)</Label>
                    <Textarea
                      id="ann-content"
                      rows={3}
                      value={announcementContent}
                      onChange={e => setAnnouncementContent(e.target.value)}
                      placeholder="اتركه فارغاً لاستخدام نص افتراضي يحتوي على الرابط."
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-300">
                {success}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                إلغاء
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin me-2" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 me-2" />
                    إرسال الرابط
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
