"use client"

/**
 * Shared skeleton loading components used across all dashboard pages.
 * Every skeleton uses animate-pulse and supports dark mode via dark: variants.
 */

// ─── primitives ──────────────────────────────────────────────────────────────

function Bone({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-slate-200 dark:bg-white/10 animate-pulse ${className}`}
    />
  )
}

// ─── generic list of cards ────────────────────────────────────────────────────

export function CardListSkeleton({
  rows = 3,
  className = "",
}: {
  rows?: number
  className?: string
}) {
  return (
    <div className={`space-y-4 ${className}`} aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Bone className="h-5 w-1/3" />
              <Bone className="h-4 w-1/2" />
            </div>
            <Bone className="h-7 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="space-y-1.5">
                <Bone className="h-3 w-14" />
                <Bone className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── table (archive, access-control, etc.) ───────────────────────────────────

export function TableSkeleton({
  rows = 5,
  cols = 4,
  className = "",
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div
      className={`bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm ${className}`}
      aria-busy="true"
    >
      {/* header row */}
      <div className="flex gap-4 px-5 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      {/* data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-5 py-4 border-b border-slate-100 dark:border-white/5 last:border-0"
        >
          {Array.from({ length: cols }).map((_, j) => (
            <Bone
              key={j}
              className={`h-4 flex-1 ${j === 0 ? "w-1/4" : j === cols - 1 ? "w-16 flex-none" : ""}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── stats / analytics dashboard ─────────────────────────────────────────────

export function StatsSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`} aria-busy="true">
      {/* stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-3"
          >
            <Bone className="h-4 w-20" />
            <Bone className="h-8 w-16" />
            <Bone className="h-3 w-24" />
          </div>
        ))}
      </div>
      {/* chart area */}
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
        <Bone className="h-5 w-36" />
        <Bone className="h-48 w-full rounded-xl" />
      </div>
    </div>
  )
}

// ─── profile page ─────────────────────────────────────────────────────────────

export function ProfileSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-6 max-w-2xl ${className}`} aria-busy="true">
      {/* avatar + name */}
      <div className="flex items-center gap-5">
        <Bone className="h-20 w-20 rounded-full" />
        <div className="space-y-2 flex-1">
          <Bone className="h-6 w-40" />
          <Bone className="h-4 w-28" />
        </div>
      </div>
      {/* fields */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <Bone className="h-3.5 w-24" />
          <Bone className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}

// ─── path detail (tajweed / memorization learning path) ──────────────────────

export function PathDetailSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-8 max-w-6xl mx-auto pb-12 p-4 sm:p-6 ${className}`} aria-busy="true">
      {/* header */}
      <div className="flex items-center justify-between pb-6 border-b border-border/50">
        <div className="space-y-3 flex-1">
          <Bone className="h-4 w-24" />
          <Bone className="h-7 w-64" />
          <Bone className="h-4 w-80" />
        </div>
        <Bone className="h-10 w-32 rounded-xl" />
      </div>
      {/* stat chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted/40 rounded-2xl p-4 space-y-2">
            <Bone className="h-3 w-16" />
            <Bone className="h-6 w-10" />
          </div>
        ))}
      </div>
      {/* stage cards */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-border rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <Bone className="h-5 w-40" />
            <Bone className="h-8 w-20 rounded-xl" />
          </div>
          <Bone className="h-4 w-2/3" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((j) => (
              <Bone key={j} className="h-3 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── sessions list ────────────────────────────────────────────────────────────

export function SessionsListSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`} aria-busy="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-5"
        >
          <div className="flex-1 space-y-3">
            <div className="flex gap-3 items-center">
              <Bone className="h-5 w-36" />
              <Bone className="h-5 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="space-y-1.5">
                  <Bone className="h-3 w-14" />
                  <Bone className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex md:flex-col gap-3 md:w-36">
            <Bone className="h-10 flex-1 md:w-full rounded-xl" />
            <Bone className="h-10 flex-1 md:w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── simple list (invitations / lessons / announcements / badges) ─────────────

export function SimpleListSkeleton({
  rows = 4,
  className = "",
}: {
  rows?: number
  className?: string
}) {
  return (
    <div className={`space-y-3 ${className}`} aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl"
        >
          <div className="space-y-2 flex-1">
            <Bone className="h-4 w-1/3" />
            <Bone className="h-3 w-1/2" />
          </div>
          <div className="flex gap-2">
            <Bone className="h-8 w-16 rounded-lg" />
            <Bone className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── learning paths list (reader) ────────────────────────────────────────────

export function PathsListSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`} aria-busy="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Bone className="h-5 w-1/3" />
              <Bone className="h-4 w-2/3" />
            </div>
            <div className="flex gap-2">
              <Bone className="h-8 w-24 rounded-xl" />
              <Bone className="h-8 w-20 rounded-xl" />
            </div>
          </div>
          <div className="flex gap-3">
            {[1, 2, 3].map((j) => (
              <Bone key={j} className="h-6 w-24 rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── backup / seo settings ───────────────────────────────────────────────────

export function SettingsSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-6 max-w-3xl ${className}`} aria-busy="true">
      {/* header */}
      <div className="space-y-2">
        <Bone className="h-7 w-48" />
        <Bone className="h-4 w-80" />
      </div>
      {/* sections */}
      {[1, 2].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4"
        >
          <Bone className="h-5 w-36" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="space-y-2">
                <Bone className="h-3.5 w-24" />
                <Bone className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
          <Bone className="h-10 w-32 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

// ─── student recitation detail ───────────────────────────────────────────────

export function RecitationDetailSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`max-w-3xl mx-auto space-y-6 p-4 ${className}`} aria-busy="true">
      <div className="flex items-center gap-3">
        <Bone className="h-8 w-8 rounded-lg" />
        <Bone className="h-6 w-48" />
      </div>
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <Bone className="h-3 w-16" />
              <Bone className="h-5 w-28" />
            </div>
          ))}
        </div>
        <Bone className="h-24 w-full rounded-xl" />
        <Bone className="h-10 w-full rounded-xl" />
      </div>
    </div>
  )
}

// ─── conversations / messages ─────────────────────────────────────────────────

export function ConversationsSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`flex gap-0 h-[600px] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden ${className}`} aria-busy="true">
      {/* sidebar */}
      <div className="w-72 border-e border-slate-200 dark:border-white/10 flex flex-col gap-1 p-3">
        <Bone className="h-10 w-full rounded-xl mb-2" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
            <Bone className="h-10 w-10 rounded-full flex-none" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-4 w-24" />
              <Bone className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
      {/* chat panel */}
      <div className="flex-1 flex flex-col justify-between p-4 gap-3">
        <div className="space-y-3 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
              <Bone className="h-8 w-8 rounded-full flex-none" />
              <Bone className={`h-14 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-64"}`} />
            </div>
          ))}
        </div>
        <Bone className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  )
}

// ─── parent restrictions ──────────────────────────────────────────────────────

export function RestrictionsSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`} aria-busy="true">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Bone className="h-5 w-32" />
              <Bone className="h-4 w-48" />
            </div>
            <Bone className="h-8 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="space-y-1.5">
                <Bone className="h-3 w-14" />
                <Bone className="h-8 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
