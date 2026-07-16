"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "@/lib/i18n/context"

interface SectionCardProps {
  icon: LucideIcon
  title: string
  description?: string
  onReset?: () => void
  resetLabel?: string
  children: ReactNode
}

export function SectionCard({ icon: Icon, title, description, onReset, resetLabel, children }: SectionCardProps) {
  const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
  const a = t.admin
  return (
    <Card className="border-border">
      <CardHeader className="bg-muted/30 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && <CardDescription className="text-xs mt-0.5">{description}</CardDescription>}
            </div>
          </div>
          {onReset && (
            <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
              <RotateCcw className="w-4 h-4 ml-1" />
              {resetLabel || a.scRestore}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">{children}</CardContent>
    </Card>
  )
}

interface ToggleRowProps {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  destructive?: boolean
}

export function ToggleRow({ label, description, checked, onChange, destructive }: ToggleRowProps) {
  return (
    <div
      className={
        destructive
          ? "flex items-center justify-between p-4 bg-destructive/10 border border-destructive/30 rounded-xl"
          : "flex items-center justify-between p-4 bg-muted/50 rounded-xl"
      }
    >
      <div className="space-y-0.5">
        <Label className={destructive ? "font-medium text-destructive" : "font-medium"}>{label}</Label>
        {description && (
          <p className={destructive ? "text-xs text-destructive/80" : "text-xs text-muted-foreground"}>
            {description}
          </p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
