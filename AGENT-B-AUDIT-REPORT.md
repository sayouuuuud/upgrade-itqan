# تقرير فحص تنفيذ مهام Agent B

تاريخ الفحص: 2026-05-01
الفرع: `notifications-and-emails`
المرجع: `agent-B-instructions-tMYlm.md`

---

## ملخص تنفيذي

| الحالة | عدد المهام |
|---|---|
| مُنفّذ بالكامل | 1 من 7 |
| مُنفّذ جزئياً (الكود فقط ناقص DB أو ناقص جزء) | 5 من 7 |
| ناقص بشكل كبير | 1 من 7 |
| سيفشل runtime بسبب schema | 3 من 7 |

النتيجة العامة: **الكود الـ Node-side مكتوب بشكل جيد لكن الـ Database schema لم تُحدّث، مما يجعل 3 ميزات أساسية (B-5, B-6, B-7) غير قابلة للتشغيل فعلياً.**

---

## 1. المهام المُنفّذة بشكل صحيح

### B-2 — توجيه «عرض جميع الإشعارات» للأكاديمية ✅

**الملفات المتأثرة:**
- `components/academy-dashboard-shell.tsx`
- `components/notification-dropdown.tsx`

**الحالة:** مكتمل.

**التحقق:**
- `academy-dashboard-shell.tsx` يمرّر `role` بصيغة المسار الكامل لكل دور:
  - `academy/student`
  - `academy/teacher`
  - `academy/parent`
  - `academy/supervisor`
- `notification-dropdown.tsx` يستخدم `/${role}/notifications` في زر «عرض جميع الإشعارات» → يوجّه صحيحاً إلى:
  - `/academy/student/notifications`
  - `/academy/teacher/notifications`
  - `/academy/parent/notifications`
  - `/academy/supervisor/notifications`

---

## 2. المهام المُنفّذة جزئياً

### B-3 — إيميلات قبول/رفض القارئ والمدرس ⚠️

#### قسم القارئ (Reader)
**ما تم:**
- `app/api/admin/reader-applications/route.ts` يستدعي `sendReaderApprovedEmail` و `sendReaderRejectedEmail`
- `DELETE` handler موجود لإلغاء التطبيق

**المشاكل:**
1. **حقل سبب الرفض غير موجود في الـ form** — في `app/admin/reader-applications/page.tsx`، دالة `handleAction("reject")` ترسل فقط `userId` و `action` بدون `rejection_reason`.
2. **API لا يقرأ `rejection_reason` من الـ body** ولا يخزّنه في الـ DB.
3. **لا يتم إنشاء `Notification` داخل النظام** — فقط الإيميل يُرسل، بينما المهمة B-1 تطلب إشعارات داخلية لكل الأحداث المهمة.

#### قسم المدرس (Teacher)
**ما تم:**
- `app/api/academy/admin/teacher-applications/[id]/route.ts` يستدعي `sendTeacherApprovedEmail` و `sendTeacherRejectedEmail`
- يحدّث `status` بشكل صحيح
- DELETE handler موجود

**المشاكل:**
1. **لا يتم استدعاء `createNotification`** بعد قبول/رفض المدرس — فقط الإيميل يُرسل، بينما B-1 صراحةً تطلب «إشعار قبول/رفض طلب أستاذ».

---

### B-4 — إنشاء طالب بكلمة مرور مؤقتة + إجبار التغيير ⚠️

**الملف:** `app/api/academy/teacher/students/create/route.ts`

**ما تم:**
- استدعاء `sendStudentCreatedByTeacherEmail` بكلمة المرور لإرسالها للطالب

**المشاكل:**
1. **كلمة المرور ليست مولّدة تلقائياً (temporary)** — الكود يأخذ `password` من الـ body كما يدخلها المدرس، دون توليد random password قوية.
2. **لا يوجد إجبار لتغيير كلمة المرور عند أول تسجيل دخول:**
   - لا يوجد عمود `must_change_password` في جدول `users` (تم البحث: 0 نتيجة).
   - لا يوجد middleware أو redirect إلى صفحة `change-password` بعد أول login.
   - لا توجد صفحة `app/change-password` أو ما يكافئها.

---

### B-5 — إشعار طلب الانضمام للأستاذ ⚠️ (سيفشل runtime)

**الملف:** `app/api/academy/student/enrollments/route.ts`

**ما تم في الكود:**
- إنشاء `enrollment` بـ `status='pending'`
- استدعاء `createNotification` للأستاذ صاحب الدورة

**المشاكل الحرجة في الـ DB:**
الـ schema الأصلي في `scripts/002-phase2-lms-engine-schema.sql`:
\`\`\`sql
CREATE TABLE enrollments (
  ...
  status VARCHAR(50) DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE','PAUSED','COMPLETED','DROPPED')),
  ...
)
\`\`\`

- الـ INSERT بالقيمة `'pending'` **سيفشل بـ check constraint violation** لأن `'pending'` غير مدرج في القائمة المسموحة.
- لم يُكتب أي `ALTER TABLE` في scripts لتعديل الـ constraint.

---

### B-6 — قبول/رفض طلب الانضمام + الإشعار للطالب ⚠️ (سيفشل runtime)

**الملف:** `app/api/academy/teacher/enrollment-requests/[id]/route.ts`

**ما تم في الكود:**
- تحديث `status` إلى `'active'` أو `'rejected'`
- كتابة `rejection_reason` في الـ DB عند الرفض
- استدعاء `createNotification` للطالب

**المشاكل الحرجة في الـ DB:**
1. **عمود `rejection_reason` غير موجود** في جدول `enrollments`. تم البحث في كل ملفات scripts/*.sql فلم يُعثر على أي `ALTER TABLE enrollments ADD COLUMN rejection_reason`. ستُرجع PostgreSQL خطأ: `column "rejection_reason" of relation "enrollments" does not exist`.
2. **القيم `'active'` و `'rejected'` ليست في الـ check constraint** (المسموح فقط: ACTIVE/PAUSED/COMPLETED/DROPPED بحروف كبيرة) → نفس مشكلة B-5.

---

### B-7 — رفع درس بحالة `pending_review` + إشعار للمشرف ⚠️ (سيفشل runtime)

**الملف:** `app/api/academy/teacher/courses/[id]/lessons/route.ts`

**ما تم في الكود:**
- INSERT بـ `status='pending_review'`
- استخدام `order_index` كعمود ترتيب
- استدعاء `createNotification` للمشرفين

**المشاكل الحرجة في الـ DB:**
الـ schema الأصلي:
\`\`\`sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  course_id UUID,
  title VARCHAR(255),
  content TEXT,
  lesson_order INTEGER NOT NULL,        -- ⚠️ اسم العمود
  duration_minutes INTEGER,
  is_published BOOLEAN DEFAULT FALSE,   -- ⚠️ بدلاً من status
  ...
)
\`\`\`

1. **عمود `order_index` غير موجود** — الموجود اسمه `lesson_order`. الـ INSERT سيفشل.
2. **عمود `status` غير موجود في `lessons`** — يستخدم الـ schema حقل bool `is_published`. الـ INSERT بـ `status='pending_review'` سيفشل.
3. لا يوجد أي migration يضيف هذه الأعمدة.

---

## 3. المهام الناقصة بشكل كبير

### B-1 — منظومة الإشعارات الموحّدة 🔴

**المتطلب الأصلي:** «أنشئ Supabase function/trigger ينشئ Notification في كل حدث».

**الحالة الفعلية:**

| الحدث | إشعار في DB؟ | الطريقة |
|---|---|---|
| قبول/رفض طلب انضمام لدورة | ✅ | `createNotification` في API (B-6) |
| تقييم مهمة من مدرس | ✅ | في `tasks/[id]/submissions/[submissionId]/grade/route.ts` |
| قبول/رفض طلب مدرس | ❌ | إيميل فقط — لا يوجد `createNotification` |
| قبول/رفض طلب قارئ | ❌ | إيميل فقط — لا يوجد `createNotification` |
| رفع درس جديد للمشرف | ⚠️ | كود موجود لكنه سيفشل بسبب schema |

**ملاحظات إضافية:**
- لا توجد أي `CREATE FUNCTION` أو `CREATE TRIGGER` في `scripts/*.sql` — تم البحث وأرجع 0 نتيجة.
- التطبيق الحالي كله Node-side عبر `lib/notifications.ts` بدون triggers قاعدة بيانات.
- نهج Node-side مقبول هندسياً لكنه **يخالف** نص المهمة الذي يطلب triggers صراحةً، ومعرّض لعدم الاتساق إذا كتب مطور آخر مباشرة على الجداول دون استدعاء الـ helper.
- API الإشعارات `/api/notifications` (GET/PATCH/DELETE) موجود وشغّال.

---

## 4. تحليل تفصيلي لمشاكل قاعدة البيانات

### جدول `enrollments`
| العمود/القيد | الحالة الحالية | المطلوب | تأثير |
|---|---|---|---|
| `status` check constraint | ACTIVE, PAUSED, COMPLETED, DROPPED | يحتاج: pending, active, rejected | **B-5, B-6 يفشلان** |
| `rejection_reason` | غير موجود | موجود TEXT | **B-6 يفشل** |
| `updated_at` | موجود؟ يحتاج تأكيد | موجود | غير حرج |

### جدول `lessons`
| العمود | الحالة الحالية | المطلوب | تأثير |
|---|---|---|---|
| `status` | غير موجود (يستخدم `is_published` BOOL) | VARCHAR with check (pending_review, published, rejected) | **B-7 يفشل** |
| `order_index` | غير موجود (الموجود `lesson_order`) | INTEGER | **B-7 يفشل** |
| `submitted_by` | يحتاج تحقق | UUID FK لـ users | غير حرج |

### جدول `users`
| العمود | الحالة الحالية | المطلوب | تأثير |
|---|---|---|---|
| `must_change_password` | غير موجود | BOOLEAN DEFAULT FALSE | **B-4 لا يكتمل** |
| `password_changed_at` | غير موجود | TIMESTAMPTZ | غير حرج |

### جدول `notifications`
- موجود وشغّال — تم استخدامه فعلياً من API.

---

## 5. مشاكل واجهة المستخدم (UI)

### `app/admin/reader-applications/page.tsx`
- لا يوجد textarea لإدخال سبب الرفض قبل إرسال PUT.
- زر «رفض» يستدعي `handleAction("reject", userId)` مباشرة بدون فتح dialog لطلب السبب.

### عدم وجود صفحة تغيير كلمة المرور الإجباري
- لا توجد `/change-password` أو ما يكافئها.
- لا يوجد middleware يفحص `must_change_password` ويعيد التوجيه.

---

## 6. الإصلاحات المطلوبة

### أ) Migration SQL لازم
\`\`\`sql
-- ============== B-5 / B-6 ==============
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_status_check;
ALTER TABLE enrollments
  ADD CONSTRAINT enrollments_status_check
  CHECK (status IN ('pending','active','accepted','rejected',
                    'ACTIVE','PAUSED','COMPLETED','DROPPED'));

ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============== B-7 ==============
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending_review'
    CHECK (status IN ('pending_review','published','rejected'));

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS order_index INTEGER;

UPDATE lessons SET order_index = lesson_order WHERE order_index IS NULL;

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id);

-- ============== B-4 ==============
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
\`\`\`

### ب) إصلاحات الكود

1. **B-3 (reader form):** أضف textarea في dialog الرفض داخل `app/admin/reader-applications/page.tsx` وأرسلها مع PUT، وحدّث API ليقرأها ويخزّنها.
2. **B-3 (teacher notification):** أضف استدعاء `createNotification` في `app/api/academy/admin/teacher-applications/[id]/route.ts` بعد كل من `sendTeacherApprovedEmail` و `sendTeacherRejectedEmail`.
3. **B-3 (reader notification):** أضف `createNotification` بعد إيميل القارئ.
4. **B-4 (temp password):** ولّد كلمة مرور random داخل `students/create/route.ts` (مثلاً `crypto.randomBytes(8).toString('base64url')`) واضبط `must_change_password=TRUE`.
5. **B-4 (force change):** أنشئ صفحة `/change-password` و middleware يعيد التوجيه إذا `must_change_password=true`، ويُصفّر الفلاج بعد التغيير.

### ج) Triggers (اختياري حسب التفسير الحرفي للمهمة)
لو حابب تتبع نص B-1 حرفياً:
\`\`\`sql
CREATE OR REPLACE FUNCTION notify_on_enrollment_status_change() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('active','rejected') AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, type, title, message, ...)
    VALUES (NEW.student_id, 'enrollment_' || NEW.status, ..., ...);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrollment_status_change_trigger
  AFTER UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION notify_on_enrollment_status_change();
\`\`\`

---

## 7. الأولويات المقترحة

| الأولوية | الإصلاح | السبب |
|---|---|---|
| 🔴 P0 | Migration SQL لـ enrollments و lessons | يمنع crash runtime لـ 3 ميزات |
| 🔴 P0 | Migration لإضافة `must_change_password` | يكمل B-4 |
| 🟠 P1 | إضافة `createNotification` لقبول/رفض المدرس والقارئ | يكمل B-1 و B-3 |
| 🟠 P1 | تعديل reader-applications form لإدخال سبب الرفض | تجربة مستخدم |
| 🟡 P2 | توليد كلمة مرور temporary في B-4 | أمان |
| 🟡 P2 | صفحة + middleware تغيير الباسورد الإجباري | أمان |
| 🟢 P3 | تحويل الإشعارات إلى triggers بدلاً من Node-side | اتساق معماري |

---

## ملاحظة نهائية

التطبيق الحالي يبدو **كاملاً عند قراءة الكود فقط**، لكن عند التشغيل الفعلي ستظهر أخطاء قاعدة بيانات في:
- إنشاء enrollment جديد (B-5).
- قبول/رفض enrollment (B-6).
- إنشاء lesson جديد (B-7).

هذه الأخطاء لن تظهر في `pnpm build` أو `tsc` لأنها أخطاء runtime من PostgreSQL، لذا يجب اختبارها يدوياً أو بسكربت تكامل.
