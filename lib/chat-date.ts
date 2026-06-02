// Shared helpers for rendering message dates / date separators in chat threads.
// Used across every account type's chat UI so message history is dated consistently.

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/**
 * Returns true when `current` falls on a different calendar day than `prev`
 * (or when there is no previous message), i.e. a date divider should be shown
 * before the current message.
 */
export function shouldShowDateDivider(
  prev: string | null | undefined,
  current: string | null | undefined,
): boolean {
  if (!current) return false
  if (!prev) return true
  const p = new Date(prev)
  const c = new Date(current)
  if (isNaN(p.getTime()) || isNaN(c.getTime())) return false
  return startOfDay(p) !== startOfDay(c)
}

/**
 * Human-friendly day label: "اليوم" / "أمس" / full date.
 */
export function formatChatDate(dateStr: string | null | undefined, isAr: boolean): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''

  const today = startOfDay(new Date())
  const target = startOfDay(d)
  const dayMs = 24 * 60 * 60 * 1000

  if (target === today) return isAr ? 'اليوم' : 'Today'
  if (target === today - dayMs) return isAr ? 'أمس' : 'Yesterday'

  return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: target < today - 330 * dayMs ? 'numeric' : undefined,
  })
}

/**
 * Time label (hour:minute) for a single message bubble.
 */
export function formatChatTime(dateStr: string | null | undefined, isAr: boolean): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
}
