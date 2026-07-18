"use client"

import useSWR from "swr"
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
import { useI18n } from "@/lib/i18n/context"

interface RegistrationSettingsProps {
  settings: AcademySettings
  onUpdate: (updates: Partial<AcademySettings>) => void
  onReset?: () => void
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function RegistrationSettings({ settings, onUpdate, onReset }: RegistrationSettingsProps) {
  const { t } = useI18n()
  const academy = (t as any).academy as Record<string, string> | undefined
  const a = t.academyAdmin

  const { data: coursesData } = useSWR<{ data: Array<{ id: string; title: string; status: string }> }>(
    "/api/academy/admin/courses",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
  const publishedCourses = (coursesData?.data || []).filter((c) => c.status === "published")

  const requiredFields = settings.academy_registration_required_fields || []

  const requiredFieldOptions = [
    { id: "birthdate", label: a.rsFieldBirthdate },
    { id: "gender", label: a.rsFieldGender },
    { id: "country", label: a.rsFieldCountry },
    { id: "education_level", label: a.rsFieldEducation },
    { id: "phone", label: a.rsFieldPhone },
  ]

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
                <CardTitle className="text-lg">{a.rsTitle}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{a.rsDesc}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onReset?.()} className="text-muted-foreground">
              <RotateCcw className="w-4 h-4 ml-1" />
              {a.gsRestore}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">{a.rsEnableStudent}</Label>
              <p className="text-xs text-muted-foreground">{a.rsEnableStudentDesc}</p>
            </div>
            <Switch
              checked={settings.academy_registration_student_enabled ?? true}
              onCheckedChange={(v) => onUpdate({ academy_registration_student_enabled: v })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">{a.rsEnableTeacher}</Label>
              <p className="text-xs text-muted-foreground">{a.rsEnableTeacherDesc}</p>
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
              <CardTitle className="text-lg">{a.rsApprovals}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.rsApprovalsDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">{a.rsStudentApproval}</Label>
              <p className="text-xs text-muted-foreground">
                {settings.academy_registration_student_approval
                  ? a.rsStudentApprovalPending
                  : a.rsStudentApprovalAuto}
              </p>
            </div>
            <Switch
              checked={settings.academy_registration_student_approval ?? false}
              onCheckedChange={(v) => onUpdate({ academy_registration_student_approval: v })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">{a.rsTeacherApproval}</Label>
              <p className="text-xs text-muted-foreground">
                {settings.academy_registration_teacher_approval
                  ? a.rsTeacherApprovalPending
                  : a.rsTeacherApprovalAuto}
              </p>
            </div>
            <Switch
              checked={settings.academy_registration_teacher_approval ?? true}
              onCheckedChange={(v) => onUpdate({ academy_registration_teacher_approval: v })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">{a.rsEmailVerification}</Label>
              <p className="text-xs text-muted-foreground">{a.rsEmailVerificationDesc}</p>
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
              <CardTitle className="text-lg">{a.rsRequiredFields}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.rsRequiredFieldsDesc}</CardDescription>
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
              <CardTitle className="text-lg">{a.rsWelcomeMessage}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.rsWelcomeMessageDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <Textarea
            value={settings.academy_registration_welcome_message || ""}
            onChange={(e) => onUpdate({ academy_registration_welcome_message: e.target.value })}
            placeholder={a.rsWelcomeMessagePlaceholder}
            className="min-h-[150px] resize-none"
          />
          <p className="text-[11px] text-muted-foreground">{a.rsWelcomeMessageHint}</p>
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
              <CardTitle className="text-lg">{a.rsDefaultCourse}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.rsDefaultCourseDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Select
            value={settings.academy_registration_default_course || "none"}
            onValueChange={(v) => onUpdate({ academy_registration_default_course: v === "none" ? "" : v })}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder={a.rsDefaultCoursePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{a.rsNoDefaultCourse}</SelectItem>
              {publishedCourses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground mt-2">{a.rsDefaultCourseHint}</p>
        </CardContent>
      </Card>
    </div>
  )
}