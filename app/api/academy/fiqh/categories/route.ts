import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET: public list of active categories
export async function GET() {
  const categories = await query<{
    id: string
    slug: string
    name_ar: string
    name_en: string | null
    sort_order: number
  }>(
    `SELECT id, slug, name_ar, name_en, sort_order
       FROM fiqh_categories
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, name_ar ASC`
  )
  return NextResponse.json({ categories })
}
