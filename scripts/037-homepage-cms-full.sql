-- ============================================================================
-- 037-homepage-cms-full.sql
-- Full Homepage CMS seed.
--
-- Makes EVERY piece of the public homepage (app/page.tsx) editable from
-- /admin/homepage and stored in `system_settings` (setting_type = 'homepage').
--
-- - Text values are bilingual JSON: {"ar": "...", "en": "..."}.
-- - Repeating sections (stats, features, journey, testimonials, footer, nav,
--   pillars) are stored as JSON arrays/objects of bilingual values.
-- - Colors are 8 BASE colors; all other shades are derived in CSS via
--   color-mix(), so changing a base color cascades automatically.
--
-- Idempotent: ON CONFLICT DO NOTHING so existing admin edits are preserved.
-- Run this once manually after deploying the code.
-- ============================================================================

-- Make sure the homepage settings carry the right type (harmless if already set).
UPDATE system_settings SET setting_type = 'homepage'
WHERE setting_key LIKE 'homepage\_%' ESCAPE '\';

-- ---------------------------------------------------------------------------
-- Brand / navbar
-- ---------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type) VALUES
('homepage_brand_name',    '{"ar":"متقن","en":"Itqan"}', 'homepage'),
('homepage_brand_tagline', '{"ar":"Itqan Platform","en":"Itqan Platform"}', 'homepage'),
('homepage_login_text',    '{"ar":"دخول","en":"Login"}', 'homepage'),
('homepage_register_text', '{"ar":"التسجيل","en":"Register"}', 'homepage'),
('homepage_register_short','{"ar":"تسجيل","en":"Sign up"}', 'homepage'),
('homepage_nav', '[
  {"href":"#sections","label":{"ar":"المنصات","en":"Platforms"}},
  {"href":"#features","label":{"ar":"المميزات","en":"Features"}},
  {"href":"#journey","label":{"ar":"المسار","en":"Journey"}},
  {"href":"#voices","label":{"ar":"آراؤهم","en":"Voices"}}
]', 'homepage')
ON CONFLICT (setting_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Hero
-- ---------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type) VALUES
('homepage_hero_bismillah', '{"ar":"بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيم","en":"In the Name of Allah, the Most Gracious, the Most Merciful"}', 'homepage'),
('homepage_hero_title',     '{"ar":"إتقانُ التِلاوة","en":"Mastering Recitation"}', 'homepage'),
('homepage_hero_subtitle',  '{"ar":"ورحلةُ التَعَلُّم","en":"and the Journey of Learning"}', 'homepage'),
('homepage_hero_description','{"ar":"مِنبرٌ علميٌّ يجمع بين أكاديميَّةٍ راسخةٍ للدُّروسِ والشَّهادات، ومَقْرأةٍ روحانيَّةٍ للحفظِ والتَّسميعِ بإشرافِ المقرِئينَ المُجازين.","en":"An academic platform that unites a structured academy for lessons and certificates with a spiritual Maqra’ah for memorization and recitation, supervised by certified reciters."}', 'homepage'),
('homepage_cta_primary_text',   '{"ar":"الأكاديميَّة","en":"The Academy"}', 'homepage'),
('homepage_cta_primary_link',   '"/academy/student"', 'homepage'),
('homepage_cta_secondary_text', '{"ar":"المَقْرأة","en":"The Maqra’ah"}', 'homepage'),
('homepage_cta_secondary_link', '"/student"', 'homepage'),
('homepage_scroll_text',        '{"ar":"تَصَفَّح","en":"Scroll"}', 'homepage'),
('homepage_stats', '[
  {"v":12500,"s":"+","label":{"ar":"طالب وطالبة","en":"Students"}},
  {"v":320,"s":"+","label":{"ar":"معلِّم ومُقرئ","en":"Teachers & reciters"}},
  {"v":85,"s":"%","label":{"ar":"نسبة الإتقان","en":"Mastery rate"}},
  {"v":24,"s":"/7","label":{"ar":"متابعة دائمة","en":"Always-on support"}}
]', 'homepage')
ON CONFLICT (setting_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Two pillars
-- ---------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type) VALUES
('homepage_pillars_eyebrow',  '{"ar":"المنصَّتان","en":"The Two Platforms"}', 'homepage'),
('homepage_pillars_title',    '{"ar":"طريقانِ نحوَ الإتقان","en":"Two Paths to Mastery"}', 'homepage'),
('homepage_pillars_subtitle', '{"ar":"اخترْ مسارَك الذي يُلائمُ هِمَّتَكَ ووقتَك","en":"Choose the path that fits your ambition and time"}', 'homepage'),
('homepage_pillar_academy', '{
  "number":{"ar":"٠١","en":"01"},
  "badge":{"ar":"القسم الأول","en":"Section One"},
  "title":{"ar":"الأكاديميَّة","en":"The Academy"},
  "desc":{"ar":"مَدْرسةٌ افتراضيَّةٌ منظَّمة، بدوراتٍ مُتدرِّجةٍ في علوم القرآن والتجويد والفقه، تُتوَّجُ بشهاداتٍ وإجازاتٍ معتمدة.","en":"A structured virtual school with progressive courses in Qur’anic sciences, tajwid and fiqh, crowned with accredited certificates and ijazahs."},
  "cta":{"ar":"دخول الأكاديميَّة","en":"Enter the Academy"},
  "link":"/academy/student",
  "features":[
    {"t":{"ar":"مناهجُ متدرِّجة","en":"Progressive curricula"},"d":{"ar":"من المبتدئ إلى الإجازة","en":"From beginner to ijazah"}},
    {"t":{"ar":"شهاداتٌ معتمدة","en":"Accredited certificates"},"d":{"ar":"موثَّقةٌ بختمِ الأكاديميَّة","en":"Sealed by the Academy"}},
    {"t":{"ar":"إشرافٌ مباشر","en":"Direct supervision"},"d":{"ar":"أساتذةٌ مُجازون","en":"Certified instructors"}}
  ]
}', 'homepage'),
('homepage_pillar_maqraa', '{
  "number":{"ar":"٠٢","en":"02"},
  "badge":{"ar":"القسم الثاني","en":"Section Two"},
  "title":{"ar":"المَقْرأة","en":"The Maqra’ah"},
  "desc":{"ar":"مجلسٌ روحانيٌّ مُباشَر، تَعْرضُ تِلاوتَكَ على المُقرئِ المُجاز، فيُصحِّحُ ويُتابعُ ويُجيز.","en":"A live, spiritual circle where you recite to a certified reciter who corrects, follows up, and grants ijazah."},
  "cta":{"ar":"دخول المَقْرأة","en":"Enter the Maqra’ah"},
  "link":"/student",
  "features":[
    {"t":{"ar":"تَسميعٌ مُباشر","en":"Live recitation"},"d":{"ar":"بصوتِكَ وبتفاعلٍ حيّ","en":"Your voice, live feedback"}},
    {"t":{"ar":"حَجزٌ مَرِن","en":"Flexible booking"},"d":{"ar":"مواعيدُ تُناسبُك","en":"Times that suit you"}},
    {"t":{"ar":"مُتابعةُ الحفظ","en":"Memorization tracking"},"d":{"ar":"تقدُّمٌ مُسجَّلٌ كلَّ جلسة","en":"Progress logged each session"}}
  ]
}', 'homepage')
ON CONFLICT (setting_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Features
-- ---------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type) VALUES
('homepage_features_eyebrow',  '{"ar":"المميزات","en":"Features"}', 'homepage'),
('homepage_features_title',    '{"ar":"تجربةٌ مُتكاملة بِتفاصيلَ مَدروسة","en":"A complete experience, thoughtfully detailed"}', 'homepage'),
('homepage_features_subtitle', '{"ar":"كلُّ ميزةٍ صُمِّمَت لِتُلامسَ احتياجَ الطالب، فلا تَكلُّفَ ولا تَعقيد، بل أدواتٌ صريحةٌ تُعينُك على الإتقان.","en":"Every feature is designed around the student’s needs — no clutter, no complexity, just clear tools that help you master your recitation."}', 'homepage'),
('homepage_features', '[
  {"num":{"ar":"٠١","en":"01"},"t":{"ar":"حَلَقاتٌ مرئيَّة","en":"Video circles"},"d":{"ar":"جلساتٌ مباشرةٌ بصوتٍ وصورةٍ، تَحاكي الحَلْقةَ التقليديَّة في رحابِ المساجد.","en":"Live audio-video sessions that recreate the traditional circle of the mosques."}},
  {"num":{"ar":"٠٢","en":"02"},"t":{"ar":"تَسجيلُ التِّلاوة","en":"Recitation recording"},"d":{"ar":"سجِّل تِلاوتَكَ في أيِّ وقت، وأرسلْها للمُقرئ ليُصحِّحَ ويُعلِّقَ على كلِّ آية.","en":"Record your recitation anytime and send it to a reciter to correct and comment on every verse."}},
  {"num":{"ar":"٠٣","en":"03"},"t":{"ar":"مُتابعةُ التَّقدُّم","en":"Progress tracking"},"d":{"ar":"إحصاءاتٌ دقيقةٌ تُظهِرُ مُعدَّلَ حِفظِك وإتقانِك أسبوعيًّا وشهريًّا.","en":"Precise analytics that show your memorization and mastery rate weekly and monthly."}},
  {"num":{"ar":"٠٤","en":"04"},"t":{"ar":"شهاداتٌ مُوثَّقة","en":"Verified certificates"},"d":{"ar":"عند إتمامِ مسارٍ تعليميٍّ، تَحصُلُ على شهادةٍ مَعزُوَّةٍ بختمِ الأكاديميَّة.","en":"On completing a learning path, you receive a certificate sealed by the Academy."}},
  {"num":{"ar":"٠٥","en":"05"},"t":{"ar":"حَجْزٌ مَرِن","en":"Flexible booking"},"d":{"ar":"اختر مُقرِئَكَ والوقتَ المُناسبَ لك من تقويمٍ ذكيٍّ يَعرضُ المتاحَ فقط.","en":"Pick your reciter and a suitable time from a smart calendar that shows only what’s available."}},
  {"num":{"ar":"٠٦","en":"06"},"t":{"ar":"مَكتبةٌ معرفيَّة","en":"Knowledge library"},"d":{"ar":"محاضراتٌ ومَقالاتٌ في علوم القرآن والفقه والتفسير، يتجدَّدُ مُحتواها أُسبوعيًّا.","en":"Lectures and articles in Qur’anic sciences, fiqh and tafsir, refreshed weekly."}}
]', 'homepage')
ON CONFLICT (setting_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Journey
-- ---------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type) VALUES
('homepage_journey_eyebrow',  '{"ar":"المسار","en":"The Path"}', 'homepage'),
('homepage_journey_title',    '{"ar":"كيف تَبدأُ رحلتَك","en":"How to begin your journey"}', 'homepage'),
('homepage_journey_subtitle', '{"ar":"أربعُ خطواتٍ هَيِّنات، وأنتَ في صَدرِ المَجلس","en":"Four easy steps and you’re in the front row"}', 'homepage'),
('homepage_journey_steps', '[
  {"n":{"ar":"١","en":"1"},"t":{"ar":"سَجِّل في المنصَّة","en":"Register on the platform"},"d":{"ar":"أنشئ حسابَكَ في دقائق، اختر منصَّتَك (الأكاديميَّة أو المَقْرأة أو كلتيهما)، وأَكمِل ملفَّكَ التعريفيَّ.","en":"Create your account in minutes, choose your platform (Academy, Maqra’ah, or both), and complete your profile."}},
  {"n":{"ar":"٢","en":"2"},"t":{"ar":"اخْتَر مُعلِّمَك","en":"Choose your teacher"},"d":{"ar":"تصفَّح قائمةَ الأساتذةِ والمُقرئين، اقرأْ سيرَهم وتقييماتِ طلَّابِهم، ثم اخترِ الأنسبَ لك.","en":"Browse the teachers and reciters, read their bios and student reviews, then choose who fits you best."}},
  {"n":{"ar":"٣","en":"3"},"t":{"ar":"احْجِزْ موعدَك","en":"Book your session"},"d":{"ar":"اختر اليومَ والساعةَ من تقويمِ المُعلِّم، فيَصلُكَ تَنبيهٌ قبلَ الجلسةِ بوقتٍ كافٍ.","en":"Pick the day and time from the teacher’s calendar and get a reminder well before the session."}},
  {"n":{"ar":"٤","en":"4"},"t":{"ar":"ابْدأْ في الإتقان","en":"Start mastering"},"d":{"ar":"احْضُرْ الجلساتِ، أَنجِزْ الواجبات، وَتابعْ تقدُّمَك حتى تَبلُغَ غايتَك بإذن الله.","en":"Attend the sessions, complete your assignments, and track your progress until you reach your goal, by Allah’s will."}}
]', 'homepage')
ON CONFLICT (setting_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Testimonials
-- ---------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type) VALUES
('homepage_testimonials_eyebrow', '{"ar":"آراؤهم","en":"Voices"}', 'homepage'),
('homepage_testimonials_title',   '{"ar":"كَلِماتٌ مِن طُلَّابِنا","en":"Words from our students"}', 'homepage'),
('homepage_testimonials_top', '[
  {"q":{"ar":"تجربةٌ أعادتْ لي شَغفي بالقرآن، فالأستاذُ يُتابعُ تِلاوتي حرفًا حرفًا، وأنا في بيتي.","en":"An experience that revived my passion for the Qur’an — the teacher follows my recitation letter by letter, from my own home."},"n":{"ar":"أحمد المصري","en":"Ahmad Al-Masri"},"r":{"ar":"طالبٌ في مسارِ الإجازة","en":"Ijazah-track student"}},
  {"q":{"ar":"حفظتُ ربعَ القرآن في ستَّةِ أشهرٍ بفضلِ المتابعةِ المُنظَّمةِ والمُقرئةِ المُتميِّزة.","en":"I memorized a quarter of the Qur’an in six months thanks to the organized follow-up and an excellent reciter."},"n":{"ar":"فاطمة الزهراء","en":"Fatimah Al-Zahraa"},"r":{"ar":"طالبةُ تحفيظ","en":"Memorization student"}},
  {"q":{"ar":"الجَودةُ، التَّنظيمُ، الاحترامُ في التعامل، كلُّ شيءٍ يَدلُّ على أنَّ القائمين أهلُ علمٍ وصِدق.","en":"Quality, organization, and respect — everything shows the team are people of knowledge and sincerity."},"n":{"ar":"د. خالد الأنصاري","en":"Dr. Khalid Al-Ansari"},"r":{"ar":"وَلِيُّ أمر","en":"Parent"}},
  {"q":{"ar":"ما مرَّ يومٌ بعد التحاقي بالمَقْرأة إلا وذُقتُ حلاوةَ القرآنِ من جديد.","en":"Not a day has passed since I joined the Maqra’ah without tasting the sweetness of the Qur’an anew."},"n":{"ar":"محمد العبسي","en":"Mohammed Al-Absi"},"r":{"ar":"طالبُ تجويد","en":"Tajwid student"}},
  {"q":{"ar":"المنصَّةُ راقيةٌ، والأساتذةُ مُجازون، والإدارةُ تَسمعُ لكلِّ مُلاحظةٍ بِصَدرٍ رَحب.","en":"A refined platform, certified teachers, and an administration that welcomes every note warmly."},"n":{"ar":"أم عبد الله","en":"Umm Abdullah"},"r":{"ar":"وَلِيَّةُ أمر","en":"Parent"}},
  {"q":{"ar":"أَخذتُ إجازتي في رواية حفصٍ هنا، بعد سنواتٍ من التشتُّتِ بين منصَّاتٍ أخرى.","en":"I earned my ijazah in the Hafs narration here, after years of drifting between other platforms."},"n":{"ar":"يوسف الإدريسي","en":"Yusuf Al-Idrisi"},"r":{"ar":"حاصلٌ على إجازة","en":"Ijazah holder"}},
  {"q":{"ar":"الجلساتُ المباشرةُ فيها رُوحٌ لا تَجدُها في أيِّ تسجيلٍ مُسبَّق.","en":"Live sessions carry a spirit you won’t find in any pre-recorded lesson."},"n":{"ar":"سارة المغربي","en":"Sara Al-Maghribi"},"r":{"ar":"طالبةُ تجويد","en":"Tajwid student"}},
  {"q":{"ar":"أَشعرُ أنَّ الأستاذَ يُكلِّمُني وحدي، كأنَّنا في حَلْقةٍ خاصَّة.","en":"I feel the teacher is speaking to me alone, as if we’re in a private circle."},"n":{"ar":"طارق الزيات","en":"Tariq Al-Zayyat"},"r":{"ar":"طالبٌ مبتدئ","en":"Beginner student"}},
  {"q":{"ar":"في أقلَّ من ثلاثةِ أشهرٍ صَحَّح لي المُقرئُ أخطاءً حملتُها سنين.","en":"In under three months the reciter corrected mistakes I’d carried for years."},"n":{"ar":"رانيا عبد الحميد","en":"Rania Abdulhamid"},"r":{"ar":"طالبةُ تحفيظ","en":"Memorization student"}},
  {"q":{"ar":"أجودُ ما قَضيتُه من وقتٍ هذا العام هو جلساتي في المَقْرأة.","en":"The best time I’ve spent this year is my sessions in the Maqra’ah."},"n":{"ar":"عمر سيد أحمد","en":"Omar Sayed Ahmed"},"r":{"ar":"طالبٌ في الإجازة","en":"Ijazah-track student"}},
  {"q":{"ar":"بعد سنواتٍ من البحثِ عن مُقرئٍ مُجاز، وجدتُ ضالَّتي هنا.","en":"After years of searching for a certified reciter, I found what I was looking for here."},"n":{"ar":"عائشة الحربي","en":"Aisha Al-Harbi"},"r":{"ar":"طالبةُ إجازة","en":"Ijazah student"}},
  {"q":{"ar":"أبنائي الثلاثةُ مُلتحقون بالأكاديميَّة ومستواهم في تَحسُّنٍ مُستمرّ.","en":"My three children are enrolled in the Academy and their level keeps improving."},"n":{"ar":"أبو يوسف","en":"Abu Yusuf"},"r":{"ar":"وَلِيُّ أمر","en":"Parent"}}
]', 'homepage'),
('homepage_testimonials_bottom', '[
  {"q":{"ar":"تجربةٌ مُختلفةٌ تمامًا، شعرتُ أنني في حَلْقةٍ حقيقيَّةٍ في أحدِ المساجدِ العَتيقة.","en":"A completely different experience — I felt I was in a real circle in one of the old mosques."},"n":{"ar":"هدى الشريف","en":"Huda Al-Sharif"},"r":{"ar":"طالبةُ علم","en":"Student of knowledge"}},
  {"q":{"ar":"كنتُ أبحثُ عن مَقْرأةٍ مُنضَبطةٍ منذُ زمن، فوجدتُ هنا ما يَفوقُ ما تَمنَّيت.","en":"I had long sought a disciplined Maqra’ah, and here I found more than I’d hoped for."},"n":{"ar":"إبراهيم الرفاعي","en":"Ibrahim Al-Rifai"},"r":{"ar":"طالبٌ في الإجازة","en":"Ijazah-track student"}},
  {"q":{"ar":"الواجباتُ مُحَكَّمة، والمُتابعةُ يوميَّة، والنتائجُ مُبشِّرةٌ بفضلِ الله.","en":"The assignments are rigorous, the follow-up is daily, and the results are promising, by Allah’s grace."},"n":{"ar":"نوال البصري","en":"Nawal Al-Basri"},"r":{"ar":"طالبةُ تحفيظ","en":"Memorization student"}},
  {"q":{"ar":"ما رأيتُ أَشمَلَ من هذه المنصَّةِ في الجَمعِ بين العلمِ النظريِّ والتطبيقيِّ.","en":"I’ve seen nothing more comprehensive than this platform in uniting theory and practice."},"n":{"ar":"د. صالح الشمري","en":"Dr. Saleh Al-Shammari"},"r":{"ar":"أستاذٌ مُحاضِر","en":"Lecturer"}},
  {"q":{"ar":"ابني تَغيَّرت علاقتُه بالقرآنِ بعد التحاقِه، صار يَنتظرُ الجلسةَ بشَغف.","en":"My son’s relationship with the Qur’an changed after joining — he now awaits each session eagerly."},"n":{"ar":"أم محمد","en":"Umm Mohammed"},"r":{"ar":"وَلِيَّةُ أمر","en":"Parent"}},
  {"q":{"ar":"خِدمةٌ مُتقَنةٌ من البدايةِ إلى النهاية، شُكرًا لكلِّ القائمين على هذا المشروع.","en":"A polished service from start to finish — thanks to everyone behind this project."},"n":{"ar":"عبد الرحمن الحارثي","en":"Abdulrahman Al-Harithi"},"r":{"ar":"خرِّيج","en":"Graduate"}},
  {"q":{"ar":"الانتظامُ في الجلساتِ جعلَ حفظي أمتنَ وتلاوتي أصفى من أيِّ وقتٍ مضى.","en":"Consistent sessions made my memorization firmer and my recitation clearer than ever."},"n":{"ar":"منى القرشي","en":"Mona Al-Qurashi"},"r":{"ar":"طالبةُ تحفيظ","en":"Memorization student"}},
  {"q":{"ar":"المُقرئُ يَشرحُ المَخارجَ بأسلوبٍ واضحٍ لم أَجدْه في مكانٍ آخر.","en":"The reciter explains the points of articulation with a clarity I haven’t found elsewhere."},"n":{"ar":"بلال حسين","en":"Bilal Hussein"},"r":{"ar":"طالبُ تجويد","en":"Tajwid student"}},
  {"q":{"ar":"من أفضلِ قراراتي الانضمامُ للأكاديميَّة، والنتائجُ تَتكلَّمُ عن نفسها.","en":"Joining the Academy was one of my best decisions, and the results speak for themselves."},"n":{"ar":"لينا الحمداني","en":"Lina Al-Hamdani"},"r":{"ar":"طالبةٌ في مسارِ الإجازة","en":"Ijazah-track student"}},
  {"q":{"ar":"كلُّ جلسةٍ فيها علمٌ وأدبٌ وبركة، اللهُ يُجزي القائمين خيرًا.","en":"Every session holds knowledge, manners, and blessing — may Allah reward the team well."},"n":{"ar":"حسام الدين عوض","en":"Hossam Eldin Awad"},"r":{"ar":"طالبٌ متقدِّم","en":"Advanced student"}},
  {"q":{"ar":"تَعلَّمتُ أحكامَ التجويدِ بطريقةٍ سَلِسةٍ لم أتوقَّعها من قبل.","en":"I learned the rules of tajwid in a smooth way I never expected."},"n":{"ar":"مريم الأحمد","en":"Maryam Al-Ahmad"},"r":{"ar":"طالبةُ تجويد","en":"Tajwid student"}},
  {"q":{"ar":"المنصَّةُ سَهَّلت عليَّ الجَمعَ بين العملِ والدراسةِ القرآنيَّة.","en":"The platform made it easy to combine work with Qur’anic study."},"n":{"ar":"ماجد العنزي","en":"Majed Al-Anazi"},"r":{"ar":"طالبٌ عامل","en":"Working student"}}
]', 'homepage')
ON CONFLICT (setting_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Final CTA
-- ---------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type) VALUES
('homepage_cta_title', '{"ar":"ابْدَأْ رحلتَك اليومَ","en":"Begin your journey today"}', 'homepage'),
('homepage_cta_desc',  '{"ar":"انضمَّ إلى آلاف الطلَّابِ الذينَ بَدَؤوا رحلتَهم نحو إتقانِ كتابِ الله، ولا تَنْسَ أنَّ","en":"Join thousands of students who have begun their journey toward mastering the Book of Allah, and never forget that"}', 'homepage'),
('homepage_cta_hadith','{"ar":"«خيرُكم مَن تَعَلَّمَ القرآنَ وعَلَّمَه»","en":"“The best of you are those who learn the Qur’an and teach it.”"}', 'homepage'),
('homepage_cta_button_primary',        '{"ar":"سَجِّل مَجَّانًا","en":"Register for free"}', 'homepage'),
('homepage_cta_button_primary_link',   '"/register"', 'homepage'),
('homepage_cta_button_secondary',      '{"ar":"لديَّ حسابٌ بالفعل","en":"I already have an account"}', 'homepage'),
('homepage_cta_button_secondary_link', '"/login"', 'homepage')
ON CONFLICT (setting_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Footer
-- ---------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type) VALUES
('homepage_footer_desc', '{"ar":"مِنبرٌ علميٌّ يجمع بين الأكاديميَّة الراسخة والمَقْرأة الروحانيَّة، لِيَكونَ صَرحًا متكاملًا لإتقانِ كتابِ الله.","en":"An academic platform uniting a solid academy with a spiritual Maqra’ah, to be a complete edifice for mastering the Book of Allah."}', 'homepage'),
('homepage_footer_columns', '[
  {"title":{"ar":"الأكاديميَّة","en":"The Academy"},"links":[
    {"label":{"ar":"لوحة التحكُّم","en":"Dashboard"},"href":"/academy/student"},
    {"label":{"ar":"الدَّورات","en":"Courses"},"href":"/academy/student/courses"},
    {"label":{"ar":"المَسار","en":"Path"},"href":"/academy/student/path"},
    {"label":{"ar":"الشَّهادات","en":"Certificates"},"href":"/academy/student/certificates"}
  ]},
  {"title":{"ar":"المَقْرأة","en":"The Maqra’ah"},"links":[
    {"label":{"ar":"لوحة التحكُّم","en":"Dashboard"},"href":"/student"},
    {"label":{"ar":"التَّسميعات","en":"Recitations"},"href":"/student/recitations"},
    {"label":{"ar":"حَجْزُ موعد","en":"Book a session"},"href":"/student/booking"},
    {"label":{"ar":"التَّقدُّم","en":"Progress"},"href":"/student/progress"}
  ]},
  {"title":{"ar":"الدَّعم","en":"Support"},"links":[
    {"label":{"ar":"عَن المنصَّة","en":"About"},"href":"/about"},
    {"label":{"ar":"تَواصلْ معنا","en":"Contact us"},"href":"/contact"},
    {"label":{"ar":"الخصوصيَّة","en":"Privacy"},"href":"/privacy"},
    {"label":{"ar":"الشُّروط","en":"Terms"},"href":"/terms"}
  ]}
]', 'homepage'),
('homepage_footer_copyright', '{"ar":"متقن. جميعُ الحقوقِ محفوظة.","en":"Itqan. All rights reserved."}', 'homepage'),
('homepage_footer_made_pre',  '{"ar":"صُنِعَ بِـ","en":"Made with"}', 'homepage'),
('homepage_footer_made_post', '{"ar":"لِخدمةِ كتابِ الله","en":"in service of the Book of Allah"}', 'homepage')
ON CONFLICT (setting_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Logo (optional). Empty string => use the built-in star mark.
-- ---------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type) VALUES
('homepage_logo_url', '""', 'homepage')
ON CONFLICT (setting_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Base colors (the 8 editable homepage colors). All other shades are derived
-- from these in CSS via color-mix(), so changing one cascades automatically.
-- ---------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type) VALUES
('homepage_color_navy',      '"#0F2A44"', 'homepage'),
('homepage_color_green',     '"#1B4332"', 'homepage'),
('homepage_color_bronze',    '"#B08D57"', 'homepage'),
('homepage_color_gold',      '"#C9A962"', 'homepage'),
('homepage_color_parchment', '"#F7F2E9"', 'homepage'),
('homepage_color_cream',     '"#F2EBDD"', 'homepage'),
('homepage_color_ink',       '"#1A1A1A"', 'homepage'),
('homepage_color_dark',      '"#0B1217"', 'homepage')
ON CONFLICT (setting_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Section visibility toggles
-- ---------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type) VALUES
('homepage_show_stats',        'true', 'homepage'),
('homepage_show_features',     'true', 'homepage'),
('homepage_show_testimonials', 'true', 'homepage')
ON CONFLICT (setting_key) DO NOTHING;
