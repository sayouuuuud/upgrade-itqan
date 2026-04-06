import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getPrayerTimes, getPrayerTimesByCoordinates, getNextPrayer } from "@/lib/external/aladhan-api"
import type { CalculationMethod } from "@/lib/external/aladhan-api"

/**
 * GET /api/prayer-times
 * Get today's prayer times for the user
 * 
 * Query params:
 * - city: City name (default: "Riyadh")
 * - country: Country name (default: "Saudi Arabia")
 * - lat: Latitude (optional, if provided with lng, uses coordinates)
 * - lng: Longitude (optional)
 * - method: Calculation method (default: "makkah")
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    
    // Get parameters
    const city = searchParams.get("city") || "Riyadh"
    const country = searchParams.get("country") || "Saudi Arabia"
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
          city: prayerTimes.city,
          country: prayerTimes.country,
          timezone: prayerTimes.timezone
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
