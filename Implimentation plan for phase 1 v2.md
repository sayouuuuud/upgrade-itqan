# 🗺️ خطة التنفيذ الشاملة — منصة إتقان (Phase One → 100%)

> **الهدف:** إكمال 100% من متطلبات `phase_one.md`
> **المرجع:** مستند التخطيط v2.0 — تاريخ الخطة: 2026-04-14

---

## 📊 نسبة الإنجاز الحالية: ~62%

| الكيان | المطلوب | المنجز | النسبة |
|--------|---------|--------|--------|
| 🟢 المقرأة — Frontend كامل | 39 صفحة/مكون | 39 | **100%** |
| 🔵 الأكاديمية — طالب | 20 صفحة | 13 | **65%** |
| 🔵 الأكاديمية — أستاذ | 14 صفحة | 11 | **79%** |
| 🔵 الأكاديمية — أدمن | 17 صفحة | 12 | **71%** |
| 🔴 الأكاديمية — مشرفون | 5 صفحات | 0 | **0%** |
| 🔴 ولي الأمر | 7 صفحات | 0 | **0%** |
| 🔵 Backend — APIs | 30+ route | 28 | **88%** |
| 🔴 DB Migration | 3 حقول | 0 | **0%** |
| 🔴 Auth Flow — اختيار المنصة | 1 ميزة | 0 | **0%** |
| 🔴 Middleware — RBAC موسع | التحديث | 0 | **0%** |

> **ملاحظة حرجة:** الـ `mode-switcher.tsx` موجود لكنه يعمل بناءً على `userRole` فقط — وليس على `has_quran_access`/`has_academy_access`. إصلاح هذا هو الأولوية #1 لأن كل شيء يعتمد عليه.

---

## 🔵 المرحلة الأولى: البنية التحتية (Foundation)

**الهدف:** إصلاح العمود الفقري — DB + Auth + Middleware + Access Control
**المدة المقدرة:** يوم واحد

---

### 1.1 — DB Migration: إضافة حقول الوصول للمنصات

**الملف:** Supabase Migration

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS has_quran_access BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS has_academy_access BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS platform_preference TEXT DEFAULT 'quran';

UPDATE users SET has_quran_access = TRUE WHERE role IN ('student', 'reader');
UPDATE users SET has_quran_access = TRUE, has_academy_access = TRUE
  WHERE role IN ('admin', 'student_supervisor', 'reciter_supervisor');
```

**السيناريو:** طالب يسجل ويختار "الاثنين معاً":
```
has_quran_access = TRUE
has_academy_access = TRUE
platform_preference = 'both'
```

---

### 1.2 — تعديل صفحة التسجيل (`/register`)

**الملف:** `app/(auth)/register/page.tsx`

إضافة خطوة جديدة في الـ form بعد حقل الجنس:

```
┌─────────────────────────────────────┐
│  اختر منصتك                         │
│                                     │
│  ○ المقرأة فقط                      │
│    (تسميع وتقييم القرآن الكريم)      │
│                                     │
│  ○ الأكاديمية فقط                   │
│    (دورات ودروس إسلامية)             │
│                                     │
│  ● الاثنين معاً (افتراضي)            │
└─────────────────────────────────────┘
```

**API المعدّل:** `/api/auth/register`
- يستقبل: `platformChoice: 'quran' | 'academy' | 'both'`
- يحفظ: `has_quran_access`, `has_academy_access`, `platform_preference`
- التوجيه بعد `/verify`:
  - `quran` → `/student`
  - `academy` → `/academy/student`
  - `both` → `/student` (Mode Switcher يظهر)

---

### 1.3 — تحديث `mode-switcher.tsx`

**الملف:** `components/mode-switcher.tsx`

```typescript
// إضافة props جديدة
interface ModeSwitcherProps {
  currentMode: 'library' | 'academy'
  userRole: string
  hasQuranAccess: boolean    // جديد
  hasAcademyAccess: boolean  // جديد
  academyRole?: string | null
}

// المنطق الجديد
if (hasQuranAccess && validLibraryRoles.includes(userRole)) {
  modes.push(libraryMode)
}
if (hasAcademyAccess) {
  modes.push(academyMode)
}
```

---

### 1.4 — تحديث Middleware

**الملف:** `middleware.ts`

- إضافة حماية `/academy/parent/*` بدور `parent`
- إضافة حماية `/academy/supervisor/*` بدور `supervisor`
- التحقق من `has_academy_access` قبل السماح بـ `/academy/*`

---

### 1.5 — API: تحكم الأدمن في وصول المستخدمين

**ملف جديد:** `app/api/admin/user-access/route.ts`

```
PATCH /api/admin/user-access
Body: { userId, has_quran_access, has_academy_access, platform_preference }
```

---

## 🟢 المرحلة الثانية: الصفحات المشتركة + ولي الأمر

**الهدف:** إضافة الصفحات الأساسية لكل الأدوار + كيان ولي الأمر بالكامل
**المدة المقدرة:** يومان

---

### 2.1 — إشعارات الأكاديمية (طالب + أستاذ)

**الصفحات الجديدة:**
- `app/academy/student/notifications/page.tsx`
- `app/academy/teacher/notifications/page.tsx`

**السيناريو:**
```
الطالب يفتح /academy/student/notifications
→ يشوف: قبول/رفض انضمام، مهام جديدة، تقييمات، جلسات قادمة
→ كل إشعار قابل للتمييز كـ "مقروء"
→ فلتر: كل / غير مقروءة
```

Component مشترك `<AcademyNotificationsPage role="student"|"teacher">` يُعاد استخدامه.

---

### 2.2 — الملف الشخصي للأكاديمية (طالب + أستاذ)

**الصفحات الجديدة:**
- `app/academy/student/profile/page.tsx`
- `app/academy/teacher/profile/page.tsx`

**ملف الطالب:**
```
- الاسم، الصورة، الإيميل
- إحصائيات: دورات مكتملة، نقاط، شارات
- تغيير كلمة المرور
- إعداد: المنصة المفضلة (مقرأة/أكاديمية/كلاهما)
```

**ملف الأستاذ:**
```
- الاسم، الصورة، التخصص (قرآن/سيرة/فقه/عقيدة)
- المؤهلات
- الدورات الحالية
- تغيير كلمة المرور
```

---

### 2.3 — شهادات طالب الأكاديمية

**الصفحة الجديدة:** `app/academy/student/certificates/page.tsx`

**السيناريو:**
```
الطالب يكمل دورة (100% progress)
       ↓
الأستاذ أو الأدمن يُصدر شهادة
       ↓
الطالب يفتح /academy/student/certificates
→ قائمة الشهادات: اسم الدورة + التاريخ + اسم الأستاذ
→ زر "تحميل PDF" + زر "مشاركة"
```

**API جديد:** `GET /api/academy/student/certificates`

---

### 2.4 — التقويم للطالب

**الصفحة الجديدة:** `app/academy/student/calendar/page.tsx`

**السيناريو:**
```
الطالب يفتح التقويم
→ يشوف شهر كامل مع events ملونة:
  🔵 جلسة حية
  🔴 deadline مهمة
  🟢 موعد مراجعة
→ يضغط على يوم → تفاصيل الـ events
→ زر "انضمام للجلسة" إذا كانت اليوم
```

---

### 2.5 — كيان ولي الأمر كاملاً (7 صفحات جديدة)

**Layout جديد:** `app/academy/parent/layout.tsx`

#### لوحة التحكم — `/academy/parent/page.tsx`
```
- ملخص كل ابن مربوط:
  → عدد الدورات، آخر نشاط، المهام المتأخرة، المستوى
- تنبيهات:
  → ابن له مهمة متأخرة
  → ابن غاب عن جلسة
- إحصائيات إجمالية لكل الأبناء
```

#### قائمة الأبناء — `/academy/parent/children/page.tsx`
```
- قائمة الأبناء المربوطين
- لكل ابن: الصورة + الاسم + الدورات النشطة + نسبة التقدم
- زر "عرض تفاصيل" / زر "إزالة الربط" (مع تأكيد)
```

#### ربط ابن جديد — `/academy/parent/link-child/page.tsx`
```
السيناريو الكامل:
ولي الأمر يدخل إيميل الابن
       ↓
النظام يبحث → يعرض الاسم
       ↓
ولي الأمر يختار العلاقة: أب / أم / ولي
       ↓
يُرسَل طلب ربط → الطالب يؤكد
       ↓
✅ الربط يتم → يظهر الابن في القائمة
```

#### التقارير — `/academy/parent/reports/page.tsx`
```
- dropdown: اختيار الابن
- الفترة الزمنية: أسبوع / شهر / ترم
- تقرير: الحضور، المهام المُسلَّمة، الدرجات، تعليقات الأستاذ
- زر "تصدير PDF"
```

#### التقدم — `/academy/parent/progress/page.tsx`
```
- رسوم بيانية: نسبة إكمال كل دورة لكل ابن
- مقارنة بين الأبناء
- Timeline للنشاط الأسبوعي
```

#### الإشعارات — `/academy/parent/notifications/page.tsx`
```
- "أكمل [الابن] الدرس الثاني في دورة الفقه"
- "لدى [الابن] مهمة تستحق التسليم غداً"
- "تم قبول [الابن] في دورة جديدة"
```

#### الملف الشخصي — `/academy/parent/profile/page.tsx`
```
- بيانات ولي الأمر الأساسية
- قائمة الأبناء مع إمكانية الإزالة
```

**APIs جديدة:**
```
GET  /api/academy/parent/children
POST /api/academy/parent/link-child
GET  /api/academy/parent/children/[id]/progress
GET  /api/academy/parent/children/[id]/reports
```

---

## 🟣 المرحلة الثالثة: الشات + الميزات التفاعلية

**الهدف:** التواصل المباشر + ميزات الأستاذ المتبقية
**المدة المقدرة:** يومان

---

### 3.1 — شات الأكاديمية (طالب ↔ أستاذ)

**الصفحات الجديدة:**
- `app/academy/student/chat/page.tsx`
- `app/academy/teacher/chat/page.tsx`

**السيناريو الكامل:**
```
الطالب يفتح /academy/student/chat
→ قائمة المحادثات (محادثة مع كل أستاذ لديه دورة معه)
→ يختار محادثة → تظهر الرسائل
→ يكتب رسالة → يضغط إرسال
→ الأستاذ يستقبل إشعار فوري

الأستاذ يفتح /academy/teacher/chat
→ محادثاته مع طلابه (مرتبة حسب آخر رسالة)
→ بحث عن طالب بالاسم
```

**Architecture:**
- جداول منفصلة: `academy_conversations` + `academy_messages`
- Component مشترك: `<AcademyChatPage role="student"|"teacher">`

**APIs جديدة:**
```
GET  /api/academy/conversations
POST /api/academy/conversations
GET  /api/academy/conversations/[id]/messages
POST /api/academy/conversations/[id]/messages
```

---

### 3.2 — المنتدى — طالب الأكاديمية

**الصفحة الجديدة:** `app/academy/student/forum/page.tsx`

**السيناريو:**
```
الطالب يفتح المنتدى
→ الفئات: عقيدة / فقه / سيرة / قرآن / عام
→ يختار فئة → الموضوعات بالترتيب
→ يفتح موضوع → يقرأ → يكتب رد
→ زر "موضوع جديد": العنوان + المحتوى + الفئة
```

*(المنتدى موجود في أدمن الأكاديمية — هنا نصنع واجهة الطالب)*

---

### 3.3 — الأسئلة الفقهية — طالب الأكاديمية

**الصفحة الجديدة:** `app/academy/student/fiqh/page.tsx`

**السيناريو:**
```
الطالب يفتح /academy/student/fiqh
→ الأسئلة المجابة (قابلة للبحث + ترتيب حسب الأحدث/الأكثر تصويتاً)
→ زر "طرح سؤال": السؤال + التصنيف
→ يذهب لمسؤول الفقه للمراجعة
→ عند الإجابة → إشعار للطالب
```

---

### 3.4 — أكواد الدعوة للأستاذ

**الصفحة الجديدة:** `app/academy/teacher/invitations/page.tsx`

**السيناريو:**
```
الأستاذ يفتح /academy/teacher/invitations
→ يشوف أكواده + عدد من استخدمها
→ "إنشاء كود جديد":
  - يختار الدورة/الفصل
  - تاريخ الانتهاء (اختياري)
  - الحد الأقصى للاستخدام (اختياري)
  ↓
→ يتولد كود مثل: ITQ-FIQH-2026-A1
→ نسخ + مشاركة الرابط

عند استخدام الكود:
الطالب يفتح /academy/invite/[code] (موجود!)
→ يُضاف مباشرة للدورة
```

**API جديد:** `POST /api/academy/teacher/invitations`

---

### 3.5 — إنشاء حسابات طلاب من الأستاذ

**الصفحة الجديدة:** `app/academy/teacher/create-students/page.tsx`

**السيناريو:**
```
الأستاذ يفتح الصفحة → خيارات:
  ① يدوي: اسم + إيميل + دورة → إنشاء حساب فوري
  ② CSV: رفع ملف إكسل → preview → batch create
→ المستخدمون الجدد يوصلهم إيميل بكلمة مرور مؤقتة
```

---

### 3.6 — إدارة دروس الدورة — أستاذ

**الصفحة الجديدة:** `app/academy/teacher/courses/[id]/lessons/page.tsx`

**السيناريو:**
```
الأستاذ يفتح دورة → "إدارة الدروس"
→ قائمة الدروس بالترتيب (Drag & Drop)
→ "إضافة درس":
  - عنوان + وصف
  - نوع: فيديو / صوت / نص
  - رفع الملف (UploadThing موجود)
  - رفع PDF (مرفقات)
  - الرؤية: عام / خاص / معاينة مجانية
→ تعديل / حذف أي درس
```

**APIs جديدة:**
```
PATCH  /api/academy/teacher/courses/[id]/lessons/[lessonId]
DELETE /api/academy/teacher/courses/[id]/lessons/[lessonId]
```

---

## 🟠 المرحلة الرابعة: المشرفون + أدمن الأكاديمية المتبقي

**الهدف:** طبقة الإشراف الكاملة + إكمال لوحة الأدمن
**المدة المقدرة:** يومان

---

### 4.1 — كيان المشرفين — Layout جديد

**ملف جديد:** `app/academy/supervisor/layout.tsx`

يستخدم `academy-dashboard-shell` بدور supervisor مع قائمة خاصة.

---

### 4.2 — مشرف المحتوى (`/academy/supervisor/content`)

**الصفحات:**
- `app/academy/supervisor/content/page.tsx`
- `app/academy/supervisor/content/[id]/page.tsx`

**السيناريو:**
```
المشرف يفتح لوحته
→ قائمة الدروس المنتظرة: "بانتظار المراجعة" / "مقبول" / "مرفوض"
→ يفتح درس → يشاهد/يستمع
→ "قبول" → ينشر الدرس → إشعار للأستاذ
→ "رفض" → يكتب السبب → إشعار للأستاذ

[القاعدة: الدرس لا ينشر حتى يوافق المشرف]
```

---

### 4.3 — مشرف المحتوى — إشراف المنتدى

**الصفحة:** `app/academy/supervisor/forum/page.tsx`

**السيناريو:**
```
المشرف يفتح المنتدى
→ كل الموضوعات والردود
→ إخفاء/حذف ردود مخالفة
→ إغلاق موضوع
→ إرسال تحذير لصاحب التعليق
→ سجل المخالفات لكل مستخدم
```

---

### 4.4 — مسؤول الفقه (`/academy/supervisor/fiqh`)

**الصفحات:**
- `app/academy/supervisor/fiqh/page.tsx`
- `app/academy/supervisor/fiqh/[id]/page.tsx`

**السيناريو:**
```
مسؤول الفقه يفتح لوحته
→ قائمة الأسئلة: جديد / قيد المراجعة / مُجاب / مرفوض

يفتح سؤال:
→ يقرأ السؤال + بيانات الطالب + التصنيف
→ يكتب الإجابة (rich text editor)
→ يضيف المراجع (اختياري)
→ "نشر الإجابة" → تظهر للطالب + تُضاف للـ FAQ
→ "رفض" → رسالة للطالب: "سؤالك خارج نطاق المنصة"
```

---

### 4.5 — مراقب الجودة (`/academy/supervisor/quality`)

**الصفحة:** `app/academy/supervisor/quality/page.tsx`

**السيناريو (قراءة فقط):**
```
المراقب يفتح لوحته
→ إحصائيات جودة التقييمات:
  - متوسط درجات كل أستاذ
  - وقت التقييم المتوسط
  - شكاوى الطلاب
→ تفاصيل أي تقييم (بدون تعديل)
→ كتابة تقرير وإرساله للأدمن
```

---

### 4.6 — أدمن الأكاديمية: التحكم في الوصول

**الصفحة:** `app/academy/admin/access-control/page.tsx`

**السيناريو:**
```
الأدمن يفتح /academy/admin/access-control
→ قائمة المستخدمين
→ فلتر: المنصة / الدور / الحالة

يختار مستخدم:
  وصول المقرأة:   [On] [Off]
  وصول الأكاديمية: [On] [Off]
  المنصة المفضلة: [dropdown]
  [حفظ]

→ التغيير يُطبق فوراً
→ سجل: من غيّر ومتى
```

---

### 4.7 — أدمن الأكاديمية: التقارير الشاملة

**الصفحة:** `app/academy/admin/reports/page.tsx`

```
تقارير:
① الإلتحاقات: عدد الطلاب لكل دورة/شهر
② الإكمال: نسبة إكمال كل دورة
③ الأساتذة: طلاب / تقييمات / وقت الاستجابة
④ المهام: التسليم / المتأخرة / الدرجات
⑤ Export: CSV أو PDF
```

---

### 4.8 — أدمن الأكاديمية: التحليلات

**الصفحة:** `app/academy/admin/analytics/page.tsx`

```
رسوم بيانية تفاعلية:
- منحنى نمو المستخدمين
- توزيع الطلاب على الدورات
- معدل النشاط اليومي
- أكثر الدروس مشاهدةً
- أكثر الأسئلة الفقهية تفاعلاً
```

---

### 4.9 — أدمن الأكاديمية: الإعدادات

**الصفحة:** `app/academy/admin/settings/page.tsx`

```
- اسم الأكاديمية وشعارها
- التسجيل: مفتوح / بدعوة / مغلق
- الدورات: يتطلب موافقة الأدمن؟
- المنتدى: مفتوح / مراقَب
- الأسئلة الفقهية: من يرد؟
```

---

### 4.10 — الصفحات المتبقية للأدمن

```
app/academy/admin/announcements/page.tsx  (shell → نكتمل)
app/academy/admin/badges/page.tsx          (shell → نكتمل)
app/academy/admin/halaqat/page.tsx         (جديد كلياً)
```

**سيناريو الحلقات:**
```
الأدمن يدير الحلقات:
→ إنشاء حلقة: اسم + الجنس + الأستاذ + التوقيت
→ إضافة طلاب للحلقة
→ تتبع الحضور
→ رابط الاجتماع (Zoom/Google Meet)
```

---

## 🎨 المرحلة الخامسة: التصميم والهوية + اختبار شامل

> ⚠️ آخر أولوية حسب طلب المستخدم الصريح في `phase_one.md`

**الهدف:** توحيد التصميم + Responsive + Polish
**المدة المقدرة:** يومان

---

### 5.1 — توحيد نظام الألوان

**الملف:** `app/globals.css`

```css
/* المقرأة */
--quran-primary: #0B3D2E;
--quran-accent: #D4A843;
--quran-surface: #F0F7F4;

/* الأكاديمية */
--academy-primary: #1E3A5F;
--academy-accent: #4F8EF7;
--academy-surface: #F0F5FF;
```

---

### 5.2 — فصل الجنسين — UI Level

**التطبيق في:**
- جداول المقرئين/الأساتذة: فلترة تلقائية بالجنس
- الحلقات: تظهر المناسبة للجنس فقط
- المنتديات: فئات (ذكور / إناث / مختلط)

```typescript
const filteredTeachers = teachers.filter(t =>
  t.gender === student.gender || t.teachesAllGenders
)
```

---

### 5.3 — Dark Mode الكامل

مراجعة جميع صفحات الأكاديمية الجديدة وتوحيد CSS variables.

---

### 5.4 — Responsive Design

الصفحات الحرجة على الموبايل:
- صفحة الدرس (فيديو)
- شات الأكاديمية
- التقويم (يتحول لـ list view)
- تسليم المهمة (رفع ملف)

---

### 5.5 — Micro-Animations

```
- Mode Switcher: fade + slide عند التبديل
- Course progress bar: animated fill
- Notification badge: pulse للجديدة
- Enrollment: step-by-step indicator
- Leaderboard: rank change animation
```

---

### 5.6 — اختبار السيناريوهات الكاملة

**سيناريو 1: طالب مزدوج (End-to-End)**
```
① تسجيل → يختار "الاثنين"
② تحقق إيميل → /student
③ Mode Switcher → /academy/student
④ تصفح دورات → طلب انضمام
⑤ الأستاذ يقبل → إشعار للطالب
⑥ يدخل الدرس → يشاهد → يسلم مهمة
⑦ الأستاذ يقيّم → إشعار
⑧ يكمل الدورة → شهادة
⑨ الأدمن يرى التقارير
```

**سيناريو 2: ولي أمر**
```
① يسجل → يختار "أكاديمية"
② يربط ابنه
③ يشوف dashboard أداء الأبناء
④ يفتح التقرير → الدرجات
⑤ إشعار "ابنك له مهمة غداً"
```

**سيناريو 3: دورة حياة درس جديد**
```
① الأستاذ يرفع درس
② المشرف يوصله إشعار المراجعة
③ المشرف يقبل → الدرس ينشر
④ الطلاب يشاهدون
⑤ المراقب يرى إحصائيات الجودة
```

---

## 📋 ملخص المراحل الخمس

| المرحلة | المهام | صفحات جديدة | APIs جديدة |
|---------|--------|------------|-----------|
| 1 — Foundation | 5 | 0 | 2 |
| 2 — Parent + Shared | 7 | 12 | 4+ |
| 3 — Chat + Features | 6 | 8 | 6 |
| 4 — Supervisors + Admin | 10 | 14 | 3 |
| 5 — Design + Testing | 6 | 0 | 0 |
| **المجموع** | **34** | **34** | **15+** |

## 🎯 النتيجة: 62% → 100%

| القسم | الحالي | الهدف |
|-------|--------|-------|
| طالب أكاديمية | 13/20 (65%) | 20/20 (**100%**) |
| أستاذ أكاديمية | 11/14 (79%) | 14/14 (**100%**) |
| أدمن أكاديمية | 12/17 (71%) | 17/17 (**100%**) |
| مشرفون | 0/5 (0%) | 5/5 (**100%**) |
| ولي الأمر | 0/7 (0%) | 7/7 (**100%**) |
| DB + Auth | 0/4 (0%) | 4/4 (**100%**) |
| التصميم | ~50% | ~100% |
