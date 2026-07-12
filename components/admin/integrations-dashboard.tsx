'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Database, Mail, Video, HardDrive, Cloud, RefreshCw,
  CheckCircle2, XCircle, Loader2, Send, Plug
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from "@/lib/i18n/context";

interface Integration {
  id: string
  name: string
  description: string
  category: 'core' | 'communication' | 'media' | 'storage'
  status: 'connected' | 'missing'
  canTest: boolean
}

interface IntegrationsData {
  checkedAt: string
  integrations: Integration[]
}

const CATEGORY_LABELS: Record<string, string> = {
  core:          'الأساسية',
  communication: 'التواصل',
  media:         'الوسائط',
  storage:       'التخزين',
}

const CATEGORY_ORDER = ['core', 'communication', 'media', 'storage']

const INTEGRATION_ICONS: Record<string, React.ElementType> = {
  database:           Database,
  supabase:           Database,
  smtp:               Mail,
  livekit:            Video,
  recording:          Video,
  storage_s3:         Cloud,
  storage_cloudinary: Cloud,
  storage_blob:       HardDrive,
}

export default function IntegrationsDashboard() {
  const { t } = useI18n();
  const isAr = t.locale === "ar";
  const [data, setData] = useState<IntegrationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/integrations')
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const testEmail = async () => {
    setTestingEmail(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/integrations/test-email', { method: 'POST' })
      const json = await res.json()
      setTestResult(res.ok
        ? { ok: true, msg: `تم الإرسال بنجاح إلى ${json.sentTo}` }
        : { ok: false, msg: json.error || 'فشل الإرسال' }
      )
    } catch {
      setTestResult({ ok: false, msg: 'خطأ في الاتصال' })
    } finally {
      setTestingEmail(false)
    }
  }

  // Group by category
  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    items: (data?.integrations ?? []).filter(i => i.category === cat),
  })).filter(g => g.items.length > 0)

  const connectedCount = data?.integrations.filter(i => i.status === 'connected').length ?? 0
  const totalCount = data?.integrations.length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plug className="w-6 h-6 text-primary" />
            {isAr ? "التكاملات والخدمات الخارجية" : "Translated"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isAr ? "حالة الاتصال بالخدمات المستخدمة في المنصة" : "Status الاتصال بالخدمات المستخدمة في المنصة"} — لا تُعرض أي مفاتيح سرية.
          </p>
        </div>
        <Button variant="outline" onClick={fetch_} disabled={loading} className="gap-2 shrink-0">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          {isAr ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {/* Summary */}
      {!loading && data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                connectedCount === totalCount ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
              )}>
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connectedCount}/{totalCount}</p>
                <p className="text-xs text-muted-foreground">خدمة متصلة</p>
              </div>
            </CardContent>
          </Card>
          {CATEGORY_ORDER.map(cat => {
            const items = data.integrations.filter(i => i.category === cat)
            const ok = items.filter(i => i.status === 'connected').length
            return (
              <Card key={cat}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
                    ok === items.length ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                  )}>
                    {ok}/{items.length}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{CATEGORY_LABELS[cat]}</p>
                    <p className="text-xs text-muted-foreground">
                      {ok === items.length ? 'مكتملة' : 'ناقصة'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Integration groups */}
          {grouped.map(group => (
            <div key={group.category} className="space-y-3">
              <h2 className="text-base font-bold text-muted-foreground border-b pb-2">
                {group.label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map(integration => {
                  const Icon = INTEGRATION_ICONS[integration.id] ?? Plug
                  const isConnected = integration.status === 'connected'
                  return (
                    <Card
                      key={integration.id}
                      className={cn(
                        "border transition-colors",
                        isConnected
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : "border-red-500/20 bg-red-500/5"
                      )}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                              isConnected ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"
                            )}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-sm font-bold leading-tight">
                              {integration.name}
                            </CardTitle>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 text-[10px] font-bold border",
                              isConnected
                                ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                                : "border-red-500/30 text-red-600 bg-red-500/10"
                            )}
                          >
                            {isConnected ? (
                              <><CheckCircle2 className="w-3 h-3 ml-1" />متصل</>
                            ) : (
                              <><XCircle className="w-3 h-3 ml-1" />غير متصل</>
                            )}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-1 space-y-3">
                        <CardDescription className="text-xs leading-relaxed">
                          {integration.description}
                        </CardDescription>

                        {!isConnected && (
                          <p className="text-xs text-red-600 font-medium">
                            {isAr ? "متغيرات البيئة المطلوبة غير مضبوطة" : "Translated"}
                          </p>
                        )}

                        {integration.canTest && isConnected && (
                          <div className="space-y-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={testEmail}
                              disabled={testingEmail}
                              className="w-full gap-2 text-xs"
                            >
                              {testingEmail
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Send className="w-3 h-3" />
                              }
                              {isAr ? "إرسال بريد تجريبي" : "Translated"}
                            </Button>
                            {testResult && (
                              <p className={cn(
                                "text-xs text-center font-medium",
                                testResult.ok ? "text-emerald-600" : "text-red-600"
                              )}>
                                {testResult.msg}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Checked at */}
          {data?.checkedAt && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              {isAr ? "آخر فحص" : "Translated"}: {new Intl.DateTimeFormat('ar-SA', {
                dateStyle: 'medium', timeStyle: 'short'
              }).format(new Date(data.checkedAt))}
            </p>
          )}
        </>
      )}
    </div>
  )
}
