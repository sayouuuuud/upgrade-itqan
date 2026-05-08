import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { getPrayerTimes, getPrayerTimesByCoordinates, getNextPrayer } from "@/lib/external/aladhan-api"
import type { CalculationMethod } from "@/lib/external/aladhan-api"

/**
 * GET /api/prayer-times
 * Get today's prayer times for the user.
 * Priority: query params → saved user city → "Riyadh"
 *
 * Query params:
 * - city: City name override
 * - country: Country name override
 * - lat: Latitude (optional, if provided with lng, uses coordinates)
 * - lng: Longitude (optional)
 * - method: Calculation method (default: "makkah")
 */

// Cities list for country lookup
const CITY_COUNTRY_MAP: Record<string, string> = {
  'Makkah': 'Saudi Arabia', 'Madinah': 'Saudi Arabia', 'Riyadh': 'Saudi Arabia',
  'Jeddah': 'Saudi Arabia', 'Dammam': 'Saudi Arabia',
  'Cairo': 'Egypt', 'Alexandria': 'Egypt', 'Giza': 'Egypt',
  'Dubai': 'UAE', 'Abu Dhabi': 'UAE',
  'Kuwait City': 'Kuwait', 'Doha': 'Qatar', 'Manama': 'Bahrain',
  'Muscat': 'Oman', 'Amman': 'Jordan', 'Beirut': 'Lebanon',
  'Damascus': 'Syria', 'Baghdad': 'Iraq', 'Tunis': 'Tunisia',
  'Algiers': 'Algeria', 'Casablanca': 'Morocco', 'Rabat': 'Morocco',
  'Khartoum': 'Sudan', 'Istanbul': 'Turkey',
  'London': 'United Kingdom', 'Paris': 'France',
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)

    // Fetch user's saved city from DB if no explicit city param
    let savedCity: string | null = null
    if (!searchParams.get("city")) {
      const rows = await query<{ city: string | null }>(
        `SELECT city FROM users WHERE id = $1`,
        [session.sub]
      )
      savedCity = rows[0]?.city || null
    }

    // Get parameters — query param > saved city > default
    const city = searchParams.get("city") || savedCity || "Riyadh"
    const country = searchParams.get("country") || CITY_COUNTRY_MAP[city] || "Saudi Arabia"
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const method = (searchParams.get("method") || "makkah") as CalculationMethod

    let prayerTimes

    // Use coordinates if provided, otherwise use city/country
    if (lat && lng) {
      const latitude = parseFloat(lat)
      const longitude = parseFloat(lng)

      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json({ 
          error: "إحداثيات غير صالحة" 
        }, { status: 400 })
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return NextResponse.json({ 
          error: "الإحداثيات خارج النطاق المسموح" 
        }, { status: 400 })
      }

      prayerTimes = await getPrayerTimesByCoordinates(latitude, longitude, method)
    } else {
      prayerTimes = await getPrayerTimes(city, country, method)
    }

    // Get next prayer info
    const nextPrayer = getNextPrayer(prayerTimes)

    return NextResponse.json({
      success: true,
      data: {
        timings: {
          fajr: prayerTimes.fajr,
          sunrise: prayerTimes.sunrise,
          dhuhr: prayerTimes.dhuhr,
          asr: prayerTimes.asr,
          maghrib: prayerTimes.maghrib,
          isha: prayerTimes.isha
        },
        date: prayerTimes.date,
        location: {
          city: prayerTimes.city || city,
          country: prayerTimes.country || country,
          timezone: prayerTimes.timezone,
          isSavedCity: !!savedCity && !searchParams.get("city"),
        },
        nextPrayer
      }
    })
  } catch (error) {
    console.error("[API] Error fetching prayer times:", error)
    return NextResponse.json({ 
      error: "حدث خطأ في جلب مواقيت الصلاة" 
    }, { status: 500 })
  }
}
