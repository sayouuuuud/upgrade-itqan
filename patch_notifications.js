const fs = require('fs');

const notificationsAdditionsEn = `
    filterTitle: 'Filter Notifications',
    type: 'Type',
    allTypes: 'All Types',
    category: 'Category',
    allCategories: 'All Categories',
    status: 'Status',
    allStatus: 'All',
    read: 'Read',
    unread: 'Unread',
    dateRange: 'Date Range',
    allPeriods: 'All Time',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    resetFilters: 'Reset Filters',
    ofNotification: 'of Notification',
    clear: 'Clear',
    noMatching: 'No matching notifications',
    tryChangingFilters: 'Try changing your filters to find notifications.',
    types: {
      recitation_received: "New Report",
      recitation_reviewed: "Report Reviewed",
      mastered: "Mastered",
      needs_session: "Session Needed",
      session_booked: "Session Booked",
      session_reminder: "Session Reminder",
      new_reader_application: "New Reader Application",
      reader_approved: "Reader Approved",
      reader_rejected: "Reader Rejected",
      new_recitation_admin: "New Admin Report",
      new_message: "New Message",
      new_announcement: "New Announcement",
      new_contact_message: "Contact Message",
      general: "General"
    },
    categories: {
      recitation: "Reports",
      session: "Sessions",
      account: "Account",
      message: "Messages",
      announcement: "Announcements",
      booking: "Bookings",
      general: "General"
    },
`;

const notificationsAdditionsAr = `
    filterTitle: 'تصفية الإشعارات',
    type: 'النوع',
    allTypes: 'جميع الأنواع',
    category: 'الفئة',
    allCategories: 'جميع الفئات',
    status: 'الحالة',
    allStatus: 'الكل',
    read: 'مقروء',
    unread: 'غير مقروء',
    dateRange: 'النطاق الزمني',
    allPeriods: 'كل الفترات',
    today: 'اليوم',
    thisWeek: 'هذا الأسبوع',
    thisMonth: 'هذا الشهر',
    resetFilters: 'إعادة تعيين الفلاتر',
    ofNotification: 'من إشعار',
    clear: 'مسح',
    noMatching: 'لا توجد إشعارات مطابقة',
    tryChangingFilters: 'جرب تغيير الفلاتر للعثور على الإشعارات.',
    types: {
      recitation_received: "تقرير جديد",
      recitation_reviewed: "تقرير تم مراجعته",
      mastered: "اتقان",
      needs_session: "جلسة مطلوبة",
      session_booked: "جلسة محجوزة",
      session_reminder: "تذكير الجلسة",
      new_reader_application: "طلب قارئ جديد",
      reader_approved: "قارئ موافق عليه",
      reader_rejected: "قارئ مرفوض",
      new_recitation_admin: "تقرير جديد للمسؤول",
      new_message: "رسالة جديدة",
      new_announcement: "إعلان جديد",
      new_contact_message: "رسالة تواصل",
      general: "عام"
    },
    categories: {
      recitation: "التقارير",
      session: "الجلسات",
      account: "الحساب",
      message: "الرسائل",
      announcement: "الإعلانات",
      booking: "الحجوزات",
      general: "عام"
    },
`;

// Patch en.ts
let en = fs.readFileSync('lib/i18n/locales/en.ts', 'utf-8');
en = en.replace(/(notifications:\s*\{[\s\S]*?)(?=\s*\},?\n\s*\/\/)/, (m) => m + notificationsAdditionsEn);
fs.writeFileSync('lib/i18n/locales/en.ts', en);

// Patch ar.ts
let ar = fs.readFileSync('lib/i18n/locales/ar.ts', 'utf-8');
ar = ar.replace(/(notifications:\s*\{[\s\S]*?)(?=\s*\},?\n\s*\/\/)/, (m) => m + notificationsAdditionsAr);
fs.writeFileSync('lib/i18n/locales/ar.ts', ar);

console.log("Patched en.ts and ar.ts with notifications dictionaries.");

let comp = fs.readFileSync('components/notifications-page.tsx', 'utf-8');

comp = comp.replace(/const TYPE_LABELS_AR[\s\S]*?const CATEGORY_LABELS_EN: Record<string, string> = \{[\s\S]*?\}/, '');

comp = comp.replace(/function getTypeLabel\(type: string, isAr: boolean\): string \{\s*return \(isAr \? TYPE_LABELS_AR : TYPE_LABELS_EN\)\[type\] \?\? type\s*\}/, 
  'function getTypeLabel(type: string, t: any): string { return t.notifications?.types?.[type] ?? type }');

comp = comp.replace(/function getCategoryLabel\(category: string, isAr: boolean\): string \{\s*return \(isAr \? CATEGORY_LABELS_AR : CATEGORY_LABELS_EN\)\[category\] \?\? category\s*\}/,
  'function getCategoryLabel(category: string, t: any): string { return t.notifications?.categories?.[category] ?? category }');

comp = comp.replace(/getTypeLabel\(type, isAr\)/g, 'getTypeLabel(type, t)');
comp = comp.replace(/getCategoryLabel\(category, isAr\)/g, 'getCategoryLabel(category, t)');
comp = comp.replace(/getTypeLabel\(n\.type, isAr\)/g, 'getTypeLabel(n.type, t)');
comp = comp.replace(/getCategoryLabel\(n\.category, isAr\)/g, 'getCategoryLabel(n.category, t)');
comp = comp.replace(/getTypeLabel\(t, isAr\)/g, 'getTypeLabel(t_val, t)'); // will fix manually below

comp = comp.replace(/<span className="font-medium text-foreground">تصفية الإشعارات<\/span>/g, 
  '<span className="font-medium text-foreground">{t.notifications?.filterTitle ?? "Filter Notifications"}</span>');

comp = comp.replace(/"النوع"/g, '{t.notifications?.type ?? "Type"}');
comp = comp.replace(/"جميع الأنواع"/g, '{t.notifications?.allTypes ?? "All Types"}');
comp = comp.replace(/getTypeLabel\(t_val, isAr\)/g, 'getTypeLabel(t_val, t)');
comp = comp.replace(/getTypeLabel\(t, isAr\)/g, 'getTypeLabel(t, t)');

comp = comp.replace(/"الفئة"/g, '{t.notifications?.category ?? "Category"}');
comp = comp.replace(/"جميع الفئات"/g, '{t.notifications?.allCategories ?? "All Categories"}');
comp = comp.replace(/getCategoryLabel\(c, isAr\)/g, 'getCategoryLabel(c, t)');

comp = comp.replace(/"الحالة"/g, '{t.notifications?.status ?? "Status"}');
comp = comp.replace(/"الكل"/g, '{t.notifications?.allStatus ?? "All"}');
comp = comp.replace(/"مقروء"/g, '{t.notifications?.read ?? "Read"}');
comp = comp.replace(/"غير مقروء"/g, '{t.notifications?.unread ?? "Unread"}');

comp = comp.replace(/"النطاق الزمني"/g, '{t.notifications?.dateRange ?? "Date Range"}');
comp = comp.replace(/"كل الفترات"/g, '{t.notifications?.allPeriods ?? "All Time"}');
comp = comp.replace(/"اليوم"/g, '{t.notifications?.today ?? "Today"}');
comp = comp.replace(/"هذا الأسبوع"/g, '{t.notifications?.thisWeek ?? "This Week"}');
comp = comp.replace(/"هذا الشهر"/g, '{t.notifications?.thisMonth ?? "This Month"}');

comp = comp.replace(/"إعادة تعيين الفلاتر"/g, '{t.notifications?.resetFilters ?? "Reset Filters"}');

comp = comp.replace(/\{n\.id\} من إشعار /g, '{n.id} {t.notifications?.ofNotification ?? "of Notification"} ');

comp = comp.replace(/مسح الكل/g, '{t.notifications?.clearAll ?? "Clear All"}');
comp = comp.replace(/"لا توجد إشعارات مطابقة"/g, '{t.notifications?.noMatching ?? "No matching notifications"}');
comp = comp.replace(/"جرب تغيير الفلاتر للعثور على الإشعارات\."/g, '{t.notifications?.tryChangingFilters ?? "Try changing your filters to find notifications."}');
comp = comp.replace(/"مسح"/g, '{t.notifications?.clear ?? "Clear"}');

fs.writeFileSync('components/notifications-page.tsx', comp);
console.log("Patched components/notifications-page.tsx");
