/**
 * Homepage CMS content model.
 *
 * Every visible string on the public homepage (`app/page.tsx`) lives here as a
 * bilingual `{ ar, en }` value (or an array/object of them). `/admin/homepage`
 * edits these and stores them in `system_settings` (setting_type='homepage');
 * `/api/homepage` returns them and the page localizes them via the active
 * site locale.
 *
 * DEFAULT_HOMEPAGE_CONTENT holds the original Arabic copy (so the page looks
 * identical before any admin edit) plus English translations.
 */

export type Locale = 'ar' | 'en'
export type Bi = { ar: string; en: string }

/* ----------------------------- defaults ----------------------------- */

export const DEFAULT_HOMEPAGE_CONTENT = {
  // Brand / navbar
  homepage_brand_name: { ar: 'متقن', en: 'Itqan' } as Bi,
  homepage_brand_tagline: { ar: 'Itqan Platform', en: 'Itqan Platform' } as Bi,
  homepage_login_text: { ar: 'دخول', en: 'Login' } as Bi,
  homepage_register_text: { ar: 'التسجيل', en: 'Register' } as Bi,
  homepage_register_short: { ar: 'تسجيل', en: 'Sign up' } as Bi,
  homepage_nav: [
    { href: '#sections', label: { ar: 'المنصات', en: 'Platforms' } },
    { href: '#features', label: { ar: 'المميزات', en: 'Features' } },
    { href: '#journey', label: { ar: 'المسار', en: 'Journey' } },
    { href: '#voices', label: { ar: 'آراؤهم', en: 'Voices' } },
  ],

  // Hero
  homepage_hero_bismillah: { ar: 'بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيم', en: 'In the Name of Allah, the Most Gracious, the Most Merciful' } as Bi,
  homepage_hero_title: { ar: 'إتقــــــانُ التِلاوة', en: 'Mastering Recitation' } as Bi,
  homepage_hero_subtitle: { ar: 'ورحلةُ التَعَلُم', en: 'and the Journey of Learning' } as Bi,
  homepage_hero_description: {
    ar: 'مِنبرٌ علميٌّ يجمع بين أكاديميَّةٍ راسخةٍ للدُّروسِ والشَّهادات، ومَقْرأةٍ روحانيَّةٍ للحفظِ والتَّسميعِ بإشرافِ المقرِئينَ المُجازين.',
    en: 'An academic platform that unites a structured academy for lessons and certificates with a spiritual Maqra’ah for memorization and recitation, supervised by certified reciters.',
  } as Bi,
  homepage_cta_primary_text: { ar: 'الأكاديميَّة', en: 'The Academy' } as Bi,
  homepage_cta_primary_link: '/academy/student',
  homepage_cta_secondary_text: { ar: 'المَقْرأة', en: 'The Maqra’ah' } as Bi,
  homepage_cta_secondary_link: '/student',
  homepage_scroll_text: { ar: 'تَصَفَّح', en: 'Scroll' } as Bi,
  homepage_stats: [
    { v: 12500, s: '+', label: { ar: 'طالب وطالبة', en: 'Students' } },
    { v: 320, s: '+', label: { ar: 'معلِّم ومُقرئ', en: 'Teachers & reciters' } },
    { v: 85, s: '%', label: { ar: 'نسبة الإتقان', en: 'Mastery rate' } },
    { v: 24, s: '/7', label: { ar: 'متابعة دائمة', en: 'Always-on support' } },
  ],

  // Two pillars
  homepage_pillars_eyebrow: { ar: 'المنصَّتان', en: 'The Two Platforms' } as Bi,
  homepage_pillars_title: { ar: 'طريقانِ نحوَ الإتقان', en: 'Two Paths to Mastery' } as Bi,
  homepage_pillars_subtitle: { ar: 'اخترْ مسارَك الذي يُلائمُ هِمَّتَكَ ووقتَك', en: 'Choose the path that fits your ambition and time' } as Bi,
  homepage_pillar_academy: {
    number: { ar: '٠١', en: '01' },
    badge: { ar: 'القسم الأول', en: 'Section One' },
    title: { ar: 'الأكاديميَّة', en: 'The Academy' },
    desc: {
      ar: 'مَدْرسةٌ افتراضيَّةٌ منظَّمة، بدوراتٍ مُتدرِّجةٍ في علوم القرآن والتجويد والفقه، تُتوَّجُ بشهاداتٍ وإجازاتٍ معتمدة.',
      en: 'A structured virtual school with progressive courses in Qur’anic sciences, tajwid and fiqh, crowned with accredited certificates and ijazahs.',
    },
    cta: { ar: 'دخول الأكاديميَّة', en: 'Enter the Academy' },
    link: '/academy/student',
    features: [
      { t: { ar: 'مناهجُ متدرِّجة', en: 'Progressive curricula' }, d: { ar: 'من المبتدئ إلى الإجازة', en: 'From beginner to ijazah' } },
      { t: { ar: 'شهاداتٌ معتمدة', en: 'Accredited certificates' }, d: { ar: 'موثَّقةٌ بختمِ الأكاديميَّة', en: 'Sealed by the Academy' } },
      { t: { ar: 'إشرافٌ مباشر', en: 'Direct supervision' }, d: { ar: 'أساتذةٌ مُجازون', en: 'Certified instructors' } },
    ],
  },
  homepage_pillar_maqraa: {
    number: { ar: '٠٢', en: '02' },
    badge: { ar: 'القسم الثاني', en: 'Section Two' },
    title: { ar: 'المَقْرأة', en: 'The Maqra’ah' },
    desc: {
      ar: 'مجلسٌ روحانيٌّ مُباشَر، تَعْرضُ تِلاوتَكَ على المُقرئِ المُجاز، فيُصحِّحُ ويُتابعُ ويُجيز.',
      en: 'A live, spiritual circle where you recite to a certified reciter who corrects, follows up, and grants ijazah.',
    },
    cta: { ar: 'دخول المَقْرأة', en: 'Enter the Maqra’ah' },
    link: '/student',
    features: [
      { t: { ar: 'تَسميعٌ مُباشر', en: 'Live recitation' }, d: { ar: 'بصوتِكَ وبتفاعلٍ حيّ', en: 'Your voice, live feedback' } },
      { t: { ar: 'حَجزٌ مَرِن', en: 'Flexible booking' }, d: { ar: 'مواعيدُ تُناسبُك', en: 'Times that suit you' } },
      { t: { ar: 'مُتابعةُ الحفظ', en: 'Memorization tracking' }, d: { ar: 'تقدُّمٌ مُسجَّلٌ كلَّ جلسة', en: 'Progress logged each session' } },
    ],
  },

  // Features
  homepage_features_eyebrow: { ar: 'المميزات', en: 'Features' } as Bi,
  homepage_features_title: { ar: 'تجربةٌ مُتكاملة بِتفاصيلَ مَدروسة', en: 'A complete experience, thoughtfully detailed' } as Bi,
  homepage_features_subtitle: {
    ar: 'كلُّ ميزةٍ صُمِّمَت لِتُلامسَ احتياجَ الطالب، فلا تَكلُّفَ ولا تَعقيد، بل أدواتٌ صريحةٌ تُعينُك على الإتقان.',
    en: 'Every feature is designed around the student’s needs — no clutter, no complexity, just clear tools that help you master your recitation.',
  } as Bi,
  homepage_features: [
    { num: { ar: '٠١', en: '01' }, t: { ar: 'حَلَقاتٌ مرئيَّة', en: 'Video circles' }, d: { ar: 'جلساتٌ مباشرةٌ بصوتٍ وصورةٍ، تَحاكي الحَلْقةَ التقليديَّة في رحابِ المساجد.', en: 'Live audio-video sessions that recreate the traditional circle of the mosques.' } },
    { num: { ar: '٠٢', en: '02' }, t: { ar: 'تَسجيلُ التِّلاوة', en: 'Recitation recording' }, d: { ar: 'سجِّل تِلاوتَكَ في أيِّ وقت، وأرسلْها للمُقرئ ليُصحِّحَ ويُعلِّقَ على كلِّ آية.', en: 'Record your recitation anytime and send it to a reciter to correct and comment on every verse.' } },
    { num: { ar: '٠٣', en: '03' }, t: { ar: 'مُتابعةُ التَّقدُّم', en: 'Progress tracking' }, d: { ar: 'إحصاءاتٌ دقيقةٌ تُظهِرُ مُعدَّلَ حِفظِك وإتقانِك أسبوعيًّا وشهريًّا.', en: 'Precise analytics that show your memorization and mastery rate weekly and monthly.' } },
    { num: { ar: '٠٤', en: '04' }, t: { ar: 'شهاداتٌ مُوثَّقة', en: 'Verified certificates' }, d: { ar: 'عند إتمامِ مسارٍ تعليميٍّ، تَحصُلُ على شهادةٍ مَعزُوَّةٍ بختمِ الأكاديميَّة.', en: 'On completing a learning path, you receive a certificate sealed by the Academy.' } },
    { num: { ar: '٠٥', en: '05' }, t: { ar: 'حَجْزٌ مَرِن', en: 'Flexible booking' }, d: { ar: 'اختر مُقرِئَكَ والوقتَ المُناسبَ لك من تقويمٍ ذكيٍّ يَعرضُ المتاحَ فقط.', en: 'Pick your reciter and a suitable time from a smart calendar that shows only what’s available.' } },
    { num: { ar: '٠٦', en: '06' }, t: { ar: 'مَكتبةٌ معرفيَّة', en: 'Knowledge library' }, d: { ar: 'محاضراتٌ ومَقالاتٌ في علوم القرآن والفقه والتفسير، يتجدَّدُ مُحتواها أُسبوعيًّا.', en: 'Lectures and articles in Qur’anic sciences, fiqh and tafsir, refreshed weekly.' } },
  ],

  // Journey
  homepage_journey_eyebrow: { ar: 'المسار', en: 'The Path' } as Bi,
  homepage_journey_title: { ar: 'اختَرْ بابَكَ نحوَ الإتقان', en: 'Choose your gateway to mastery' } as Bi,
  homepage_journey_subtitle: { ar: 'لِكُلِّ طالبٍ طريق؛ فاطْرُقِ البابَ الذي يُناسِبُ هِمَّتَكَ، وسِرْ خطوةً خطوة', en: 'Every seeker has a path — open the door that suits your ambition and walk it step by step' } as Bi,
  // Fork-in-the-road: the two doors the visitor chooses between.
  homepage_journey_academy_label: { ar: 'طالبُ عِلم', en: 'Seeker of Knowledge' } as Bi,
  homepage_journey_academy_tagline: { ar: 'رِحلةُ الأكاديميَّة: دوراتٌ وشهادات', en: 'The Academy path: courses & certificates' } as Bi,
  homepage_journey_maqraa_label: { ar: 'طالبُ تِلاوة', en: 'Seeker of Recitation' } as Bi,
  homepage_journey_maqraa_tagline: { ar: 'رِحلةُ المَقْرأة: تَسميعٌ وإجازة', en: 'The Maqra’ah path: recitation & ijazah' } as Bi,
  homepage_journey_meet_text: { ar: 'وكِلا الطريقَينِ يَلتقي عندَ غايةٍ واحدة: إتقانُ كتابِ الله', en: 'Both roads meet at a single goal: mastering the Book of Allah' } as Bi,
  // Academy track steps
  homepage_journey_academy_steps: [
    { n: { ar: '١', en: '1' }, t: { ar: 'سَجِّل في الأكاديميَّة', en: 'Join the Academy' }, d: { ar: 'أنشئ حسابَكَ في دقائق وأَكمِل ملف��ّكَ التعريفيَّ لِتَبدأَ مسيرتَكَ العلميَّة.', en: 'Create your account in minutes and complete your profile to begin your academic path.' } },
    { n: { ar: '٢', en: '2' }, t: { ar: 'اختَرْ مسارَكَ ومستواك', en: 'Choose your track & level' }, d: { ar: 'حدِّدْ تخصُّصَكَ في علوم القرآن أو التجويد أو الفقه، وابدأْ من المستوى الذي يُناسِبُك.', en: 'Pick your specialization in Qur’anic sciences, tajwid, or fiqh, and start at the level that fits you.' } },
    { n: { ar: '٣', en: '3' }, t: { ar: 'التَحِقْ بالدوراتِ والحَلَقات', en: 'Enroll in courses & circles' }, d: { ar: 'احْضُرِ الدروسَ المباشرةَ والمُسجَّلة، وتفاعَلْ مع أساتذتِكَ وزملائك.', en: 'Attend live and recorded lessons and engage with your instructors and peers.' } },
    { n: { ar: '٤', en: '4' }, t: { ar: 'أَنجِزِ الواجباتِ والاختبارات', en: 'Complete assignments & exams' }, d: { ar: 'طبِّقْ ما تَعلَّمتَه، وأَنجِزِ التكليفات، واجتَزِ الاختباراتِ لِتَنتقِلَ بين المستويات.', en: 'Apply what you learn, complete your tasks, and pass exams to advance between levels.' } },
    { n: { ar: '٥', en: '5' }, t: { ar: 'انَلْ شهادتَكَ المعتمدة', en: 'Earn your accredited certificate' }, d: { ar: 'اختِمْ مسارَكَ بشهادةٍ موثَّقةٍ بختمِ الأكاديميَّة تُثبِتُ ما بَلَغتَه من إتقان.', en: 'Crown your path with a certificate sealed by the Academy that proves your mastery.' } },
  ],
  // Maqra’ah track steps
  homepage_journey_maqraa_steps: [
    { n: { ar: '١', en: '1' }, t: { ar: 'سَجِّل في المَقْرأة', en: 'Join the Maqra’ah' }, d: { ar: 'أنشئ حسابَكَ واختر المَقْرأةَ لِتَبدأَ رحلةَ الحفظِ والتَّسميعِ الروحانيَّة.', en: 'Create your account and choose the Maqra’ah to begin your spiritual journey of memorization and recitation.' } },
    { n: { ar: '٢', en: '2' }, t: { ar: 'اختبارُ تحديدِ المستوى', en: 'Placement assessment' }, d: { ar: 'يَستمِعُ المُقرئُ إلى تِلاوتِكَ لِيُحدِّدَ مستواكَ ويَضعَ لكَ خُطَّةَ الحفظِ المُناسِبة.', en: 'A reciter listens to your recitation to determine your level and set the right memorization plan.' } },
    { n: { ar: '٣', en: '3' }, t: { ar: 'اختَرْ مُقرِئَكَ واحجِزْ', en: 'Choose your reciter & book' }, d: { ar: 'تصفَّحْ المُقرئينَ المُجازين، اقرأْ سيرَهم، ثم احجِزْ موعدَكَ في الوقتِ الذي يُناسِبُك.', en: 'Browse certified reciters, read their bios, then book a time that suits you.' } },
    { n: { ar: '٤', en: '4' }, t: { ar: 'سَمِّعْ وِردَكَ اليوميّ', en: 'Recite your daily portion' }, d: { ar: 'اعرِضْ تِلاوتَكَ مباشرةً على المُقرئ فيُصحِّحُ ويُتابِعُ تقدُّمَكَ جلسةً بعدَ جلسة.', en: 'Recite live to the reciter who corrects and tracks your progress session after session.' } },
    { n: { ar: '٥', en: '5' }, t: { ar: 'نَلْ إجازتَكَ', en: 'Receive your ijazah' }, d: { ar: 'أَتْمِمْ حفظَكَ بإتقان، واظفَرْ بإجازةٍ مُتَّصِلةِ السَّنَدِ بإذن الله.', en: 'Complete your memorization with mastery and attain an ijazah with a connected chain, by Allah’s will.' } },
  ],

  // Testimonials
  homepage_testimonials_eyebrow: { ar: 'آراؤهم', en: 'Voices' } as Bi,
  homepage_testimonials_title: { ar: 'كَلِماتٌ مِن طُلَّابِنا', en: 'Words from our students' } as Bi,
  homepage_testimonials_top: [
    { q: { ar: 'تجربةٌ أعادتْ لي شَغفي بالقرآن، فالأستاذُ يُتابعُ تِلاوتي حرفًا حرفًا، وأنا في بيتي.', en: 'An experience that revived my passion for the Qur’an — the teacher follows my recitation letter by letter, from my own home.' }, n: { ar: 'أحمد المصري', en: 'Ahmad Al-Masri' }, r: { ar: 'طالبٌ في مسارِ الإجازة', en: 'Ijazah-track student' } },
    { q: { ar: 'حفظتُ ربعَ القرآن في ستَّةِ أشهرٍ بفضلِ المتابعةِ المُنظَّمةِ والمُقرئةِ المُتميِّزة.', en: 'I memorized a quarter of the Qur’an in six months thanks to the organized follow-up and an excellent reciter.' }, n: { ar: 'فاطمة الزهراء', en: 'Fatimah Al-Zahraa' }, r: { ar: 'طالبةُ تحفيظ', en: 'Memorization student' } },
    { q: { ar: 'الجَودةُ، التَّنظيمُ، الاحترامُ في التعامل، كلُّ شيءٍ يَدلُّ على أنَّ القائمين أهلُ علمٍ وصِدق.', en: 'Quality, organization, and respect — everything shows the team are people of knowledge and sincerity.' }, n: { ar: 'د. خالد الأنصاري', en: 'Dr. Khalid Al-Ansari' }, r: { ar: 'وَلِيُّ أمر', en: 'Parent' } },
    { q: { ar: 'ما مرَّ يومٌ بعد التحاقي بالمَقْرأة إلا وذُقتُ حلاوةَ القرآنِ من جديد.', en: 'Not a day has passed since I joined the Maqra���ah without tasting the sweetness of the Qur’an anew.' }, n: { ar: 'محمد العبسي', en: 'Mohammed Al-Absi' }, r: { ar: 'طالبُ تجويد', en: 'Tajwid student' } },
    { q: { ar: 'المنصَّةُ راقيةٌ، والأساتذ��ُ مُجازون، والإدارةُ تَسمعُ لكلِّ مُلاحظةٍ بِصَدرٍ رَحب.', en: 'A refined platform, certified teachers, and an administration that welcomes every note warmly.' }, n: { ar: 'أم عبد الله', en: 'Umm Abdullah' }, r: { ar: 'وَلِيَّةُ أمر', en: 'Parent' } },
    { q: { ar: 'أَخذتُ إجازتي في رواية حفصٍ هنا، بعد سنواتٍ من التشتُّتِ بين منصَّاتٍ أخرى.', en: 'I earned my ijazah in the Hafs narration here, after years of drifting between other platforms.' }, n: { ar: 'يوسف الإدريسي', en: 'Yusuf Al-Idrisi' }, r: { ar: 'حاصلٌ على إجازة', en: 'Ijazah holder' } },
    { q: { ar: 'الجلساتُ المباشرةُ فيها رُوحٌ لا تَجدُها في أيِّ تسجيلٍ مُسبَّق.', en: 'Live sessions carry a spirit you won’t find in any pre-recorded lesson.' }, n: { ar: 'سارة المغربي', en: 'Sara Al-Maghribi' }, r: { ar: 'طالبةُ تجويد', en: 'Tajwid student' } },
    { q: { ar: 'أَشعرُ أنَّ الأستاذَ يُكلِّمُني وحدي، كأنَّنا في حَلْقةٍ خاصَّة.', en: 'I feel the teacher is speaking to me alone, as if we’re in a private circle.' }, n: { ar: 'طارق الزيات', en: 'Tariq Al-Zayyat' }, r: { ar: 'طالبٌ مبتدئ', en: 'Beginner student' } },
    { q: { ar: 'في أقلَّ من ثلاثةِ أشهرٍ صَحَّح لي المُقرئُ أخطاءً حملتُها سنين.', en: 'In under three months the reciter corrected mistakes I’d carried for years.' }, n: { ar: 'رانيا عبد الحميد', en: 'Rania Abdulhamid' }, r: { ar: 'طالبةُ تحفيظ', en: 'Memorization student' } },
    { q: { ar: 'أجودُ ما قَضيتُه من وقتٍ هذا العام هو جلساتي في المَقْرأة.', en: 'The best time I’ve spent this year is my sessions in the Maqra’ah.' }, n: { ar: 'عمر سيد أحمد', en: 'Omar Sayed Ahmed' }, r: { ar: 'طالبٌ في الإجازة', en: 'Ijazah-track student' } },
    { q: { ar: 'بعد سنواتٍ من البحثِ عن مُقرئٍ مُجاز، وجدتُ ضالَّتي هنا.', en: 'After years of searching for a certified reciter, I found what I was looking for here.' }, n: { ar: 'عائشة الحربي', en: 'Aisha Al-Harbi' }, r: { ar: 'طالبةُ إجازة', en: 'Ijazah student' } },
    { q: { ar: 'أبنائي الثلاثةُ مُلتحقون بالأكاديميَّة ومستواهم في تَحسُّنٍ مُستمرّ.', en: 'My three children are enrolled in the Academy and their level keeps improving.' }, n: { ar: 'أبو يوسف', en: 'Abu Yusuf' }, r: { ar: 'وَلِيُّ أمر', en: 'Parent' } },
  ],
  homepage_testimonials_bottom: [
    { q: { ar: 'تجربةٌ مُختلفةٌ تمامًا، شعرتُ أنني في حَلْقةٍ حقيقيَّةٍ في أحدِ المساجدِ العَتيقة.', en: 'A completely different experience — I felt I was in a real circle in one of the old mosques.' }, n: { ar: 'هدى الشريف', en: 'Huda Al-Sharif' }, r: { ar: 'طالبةُ علم', en: 'Student of knowledge' } },
    { q: { ar: 'كنتُ أبحثُ عن مَقْرأةٍ مُنضَبطةٍ منذُ زمن، فوجدتُ هنا ما يَفوقُ ما تَمنَّيت.', en: 'I had long sought a disciplined Maqra’ah, and here I found more than I’d hoped for.' }, n: { ar: 'إبراهيم الرفاعي', en: 'Ibrahim Al-Rifai' }, r: { ar: 'طالبٌ في الإجازة', en: 'Ijazah-track student' } },
    { q: { ar: 'الواجباتُ مُحَكَّمة، والمُتابعةُ يوميَّة، والنتائجُ مُبشِّرةٌ بفضلِ الله.', en: 'The assignments are rigorous, the follow-up is daily, and the results are promising, by Allah’s grace.' }, n: { ar: 'نوال البصري', en: 'Nawal Al-Basri' }, r: { ar: 'طالبةُ تحفيظ', en: 'Memorization student' } },
    { q: { ar: 'ما رأيتُ أَشمَلَ من هذه المنصَّةِ في الجَمعِ بين العلمِ النظريِّ والتطبيقيِّ.', en: 'I’ve seen nothing more comprehensive than this platform in uniting theory and practice.' }, n: { ar: 'د. صالح الشمري', en: 'Dr. Saleh Al-Shammari' }, r: { ar: 'أستاذٌ مُحاضِر', en: 'Lecturer' } },
    { q: { ar: 'ابني تَغيَّرت علاقتُه بالقرآنِ بعد التحاقِه، صار يَنتظرُ الجلسةَ بشَغف.', en: 'My son’s relationship with the Qur’an changed after joining — he now awaits each session eagerly.' }, n: { ar: 'أم محمد', en: 'Umm Mohammed' }, r: { ar: 'وَلِيَّةُ أمر', en: 'Parent' } },
    { q: { ar: 'خِدمةٌ مُتقَنةٌ من البدايةِ إلى النهاية، شُكرًا لكلِّ القائمين على هذا المشروع.', en: 'A polished service from start to finish — thanks to everyone behind this project.' }, n: { ar: 'عبد الرحمن الحارثي', en: 'Abdulrahman Al-Harithi' }, r: { ar: 'خرِّيج', en: 'Graduate' } },
    { q: { ar: 'الانتظامُ في الجلساتِ جعلَ حفظي أمتنَ وتلاوتي أصفى من أيِّ وقتٍ مضى.', en: 'Consistent sessions made my memorization firmer and my recitation clearer than ever.' }, n: { ar: 'منى القرشي', en: 'Mona Al-Qurashi' }, r: { ar: 'طالبةُ تحفيظ', en: 'Memorization student' } },
    { q: { ar: 'المُقرئُ يَشرحُ المَخارجَ بأسلوبٍ واضحٍ لم أَجدْه في مكانٍ آخر.', en: 'The reciter explains the points of articulation with a clarity I haven’t found elsewhere.' }, n: { ar: 'بلال حسين', en: 'Bilal Hussein' }, r: { ar: 'طالبُ تجويد', en: 'Tajwid student' } },
    { q: { ar: 'من أفضلِ قراراتي الانضمامُ للأكاديميَّة، والنتائجُ تَتكلَّمُ عن نفسها.', en: 'Joining the Academy was one of my best decisions, and the results speak for themselves.' }, n: { ar: 'لينا الحمداني', en: 'Lina Al-Hamdani' }, r: { ar: 'طالبةٌ في مسارِ الإجازة', en: 'Ijazah-track student' } },
    { q: { ar: 'كلُّ جلسةٍ فيها علمٌ وأدبٌ وبركة، اللهُ يُجزي القائمين خيرًا.', en: 'Every session holds knowledge, manners, and blessing — may Allah reward the team well.' }, n: { ar: 'حسام الدين عوض', en: 'Hossam Eldin Awad' }, r: { ar: 'طالبٌ متقدِّم', en: 'Advanced student' } },
    { q: { ar: 'تَعلَّمتُ أحكامَ التجويدِ بطريقةٍ سَلِسةٍ لم أتوقَّعها من قبل.', en: 'I learned the rules of tajwid in a smooth way I never expected.' }, n: { ar: 'مريم الأحمد', en: 'Maryam Al-Ahmad' }, r: { ar: 'طالبةُ تجويد', en: 'Tajwid student' } },
    { q: { ar: 'المنصَّةُ سَهَّلت عليَّ الجَمعَ بين العملِ والدراسةِ القرآنيَّة.', en: 'The platform made it easy to combine work with Qur’anic study.' }, n: { ar: 'ماجد العنزي', en: 'Majed Al-Anazi' }, r: { ar: 'طالبٌ عامل', en: 'Working student' } },
  ],

  // Final CTA
  homepage_cta_title: { ar: 'ابْدَأْ رحلتَك اليومَ', en: 'Begin your journey today' } as Bi,
  homepage_cta_desc: {
    ar: 'انضمَّ إلى آلاف الطلَّابِ الذينَ بَدَؤوا رحلتَهم نحو إتقانِ كتابِ الله، ولا تَنْسَ أنَّ',
    en: 'Join thousands of students who have begun their journey toward mastering the Book of Allah, and never forget that',
  } as Bi,
  homepage_cta_hadith: {
    ar: '«خيرُكم مَن تَعَلَّمَ القرآنَ وعَلَّمَه»',
    en: '“The best of you are those who learn the Qur’an and teach it.”',
  } as Bi,
  homepage_cta_button_primary: { ar: 'سَجِّل مَجَّانًا', en: 'Register for free' } as Bi,
  homepage_cta_button_primary_link: '/register',
  homepage_cta_button_secondary: { ar: 'لديَّ حسابٌ بالفعل', en: 'I already have an account' } as Bi,
  homepage_cta_button_secondary_link: '/login',

  // Footer
  homepage_footer_desc: {
    ar: 'مِنبرٌ علميٌّ يجمع بين الأكاديميَّة الراسخة والمَقْرأة الروحانيَّة، لِيَكونَ صَرحًا متكاملًا لإتقانِ كتابِ الله.',
    en: 'An academic platform uniting a solid academy with a spiritual Maqra’ah, to be a complete edifice for mastering the Book of Allah.',
  } as Bi,
  homepage_footer_columns: [
    {
      title: { ar: 'الأكاديميَّة', en: 'The Academy' },
      links: [
        { label: { ar: 'لوحة التحكُّم', en: 'Dashboard' }, href: '/academy/student' },
        { label: { ar: 'الدَّورات', en: 'Courses' }, href: '/academy/student/courses' },
        { label: { ar: 'المَسار', en: 'Path' }, href: '/academy/student/path' },
        { label: { ar: 'الشَّهادات', en: 'Certificates' }, href: '/academy/student/certificates' },
      ],
    },
    {
      title: { ar: 'المَقْرأة', en: 'The Maqra’ah' },
      links: [
        { label: { ar: 'لوحة التحكُّم', en: 'Dashboard' }, href: '/student' },
        { label: { ar: 'التَّسميعات', en: 'Recitations' }, href: '/student/recitations' },
        { label: { ar: 'حَجْزُ موعد', en: 'Book a session' }, href: '/student/booking' },
        { label: { ar: 'التَّقدُّم', en: 'Progress' }, href: '/student/progress' },
      ],
    },
    {
      title: { ar: 'الدَّعم', en: 'Support' },
      links: [
        { label: { ar: 'عَن المنصَّة', en: 'About' }, href: '/about' },
        { label: { ar: 'تَواصلْ معنا', en: 'Contact us' }, href: '/contact' },
        { label: { ar: 'الخصوصيَّة', en: 'Privacy' }, href: '/privacy' },
        { label: { ar: 'الشُّروط', en: 'Terms' }, href: '/terms' },
      ],
    },
  ],
  homepage_footer_copyright: { ar: 'متقن. جميعُ الحقوقِ محفوظة.', en: 'Itqan. All rights reserved.' } as Bi,
  homepage_footer_made_pre: { ar: 'صُنِعَ بِـ', en: 'Made with' } as Bi,
  homepage_footer_made_post: { ar: 'لِخدمةِ كتابِ الله', en: 'in service of the Book of Allah' } as Bi,

  // Logo (optional). Empty => use the built-in star mark.
  homepage_logo_url: '',
}

/* Default base colors (the 8 editable homepage colors). */
export const DEFAULT_HOMEPAGE_COLORS: Record<string, string> = {
  homepage_color_navy: '#0F2A44',
  homepage_color_green: '#1B4332',
  homepage_color_bronze: '#B08D57',
  homepage_color_gold: '#C9A962',
  homepage_color_parchment: '#F7F2E9',
  homepage_color_cream: '#F2EBDD',
  homepage_color_ink: '#1A1A1A',
  homepage_color_dark: '#0B1217',
}

/* Default toggles / maintenance. */
export const DEFAULT_HOMEPAGE_FLAGS = {
  homepage_show_stats: true,
  homepage_show_features: true,
  homepage_show_testimonials: true,
  maintenance_mode: false,
  maintenance_full_page: false,
  maintenance_message: 'الموقع تحت الصيانة حاليًا، نعود قريبًا 🔧',
  maintenance_banner_color: '#f59e0b',
}

/* ----------------------------- helpers ----------------------------- */

type AnyMap = Record<string, any>

function isBi(v: any): v is Bi {
  return v && typeof v === 'object' && ('ar' in v || 'en' in v)
}

/** Localize a bilingual value (or pass strings through). */
function L(v: any, locale: Locale): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (isBi(v)) return (v[locale] ?? v.ar ?? v.en ?? '') as string
  return ''
}

export function asBool(v: any, fallback = true): boolean {
  if (v === true || v === 'true') return true
  if (v === false || v === 'false') return false
  return fallback
}

/**
 * Merge stored settings over defaults and localize into the flat shape the
 * homepage renders. `settings` is the raw map from /api/homepage.
 */
export function buildHomepageContent(settings: AnyMap, locale: Locale) {
  const D = DEFAULT_HOMEPAGE_CONTENT as AnyMap
  const get = (key: string) => (settings[key] != null ? settings[key] : D[key])
  // Typed array accessor so downstream `.map(...)` callbacks are not `any`.
  const arr = (key: string): AnyMap[] => (Array.isArray(get(key)) ? (get(key) as AnyMap[]) : [])

  const academy = get('homepage_pillar_academy')
  const maqraa = get('homepage_pillar_maqraa')

  const pillar = (p: AnyMap) => ({
    number: L(p?.number, locale),
    badge: L(p?.badge, locale),
    title: L(p?.title, locale),
    desc: L(p?.desc, locale),
    cta: L(p?.cta, locale),
    link: p?.link || '#',
    features: (Array.isArray(p?.features) ? (p.features as AnyMap[]) : []).map((f: AnyMap) => ({ t: L(f.t, locale), d: L(f.d, locale) })),
  })

  return {
    // brand / nav
    brandName: L(get('homepage_brand_name'), locale),
    brandTagline: L(get('homepage_brand_tagline'), locale),
    loginText: L(get('homepage_login_text'), locale),
    registerText: L(get('homepage_register_text'), locale),
    registerShort: L(get('homepage_register_short'), locale),
    nav: arr('homepage_nav').map((n: AnyMap) => ({ href: String(n.href), label: L(n.label, locale) })),

    // hero
    bismillah: L(get('homepage_hero_bismillah'), locale),
    heroTitle: L(get('homepage_hero_title'), locale),
    heroSubtitle: L(get('homepage_hero_subtitle'), locale),
    heroDescription: L(get('homepage_hero_description'), locale),
    ctaPrimaryText: L(get('homepage_cta_primary_text'), locale),
    ctaPrimaryLink: get('homepage_cta_primary_link') || '#',
    ctaSecondaryText: L(get('homepage_cta_secondary_text'), locale),
    ctaSecondaryLink: get('homepage_cta_secondary_link') || '#',
    scrollText: L(get('homepage_scroll_text'), locale),
    stats: arr('homepage_stats').map((s: AnyMap) => ({ v: Number(s.v) || 0, s: String(s.s || ''), l: L(s.label, locale) })),

    // pillars
    pillarsEyebrow: L(get('homepage_pillars_eyebrow'), locale),
    pillarsTitle: L(get('homepage_pillars_title'), locale),
    pillarsSubtitle: L(get('homepage_pillars_subtitle'), locale),
    academy: pillar(academy),
    maqraa: pillar(maqraa),

    // features
    featuresEyebrow: L(get('homepage_features_eyebrow'), locale),
    featuresTitle: L(get('homepage_features_title'), locale),
    featuresSubtitle: L(get('homepage_features_subtitle'), locale),
    features: arr('homepage_features').map((f: AnyMap) => ({ num: L(f.num, locale), t: L(f.t, locale), d: L(f.d, locale) })),

    // journey (fork-in-the-road: two tracks)
    journeyEyebrow: L(get('homepage_journey_eyebrow'), locale),
    journeyTitle: L(get('homepage_journey_title'), locale),
    journeySubtitle: L(get('homepage_journey_subtitle'), locale),
    journeyAcademyLabel: L(get('homepage_journey_academy_label'), locale),
    journeyAcademyTagline: L(get('homepage_journey_academy_tagline'), locale),
    journeyMaqraaLabel: L(get('homepage_journey_maqraa_label'), locale),
    journeyMaqraaTagline: L(get('homepage_journey_maqraa_tagline'), locale),
    journeyMeetText: L(get('homepage_journey_meet_text'), locale),
    academySteps: arr('homepage_journey_academy_steps').map((s: AnyMap) => ({ n: L(s.n, locale), t: L(s.t, locale), d: L(s.d, locale) })),
    maqraaSteps: arr('homepage_journey_maqraa_steps').map((s: AnyMap) => ({ n: L(s.n, locale), t: L(s.t, locale), d: L(s.d, locale) })),

    // testimonials
    testimonialsEyebrow: L(get('homepage_testimonials_eyebrow'), locale),
    testimonialsTitle: L(get('homepage_testimonials_title'), locale),
    testimonialsTop: arr('homepage_testimonials_top').map((x: AnyMap) => ({ q: L(x.q, locale), n: L(x.n, locale), r: L(x.r, locale) })),
    testimonialsBottom: arr('homepage_testimonials_bottom').map((x: AnyMap) => ({ q: L(x.q, locale), n: L(x.n, locale), r: L(x.r, locale) })),

    // final cta
    ctaTitle: L(get('homepage_cta_title'), locale),
    ctaDesc: L(get('homepage_cta_desc'), locale),
    ctaHadith: L(get('homepage_cta_hadith'), locale),
    ctaButtonPrimary: L(get('homepage_cta_button_primary'), locale),
    ctaButtonPrimaryLink: get('homepage_cta_button_primary_link') || '#',
    ctaButtonSecondary: L(get('homepage_cta_button_secondary'), locale),
    ctaButtonSecondaryLink: get('homepage_cta_button_secondary_link') || '#',

    // footer
    footerDesc: L(get('homepage_footer_desc'), locale),
    footerColumns: arr('homepage_footer_columns').map((col: AnyMap) => ({
      title: L(col.title, locale),
      links: (Array.isArray(col.links) ? (col.links as AnyMap[]) : []).map((l: AnyMap) => ({ label: L(l.label, locale), href: String(l.href) })),
    })),
    footerCopyright: L(get('homepage_footer_copyright'), locale),
    footerMadePre: L(get('homepage_footer_made_pre'), locale),
    footerMadePost: L(get('homepage_footer_made_post'), locale),

    // logo
    logoUrl: (get('homepage_logo_url') || '') as string,
  }
}

/** Build the inline CSS-var style that overrides the 8 base homepage colors. */
export function buildHomepageColorVars(settings: AnyMap): Record<string, string> {
  const c = (key: string) => (settings[key] || DEFAULT_HOMEPAGE_COLORS[key]) as string
  return {
    '--hp-navy': c('homepage_color_navy'),
    '--hp-green': c('homepage_color_green'),
    '--hp-bronze': c('homepage_color_bronze'),
    '--hp-gold': c('homepage_color_gold'),
    '--hp-parchment': c('homepage_color_parchment'),
    '--hp-cream': c('homepage_color_cream'),
    '--hp-ink': c('homepage_color_ink'),
    '--hp-dark': c('homepage_color_dark'),
  }
}
