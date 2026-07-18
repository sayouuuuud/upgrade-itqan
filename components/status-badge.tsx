import { cn } from "@/lib/utils"
import { type RecitationStatus, statusColors } from "@/lib/mock-data"
import { useI18n } from "@/lib/i18n/context"

export function StatusBadge({ status, className }: { status: RecitationStatus | string; className?: string }) {
  const { t } = useI18n()
  const app = (t as any).app as Record<string, string> | undefined
  const label = (t.admin.statuses as any)[status] || status
  const color = statusColors[status as RecitationStatus] || "bg-muted text-muted-foreground border-border"

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
        color,
        className
      )}
    >
      {label}
    </span>
  )
}
