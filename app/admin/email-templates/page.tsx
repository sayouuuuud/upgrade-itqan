"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Mail, Edit, Check, Loader2, Eye } from "lucide-react"

export default function AdminEmailTemplatesPage() {
    const { t } = useI18n()
    const a = t.admin
    const isAr = t.locale === 'ar'

    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [editTemplate, setEditTemplate] = useState<any>(null)
    const [editForm, setEditForm] = useState<any>({})
    const [saving, setSaving] = useState(false)
    const [previewLang, setPreviewLang] = useState<'ar' | 'en'>('ar')
    const [searchTerm, setSearchTerm] = useState('')
    const [sendingTest, setSendingTest] = useState(false)
    const [testEmail, setTestEmail] = useState('')

    const fetchTemplates = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/email-templates')
            const data = await res.json().catch(() => null)
            if (res.ok && data) {
                setTemplates(data.templates || [])
            }
        } finally {
            setLoading(false)
        }
    }, [])

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { fetchTemplates() }, [fetchTemplates])

    const openEdit = (tmpl: any) => {
        setEditTemplate(tmpl)
        setEditForm({
            subject_ar: tmpl.subject_ar || '',
            subject_en: tmpl.subject_en || '',
            body_ar: tmpl.body_ar || '',
            body_en: tmpl.body_en || '',
            is_active: !!tmpl.is_active,
        })
    }

    const handleSave = async () => {
        if (!editTemplate) return
        setSaving(true)
        try {
            await fetch(`/api/admin/email-templates/${editTemplate.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            })
            setEditTemplate(null)
            fetchTemplates()
        } finally {
            setSaving(false)
        }
    }

    const handleSendTest = async () => {
        if (!testEmail || !editTemplate) return
        setSendingTest(true)
        try {
            const res = await fetch('/api/admin/email-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: testEmail,
                    subject: previewLang === 'ar' ? editForm.subject_ar : editForm.subject_en,
                    body: previewLang === 'ar' ? editForm.body_ar : editForm.body_en,
                    variables: { userName: 'تجربة', studentName: 'تجربة', readerName: 'تجربة', certificateLink: '#' }
                }),
            })
            const data = await res.json().catch(() => null)
            if (res.ok && data?.success) {
                alert(t.admin.testEmailSent)
            } else {
                alert(
                    isAr
                        ? `لم يتم إرسال البريد التجريبي. السبب: ${data?.error || "إعدادات البريد غير مكتملة"}`
                        : `Test email was not sent. Reason: ${data?.error || "Email settings are incomplete"}`
                )
            }
        } finally {
            setSendingTest(false)
        }
    }

    const filteredTemplates = templates.filter(tmpl =>
        tmpl.template_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tmpl.template_name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tmpl.template_name_en.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    return (
        <div className="space-y-6 md:space-y-8 max-w-7xl">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                        {t.admin.emailTemplates}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t.admin.emailTemplatesDesc}
                    </p>
                </div>

                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none rtl:left-0 rtl:right-auto rtl:pl-3">
                        {!loading && <Eye className="w-4 h-4 text-muted-foreground" />}
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    </div>
                    <Input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder={t.admin.searchTemplates}
                        className="h-11 pr-10 rtl:pl-10 rtl:pr-4 rounded-xl border-border bg-card text-foreground"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1B5E3B]" />
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl py-24 text-center shadow-sm">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
                        <Mail className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-1">
                        {searchTerm ? t.admin.noTemplatesFound : a.etNoTemplates}
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        {t.admin.noTemplatesDesc}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {filteredTemplates.map(tmpl => (
                        <div key={tmpl.id} className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <Mail className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-foreground text-lg">{isAr ? tmpl.template_name_ar : tmpl.template_name_en}</h3>
                                            <span className={`flex h-2 w-2 rounded-full ${tmpl.is_active ? 'bg-primary' : 'bg-muted-foreground'}`} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => copyToClipboard(tmpl.template_key)}
                                                className="text-[10px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-mono tracking-wider hover:bg-muted/80 transition-colors"
                                                title="Click to copy key"
                                            >
                                                {tmpl.template_key}
                                            </button>
                                            <span className={`text-[10px] items-center px-1.5 py-0.5 rounded-md font-medium border
                                                ${tmpl.is_active ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                                                {tmpl.is_active
                                                    ? t.active
                                                    : a.etInactive}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEdit(tmpl)}
                                    className="border-border text-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 h-9 rounded-xl transition-opacity focus:opacity-100"
                                >
                                    <Edit className="w-4 h-4 ml-1.5 rtl:mr-1.5 rtl:ml-0" />
                                    {t.edit}
                                </Button>
                            </div>

                            <div className="flex-1 bg-muted/40 border border-border/50 rounded-2xl p-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            {t.admin.subject}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground mb-4 line-clamp-2 leading-relaxed">
                                        {isAr ? tmpl.subject_ar : tmpl.subject_en}
                                    </p>
                                </div>

                                {tmpl.variables?.length > 0 && (
                                    <div className="pt-3 border-t border-border mt-auto">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                            {t.admin.availableVariables}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(typeof tmpl.variables === 'string' ? JSON.parse(tmpl.variables) : tmpl.variables).map((v: string) => (
                                                <div key={v} className="bg-card border border-border shadow-sm text-foreground text-[10px] px-2 py-1 rounded-lg font-mono flex items-center gap-1">
                                                    <span className="text-muted-foreground">{`{{`}</span>
                                                    <span className="font-semibold text-primary">{v}</span>
                                                    <span className="text-muted-foreground">{`}}`}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editTemplate} onOpenChange={(open) => !open && setEditTemplate(null)}>
                <DialogContent className="max-w-3xl rounded-[2rem] p-0 overflow-hidden border-border bg-card shadow-2xl">
                    <DialogHeader className="px-6 py-5 border-b border-border bg-muted/40">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Edit className="w-4 h-4 text-primary" />
                            </div>
                            {isAr ? `تعديل القالب: ${editTemplate?.template_name_ar}` : `Edit Template: ${editTemplate?.template_name_en}`}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                        {/* Status Toggle */}
                        <div className="flex items-center justify-between bg-card border border-border p-4 rounded-2xl shadow-sm">
                            <div>
                                <h4 className="font-bold text-sm text-foreground">{t.admin.templateStatus}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">{t.admin.templateStatusDesc}</p>
                            </div>
                            <Switch
                                checked={!!editForm.is_active}
                                onCheckedChange={c => setEditForm((f: any) => ({ ...f, is_active: c }))}
                                className="data-[state=checked]:bg-primary"
                            />
                        </div>

                        {/* Editor Tabs Toggle */}
                        <div className="flex justify-center">
                            <div className="flex items-center gap-1 bg-muted rounded-xl p-1 inline-flex">
                                <button
                                    onClick={() => setPreviewLang('ar')}
                                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${previewLang === 'ar' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    النسخة العربية
                                </button>
                                <button
                                    onClick={() => setPreviewLang('en')}
                                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${previewLang === 'en' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    English Version
                                </button>
                            </div>
                        </div>

                        {previewLang === 'ar' ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-1.5">
                                    <Label className="text-foreground font-bold ml-1">موضوع الرسالة</Label>
                                    <Input
                                        value={editForm.subject_ar || ''}
                                        onChange={e => setEditForm((f: any) => ({ ...f, subject_ar: e.target.value }))}
                                        className="h-12 border-border bg-card text-foreground focus-visible:ring-1 focus-visible:ring-primary rounded-xl px-4"
                                        placeholder="اكتب عنوان البريد الإلكتروني هنا..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-foreground font-bold ml-1">نص الرسالة</Label>
                                    <textarea
                                        className="w-full rounded-2xl border border-border bg-card text-foreground px-4 py-3 text-sm min-h-[240px] resize-y focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed transition-shadow"
                                        value={editForm.body_ar || ''}
                                        onChange={e => setEditForm((f: any) => ({ ...f, body_ar: e.target.value }))}
                                        placeholder="اكتب محتوى الرسالة هنا. يمكنك استخدام المتغيرات المتاحة..."
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-1.5">
                                    <Label className="text-foreground font-bold mr-1 flex justify-end">Subject</Label>
                                    <Input
                                        dir="ltr"
                                        value={editForm.subject_en || ''}
                                        onChange={e => setEditForm((f: any) => ({ ...f, subject_en: e.target.value }))}
                                        className="h-12 border-border bg-card text-foreground focus-visible:ring-1 focus-visible:ring-primary rounded-xl px-4 text-left"
                                        placeholder="Enter the email subject here..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-foreground font-bold mr-1 flex justify-end">Body</Label>
                                    <textarea
                                        className="w-full rounded-2xl border border-border bg-card text-foreground px-4 py-3 text-sm min-h-[240px] resize-y focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed transition-shadow text-left"
                                        dir="ltr"
                                        value={editForm.body_en || ''}
                                        onChange={e => setEditForm((f: any) => ({ ...f, body_en: e.target.value }))}
                                        placeholder="Type the email content here. You can use available variables..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Send Test Email Section */}
                        <div className="pt-6 border-t border-border">
                            <h4 className="font-bold text-sm text-foreground mb-3">{t.admin.sendTestEmail}</h4>
                            <div className="flex gap-2">
                                <Input
                                    value={testEmail}
                                    onChange={e => setTestEmail(e.target.value)}
                                    placeholder={t.admin.testEmailPlaceholder}
                                    className="h-10 border-border bg-card text-foreground rounded-xl"
                                />
                                <Button
                                    onClick={handleSendTest}
                                    disabled={sendingTest || !testEmail}
                                    variant="outline"
                                    className="h-10 px-4 rounded-xl border-[#C9A227] text-[#C9A227] hover:bg-[#C9A227]/10"
                                >
                                    {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 ml-1.5 rtl:mr-1.5 rtl:ml-0" />}
                                    {t.send}
                                </Button>
                            </div>
                        </div>

                        {editTemplate?.variables?.length > 0 && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">⚡</span>
                                    <div>
                                        <p className="text-xs font-bold text-amber-600 dark:text-amber-500">
                                            {t.admin.supportedDynamicVariables}
                                        </p>
                                        <p className="text-[10px] text-amber-600/80 dark:text-amber-500/80 mt-0.5">
                                            {t.admin.copyVariableDesc}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(typeof editTemplate.variables === 'string' ? JSON.parse(editTemplate.variables) : editTemplate.variables).map((v: string) => (
                                        <button
                                            key={v}
                                            onClick={() => {
                                                navigator.clipboard.writeText(`{{${v}}}`)
                                            }}
                                            className="text-xs bg-card border border-amber-500/40 text-amber-600 dark:text-amber-500 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 hover:border-amber-500/60 transition-colors font-mono cursor-copy flex items-center gap-1 group/var"
                                            title="Click to copy"
                                        >
                                            <span className="opacity-60">{`{{`}</span>
                                            <span className="font-bold group-hover/var:text-amber-700 dark:group-hover/var:text-amber-400 transition-colors">{v}</span>
                                            <span className="opacity-60">{`}}`}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-border bg-muted/40 flex-col sm:flex-row gap-3 sm:justify-end rtl:sm:justify-start">
                        <Button
                            variant="outline"
                            onClick={() => setEditTemplate(null)}
                            className="rounded-xl px-6 h-11 border-border bg-card text-foreground hover:bg-muted"
                        >
                            {t.cancel}
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-primary text-primary-foreground rounded-xl px-8 h-11 hover:bg-primary/90 shadow-md shadow-primary/20"
                            disabled={saving}
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin ml-2 rtl:mr-2 rtl:ml-0" />
                            ) : (
                                <Check className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0" />
                            )}
                            {t.profile.saveChanges}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
