import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const p = await params;
    const catId = p.id;
    // We assume foreign keys restrict drop if courses exist.
    const res = await query(`DELETE FROM categories WHERE id = $1 RETURNING *`, [catId])
    if (res.length === 0) return NextResponse.json({ error: 'Not found or cannot delete' }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
