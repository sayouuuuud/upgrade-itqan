import { query } from "@/lib/db"

// Default starter stages for each subject. Readers/admins can edit/add/delete
// these after creation. Topics ordered from foundations to advanced.

type DefaultStage = {
  position: number
  title: string
  description: string
  estimated_minutes: number
}

export const DEFAULT_TAJWEED_STAGES: DefaultStage[] = [
  { position: 1, title: "مخارج الحروف", description: "تعلم مواضع خروج الحروف من الفم والحلق والشفتين والخيشوم.", estimated_minutes: 60 },
  { position: 2, title: "صفات الحروف", description: "صفات الحروف ذات الأضداد (الجهر/الهمس، الشدة/الرخاوة) وغير الأضداد.", estimated_minutes: 60 },
  { position: 3, title: "أحكام الاستعاذة والبسملة", description: "كيفية البدء بالاستعاذة والبسملة وأوجه ربطها بأول السورة.", estimated_minutes: 30 },
  { position: 4, title: "أحكام النون الساكنة والتنوين", description: "الإظهار، الإدغام (بغنة وبغير غنة)، الإقلاب، الإخفاء.", estimated_minutes: 90 },
  { position: 5, title: "أحكام الميم الساكنة", description: "الإخفاء الشفوي، الإدغام الشفوي، الإظهار الشفوي.", estimated_minutes: 45 },
  { position: 6, title: "أحكام المدود", description: "المد الطبيعي والفرعي بأنواعه (المتصل والمنفصل واللازم والعارض للسكون).", estimated_minutes: 90 },
  { position: 7, title: "أحكام اللامات", description: "تفخيم وترقيق لام لفظ الجلالة، أحكام اللام الشمسية والقمرية.", estimated_minutes: 45 },
  { position: 8, title: "أحكام الراء", description: "متى تفخم الراء ومتى ترقق وحالات الجواز.", estimated_minutes: 45 },
  { position: 9, title: "الوقف والابتداء", description: "أنواع الوقف (تام، كاف، حسن، قبيح) ومواضع الوقف الجائز.", estimated_minutes: 60 },
  { position: 10, title: "تطبيق ختامي", description: "تلاوة مقطع طويل وتطبيق جميع الأحكام السابقة بإتقان.", estimated_minutes: 60 },
]

export const DEFAULT_FIQH_STAGES: DefaultStage[] = [
  { position: 1, title: "مقدمة في الفقه وأصوله", description: "تعريف الفقه، الفرق بين الفقه والشريعة، مصادر التشريع.", estimated_minutes: 60 },
  { position: 2, title: "الطهارة", description: "أحكام الوضوء، الغسل، التيمم، إزالة النجاسة.", estimated_minutes: 90 },
  { position: 3, title: "الصلاة — أحكامها وشروطها", description: "أركان الصلاة، شروطها، سننها، مبطلاتها.", estimated_minutes: 120 },
  { position: 4, title: "صلاة الجماعة والجمعة", description: "أحكام الإمامة، صفوف الجماعة، خطبة الجمعة وأحكامها.", estimated_minutes: 60 },
  { position: 5, title: "الزكاة", description: "أنواع الأموال الزكوية، النصاب، المصارف الثمانية.", estimated_minutes: 75 },
  { position: 6, title: "الصيام", description: "أحكام صيام رمضان، المفطرات، القضاء والكفارة، صيام التطوع.", estimated_minutes: 60 },
  { position: 7, title: "الحج والعمرة", description: "أركان الحج، واجباته، محظورات الإحرام، مناسك العمرة.", estimated_minutes: 90 },
  { position: 8, title: "المعاملات الأساسية", description: "البيع، الإجارة، الشركة، الربا والمحرمات في المعاملات.", estimated_minutes: 75 },
]

export const DEFAULT_AQEEDAH_STAGES: DefaultStage[] = [
  { position: 1, title: "أركان الإيمان الستة", description: "الإيمان بالله والملائكة والكتب والرسل واليوم الآخر والقدر خيره وشره.", estimated_minutes: 60 },
  { position: 2, title: "توحيد الربوبية", description: "إفراد الله تعالى بأفعاله من الخلق والرزق والتدبير والإحياء والإماتة.", estimated_minutes: 60 },
  { position: 3, title: "توحيد الألوهية", description: "إفراد الله بالعبادة وحده لا شريك له، ومعنى لا إله إلا الله.", estimated_minutes: 75 },
  { position: 4, title: "توحيد الأسماء والصفات", description: "إثبات ما أثبته الله لنفسه من الأسماء والصفات بلا تشبيه ولا تعطيل.", estimated_minutes: 60 },
  { position: 5, title: "نواقض الإيمان والشرك", description: "الشرك الأكبر والأصغر، النفاق الأكبر والأصغر، البدعة وأنواعها.", estimated_minutes: 75 },
  { position: 6, title: "الإيمان باليوم الآخر", description: "أشراط الساعة، البعث والحشر، الميزان والصراط، الجنة والنار.", estimated_minutes: 60 },
  { position: 7, title: "الإيمان بالقضاء والقدر", description: "مراتب القدر الأربعة، التوكل والأخذ بالأسباب، الفرق بين الكسب والإجبار.", estimated_minutes: 60 },
]

export const DEFAULT_SEERAH_STAGES: DefaultStage[] = [
  { position: 1, title: "العصر الجاهلي وأحوال العرب", description: "حالة الجزيرة العربية اجتماعياً ودينياً قبل البعثة.", estimated_minutes: 45 },
  { position: 2, title: "النسب الشريف والمولد والنشأة", description: "نسب النبي ﷺ، ميلاده، رضاعته في بني سعد، يتم وكفالة جده وعمه.", estimated_minutes: 60 },
  { position: 3, title: "ما قبل البعثة", description: "حياة النبي ﷺ قبل النبوة، تجارته، زواجه من خديجة، التحنث في غار حراء.", estimated_minutes: 45 },
  { position: 4, title: "البعثة والدعوة المكية", description: "بدء الوحي، الدعوة السرية ثم الجهرية، أذى قريش، الهجرة إلى الحبشة.", estimated_minutes: 90 },
  { position: 5, title: "الإسراء والمعراج والهجرة", description: "حادثة الإسراء والمعراج، بيعة العقبة، الهجرة إلى المدينة.", estimated_minutes: 60 },
  { position: 6, title: "العهد المدني وبناء الدولة", description: "بناء المسجد، المؤاخاة، وثيقة المدينة، الغزوات الكبرى (بدر، أحد، الخندق).", estimated_minutes: 120 },
  { position: 7, title: "صلح الحديبية وفتح مكة", description: "صلح الحديبية، فتح خيبر، فتح مكة، غزوة حنين والطائف.", estimated_minutes: 75 },
  { position: 8, title: "حجة الوداع ووفاة النبي ﷺ", description: "حجة الوداع وخطبتها، مرض النبي ﷺ ووفاته، أثره على الصحابة والأمة.", estimated_minutes: 60 },
]

export const DEFAULT_TAFSIR_STAGES: DefaultStage[] = [
  { position: 1, title: "علم التفسير ومناهجه", description: "تعريف التفسير، الفرق بينه وبين التأويل، أنواع التفسير ومدارسه.", estimated_minutes: 60 },
  { position: 2, title: "علوم القرآن الأساسية", description: "المكي والمدني، أسباب النزول، الناسخ والمنسوخ، المحكم والمتشابه.", estimated_minutes: 90 },
  { position: 3, title: "تفسير الفاتحة", description: "تفسير سورة الفاتحة آية آية، أم الكتاب وفضلها.", estimated_minutes: 60 },
  { position: 4, title: "تفسير قصار المفصل (جزء عمّ)", description: "تفسير سور جزء عمّ بمنهج المفسرين الكبار.", estimated_minutes: 120 },
  { position: 5, title: "تفسير آيات الأحكام المختارة", description: "آيات الصلاة والزكاة والصيام والحج وأهم المعاملات.", estimated_minutes: 90 },
  { position: 6, title: "تفسير سورة البقرة (مختارات)", description: "آيات القصص والأحكام والعقائد من سورة البقرة.", estimated_minutes: 120 },
  { position: 7, title: "تفسير المعوذات وآية الكرسي", description: "تفسير الإخلاص والمعوذتين وآية الكرسي وفضلها.", estimated_minutes: 45 },
]

export type Subject = "tajweed" | "fiqh" | "aqeedah" | "seerah" | "tafsir"

const STAGES_BY_SUBJECT: Record<Subject, DefaultStage[]> = {
  tajweed: DEFAULT_TAJWEED_STAGES,
  fiqh: DEFAULT_FIQH_STAGES,
  aqeedah: DEFAULT_AQEEDAH_STAGES,
  seerah: DEFAULT_SEERAH_STAGES,
  tafsir: DEFAULT_TAFSIR_STAGES,
}

export const SUBJECTS: Subject[] = ["tajweed", "fiqh", "aqeedah", "seerah", "tafsir"]

export function getDefaultStagesForSubject(subject: Subject): DefaultStage[] {
  return STAGES_BY_SUBJECT[subject] || DEFAULT_TAJWEED_STAGES
}

/**
 * Insert default stages for a newly-created path.
 * Returns the number of stages inserted.
 */
export async function seedDefaultStages(pathId: string, subject: Subject = "tajweed"): Promise<number> {
  const stages = getDefaultStagesForSubject(subject)
  const values: any[] = []
  const placeholders: string[] = []
  let i = 1
  for (const s of stages) {
    placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++})`)
    values.push(pathId, s.position, s.title, s.description, s.estimated_minutes)
  }
  await query(
    `INSERT INTO tajweed_path_stages (path_id, position, title, description, estimated_minutes)
     VALUES ${placeholders.join(", ")}`,
    values,
  )
  return stages.length
}
