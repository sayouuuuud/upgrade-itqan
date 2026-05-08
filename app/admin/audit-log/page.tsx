'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Shield, Search, Filter, ChevronLeft, ChevronRight, 
  User, Clock, ArrowRight, Loader2, FileText, RefreshCw
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

interface AuditLogEntry {
  id: string
  action_type: string
  admin_id: string
  admin_name: string
  admin_email: string
  target_user_id: string | null
  target_user_name: string | null
  target_user_email: string | null
  old_value: any
  new_value: any
  description: string
  ip_address: string | null
  created_at: string
}

interface ActionType {
  type: string
  count: number
}

const actionTypeLabels: Record<string, { ar: string; en: string; color: string }> = {
  role_change: { ar: 'تغيير صلاحية', en: 'Role Change', color: 'bg-purple-100 text-purple-700' },
  user_disabled: { ar: 'تعطيل حساب', en: 'User Disabled', color: 'bg-red-100 text-red-700' },
  user_enabled: { ar: 'تفعيل حساب', en: 'User Enabled', color: 'bg-green-100 text-green-700' },
  permission_granted: { ar: 'منح صلاحية', en: 'Permission Granted', color: 'bg-blue-100 text-blue-700' },
  permission_revoked: { ar: 'سحب صلاحية', en: 'Permission Revoked', color: 'bg-orange-100 text-orange-700' },
  user_created: { ar: 'إنشاء حساب', en: 'User Created', color: 'bg-teal-100 text-teal-700' },
  user_deleted: { ar: 'حذف حساب', en: 'User Deleted', color: 'bg-red-100 text-red-700' },
  settings_changed: { ar: 'تغيير إعدادات', en: 'Settings Changed', color: 'bg-gray-100 text-gray-700' },
  default: { ar: 'إجراء', en: 'Action', color: 'bg-gray-100 text-gray-700' },
}

export default function AuditLogPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [actionTypes, setActionTypes] = useState<ActionType[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  
  // Filters
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const limit = 20

  useEffect(() => {
    fetchLogs()
  }, [selectedType, page])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedType && selectedType !== 'all') {
        params.set('type', selectedType)
      }
      params.set('limit', String(limit))
      params.set('offset', String(page * limit))

      const res = await fetch(`/api/admin/audit-log?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setTotal(data.total || 0)
        if (data.actionTypes) {
          setActionTypes(data.actionTypes)
        }
      }
    } catch (error) {
      console.error('Failed to fetch audit log:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateStr: string) => {
    return new Intl.DateTimeFormat(isAr ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  }

  const getActionLabel = (type: string) => {
    const config = actionTypeLabels[type] || actionTypeLabels.default
    return {
      label: isAr ? config.ar : config.en,
      color: config.color,
    }
  }

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      log.admin_name?.toLowerCase().includes(query) ||
      log.admin_email?.toLowerCase().includes(query) ||
      log.target_user_name?.toLowerCase().includes(query) ||
      log.target_user_email?.toLowerCase().includes(query) ||
      log.description?.toLowerCase().includes(query)
    )
  })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            {isAr ? 'سجل التدقيق' : 'Audit Log'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAr 
              ? 'سجل جميع التغييرات على الصلاحيات والحسابات'
              : 'Log of all permission and account changes'}
          </p>
        </div>
        <Button onClick={fetchLogs} variant="outline" className="gap-2">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          {isAr ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={isAr ? 'ابحث في السجل...' : 'Search logs...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={isAr ? 'نوع الإجراء' : 'Action Type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? 'جميع الإجراءات' : 'All Actions'}</SelectItem>
                {actionTypes.map((at) => (
                  <SelectItem key={at.type} value={at.type}>
                    {getActionLabel(at.type).label} ({at.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isAr ? 'السجلات' : 'Entries'}
            <Badge variant="secondary" className="mr-2">
              {total}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                {isAr ? 'لا توجد سجلات' : 'No log entries found'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const actionConfig = getActionLabel(log.action_type)
                
                return (
                  <div
                    key={log.id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        {/* Action Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn("font-medium", actionConfig.color)}>
                            {actionConfig.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(log.created_at)}
                          </span>
                        </div>

                        {/* Description */}
                        {log.description && (
                          <p className="text-sm">{log.description}</p>
                        )}

                        {/* Users Info */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{isAr ? 'بواسطة:' : 'By:'}</span>
                            <span className="font-medium">{log.admin_name || log.admin_email}</span>
                          </div>
                          
                          {log.target_user_id && (
                            <>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground">{isAr ? 'على:' : 'On:'}</span>
                                <span className="font-medium">{log.target_user_name || log.target_user_email}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Value Changes */}
                        {(log.old_value || log.new_value) && (
                          <div className="flex items-center gap-2 text-xs mt-2 p-2 rounded bg-muted/50">
                            {log.old_value && (
                              <code className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                {typeof log.old_value === 'object' ? JSON.stringify(log.old_value) : String(log.old_value)}
                              </code>
                            )}
                            {log.old_value && log.new_value && (
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            {log.new_value && (
                              <code className="px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                {typeof log.new_value === 'object' ? JSON.stringify(log.new_value) : String(log.new_value)}
                              </code>
                            )}
                          </div>
                        )}
                      </div>

                      {/* IP Address */}
                      {log.ip_address && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {log.ip_address}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {isAr 
                  ? `صفحة ${page + 1} من ${totalPages}`
                  : `Page ${page + 1} of ${totalPages}`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
