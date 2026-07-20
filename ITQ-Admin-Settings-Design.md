# تصميم صفحة Admin Settings — الأكاديمية

## نظرة عامة
صفحة إعدادات متكاملة لأدمن الأكاديمية باستخدام نظام **Tabs متعدد الأقسام**، تتيح التحكم الكامل في سلوك المنصة والإخطارات والأمان والمحتوى.

---

## 1. الإعدادات العامة (General)

### الحقول
- **اسم الأكاديمية** (text input) — يظهر في العنوان والإيميلات
- **شعار الأكاديمية** (file upload via Vercel Blob) — صورة PNG/JPG
- **Favicon** (file upload) — صورة 32x32
- **رابط الموقع (App URL)** (text input) — الموجود حالياً
- **وصف الأكاديمية** (textarea) — للـ SEO meta description
- **البريد الرسمي للتواصل** (email input) — يظهر في صفحة اتصل بنا
- **رقم الواتساب** (text input) — اختياري
- **المنطقة الزمنية (Timezone)** (select dropdown) — مهم للجلسات والـ cron jobs
- **اللغة الافتراضية** (select: عربي / إنجليزي)
- **اتجاه الواجهة** (select: RTL / LTR) — يتغير ديناميكياً

### العرض
- كروت منفصلة لكل مجموعة منطقياً (identity، contact، localization)
- عند تحميل الصفحة: صورة الشعار والـ favicon تظهر معاينة

---

## 2. التسجيل والقبول (Registration & Onboarding)

### الحقول
- **تفعيل/تعطيل التسجيل الذاتي للطلاب** (toggle switch)
- **تفعيل/تعطيل تسجيل الأساتذة** (toggle switch)
- **هل يحتاج الطالب موافقة أدمن قبل الدخول؟** (toggle) — لو OFF يدخل مباشرة
- **هل يحتاج الأستاذ موافقة قبل نشر الدروس؟** (toggle)
- **الحقول الإلزامية في التسجيل** (checkboxes):
  - تاريخ ميلاد
  - جنس
  - دولة
  - مستوى تعليمي
- **تفعيل التحقق من الإيميل** (toggle)
- **الرسالة الترحيبية بعد التسجيل** (rich text editor) — يستقبلها الطالب الجديد
- **Default course/path للطالب الجديد** (select من قائمة الدورات والمسارات)

### العرض
- كروت مع توضيح ماذا يحدث عند تفعيل كل toggle
- Rich text editor بـ bold, italic, links، مع معاينة حية

---

## 3. الدورات والمحتوى (Courses & Content)

### الحقول
- **هل تحتاج الدورات موافقة مشرف محتوى قبل النشر؟** (toggle)
- **الحد الأقصى لحجم الفيديو** (number input بـ MB) — مثلاً 500
- **الحد الأقصى لحجم المرفقات** (number input بـ MB) — مثلاً 50
- **صيغ الملفات المسموح بها** (textarea أو tag input):
  - mp4, webm, mov
  - pdf, docx, doc, pptx
  - mp3, wav, aac
- **خدمة تخزين الفيديو** (radio buttons):
  - Cloudinary
  - Amazon S3
  - UploadThing
- **جودة الفيديو الافتراضية** (select: 480p, 720p, 1080p)
- **تفعيل التحميل (Download) للدروس** (toggle)
- **علامة مائية على الفيديوهات** (toggle + text input):
  - اسم/شعار يظهر على الفيديو
  - اختيار الموضع (أسفل يمين، أسفل يسار، وسط، إلخ)

### العرض
- جدول بخدمات التخزين + حالة الاتصال (✓ متصل / ✗ غير متصل)
- عينة من الملفات المسموح بها مع icons

---

## 4. الجلسات الحية (Live Sessions)

### الحقول
- **مزود الفيديو الافتراضي** (radio buttons):
  - LiveKit
  - Zoom
  - Google Meet
- **مدة الجلسة الافتراضية** (number input بالدقائق) — مثلاً 60
- **وقت بداية التذكير الأول** (number input بالدقائق) — مثلاً 60
- **وقت التذكير الثاني** (number input بالدقائق) — مثلاً 10
- **تفعيل التسجيل التلقائي للجلسات** (toggle)
- **تفعيل دخول الطلاب بدون موافقة الأستاذ** (toggle)
- **مدة صلاحية رابط الجلسة بعد الانتهاء** (number input بالساعات) — 0 = ينتهي فوراً

### العرض
- Time pickers + visual timeline لتوقيتات التذكيرات
- حالة الاتصال بخدمة الفيديو (LiveKit/Zoom/etc.)

---

## 5. النقاط والمستويات (Gamification)

### جدول النقاط (قابل للتعديل)
| الحدث | النقاط الحالية | جديد |
|------|---|---|
| تسجيل تلاوة | 10 | [text input] |
| تلاوة مقبولة بمتقن | 30 | [text input] |
| إنهاء مهمة | 15 | [text input] |
| حضور درس | 20 | [text input] |
| يوم Streak جديد | 5 | [text input] |
| إنهاء جزء كامل | 100 | [text input] |
| مضاعف Streak ≥7 أيام | ×1.5 | [text input] |

### حدود المستويات (قابلة للتعديل)
| المستوى | النقاط الحالية | جديد |
|--------|---|---|
| مبتدئ | 0–500 | [من–إلى] |
| متوسط | 500–2000 | [من–إلى] |
| متقدم | 2000–5000 | [من–إلى] |
| حافظ | 5000+ | [من] |

### التبديلات (toggles)
- **تفعيل نظام النقاط** (toggle)
- **تفعيل الشارات** (toggle)
- **تفعيل الـ Leaderboard** (toggle)
- **تفعيل الـ Streak** (toggle)

### العرض
- جداول بـ inline editing (عند النقر على حقل، يصير قابل للتعديل)
- زر "استعادة القيم الافتراضية" لكل جدول
- معاينة حية: مثلاً "إذا طالب سجّل تلاوة اليوم: +10 نقاط"

---

## 6. الإشعارات والبريد (Notifications & Email)

### إعدادات عامة
- **تفعيل/تعطيل الإشعارات داخل المنصة** (toggle)
- **تفعيل/تعطيل البريد الإلكتروني** (toggle)

### إعدادات SMTP (كرت منفصل)
- **SMTP Host** (text input) — مثلاً smtp.gmail.com
- **SMTP Port** (number input) — مثلاً 587
- **SMTP User** (email input)
- **SMTP Password** (password input)
- **من الاسم** (text input) — اسم المرسل
- **من الإيميل** (email input) — بريد المرسل
- **زر "اختبار الاتصال"** — يرسل إيميل تجريبي للبريد المسجل

### الأحداث التي تخرج لها إيميلات (checkboxes)
- قبول/رفض دورة
- مهمة جديدة
- تذكير جلسة قبل ساعة
- تذكير جلسة قبل 10 دقائق
- شارة جديدة
- ترقية مستوى
- تذكير Streak قرب نهاية اليوم
- تقرير ولي الأمر الأسبوعي
- تذكير الورد اليومي

### التوقيتات
- **توقيت تقارير ولي الأمر الأسبوعية**:
  - يوم (select: الأحد–السبت)
  - ساعة (time picker بـ 24 ساعة)
- **توقيت تذكيرات الورد اليومية**:
  - ساعة (time picker)

### العرض
- كروت منفصلة: SMTP settings، أحداث الإيميل، التوقيتات
- حالة اتصال SMTP: أخضر ✓ متصل / أحمر ✗ خطأ
- رسالة نجاح بعد الضغط على "اختبار الاتصال"

---

## 7. المنتدى والفقه (Forum & Fiqh)

### إعدادات المنتدى
- **تفعيل/تعطيل المنتدى** (toggle)
- **هل تحتاج الموضوعات موافقة قبل النشر؟** (toggle)
- **الحد الأدنى للنقاط لإنشاء موضوع** (number input) — مثلاً 50 نقطة
- **قائمة كلمات ممنوعة** (textarea أو tag input) — auto-moderation
  - كلمة واحدة في كل سطر أو مفصولة بفواصل

### إعدادات الفقه
- **تفعيل/تعطيل صفحة الفقه** (toggle)
- **مدة الرد المتوقعة على سؤال الفقه** (number input بالأيام) — مثلاً 3
- **مشرف الفقه الافتراضي** (select من قائمة المشرفين):
  - للأسئلة بدون تصنيف
  - لو القيمة empty، الأسئلة تبقى معلقة لحد ما يختار الأدمن واحد

### العرض
- toggle مع وصف واضح تحت كل واحد
- tag input للكلمات الممنوعة مع حذف سريع
- alert أصفر: "الأسئلة الفقهية بدون مشرف معين لن تُرد بشكل سريع"

---

## 8. الأمان والخصوصية (Security & Privacy)

### جلسات وتسجيل الدخول
- **مدة صلاحية الجلسة** (number input بالدقائق) — مثلاً 30 دقيقة
- **حد محاولات تسجيل الدخول الفاشلة** (number input) — مثلاً 5
- **مدة الـ Lock بعد المحاولات الفاشلة** (number input بالدقائق) — مثلاً 15

### المصادقة المتعددة (2FA)
- **تفعيل 2FA للأدمن** (toggle)
- **طريقة التحقق**:
  - Email OTP
  - Authenticator App (Google Authenticator)
  - SMS (اختياري)

### IP Whitelist
- **السماح فقط بـ IPs معينة للوحة الأدمن** (toggle)
- **قائمة IPs** (textarea):
  - IP واحد في كل سطر
  - دعم CIDR notation (مثلاً 192.168.1.0/24)

### حد رفع الملفات
- **حد رفع الملفات لكل مستخدم يومياً** (number input بـ GB) — مثلاً 1 GB

### Rate Limiting
- **حد طلبات الـ API لكل ساعة** (number input) — مثلاً 1000 طلب

### سياسة كلمة السر
- **طول كلمة السر الأدنى** (number input) — مثلاً 8 أحرف
- **يجب أن تحتوي على أحرف كبيرة** (toggle)
- **يجب أن تحتوي على أحرف صغيرة** (toggle)
- **يجب أن تحتوي على أرقام** (toggle)
- **يجب أن تحتوي على رموز خاصة** (toggle)

### السجلات
- **تفعيل/تعطيل تسجيل الـ Activity Logs** (toggle)
- **احتفظ بالسجلات لمدة** (number input بالأيام) — ثم حذفها تلقائياً

### العرض
- كروت منفصلة لكل قسم أمني
- مؤشر قوة كلمة السر (Weak، Medium، Strong) يتحدث حسب الشروط المفعلة
- warning alert لو 2FA معطل

---

## 9. الصيانة (Maintenance)

### الإعدادات
- **تفعيل Maintenance Mode** (toggle) — تحجب المنصة عن المستخدمين العاديين
- **رسالة الصيانة** (textarea أو rich text) — تظهر للمستخدمين
- **استثناء IPs أثناء الصيانة** (textarea):
  - IP واحد في كل سطر
  - الأدمن دائماً لديه وصول

### الأزرار الفعلية
- **زر مسح الـ Cache** — Confirmation modal قبل الحذف
- **زر Re-index محرك البحث** — يستغرق وقتاً، showProgress
- **زر Backup فوري** — Confirmation + تحميل ملف JSON بسرعة

### العرض
- Maintenance Mode: switch كبير + رسالة تحت مباشرة
- أزرار خطرة بألوان حمراء مع confirmation
- Progress bar عند تشغيل عملية

---

## 10. عناصر UX عامة

### Header ثابت (Sticky)
```
┌─────────────────────────────────────────────┐
│ الإعدادات > [Tab الحالي]   [حفظ] [إلغاء] │
│ (Unsaved Changes: 3)                        │
└─────────────────────────────────────────────┘
```

### بحث في الإعدادات
- Search bar في الـ Sidebar يفلتر الـ Tabs والحقول
- مثلاً كتب "SMTP" يظهر فقط قسم الإشعارات والبريد

### Audit Log صغير
في كل كرت:
```
آخر تعديل بواسطة: أحمد الشاعر
التاريخ: 2026-05-27 14:30
```

### زر Reset to Defaults
في كل كرت أو قسم:
```
[Reset to Defaults] — Confirmation modal
```

### Validation فوري
- رسائل خطأ حمراء جنب الحقول لو فيه مشكلة (مثل email غير صحيح)
- رسائل نجاح خضراء بعد الحفظ
- Toast notifications في الأعلى

### Mobile Responsive
- Desktop: Tabs عمودية على اليسار + محتوى على اليمين
- Tablet/Mobile: Tabs تتحول لـ Accordion
- الأزرار والمدخلات كبيرة بما يكفي للموبايل

### Skeleton Loaders
بدل الـ Spinner، عند تحميل الإعدادات:
- Skeleton rectangles لكل حقل + placeholder text
- Animation smooth

### Shortcuts لوحة المفاتيح
- Ctrl/Cmd + S = حفظ
- Escape = إلغاء

---

## البنية التقنية

### قاعدة البيانات
جدول `academy_system_settings`:
```sql
id | key | value | type | last_modified_by | last_modified_at | description
```

مثال:
```
1 | academy_name | "متقن الأكاديمية" | string | admin_1 | 2026-05-27 14:30 | اسم الأكاديمية
2 | points_recitation | 10 | number | admin_1 | 2026-05-27 14:30 | نقاط تسجيل تلاوة
```

### API
- **GET `/api/academy/admin/settings`** — جلب كل الإعدادات أو مجموعة معينة
- **PUT `/api/academy/admin/settings`** — حفظ مجموعة إعدادات (batch update)
- **POST `/api/academy/admin/settings/test-email`** — اختبار SMTP
- **POST `/api/academy/admin/settings/cache-clear`** — مسح الـ Cache
- **POST `/api/academy/admin/settings/reindex`** — Re-index البحث
- **POST `/api/academy/admin/settings/backup`** — تصدير backup

### الـ Components
```
app/academy/admin/settings/
├── page.tsx (main page with layout)
├── _components/
│   ├── settings-tabs.tsx (tab container)
│   ├── general-settings.tsx
│   ├── registration-settings.tsx
│   ├── courses-content-settings.tsx
│   ├── live-sessions-settings.tsx
│   ├── gamification-settings.tsx
│   ├── notifications-email-settings.tsx
│   ├── forum-fiqh-settings.tsx
│   ├── security-privacy-settings.tsx
│   ├── maintenance-settings.tsx
│   ├── settings-header.tsx (sticky header)
│   └── settings-sidebar.tsx (search + tabs)
└── hooks/
    └── use-settings.ts (SWR hook لجلب/حفظ الإعدادات)
```

### Validation (Zod)
schemas لكل قسم:
```ts
const GeneralSettingsSchema = z.object({
  academy_name: z.string().min(1),
  timezone: z.enum([...timezones]),
  // ...
});
```

### State Management
- SWR للـ caching والـ revalidation
- Optimistic updates مع rollback إذا فشل الحفظ
- Unsaved changes tracking

---

## Flow الاستخدام

1. أدمن يفتح الصفحة
2. Skeleton loaders تظهر بينما تحمل البيانات
3. الـ Tabs تظهر مع البيانات الحالية
4. أدمن يعدل على حقول معينة
5. Unsaved indicator يظهر فوق
6. يضغط "حفظ"
7. Confirmation لو كانت إعدادات حساسة (Maintenance, SMTP)
8. API PUT يبعث البيانات
9. Optimistic update فوري + toast "تم الحفظ بنجاح"
10. آخر تعديل يتحدث في الـ Audit Log

---

## مرجع الألوان (Academy)
- **Primary**: `#1E3A5F` (الأزرق)
- **Secondary**: مشتقات الأزرق (أفتح/أغمق)
- **Danger/Delete**: أحمر (`#EF4444`)
- **Success**: أخضر (`#22C55E`)
- **Warning**: أصفر (`#FBBF24`)
- **Background**: أبيض/رمادي فاتح

---

## ملخص الأقسام
| القسم | عدد الحقول | الأولوية |
|-------|----------|--------|
| General | 10 | عالية |
| Registration | 9 | عالية |
| Courses & Content | 8 | عالية |
| Live Sessions | 7 | متوسطة |
| Gamification | 11 | متوسطة |
| Notifications & Email | 14 | عالية |
| Forum & Fiqh | 6 | متوسطة |
| Security & Privacy | 13 | عالية |
| Maintenance | 3 | منخفضة |

**الإجمالي: ~81 حقل/setting**
