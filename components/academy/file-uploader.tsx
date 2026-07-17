"use client"

import { useState, useRef } from "react"
import { Upload, Trash2, Loader2, File, CheckCircle2 } from "lucide-react"

interface FileUploaderProps {
  value?: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
  label?: string
  accept?: string
}

export default function FileUploader({ value, onChange, disabled, label, accept }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "فشل رفع الملف")
      }

      const json = await res.json()
      onChange(json.url)
    } catch (err: any) {
      setError(err?.message || "فشل الرفع، يرجى المحاولة مرة أخرى")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    handleUpload(file)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled || uploading) return
    setIsDragging(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled || uploading) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium">{label}</label>}
      
      {value ? (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 truncate">
              {"تم رفع الملف بنجاح"}</p>
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
              {"اضغط هنا للمعاينة"}</a>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition disabled:opacity-50"
            title={"حذف الملف"}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div>
          <label 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-6 transition-all ${
              disabled || uploading 
                ? 'opacity-50 cursor-not-allowed bg-muted/30 border-border' 
                : isDragging
                  ? 'border-primary bg-primary/10 scale-[1.02]'
                  : 'cursor-pointer hover:bg-primary/5 hover:border-primary/40 border-border bg-card'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={accept}
              disabled={disabled || uploading}
              onChange={handleFileChange}
            />
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${uploading || isDragging ? 'bg-primary/10' : 'bg-muted'}`}>
              {uploading ? (
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              ) : (
                <Upload className={`w-6 h-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              )}
            </div>
            <div className="text-center">
              <p className={`text-sm font-bold ${isDragging ? 'text-primary' : ''}`}>
                {uploading ? "جاري الرفع..." : isDragging ? "أفلت الملف هنا" : "اضغط أو اسحب الملف هنا"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {"يدعم الصور، الملفات الصوتية، الفيديو، والمستندات"}</p>
            </div>
          </label>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  )
}
