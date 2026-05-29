"use client"

import { Shield, KeyRound, Lock, Activity } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SectionCard, ToggleRow } from "./section-card"
import type { MaqraahSettings } from "../hooks/use-maqraah-settings"

interface Props {
  settings: MaqraahSettings
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset: () => void
}

export function SecuritySettings({ settings, onUpdate, onReset }: Props) {
  const ipWhitelist = settings.maqraah_security_admin_ip_whitelist || []
  const policy = settings.maqraah_security_password_policy || {}

  const updatePolicy = (updates: Partial<NonNullable<MaqraahSettings["maqraah_security_password_policy"]>>) => {
    onUpdate({ maqraah_security_password_policy: { ...policy, ...updates } })
  }

  const updateIps = (text: string) => {
    const ips = text
      .split(/[\n,]/)
      .map((ip) => ip.trim())
      .filter(Boolean)
    onUpdate({ maqraah_security_admin_ip_whitelist: ips })
  }

  return (
    <div className="space-y-6">
      <SectionCard icon={Shield} title="الجلسات والدخول" description="ضبط مهلة الجلسة ومحاولات الدخول" onReset={onReset}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-sm">مهلة الجلسة (دقائق)</Label>
            <Input
              type="number"
              min={5}
              value={settings.maqraah_security_session_timeout ?? 30}
              onChange={(e) => onUpdate({ maqraah_security_session_timeout: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">أقصى محاولات دخول</Label>
            <Input
              type="number"
              min={1}
              value={settings.maqraah_security_max_login_attempts ?? 5}
              onChange={(e) => onUpdate({ maqraah_security_max_login_attempts: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">مدة الحظر (دقائق)</Label>
            <Input
              type="number"
              min={1}
              value={settings.maqraah_security_lock_duration ?? 15}
              onChange={(e) => onUpdate({ maqraah_security_lock_duration: Number(e.target.value) })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={KeyRound} title="سياسة كلمة المرور" description="شروط كلمات مرور المستخدمين">
        <div className="space-y-2 max-w-xs">
          <Label className="text-sm">الحد الأدنى لعدد الأحرف</Label>
          <Input
            type="number"
            min={6}
            value={policy.min_length ?? 8}
            onChange={(e) => updatePolicy({ min_length: Number(e.target.value) })}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleRow
            label="حرف كبير (A-Z)"
            checked={policy.require_uppercase ?? true}
            onChange={(v) => updatePolicy({ require_uppercase: v })}
          />
          <ToggleRow
            label="حرف صغير (a-z)"
            checked={policy.require_lowercase ?? true}
            onChange={(v) => updatePolicy({ require_lowercase: v })}
          />
          <ToggleRow
            label="أرقام (0-9)"
            checked={policy.require_numbers ?? true}
            onChange={(v) => updatePolicy({ require_numbers: v })}
          />
          <ToggleRow
            label="رموز خاصة (!@#)"
            checked={policy.require_special ?? false}
            onChange={(v) => updatePolicy({ require_special: v })}
          />
        </div>
      </SectionCard>

      <SectionCard icon={Lock} title="حماية لوحة الإدارة" description="إجراءات أمنية إضافية للمشرفين">
        <ToggleRow
          label="المصادقة الثنائية للمشرفين"
          description="إلزام المشرفين باستخدام 2FA"
          checked={settings.maqraah_security_admin_2fa ?? false}
          onChange={(v) => onUpdate({ maqraah_security_admin_2fa: v })}
        />
        <div className="space-y-2">
          <Label className="text-sm">قائمة IP المسموح بها للوحة الإدارة</Label>
          <Textarea
            dir="ltr"
            rows={3}
            value={ipWhitelist.join("\n")}
            onChange={(e) => updateIps(e.target.value)}
            placeholder="192.168.1.1&#10;10.0.0.5"
          />
          <p className="text-[11px] text-muted-foreground">اتركه فارغاً للسماح من أي IP. عنوان واحد في كل سطر.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm">حد الرفع اليومي (ميجابايت)</Label>
            <Input
              type="number"
              min={0}
              value={settings.maqraah_security_daily_upload_limit_mb ?? 500}
              onChange={(e) => onUpdate({ maqraah_security_daily_upload_limit_mb: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">حد طلبات API (في الدقيقة)</Label>
            <Input
              type="number"
              min={0}
              value={settings.maqraah_security_api_rate_limit ?? 100}
              onChange={(e) => onUpdate({ maqraah_security_api_rate_limit: Number(e.target.value) })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Activity} title="سجل النشاط" description="تتبع إجراءات المستخدمين والمشرفين">
        <ToggleRow
          label="تفعيل سجل النشاط"
          description="تسجيل العمليات الحساسة للمراجعة"
          checked={settings.maqraah_security_activity_logs_enabled ?? true}
          onChange={(v) => onUpdate({ maqraah_security_activity_logs_enabled: v })}
        />
      </SectionCard>
    </div>
  )
}
