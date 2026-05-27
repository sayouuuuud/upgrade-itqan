"use client"

import { UserPlus, Shield, CheckSquare, Mail, BookOpen, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AcademySettings } from "../hooks/use-academy-settings"

interface RegistrationSettingsProps {
  settings: AcademySettings
  onUpdate: (updates: Partial<AcademySettings>) => void
  onReset: () => void
}

const requiredFieldOptions = [
  { id: "birthdate", label: "تاريخ الميلاد" },
  { id: "gender", label: "الجنس" },
  { id: "country", label: "الدولة" },
  { id: "education_level", label: "المستوى التعليمي" },
  { id: "phone", label: "رقم الهاتف" },
]

export function RegistrationSettings({ settings, onUpdate, onReset }: RegistrationSettingsProps) {
  const requiredFields = settings.academy_registration_required_fields || []

  const toggleRequiredField = (fieldId: string) => {
    const newFields = requiredFields.includes(fieldId)
      ? requiredFields.filter((f) => f !== fieldId)
      : [...requiredFields, fieldId]
    onUpdate({ academy_registration_required_fields: newFields })
  }

  return (
    <div className="space-y-6">
      {/* Registration Toggles */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">التسجيل</CardTitle>
                <CardDescription className="text-xs mt-0.5">التحكم في فتح/غلق التسجيل</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
              <RotateCcw className="w-4 h-4 ml-1" />
              استعادة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">تفعيل تسجيل الطلاب</Label>
              <p className="text-xs text-muted-foreground">السماح للطلاب الجدد بإنشاء حساب</p>
            </div>
            <Switch
              checked={settings.academy_registration_student_enabled ?? true}
              onCheckedChange={(v) => onUpdate({ academy_registration_student_enabled: v })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">تفعيل تسجيل الأساتذة</Label>
              <p className="text-xs text-muted-foreground">السماح للأساتذة بتقديم طلب انضمام</p>
            </div>
            <Switch
              checked={settings.academy_registration_teacher_enabled ?? true}
              onCheckedChange={(v) => onUpdate({ academy_registration_teacher_enabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Approval Settings */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">الموافقات</CardTitle>
              <CardDescription className="text-xs mt-0.5">هل يحتاج المستخدمون موافقة قبل الدخول؟</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">موافقة الأدمن على الطلاب</Label>
              <p className="text-xs text-muted-foreground">
                {settings.academy_registration_student_approval
                  ? "الطالب ينتظر الموافقة قبل الدخول"
                  : "الطالب يدخل مباشرة بعد التسجيل"}
              </p>
            </div>
            <Switch
              checked={settings.academy_registration_student_approval ?? false}
              onCheckedChange={(v) => onUpdate({ academy_registration_student_approval: v })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">موافقة الأدمن على الأساتذة</Label>
              <p className="text-xs text-muted-foreground">
                {settings.academy_registration_teacher_approval
                  ? "الأستاذ ينتظر مراجعة الطلب"
                  : "الأستاذ يدخل مباشرة"}
              </p>
            </div>
            <Switch
              checked={settings.academy_registration_teacher_approval ?? true}
              onCheckedChange={(v) => onUpdate({ academy_registration_teacher_approval: v })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">التحقق من البريد الإلكتروني</Label>
              <p className="text-xs text-muted-foreground">إرسال رابط تأكيد للإيميل بعد التسجيل</p>
            </div>
            <Switch
              checked={settings.academy_registration_email_verification ?? true}
              onCheckedChange={(v) => onUpdate({ academy_registration_email_verification: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Required Fields */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <CheckSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">الحقول الإلزامية</CardTitle>
              <CardDescription className="text-xs mt-0.5">الحقول المطلوبة في نموذج التسجيل</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {requiredFieldOptions.map((field) => (
              <div
                key={field.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => toggleRequiredField(field.id)}
              >
                <Checkbox
                  checked={requiredFields.includes(field.id)}
                  onCheckedChange={() => toggleRequiredField(field.id)}
                />
                <Label className="cursor-pointer">{field.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Welcome Message */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">الرسالة الترحيبية</CardTitle>
              <CardDescription className="text-xs mt-0.5">تُرسل للطالب بعد التسجيل</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <Textarea
            value={settings.academy_registration_welcome_message || ""}
            onChange={(e) => onUpdate({ academy_registration_welcome_message: e.target.value })}
            placeholder="مرحباً بك في أكاديمية إتقان! نتمنى لك رحلة تعليمية ممتعة ومباركة..."
            className="min-h-[150px] resize-none"
          />
          <p className="text-[11px] text-muted-foreground">يمكنك استخدام HTML بسيط (bold, italic, links)</p>
        </CardContent>
      </Card>

      {/* Default Course */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">الدورة الافتراضية</CardTitle>
              <CardDescription className="text-xs mt-0.5">دورة يُضاف لها الطالب تلقائياً</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Select
            value={settings.academy_registration_default_course || "none"}
            onValueChange={(v) => onUpdate({ academy_registration_default_course: v === "none" ? "" : v })}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="اختر دورة (اختياري)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون دورة افتراضية</SelectItem>
              {/* TODO: Fetch courses from API */}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground mt-2">اختياري - الطالب يُسجل تلقائياً في هذه الدورة</p>
        </CardContent>
      </Card>
    </div>
  )
}
