# Implementation Context — Features & Enhancements Plan

> هذا الملف يلخص كل المعرفة اللي تم استكشافها من الكود قبل بدء تنفيذ الخطة، عشان أي موديل بعدي يكمل من غير ما يعيد القراءة من الصفر.

## 1. Project Overview
- **Framework:** Next.js (App Router) + TypeScript + Tailwind v4
- **Database:** PostgreSQL via `lib/db.ts` (raw SQL, **NO ORM**, NO Supabase install — تم التأكيد من المستخدم)
- **Auth:** Custom JWT-style auth in `lib/auth.ts` — exposes `getCurrentUser()` returning `{ id, role, name, email, phone, avatar_url, ... }`
- **i18n:** `lib/i18n/context.tsx` provides `useI18n()` → `{ t, locale }` (Arabic / English, RTL support)
- **UI components:** shadcn/ui (Card, Button, Input, Label, Textarea, etc.)
- **Roles:** `student`, `teacher`, `parent`, `admin`, `supervisor`

## 2. Folder Structure (المهم)
```
app/
  academy/
    student/    (calendar, chat, badges, leaderboard, profile via /app/student/profile)
    teacher/    (live, profile, sessions, students)
    parent/     (page.tsx, link-child/page.tsx)
    admin/      (fiqh, leaderboard, users, ...)
    supervisor/ (content, layout.tsx)
  api/
    academy/
      student/{calendar, points, badges, sessions, tasks}
      teacher/{live-session, profile, sessions, students/create}
      parent/{link-child, children}
      admin/{fiqh, leaderboard}
      supervisor/{content}
      conversations/{route.ts, [id]/messages/route.ts}
  student/profile/page.tsx   ← الملف اللي كان teacher/profile يستورده
lib/
  auth.ts   → getCurrentUser, requireUser
  db.ts     → query(sql, params) using pg pool
  i18n/context.tsx
scripts/
  001-schema.sql                          ← schema أساسي (users, notifications, ...)
  004-phase4-parent-student-relations.sql ← parent-student tables
  011-academy-expansion.sql               ← course_sessions, session_attendance, conversations, etc.
  A-missing-schema.sql                    ← migrations سابقة
  015-features-and-enhancements.sql       ← **الملف الجديد اللي أنشأته** (Phase 6)
```

## 3. Database Schema — الجداول الموجودة فعلاً

### Core (من `001-schema.sql`)
- `users(id uuid, name, email, phone, password_hash, role, avatar_url, ...)` — الأدوار: student/teacher/parent/admin/supervisor
- `notifications(id, user_id, type, title, message, data jsonb, read_at, created_at)`

### Academy expansion (من `011-academy-expansion.sql`)
- `halaqat` (المجموعات الدراسية / الحلقات)
- `enrollments(id, user_id, halaqa_id, ...)`
- `course_sessions(id, halaqa_id, teacher_id, scheduled_at, duration_minutes, meeting_link, status, ...)` — الجلسات الحية والمسجلة
- `session_attendance(session_id, student_id, joined_at, left_at, is_present)`
- `tasks` / `task_submissions` (الواجبات)
- `academy_conversations(id, type, ...)` و `academy_messages(id, conversation_id, sender_id, content, ...)` — للمحادثات
- `academy_conversation_participants(conversation_id, user_id, last_read_at)`
- `user_points(user_id, total_points, level, current_streak, ...)`
- `points_log(id, user_id, points, reason, created_at)`
- `badges(id, code, name, ...)` و `user_badges(user_id, badge_id, earned_at)`
- `fiqh_questions(id, student_id, question, answer, status, created_at)` — أسئلة الفقه

### Parent-Student (من `004-phase4-parent-student-relations.sql`)
- `parent_children(id, parent_id, student_id, status, created_at)` — **مهم:** كان فيه `status` بس بدون workflow كامل
- ملحوظة: لم نجد جدول `parent_link_requests` منفصل، بل توسعة على `parent_children` نفسه.

## 4. الجداول/الأعمدة اللي أضفتها في Phase 6 (`015-features-and-enhancements.sql`)
**الفلسفة:** تعديلات إضافية فقط (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`)، ما فيش إعادة إنشاء.

### `course_sessions` (للـ Live Sessions)
- `started_at TIMESTAMPTZ`, `ended_at TIMESTAMPTZ`
- `live_status TEXT` — `'scheduled' | 'live' | 'ended'`
- index على `(teacher_id, live_status)`

### `users` (Teacher Profile fields — لا يوجد جدول `teacher_profiles` منفصل، نستخدم users)
- `bio TEXT`
- `specialization TEXT`
- `years_of_experience INT`
- `certifications TEXT[]`
- `subjects TEXT[]`
- `is_verified BOOLEAN DEFAULT false`
- `is_accepting_students BOOLEAN DEFAULT true`
- `total_students INT DEFAULT 0`, `total_courses INT DEFAULT 0`, `rating NUMERIC(3,2) DEFAULT 0`

### `parent_children` (Parent Approval System)
- `status TEXT` — toggle to `'pending' | 'approved' | 'rejected' | 'revoked'`
- `requested_at TIMESTAMPTZ`, `approved_at TIMESTAMPTZ`, `rejected_at TIMESTAMPTZ`
- `approval_token TEXT` — كود التحقق اللي يدخله الطفل/الولي
- index على `(student_id, status)` و `(parent_id, status)`

### `fiqh_questions` (Admin Dashboard)
- `category TEXT`, `priority TEXT DEFAULT 'normal'`
- `assigned_to UUID REFERENCES users(id)`
- `answered_at TIMESTAMPTZ`
- `answered_by UUID REFERENCES users(id)`
- index على `(status, created_at DESC)`

### Gamification helpers
- `points_log` — أضفت index على `(user_id, created_at DESC)` للترتيب السريع
- `user_points` — الأعمدة موجودة فعلاً، لا تعديل

### Supervisor verification
- استخدمنا `users.is_verified` نفسه (Teacher = is_verified) عشان ما نضيفش جدول جديد.
- ممكن يضيف Supervisor جدول `supervisor_verifications` لو احتجنا تاريخ، لكن الحالي يكفي.

## 5. الـ APIs الموجودة قبل التعديل

### Auth-related
- `GET /api/auth/me` — يرجع `{ user }` كامل
- `PATCH /api/auth/me` — يحدّث name/phone/avatar_url
- `POST /api/auth/change-password` — body: `{ currentPassword, newPassword }`

### Student
- `GET /api/academy/student/sessions` — يستخدم `course_sessions` + `enrollments`
- `GET /api/academy/student/tasks` — يستخدم `tasks` + `task_submissions`
- `GET /api/academy/student/points` — يقرأ `user_points`
- `GET /api/academy/student/badges` — يقرأ `user_badges JOIN badges`

### Teacher
- `GET/POST /api/academy/teacher/live-session` — كان بس يقرأ session_attendance
- `GET /api/academy/teacher/sessions` — list + filtering
- `POST /api/academy/teacher/students/create` — ينشئ طالب
- ❌ **ما كانش فيه** `/api/academy/teacher/profile` — أنشأته جديد

### Parent
- `POST /api/academy/parent/link-child` — بسيط جداً، بيربط مباشرة بدون approval
- `GET /api/academy/parent/children` — يجلب الأبناء (بدون فلترة status)

### Admin
- `GET /api/academy/admin/fiqh` — يقرأ fiqh_questions
- `GET /api/academy/admin/leaderboard` — top students by points

### Conversations (Chat)
- `GET/POST /api/academy/conversations` — list + create
- `GET/POST /api/academy/conversations/[id]/messages` — read + send

## 6. الصفحات الموجودة وحالتها

| Page | الحالة قبل التعديل |
|---|---|
| `/academy/student/calendar` | **mock data hardcoded** — يحتاج API |
| `/academy/student/chat` | يستخدم API `/conversations` (شغال) |
| `/academy/student/leaderboard` | شغال |
| `/academy/student/badges` | شغال |
| `/academy/teacher/live` | UI فقط بدون منطق start/end حقيقي |
| `/academy/teacher/profile` | كان مجرد `export default ProfilePage from /app/student/profile` — مش صح للمدرس |
| `/academy/parent` | dashboard موجود |
| `/academy/parent/link-child` | form بسيط |
| `/academy/admin/fiqh` | يعرض الأسئلة |
| `/academy/supervisor/content` | شغال |

## 7. خطة التنفيذ (6 Phases)

> الأمر من المستخدم: **"نفذ الخطة بالكامل ولو فيه أي تعديلات في الداتا بيز اكتبها في فايل منفصل بدون تنزيل supabase"**

### Phase 1 — Calendar, Live Sessions, Chat APIs ✅
1. `app/api/academy/student/calendar/route.ts` (جديد)
   - GET → يجمع بين `course_sessions` (live_session) + `tasks` (assignment_deadline) + `course_sessions` past with recordings (review)
   - شكل الـ response: `{ data: [{ id, title, date, time, type, course, link }] }`
2. `app/academy/student/calendar/page.tsx` — استبدال `mockEvents` بـ `useEffect + fetch`
3. `app/api/academy/teacher/live-session/route.ts` — إعادة كتابة:
   - `GET` — يجلب الجلسات الـ scheduled / live للمدرس
   - `POST { session_id }` — يبدأ الجلسة (`live_status='live'`, `started_at=NOW()`)
   - `PATCH { session_id }` — ينهي الجلسة (`live_status='ended'`, `ended_at=NOW()`)
4. `app/academy/teacher/live/page.tsx` — UI كامل لاختيار جلسة + بدء/إنهاء + عرض الحضور

### Phase 2 — Admin Fiqh Dashboard
1. توسعة `GET /api/academy/admin/fiqh` بفلاتر: `status`, `category`, `priority`, `assigned_to`
2. إضافة `PATCH /api/academy/admin/fiqh/[id]` للإجابة + التعيين + تغيير الحالة
3. تحديث `app/academy/admin/fiqh/page.tsx` بـ tabs (pending/answered/all) + dialog للرد

### Phase 3 — Teacher Profile ✅
1. `app/api/academy/teacher/profile/route.ts` (جديد)
   - GET → يقرأ من `users` (bio, specialization, years_of_experience, certifications[], subjects[], is_verified, is_accepting_students, total_students, total_courses, rating)
   - PATCH → يحدّث الحقول مع validation
2. `app/academy/teacher/profile/page.tsx` — صفحة كاملة:
   - Avatar upload (يستخدم `<AvatarUpload>` الموجود)
   - Stats cards (students/courses/rating)
   - Form: name, phone, specialization, years_exp, bio, subjects (multi-select chips), certifications (add/remove), accepting_students toggle
   - Change password form

### Phase 4 — Parent Approval System ✅
1. `POST /api/academy/parent/link-child`:
   - `POST { student_email | student_id }` → ينشئ row في `parent_children` بـ `status='pending'` + يولد `approval_token`
   - يضيف notification للطالب
2. `PATCH /api/academy/parent/link-child { request_id, action: 'approve'|'reject', token? }` — لو الطالب وافق
3. `GET /api/academy/parent/children` — يفلتر بـ `status='approved'` + يرجع أيضاً عدد `pending`
4. صفحة `/academy/student/parent-requests` (لو احتجناها) لعرض الطلبات للطالب

### Phase 5 — Gamification System
1. helper `lib/gamification.ts` — `awardPoints(userId, points, reason)`, `checkBadges(userId)`
2. ربط النقاط بأحداث:
   - حضور جلسة → +5 نقاط
   - تسليم واجب → +10 نقاط
   - إجابة سؤال فقه → +3 نقاط (للطالب)
3. تحسين `GET /api/academy/student/points` ليرجع streak, level, recent transactions
4. شارات (badges) auto-award لما يوصل نقاط معينة

### Phase 6 — Supervisor Verification + DB Migration ✅
1. `scripts/015-features-and-enhancements.sql` — كل الـ ALTER TABLE statements
2. صفحة `/academy/supervisor/teachers` لعرض المدرسين المنتظرين الاعتماد
3. API `PATCH /api/academy/supervisor/verify-teacher { teacher_id, action }` لتفعيل `is_verified`

## 8. الـ Files اللي تم إنشاؤها/تعديلها فعلاً

### Created
- ✅ `scripts/015-features-and-enhancements.sql` (256 lines)
- ✅ `app/api/academy/student/calendar/route.ts` (138 lines)
- ✅ `app/api/academy/teacher/profile/route.ts` (129 lines)

### Modified
- ✅ `app/academy/student/calendar/page.tsx` — استبدال mockEvents بـ API fetch + loading state
- ✅ `app/api/academy/teacher/live-session/route.ts` — إعادة كتابة كاملة (GET/POST/PATCH)
- ✅ `app/academy/teacher/live/page.tsx` — UI كامل
- ✅ `app/academy/teacher/profile/page.tsx` — استبدال `export default ProfilePage` بصفحة كاملة (450+ lines)
- ✅ `app/api/academy/parent/link-child/route.ts` — workflow approval
- ✅ `app/api/academy/parent/children/route.ts` — فلترة بالـ status

### Pending (Phases 2 + 5)
- ⏳ Phase 2: `/api/academy/admin/fiqh` PATCH + `app/academy/admin/fiqh/page.tsx` upgrade
- ⏳ Phase 5: `lib/gamification.ts` + ربط النقاط
- ⏳ Phase 6 UI: `/academy/supervisor/teachers` + verify API

## 9. Coding Conventions (مهم للموديل القادم)

### استدعاء الـ DB
```ts
import { query } from '@/lib/db'

const result = await query<{ id: string; name: string }>(
  `SELECT id, name FROM users WHERE id = $1`,
  [userId]
)
// result.rows[0]
```

### حماية الـ APIs
```ts
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // ...
}
```

### i18n في الـ pages
```tsx
'use client'
import { useI18n } from '@/lib/i18n/context'

const { t, locale } = useI18n()
const isAr = locale === 'ar'

return <div dir={isAr ? 'rtl' : 'ltr'}>{isAr ? 'مرحبا' : 'Hello'}</div>
```

### Design Tokens
- ألوان: استخدم `bg-primary`, `text-foreground`, `bg-muted`, `border-border` — **ممنوع** ألوان مباشرة زي `bg-white` أو `text-black`
- Radius: `rounded-3xl` للـ cards الكبيرة, `rounded-2xl` للمكونات الداخلية, `rounded-full` للـ chips
- Typography: `font-black` للـ headings, `font-bold` للـ subheadings, `font-medium` للـ body, `font-sans` افتراضي
- Spacing: gap-{2,3,4,6,8} و p-{4,5,6} ملتزم بالـ scale

## 10. Pitfalls & Gotchas
1. **Path absolute مهم** — كل الـ tools لازم تستخدم `/vercel/share/v0-project/...`
2. **Read قبل Edit** — أي ملف لازم تقراه قبل ما تعدله، حتى لو عدلته قبل كده
3. **`mockEvents` كان موجود في صفحة الـ calendar في مكانين** (desktop view + mobile view) — لازم تستبدلهم الاتنين
4. **`teacher/profile/page.tsx` كان `export default ProfilePage`** — لازم استبدال كامل، مش edit جزئي
5. **`parent_children` جدول موجود فعلاً** — مجرد إضافة أعمدة، مش CREATE TABLE جديد
6. **AvatarUpload component موجود** في `components/avatar-upload.tsx` — استخدمه بدل ما تعمل واحد
7. **`AcademyDashboardShell` يلف كل صفحات /academy** — التنقل (sidebar) موجود فيه

## 11. Migration Order (لما المستخدم يجي يطبق على الداتا بيز)
```bash
# 1. Schema الأساسي (لو مش متطبق)
psql -f scripts/001-schema.sql
psql -f scripts/004-phase4-parent-student-relations.sql
psql -f scripts/011-academy-expansion.sql
psql -f scripts/A-missing-schema.sql

# 2. التعديلات الجديدة
psql -f scripts/015-features-and-enhancements.sql
```

## 12. Next Steps للموديل القادم
1. اقرأ هذا الملف بالكامل
2. اقرأ `scripts/015-features-and-enhancements.sql` عشان تعرف الـ schema النهائي
3. اقرأ الـ files المعدلة في القسم 8 عشان تعرف الـ patterns
4. كمل Phase 2 (Admin Fiqh upgrade) و Phase 5 (Gamification) و Phase 6 UI (Supervisor verification)
5. اختبر بـ `pnpm dev` (lockfile = pnpm-lock.yaml)

---
**آخر تحديث:** بعد انتهاء Phases 1, 3, 4, 6 (DB only)
