import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

// GET: List linked children for parent
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'parent') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const children = await query<{
    id: string
    child_id: string
    child_name: string
    child_email: string
    child_avatar: string | null
    relation: string
    status: string
    linked_at: string
  }>(
    `SELECT pc.id, pc.child_id, u.name as child_name, u.email as child_email, 
            u.avatar_url as child_avatar, pc.relation, pc.status, pc.created_at as linked_at
     FROM parent_children pc
     JOIN users u ON u.id = pc.child_id
     WHERE pc.parent_id = $1
     ORDER BY pc.created_at DESC`,
    [session.sub]
  )

  return NextResponse.json({ children })
}
