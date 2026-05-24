// Canonical list of preset languages for the public books library.
// The admin UI also exposes an "other" choice that lets them type a free-form
// label (stored in book_files.language_label).

export interface BookLanguageOption {
  code: string
  labelAr: string
  labelEn: string
}

export const BOOK_LANGUAGES: BookLanguageOption[] = [
  { code: "ar", labelAr: "العربية", labelEn: "Arabic" },
  { code: "en", labelAr: "الإنجليزية", labelEn: "English" },
  { code: "fr", labelAr: "الفرنسية", labelEn: "French" },
  { code: "tr", labelAr: "التركية", labelEn: "Turkish" },
  { code: "ur", labelAr: "الأردية", labelEn: "Urdu" },
  { code: "id", labelAr: "الإندونيسية", labelEn: "Indonesian" },
  { code: "ms", labelAr: "الماليزية", labelEn: "Malay" },
  { code: "de", labelAr: "الألمانية", labelEn: "German" },
  { code: "es", labelAr: "الإسبانية", labelEn: "Spanish" },
  { code: "ru", labelAr: "الروسية", labelEn: "Russian" },
  { code: "fa", labelAr: "الفارسية", labelEn: "Persian" },
  { code: "bn", labelAr: "البنغالية", labelEn: "Bengali" },
]

export const OTHER_LANGUAGE_CODE = "other"

const BY_CODE = new Map(BOOK_LANGUAGES.map(l => [l.code, l]))

export function getLanguageOption(code: string): BookLanguageOption | undefined {
  return BY_CODE.get(code)
}

export function getLanguageDisplay(
  code: string,
  customLabel: string | null | undefined,
  locale: "ar" | "en" = "ar"
): string {
  if (code === OTHER_LANGUAGE_CODE) {
    return customLabel?.trim() || (locale === "ar" ? "لغة أخرى" : "Other")
  }
  const opt = BY_CODE.get(code)
  if (!opt) {
    return customLabel?.trim() || code
  }
  return locale === "ar" ? opt.labelAr : opt.labelEn
}

export const BOOK_CATEGORIES = [
  { code: "general", labelAr: "عام", labelEn: "General" },
  { code: "quran", labelAr: "علوم القرآن", labelEn: "Quran" },
  { code: "tafseer", labelAr: "التفسير", labelEn: "Tafseer" },
  { code: "hadith", labelAr: "الحديث", labelEn: "Hadith" },
  { code: "fiqh", labelAr: "الفقه", labelEn: "Fiqh" },
  { code: "aqeedah", labelAr: "العقيدة", labelEn: "Aqeedah" },
  { code: "seerah", labelAr: "السيرة", labelEn: "Seerah" },
  { code: "tajweed", labelAr: "التجويد", labelEn: "Tajweed" },
  { code: "arabic", labelAr: "اللغة العربية", labelEn: "Arabic Language" },
  { code: "history", labelAr: "التاريخ الإسلامي", labelEn: "Islamic History" },
] as const

export type BookCategoryCode = (typeof BOOK_CATEGORIES)[number]["code"]
