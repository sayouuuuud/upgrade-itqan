"use client"

// Admin panel: list community members, view post/reply counts, ban/unban.

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, ShieldAlert, ShieldCheck, User } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useToast } from "@/hooks/use-toast"
import type { Community, ForumMember } from "@/lib/community/types"

interface MembersPanelProps {
  community: Community
}

export function MembersPanel({ community }: MembersPanelProps) {
  const { locale } = useI18n()
  const { toast } = useToast()
  const isAr = locale === "ar"

  const [search, setSearch] = useState("")
  const [bannedOnly, setBannedOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [members, setMembers] = useState<ForumMember[]>([])
  const [loading, setLoading] = useState(false)
  const [banTarget, setBanTarget] = useState<ForumMember | null>(null)
  const [banReason, setBanReason] = useState("")
  const [banDays, setBanDays] = useState<number | "">("")
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const sp = new URLSearchParams({
        community,
        page: String(page),
        page_size: "30",
      })
      if (search.trim()) sp.set("search", search.trim())
      if (bannedOnly) sp.set("banned", "true")
      const res = await fetch(`/api/community/admin/members?${sp.toString()}`)
      const data = await res.json()
      if (res.ok) setMembers(data.members || [])
      else toast({ title: data.error, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [community, page, search, bannedOnly, toast])

  useEffect(() => {
    load()
  }, [load])

  const ban = async () => {
    if (!banTarget) return
    setSubmitting(true)
    try {
      const expires_at =
        typeof banDays === "number" && banDays > 0
          ? new Date(Date.now() + banDays * 86400_000).toISOString()
          : null
      const res = await fetch("/api/community/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          community,
          user_id: banTarget.user_id,
          action: "ban",
          reason: banReason.trim() || null,
          expires_at,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: isAr ? "تم الحظر" : "Banned" })
        setBanTarget(null)
        setBanReason("")
        setBanDays("")
        load()
      } else {
        toast({ title: data.error, variant: "destructive" })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const unban = async (m: ForumMember) => {
    if (!confirm(isAr ? "إلغاء حظر هذا العضو؟" : "Unban this member?")) return
    const res = await fetch("/api/community/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        community,
        user_id: m.user_id,
        action: "unban",
      }),
    })
    const data = await res.json()
    if (res.ok) {
      toast({ title: isAr ? "تم رفع الحظر" : "Unbanned" })
      load()
    } else {
      toast({ title: data.error, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث بالاسم أو البريد…" : "Search name or email…"}
            className="pr-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1)
                load()
              }
            }}
          />
        </div>
        <Button
          variant={bannedOnly ? "default" : "outline"}
          onClick={() => {
            setBannedOnly(!bannedOnly)
            setPage(1)
          }}
        >
          <ShieldAlert className="w-4 h-4 ml-1" />
          {isAr ? "المحظورون فقط" : "Banned only"}
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? "العضو" : "Member"}</TableHead>
              <TableHead>{isAr ? "الدور" : "Role"}</TableHead>
              <TableHead className="text-center">{isAr ? "منشورات" : "Posts"}</TableHead>
              <TableHead className="text-center">{isAr ? "تعليقات" : "Replies"}</TableHead>
              <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
              <TableHead className="text-end">{isAr ? "الإجراء" : "Action"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {isAr ? "جارٍ التحميل…" : "Loading…"}
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {isAr ? "لا أعضاء" : "No members"}
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => (
                <TableRow key={m.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-muted overflow-hidden inline-flex items-center justify-center">
                        {m.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium leading-tight">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize font-normal">
                      {m.role.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {m.posts_count}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {m.replies_count}
                  </TableCell>
                  <TableCell>
                    {m.is_banned ? (
                      <Badge variant="destructive" className="font-normal">
                        <ShieldAlert className="w-3 h-3 ml-1" />
                        {isAr ? "محظور" : "Banned"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-normal">
                        <ShieldCheck className="w-3 h-3 ml-1" />
                        {isAr ? "نشط" : "Active"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    {m.is_banned ? (
                      <Button size="sm" variant="outline" onClick={() => unban(m)}>
                        {isAr ? "رفع الحظر" : "Unban"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-500 border-rose-500/30"
                        onClick={() => setBanTarget(m)}
                      >
                        {isAr ? "حظر" : "Ban"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          {isAr ? "السابق" : "Previous"}
        </Button>
        <span className="text-sm text-muted-foreground self-center">
          {isAr ? `صفحة ${page}` : `Page ${page}`}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={members.length < 30 || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          {isAr ? "التالي" : "Next"}
        </Button>
      </div>

      <Dialog open={!!banTarget} onOpenChange={(o) => !o && setBanTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAr ? `حظر العضو: ${banTarget?.name || ""}` : `Ban member: ${banTarget?.name || ""}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">{isAr ? "السبب" : "Reason"}</label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
                placeholder={isAr ? "موضّح للسجل" : "For the record"}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                {isAr ? "مدة الحظر بالأيام (اتركه فارغًا للحظر الدائم)" : "Days (empty = permanent)"}
              </label>
              <Input
                type="number"
                min={1}
                value={banDays}
                onChange={(e) => setBanDays(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBanTarget(null)}
              disabled={submitting}
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={ban} disabled={submitting} className="bg-rose-500 hover:bg-rose-600">
              {submitting
                ? isAr ? "جارٍ الحظر…" : "Banning…"
                : isAr ? "تأكيد الحظر" : "Confirm ban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
