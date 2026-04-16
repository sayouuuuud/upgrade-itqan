import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const p = await params;
    const appId = p.id;
    const { status } = await req.json()
    
    if (!['approved', 'rejected'].includes(status)) {
       return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update application
    const updateQ = `UPDATE teacher_applications SET status = $1, reviewed_at = NOW() WHERE id = $2 RETURNING *`
    const res = await query<any>(updateQ, [status, appId])

    if (res.length > 0 && status === 'approved') {
       // Optionally upgrade user role here or add them to academy_roles in a real app
       // e.g. update users set role='teacher' or handle academy_roles JSON
       const app = res[0]
       await query(`UPDATE users SET role = 'teacher' WHERE id = $1`, [app.user_id])
    }

    return NextResponse.json({ success: true, data: res[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
