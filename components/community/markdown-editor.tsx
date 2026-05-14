"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { MarkdownView } from "./markdown-view"
import { Eye, Pencil } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface MarkdownEditorProps {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  rows?: number
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 10,
}: MarkdownEditorProps) {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const [mode, setMode] = useState<"edit" | "preview">("edit")

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "edit" ? "default" : "outline"}
          onClick={() => setMode("edit")}
        >
          <Pencil className="w-4 h-4 ml-1" />
          {isAr ? "تحرير" : "Edit"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "preview" ? "default" : "outline"}
          onClick={() => setMode("preview")}
        >
          <Eye className="w-4 h-4 ml-1" />
          {isAr ? "معاينة" : "Preview"}
        </Button>
        <span className="text-xs text-muted-foreground self-center ml-auto">
          {isAr
            ? "يدعم: # عناوين، **عريض**، *مائل*، `كود`، روابط، قوائم"
            : "Supports: # headings, **bold**, *italic*, `code`, links, lists"}
        </span>
      </div>

      {mode === "edit" ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="font-mono text-sm"
        />
      ) : (
        <div className="rounded-md border border-border p-4 min-h-[200px] bg-card prose prose-sm dark:prose-invert max-w-none">
          {value.trim() ? (
            <MarkdownView content={value} />
          ) : (
            <p className="text-muted-foreground text-sm">
              {isAr ? "لا يوجد محتوى للمعاينة" : "Nothing to preview"}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
