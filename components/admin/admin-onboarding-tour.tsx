"use client"

import { useEffect, useState } from "react"
import { ShieldCheck, Palette, Sparkles, Users, ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context";

type Step = {
  icon: typeof ShieldCheck
  title: string
  body: string
}

// Steps differ slightly by tier: super admins get the full tour (theme, branding,
// roles); maqraa/academy admins get a shorter, scoped intro.
function getSteps(isSuper: boolean): Step[] {
  const common: Step[] = [
    {
      icon: ShieldCheck,
      title: "أهلاً بك في لوحة التحكم",
      body: "هذه جولة سريعة (خطوات قليلة) تعرّفك على أهم الأدوات. يمكنك تخطّيها في أي وقت.",
    },
  ]
  if (!isSuper) {
    return [
      ...common,
      {
        icon: Users,
        title: "إدارة مجالك",
        body: "من القائمة الجانبية تصل إلى كل ما يخص مجالك من متابعة وإدارة ومراجعة.",
      },
      {
        icon: Sparkles,
        title: "كل شيء قابل للتعديل",
        body: "أغلب المحتوى والإعدادات تُدار من هنا مباشرةً دون الحاجة لأي تدخل تقني.",
      },
    ]
  }
  return [
    ...common,
    {
      icon: ShieldCheck,
      title: "التبديل بين الأوضاع",
      body: "من الزر أعلى الصفحة يمكنك التبديل بين وضع المدير العام ومدير المقرأة ومدير الأكاديمية. عند الانتقال لوضع آخر يظهر شريط ملوّن يذكّرك بذلك.",
    },
    {
      icon: Palette,
      title: "التصميم والهوية",
      body: "صفحتا «التصميم» و«الهوية» تتيحان لك تغيير الألوان والخطوط واسم الموقع وشعاره — وهي حصرية للمدير العام.",
    },
    {
      icon: Users,
      title: "إدارة الأدوار",
      body: "من «إدارة الأدوار» يمكنك معرفة صلاحيات كل دور وتعيين الأدوار للمستخدمين بسهولة.",
    },
  ]
}

export function AdminOnboardingTour({ role, adminMode }: { role: string; adminMode?: "super" | "maqraa" | "academy" }) {
  const { t } = useI18n();
  const admin = (t as any).admin as Record<string, string> | undefined
  const isAr = t.locale === "ar";
  const isSuper = role === "admin" || role === "super_admin"
  const storageKey = `itqaan_admin_tour_v1_${isSuper ? "super" : "scoped"}`
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) {
        setOpen(true)
      }
    } catch {
      // ignore storage errors
    }
  }, [storageKey])

  function dismiss() {
    try {
      localStorage.setItem(storageKey, "1")
    } catch {
      // ignore
    }
    setOpen(false)
  }

  if (!open) return null

  const steps = getSteps(isSuper)
  const current = steps[step]
  const Icon = current.icon
  const isLast = step === steps.length - 1

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-7 w-7" />
        </div>
        <h2 className="mb-2 text-xl font-black text-foreground text-balance">{current.title}</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground text-pretty">{current.body}</p>

        {/* Progress dots */}
        <div className="mb-6 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button onClick={dismiss} className="text-sm font-bold text-muted-foreground hover:text-foreground">
            {isAr ? "تخطّي" : "Translated"}
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)} className="gap-1 rounded-xl font-bold">
                <ArrowRight className="h-4 w-4" />
                {isAr ? "السابق" : "Translated"}
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={dismiss} className="gap-1 rounded-xl font-bold">
                <Check className="h-4 w-4" />
                {isAr ? "ابدأ" : "Translated"}
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep((s) => s + 1)} className="gap-1 rounded-xl font-bold">
                {isAr ? "التالي" : "Translated"}
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
