const fs = require('fs');

function fix() {
    const file1 = 'app/admin/analytics/platform-overview-client.tsx';
    let c1 = fs.readFileSync(file1, 'utf8');

    // Make sure we have useI18n imported
    if (!c1.includes('useI18n')) {
        c1 = c1.replace(
            'import { useEffect, useState } from "react"',
            'import { useEffect, useState } from "react"\nimport { useI18n } from "@/lib/i18n/context"'
        );
    }
    
    // Add t and isAr to PlatformOverviewClient
    if (!c1.includes('const { t } = useI18n()')) {
        c1 = c1.replace(
            'export function PlatformOverviewClient() {',
            'export function PlatformOverviewClient() {\n  const { t } = useI18n()\n  const isAr = t.locale === "ar"'
        );
    }

    // Role Labels function
    c1 = c1.replace(
        'const ROLE_LABELS: Record<string, string> = {',
        'const getRoleLabels = (isAr: boolean): Record<string, string> => ({'
    );
    // Replace the closing brace for ROLE_LABELS with })
    c1 = c1.replace(
        '  supervisor: "مشرف",\r\n}',
        '  supervisor: isAr ? "مشرف" : "Supervisor",\r\n})'
    );
    c1 = c1.replace( // Fallback for \n
        '  supervisor: "مشرف",\n}',
        '  supervisor: isAr ? "مشرف" : "Supervisor",\n})'
    );
    
    c1 = c1.replace('admin: "المدير العام",', 'admin: isAr ? "المدير العام" : "Super Admin",');
    c1 = c1.replace('super_admin: "المدير العام",', 'super_admin: isAr ? "المدير العام" : "Super Admin",');
    c1 = c1.replace('maqraa_admin: "مدير المقرأة",', 'maqraa_admin: isAr ? "مدير المقرأة" : "Maqraa Admin",');
    c1 = c1.replace('academy_admin: "مدير الأكاديمية",', 'academy_admin: isAr ? "مدير الأكاديمية" : "Academy Admin",');
    c1 = c1.replace('teacher: "معلم",', 'teacher: isAr ? "معلم" : "Teacher",');
    c1 = c1.replace('reader: "مقرئ",', 'reader: isAr ? "مقرئ" : "Reader",');
    c1 = c1.replace('student: "طالب",', 'student: isAr ? "طالب" : "Student",');
    c1 = c1.replace('parent: "ولي أمر",', 'parent: isAr ? "ولي أمر" : "Parent",');
    c1 = c1.replace('student_supervisor: "مشرف طلاب",', 'student_supervisor: isAr ? "مشرف طلاب" : "Student Supervisor",');
    c1 = c1.replace('reciter_supervisor: "مشرف مقرئين",', 'reciter_supervisor: isAr ? "مشرف مقرئين" : "Reciter Supervisor",');
    c1 = c1.replace('content_supervisor: "مشرف محتوى",', 'content_supervisor: isAr ? "مشرف محتوى" : "Content Supervisor",');
    c1 = c1.replace('fiqh_supervisor: "مشرف فقه",', 'fiqh_supervisor: isAr ? "مشرف فقه" : "Fiqh Supervisor",');
    c1 = c1.replace('quality_supervisor: "مشرف جودة",', 'quality_supervisor: isAr ? "مشرف جودة" : "Quality Supervisor",');

    // Fix usage of ROLE_LABELS
    c1 = c1.replace('ROLE_LABELS[r.role]', 'getRoleLabels(isAr)[r.role]');
    
    // Replace other hardcoded texts
    c1 = c1.replace('تعذر تحميل الإحصائيات.', 'isAr ? "تعذر تحميل الإحصائيات." : "Failed to load statistics."');
    c1 = c1.replace('نظرة عامة على المنصة', 'isAr ? "نظرة عامة على المنصة" : "Platform Overview"');
    c1 = c1.replace('إحصائيات شاملة للمدير العام تجمع بين الأكاديمية والمقرأة.', 'isAr ? "إحصائيات شاملة للمدير العام تجمع بين الأكاديمية والمقرأة." : "Comprehensive statistics for Super Admin combining Academy and Maqraa."');
    c1 = c1.replace('>الأعضاء<', '>{isAr ? "الأعضاء" : "Members"}<');
    c1 = c1.replace('label="إجمالي الأعضاء"', 'label={isAr ? "إجمالي الأعضاء" : "Total Members"}');
    c1 = c1.replace('label="الأعضاء النشطون"', 'label={isAr ? "الأعضاء النشطون" : "Active Members"}');
    c1 = c1.replace('label="أعضاء جدد (30 يوم)"', 'label={isAr ? "أعضاء جدد (30 يوم)" : "New Members (30 days)"}');
    
    // Wait, some texts are in JSX children, like: الأكاديمية
    c1 = c1.replace('الأكاديمية\r\n            </CardTitle>', '{isAr ? "الأكاديمية" : "Academy"}\r\n            </CardTitle>');
    c1 = c1.replace('الأكاديمية\n            </CardTitle>', '{isAr ? "الأكاديمية" : "Academy"}\n            </CardTitle>');
    c1 = c1.replace('المقرأة\r\n            </CardTitle>', '{isAr ? "المقرأة" : "Maqraa"}\r\n            </CardTitle>');
    c1 = c1.replace('المقرأة\n            </CardTitle>', '{isAr ? "المقرأة" : "Maqraa"}\n            </CardTitle>');
    
    c1 = c1.replace('>الدورات<', '>{isAr ? "الدورات" : "Courses"}<');
    c1 = c1.replace('>الدروس<', '>{isAr ? "الدروس" : "Lessons"}<');
    c1 = c1.replace('>الالتحاقات<', '>{isAr ? "الالتحاقات" : "Enrollments"}<');
    
    c1 = c1.replace('>التلاوات<', '>{isAr ? "التلاوات" : "Recitations"}<');
    c1 = c1.replace('>قيد المراجعة<', '>{isAr ? "قيد المراجعة" : "Pending Review"}<');
    c1 = c1.replace('>مُراجعة (7 أيام)<', '>{isAr ? "مُراجعة (7 أيام)" : "Reviewed (7 days)"}<');
    
    c1 = c1.replace('>توزيع الأدوار<', '>{isAr ? "توزيع الأدوار" : "Role Distribution"}<');
    c1 = c1.replace('>لا توجد بيانات.<', '>{isAr ? "لا توجد بيانات." : "No data available."}<');
    
    // Add {} around ternary inside JSX attributes
    c1 = c1.replace(/="isAr \? (.*?) : (.*?)"/g, '={isAr ? $1 : $2}');
    
    // Add {} around ternary for direct text nodes
    c1 = c1.replace(/>isAr \? (.*?) : (.*?)<\/p>/g, '>{isAr ? $1 : $2}</p>');
    c1 = c1.replace(/>isAr \? (.*?) : (.*?)<\/h1>/g, '>{isAr ? $1 : $2}</h1>');

    fs.writeFileSync(file1, c1);
    console.log("Done fixing platform-overview-client.tsx");

    // Let's do the same for dashboard-super.tsx
    const file2 = 'components/admin/dashboard-super.tsx';
    let c2 = fs.readFileSync(file2, 'utf8');

    c2 = c2.replace('>حدث خطأ أثناء تحميل النظرة الشاملة<', '>{isAr ? "حدث خطأ أثناء تحميل النظرة الشاملة" : "An error occurred while loading overview"}<');
    
    c2 = c2.replace('"إجمالي المستخدمين"', 'isAr ? "إجمالي المستخدمين" : "Total Users"');
    c2 = c2.replace('`${users.active} نشط • ${users.new_30} جديد هذا الشهر`', 'isAr ? `${users.active} نشط • ${users.new_30} جديد هذا الشهر` : `${users.active} Active • ${users.new_30} New this month`');
    
    c2 = c2.replace('"المستخدمون النشطون"', 'isAr ? "المستخدمون النشطون" : "Active Users"');
    c2 = c2.replace('`${Math.round((users.active / Math.max(users.total, 1)) * 100)}% من الإجمالي`', 'isAr ? `${Math.round((users.active / Math.max(users.total, 1)) * 100)}% من الإجمالي` : `${Math.round((users.active / Math.max(users.total, 1)) * 100)}% of total`');
    
    c2 = c2.replace('"دورات الأكاديمية"', 'isAr ? "دورات الأكاديمية" : "Academy Courses"');
    c2 = c2.replace('`${academy.enrollments} التحاق • ${academy.lessons} درس`', 'isAr ? `${academy.enrollments} التحاق • ${academy.lessons} درس` : `${academy.enrollments} Enrollments • ${academy.lessons} Lessons`');
    
    c2 = c2.replace('"تلاوات المقرأة"', 'isAr ? "تلاوات المقرأة" : "Maqraa Recitations"');
    c2 = c2.replace('`${maqraa.pending} قيد الانتظار • ${maqraa.reviewed_7} تمت مراجعتها هذا الأسبوع`', 'isAr ? `${maqraa.pending} قيد الانتظار • ${maqraa.reviewed_7} تمت مراجعتها هذا الأسبوع` : `${maqraa.pending} Pending • ${maqraa.reviewed_7} Reviewed this week`');

    c2 = c2.replace('>مرحباً بك في لوحة تحكم<', '>{isAr ? "مرحباً بك في لوحة تحكم" : "Welcome to"}<');
    c2 = c2.replace('>المدير العام<', '>{isAr ? "المدير العام" : "Super Admin"}<');
    c2 = c2.replace('>نظرة شاملة وموحدة على أداء النظام، المستخدمين، والمحتوى عبر جميع أقسام المنصة.<', '>{isAr ? "نظرة شاملة وموحدة على أداء النظام، المستخدمين، والمحتوى عبر جميع أقسام المنصة." : "A unified comprehensive overview of system performance, users, and content across all platform sections."}<');
    c2 = c2.replace('>نظرة عامة<', '>{isAr ? "نظرة عامة" : "Overview"}<');
    c2 = c2.replace('>عرض التحليلات<', '>{isAr ? "عرض التحليلات" : "View Analytics"}<');
    
    fs.writeFileSync(file2, c2);
    console.log("Done fixing dashboard-super.tsx");
}

fix();
