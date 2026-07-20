"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ListChecks, FileText, UserPlus, UserCheck, MessagesSquare,
  ChevronLeft, ChevronRight, CheckCircle2, type LucideIcon
} from "lucide-react"

type Task = {
  key: string
  label: string
  count: number
  href: string
  icon: string
}

const ICONS: Record<string, LucideIcon> = {
  FileText,
  UserPlus,
  UserCheck,
  MessagesSquare,
}

export default function SupervisorTasksPage() {
  const { t, locale } = useI18n()
  const a = t.admin
  const isAr = locale === "ar"
  const [tasks, setTasks] = useState<Task[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/supervisor-tasks")
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
        setTotal(data.total || 0)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const Chevron = isAr ? ChevronLeft : ChevronRight

  return (
    <div className="p-4 md:p-6 space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ListChecks className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground text-balance">
            {a.svtTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {a.svtDesc}
          </p>
        </div>
      </header>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary/60" />
          <p className="mt-3 font-medium text-foreground">
            {a.svtNoTasks}
          </p>
          <p className="text-sm text-muted-foreground">
            {a.svtAllCaughtUp}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tasks.map((task) => {
            const Icon = ICONS[task.icon] || FileText
            const isEmpty = task.count === 0
            return (
              <Link
                key={task.key}
                href={task.href}
                className={`group flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/50 ${
                  isEmpty ? "opacity-60" : ""
                }`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                    isEmpty
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-bold text-card-foreground">{task.count}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {(t as any).supervisorDashboards?.[`task_${task.key}`] || task.label}
                  </p>
                </div>
                <Chevron className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
