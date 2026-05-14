"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowRight, GraduationCap, CheckCircle2, ChevronDown, ChevronUp, Loader2,
  Lock, Mic, Play, Trophy, Unlock, FileText, Video,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import AudioRecorder from "@/components/applicant/audio-recorder"
import TajweedPdfViewer from "@/components/tajweed/pdf-viewer"
import { useI18n } from "@/lib/i18n/context"

type ProgressRow = {
  id?: string
  status: "locked" | "unlocked" | "in_progress" | "completed"
  audio_url?: string | null
  recitation_id?: string | null
  notes?: string | null
  started_at?: string | null
  completed_at?: string | null
}

type Stage = {
  id: string
  position: number
  title: string
  description: string | null
  content: string | null
  video_url: string | null
  pdf_url: string | null
  passage_text: string | null
  estimated_minutes: number
  progress?: ProgressRow
}

export default function StudentTajweedPathDetail() {
  const params = useParams<{ id: string }>()
  const pathId = params.id
  const { t } = useI18n()
  const tp = (t as any).tajweedPaths

  const [path, setPath] = useState<any>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [enrollment, setEnrollment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)

  const [completeDialog, setCompleteDialog] = useState<Stage | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/student/tajweed-paths/${pathId}`)
      const data = await res.json()
      if (res.ok) {
        setPath(data.path)
        setStages(data.stages || [])
        setEnrollment(data.enrollment || null)
        const next = (data.stages || []).find(
          (s: Stage) => s.progress?.status !== "completed",
        )
        if (next) setExpandedStage(next.id)
      }
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { if (pathId) load() }, [pathId])

  async function enroll() {
    setEnrolling(true)
    try {
      const res = await fetch(`/api/student/tajweed-paths/${pathId}/enroll`, { method: "POST" })
      if (res.ok) await load()
    } finally {
      setEnrolling(false)
    }
  }

  async function startStage(stage: Stage) {
    if (!enrollment) return
    if (stage.progress?.status === "locked") return
    if (stage.progress?.status === "unlocked") {
      await fetch(
        `/api/student/tajweed-paths/${pathId}/stages/${stage.id}/start`,
        { method: "POST" },
      )
      await load()
    }
  }

  function openComplete(stage: Stage) {
    setCompleteDialog(stage)
    setAudioUrl(stage.progress?.audio_url || null)
  }

  async function submitComplete() {
    if (!completeDialog) return
    setSubmitting(true)
    try {
      const body: any = {}
      if (audioUrl) body.audio_url = audioUrl
      const res = await fetch(
        `/api/student/tajweed-paths/${pathId}/stages/${completeDialog.id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      )
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || tp.detail.completeFailed)
        return
      }
      setCompleteDialog(null)
      setAudioUrl(null)
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if (!path) return <div className="p-6 text-center text-muted-foreground">{tp.notFound}</div>

  const completed = enrollment?.stages_completed || 0
  const total = path.total_stages || stages.length || 1
  const pct = Math.round((completed / total) * 100)

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/student/tajweed-paths">
          <ArrowRight className="h-4 w-4 rtl:rotate-180" /> {tp.actions.backToPaths}
        </Link>
      </Button>

      <Card className="p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-emerald-600" />
          {path.title}
        </h1>
        {path.description && (
          <p className="text-sm text-muted-foreground mt-2">{path.description}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="secondary">{path.total_stages} {tp.metadata.stagesUnit}</Badge>
          {path.level && <Badge variant="outline">{tp.levels[path.level] || path.level}</Badge>}
          {path.estimated_days && (
            <Badge variant="outline">{path.estimated_days} {tp.metadata.estimatedDays}</Badge>
          )}
          {path.require_audio && (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
              <Mic className="h-3 w-3 me-1" /> {tp.metadata.requireAudioBadge}
            </Badge>
          )}
        </div>

        {!enrollment ? (
          <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {tp.detail.enrollPrompt}
            </p>
            <Button onClick={enroll} disabled={enrolling} className="gap-2">
              {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {tp.actions.startPath}
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{tp.metadata.yourProgress}</span>
              <span className="font-semibold">{completed}/{total} ({pct}%)</span>
            </div>
            <Progress value={pct} className="h-3" />
            {enrollment.status === "completed" && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-900">
                <Trophy className="h-5 w-5" />
                <span className="font-semibold">{tp.metadata.pathCompleteCelebration}</span>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="space-y-2">
        {stages.map(stage => {
          const status = stage.progress?.status || "locked"
          const isLocked = !enrollment || status === "locked"
          const isCompleted = status === "completed"
          const isExpanded = expandedStage === stage.id

          return (
            <Card
              key={stage.id}
              className={
                "transition-shadow " +
                (isCompleted ? "border-emerald-300 bg-emerald-50/40 " : "") +
                (isLocked ? "opacity-70 " : "")
              }
            >
              <button
                type="button"
                onClick={() => {
                  if (isLocked) return
                  setExpandedStage(isExpanded ? null : stage.id)
                  if (!isExpanded) startStage(stage)
                }}
                disabled={isLocked}
                className="w-full text-start p-4 flex items-center gap-3 disabled:cursor-not-allowed"
              >
                <div
                  className={
                    "h-10 w-10 rounded-full flex items-center justify-center font-bold shrink-0 " +
                    (isCompleted
                      ? "bg-emerald-600 text-white"
                      : isLocked
                        ? "bg-muted text-muted-foreground"
                        : "bg-emerald-100 text-emerald-800")
                  }
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isLocked ? <Lock className="h-4 w-4" /> : stage.position}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {!isLocked && !isCompleted && status === "unlocked" && (
                      <Badge variant="outline" className="text-xs">
                        <Unlock className="h-3 w-3 me-1" /> {tp.statuses.inProgress}
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-xs">{tp.statuses.completed}</Badge>
                    )}
                    {status === "in_progress" && (
                      <Badge variant="secondary" className="text-xs">{tp.statuses.inProgress}</Badge>
                    )}
                  </div>
                  <div className="font-semibold mt-1 truncate">{stage.title}</div>
                  {stage.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {stage.description}
                    </div>
                  )}
                </div>

                {!isLocked && (
                  isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && !isLocked && (
                <div className="border-t border-border p-4 space-y-4">
                  {stage.description && (
                    <div className="text-sm text-muted-foreground">{stage.description}</div>
                  )}

                  {stage.content && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold mb-2">{tp.detail.learningContent}</h4>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{stage.content}</div>
                    </div>
                  )}

                  {stage.video_url && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                        <Video className="h-4 w-4" /> {tp.detail.videoTutorial}
                      </h4>
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                        <video src={stage.video_url} controls className="w-full h-full" />
                      </div>
                    </div>
                  )}

                  {stage.pdf_url && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                        <FileText className="h-4 w-4" /> {tp.detail.pdfFile}
                      </h4>
                      <TajweedPdfViewer src={stage.pdf_url} label={`${tp.detail.pdfFile} — ${stage.title}`} />
                    </div>
                  )}

                  {stage.passage_text && (
                    <div className="border-e-4 border-emerald-500 bg-emerald-50/40 p-3 rounded-md">
                      <h4 className="text-sm font-semibold mb-1">{tp.detail.practicePassage}</h4>
                      <div className="text-sm whitespace-pre-wrap leading-loose font-serif">
                        {stage.passage_text}
                      </div>
                    </div>
                  )}

                  {stage.progress?.audio_url && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tp.detail.yourPreviousRecording}</p>
                      <audio src={stage.progress.audio_url} controls className="w-full" />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {!isCompleted ? (
                      <Button onClick={() => openComplete(stage)} className="gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {tp.actions.completeStage}
                      </Button>
                    ) : (
                      <Button onClick={() => openComplete(stage)} variant="outline" className="gap-2">
                        <Mic className="h-4 w-4" /> {tp.actions.updateRecording}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Dialog open={!!completeDialog} onOpenChange={v => !v && setCompleteDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tp.detail.completeDialogTitle}: {completeDialog?.title}</DialogTitle>
            <DialogDescription>
              {path.require_audio
                ? tp.detail.requireAudioDescription
                : tp.detail.optionalAudioDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {completeDialog?.passage_text && (
              <div className="border-e-4 border-emerald-500 bg-emerald-50/40 p-3 rounded-md text-sm whitespace-pre-wrap leading-loose font-serif">
                {completeDialog.passage_text}
              </div>
            )}
            <AudioRecorder
              value={audioUrl}
              onChange={setAudioUrl}
              maxSeconds={600}
              label={tp.detail.audioRecorderLabel}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCompleteDialog(null)}>{tp.actions.cancel}</Button>
            <Button
              onClick={submitComplete}
              disabled={submitting || (path.require_audio && !audioUrl)}
              className="gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <CheckCircle2 className="h-4 w-4" />
              {tp.actions.pass}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
