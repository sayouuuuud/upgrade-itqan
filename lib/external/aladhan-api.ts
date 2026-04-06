/**
 * Aladhan Prayer Times API Service
 * Integration with api.aladhan.com for prayer times
 */

// Types
export interface PrayerTimings {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Sunset: string
  Maghrib: string
  Isha: string
  Imsak: string
  Midnight: string
  Firstthird: string
  Lastthird: string
}

export interface DateInfo {
  readable: string
  timestamp: string
  gregorian: {
    date: string
    format: string
    day: string
    weekday: { en: string }
    month: { number: number; en: string }
    year: string
  }
  hijri: {
    date: string
    format: string
    day: string
    weekday: { en: string; ar: string }
    month: { number: number; en: string; ar: string }
    year: string
    designation: { abbreviated: string; expanded: string }
  }
}

export interface PrayerTimesResponse {
  timings: PrayerTimings
  date: DateInfo
  meta: {
    latitude: number
    longitude: number
    timezone: string
    method: {
      id: number
      name: string
    }
  }
}

export interface SimplePrayerTimes {
  fajr: string
  sunrise: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
  date: {
    gregorian: string
    hijri: string
    hijriMonth: string
    weekday: string
  }
  timezone: string
  city: string
  country: string
}

// Calculation methods
export type CalculationMethod = 
  | 'muslim_world_league' // 1
  | 'isna' // 2
  | 'egypt' // 3
  | 'makkah' // 4 - Umm Al-Qura
  | 'karachi' // 5
  | 'tehran' // 6
  | 'jafari' // 7
  | 'gulf' // 8
  | 'kuwait' // 9
  | 'qatar' // 10
  | 'singapore' // 11
  | 'france' // 12
  | 'turkey' // 13
  | 'russia' // 14
  | 'moonsighting' // 15
  | 'dubai' // 16
  | 'jakim' // 17
  | 'tunisia' // 18
  | 'algeria' // 19
  | 'kemenag' // 20
  | 'morocco' // 21
  | 'comunidade' // 22
  | 'custom' // 99

const METHOD_IDS: Record<CalculationMethod, number> = {
  muslim_world_league: 1,
  isna: 2,
  egypt: 3,
  makkah: 4,
  karachi: 5,
  tehran: 6,
  jafari: 7,
  gulf: 8,
  kuwait: 9,
  qatar: 10,
  singapore: 11,
  france: 12,
  turkey: 13,
  russia: 14,
  moonsighting: 15,
  dubai: 16,
  jakim: 17,
  tunisia: 18,
  algeria: 19,
  kemenag: 20,
  morocco: 21,
  comunidade: 22,
  custom: 99
}

const ALADHAN_API_BASE = 'https://api.aladhan.com/v1'

/**
 * Get prayer times by city name
 */
export async function getPrayerTimes(
  city: string,
  country: string,
  method: CalculationMethod = 'makkah'
): Promise<SimplePrayerTimes> {
  try {
    const methodId = METHOD_IDS[method] || 4

    const response = await fetch(
      `${ALADHAN_API_BASE}/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${methodId}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )

    if (!response.ok) {
      throw new Error(`Aladhan API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.code !== 200 || !data.data) {
      throw new Error(data.status || 'Failed to fetch prayer times')
    }

    const result = data.data as PrayerTimesResponse

    return {
      fajr: result.timings.Fajr.replace(' (EET)', '').replace(' (AST)', '').trim(),
      sunrise: result.timings.Sunrise.replace(' (EET)', '').replace(' (AST)', '').trim(),
      dhuhr: result.timings.Dhuhr.replace(' (EET)', '').replace(' (AST)', '').trim(),
      asr: result.timings.Asr.replace(' (EET)', '').replace(' (AST)', '').trim(),
      maghrib: result.timings.Maghrib.replace(' (EET)', '').replace(' (AST)', '').trim(),
      isha: result.timings.Isha.replace(' (EET)', '').replace(' (AST)', '').trim(),
      date: {
        gregorian: result.date.gregorian.date,
        hijri: result.date.hijri.date,
        hijriMonth: result.date.hijri.month.ar,
        weekday: result.date.hijri.weekday.ar
      },
      timezone: result.meta.timezone,
      city,
      country
    }
  } catch (error) {
    console.error('[AladhanAPI] Error fetching prayer times:', error)
    throw error
  }
}

/**
 * Get prayer times by coordinates
 */
export async function getPrayerTimesByCoordinates(
  latitude: number,
  longitude: number,
  method: CalculationMethod = 'makkah'
): Promise<SimplePrayerTimes> {
  try {
    const methodId = METHOD_IDS[method] || 4

    const response = await fetch(
      `${ALADHAN_API_BASE}/timings?latitude=${latitude}&longitude=${longitude}&method=${methodId}`,
      { next: { revalidate: 3600 } }
    )

    if (!response.ok) {
      throw new Error(`Aladhan API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.code !== 200 || !data.data) {
      throw new Error(data.status || 'Failed to fetch prayer times')
    }

    const result = data.data as PrayerTimesResponse

    return {
      fajr: result.timings.Fajr.replace(' (EET)', '').replace(' (AST)', '').trim(),
      sunrise: result.timings.Sunrise.replace(' (EET)', '').replace(' (AST)', '').trim(),
      dhuhr: result.timings.Dhuhr.replace(' (EET)', '').replace(' (AST)', '').trim(),
      asr: result.timings.Asr.replace(' (EET)', '').replace(' (AST)', '').trim(),
      maghrib: result.timings.Maghrib.replace(' (EET)', '').replace(' (AST)', '').trim(),
      isha: result.timings.Isha.replace(' (EET)', '').replace(' (AST)', '').trim(),
      date: {
        gregorian: result.date.gregorian.date,
        hijri: result.date.hijri.date,
        hijriMonth: result.date.hijri.month.ar,
        weekday: result.date.hijri.weekday.ar
      },
      timezone: result.meta.timezone,
      city: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      country: 'Coordinates'
    }
  } catch (error) {
    console.error('[AladhanAPI] Error fetching prayer times by coordinates:', error)
    throw error
  }
}

/**
 * Get Hijri date for today
 */
export async function getHijriDate(): Promise<DateInfo['hijri'] | null> {
  try {
    const response = await fetch(
      `${ALADHAN_API_BASE}/gpiToH`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    )

    if (!response.ok) {
      throw new Error(`Aladhan API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data?.hijri || null
  } catch (error) {
    console.error('[AladhanAPI] Error fetching Hijri date:', error)
    return null
  }
}

/**
 * Check if current time is within a time window after a prayer
 */
export function isWithinTimeWindow(
  prayerTime: string,
  windowMinutes: number = 60,
  timezone: string = 'Asia/Riyadh'
): boolean {
  try {
    const now = new Date()
    
    // Parse prayer time (format: "HH:mm")
    const [hours, minutes] = prayerTime.split(':').map(Number)
    
    // Create date object for prayer time today
    const prayerDate = new Date()
    prayerDate.setHours(hours, minutes, 0, 0)
    
    // Calculate window end
    const windowEnd = new Date(prayerDate.getTime() + windowMinutes * 60 * 1000)
    
    // Check if current time is between prayer time and window end
    return now >= prayerDate && now <= windowEnd
  } catch (error) {
    console.error('[AladhanAPI] Error checking time window:', error)
    return false
  }
}

/**
 * Get the next prayer based on current time
 */
export function getNextPrayer(timings: SimplePrayerTimes): {
  name: string
  nameAr: string
  time: string
  minutesUntil: number
} | null {
  try {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const prayers = [
      { name: 'fajr', nameAr: 'الفجر', time: timings.fajr },
      { name: 'sunrise', nameAr: 'الشروق', time: timings.sunrise },
      { name: 'dhuhr', nameAr: 'الظهر', time: timings.dhuhr },
      { name: 'asr', nameAr: 'العصر', time: timings.asr },
      { name: 'maghrib', nameAr: 'المغرب', time: timings.maghrib },
      { name: 'isha', nameAr: 'العشاء', time: timings.isha }
    ]

    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number)
      const prayerMinutes = hours * 60 + minutes

      if (prayerMinutes > currentMinutes) {
        return {
          name: prayer.name,
          nameAr: prayer.nameAr,
          time: prayer.time,
          minutesUntil: prayerMinutes - currentMinutes
        }
      }
    }

    // If all prayers have passed, return Fajr for tomorrow
    const [fajrHours, fajrMinutes] = timings.fajr.split(':').map(Number)
    const fajrTotalMinutes = fajrHours * 60 + fajrMinutes
    const minutesUntilMidnight = 24 * 60 - currentMinutes

    return {
      name: 'fajr',
      nameAr: 'الفجر',
      time: timings.fajr,
      minutesUntil: minutesUntilMidnight + fajrTotalMinutes
    }
  } catch (error) {
    console.error('[AladhanAPI] Error getting next prayer:', error)
    return null
  }
}

/**
 * Get Arabic name for prayer
 */
export function getPrayerArabicName(prayer: keyof SimplePrayerTimes): string {
  const names: Record<string, string> = {
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء'
  }
  return names[prayer] || prayer
}
