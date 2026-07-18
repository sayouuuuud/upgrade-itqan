"use client"

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Globe, Users, BookOpen, Shield, LogIn, UserPlus, KeyRound,
  LayoutDashboard, Mic, FileText, Calendar, Clock, Bell, User,
  ClipboardList, MessageSquare, Settings, BarChart3
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

type SitemapSection = {
  title: string
  icon: React.ElementType
  color: string
  links: { href: string; label: string; description: string }[]
}

export default function SitemapPage() {
    const { t } = useI18n();
  const app = (t as any).app as Record<string, string> | undefined
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const sections: SitemapSection[] = [
    {
      title: (t.addedTranslations_2026?.['الصفحات العامة'] || (t.addedTranslations_2026?.['الصفحات العامة'] || 'الصفحات العامة')),
      icon: Globe,
      color: 'bg-primary/10 text-primary',
      links: [
        { href: '/', label: (t.addedTranslations_2026?.['الصفحة الرئيسية'] || (t.addedTranslations_2026?.['الصفحة الرئيسية'] || 'الصفحة الرئيسية')), description: (t.addedTranslations_2026?.['صفحة الهبوط مع نظرة عامة عن المنصة'] || (t.addedTranslations_2026?.['صفحة الهبوط مع نظرة عامة عن المنصة'] || 'صفحة الهبوط مع نظرة عامة عن المنصة')) },
        { href: '/about', label: (t.addedTranslations_2026?.['من نحن'] || (t.addedTranslations_2026?.['من نحن'] || 'من نحن')), description: (t.addedTranslations_2026?.['معلومات عن المنصة ورؤيتها ورسالتها'] || (t.addedTranslations_2026?.['معلومات عن المنصة ورؤيتها ورسالتها'] || 'معلومات عن المنصة ورؤيتها ورسالتها')) },
        { href: '/contact', label: (t.addedTranslations_2026?.['تواصل معنا'] || (t.addedTranslations_2026?.['تواصل معنا'] || 'تواصل معنا')), description: (t.addedTranslations_2026?.['نموذج التواصل والدعم الفني'] || (t.addedTranslations_2026?.['نموذج التواصل والدعم الفني'] || 'نموذج التواصل والدعم الفني')) },
      ],
    },
    {
      title: (t.addedTranslations_2026?.['المصادقة'] || (t.addedTranslations_2026?.['المصادقة'] || 'المصادقة')),
      icon: Shield,
      color: 'bg-accent/10 text-accent-foreground',
      links: [
        { href: '/login', label: (t.addedTranslations_2026?.['تسجيل الدخول'] || (t.addedTranslations_2026?.['تسجيل الدخول'] || 'تسجيل الدخول')), description: (t.addedTranslations_2026?.['صفحة تسجيل الدخول بالبريد وكلمة المرور'] || (t.addedTranslations_2026?.['صفحة تسجيل الدخول بالبريد وكلمة المرور'] || 'صفحة تسجيل الدخول بالبريد وكلمة المرور')) },
        { href: '/register', label: (t.addedTranslations_2026?.['إنشاء حساب'] || (t.addedTranslations_2026?.['إنشاء حساب'] || 'إنشاء حساب')), description: (t.addedTranslations_2026?.['تسجيل حساب جديد كطالب أو قارئ'] || (t.addedTranslations_2026?.['تسجيل حساب جديد كطالب أو قارئ'] || 'تسجيل حساب جديد كطالب أو قارئ')) },
        { href: '/reset-password', label: (t.addedTranslations_2026?.['استعادة كلمة المرور'] || (t.addedTranslations_2026?.['استعادة كلمة المرور'] || 'استعادة كلمة المرور')), description: (t.addedTranslations_2026?.['إرسال رابط إعادة تعيين كلمة المرور'] || (t.addedTranslations_2026?.['إرسال رابط إعادة تعيين كلمة المرور'] || 'إرسال رابط إعادة تعيين كلمة المرور')) },
      ],
    },
    {
      title: (t.addedTranslations_2026?.['لوحة الطالب'] || (t.addedTranslations_2026?.['لوحة الطالب'] || 'لوحة الطالب')),
      icon: Users,
      color: 'bg-success/10 text-success',
      links: [
        { href: '/student', label: (t.addedTranslations_2026?.['لوحة التحكم'] || (t.addedTranslations_2026?.['لوحة التحكم'] || 'لوحة التحكم')), description: (t.addedTranslations_2026?.['نظرة عامة على حالة التلاوات والجلسات'] || (t.addedTranslations_2026?.['نظرة عامة على حالة التلاوات والجلسات'] || 'نظرة عامة على حالة التلاوات والجلسات')) },
        { href: '/student/submit', label: (t.addedTranslations_2026?.['تسجيل تلاوة'] || (t.addedTranslations_2026?.['تسجيل تلاوة'] || 'تسجيل تلاوة')), description: (t.addedTranslations_2026?.['تسجيل تلاوة صوتية أو رفع ملف mp3'] || (t.addedTranslations_2026?.['تسجيل تلاوة صوتية أو رفع ملف mp3'] || 'تسجيل تلاوة صوتية أو رفع ملف mp3')) },
        { href: '/student/recitations', label: (t.addedTranslations_2026?.['تلاواتي'] || (t.addedTranslations_2026?.['تلاواتي'] || 'تلاواتي')), description: (t.addedTranslations_2026?.['قائمة جميع التلاوات مع الفلاتر'] || (t.addedTranslations_2026?.['قائمة جميع التلاوات مع الفلاتر'] || 'قائمة جميع التلاوات مع الفلاتر')) },
        { href: '/student/recitations/101', label: (t.addedTranslations_2026?.['تفاصيل التلاوة'] || (t.addedTranslations_2026?.['تفاصيل التلاوة'] || 'تفاصيل التلاوة')), description: (t.addedTranslations_2026?.['عرض تفاصيل تلاوة محددة مع ملاحظات القارئ'] || (t.addedTranslations_2026?.['عرض تفاصيل تلاوة محددة مع ملاحظات القارئ'] || 'عرض تفاصيل تلاوة محددة مع ملاحظات القارئ')) },
        { href: '/student/booking', label: (t.addedTranslations_2026?.['حجز جلسة'] || (t.addedTranslations_2026?.['حجز جلسة'] || 'حجز جلسة')), description: (t.addedTranslations_2026?.['حجز جلسة مراجعة مع قارئ متاح'] || (t.addedTranslations_2026?.['حجز جلسة مراجعة مع قارئ متاح'] || 'حجز جلسة مراجعة مع قارئ متاح')) },
        { href: '/student/sessions', label: (t.addedTranslations_2026?.['جلساتي'] || (t.addedTranslations_2026?.['جلساتي'] || 'جلساتي')), description: (t.addedTranslations_2026?.['قائمة الجلسات المحجوزة مع روابط الانضمام'] || (t.addedTranslations_2026?.['قائمة الجلسات المحجوزة مع روابط الانضمام'] || 'قائمة الجلسات المحجوزة مع روابط الانضمام')) },
        { href: '/student/notifications', label: (t.addedTranslations_2026?.['الإشعارات'] || (t.addedTranslations_2026?.['الإشعارات'] || 'الإشعارات')), description: (t.addedTranslations_2026?.['جميع الإشعارات والتنبيهات'] || (t.addedTranslations_2026?.['جميع الإشعارات والتنبيهات'] || 'جميع الإشعارات والتنبيهات')) },
        { href: '/student/profile', label: (t.addedTranslations_2026?.['الملف الشخصي'] || (t.addedTranslations_2026?.['الملف الشخصي'] || 'الملف الشخصي')), description: (t.addedTranslations_2026?.['إدارة بيانات الحساب وكلمة المرور'] || (t.addedTranslations_2026?.['إدارة بيانات الحساب وكلمة المرور'] || 'إدارة بيانات الحساب وكلمة المرور')) },
      ],
    },
    {
      title: (t.addedTranslations_2026?.['لوحة القارئ'] || (t.addedTranslations_2026?.['لوحة القارئ'] || 'لوحة القارئ')),
      icon: BookOpen,
      color: 'bg-primary/10 text-primary',
      links: [
        { href: '/reader', label: (t.addedTranslations_2026?.['لوحة التحكم'] || (t.addedTranslations_2026?.['لوحة التحكم'] || 'لوحة التحكم')), description: (t.addedTranslations_2026?.['نظرة عامة على التلاوات المعلقة والجلسات'] || (t.addedTranslations_2026?.['نظرة عامة على التلاوات المعلقة والجلسات'] || 'نظرة عامة على التلاوات المعلقة والجلسات')) },
        { href: '/reader/recitations', label: (t.addedTranslations_2026?.['مراجعة التلاوات'] || (t.addedTranslations_2026?.['مراجعة التلاوات'] || 'مراجعة التلاوات')), description: (t.addedTranslations_2026?.['قائمة التلاوات للمراجعة مع البحث والفلاتر'] || (t.addedTranslations_2026?.['قائمة التلاوات للمراجعة مع البحث والفلاتر'] || 'قائمة التلاوات للمراجعة مع البحث والفلاتر')) },
        { href: '/reader/recitations/101', label: (t.addedTranslations_2026?.['تفاصيل المراجعة'] || (t.addedTranslations_2026?.['تفاصيل المراجعة'] || 'تفاصيل المراجعة')), description: (t.addedTranslations_2026?.['مشغل صوتي وأدوات التقييم والملاحظات'] || (t.addedTranslations_2026?.['مشغل صوتي وأدوات التقييم والملاحظات'] || 'مشغل صوتي وأدوات التقييم والملاحظات')) },
        { href: '/reader/schedule', label: (t.addedTranslations_2026?.['إدارة المواعيد'] || (t.addedTranslations_2026?.['إدارة المواعيد'] || 'إدارة المواعيد')), description: (t.addedTranslations_2026?.['إضافة وحذف المواعيد المتاحة'] || (t.addedTranslations_2026?.['إضافة وحذف المواعيد المتاحة'] || 'إضافة وحذف المواعيد المتاحة')) },
        { href: '/reader/sessions', label: (t.addedTranslations_2026?.['الجلسات'] || (t.addedTranslations_2026?.['الجلسات'] || 'الجلسات')), description: (t.addedTranslations_2026?.['إدارة الجلسات وإضافة روابط الاجتماع'] || (t.addedTranslations_2026?.['إدارة الجلسات وإضافة روابط الاجتماع'] || 'إدارة الجلسات وإضافة روابط الاجتماع')) },
        { href: '/reader/chat', label: (t.addedTranslations_2026?.['المحادثات'] || (t.addedTranslations_2026?.['المحادثات'] || 'المحادثات')), description: (t.addedTranslations_2026?.['التواصل مع الطلاب وإرسال الروابط'] || (t.addedTranslations_2026?.['التواصل مع الطلاب وإرسال الروابط'] || 'التواصل مع الطلاب وإرسال الروابط')) },
        { href: '/reader/profile', label: (t.addedTranslations_2026?.['الملف الشخصي'] || (t.addedTranslations_2026?.['الملف الشخصي'] || 'الملف الشخصي')), description: (t.addedTranslations_2026?.['إدارة بيانات الحساب'] || (t.addedTranslations_2026?.['إدارة بيانات الحساب'] || 'إدارة بيانات الحساب')) },
      ],
    },
    {
      title: (t.addedTranslations_2026?.['لوحة المدير'] || (t.addedTranslations_2026?.['لوحة المدير'] || 'لوحة المدير')),
      icon: Shield,
      color: 'bg-destructive/10 text-destructive',
      links: [
        { href: '/admin', label: (t.addedTranslations_2026?.['لوحة التحكم'] || (t.addedTranslations_2026?.['لوحة التحكم'] || 'لوحة التحكم')), description: (t.addedTranslations_2026?.['إحصائيات شاملة وشارتات ومؤشرات أداء'] || (t.addedTranslations_2026?.['إحصائيات شاملة وشارتات ومؤشرات أداء'] || 'إحصائيات شاملة وشارتات ومؤشرات أداء')) },
        { href: '/admin/users', label: (t.addedTranslations_2026?.['إدارة المستخدمين'] || (t.addedTranslations_2026?.['إدارة المستخدمين'] || 'إدارة المستخدمين')), description: (t.addedTranslations_2026?.['إدارة الطلاب والقراء وتغيير الأدوار'] || (t.addedTranslations_2026?.['إدارة الطلاب والقراء وتغيير الأدوار'] || 'إدارة الطلاب والقراء وتغيير الأدوار')) },
        { href: '/admin/recitations', label: (t.addedTranslations_2026?.['إدارة التلاوات'] || (t.addedTranslations_2026?.['إدارة التلاوات'] || 'إدارة التلاوات')), description: (t.addedTranslations_2026?.['قائمة كاملة مع إعادة تعيين وإجراءات جماعية'] || (t.addedTranslations_2026?.['قائمة كاملة مع إعادة تعيين وإجراءات جماعية'] || 'قائمة كاملة مع إعادة تعيين وإجراءات جماعية')) },
        { href: '/admin/settings', label: (t.addedTranslations_2026?.['إعدادات النظام'] || (t.addedTranslations_2026?.['إعدادات النظام'] || 'إعدادات النظام')), description: (t.addedTranslations_2026?.['إعدادات SMTP والتخزين وسير العمل والأمان'] || (t.addedTranslations_2026?.['إعدادات SMTP والتخزين وسير العمل والأمان'] || 'إعدادات SMTP والتخزين وسير العمل والأمان')) },
        { href: '/admin/reports', label: (t.addedTranslations_2026?.['التقارير'] || (t.addedTranslations_2026?.['التقارير'] || 'التقارير')), description: (t.addedTranslations_2026?.['تقارير وإحصائيات وتصدير البيانات'] || (t.addedTranslations_2026?.['تقارير وإحصائيات وتصدير البيانات'] || 'تقارير وإحصائيات وتصدير البيانات')) },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto px-4 py-12 lg:py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground text-balance">{(t.addedTranslations_2026?.['خريطة الموقع'] || (t.addedTranslations_2026?.['خريطة الموقع'] || 'خريطة الموقع'))}</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-pretty">
            {(t.addedTranslations_2026?.['جميع صفحات منصة حنا لازن مرتبة حسب الأقسام والأدوار'] || (t.addedTranslations_2026?.['جميع صفحات منصة حنا لازن مرتبة حسب الأقسام والأدوار'] || 'جميع صفحات منصة حنا لازن مرتبة حسب الأقسام والأدوار'))}
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <Card key={section.title} className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${section.color}`}>
                    <section.icon className="w-5 h-5" />
                  </div>
                  {section.title}
                  <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {section.links.length} {(t.addedTranslations_2026?.['صفحة'] || (t.addedTranslations_2026?.['صفحة'] || 'صفحة'))}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group flex items-start gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-right"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {link.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                        <p className="text-[10px] text-muted-foreground/60 font-mono mt-1" dir="ltr">{link.href}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-6 p-4 bg-secondary rounded-xl">
            {[
              { label: (t.addedTranslations_2026?.['أقسام'] || (t.addedTranslations_2026?.['أقسام'] || 'أقسام')), count: sections.length },
              { label: (t.addedTranslations_2026?.['صفحة'] || (t.addedTranslations_2026?.['صفحة'] || 'صفحة')), count: sections.reduce((sum, s) => sum + s.links.length, 0) },
              { label: (t.addedTranslations_2026?.['أدوار'] || (t.addedTranslations_2026?.['أدوار'] || 'أدوار')), count: 3 },
            ].map((item) => (
              <div key={item.label} className="text-center px-4">
                <p className="text-2xl font-bold text-primary">{item.count}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
