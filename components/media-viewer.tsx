"use client"

import { useMemo, useState } from 'react'
import { ExternalLink, FileText, Image as ImageIcon, Video, Music, Download, Eye } from 'lucide-react'

interface MediaViewerProps {
  url: string
}

type MediaKind = 'audio' | 'video' | 'image' | 'pdf' | 'document' | 'link'

function detectKind(url: string): MediaKind {
  // Strip query string / hash before extension check so signed S3 URLs work.
  const clean = url.split('?')[0].split('#')[0].toLowerCase()
  if (/\.(mp3|wav|m4a|ogg|aac|flac|opus)(\?|$)/.test(clean)) return 'audio'
  if (/\.(mp4|mov|avi|mkv|webm|m4v)(\?|$)/.test(clean)) return 'video'
  if (/\.(jpe?g|png|gif|webp|svg|bmp|avif)(\?|$)/.test(clean)) return 'image'
  if (/\.(pdf)(\?|$)/.test(clean)) return 'pdf'
  if (/\.(docx?|xlsx?|pptx?|txt|rtf|odt|ods|odp)(\?|$)/.test(clean)) return 'document'
  // Cloudinary / S3 paths use folder hints like `/audio/`, `/video/`, `/image/`.
  // Require a delimiter on both sides so we don't false-match query strings.
  if (/\/audio\//.test(clean)) return 'audio'
  if (/\/video\//.test(clean)) return 'video'
  if (/\/image\//.test(clean)) return 'image'
  return 'link'
}

function fileNameFromUrl(url: string): string {
  try {
    const u = new URL(url)
    const last = u.pathname.split('/').filter(Boolean).pop() || url
    return decodeURIComponent(last)
  } catch {
    return url.split('/').filter(Boolean).pop() || url
  }
}

export default function MediaViewer({ url }: MediaViewerProps) {
  const [pdfOpen, setPdfOpen] = useState(false)
  const kind = useMemo(() => (url ? detectKind(url) : 'link'), [url])

  if (!url) return null

  if (kind === 'audio') {
    return (
      <div className="bg-muted/50 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-muted-foreground">
          <Music className="w-4 h-4" /> مقطع صوتي
        </div>
        <audio controls src={url} className="w-full h-10 outline-none" />
        <div className="mt-2 flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            فتح في تبويب جديد
          </a>
          <a
            href={url}
            download
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Download className="w-3.5 h-3.5" />
            تحميل
          </a>
        </div>
      </div>
    )
  }

  if (kind === 'video') {
    return (
      <div className="bg-muted/50 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-muted-foreground">
          <Video className="w-4 h-4" /> مقطع فيديو
        </div>
        <video controls src={url} className="w-full rounded-lg max-h-72 bg-black object-contain outline-none" />
        <div className="mt-2 flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            فتح في تبويب جديد
          </a>
          <a
            href={url}
            download
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Download className="w-3.5 h-3.5" />
            تحميل
          </a>
        </div>
      </div>
    )
  }

  if (kind === 'image') {
    return (
      <div className="bg-muted/50 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-muted-foreground">
          <ImageIcon className="w-4 h-4" /> صورة
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="مرفق" className="w-full rounded-lg max-h-72 object-contain bg-background" />
        </a>
        <div className="mt-2 flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            فتح بحجم كامل
          </a>
          <a
            href={url}
            download
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Download className="w-3.5 h-3.5" />
            تحميل
          </a>
        </div>
      </div>
    )
  }

  if (kind === 'pdf') {
    return (
      <div className="bg-muted/50 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground min-w-0">
            <FileText className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="truncate" dir="ltr">{fileNameFromUrl(url)}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setPdfOpen((v) => !v)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              {pdfOpen ? 'إخفاء العرض' : 'عرض الملف'}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-background border border-border hover:bg-muted transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              تبويب جديد
            </a>
            <a
              href={url}
              download
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-background border border-border hover:bg-muted transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              تحميل
            </a>
          </div>
        </div>
        {pdfOpen && (
          <iframe
            src={`${url}#view=FitH`}
            className="w-full h-[60vh] min-h-[420px] bg-background rounded-lg border border-border"
            title="PDF preview"
          />
        )}
      </div>
    )
  }

  // Documents and unknown files: link-style with both open + download.
  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-3">
      <FileText className="w-5 h-5 shrink-0 text-primary" />
      <span className="flex-1 truncate text-sm font-bold" dir="ltr">{fileNameFromUrl(url)}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        فتح
      </a>
      <a
        href={url}
        download
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold bg-background border border-border hover:bg-muted transition-colors shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        تحميل
      </a>
    </div>
  )
}
