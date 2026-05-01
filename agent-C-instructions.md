# مهام Agent C — الباك إند + API
> **Branch:** `feature/plan-C-backend`
> **لا تلمس أي ملف غير المذكور هنا**

---

## ملفاتك الحصرية — أنت المالك الوحيد

| الملف | المهمة |
|---|---|
| `app/api/academy/courses` | C-1 |
| `app/api/admin/recitations/[id]` | C-2 |
| `app/api/academy/admin/invitations` | C-3 |
| `app/api/academy/teacher/students/create` | C-4 ⚠️ |
| `app/api/academy/teacher/students` | C-5 |
| Supabase Storage (file upload/download) | C-6 |
| API تقييم المهمة | C-7 |
| `app/api/academy/admin/teacher-applications/[id]/reject` | C-8 ⏳ بعد B-3 |

---

## ⚠️ انتبه — مهمة واحدة تنتظر merge أول

| المهمة | بتنتظر إيه | ليه |
|---|---|---|
| **C-8** | merge B-3 | نفس الملف `teacher-applications/reject` |

**ابدأ على طول بـ C-1, C-2, C-3, C-4, C-5, C-6, C-7 — دي مش بتنتظر حد.**

---

## المهام

### C-1 🔴 الدورات لا تظهر في browse — ابدأ بها فوراً
**الملف:** `app/api/academy/courses` أو query داخل `/academy/student/courses/browse`

الدورات موجودة في DB لكن مش بتتجلب.

- افحص الـ query: هل فيه `where status = 'published'` بيحجب دورات بحالة تانية؟
- هل الدورات محفوظة بـ `status = 'draft'` بدل `published`؟
- افحص الـ RLS policies في Supabase: هل بتسمح لـ student بقراءة جدول الدورات؟
- اختبر الـ API مباشرة عبر Supabase Studio

---

### C-2 🔴 تغيير حالة التسميع لا يُحفظ في DB
**الملف:** `app/api/admin/recitations/[id]`

الأدمن يغير حالة التسميع لكن التغيير مش بيتحفظ.

- افحص الـ PATCH/PUT endpoint: موجود أصلاً في المسار ده؟
- افحص الـ RLS policies: الأدمن مسموح له بتحديث جدول التسميعات؟
- تأكد أن الـ request body فيه الـ field الصح (مثلاً `status`)
- أضف error handling يوضح المشكلة للمستخدم لو فشل

---

### C-3 🔴 خطأ constraint في إرسال الدعوات
**الملف:** `app/api/academy/admin/invitations`

`new row for relation "invitations" violates check constraint "invitations_status_check"`.

- افتح Supabase Studio → جدول `invitations` → شوف الـ check constraint
- حدد القيم المسموح بها لـ `status` (مثلاً: `pending`, `sent`, `accepted`, `rejected`)
- عدل الـ API يبعت قيمة `status` تطابق الـ constraint عند إنشاء الدعوة

---

### C-4 🔴 إنشاء حساب طالب من المدرس ينشئ حساب مقرأة
**الملف:** `app/api/academy/teacher/students/create`

> ⚠️ **مهم جداً:** بعد ما تخلص C-4 اعمل PR وأخبر المشرف فوراً — Agent B بيستنى يضيف الإيميل على نفس الملف ده.

الحساب المُنشأ بيتعامل كحساب مقرأة مش أكاديمية.

- تأكد أن عند إنشاء الحساب بيتعين: `has_academy_access = true` و `platform_preference = 'academy'`
- تأكد أن `has_quran_access = false` إذا الطالب مش مشترك في المقرأة
- اختبر login بالحساب الجديد وتحقق من التوجيه لـ `/academy/student`

---

### C-5 🟠 الطلاب لا يظهرون في صفحة المدرس
**الملف:** `app/api/academy/teacher/students`

حتى الطلاب المشتركين في دورات المدرس مش بيظهروا.

- افحص الـ query: بيجيب الطلاب المرتبطين بدورات هذا المدرس تحديداً؟
- هل فيه JOIN صح مع جدول `enrollments` و `courses`؟
- اختبر الـ query مباشرة في Supabase Studio باستخدام user_id المدرس

---

### C-6 🟠 المدرس لا يستطيع فتح ملفات تسليم الطلاب
**المكان:** Supabase Storage + `/academy/teacher/tasks/[id]/grade`

ملفات التسليم بتتنزل بصيغة غريبة غير قابلة للفتح.

- افحص طريقة رفع الملف: الـ `content-type` بيتحفظ صح في Supabase Storage؟
- عند التنزيل: أضف `Content-Disposition` و `Content-Type` headers الصح في الـ response
- أو: استخدم Supabase Storage signed URL مع `download` parameter بدل blob مباشر

---

### C-7 🟠 المهمة تظل «معلقة» بعد التقييم
**المكان:** API تقييم المهمة في `/academy/teacher/tasks/[id]/grade`

بعد التقييم، حالة المهمة مش بتتغير.

- عند حفظ التقييم: حدث status الـ submission لـ `graded`
- إذا كل submissions المهمة اتقيّمت: حدث status المهمة الرئيسية بالمناسب
- افحص RLS policies للتأكد من أن المدرس مسموح له بتحديث الجدولين

---

### C-8 🟠 رفض أستاذ يمنع إعادة التقديم
**الملف:** `app/api/academy/admin/teacher-applications/[id]/reject`

> ⏳ **انتظر merge B-3 الأول** — نفس الملف.

بعد B-3 يتمرج:
- افحص ما يحدث بعد الرفض في Supabase Auth: هل `deleteUser` بيتعمل؟ هل فيه blacklist؟
- إذا فيه blacklist: شيله واستبدله بـ `rejection_count` في جدول الطلبات
- اسمح بتقديم طلب جديد من نفس البريد مع إظهار تاريخ الطلبات السابقة للأدمن

---

## ترتيب الأولويات

```
C-1 (فوراً) + C-2 + C-3 + C-4 + C-5 + C-6 + C-7 (بالتوازي)
↓ بعد merge C-4
أخبر المشرف — Agent B بيستنى
↓ بعد merge B-3
C-8
```

---

## ملفات ممنوع تلمسها

- `middleware.ts` — ده A
- `app/register/page.tsx` — ده A
- نظام الإشعارات (DB triggers) — ده B
- `academy-dashboard-shell.tsx` — ده B + D
- أي sidebar أو UI component — ده D

---

_Agent C — خطة الباك إند — إعداد ٣٠ أبريل ٢٠٢٦_
