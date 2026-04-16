import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  // Allow any authenticated user to read categories (needed for course creation forms)
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const q = `SELECT * FROM categories ORDER BY name ASC`
    const rows = await query(q)
    return NextResponse.json({ data: rows })
  } catch (error) {
    return NextResponse.json({ error: 'error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { name, description } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name needed' }, { status: 400 })
    
    // We expect a categories table with updated structure.
    const q = `INSERT INTO categories (name, description, created_at) VALUES ($1, $2, NOW()) RETURNING *`
    const res = await query(q, [name, description || null])
    
    return NextResponse.json({ data: res[0] })
  } catch (error) {
    return NextResponse.json({ error: 'error' }, { status: 500 })
  }
}
