# مهام Agent B — الإشعارات + الإيميلات
> **Branch:** `feature/plan-B-notifications`
> **لا تلمس أي ملف غير المذكور هنا**

---

## ملفاتك الحصرية — أنت المالك الوحيد

| الملف | المهمة |
|---|---|
| نظام الإشعارات (DB triggers + API) | B-1 |
| `academy-dashboard-shell.tsx` | B-2 ✅ مع D |
| `app/api/admin/reader-applications/route.ts` | B-3 (reader) ✅ مع A |
| `app/api/academy/teacher/students/create` | B-4 ⏳ بعد C-4 |
| API طلب الانضمام للدورة | B-5 |
| API approve/reject enrollment | B-6 |
| API رفع الدرس | B-7 |

---

## ⚠️ انتبه — مهمتان تنتظران merge أول

| المهمة | بتنتظر إيه | ليه |
|---|---|---|
| **B-4** | merge C-4 | نفس الملف `students/create` |
| **B-3** (قسم approve) | merge A-3 | نفس الملف `teacher-applications/approve` |

**ابدأ على طول بـ B-1, B-2, B-5, B-6, B-7 — دي مش بتنتظر حد.**

---

## المهام

### B-1 🔴 منظومة الإشعارات معطلة — ابدأ بها فوراً
**المكان:** DB + API + Frontend — الأكاديمية بالكامل

لا يصل أي إشعار في أي حساب.

- فحص جدول الإشعارات في Supabase: هل الإشعارات بتتكتب أصلاً عند أي event؟
- فحص الـ API endpoint اللي بيجيب الإشعارات: هل بيرجع بيانات؟
- فحص الـ frontend: هل بيستدعي الـ API صح؟
- أنشئ Supabase function/trigger ينشئ إشعار عند:
  - قبول/رفض طلب انضمام لدورة
  - تقييم مهمة من مدرس
  - قبول/رفض طلب أستاذ
  - رفع درس جديد (للمشرف)

---

### B-2 🔴 إشعارات الأكاديمية توجه لصفحة المقرأة
**الملف:** `academy-dashboard-shell.tsx`

> ✅ **ملاحظة:** Agent D هيغير اللون في نفس الملف — اشتغلوا في نفس الـ PR، كل واحد في سطر مختلف.

زر «عرض جميع الإشعارات» بيوجه لـ `/student/notifications` بدل `/academy/student/notifications`.

- غير الـ href من `/student/notifications` إلى `/academy/student/notifications`
- نفس الإصلاح في header المدرس وولي الأمر

---

### B-3 🔴 لا إيميل للمقرئ عند القبول أو الرفض

**قسم reader** — الملف: `app/api/admin/reader-applications/route.ts`
> ✅ مع Agent A في نفس الـ PR — A يضيف DELETE وأنت تضيف الإيميل.

- أضف حقل `rejection_reason` في form الرفض
- أضف استدعاء Resend/SMTP بعد approve أو reject
- قالب القبول: «تم قبول طلبك كمقرئ، يمكنك تسجيل الدخول الآن»
- قالب الرفض: «تم رفض طلبك. السبب: {reason}»

**قسم teacher approve** — الملف: `teacher-applications/[id]/approve`
> ⏳ **انتظر merge A-3 الأول** قبل ما تبدأ في الملف ده.

- بعد A-3 يتمرج: أضف إرسال إيميل قبول للمدرس في نفس الـ function

---

### B-4 🟠 إيميل الطالب الجديد لا يصل
**الملف:** `app/api/academy/teacher/students/create`

> ⏳ **انتظر merge C-4 الأول** — نفس الملف.

بعد C-4 يتمرج:
- بعد إنشاء الحساب: ولد كلمة مرور مؤقتة
- ابعت إيميل للطالب: اسم المنصة، البريد، كلمة المرور المؤقتة، رابط الدخول
- أجبر تغيير كلمة المرور عند أول login

---

### B-5 🟠 إشعار طلب الانضمام لا يصل للأستاذ
**المكان:** API طلب الانضمام للدورة

- بعد إنشاء enrollment request في DB: اكتب إشعار في جدول notifications للأستاذ صاحب الدورة
- اختيارياً: ابعت إيميل للأستاذ كمان

---

### B-6 🟠 إشعار قبول/رفض الانضمام لا يصل للطالب
**المكان:** API approve/reject enrollment

- بعد approve أو reject: اكتب إشعار للطالب في جدول notifications
- نص القبول: «تم قبولك في دورة [اسم الدورة]، يمكنك البدء الآن»
- نص الرفض: «تم رفض طلبك للانضمام لدورة [اسم الدورة]»

---

### B-7 🟠 الدرس ينشر فوراً بدون مراجعة
**المكان:** API رفع الدرس في `/academy/teacher/courses/[id]/lessons`

- غير status الدرس عند الرفع لـ `pending_review` بدل `published`
- اكتب إشعار للمشرف عند كل درس جديد يحتاج مراجعة
- الدرس لا يظهر للطلاب إلا بعد تغيير status لـ `published` من المشرف

---

## ترتيب الأولويات

```
B-1 (فوراً) + B-2 + B-5 + B-6 + B-7 (بالتوازي)
↓ بعد merge C-4
B-4
↓ بعد merge A-3
B-3 (قسم approve)
```

---

## ملفات ممنوع تلمسها

- `middleware.ts` — ده A
- `app/register/page.tsx` — ده A
- `app/api/admin/users` — ده A
- `app/api/academy/courses` — ده C
- أي sidebar أو UI component — ده D

---

_Agent B — خطة الإشعارات — إعداد ٣٠ أبريل ٢٠٢٦_
