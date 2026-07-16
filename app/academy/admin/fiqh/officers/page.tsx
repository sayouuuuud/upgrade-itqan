'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Loader2, UserPlus, Shield, Mail, Trash2, ChevronLeft, CheckCircle2, XCircle,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface Officer {
  id: string; user_id: string; bio: string | null; is_active: boolean; name: string; email: string;
  avatar_url: string | null; role: string; category_ids: string[]; category_names: string[]; open_count: number;
}

interface Category { id: string; slug: string; name_ar: string }

export default function AdminFiqhOfficersPage() {
  const { t } = useI18n()
  const academy = (t as any).academy as Record<string, string> | undefined
  const a = t.academyAdmin

  const [officers, setOfficers] = useState<Officer[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [editing, setEditing] = useState<Officer | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [oRes, cRes] = await Promise.all([
        fetch('/api/academy/admin/fiqh/officers').then((r) => r.json()),
        fetch('/api/academy/fiqh/categories').then((r) => r.json()),
      ])
      setOfficers(oRes.officers || [])
      setCategories(cRes.categories || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setEmail(''); setBio(''); setSelectedCats([]); setIsAddOpen(true) }
  const openEdit = (o: Officer) => { setEditing(o); setEmail(o.email); setBio(o.bio || ''); setSelectedCats(o.category_ids); setIsAddOpen(true) }

  const submit = async () => {
    if (!editing && !email.trim()) return
    setSubmitting(true); setFeedback(null)
    try {
      const res = await fetch('/api/academy/admin/fiqh/officers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: editing?.user_id, email: editing ? undefined : email.trim().toLowerCase(), bio: bio.trim() || null, category_ids: selectedCats }) })
      const data = await res.json()
      if (!res.ok) { setFeedback({ kind: 'err', text: data.error || a.officersSaveError }) }
      else { setFeedback({ kind: 'ok', text: editing ? a.officersUpdated : a.officersAdded }); setIsAddOpen(false); await load() }
    } finally { setSubmitting(false) }
  }

  const toggleActive = async (o: Officer) => { await fetch('/api/academy/admin/fiqh/officers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: o.user_id, is_active: !o.is_active }) }); await load() }

  const remove = async (o: Officer) => { if (!confirm(a.officersRemoveConfirm.replace('{name}', o.name))) return; await fetch(`/api/academy/admin/fiqh/officers/${o.id}`, { method: 'DELETE' }); await load() }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Link href="/academy/admin/fiqh" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="w-4 h-4" />{a.officersManage}
      </Link>

      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-3xl font-black inline-flex items-center gap-2"><Shield className="w-7 h-7 text-primary" />{a.officersTitle}</h1>
          <p className="text-muted-foreground mt-2">{a.officersDesc}</p>
        </div>
        <Button onClick={openAdd}><UserPlus className="w-4 h-4 me-2" />{a.officersAddOfficer}</Button>
      </div>

      {feedback && <div className={`p-3 rounded-xl border text-sm ${feedback.kind === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700' : 'bg-red-500/10 border-red-500/30 text-red-700'}`}>{feedback.text}</div>}

      {loading ? (
        <Card><CardContent className="p-12 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></CardContent></Card>
      ) : officers.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">{a.officersNoOfficers}</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {officers.map((o) => (
            <Card key={o.id} className="rounded-2xl">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-lg">{o.name}</h3>
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {o.email}</div>
                    {o.bio && <p className="text-sm text-muted-foreground mt-2">{o.bio}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${o.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {o.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{o.is_active ? a.officersActive : a.officersInactive}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{a.officersOpenQuestions} <strong>{o.open_count}</strong></span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {o.category_names.length === 0 ? <span className="text-[11px] text-muted-foreground">{a.officersNoCategories}</span> : o.category_names.map((n) => <span key={n} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{n}</span>)}
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={() => openEdit(o)}>{a.officersEdit}</Button>
                  <Button variant="outline" size="sm" onClick={() => toggleActive(o)}>{o.is_active ? a.officersDeactivate : a.officersActivate}</Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:border-red-300" onClick={() => remove(o)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? a.officersEditTitle.replace('{name}', editing.name) : a.officersAddNew}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {!editing && (
              <div>
                <label className="text-sm font-bold block mb-1">{a.officersEmail}</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" type="email" />
                <p className="text-xs text-muted-foreground mt-1">{a.officersEmailNote}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-bold block mb-1">{a.officersBio}</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder={a.officersBioPlaceholder} rows={3} />
            </div>
            <div>
              <label className="text-sm font-bold block mb-2">{a.officersCategories}</label>
              <div className="flex gap-2 flex-wrap">
                {categories.map((c) => { const on = selectedCats.includes(c.id); return <button key={c.id} type="button" onClick={() => setSelectedCats(on ? selectedCats.filter((x) => x !== c.id) : [...selectedCats, c.id])} className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-colors ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted'}`}>{c.name_ar}</button> })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>{t.cancel}</Button>
            <Button onClick={submit} disabled={submitting || (!editing && !email.trim()) || selectedCats.length === 0}>{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : a.officersSave}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
