'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PlayCircle } from 'lucide-react'

interface Props {
  url: string
  title: string
  children?: React.ReactNode
}

export function VideoPlayerModal({ url, title, children }: Props) {
  const [open, setOpen] = useState(false)

  const signedUrl = `/api/video/recordings/watch?url=${encodeURIComponent(url)}`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button size="sm" className="flex-1 gap-1">
            <PlayCircle className="w-4 h-4" />
            مشاهدة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl bg-black" dir="rtl">
        <DialogHeader className="p-4 absolute top-0 w-full z-10 bg-gradient-to-b from-black/80 to-transparent">
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        {open && (
          <div className="relative w-full aspect-video flex items-center justify-center bg-black mt-12 mb-4">
            <video
              src={signedUrl}
              controls
              autoPlay
              controlsList="nodownload"
              className="w-full h-full max-h-[75vh] outline-none"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
