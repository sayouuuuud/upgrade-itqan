import { ExternalLink, FileText, Image as ImageIcon, Video, Music } from 'lucide-react'

interface MediaViewerProps {
  url: string
}

export default function MediaViewer({ url }: MediaViewerProps) {
  if (!url) return null

  const lowerUrl = url.toLowerCase()
  
  // Audio
  if (lowerUrl.match(/\.(mp3|wav|m4a|ogg|aac|webm)$/) || lowerUrl.includes('audio')) {
    return (
      <div className="bg-muted/50 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-muted-foreground">
          <Music className="w-4 h-4" /> مقطع صوتي
        </div>
        <audio controls src={url} className="w-full h-10 outline-none" />
      </div>
    )
  }

  // Video
  if (lowerUrl.match(/\.(mp4|mov|avi|mkv|webm)$/) || lowerUrl.includes('video')) {
    return (
      <div className="bg-muted/50 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-muted-foreground">
          <Video className="w-4 h-4" /> مقطع فيديو
        </div>
        <video controls src={url} className="w-full rounded-lg max-h-64 bg-black object-contain outline-none" />
      </div>
    )
  }

  // Image
  if (lowerUrl.match(/\.(jpeg|jpg|png|gif|webp|svg)$/) || lowerUrl.includes('image')) {
    return (
      <div className="bg-muted/50 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-muted-foreground">
          <ImageIcon className="w-4 h-4" /> صورة
        </div>
        <img src={url} alt="مرفق" className="w-full rounded-lg max-h-64 object-contain bg-background" />
      </div>
    )
  }

  // Document or Unknown (Fallback)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-3 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors w-full"
    >
      <FileText className="w-5 h-5 shrink-0" />
      <span className="flex-1 text-right truncate" dir="ltr">{url}</span>
      <ExternalLink className="w-4 h-4 shrink-0" />
    </a>
  )
}
