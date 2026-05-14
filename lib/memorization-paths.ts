/**
 * Helpers for memorization paths:
 *   - generatePathUnits(): given a path config (type + range + direction)
 *     produces an ordered list of unit rows ready to be inserted.
 *   - lock/unlock helpers: given current progress, decide which unit is unlocked.
 *
 * IMPORTANT: this module does NOT execute any DB queries. Callers run the
 * inserts themselves so we keep DB access centralized in the route handlers.
 */

import { SURAHS, JUZ_BOUNDS, juzName, juzStartingAyah, juzPageRange, getSurah } from "./quran-data"

export type PathUnitType = "juz" | "surah" | "hizb" | "page" | "custom"
export type PathDirection = "asc" | "desc"

export type GeneratedUnit = {
  position: number
  unit_type: "juz" | "surah" | "hizb" | "page" | "range"
  juz_number: number | null
  surah_number: number | null
  hizb_number: number | null
  page_from: number | null
  page_to: number | null
  ayah_from: number | null
  ayah_to: number | null
  surah_name: string | null
  total_ayahs: number | null
  title: string
  description: string | null
  estimated_minutes: number | null
}

function clampRange(from: number, to: number, max: number): { from: number; to: number } {
  const a = Math.max(1, Math.min(max, Math.min(from, to)))
  const b = Math.max(1, Math.min(max, Math.max(from, to)))
  return { from: a, to: b }
}

/**
 * Builds an ordered list of units from a path config.
 *
 * direction='desc' means natural mushaf order (1 → 30 / الفاتحة → الناس).
 * direction='asc' means reverse: e.g. جزء عم → الفاتحة (30 → 1).
 */
export function generatePathUnits(opts: {
  type: PathUnitType
  rangeFrom?: number | null
  rangeTo?: number | null
  direction?: PathDirection
}): GeneratedUnit[] {
  const direction: PathDirection = opts.direction || "desc"
  const reverse = direction === "asc"

  if (opts.type === "juz") {
    const { from, to } = clampRange(opts.rangeFrom ?? 1, opts.rangeTo ?? 30, 30)
    const juzNumbers: number[] = []
    for (let i = from; i <= to; i++) juzNumbers.push(i)
    if (reverse) juzNumbers.reverse()

    return juzNumbers.map((j, idx) => {
      const start = juzStartingAyah(j)
      const range = juzPageRange(j)
      return {
        position: idx + 1,
        unit_type: "juz",
        juz_number: j,
        surah_number: start?.surah ?? null,
        hizb_number: null,
        page_from: range?.from ?? null,
        page_to: range?.to ?? null,
        ayah_from: start?.ayah ?? null,
        ayah_to: null,
        surah_name: null,
        total_ayahs: null,
        title: juzName(j),
        description: range ? `صفحات ${range.from} إلى ${range.to}` : null,
        // ~20 ayahs per page * pages = rough estimate; assume 1 minute per page memorization difficulty
        estimated_minutes: range ? (range.to - range.from + 1) * 8 : null,
      }
    })
  }

  if (opts.type === "surah") {
    const { from, to } = clampRange(opts.rangeFrom ?? 1, opts.rangeTo ?? 114, 114)
    const surahNumbers: number[] = []
    for (let i = from; i <= to; i++) surahNumbers.push(i)
    if (reverse) surahNumbers.reverse()

    return surahNumbers.map((s, idx) => {
      const info = getSurah(s)
      return {
        position: idx + 1,
        unit_type: "surah",
        juz_number: info?.startJuz ?? null,
        surah_number: s,
        hizb_number: null,
        page_from: info?.startPage ?? null,
        page_to: null,
        ayah_from: 1,
        ayah_to: info?.ayahs ?? null,
        surah_name: info?.name ?? null,
        total_ayahs: info?.ayahs ?? null,
        title: info?.fullName ?? `سورة ${s}`,
        description: info ? `${info.ayahs} آية` : null,
        estimated_minutes: info ? Math.max(5, Math.ceil(info.ayahs / 4)) : null,
      }
    })
  }

  if (opts.type === "hizb") {
    const { from, to } = clampRange(opts.rangeFrom ?? 1, opts.rangeTo ?? 60, 60)
    const hizbNumbers: number[] = []
    for (let i = from; i <= to; i++) hizbNumbers.push(i)
    if (reverse) hizbNumbers.reverse()

    return hizbNumbers.map((h, idx) => ({
      position: idx + 1,
      unit_type: "hizb",
      juz_number: Math.ceil(h / 2),
      surah_number: null,
      hizb_number: h,
      page_from: null,
      page_to: null,
      ayah_from: null,
      ayah_to: null,
      surah_name: null,
      total_ayahs: null,
      title: `الحزب ${h}`,
      description: null,
      estimated_minutes: 30,
    }))
  }

  if (opts.type === "page") {
    const { from, to } = clampRange(opts.rangeFrom ?? 1, opts.rangeTo ?? 604, 604)
    const pages: number[] = []
    for (let i = from; i <= to; i++) pages.push(i)
    if (reverse) pages.reverse()

    return pages.map((p, idx) => ({
      position: idx + 1,
      unit_type: "page",
      juz_number: null,
      surah_number: null,
      hizb_number: null,
      page_from: p,
      page_to: p,
      ayah_from: null,
      ayah_to: null,
      surah_name: null,
      total_ayahs: null,
      title: `الصفحة ${p}`,
      description: null,
      estimated_minutes: 8,
    }))
  }

  // custom: caller must seed units manually
  return []
}

/**
 * Validate a unit type string against the SQL CHECK constraint.
 */
export function isValidUnitType(t: string): t is PathUnitType {
  return t === "juz" || t === "surah" || t === "hizb" || t === "page" || t === "custom"
}
