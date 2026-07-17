"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Mic, Loader2, X } from "lucide-react"
import { useI18n } from "@/lib/i18n/context";

// Shown ONLY when a Super Admin is operating inside a borrowed mode
// (maqraa or academy). It is a loud, full-width reminder that the admin is not
// in their default super-admin context, so changes go to that area.
export function AdminModeBanner({ mode }: { mode: "maqraa" | "academy" }) {
  const { t } = useI18n();
  const admin = (t as any).admin as Record<string, string> | undefined
  const isAr = t.locale === "ar";
  const router = useRouter()
  const [exiting, setExiting] = useState(false)

  const config =
    mode === "maqraa"
      ? {
          label: "وضع مدير المقرأة",
          desc: "أنت تتصفح المنصة بصلاحيات مدير المقرأة. أي تعديل يخص جانب التلاوة والتسميع.",
          icon: Mic,
          bar: "bg-emerald-600",
          text: "text-emerald-50",
          btn: "bg-emerald-700/60 hover:bg-emerald-700",
        }
      : {
          label: "وضع مدير الأكاديمية",
          desc: "أنت تتصفح المنصة بصلاحيات مدير الأكاديمية. أي تعديل يخص جانب الدورات والطلاب.",
          icon: GraduationCap,
          bar: "bg-blue-600",
          text: "text-blue-50",
          btn: "bg-blue-700/60 hover:bg-blue-700",
        }

  const Icon = config.icon

  async function exitMode() {
    setExiting(true)
    try {
      await fetch("/api/admin/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "super" }),
      })
      router.refresh()
    } finally {
      setExiting(false)
    }
  }

  return (
    <div
      dir="rtl"
      className={`flex flex-col items-start gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between ${config.bar} ${config.text}`}
      role="status"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black leading-tight">{config.label}</p>
          <p className="text-xs leading-tight opacity-90">{config.desc}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={exitMode}
        disabled={exiting}
        className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${config.btn}`}
      >
        {exiting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        {isAr ? "العودة لوضع المدير العام" : "العودة لوضع Super Admin"}
      </button>
    </div>
  )
}
