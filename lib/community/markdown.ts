// Tiny, dependency-free Markdown -> HTML renderer.
//
// Covers the subset users actually need for forum/article content:
//   # / ## / ### / #### headings
//   **bold** and *italic* and __bold__ and _italic_
//   `inline code` and ```fenced code blocks```
//   > blockquotes
//   - / * / 1. lists  (nesting via leading spaces is not supported)
//   [text](url)  and  ![alt](url) images
//   --- horizontal rules
//   Auto-linked URLs
//
// Output is escaped so users can't inject raw HTML.

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const renderInline = (raw: string): string => {
  let text = escapeHtml(raw)

  // Images: ![alt](url)
  text = text.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_m, alt, url, title) =>
      `<img src="${url}" alt="${alt}" ${title ? `title="${title}"` : ""} class="my-3 max-w-full rounded-lg" loading="lazy" />`
  )
  // Links: [text](url)
  text = text.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_m, label, url, title) =>
      `<a href="${url}" ${title ? `title="${title}"` : ""} class="text-primary underline" target="_blank" rel="noopener noreferrer">${label}</a>`
  )
  // Inline code
  text = text.replace(
    /`([^`]+)`/g,
    '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
  )
  // Bold (**) and __
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  text = text.replace(/__([^_]+)__/g, "<strong>$1</strong>")
  // Italic (*) and _
  text = text.replace(/(?<![*\w])\*([^*\n]+)\*(?!\w)/g, "<em>$1</em>")
  text = text.replace(/(?<![_\w])_([^_\n]+)_(?!\w)/g, "<em>$1</em>")
  // Bare URL auto-link (skip ones already inside an attribute)
  text = text.replace(
    /(^|[\s(])(https?:\/\/[^\s<]+)/g,
    (_m, pre, url) =>
      `${pre}<a href="${url}" class="text-primary underline" target="_blank" rel="noopener noreferrer">${url}</a>`
  )
  return text
}

export function renderMarkdown(input: string): string {
  if (!input) return ""

  const lines = input.replace(/\r\n?/g, "\n").split("\n")
  const out: string[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, "").trim()
      i++
      const buf: string[] = []
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i])
        i++
      }
      i++ // skip closing fence
      out.push(
        `<pre class="bg-muted rounded-lg p-3 overflow-x-auto my-3 text-sm" data-lang="${escapeHtml(
          lang
        )}"><code>${escapeHtml(buf.join("\n"))}</code></pre>`
      )
      continue
    }

    // Headings
    const heading = /^(#{1,4})\s+(.*)$/.exec(line)
    if (heading) {
      const level = heading[1].length + 1 // h2..h5 (avoid clashing with page h1)
      out.push(
        `<h${level} class="font-bold mt-5 mb-2 text-foreground">${renderInline(
          heading[2]
        )}</h${level}>`
      )
      i++
      continue
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      out.push('<hr class="my-4 border-border" />')
      i++
      continue
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""))
        i++
      }
      out.push(
        `<blockquote class="border-r-4 border-primary/40 pr-3 my-3 text-muted-foreground">${renderInline(
          buf.join(" ")
        )}</blockquote>`
      )
      continue
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""))
        i++
      }
      out.push(
        `<ul class="list-disc pr-6 my-3 space-y-1">${items
          .map((it) => `<li>${renderInline(it)}</li>`)
          .join("")}</ul>`
      )
      continue
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""))
        i++
      }
      out.push(
        `<ol class="list-decimal pr-6 my-3 space-y-1">${items
          .map((it) => `<li>${renderInline(it)}</li>`)
          .join("")}</ol>`
      )
      continue
    }

    // Blank line
    if (!line.trim()) {
      i++
      continue
    }

    // Paragraph: consume non-blank lines and join with <br>
    const buf: string[] = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4})\s+|^>\s?|^[-*]\s+|^\d+\.\s+|^```|^---+\s*$/.test(lines[i])
    ) {
      buf.push(lines[i])
      i++
    }
    out.push(
      `<p class="my-3 leading-relaxed">${buf
        .map((b) => renderInline(b))
        .join("<br />")}</p>`
    )
  }

  return out.join("\n")
}
