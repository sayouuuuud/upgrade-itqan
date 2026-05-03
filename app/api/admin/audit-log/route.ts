import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/admin/audit-log
 * Returns audit log entries for permission changes and important actions
 * Query params:
 *  - type: filter by action type
 *  - user_id: filter by affected user
 *  - admin_id: filter by admin who made the change
 *  - from: start date
 *  - to: end date
 *  - limit: number of entries (default 50)
 *  - offset: pagination offset
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const userId = searchParams.get('user_id')
  const adminId = searchParams.get('admin_id')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  let whereClause = 'TRUE'
  const params: any[] = []
  let paramIndex = 1

  if (type) {
    whereClause += ` AND al.action_type = $${paramIndex++}`
    params.push(type)
  }
  if (userId) {
    whereClause += ` AND al.target_user_id = $${paramIndex++}`
    params.push(userId)
  }
  if (adminId) {
    whereClause += ` AND al.admin_id = $${paramIndex++}`
    params.push(adminId)
  }
  if (from) {
    whereClause += ` AND al.created_at >= $${paramIndex++}`
    params.push(from)
  }
  if (to) {
    whereClause += ` AND al.created_at <= $${paramIndex++}`
    params.push(to)
  }

  params.push(limit, offset)

  try {
    const logs = await query<{
      id: string
      action_type: string
      admin_id: string
      admin_name: string
      admin_email: string
      target_user_id: string | null
      target_user_name: string | null
      target_user_email: string | null
      old_value: any
      new_value: any
      description: string
      ip_address: string | null
      created_at: string
    }>(
      `SELECT 
         al.id,
         al.action_type,
         al.admin_id,
         admin_user.name as admin_name,
         admin_user.email as admin_email,
         al.target_user_id,
         target_user.name as target_user_name,
         target_user.email as target_user_email,
         al.old_value,
         al.new_value,
         al.description,
         al.ip_address,
         al.created_at
       FROM audit_log al
       LEFT JOIN users admin_user ON admin_user.id = al.admin_id
       LEFT JOIN users target_user ON target_user.id = al.target_user_id
       WHERE ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    )

    // Get total count for pagination
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_log al WHERE ${whereClause}`,
      params.slice(0, -2)
    )

    // Get action types for filter dropdown
    const actionTypes = await query<{ action_type: string; count: string }>(
      `SELECT action_type, COUNT(*)::text as count 
       FROM audit_log 
       GROUP BY action_type 
       ORDER BY count DESC`
    )

    return NextResponse.json({
      logs,
      total: parseInt(countResult[0]?.count || '0'),
      actionTypes: actionTypes.map(a => ({ type: a.action_type, count: parseInt(a.count) })),
    })
  } catch (error) {
    console.error('[API] Error fetching audit log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/audit-log
 * Create a new audit log entry (internal use)
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { action_type, target_user_id, old_value, new_value, description } = body

  if (!action_type) {
    return NextResponse.json({ error: 'action_type is required' }, { status: 400 })
  }

  try {
    // Get IP from headers
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || null

    await query(
      `INSERT INTO audit_log (admin_id, action_type, target_user_id, old_value, new_value, description, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [session.sub, action_type, target_user_id || null, old_value || null, new_value || null, description || '', ip]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Error creating audit log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
