"use client"

import { useState, useRef } from "react"
import { FileText, Upload, Trash2, Loader2 } from "lucide-react"

type Props = {
    value?: string | null
    onChange: (url: string | null) => void
    label?: string
}

/**
 * Lets an applicant pick a PDF file (CV / ijazah / certificate) and uploads
 * it to UploadThing via /api/upload-pdf.
 */
export default function PdfUploader({ value, onChange, label }: Props) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)

    const onPick = async (file: File) => {
        if (file.type !== "application/pdf") {
            setError("الملف يجب أن يكون PDF")
            return
        }
        if (file.size > 8 * 1024 * 1024) {
            setError("الحد الأقصى 8 ميجا")
            return
        }
        setError(null)
        setUploading(true)
        try {
            const fd = new FormData()
            fd.append("file", file)
            const res = await fetch("/api/upload-pdf", { method: "POST", body: fd })
            if (!res.ok) throw new Error("فشل رفع الملف")
            const json = await res.json()
            onChange(json.url)
        } catch (err: any) {
            setError(err?.message || "فشل الرفع")
        } finally {
            setUploading(false)
            if (inputRef.current) inputRef.current.value = ""
        }
    }

    return (
        <div className="border border-border bg-card rounded-xl p-4 space-y-3">
            {label && <h4 className="font-bold text-sm">{label}</h4>}

            {value ? (
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                    <a
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 text-sm text-emerald-700 dark:text-emerald-300 hover:underline truncate"
                    >
                        تم رفع الملف — اضغط للعرض
                    </a>
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                        title="إزالة"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-6 px-4 cursor-pointer hover:bg-muted/30 transition-colors">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        disabled={uploading}
                        onChange={e => e.target.files?.[0] && onPick(e.target.files[0])}
                    />
                    {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : (
                        <Upload className="w-6 h-6 text-muted-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground">
                        {uploading ? "جاري الرفع..." : "اضغط لاختيار ملف PDF"}
                    </span>
                    <span className="text-xs text-muted-foreground">حد أقصى 8 ميجا</span>
                </label>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    )
}
