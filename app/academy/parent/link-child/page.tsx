'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Link as LinkIcon,
  UserPlus,
  CheckCircle2,
  User,
  Loader2,
  AlertCircle,
  ArrowRight,
  Clock,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

interface FoundStudent {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

const relationOptions = [
  { value: 'father' },
  { value: 'mother' },
  { value: 'guardian' },
]

export default function LinkChildPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [student, setStudent] = useState<FoundStudent | null>(null)
  const [error, setError] = useState('')
  const [relation, setRelation] = useState('father')
  const [linking, setLinking] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError('')
    setStudent(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/academy/parent/link-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t.parentPages?.linkChild?.errorOccurred)
      } else {
        setStudent(data.student)
      }
    } catch {
      setError(t.parentPages?.linkChild?.connectionFailed)
    } finally {
      setLoading(false)
    }
  }

  const handleLink = async () => {
    if (!student) return
    setLinking(true)
    setError('')

    try {
      const res = await fetch('/api/academy/parent/link-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'link', child_id: student.id, relation }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t.parentPages?.linkChild?.linkingFailed)
      } else {
        setSuccess(true)
        setStudent(null)
        setEmail('')
      }
    } catch {
      setError(t.parentPages?.linkChild?.connectionFailed)
    } finally {
      setLinking(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
          <UserPlus className="w-4 h-4" />
          {t.parentPages?.linkChild?.linkNewChild}
        </div>
        <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
          {t.parentPages?.linkChild?.linkStudentAccount}
        </h1>
        <p className="text-muted-foreground font-medium max-w-2xl">
          {t.parentPages?.linkChild?.linkStudentDesc}
        </p>
      </div>

      {/* Success State */}
      {success ? (
        <Card className="rounded-2xl border-emerald-200/50 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-3">
              {t.parentPages?.linkChild?.linkRequestSent}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-2">
              {t.parentPages?.linkChild?.linkSuccessDesc}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-4">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                {t.parentPages?.linkChild?.pendingApproval}
              </span>
            </div>
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                variant="outline"
                className="rounded-xl font-bold"
              >
                {t.parentPages?.linkChild?.linkAnotherChild}
              </Button>
              <Button asChild className="rounded-xl font-bold">
                <Link href="/academy/parent/children">
                  {t.parentPages?.linkChild?.viewChildren}
                  <ArrowRight className={`w-4 h-4 ${isAr ? 'me-2 rotate-180' : 'ms-2'}`} />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search Form */}
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <Mail
                    className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`}
                  />
                  <Input
                    type="email"
                    placeholder={t.parentPages?.linkChild?.enterStudentEmail}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`h-12 rounded-xl ${isAr ? 'pr-12' : 'pl-12'}`}
                    dir="ltr"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 px-6 font-bold rounded-xl"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 me-2" />
                      {t.parentPages?.linkChild?.searchButton}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Student Found */}
          {student && (
            <Card className="rounded-2xl border-border/50 overflow-hidden">
              <CardContent className="p-0">
                {/* Student Info */}
                <div className="p-6 border-b border-border/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      {t.parentPages?.linkChild?.studentFound}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 ring-2 ring-background shadow-sm">
                      <AvatarImage src={student.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                        {student.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{student.name}</h3>
                      <p className="text-sm text-muted-foreground" dir="ltr">
                        {student.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Relation Selection */}
                <div className="p-6">
                  <p className="text-sm font-bold text-foreground mb-3">
                    {t.parentPages?.linkChild?.yourRelationship}
                  </p>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {relationOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRelation(opt.value)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          relation === opt.value
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-primary/50 text-muted-foreground'
                        }`}
                      >
                        <span className="text-sm font-bold">
                          {(t.parentPages?.linkChild?.relationOptions as any)[opt.value]}
                        </span>
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={handleLink}
                    disabled={linking}
                    className="w-full h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                  >
                    {linking ? (
                      <Loader2 className="w-5 h-5 animate-spin me-2" />
                    ) : (
                      <LinkIcon className="w-4 h-4 me-2" />
                    )}
                    {t.parentPages?.linkChild?.sendLinkRequest}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
