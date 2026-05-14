"use client"

import { useState } from "react"
import { FileText, ExternalLink, Download, Maximize2, Minimize2 } from "lucide-react"

/**
 * Inline PDF viewer for admin review. Embeds the PDF via <iframe> (browser
 * built-in viewer) and offers fullscreen + download + open-in-new-tab.
 */
export default function AdminPdfViewer({ src, label }: { src: string; label?: string }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between gap-2 p-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="text-sm font-bold truncate">{label || "ملف PDF"}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => setExpanded(v => !v)}
                        className="text-muted-foreground hover:bg-muted p-1.5 rounded"
                        title={expanded ? "تصغير" : "ملء الشاشة"}
                    >
                        {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <a
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:bg-muted p-1.5 rounded"
                        title="فتح في تبويب جديد"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    <a
                        href={src}
                        download
                        className="text-muted-foreground hover:bg-muted p-1.5 rounded"
                        title="تحميل"
                    >
                        <Download className="w-4 h-4" />
                    </a>
                </div>
            </div>
            <iframe
                src={`${src}#view=FitH`}
                className={`w-full bg-muted ${expanded ? "h-[80vh]" : "h-[420px]"}`}
                title={label || "PDF preview"}
            />
        </div>
    )
}
