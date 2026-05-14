"use client"

import { useMemo } from "react"
import { renderMarkdown } from "@/lib/community/markdown"

interface MarkdownViewProps {
  content: string
  className?: string
}

export function MarkdownView({ content, className }: MarkdownViewProps) {
  const html = useMemo(() => renderMarkdown(content || ""), [content])
  return (
    <div
      className={className}
      // Output is escaped before tag wrapping in renderMarkdown.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
