"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2,
  ExternalLink, Download, FileText, Loader2, AlertTriangle,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

// react-pdf bundles its own worker; we serve a local copy from /public
// so the viewer works offline and doesn't depend on a third-party CDN.
//
// The dynamic imports below keep pdf.js out of the SSR bundle.
const Document = dynamic(
  () => import("react-pdf").then(mod => mod.Document),
  { ssr: false },
)
const Page = dynamic(
  () => import("react-pdf").then(mod => mod.Page),
  { ssr: false },
)

let workerConfigured = false
async function configureWorker() {
  if (workerConfigured) return
  const { pdfjs } = await import("react-pdf")
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf-worker/pdf.worker.min.mjs"
  workerConfigured = true
}

const MIN_SCALE = 0.5
const MAX_SCALE = 2.5
const SCALE_STEP = 0.2

export interface TajweedPdfViewerProps {
  src: string
  label?: string
  className?: string
}

export default function TajweedPdfViewer({ src, label, className }: TajweedPdfViewerProps) {
  const { t, dir } = useI18n()
  const v = (t as any).tajweedPaths?.pdfViewer ?? {}

  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1)
  const [expanded, setExpanded] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    void configureWorker()
  }, [])

  useEffect(() => {
    setPageNumber(1)
    setError(null)
    setIsLoading(true)
  }, [src])

  // Track container width so the page can scale to fit horizontally.
  useEffect(() => {
    const node = containerRef.current
    if (!node || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        if (w > 0) setContainerWidth(w)
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const pageWidth = useMemo(() => {
    if (containerWidth <= 0) return undefined
    // Subtract a little so the page never overflows the container's padding.
    return Math.max(280, containerWidth - 24)
  }, [containerWidth])

  const onDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
    setNumPages(n)
    setIsLoading(false)
    setError(null)
  }

  const onDocumentLoadError = (err: Error) => {
    setError(err.message || "PDF load error")
    setIsLoading(false)
  }

  const goPrev = () => setPageNumber(p => Math.max(1, p - 1))
  const goNext = () => setPageNumber(p => Math.min(numPages || 1, p + 1))
  const zoomIn = () => setScale(s => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)))
  const zoomOut = () => setScale(s => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)))
  const resetZoom = () => setScale(1)

  // Memoize options to avoid re-rendering Document on every parent render.
  const documentOptions = useMemo(
    () => ({
      cMapUrl: "https://unpkg.com/pdfjs-dist@5.4.296/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "https://unpkg.com/pdfjs-dist@5.4.296/standard_fonts/",
    }),
    [],
  )

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl overflow-hidden flex flex-col",
        className,
      )}
      dir={dir}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="text-sm font-semibold truncate">
            {label || v.defaultLabel || "PDF"}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Page navigation */}
          <button
            type="button"
            onClick={goPrev}
            disabled={pageNumber <= 1 || !!error}
            className="p-1.5 rounded text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            title={v.previous || "Previous"}
            aria-label={v.previous || "Previous"}
          >
            <ChevronRight className="w-4 h-4 rtl:hidden" />
            <ChevronLeft className="w-4 h-4 ltr:hidden" />
          </button>
          <span className="text-xs tabular-nums px-1 min-w-[64px] text-center">
            {numPages > 0
              ? `${pageNumber} / ${numPages}`
              : "—"}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={pageNumber >= numPages || !!error}
            className="p-1.5 rounded text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            title={v.next || "Next"}
            aria-label={v.next || "Next"}
          >
            <ChevronLeft className="w-4 h-4 rtl:hidden" />
            <ChevronRight className="w-4 h-4 ltr:hidden" />
          </button>

          {/* Zoom */}
          <div className="mx-1 h-5 w-px bg-border" />
          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            className="p-1.5 rounded text-muted-foreground hover:bg-muted disabled:opacity-40"
            title={v.zoomOut || "Zoom out"}
            aria-label={v.zoomOut || "Zoom out"}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="text-xs tabular-nums px-1 min-w-[44px] text-muted-foreground hover:bg-muted rounded"
            title={v.resetZoom || "Reset zoom"}
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            className="p-1.5 rounded text-muted-foreground hover:bg-muted disabled:opacity-40"
            title={v.zoomIn || "Zoom in"}
            aria-label={v.zoomIn || "Zoom in"}
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="mx-1 h-5 w-px bg-border" />
          <button
            type="button"
            onClick={() => setExpanded(x => !x)}
            className="p-1.5 rounded text-muted-foreground hover:bg-muted"
            title={expanded ? (v.shrink || "Shrink") : (v.fullscreen || "Expand")}
            aria-label={expanded ? (v.shrink || "Shrink") : (v.fullscreen || "Expand")}
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded text-muted-foreground hover:bg-muted"
            title={v.openNewTab || "Open in new tab"}
            aria-label={v.openNewTab || "Open in new tab"}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href={src}
            download
            className="p-1.5 rounded text-muted-foreground hover:bg-muted"
            title={v.download || "Download"}
            aria-label={v.download || "Download"}
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Document area */}
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-auto bg-muted/30 flex justify-center",
          expanded ? "h-[80vh]" : "h-[520px]",
        )}
        // pdf.js renders left-to-right; force LTR so canvas pages aren't flipped.
        dir="ltr"
      >
        {error ? (
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground p-6 text-center w-full">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <p className="font-semibold">{v.errorTitle || "Failed to load PDF"}</p>
            <p className="text-xs">{error}</p>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:underline text-xs mt-2"
            >
              {v.openNewTab || "Open in new tab"}
            </a>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center gap-3">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <Document
              file={src}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
              error={null}
              options={documentOptions}
            >
              {pageWidth ? (
                <Page
                  pageNumber={pageNumber}
                  width={pageWidth}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={null}
                />
              ) : null}
            </Document>
          </div>
        )}
      </div>
    </div>
  )
}
