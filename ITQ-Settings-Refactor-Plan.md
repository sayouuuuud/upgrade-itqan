# خطة إعادة هيكلة الإعدادات عبر المنصات الثلاث (Handoff → Sonnet)

> الهدف: فصل إعدادات النظام بوضوح بين الأدمنات الثلاثة **بدون تكرار وبدون عشوائية**.
> - **المدير العام (Super Admin):** إعدادات عامة على مستوى الموقع كله فقط (هوية الموقع، الأمان والخصوصية، الإشعارات والبريد/SMTP، الصيانة، التخزين). لا يدخل في تخصصات المقرأة أو الأكاديمية.
> - **مدير المقرأة (Maqraa Admin):** إعدادات المقرأة فقط (المقرئون، الحلقات، التلاوات، المسارات، النقاط، المسابقات، أحداث إشعارات المقرأة).
> - **مدير الأكاديمية (Academy Admin):** إعدادات الأكاديمية فقط (التسجيل، الدورات، الجلسات، النقاط، المنتدى/الفقه، أحداث إشعارات الأكاديمية).

هذه الوثيقة موجّهة لموديل ينفّذ التغيير خطوة بخطوة. نفّذ الـ Milestones **بالترتيب**، ولا تبدأ Milestone قبل اجتياز "معايير القبول" للسابق.

---

## 1) الوضع الحالي (تشخيص المشكلة)

### أشجار المسارات
- `/admin/*` = شجرة موحّدة يستخدمها Super Admin و Maqraa Admin عبر نظام "الوضع/Mode" (كوكي `itqan-admin-mode`: `super | maqraa | academy`).
- `/academy/admin/*` = شجرة منفصلة خاصة بالأكاديمية.
- لا توجد صفحة إعدادات مخصّصة للمقرأة.

### مصادر الحقيقة الحالية
| العنصر | المسار | المحتوى الحالي | المشكلة |
|---|---|---|---|
| صفحة إعدادات "النظام" | `app/admin/settings/page.tsx` (اسم الكومبوننت `MaqraahAdminSettingsPage`) | تبويبات: system, readers, halaqat, recitations, paths, gamification, competitions, notifications, security, maintenance | مختلطة: تخصص مقرأة + إعدادات موقع عامة، ومعروضة للمدير العام تحت "إعدادات المنصة" |
| Hook | `app/admin/settings/hooks/use-maqraah-settings.ts` | كل مفاتيح `maqraah_*` + مفاتيح عامة | يخلط العام بالتخصصي |
| API | `app/api/admin/settings/route.ts` | يقرأ `maqraah_%` + مفاتيح عامة، الحارس `requireRole(["admin"])` فقط | Maqraa Admin لا يستطيع الوصول (401) |
| صفحة الأكاديمية | `app/academy/admin/settings/page.tsx` | general, registration, courses, sessions, gamification, notifications, forum, security, maintenance | تكرار: general(هوية)، security، maintenance، SMTP — وكلها من اختصاص المدير العام |
| Hook أكاديمية | `app/academy/admin/settings/hooks/use-academy-settings.ts` | كل مفاتيح `academy_*` + `smtp_config` | يكرر SMTP والأمان والصيانة |
| API أكاديمية | `app/api/academy/admin/settings/route.ts` | يقرأ `academy_%` + `smtp_config/storage_config/app_url` | يكرر إدارة SMTP |
| السايدبار/التنقل | `components/dashboard-shell.tsx` | `getSuperConfig` يربط "إعدادات المنصة" بـ `/admin/settings`؛ `MAQRAA_EXCLUDED_HREFS` يستبعد `/admin/settings` من وضع المقرأة | المقرأة بلا صفحة إعدادات إطلاقاً؛ المدير العام يرى تخصص المقرأة |
| الأدوار | `lib/admin/roles.ts` | `SUPER_ADMIN_ONLY_PREFIXES` لا يحتوي `/admin/settings` | الإعداد العام غير محمي كـ super-only |

### التكرار المكتشف (المطلوب إزالته)
- الهوية العامة مكرّرة في: `maqraah_general_*` + `academy_general_*` + مفاتيح عامة (`branding`, `contact_info`, `social_links`, `app_url`).
- الأمان مكرّر في: `maqraah_security_*` + `academy_security_*`.
- الصيانة مكرّرة في: `maqraah_maintenance_*` + `academy_maintenance_*`.
- SMTP: مفتاح واحد مشترك `smtp_config` **لكن** واجهة تحريره ظاهرة في صفحتَي المقرأة والأكاديمية (تكرار في الـ UI).

---

## 2) مصفوفة الملكية النهائية (Source of Truth)

بعد التنفيذ، كل مفتاح له **مالك واحد فقط**.

### أ) المدير العام — مفاتيح عامة على مستوى الموقع (Prefix جديد `system_*` + المفاتيح العامة القائمة)
| المجال | المفاتيح النهائية | مصدر القيمة عند الترحيل |
|---|---|---|
| هوية الموقع | `system_site_name`, `system_site_description`, `system_timezone`, `system_default_language`, `system_default_direction` + العامة القائمة `branding`, `contact_info`, `social_links`, `app_url` | من `maqraah_general_*` (الأساس)، واحتياط `academy_general_*` |
| الإشعارات والبريد | `smtp_config` (عام)، `system_notifications_in_app_enabled`, `system_notifications_email_enabled` | من `maqraah_notifications_in_app_enabled/email_enabled` |
| الأمان والخصوصية | `system_security_session_timeout`, `system_security_max_login_attempts`, `system_security_lock_duration`, `system_security_admin_2fa`, `system_security_admin_ip_whitelist`, `system_security_api_rate_limit`, `system_security_password_policy`, `system_security_activity_logs_enabled`, `system_security_daily_upload_limit_mb` | من `maqraah_security_*` (الأساس)، واحتياط `academy_security_*` |
| الصيانة | `system_maintenance_mode`, `system_maintenance_message`, `system_maintenance_allowed_ips` | من `maqraah_maintenance_*` |
| التخزين | `storage_config` (عام) | كما هو |

### ب) مدير المقرأة — تخصصي فقط (يبقى Prefix `maqraah_*`)
`maqraah_readers_*`, `maqraah_halaqat_*`, `maqraah_recitations_*`, `maqraah_paths_*`, `maqraah_points_*`, `maqraah_competitions_*`, `maqraah_notifications_events`, `maqraah_notifications_parent_report_*`, `maqraah_notifications_session_reminder_hour`, `reader_assignment_strategy`.
**يُحذف من ملكية المقرأة:** `maqraah_general_*`, `maqraah_security_*`, `maqraah_maintenance_*`, `maqraah_notifications_in_app_enabled/email_enabled` (انتقلت لـ system)، وأي إدارة لـ `smtp_config`.

### ج) مدير الأكاديمية — تخصصي فقط (يبقى Prefix `academy_*`)
`academy_registration_*`, `academy_courses_*`, `academy_sessions_*`, `academy_gamification_*`, `academy_forum_*`, `academy_fiqh_*`, `academy_notifications_events`, `academy_notifications_parent_report_*`, `academy_notifications_werd_reminder_time`.
**يُحذف من ملكية الأكاديمية:** `academy_general_*`, `academy_security_*`, `academy_maintenance_*`, `academy_notifications_in_app_enabled/email_enabled`، وأي إدارة لـ `smtp_config`.

> ملاحظة: تبويب "الإشعارات" في المقرأة والأكاديمية يعرض **مفاتيح الأحداث (events toggles) فقط** — بدون أي حقول SMTP. تحرير SMTP حصراً لدى المدير العام.

---

## Milestone 0 — تجميد وتوثيق المصفوفة
**العمل:**
1. اعتماد مصفوفة الملكية أعلاه كمرجع وحيد.
2. جرد كل قارئ للمفاتيح المنقولة (خارج صفحات الإعدادات) لتحديثه لاحقاً. القوائم المعروفة للفحص:
   - `app/maintenance/page.tsx`
   - `app/layout.tsx`
   - `app/api/public-settings/route.ts`
   - `app/api/internal/maintenance-status/route.ts`
   - `app/api/admin/branding/route.ts`
   - `app/api/admin/points/route.ts`, `app/api/academy/admin/points/route.ts`
   - `lib/settings.ts` (helpers: `getSetting`, `getSmtpUrl`, `getAppUrl`)
3. نفّذ بحثاً شاملاً: `maqraah_maintenance|academy_maintenance|maqraah_security|academy_security|maqraah_general|academy_general` وسجّل كل ناتج.

**معيار القبول:** جدول نهائي "مفتاح قديم → مفتاح جديد → الملفات المستهلكة".

---

## Milestone 1 — ترحيل قاعدة البيانات
**ملف جديد:** `scripts/067-settings-ownership-split.sql` (idempotent).

**العمل:**
1. إدراج/ترحيل مفاتيح `system_*` الجديدة بقيَم منقولة من نظيراتها في `maqraah_*` عبر `INSERT ... SELECT` مع `COALESCE`، ثم `ON CONFLICT (setting_key) DO NOTHING`.
   - مثال: `system_maintenance_mode` تأخذ قيمة `maqraah_maintenance_mode`.
   - `system_security_*` تأخذ قيم `maqraah_security_*`.
   - `system_site_name` تأخذ قيمة `maqraah_general_name`، إلخ.
2. `setting_type` buckets الجديدة: `system_general`, `system_security`, `system_maintenance`, `system_notifications` (التحقق على مستوى التطبيق فقط — قيد الـ CHECK محذوف منذ Migration 042).
3. حذف المفاتيح المكرّرة بعد نقل القيم (لتحقيق "بدون تكرار"):
   `DELETE FROM system_settings WHERE setting_key LIKE 'academy_security_%' OR setting_key LIKE 'academy_maintenance_%' OR setting_key LIKE 'academy_general_%' OR setting_key LIKE 'maqraah_security_%' OR setting_key LIKE 'maqraah_maintenance_%' OR setting_key LIKE 'maqraah_general_%' OR setting_key IN ('maqraah_notifications_in_app_enabled','maqraah_notifications_email_enabled');`
   > نفّذ الحذف **في نهاية السكربت فقط بعد التأكد من نجاح الإدراج**، وأبقِ نسخة احتياطية (Milestone 0) للرجوع.
4. `smtp_config`, `storage_config`, `app_url`, `branding`, `contact_info`, `social_links` تبقى كما هي (عامة).

**التنفيذ:** عبر أداة Supabase MCP (هذا المشروع متصل بـ Supabase). لا تستخدم ORM.

**معيار القبول:** استعلام تحقّق يُظهر وجود مفاتيح `system_*` بقِيَم صحيحة، وعدم وجود أي `*_security_*`/`*_maintenance_*`/`*_general_*` مكرّرة تخصصية.

---

## Milestone 2 — طبقة الـ API (ثلاث نقاط نهاية نظيفة)
1. **`app/api/admin/settings/route.ts` (المدير العام):**
   - يقرأ/يكتب فقط: `system_%`, `smtp_config`, `storage_config`, `app_url`, `branding`, `contact_info`, `social_links`.
   - `resolveSettingType`: يقبل بادئات `system_general/security/maintenance/notifications` + المفاتيح العامة، ويرفض ما عداها.
   - الحارس: `requireRole(session, ["admin","super_admin"])`.
2. **`app/api/maqraah/admin/settings/route.ts` (جديد):**
   - انسخ نمط الأكاديمية. يقرأ/يكتب فقط `maqraah_%` (باستثناء ما انتقل لـ system) + `reader_assignment_strategy`.
   - الحارس: `requireRole(session, ["admin","super_admin","maqraa_admin"])`.
   - انقل مسارات `test-email` (إن لزم) — الأفضل: إبقاء اختبار SMTP لدى المدير العام فقط.
3. **`app/api/academy/admin/settings/route.ts` (تعديل):**
   - أزل `smtp_config`/`storage_config` من الخريطة، وأزل بادئات `academy_security_/academy_maintenance_/academy_general_` من `resolveSettingType`.
   - أبقِ فقط: `academy_registration_/courses_/sessions_/gamification_/notifications_/forum_`.

**معيار القبول:** كل نقطة نهاية ترفض مفاتيح خارج نطاقها (`rejectedKeys`)، والحُرّاس صحيحون لكل دور.

---

## Milestone 3 — صفحة المدير العام (عامة فقط)
**الملفات:**
- `app/admin/settings/page.tsx` — أعِد كتابتها. التبويبات النهائية فقط: **هوية الموقع (System)**, **الإشعارات والبريد/SMTP**, **الأمان والخصوصية**, **الصيانة**, **التخزين**.
- Hook جديد `app/admin/settings/hooks/use-system-settings.ts` (بادئات `system_*` + المفاتيح العامة) بدل `use-maqraah-settings.ts`.
- استعمل الكومبوننتس القائمة بعد تنقيتها: `system-settings.tsx`, `notifications-settings.tsx` (SMTP), `security-settings.tsx`, `maintenance-settings.tsx` — واربطها بمفاتيح `system_*`.
- احذف من هذه الصفحة تبويبات: readers, halaqat, recitations, paths, gamification, competitions.

**معيار القبول:** المدير العام يرى 5 تبويبات عامة فقط، الحفظ يعمل ويُخزّن في `system_*`.

---

## Milestone 4 — صفحة مدير المقرأة (جديدة، تخصصية)
**الملفات:**
- مسار جديد `app/admin/maqraah-settings/page.tsx` (داخل شجرة `/admin` لأن المقرأة تعمل ضمن وضع maqraa) + `loading.tsx`.
- انقل الكومبوننتس التخصصية من `app/admin/settings/_components/` إلى `app/admin/maqraah-settings/_components/`: `readers`, `halaqat`, `recitations`, `paths`, `gamification`, `competitions` + تبويب إشعارات (أحداث فقط) + `section-card.tsx`.
- Hook `use-maqraah-settings.ts` منقول ومعدّل ليشير إلى `/api/maqraah/admin/settings`، وتُزال منه مفاتيح `maqraah_general_*/security_*/maintenance_*` و SMTP.
- التبويبات: readers, halaqat, recitations, paths, gamification, competitions, notifications(events).

**معيار القبول:** Maqraa Admin يفتح الصفحة ويحفظ إعدادات المقرأة فقط بلا 401 وبلا حقول عامة.

---

## Milestone 5 — تقليم صفحة الأكاديمية (تخصصية فقط)
**الملفات:**
- `app/academy/admin/settings/page.tsx` — أزل تبويبات: general(الهوية), security, maintenance. أبقِ: registration, courses, sessions, gamification, notifications(events), forum/fiqh.
- `app/academy/admin/settings/hooks/use-academy-settings.ts` — احذف مفاتيح `academy_general_*/security_*/maintenance_*` و `smtp_config` من الـ interface والـ defaults.
- `notifications-email-settings.tsx` — أزل قسم SMTP وأبقِ toggles الأحداث فقط. (احذف الاستيراد بعد إزالة الاستخدام).
- احذف `_components/security-privacy-settings.tsx` و `maintenance-settings.tsx` (الأكاديمية) بعد إزالة استخدامها.

**معيار القبول:** Academy Admin يرى تبويبات تخصصية فقط، لا SMTP ولا أمان ولا صيانة.

---

## Milestone 6 — التنقل والحُرّاس
**الملفات:**
- `components/dashboard-shell.tsx`:
  - **Maqraa mode:** أضف عنصر إعدادات يشير إلى `/admin/maqraah-settings` (لا تُزل استبعاد `/admin/settings` — يبقى super-only).
  - **Super mode:** أبقِ `/admin/settings` (أصبح عاماً).
  - **Academy mode:** أبقِ `/academy/admin/settings` (بعد التقليم).
- `lib/admin/roles.ts`: أضف `/admin/settings` إلى `SUPER_ADMIN_ONLY_PREFIXES`. تأكد أن `/admin/maqraah-settings` غير محظور على المقرأة.
- أضف حارس/redirect على مستوى الصفحة لكل مسار إعدادات حسب الدور/الوضع.

**معيار القبول:** كل دور يرى في السايدبار رابط إعداداته فقط، ولا يستطيع فتح إعدادات غيره.

---

## Milestone 7 — تحديث المستهلكين + i18n + التحقق
**العمل:**
1. حدّث كل قارئ للمفاتيح المنقولة إلى المفاتيح الجديدة `system_*`:
   - `app/maintenance/page.tsx`, `app/api/internal/maintenance-status/route.ts`, `app/layout.tsx` → `system_maintenance_*`.
   - أي فحص أمان/جلسة → `system_security_*`.
   - `app/api/public-settings/route.ts`, `app/api/admin/branding/route.ts` → مفاتيح الهوية العامة/`branding`.
2. أضف مفاتيح i18n الناقصة (تبويبات إعدادات المقرأة الجديدة + تبويبات النظام) في `lib/i18n/config.ts`.
3. نظّف الاستيرادات الميتة و`index.ts` في مجلدات الكومبوننتس المنقولة.
4. تحقّق في المتصفح (agent-browser) بالحسابات الثلاثة:
   - `superadmin@itqan.com` → 5 تبويبات عامة فقط.
   - `maqraaadmin@itqan.com` → إعدادات المقرأة فقط.
   - `academyadmin@itqan.com` → إعدادات الأكاديمية فقط.
   - تأكد: لا تكرار، الحفظ يثبت بعد إعادة التحميل، وضع الصيانة العام يعمل.
5. حدّث `v0_memories/user/CURRENT_STATE.md` بالتغيير.

**معيار القبول:** لا أخطاء بناء/تشغيل، لا مفاتيح مكرّرة، كل أدمن معزول في نطاقه.

---

## 3) قواعد تنفيذ إلزامية (لتفادي الأخطاء)
- **الترتيب صارم:** DB → API → Pages → Navigation → Consumers → Verify.
- **الحذف بأمان:** أزِل الاستخدام أولاً ثم الاستيراد ثم الملف. لا تحذف مفتاح DB قبل نقل قيمته.
- **قابلية الرجوع:** خذ نسخة احتياطية للإعدادات قبل أي `DELETE`.
- **لا ORM** مع Supabase — استخدم SQL عبر MCP و`lib/db`.
- **الحُرّاس:** كل API يتحقق من الدور، وكل صفحة تتحقق من الوضع/الدور.
- **بدون تكرار:** المفتاح الواحد يُقرأ ويُكتب من مالك واحد فقط.
- تحقّق بعد كل Milestone قبل الانتقال للتالي.
