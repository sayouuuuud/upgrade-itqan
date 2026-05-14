/**
 * Lightweight reference data for Quran:
 * - 114 surahs (number, Arabic name, total ayahs, juz where it starts, page where it starts)
 * - 30 juz with starting surah/ayah/page
 * - Helpers to slice ranges into units (juz / surah / hizb / page)
 *
 * Numbers follow the standard Madani Mushaf (King Fahd / Madinah print).
 */

export type SurahInfo = {
  number: number
  name: string         // Arabic name without "سورة"
  fullName: string     // includes "سورة "
  ayahs: number
  startJuz: number
  startPage: number    // page in Madani Mushaf where surah starts
}

export const SURAHS: SurahInfo[] = [
  { number: 1,   name: 'الفاتحة',        fullName: 'سورة الفاتحة',        ayahs: 7,    startJuz: 1,  startPage: 1 },
  { number: 2,   name: 'البقرة',         fullName: 'سورة البقرة',         ayahs: 286,  startJuz: 1,  startPage: 2 },
  { number: 3,   name: 'آل عمران',       fullName: 'سورة آل عمران',       ayahs: 200,  startJuz: 3,  startPage: 50 },
  { number: 4,   name: 'النساء',         fullName: 'سورة النساء',         ayahs: 176,  startJuz: 4,  startPage: 77 },
  { number: 5,   name: 'المائدة',        fullName: 'سورة المائدة',        ayahs: 120,  startJuz: 6,  startPage: 106 },
  { number: 6,   name: 'الأنعام',        fullName: 'سورة الأنعام',        ayahs: 165,  startJuz: 7,  startPage: 128 },
  { number: 7,   name: 'الأعراف',        fullName: 'سورة الأعراف',        ayahs: 206,  startJuz: 8,  startPage: 151 },
  { number: 8,   name: 'الأنفال',        fullName: 'سورة الأنفال',        ayahs: 75,   startJuz: 9,  startPage: 177 },
  { number: 9,   name: 'التوبة',         fullName: 'سورة التوبة',         ayahs: 129,  startJuz: 10, startPage: 187 },
  { number: 10,  name: 'يونس',           fullName: 'سورة يونس',           ayahs: 109,  startJuz: 11, startPage: 208 },
  { number: 11,  name: 'هود',            fullName: 'سورة هود',            ayahs: 123,  startJuz: 11, startPage: 221 },
  { number: 12,  name: 'يوسف',           fullName: 'سورة يوسف',           ayahs: 111,  startJuz: 12, startPage: 235 },
  { number: 13,  name: 'الرعد',          fullName: 'سورة الرعد',          ayahs: 43,   startJuz: 13, startPage: 249 },
  { number: 14,  name: 'إبراهيم',        fullName: 'سورة إبراهيم',        ayahs: 52,   startJuz: 13, startPage: 255 },
  { number: 15,  name: 'الحجر',          fullName: 'سورة الحجر',          ayahs: 99,   startJuz: 14, startPage: 262 },
  { number: 16,  name: 'النحل',          fullName: 'سورة النحل',          ayahs: 128,  startJuz: 14, startPage: 267 },
  { number: 17,  name: 'الإسراء',        fullName: 'سورة الإسراء',        ayahs: 111,  startJuz: 15, startPage: 282 },
  { number: 18,  name: 'الكهف',          fullName: 'سورة الكهف',          ayahs: 110,  startJuz: 15, startPage: 293 },
  { number: 19,  name: 'مريم',           fullName: 'سورة مريم',           ayahs: 98,   startJuz: 16, startPage: 305 },
  { number: 20,  name: 'طه',             fullName: 'سورة طه',             ayahs: 135,  startJuz: 16, startPage: 312 },
  { number: 21,  name: 'الأنبياء',       fullName: 'سورة الأنبياء',       ayahs: 112,  startJuz: 17, startPage: 322 },
  { number: 22,  name: 'الحج',           fullName: 'سورة الحج',           ayahs: 78,   startJuz: 17, startPage: 332 },
  { number: 23,  name: 'المؤمنون',       fullName: 'سورة المؤمنون',       ayahs: 118,  startJuz: 18, startPage: 342 },
  { number: 24,  name: 'النور',          fullName: 'سورة النور',          ayahs: 64,   startJuz: 18, startPage: 350 },
  { number: 25,  name: 'الفرقان',        fullName: 'سورة الفرقان',        ayahs: 77,   startJuz: 18, startPage: 359 },
  { number: 26,  name: 'الشعراء',        fullName: 'سورة الشعراء',        ayahs: 227,  startJuz: 19, startPage: 367 },
  { number: 27,  name: 'النمل',          fullName: 'سورة النمل',          ayahs: 93,   startJuz: 19, startPage: 377 },
  { number: 28,  name: 'القصص',          fullName: 'سورة القصص',          ayahs: 88,   startJuz: 20, startPage: 385 },
  { number: 29,  name: 'العنكبوت',       fullName: 'سورة العنكبوت',       ayahs: 69,   startJuz: 20, startPage: 396 },
  { number: 30,  name: 'الروم',          fullName: 'سورة الروم',          ayahs: 60,   startJuz: 21, startPage: 404 },
  { number: 31,  name: 'لقمان',          fullName: 'سورة لقمان',          ayahs: 34,   startJuz: 21, startPage: 411 },
  { number: 32,  name: 'السجدة',         fullName: 'سورة السجدة',         ayahs: 30,   startJuz: 21, startPage: 415 },
  { number: 33,  name: 'الأحزاب',        fullName: 'سورة الأحزاب',        ayahs: 73,   startJuz: 21, startPage: 418 },
  { number: 34,  name: 'سبأ',            fullName: 'سورة سبأ',            ayahs: 54,   startJuz: 22, startPage: 428 },
  { number: 35,  name: 'فاطر',           fullName: 'سورة فاطر',           ayahs: 45,   startJuz: 22, startPage: 434 },
  { number: 36,  name: 'يس',             fullName: 'سورة يس',             ayahs: 83,   startJuz: 22, startPage: 440 },
  { number: 37,  name: 'الصافات',        fullName: 'سورة الصافات',        ayahs: 182,  startJuz: 23, startPage: 446 },
  { number: 38,  name: 'ص',              fullName: 'سورة ص',              ayahs: 88,   startJuz: 23, startPage: 453 },
  { number: 39,  name: 'الزمر',          fullName: 'سورة الزمر',          ayahs: 75,   startJuz: 23, startPage: 458 },
  { number: 40,  name: 'غافر',           fullName: 'سورة غافر',           ayahs: 85,   startJuz: 24, startPage: 467 },
  { number: 41,  name: 'فصلت',           fullName: 'سورة فصلت',           ayahs: 54,   startJuz: 24, startPage: 477 },
  { number: 42,  name: 'الشورى',         fullName: 'سورة الشورى',         ayahs: 53,   startJuz: 25, startPage: 483 },
  { number: 43,  name: 'الزخرف',         fullName: 'سورة الزخرف',         ayahs: 89,   startJuz: 25, startPage: 489 },
  { number: 44,  name: 'الدخان',         fullName: 'سورة الدخان',         ayahs: 59,   startJuz: 25, startPage: 496 },
  { number: 45,  name: 'الجاثية',        fullName: 'سورة الجاثية',        ayahs: 37,   startJuz: 25, startPage: 499 },
  { number: 46,  name: 'الأحقاف',        fullName: 'سورة الأحقاف',        ayahs: 35,   startJuz: 26, startPage: 502 },
  { number: 47,  name: 'محمد',           fullName: 'سورة محمد',           ayahs: 38,   startJuz: 26, startPage: 507 },
  { number: 48,  name: 'الفتح',          fullName: 'سورة الفتح',          ayahs: 29,   startJuz: 26, startPage: 511 },
  { number: 49,  name: 'الحجرات',        fullName: 'سورة الحجرات',        ayahs: 18,   startJuz: 26, startPage: 515 },
  { number: 50,  name: 'ق',              fullName: 'سورة ق',              ayahs: 45,   startJuz: 26, startPage: 518 },
  { number: 51,  name: 'الذاريات',       fullName: 'سورة الذاريات',       ayahs: 60,   startJuz: 26, startPage: 520 },
  { number: 52,  name: 'الطور',          fullName: 'سورة الطور',          ayahs: 49,   startJuz: 27, startPage: 523 },
  { number: 53,  name: 'النجم',          fullName: 'سورة النجم',          ayahs: 62,   startJuz: 27, startPage: 526 },
  { number: 54,  name: 'القمر',          fullName: 'سورة القمر',          ayahs: 55,   startJuz: 27, startPage: 528 },
  { number: 55,  name: 'الرحمن',         fullName: 'سورة الرحمن',         ayahs: 78,   startJuz: 27, startPage: 531 },
  { number: 56,  name: 'الواقعة',        fullName: 'سورة الواقعة',        ayahs: 96,   startJuz: 27, startPage: 534 },
  { number: 57,  name: 'الحديد',         fullName: 'سورة الحديد',         ayahs: 29,   startJuz: 27, startPage: 537 },
  { number: 58,  name: 'المجادلة',       fullName: 'سورة المجادلة',       ayahs: 22,   startJuz: 28, startPage: 542 },
  { number: 59,  name: 'الحشر',          fullName: 'سورة الحشر',          ayahs: 24,   startJuz: 28, startPage: 545 },
  { number: 60,  name: 'الممتحنة',       fullName: 'سورة الممتحنة',       ayahs: 13,   startJuz: 28, startPage: 549 },
  { number: 61,  name: 'الصف',           fullName: 'سورة الصف',           ayahs: 14,   startJuz: 28, startPage: 551 },
  { number: 62,  name: 'الجمعة',         fullName: 'سورة الجمعة',         ayahs: 11,   startJuz: 28, startPage: 553 },
  { number: 63,  name: 'المنافقون',      fullName: 'سورة المنافقون',      ayahs: 11,   startJuz: 28, startPage: 554 },
  { number: 64,  name: 'التغابن',        fullName: 'سورة التغابن',        ayahs: 18,   startJuz: 28, startPage: 556 },
  { number: 65,  name: 'الطلاق',         fullName: 'سورة الطلاق',         ayahs: 12,   startJuz: 28, startPage: 558 },
  { number: 66,  name: 'التحريم',        fullName: 'سورة التحريم',        ayahs: 12,   startJuz: 28, startPage: 560 },
  { number: 67,  name: 'الملك',          fullName: 'سورة الملك',          ayahs: 30,   startJuz: 29, startPage: 562 },
  { number: 68,  name: 'القلم',          fullName: 'سورة القلم',          ayahs: 52,   startJuz: 29, startPage: 564 },
  { number: 69,  name: 'الحاقة',         fullName: 'سورة الحاقة',         ayahs: 52,   startJuz: 29, startPage: 566 },
  { number: 70,  name: 'المعارج',        fullName: 'سورة المعارج',        ayahs: 44,   startJuz: 29, startPage: 568 },
  { number: 71,  name: 'نوح',            fullName: 'سورة نوح',            ayahs: 28,   startJuz: 29, startPage: 570 },
  { number: 72,  name: 'الجن',           fullName: 'سورة الجن',           ayahs: 28,   startJuz: 29, startPage: 572 },
  { number: 73,  name: 'المزمل',         fullName: 'سورة المزمل',         ayahs: 20,   startJuz: 29, startPage: 574 },
  { number: 74,  name: 'المدثر',         fullName: 'سورة المدثر',         ayahs: 56,   startJuz: 29, startPage: 575 },
  { number: 75,  name: 'القيامة',        fullName: 'سورة القيامة',        ayahs: 40,   startJuz: 29, startPage: 577 },
  { number: 76,  name: 'الإنسان',        fullName: 'سورة الإنسان',        ayahs: 31,   startJuz: 29, startPage: 578 },
  { number: 77,  name: 'المرسلات',       fullName: 'سورة المرسلات',       ayahs: 50,   startJuz: 29, startPage: 580 },
  { number: 78,  name: 'النبأ',          fullName: 'سورة النبأ',          ayahs: 40,   startJuz: 30, startPage: 582 },
  { number: 79,  name: 'النازعات',       fullName: 'سورة النازعات',       ayahs: 46,   startJuz: 30, startPage: 583 },
  { number: 80,  name: 'عبس',            fullName: 'سورة عبس',            ayahs: 42,   startJuz: 30, startPage: 585 },
  { number: 81,  name: 'التكوير',        fullName: 'سورة التكوير',        ayahs: 29,   startJuz: 30, startPage: 586 },
  { number: 82,  name: 'الانفطار',       fullName: 'سورة الانفطار',       ayahs: 19,   startJuz: 30, startPage: 587 },
  { number: 83,  name: 'المطففين',       fullName: 'سورة المطففين',       ayahs: 36,   startJuz: 30, startPage: 587 },
  { number: 84,  name: 'الانشقاق',       fullName: 'سورة الانشقاق',       ayahs: 25,   startJuz: 30, startPage: 589 },
  { number: 85,  name: 'البروج',         fullName: 'سورة البروج',         ayahs: 22,   startJuz: 30, startPage: 590 },
  { number: 86,  name: 'الطارق',         fullName: 'سورة الطارق',         ayahs: 17,   startJuz: 30, startPage: 591 },
  { number: 87,  name: 'الأعلى',         fullName: 'سورة الأعلى',         ayahs: 19,   startJuz: 30, startPage: 591 },
  { number: 88,  name: 'الغاشية',        fullName: 'سورة الغاشية',        ayahs: 26,   startJuz: 30, startPage: 592 },
  { number: 89,  name: 'الفجر',          fullName: 'سورة الفجر',          ayahs: 30,   startJuz: 30, startPage: 593 },
  { number: 90,  name: 'البلد',          fullName: 'سورة البلد',          ayahs: 20,   startJuz: 30, startPage: 594 },
  { number: 91,  name: 'الشمس',          fullName: 'سورة الشمس',          ayahs: 15,   startJuz: 30, startPage: 595 },
  { number: 92,  name: 'الليل',          fullName: 'سورة الليل',          ayahs: 21,   startJuz: 30, startPage: 595 },
  { number: 93,  name: 'الضحى',          fullName: 'سورة الضحى',          ayahs: 11,   startJuz: 30, startPage: 596 },
  { number: 94,  name: 'الشرح',          fullName: 'سورة الشرح',          ayahs: 8,    startJuz: 30, startPage: 596 },
  { number: 95,  name: 'التين',          fullName: 'سورة التين',          ayahs: 8,    startJuz: 30, startPage: 597 },
  { number: 96,  name: 'العلق',          fullName: 'سورة العلق',          ayahs: 19,   startJuz: 30, startPage: 597 },
  { number: 97,  name: 'القدر',          fullName: 'سورة القدر',          ayahs: 5,    startJuz: 30, startPage: 598 },
  { number: 98,  name: 'البينة',         fullName: 'سورة البينة',         ayahs: 8,    startJuz: 30, startPage: 598 },
  { number: 99,  name: 'الزلزلة',        fullName: 'سورة الزلزلة',        ayahs: 8,    startJuz: 30, startPage: 599 },
  { number: 100, name: 'العاديات',       fullName: 'سورة العاديات',       ayahs: 11,   startJuz: 30, startPage: 599 },
  { number: 101, name: 'القارعة',        fullName: 'سورة القارعة',        ayahs: 11,   startJuz: 30, startPage: 600 },
  { number: 102, name: 'التكاثر',        fullName: 'سورة التكاثر',        ayahs: 8,    startJuz: 30, startPage: 600 },
  { number: 103, name: 'العصر',          fullName: 'سورة العصر',          ayahs: 3,    startJuz: 30, startPage: 601 },
  { number: 104, name: 'الهمزة',         fullName: 'سورة الهمزة',         ayahs: 9,    startJuz: 30, startPage: 601 },
  { number: 105, name: 'الفيل',          fullName: 'سورة الفيل',          ayahs: 5,    startJuz: 30, startPage: 601 },
  { number: 106, name: 'قريش',           fullName: 'سورة قريش',           ayahs: 4,    startJuz: 30, startPage: 602 },
  { number: 107, name: 'الماعون',        fullName: 'سورة الماعون',        ayahs: 7,    startJuz: 30, startPage: 602 },
  { number: 108, name: 'الكوثر',         fullName: 'سورة الكوثر',         ayahs: 3,    startJuz: 30, startPage: 602 },
  { number: 109, name: 'الكافرون',       fullName: 'سورة الكافرون',       ayahs: 6,    startJuz: 30, startPage: 603 },
  { number: 110, name: 'النصر',          fullName: 'سورة النصر',          ayahs: 3,    startJuz: 30, startPage: 603 },
  { number: 111, name: 'المسد',          fullName: 'سورة المسد',          ayahs: 5,    startJuz: 30, startPage: 603 },
  { number: 112, name: 'الإخلاص',        fullName: 'سورة الإخلاص',        ayahs: 4,    startJuz: 30, startPage: 604 },
  { number: 113, name: 'الفلق',          fullName: 'سورة الفلق',          ayahs: 5,    startJuz: 30, startPage: 604 },
  { number: 114, name: 'الناس',          fullName: 'سورة الناس',          ayahs: 6,    startJuz: 30, startPage: 604 },
]

export type JuzInfo = {
  number: number     // 1..30
  name: string       // e.g. "الجزء الأول" / "جزء عم"
  startSurah: number
  startAyah: number
  startPage: number
  surahs: number[]   // surahs that have content in this juz
}

// Standard juz boundaries (start surah + start ayah).
export const JUZ_BOUNDS: Array<{ surah: number; ayah: number; page: number }> = [
  { surah: 1,  ayah: 1,   page: 1 },     // 1
  { surah: 2,  ayah: 142, page: 22 },    // 2
  { surah: 2,  ayah: 253, page: 42 },    // 3
  { surah: 3,  ayah: 93,  page: 62 },    // 4
  { surah: 4,  ayah: 24,  page: 82 },    // 5
  { surah: 4,  ayah: 148, page: 102 },   // 6
  { surah: 5,  ayah: 82,  page: 121 },   // 7
  { surah: 6,  ayah: 111, page: 142 },   // 8
  { surah: 7,  ayah: 88,  page: 162 },   // 9
  { surah: 8,  ayah: 41,  page: 182 },   // 10
  { surah: 9,  ayah: 93,  page: 201 },   // 11
  { surah: 11, ayah: 6,   page: 222 },   // 12
  { surah: 12, ayah: 53,  page: 242 },   // 13
  { surah: 15, ayah: 1,   page: 262 },   // 14
  { surah: 17, ayah: 1,   page: 282 },   // 15
  { surah: 18, ayah: 75,  page: 302 },   // 16
  { surah: 21, ayah: 1,   page: 322 },   // 17
  { surah: 23, ayah: 1,   page: 342 },   // 18
  { surah: 25, ayah: 21,  page: 362 },   // 19
  { surah: 27, ayah: 56,  page: 382 },   // 20
  { surah: 29, ayah: 46,  page: 402 },   // 21
  { surah: 33, ayah: 31,  page: 422 },   // 22
  { surah: 36, ayah: 28,  page: 442 },   // 23
  { surah: 39, ayah: 32,  page: 462 },   // 24
  { surah: 41, ayah: 47,  page: 482 },   // 25
  { surah: 46, ayah: 1,   page: 502 },   // 26
  { surah: 51, ayah: 31,  page: 522 },   // 27
  { surah: 58, ayah: 1,   page: 542 },   // 28
  { surah: 67, ayah: 1,   page: 562 },   // 29
  { surah: 78, ayah: 1,   page: 582 },   // 30
]

const JUZ_NAMES_AR: Record<number, string> = {
  1:  'الجزء الأول',     2:  'الجزء الثاني',    3:  'الجزء الثالث',    4:  'الجزء الرابع',    5:  'الجزء الخامس',
  6:  'الجزء السادس',    7:  'الجزء السابع',    8:  'الجزء الثامن',    9:  'الجزء التاسع',    10: 'الجزء العاشر',
  11: 'الجزء الحادي عشر', 12: 'الجزء الثاني عشر', 13: 'الجزء الثالث عشر', 14: 'الجزء الرابع عشر', 15: 'الجزء الخامس عشر',
  16: 'الجزء السادس عشر', 17: 'الجزء السابع عشر', 18: 'الجزء الثامن عشر', 19: 'الجزء التاسع عشر', 20: 'الجزء العشرون',
  21: 'الجزء الحادي والعشرون', 22: 'الجزء الثاني والعشرون', 23: 'الجزء الثالث والعشرون', 24: 'الجزء الرابع والعشرون', 25: 'الجزء الخامس والعشرون',
  26: 'الجزء السادس والعشرون', 27: 'الجزء السابع والعشرون', 28: 'الجزء الثامن والعشرون', 29: 'الجزء التاسع والعشرون', 30: 'جزء عم',
}

export function juzName(n: number): string {
  return JUZ_NAMES_AR[n] || `الجزء ${n}`
}

export function getSurah(n: number): SurahInfo | undefined {
  return SURAHS.find(s => s.number === n)
}

export function juzStartingAyah(j: number): { surah: number; ayah: number } | null {
  if (j < 1 || j > 30) return null
  const b = JUZ_BOUNDS[j - 1]
  return b ? { surah: b.surah, ayah: b.ayah } : null
}

export function juzPageRange(j: number): { from: number; to: number } | null {
  if (j < 1 || j > 30) return null
  const from = JUZ_BOUNDS[j - 1].page
  const to = j === 30 ? 604 : JUZ_BOUNDS[j].page - 1
  return { from, to }
}
