# مهام Agent A — الأمان + Auth + الصلاحيات
> **Branch:** `feature/plan-A-security`
> **لا تلمس أي ملف غير المذكور هنا**

---

## ملفاتك الحصرية — أنت المالك الوحيد

| الملف | المهمة |
|---|---|
| `middleware.ts` | A-1 + A-4 |
| `app/register/page.tsx` | A-2 |
| `app/api/admin/users` | A-4 + A-5 |
| `app/api/admin/reader-applications/route.ts` | A-6 |
| `app/api/academy/admin/teacher-applications/[id]/approve` | A-3 ⚠️ |

---

## المهام بالترتيب

### A-1 🔴 ثغرة أمنية — ابدأ بها فوراً
**الملف:** `middleware.ts`

المدرس يقدر يفتح `/academy/student/*` بتعديل الرابط يدوياً.

- تحقق أن role check شغال: إذا `role === 'teacher'` → لا وصول لـ `/academy/student/*`
- أضف redirect لـ `/academy/teacher` إذا حاول المدرس الدخول لمسار الطالب
- اختبر كل مسارات الـ academy بكل الـ roles بعد الإصلاح

---

### A-2 🔴 توجيه التسجيل الخاطئ
**الملف:** `app/register/page.tsx`

بعد التسجيل بـ «الأكاديمية فقط» يوجه لـ `/student` بدل `/academy/student`.

- تحقق أن `platform_preference` يُقرأ صح من Supabase بعد الحفظ
- إذا `platform_preference === 'academy'` → redirect لـ `/academy/student`
- إذا `platform_preference === 'both'` → redirect لـ `/student` مع ظهور Switcher

---

### A-3 🔴 حساب الأستاذ الجديد — شاشة بيضاء بعد القبول
**الملف:** `app/api/academy/admin/teacher-applications/[id]/approve`

> ⚠️ **مهم جداً:** بعد ما تخلص A-3 اعمل PR وأخبر المشرف فوراً — Agent B محتاج يكمل على نفس الملف ده.

- فحص ما يحدث بعد approve: هل session بيتعمل صح؟
- تأكد أن الـ role يتحفظ كـ `teacher` مش `student`
- فحص middleware redirect بعد login لحساب `teacher`
- تأكد أن `/academy/teacher` مسموح به لهذا الـ role

---

### A-4 🔴 الصلاحيات الوهمية
**الملف:** `middleware.ts` + `app/api/admin/users`

تغيير الصلاحيات من الأدمن مش بيأثر على تجربة المستخدم.

- فحص هل الـ middleware بيقرأ الـ access flags من Supabase ولا من cached session بس
- أضف إعادة قراءة الـ flags من DB عند كل request حساس
- اربط Mode Switcher بالـ flags الفعلية من DB مش من الـ cache
- أضف real-time invalidation عند تغيير الصلاحية

---

### A-5 🟠 إيقاف الحساب مش real-time
**الملف:** `app/api/admin/users`

إيقاف حساب من الأدمن يستلزم logout وإعادة login لرؤية التأثير.

- عند تغيير الحالة لـ `disabled`: استدعاء Supabase Admin API لإلغاء كل sessions الـ user فوراً
- أو: استخدام Supabase realtime لإجبار الـ client على إعادة التحقق

---

### A-6 🟠 حذف طلب مقرئ مرفوض — خطأ 405
**الملف:** `app/api/admin/reader-applications/route.ts`

> ✅ **ملاحظة:** Agent B هيضيف إيميل في نفس الملف ده — اشتغلوا في نفس الـ PR مع بعض، كل واحد في مكان مختلف.

`DELETE /api/admin/reader-applications` يرجع **405 Method Not Allowed**.

- أضف `export async function DELETE(req)` في الـ route file
- أو أضف الـ `[id]` في المسار: `DELETE /api/admin/reader-applications/[id]`
- اختبر الـ endpoint بعد الإضافة

---

## ترتيب الأولويات

```
A-1 (فوراً) → A-2 → A-3 → A-4 → A-5 → A-6
```

بعد A-3: **اعمل PR وأخبر المشرف** — Agent B بيستنى.

---

## ملفات ممنوع تلمسها

- `teacher-applications/[id]/reject` — ده B + C
- `academy/teacher/students/create` — ده C + B
- `academy-dashboard-shell.tsx` — ده B + D
- أي ملف في `/academy/` غير المذكور فوق

---

_Agent A — خطة الأمان — إعداد ٣٠ أبريل ٢٠٢٦_
