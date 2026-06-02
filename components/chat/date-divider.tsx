import { formatChatDate } from '@/lib/chat-date'

interface ChatDateDividerProps {
  date: string | null | undefined
  isAr?: boolean
}

/**
 * Centered date separator shown between messages from different days,
 * shared across all chat threads (teacher, student, reader, parent, supervisors).
 */
export function ChatDateDivider({ date, isAr = true }: ChatDateDividerProps) {
  const label = formatChatDate(date, isAr)
  if (!label) return null
  return (
    <div className="flex items-center justify-center my-2" aria-hidden={false}>
      <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-bold shadow-sm border border-border/50">
        {label}
      </span>
    </div>
  )
}
