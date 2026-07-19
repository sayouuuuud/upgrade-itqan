const fs = require('fs');
const arabicStrings = [
  'متقدم', 'متوسط', 'مبتدئ', 'جديد', 'لا توجد تلاوات بعد', 'قيد المراجعة', 'متقن', 'تحتاج جلسة', 'تم الحجز', 'مرحباً', 'لوحة الطالب', 'تابع تقدمك في تلاوة القرآن الكريم', 'تسميع جديد', 'إجمالي التسميعات', 'متقنة', 'المستوى الحالي', 'نقطة', 'ترتيبك', 'يوم متتالي', 'أعلى مستوى', 'تقدمك', 'آيات محفوظة', 'أجزاء مكتملة', 'أيام الانتظام', 'نسبة الإنجاز', 'إجمالي الحفظ', 'خريطة المصحف', 'محفوظ', 'متبقي', 'مخطط التقدم', 'أسبوعي', 'شهري', 'لا توجد بيانات بعد', 'حفظ جديد', 'مراجعة', 'سجل الحفظ اليومي', 'سجّل كم آية حفظت وراجعت اليوم', 'آيات حفظ جديدة', 'آيات مراجعة', 'تم الحفظ', 'تسجيل اليوم', 'تقرير التقدم', '٪ انتظام', 'آية حفظ هذا الأسبوع', 'أيام نشطة', 'آية مراجعة هذا الأسبوع', 'إجمالي آيات مسجلة', 'مواقيت الصلاة', 'القادمة', 'تعذر جلب مواقيت الصلاة', 'الورد اليومي', 'تعديل', 'لم تحدد ورداً يومياً بعد', 'إضافة ورد يومي', 'يتم إعادة تعيين الورد كل يوم تلقائياً', 'مساراتي التعليمية', 'الكل', 'لم تنضم إلى أي مسار بعد', 'تصفّح المسارات', 'النشاط الأخير', 'عرض الكل', 'لم تسجّل تلاوتك بعد', 'ابدأ التسميع'
];

const englishTranslations = {
  'متقدم': 'Advanced',
  'متوسط': 'Intermediate',
  'مبتدئ': 'Beginner',
  'جديد': 'New',
  'لا توجد تلاوات بعد': 'No recitations yet',
  'قيد المراجعة': 'Under review',
  'متقن': 'Mastered',
  'تحتاج جلسة': 'Needs session',
  'تم الحجز': 'Booked',
  'مرحباً': 'Welcome',
  'لوحة الطالب': 'Student Dashboard',
  'تابع تقدمك في تلاوة القرآن الكريم': 'Track your progress in reciting the Holy Quran',
  'تسميع جديد': 'New Recitation',
  'إجمالي التسميعات': 'Total Recitations',
  'متقنة': 'Mastered',
  'المستوى الحالي': 'Current Level',
  'نقطة': 'Point',
  'ترتيبك': 'Your Rank',
  'يوم متتالي': 'Consecutive Days',
  'أعلى مستوى': 'Highest Level',
  'تقدمك': 'Your Progress',
  'آيات محفوظة': 'Memorized Verses',
  'أجزاء مكتملة': 'Completed Juz',
  'أيام الانتظام': 'Consistency Days',
  'نسبة الإنجاز': 'Completion Rate',
  'إجمالي الحفظ': 'Total Memorization',
  'خريطة المصحف': 'Mushaf Map',
  'محفوظ': 'Memorized',
  'متبقي': 'Remaining',
  'مخطط التقدم': 'Progress Chart',
  'أسبوعي': 'Weekly',
  'شهري': 'Monthly',
  'لا توجد بيانات بعد': 'No data yet',
  'حفظ جديد': 'New Memorization',
  'مراجعة': 'Review',
  'سجل الحفظ اليومي': 'Daily Memorization Log',
  'سجّل كم آية حفظت وراجعت اليوم': 'Log how many verses you memorized and reviewed today',
  'آيات حفظ جديدة': 'New Memorized Verses',
  'آيات مراجعة': 'Reviewed Verses',
  'تم الحفظ': 'Saved',
  'تسجيل اليوم': 'Log Today',
  'تقرير التقدم': 'Progress Report',
  '٪ انتظام': '% Consistency',
  'آية حفظ هذا الأسبوع': 'Verses Memorized This Week',
  'أيام نشطة': 'Active Days',
  'آية مراجعة هذا الأسبوع': 'Verses Reviewed This Week',
  'إجمالي آيات مسجلة': 'Total Logged Verses',
  'مواقيت الصلاة': 'Prayer Times',
  'القادمة': 'Upcoming',
  'تعذر جلب مواقيت الصلاة': 'Failed to fetch prayer times',
  'الورد اليومي': 'Daily Wird',
  'تعديل': 'Edit',
  'لم تحدد ورداً يومياً بعد': 'You haven\'t set a daily wird yet',
  'إضافة ورد يومي': 'Add Daily Wird',
  'يتم إعادة تعيين الورد كل يوم تلقائياً': 'The wird resets automatically every day',
  'مساراتي التعليمية': 'My Learning Paths',
  'الكل': 'All',
  'لم تنضم إلى أي مسار بعد': 'You haven\'t joined any path yet',
  'تصفّح المسارات': 'Browse Paths',
  'النشاط الأخير': 'Recent Activity',
  'عرض الكل': 'View All',
  'لم تسجّل تلاوتك بعد': 'You haven\'t recorded your recitation yet',
  'ابدأ التسميع': 'Start Reciting'
};

const keyMapping = {
  'متقدم': 'levelAdvanced',
  'متوسط': 'levelIntermediate',
  'مبتدئ': 'levelBeginner',
  'جديد': 'levelNew',
  'لا توجد تلاوات بعد': 'noRecitationsYet',
  'قيد المراجعة': 'underReview',
  'متقن': 'statusMastered',
  'تحتاج جلسة': 'needsSession',
  'تم الحجز': 'booked',
  'مرحباً': 'welcome',
  'لوحة الطالب': 'studentDashboardTitle',
  'تابع تقدمك في تلاوة القرآن الكريم': 'trackProgressDesc',
  'تسميع جديد': 'newRecitationBtn',
  'إجمالي التسميعات': 'totalRecitations',
  'متقنة': 'masteredSurahs',
  'المستوى الحالي': 'currentLevel',
  'نقطة': 'point',
  'ترتيبك': 'yourRank',
  'يوم متتالي': 'consecutiveDays',
  'أعلى مستوى': 'highestLevel',
  'تقدمك': 'yourProgress',
  'آيات محفوظة': 'memorizedVerses',
  'أجزاء مكتملة': 'completedJuz',
  'أيام الانتظام': 'consistencyDays',
  'نسبة الإنجاز': 'completionRate',
  'إجمالي الحفظ': 'totalMemorization',
  'خريطة المصحف': 'mushafMap',
  'محفوظ': 'memorized',
  'متبقي': 'remaining',
  'مخطط التقدم': 'progressChart',
  'أسبوعي': 'weekly',
  'شهري': 'monthly',
  'لا توجد بيانات بعد': 'noDataYet',
  'حفظ جديد': 'newMemorization',
  'مراجعة': 'review',
  'سجل الحفظ اليومي': 'dailyMemLog',
  'سجّل كم آية حفظت وراجعت اليوم': 'logVersesDesc',
  'آيات حفظ جديدة': 'newMemVerses',
  'آيات مراجعة': 'reviewedVerses',
  'تم الحفظ': 'saved',
  'تسجيل اليوم': 'logToday',
  'تقرير التقدم': 'progressReport',
  '٪ انتظام': 'consistencyPercent',
  'آية حفظ هذا الأسبوع': 'versesMemThisWeek',
  'أيام نشطة': 'activeDays',
  'آية مراجعة هذا الأسبوع': 'versesRevThisWeek',
  'إجمالي آيات مسجلة': 'totalLoggedVerses',
  'مواقيت الصلاة': 'prayerTimes',
  'القادمة': 'upcoming',
  'تعذر جلب مواقيت الصلاة': 'failedPrayerTimes',
  'الورد اليومي': 'dailyWird',
  'تعديل': 'edit',
  'لم تحدد ورداً يومياً بعد': 'noDailyWirdSet',
  'إضافة ورد يومي': 'addDailyWird',
  'يتم إعادة تعيين الورد كل يوم تلقائياً': 'wirdResetsAutomatically',
  'مساراتي التعليمية': 'myLearningPaths',
  'الكل': 'all',
  'لم تنضم إلى أي مسار بعد': 'notJoinedPathYet',
  'تصفّح المسارات': 'browsePaths',
  'النشاط الأخير': 'recentActivity',
  'عرض الكل': 'viewAll',
  'لم تسجّل تلاوتك بعد': 'noRecitationRecorded',
  'ابدأ التسميع': 'startReciting'
};

function formatEntry(key, val) {
  return `    ${key}: '${val.replace(/'/g, "\\'")}',`;
}

console.log("English additions for studentDashboard:");
for (const ar of arabicStrings) {
  console.log(formatEntry(keyMapping[ar], englishTranslations[ar]));
}

console.log("\nArabic additions for studentDashboard:");
for (const ar of arabicStrings) {
  console.log(formatEntry(keyMapping[ar], ar));
}

let pageContent = fs.readFileSync('app/student/page.tsx', 'utf-8');

// Replace all instances of: t.student.key || t.addedTranslations_2026?.["ARABIC"] || "ARABIC"
// or t.addedTranslations_2026?.["ARABIC"] || "ARABIC"
// with t.studentDashboard.KEY

for (const ar of arabicStrings) {
  const safeAr = ar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const key = keyMapping[ar];
  
  // Regex 1: t.student.something || t.addedTranslations_2026?.["ARABIC"] || "ARABIC"
  const regex1 = new RegExp(`t\\.student\\.[a-zA-Z0-9_]+\\s*\\|\\|\\s*t\\.addedTranslations_2026\\?\\.\\["([^"]*?)"\\]\\s*\\|\\|\\s*"([^"]*?)"`, 'g');
  
  // Regex 2: t.addedTranslations_2026?.["ARABIC"] || "ARABIC"
  const regex2 = new RegExp(`t\\.addedTranslations_2026\\?\\.\\["([^"]*?)"\\]\\s*\\|\\|\\s*"([^"]*?)"`, 'g');

  pageContent = pageContent.replace(regex1, (match, p1, p2) => {
    if (p1 === ar) return `t.studentDashboard.${key}`;
    return match;
  });
  
  pageContent = pageContent.replace(regex2, (match, p1, p2) => {
    if (p1 === ar) return `t.studentDashboard.${key}`;
    return match;
  });
}

fs.writeFileSync('app/student/page.tsx', pageContent);
console.log("Finished replacing in app/student/page.tsx");
