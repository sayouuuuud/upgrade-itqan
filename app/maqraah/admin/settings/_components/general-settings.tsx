import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/lib/i18n/context"

interface GeneralSettingsProps {
  settings: Record<string, any>
  metadata?: Record<string, any>
  onUpdate: (key: string, value: any) => void
}

export function GeneralSettings({ settings, onUpdate }: GeneralSettingsProps) {
  const { t } = useI18n()
  const gs = (t as any).generalSettings as Record<string, string> | undefined

  return (
    <div className="space-y-6">
      {/* identity */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{gs?.identityTitle ?? 'Maqraah Identity'}</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="maqraah_name">{gs?.name ?? 'Maqraah Name'}</Label>
            <Input
              id="maqraah_name"
              value={settings.maqraah_general_name || ""}
              onChange={(e) => onUpdate("maqraah_general_name", e.target.value)}
              placeholder={gs?.namePlaceholder ?? 'e.g. Itqan Maqraah'}
            />
          </div>

          <div>
            <Label htmlFor="maqraah_description">{gs?.description ?? 'Maqraah Description'}</Label>
            <Textarea
              id="maqraah_description"
              rows={3}
              value={settings.maqraah_general_description || ""}
              onChange={(e) =>
                onUpdate("maqraah_general_description", e.target.value)
              }
              placeholder={gs?.descriptionPlaceholder ?? 'A brief introduction shown to visitors'}
            />
          </div>
        </div>
      </div>

      {/* contact */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">{gs?.contactTitle ?? 'Contact Information'}</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="maqraah_contact_email">{gs?.email ?? 'Email'}</Label>
            <Input
              id="maqraah_contact_email"
              type="email"
              value={settings.maqraah_general_contact_email || ""}
              onChange={(e) =>
                onUpdate("maqraah_general_contact_email", e.target.value)
              }
              placeholder="support@example.com"
            />
          </div>

          <div>
            <Label htmlFor="maqraah_whatsapp">{gs?.whatsapp ?? 'WhatsApp Number'}</Label>
            <Input
              id="maqraah_whatsapp"
              value={settings.maqraah_general_whatsapp || ""}
              onChange={(e) =>
                onUpdate("maqraah_general_whatsapp", e.target.value)
              }
              placeholder="+966 55 1234567"
            />
          </div>
        </div>
      </div>

      {/* regional */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">{gs?.regionalTitle ?? 'Regional Settings'}</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="maqraah_timezone">{gs?.timezone ?? 'Timezone'}</Label>
            <Select
              value={settings.maqraah_general_timezone || "Asia/Riyadh"}
              onValueChange={(value) =>
                onUpdate("maqraah_general_timezone", value)
              }
            >
              <SelectTrigger id="maqraah_timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Riyadh">{gs?.tzRiyadh ?? 'Riyadh (UTC+3)'}</SelectItem>
                <SelectItem value="Asia/Dubai">{gs?.tzDubai ?? 'Dubai (UTC+4)'}</SelectItem>
                <SelectItem value="Africa/Cairo">{gs?.tzCairo ?? 'Cairo (UTC+2)'}</SelectItem>
                <SelectItem value="UTC">{gs?.tzUTC ?? 'Universal Time (UTC)'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="maqraah_language">{gs?.language ?? 'Default Language'}</Label>
            <Select
              value={settings.maqraah_general_language || "ar"}
              onValueChange={(value) =>
                onUpdate("maqraah_general_language", value)
              }
            >
              <SelectTrigger id="maqraah_language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">{gs?.arabic ?? 'Arabic'}</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="maqraah_direction">{gs?.direction ?? 'Interface Direction'}</Label>
            <Select
              value={settings.maqraah_general_direction || "rtl"}
              onValueChange={(value) =>
                onUpdate("maqraah_general_direction", value)
              }
            >
              <SelectTrigger id="maqraah_direction">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rtl">{gs?.rtl ?? 'Right to Left (RTL)'}</SelectItem>
                <SelectItem value="ltr">{gs?.ltr ?? 'Left to Right (LTR)'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
