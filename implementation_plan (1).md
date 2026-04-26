# خطة إصلاح وتفعيل ميزات الأكاديمية (محدّثة بعد التحقق من السلامة)

## ✅ نتائج فحص السلامة

### تسجيل الدخول — آمن 100%
- Login route (`/api/auth/login/route.ts`) يستخدم النمط الصحيح: `query()` من `lib/db` + يُنشئ JWT ويحفظه في cookie اسمه **`auth-token`**
- Middleware (`middleware.ts`) يقرأ `auth-token` cookie ← **لن يتأثر بأي تغيير**
- `getSession()` في `lib/auth.ts` يقرأ `auth-token` cookie ← هذا هو النمط الصحيح المطلوب

### الصفحات العاملة — لن تتأثر
كل هذه تستخدم النمط الصحيح ولن نلمسها:
- ✅ Teacher courses (list, create, detail, lessons) 
- ✅ Teacher enrollment-requests (list + [id] PATCH)
- ✅ Teacher tasks (list, create, submissions, grading)
- ✅ Student courses (browse, detail, enroll, lesson viewer)
- ✅ Student tasks, certificates, enrollments
- ✅ Admin categories (CRUD), teacher-applications (list + approve/reject)
- ✅ Admin students page + API
- ✅ Parent, Supervisor routes
- ✅ كل صفحات الـ Library admin

### Frontend — آمن
- **لا يوجد أي import لـ `supabase` في أي ملف frontend** (`.tsx`) ← التغييرات في API routes فقط ولن تؤثر على أي صفحة عرض

---

## المشاكل المكتشفة (مُحدّث)

> [!CAUTION]
> ### مشكلة #1: نمط Auth/DB مكسور في ~19 API Route
> هذه الملفات تقرأ cookie اسمه `session` (غير موجود!) بدلاً من `auth-token`.
> **تُرجع 401 دائماً** — يعني كل الميزات المرتبطة بها معطلة.
> 
> **التغيير آمن** لأن هذه الملفات **أصلاً لا تعمل** — فنحن لا نكسر شيء شغال بل نُصلح شيء مكسور.

#### القائمة الدقيقة (20 ملف — أُضيف `lib/academy/points.ts`):

| # | الملف | المشكلة |
|---|-------|---------|
| 1 | `api/academy/admin/courses/route.ts` | supabase + session cookie + جداول خاطئة (`user_enrollments`) |
| 2 | `api/academy/admin/teachers/route.ts` | supabase + session cookie + جداول خاطئة (`user_enrollments`) |
| 3 | `api/academy/admin/stats/route.ts` | supabase + session cookie |
| 4 | `api/academy/admin/invitations/route.ts` | supabase + session cookie |
| 5 | `api/academy/admin/competitions/route.ts` | supabase + session cookie |
| 6 | `api/academy/admin/leaderboard/route.ts` | supabase + session cookie |
| 7 | `api/academy/admin/paths/route.ts` | supabase + session cookie |
| 8 | `api/academy/admin/forum/route.ts` | supabase + session cookie |
| 9 | `api/academy/admin/fiqh/route.ts` | supabase + session cookie |
| 10 | `api/academy/teacher/students/route.ts` | supabase + session cookie + جدول خاطئ (`user_enrollments`) |
| 11 | `api/academy/teacher/sessions/route.ts` | supabase + session cookie |
| 12 | `api/academy/teacher/live-session/route.ts` | supabase + session cookie |
| 13 | `api/academy/student/points/route.ts` | supabase + session cookie |
| 14 | `api/academy/student/memorization/route.ts` | supabase + session cookie |
| 15 | `api/academy/student/badges/route.ts` | supabase + session cookie |
| 16 | `api/academy/public/lessons/[lessonId]/route.ts` | supabase (auth ليست ضرورية هنا لكن يجب توحيد النمط) |
| 17 | `api/academy/public/lessons/[lessonId]/subscribe/route.ts` | supabase + session cookie |
| 18 | `api/academy/invitations/[inviteCode]/route.ts` | supabase |
| 19 | `api/academy/invitations/[inviteCode]/accept/route.ts` | supabase + session cookie |
| 20 | `lib/academy/points.ts` | supabase (utility library) |

> [!WARNING]
> ### مشكلة #2: API Route مفقود — دوراتي المسجلة
> صفحة `/academy/student/courses` تستدعي `GET /api/academy/student/courses` 
> لكن لا يوجد `route.ts` في هذا المسار — الموجود فقط `/courses/all` و `/courses/[id]`

> [!WARNING]
> ### مشكلة #3: Route مكرر لطلبات الانضمام (اكتشاف جديد!)
> يوجد **مجلدين** لنفس الوظيفة:
> - `enrollment-requests/[id]/route.ts` → يستخدم **PATCH** ✅ (يتطابق مع الـ frontend)
> - `enrollment-requests/[requestId]/route.ts` → يستخدم **PUT** ❌ (لا يتطابق)
> 
> الـ frontend يرسل `PATCH` إلى `/api/academy/teacher/enrollment-requests/${requestId}`
> Next.js سيختار `[id]` أو `[requestId]` بشكل غير متوقع — يجب **حذف المكرر** `[requestId]`

> [!NOTE]
> ### اكتشافات إيجابية — أشياء موجودة ولا تحتاج إنشاء:
> - ✅ `lessons/[lessonId]/route.ts` (PATCH + DELETE) — **موجود بالفعل** ← لا حاجة لإنشائه (كان مذكور في الخطة القديمة)
> - ✅ `admin/students/route.ts` — يعمل بالنمط الصحيح
> - ✅ `admin/categories/[id]/route.ts` — يعمل بالنمط الصحيح

---

## Open Questions

> [!IMPORTANT]
> 1. **هل الجداول التالية موجودة في قاعدة البيانات؟** الملفات المكسورة تشير لجداول: `competitions`, `competition_entries`, `user_points`, `badges`, `points_log`, `memorization_log`, `learning_paths`, `invitations`. إذا لم تكن موجودة، سنجعل الـ API يُرجع مصفوفة فارغة بدلاً من خطأ.
> 2. **هل تريد إضافة ميزة "إضافة مدرس مباشرة"** من صفحة أدمن المدرسين (تحويل مستخدم موجود لمدرس بدون طلب)؟
> 3. **هل نُصلح كل الـ 20 ملف الآن** أم نركز على الأولويات فقط (الدورات + المدرسين + الإحصائيات)?

---

## Proposed Changes

### Phase 1: إصلاح نمط Auth/DB (أعلى أولوية — كل شيء يعتمد عليه)

> [!TIP]
> **ضمان السلامة:** كل ملف يتم تعديله هو **مكسور أصلاً** (يُرجع 401 دائماً). التعديل يُصلحه فقط ولا يكسر شيء آخر.

#### التغيير الموحد لكل ملف:
```diff
- import { supabase } from '@/lib/supabase'
- import { requireRole, JWTPayload } from '@/lib/auth'
- import { cookies } from 'next/headers'
- import { jwtDecode } from 'jwt-decode'
-
- async function getSession(): Promise<JWTPayload | null> {
-   const cookieStore = await cookies()
-   const sessionCookie = cookieStore.get('session')?.value
-   if (!sessionCookie) return null
-   try { return jwtDecode<JWTPayload>(sessionCookie) }
-   catch { return null }
- }
+ import { getSession } from '@/lib/auth'
+ import { query } from '@/lib/db'
```

ثم تحويل كل supabase query إلى SQL مباشر. مثال:
```diff
- const { data, error } = await supabase.from('courses').select('*')
- if (error) throw error
- return NextResponse.json(data)
+ const rows = await query('SELECT * FROM courses ORDER BY created_at DESC')
+ return NextResponse.json({ data: rows })
```

---

#### الملفات المطلوب تعديلها (مرتبة حسب الأولوية):

**أولوية عالية (مطلوبة لتشغيل الأكاديمية):**

##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/admin/stats/route.ts)
- تحويل 4 supabase queries إلى SQL: count students, teachers, courses, sum points

##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/admin/courses/route.ts)
- تحويل من supabase إلى SQL مع JOIN صحيح
- إصلاح `user_enrollments` → `enrollments`
- إضافة POST method لإنشاء دورة من الأدمن

##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/admin/teachers/route.ts)
- تحويل من supabase إلى SQL مع COUNT للدورات والطلاب
- إصلاح `user_enrollments` → `enrollments`

##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/teacher/students/route.ts)
- تحويل من supabase إلى SQL
- إصلاح `user_enrollments` → `enrollments`

**أولوية متوسطة (ميزات مهمة):**

##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/admin/leaderboard/route.ts)
##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/admin/invitations/route.ts)
##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/admin/forum/route.ts)
##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/admin/fiqh/route.ts)
##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/admin/competitions/route.ts)
##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/admin/paths/route.ts)
##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/teacher/sessions/route.ts)
##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/teacher/live-session/route.ts)
##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/student/points/route.ts)
##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/student/memorization/route.ts)
##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/student/badges/route.ts)

**أولوية أقل (ميزات عامة):**

##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/public/lessons/[lessonId]/route.ts)
##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/public/lessons/[lessonId]/subscribe/route.ts)
##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/invitations/[inviteCode]/route.ts)
##### [MODIFY] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/invitations/[inviteCode]/accept/route.ts)

##### [MODIFY] [points.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/lib/academy/points.ts)
- تحويل كامل من supabase إلى query/queryOne

---

### Phase 2: إصلاح Routes المفقودة وتنظيف المكرر

##### [NEW] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/student/courses/route.ts)
- GET: جلب الدورات المسجل فيها الطالب مع progress
- يُرجع نفس الـ interface المتوقع في الـ frontend

##### [DELETE] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/teacher/enrollment-requests/[requestId]/route.ts)
- حذف المجلد `[requestId]` بالكامل — مكرر مع `[id]` الذي يعمل بشكل صحيح مع PATCH

> [!NOTE]
> **لماذا هذا آمن:** الـ frontend يرسل PATCH و`[id]/route.ts` يتعامل مع PATCH. مجلد `[requestId]` يتعامل مع PUT فقط ← لم يكن يعمل أصلاً مع الـ frontend.

---

### Phase 3: تفعيل صفحات الأدمن (CRUD كامل)

##### [MODIFY] [page.tsx](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/academy/admin/courses/page.tsx)
- تفعيل أزرار: إنشاء دورة، تعديل، حذف، تغيير حالة
- عرض البيانات بشكل صحيح (teacher_name, students count, lessons count)
- إضافة dialog لإنشاء دورة جديدة أو رابط لصفحة الإنشاء

##### [MODIFY] [page.tsx](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/academy/admin/teachers/page.tsx)
- تفعيل أزرار التحكم
- عرض المدرسين بإحصائيات صحيحة
- إضافة ميزة تحويل مستخدم لمدرس (إذا أراد المستخدم)

##### [NEW] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/admin/courses/[id]/route.ts)
- GET: تفاصيل دورة
- PUT: تعديل دورة
- DELETE: حذف دورة

##### [NEW] [route.ts](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/api/academy/admin/teachers/[id]/route.ts)
- PUT: تعديل حالة مدرس
- DELETE: إلغاء صفة مدرس

##### [MODIFY] [page.tsx](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/academy/admin/page.tsx)
- تفعيل "أحدث الدورات" و"أنشط الطلاب" بجلب بيانات حقيقية من stats API

---

### Phase 4: تفعيل ميزات ثانوية

##### [MODIFY] [page.tsx](file:///c:/Users/Mazen/Documents/AA%20sayyoud/app/academy/teacher/courses/[id]/page.tsx)
- تفعيل زر حذف الدرس (الـ API DELETE موجود بالفعل في `lessons/[lessonId]/route.ts`)

---

## ضمانات السلامة

| المكون | التأثير | السبب |
|--------|---------|-------|
| تسجيل الدخول | ✅ لا تأثير | لا نلمس `api/auth/login` أو `middleware.ts` |
| Library Admin | ✅ لا تأثير | كل routes تستخدم النمط الصحيح أصلاً |
| Student pages | ✅ لا تأثير | كل الـ working APIs لن تتغير |
| Teacher courses | ✅ لا تأثير | يستخدم النمط الصحيح أصلاً |
| Cookie name | ✅ لا تأثير | نحوّل من `session` (مكسور) إلى `auth-token` (الصحيح) |
| Database | ✅ لا تأثير | نستخدم نفس الـ Pool من `lib/db` |
| Frontend | ✅ لا تأثير | لا يوجد supabase import في أي ملف frontend |

## Verification Plan

### Build Check
```bash
npm run build
```

### Browser Testing (مرتب حسب الأولوية)
1. **تسجيل دخول** ← تأكد أنه يعمل كما كان (لا تغيير)
2. **أدمن الأكاديمية** ← لوحة التحكم تعرض إحصائيات ← إدارة الدورات تعرض قائمة ← إدارة المدرسين تعرض قائمة
3. **المدرس** ← إنشاء دورة ← إضافة دروس ← نشر الدورة
4. **الطالب** ← تصفح الدورات ← طلب انضمام ← المدرس يقبل ← الطالب يرى الدورة في "دوراتي"
5. **Library/Student pages** ← تأكد أنها تعمل كما كانت
