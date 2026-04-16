/**
 * Quran API Service
 * Integration with api.quran.com/v4 for fetching Quran data
 */

// Types
export interface Surah {
  id: number
  revelation_place: string
  revelation_order: number
  bismillah_pre: boolean
  name_simple: string
  name_complex: string
  name_arabic: string
  verses_count: number
  pages: number[]
  translated_name: {
    language_name: string
    name: string
  }
}

export interface Ayah {
  id: number
  verse_number: number
  verse_key: string
  hizb_number: number
  rub_el_hizb_number: number
  ruku_number: number
  manzil_number: number
  sajdah_number: number | null
  page_number: number
  juz_number: number
  text_uthmani: string
  text_imlaei?: string
  words?: Word[]
}

export interface Word {
  id: number
  position: number
  text_uthmani: string
  text_imlaei?: string
  translation?: {
    text: string
    language_name: string
  }
}

export interface Reciter {
  id: number
  reciter_name: string
  style: string | null
  translated_name: {
    name: string
    language_name: string
  }
}

export interface AudioFile {
  url: string
  format: string
  segments?: number[][]
}

// Riwaya/Qira'at types
export type Riwaya = 'hafs' | 'warsh' | 'qalun' | 'duri' | 'susi'
export type RecitationType = 'memorization' | 'review' | 'tajweed' | 'tilawa'

// API Base URL
const QURAN_API_BASE = 'https://api.quran.com/api/v4'

// Cache for surahs list (rarely changes)
let surahsCache: Surah[] | null = null
let surahsCacheTime: number = 0
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

/**
 * Get all 114 Surahs
 */
export async function getAllSurahs(): Promise<Surah[]> {
  // Return cached if valid
  if (surahsCache && Date.now() - surahsCacheTime < CACHE_DURATION) {
    return surahsCache
  }

  try {
    const response = await fetch(`${QURAN_API_BASE}/chapters?language=ar`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Quran API error: ${response.status}`)
    }

    const data = await response.json()
    surahsCache = data.chapters as Surah[]
    surahsCacheTime = Date.now()

    return surahsCache
  } catch (error) {
    console.error('[QuranAPI] Error fetching surahs:', error)
    throw error
  }
}

/**
 * Get a specific Surah by ID
 */
export async function getSurah(surahId: number): Promise<Surah | null> {
  try {
    const response = await fetch(`${QURAN_API_BASE}/chapters/${surahId}?language=ar`, {
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Quran API error: ${response.status}`)
    }

    const data = await response.json()
    return data.chapter as Surah
  } catch (error) {
    console.error(`[QuranAPI] Error fetching surah ${surahId}:`, error)
    throw error
  }
}

/**
 * Get Ayahs for a Surah with optional range
 */
export async function getSurahAyahs(
  surahId: number,
  startAyah?: number,
  endAyah?: number
): Promise<Ayah[]> {
  try {
    // Validate surah ID
    if (surahId < 1 || surahId > 114) {
      throw new Error('Invalid surah ID. Must be between 1 and 114.')
    }

    // Fetch all verses for the surah
    const response = await fetch(
      `${QURAN_API_BASE}/verses/by_chapter/${surahId}?language=ar&words=true&per_page=300`,
      { next: { revalidate: 3600 } }
    )

    if (!response.ok) {
      throw new Error(`Quran API error: ${response.status}`)
    }

    const data = await response.json()
    let ayahs = data.verses as Ayah[]

    // Filter by range if provided
    if (startAyah !== undefined && endAyah !== undefined) {
      ayahs = ayahs.filter(
        (ayah) => ayah.verse_number >= startAyah && ayah.verse_number <= endAyah
      )
    } else if (startAyah !== undefined) {
      ayahs = ayahs.filter((ayah) => ayah.verse_number >= startAyah)
    } else if (endAyah !== undefined) {
      ayahs = ayahs.filter((ayah) => ayah.verse_number <= endAyah)
    }

    return ayahs
  } catch (error) {
    console.error(`[QuranAPI] Error fetching ayahs for surah ${surahId}:`, error)
    throw error
  }
}

/**
 * Get a specific Ayah by key (e.g., "2:255" for Ayat al-Kursi)
 */
export async function getAyahByKey(verseKey: string): Promise<Ayah | null> {
  try {
    const response = await fetch(
      `${QURAN_API_BASE}/verses/by_key/${verseKey}?language=ar&words=true`,
      { next: { revalidate: 3600 } }
    )

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Quran API error: ${response.status}`)
    }

    const data = await response.json()
    return data.verse as Ayah
  } catch (error) {
    console.error(`[QuranAPI] Error fetching ayah ${verseKey}:`, error)
    throw error
  }
}

/**
 * Get available reciters for audio
 */
export async function getReciters(): Promise<Reciter[]> {
  try {
    const response = await fetch(`${QURAN_API_BASE}/resources/recitations?language=ar`, {
      next: { revalidate: 86400 } // Cache for 24 hours
    })

    if (!response.ok) {
      throw new Error(`Quran API error: ${response.status}`)
    }

    const data = await response.json()
    return data.recitations as Reciter[]
  } catch (error) {
    console.error('[QuranAPI] Error fetching reciters:', error)
    throw error
  }
}

/**
 * Get audio URL for a specific ayah range
 */
export async function getAudioUrl(
  surahId: number,
  reciterId: number = 7, // Default: Mishary Rashid Al-Afasy
  startAyah?: number,
  endAyah?: number
): Promise<AudioFile[]> {
  try {
    let url = `${QURAN_API_BASE}/recitations/${reciterId}/by_chapter/${surahId}`
    
    const response = await fetch(url, { next: { revalidate: 3600 } })

    if (!response.ok) {
      throw new Error(`Quran API error: ${response.status}`)
    }

    const data = await response.json()
    let audioFiles = data.audio_files as AudioFile[]

    // Filter by ayah range if provided
    if (startAyah !== undefined || endAyah !== undefined) {
      // Note: This is a simplified filter - actual implementation may need segment filtering
      audioFiles = audioFiles.slice(
        startAyah ? startAyah - 1 : 0,
        endAyah || audioFiles.length
      )
    }

    return audioFiles
  } catch (error) {
    console.error(`[QuranAPI] Error fetching audio for surah ${surahId}:`, error)
    throw error
  }
}

/**
 * Validate surah and ayah range
 */
export async function validateQuranReference(
  surahNumber: number,
  fromAyah: number,
  toAyah: number
): Promise<{ valid: boolean; error?: string; surahName?: string; versesCount?: number }> {
  try {
    const surah = await getSurah(surahNumber)
    
    if (!surah) {
      return { valid: false, error: 'سورة غير موجودة' }
    }

    if (fromAyah < 1) {
      return { valid: false, error: 'رقم الآية يجب أن يكون 1 أو أكثر' }
    }

    if (toAyah > surah.verses_count) {
      return { 
        valid: false, 
        error: `سورة ${surah.name_arabic} تحتوي على ${surah.verses_count} آيات فقط` 
      }
    }

    if (fromAyah > toAyah) {
      return { valid: false, error: 'آية البداية يجب أن تكون قبل آية النهاية' }
    }

    return { 
      valid: true, 
      surahName: surah.name_arabic,
      versesCount: surah.verses_count
    }
  } catch (error) {
    console.error('[QuranAPI] Validation error:', error)
    return { valid: false, error: 'خطأ في التحقق من البيانات' }
  }
}

/**
 * Map riwaya name to Arabic
 */
export function getRiwayaArabicName(riwaya: Riwaya): string {
  const names: Record<Riwaya, string> = {
    hafs: 'حفص عن عاصم',
    warsh: 'ورش عن نافع',
    qalun: 'قالون عن نافع',
    duri: 'الدوري عن أبي عمرو',
    susi: 'السوسي عن أبي عمرو'
  }
  return names[riwaya] || 'حفص عن عاصم'
}

/**
 * Map recitation type to Arabic
 */
export function getRecitationTypeArabicName(type: RecitationType): string {
  const names: Record<RecitationType, string> = {
    memorization: 'حفظ',
    review: 'مراجعة',
    tajweed: 'تجويد',
    tilawa: 'تلاوة'
  }
  return names[type] || 'تلاوة'
}
