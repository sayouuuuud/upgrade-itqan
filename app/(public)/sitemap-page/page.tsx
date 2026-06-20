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
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const sections: SitemapSection[] = [
    {
      title: isAr ? 'الصفحات العامة' : 'Public Pages',
      icon: Globe,
      color: 'bg-primary/10 text-primary',
      links: [
        { href: '/', label: isAr ? 'الصفحة الرئيسية' : 'Home Page', description: isAr ? 'صفحة الهبوط مع نظرة عامة عن المنصة' : 'Landing page with platform overview' },
        { href: '/about', label: isAr ? 'من نحن' : 'About Us', description: isAr ? 'معلومات عن المنصة ورؤيتها ورسالتها' : 'Information about the platform, vision, and mission' },
        { href: '/contact', label: isAr ? 'تواصل معنا' : 'Contact Us', description: isAr ? 'نموذج التواصل والدعم الفني' : 'Contact form and technical support' },
      ],
    },
    {
      title: isAr ? 'المصادقة' : 'Authentication',
      icon: Shield,
      color: 'bg-accent/10 text-accent-foreground',
      links: [
        { href: '/login', label: isAr ? 'تسجيل الدخول' : 'Login', description: isAr ? 'صفحة تسجيل الدخول بالبريد وكلمة المرور' : 'Login page with email and password' },
        { href: '/register', label: isAr ? 'إنشاء حساب' : 'Register', description: isAr ? 'تسجيل حساب جديد كطالب أو قارئ' : 'Register a new account as a student or reciter' },
        { href: '/reset-password', label: isAr ? 'استعادة كلمة المرور' : 'Reset Password', description: isAr ? 'إرسال رابط إعادة تعيين كلمة المرور' : 'Send password reset link' },
      ],
    },
    {
      title: isAr ? 'لوحة الطالب' : 'Student Portal',
      icon: Users,
      color: 'bg-success/10 text-success',
      links: [
        { href: '/student', label: isAr ? 'لوحة التحكم' : 'Dashboard', description: isAr ? 'نظرة عامة على حالة التلاوات والجلسات' : 'Overview of recitations and sessions status' },
        { href: '/student/submit', label: isAr ? 'تسجيل تلاوة' : 'Record Recitation', description: isAr ? 'تسجيل تلاوة صوتية أو رفع ملف mp3' : 'Record audio recitation or upload mp3 file' },
        { href: '/student/recitations', label: isAr ? 'تلاواتي' : 'My Recitations', description: isAr ? 'قائمة جميع التلاوات مع الفلاتر' : 'List of all recitations with filters' },
        { href: '/student/recitations/101', label: isAr ? 'تفاصيل التلاوة' : 'Recitation Details', description: isAr ? 'عرض تفاصيل تلاوة محددة مع ملاحظات القارئ' : 'Show details of a specific recitation with reviewer notes' },
        { href: '/student/booking', label: isAr ? 'حجز جلسة' : 'Book Session', description: isAr ? 'حجز جلسة مراجعة مع قارئ متاح' : 'Book a correction session with an available reciter' },
        { href: '/student/sessions', label: isAr ? 'جلساتي' : 'My Sessions', description: isAr ? 'قائمة الجلسات المحجوزة مع روابط الانضمام' : 'List of booked sessions with join links' },
        { href: '/student/notifications', label: isAr ? 'الإشعارات' : 'Notifications', description: isAr ? 'جميع الإشعارات والتنبيهات' : 'All notifications and alerts' },
        { href: '/student/profile', label: isAr ? 'الملف الشخصي' : 'Profile', description: isAr ? 'إدارة بيانات الحساب وكلمة المرور' : 'Manage account details and password' },
      ],
    },
    {
      title: isAr ? 'لوحة القارئ' : 'Reciter Portal',
      icon: BookOpen,
      color: 'bg-primary/10 text-primary',
      links: [
        { href: '/reader', label: isAr ? 'لوحة التحكم' : 'Dashboard', description: isAr ? 'نظرة عامة على التلاوات المعلقة والجلسات' : 'Overview of pending recitations and sessions' },
        { href: '/reader/recitations', label: isAr ? 'مراجعة التلاوات' : 'Review Recitations', description: isAr ? 'قائمة التلاوات للمراجعة مع البحث والفلاتر' : 'List of recitations to review with search and filters' },
        { href: '/reader/recitations/101', label: isAr ? 'تفاصيل المراجعة' : 'Review Details', description: isAr ? 'مشغل صوتي وأدوات التقييم والملاحظات' : 'Audio player, grading tools, and comments' },
        { href: '/reader/schedule', label: isAr ? 'إدارة المواعيد' : 'Schedule Management', description: isAr ? 'إضافة وحذف المواعيد المتاحة' : 'Add and delete available time slots' },
        { href: '/reader/sessions', label: isAr ? 'الجلسات' : 'Sessions', description: isAr ? 'إدارة الجلسات وإضافة روابط الاجتماع' : 'Manage sessions and add meeting links' },
        { href: '/reader/chat', label: isAr ? 'المحادثات' : 'Conversations', description: isAr ? 'التواصل مع الطلاب وإرسال الروابط' : 'Communicate with students and send links' },
        { href: '/reader/profile', label: isAr ? 'الملف الشخصي' : 'Profile', description: isAr ? 'إدارة بيانات الحساب' : 'Manage account details' },
      ],
    },
    {
      title: isAr ? 'لوحة المدير' : 'Admin Portal',
      icon: Shield,
      color: 'bg-destructive/10 text-destructive',
      links: [
        { href: '/admin', label: isAr ? 'لوحة التحكم' : 'Dashboard', description: isAr ? 'إحصائيات شاملة وشارتات ومؤشرات أداء' : 'Comprehensive statistics, charts, and KPIs' },
        { href: '/admin/users', label: isAr ? 'إدارة المستخدمين' : 'User Management', description: isAr ? 'إدارة الطلاب والقراء وتغيير الأدوار' : 'Manage students and reciters, change roles' },
        { href: '/admin/recitations', label: isAr ? 'إدارة التلاوات' : 'Recitations Management', description: isAr ? 'قائمة كاملة مع إعادة تعيين وإجراءات جماعية' : 'Full list of recitations with reassign and batch actions' },
        { href: '/admin/settings', label: isAr ? 'إعدادات النظام' : 'System Settings', description: isAr ? 'إعدادات SMTP والتخزين وسير العمل والأمان' : 'SMTP, storage, workflow, and security settings' },
        { href: '/admin/reports', label: isAr ? 'التقارير' : 'Reports', description: isAr ? 'تقارير وإحصائيات وتصدير البيانات' : 'Reports, statistics, and data export' },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto px-4 py-12 lg:py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground text-balance">{isAr ? "خريطة الموقع" : "Sitemap"}</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-pretty">
            {isAr ? "جميع صفحات منصة حنا لازن مرتبة حسب الأقسام والأدوار" : "All pages of Itqan platform organized by sections and roles"}
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
                    {section.links.length} {isAr ? "صفحة" : "pages"}
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
              { label: isAr ? 'أقسام' : 'sections', count: sections.length },
              { label: isAr ? 'صفحة' : 'pages', count: sections.reduce((sum, s) => sum + s.links.length, 0) },
              { label: isAr ? 'أدوار' : 'roles', count: 3 },
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
