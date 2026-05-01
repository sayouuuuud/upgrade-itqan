"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import {
  ChevronDown, Menu, X, type LucideIcon
} from "lucide-react"

export type AdminSidebarItem = {
  href: string
  label: string
  icon: LucideIcon
  badge?: number | string | null
}

export type AdminSidebarGroup = {
  title?: string
  items: AdminSidebarItem[]
  /**
   * If true, this group renders as a collapsible dropdown.
   * The dropdown content is rendered with explicit high z-index
   * to fix the long-standing issue where dropdowns appeared behind
   * page content (admin pages have many sticky headers and overlays).
   */
  collapsible?: boolean
  defaultOpen?: boolean
}

export type AdminSidebarProps = {
  groups: AdminSidebarGroup[]
  header?: ReactNode
  footer?: ReactNode
  /** Mobile open state — controlled or uncontrolled */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

/**
 * AdminSidebar — a standalone admin sidebar component.
 *
 * Why this file exists:
 * Admin pages have many overlays, sticky headers and dialogs. The previous
 * sidebar had collapsible dropdowns that rendered with a stacking context
 * conflict (z-index 50 on the aside, but the dropdown panel sat at the same
 * level and was hidden behind sibling page content).
 *
 * Fixes baked in:
 *   1. The aside itself sits at z-50 with `position: relative` so its
 *      children create a fresh stacking context.
 *   2. Each collapsible dropdown panel uses an explicit `z-[60]` and
 *      `relative` positioning so it always paints above sibling content.
 *   3. Mobile overlay sits at z-40 — below the sidebar but above page.
 */
export function AdminSidebar({
  groups,
  header,
  footer,
  open: openProp,
  onOpenChange,
  className,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next)
    else setInternalOpen(next)
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  return (
    <>
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-40 p-2 rounded-xl bg-card border border-border shadow-sm text-muted-foreground hover:text-foreground"
        aria-label="فتح القائمة الجانبية"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay (mobile only) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 right-0 w-72 flex flex-col bg-card border-l border-border shadow-sm",
          "transition-transform duration-200 lg:translate-x-0 lg:static",
          open ? "translate-x-0" : "translate-x-full",
          // CRITICAL: relative + z-50 ensures dropdowns inside paint above
          // sticky headers (z-10) and main content stacking contexts.
          "relative z-50 isolate",
          className,
        )}
      >
        {header && (
          <div className="border-b border-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex-1 min-w-0">{header}</div>
              <button
                className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {groups.map((group, gi) => (
            <SidebarGroupRender
              key={gi}
              group={group}
              groupIndex={gi}
              isActive={isActive}
              onItemClick={() => setOpen(false)}
            />
          ))}
        </nav>

        {footer && (
          <div className="p-4 border-t border-border mt-auto">
            {footer}
          </div>
        )}
      </aside>
    </>
  )
}

function SidebarGroupRender({
  group,
  groupIndex,
  isActive,
  onItemClick,
}: {
  group: AdminSidebarGroup
  groupIndex: number
  isActive: (href: string) => boolean
  onItemClick: () => void
}) {
  const [open, setOpen] = useState(group.defaultOpen ?? true)
  const hasActiveChild = group.items.some((it) => isActive(it.href))
  const isOpen = group.collapsible ? open || hasActiveChild : true

  return (
    <div className={groupIndex > 0 ? "mt-6" : ""}>
      {group.title && (
        group.collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-widest mb-2 px-3 py-2 text-muted-foreground/70 hover:text-foreground rounded-lg transition-colors"
            aria-expanded={isOpen}
          >
            <span>{group.title}</span>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                isOpen ? "rotate-180" : "rotate-0",
              )}
            />
          </button>
        ) : (
          <div className="text-[10px] font-bold uppercase tracking-widest mb-3 px-3 text-muted-foreground/60">
            {group.title}
          </div>
        )
      )}

      {/*
        The dropdown panel uses relative + z-[60] so its painted layer always
        sits above sibling stacking contexts (e.g. main content sticky bars).
      */}
      {isOpen && (
        <div className="relative z-[60] space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {group.items.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all relative",
                  active
                    ? "bg-primary/10 text-primary font-bold shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-transform duration-200",
                    active && "scale-110",
                  )}
                />
                <span className="font-medium">{item.label}</span>
                {item.badge ? (
                  <span className="mr-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-bold">
                    {item.badge}
                  </span>
                ) : null}
                {active && (
                  <span className="absolute right-0 w-1 h-6 bg-primary rounded-l-full" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
