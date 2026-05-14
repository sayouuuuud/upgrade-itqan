// Slug generation for article URLs. We rely on the transliteration package
// already in the project so Arabic titles get sensible Latin slugs.

import { slugify } from "transliteration"

export function generateSlug(title: string): string {
  const base = slugify(title, {
    lowercase: true,
    separator: "-",
    trim: true,
  })
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  // Fallback when transliteration produces an empty string.
  return base || `article-${Date.now()}`
}

export function withSuffix(slug: string, suffix: number): string {
  return `${slug}-${suffix}`
}

// Estimate reading time in minutes (very rough: 220 wpm for Arabic-heavy text).
export function estimateReadingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}
