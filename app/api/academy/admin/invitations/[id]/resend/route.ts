import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    // Reset expiry and generate new token
    const newToken = crypto.randomUUID()
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const result = await query(`
      UPDATE invitations SET 
        token = $1,
        status = 'pending',
        expires_at = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [newToken, newExpiry, id])

    if (result.length === 0) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: result[0] })
  } catch (error: any) {
    console.error('Error resending invitation:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
