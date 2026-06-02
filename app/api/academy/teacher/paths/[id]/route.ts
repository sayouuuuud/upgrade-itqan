import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const isAuthorized = session && (session.role === 'teacher' || session.role === 'reader' || session.role === 'admin')
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const body = await req.json()
    // Map estimated_hours -> estimated_days
    const estimated_days = body.estimated_hours !== undefined ? body.estimated_hours : undefined

    const pathCheck = await query<any>(`
      SELECT created_by, manager_id FROM tajweed_paths WHERE id = $1 LIMIT 1
    `, [id])

    if (pathCheck.length === 0) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 })
    }

    const isManager = session.role === 'admin' || pathCheck[0].created_by === session.sub || pathCheck[0].manager_id === session.sub
    if (!isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const fieldsToUpdate: { [key: string]: any } = {}
    if (body.title !== undefined) fieldsToUpdate.title = body.title
    if (body.description !== undefined) fieldsToUpdate.description = body.description
    if (body.subject !== undefined) fieldsToUpdate.subject = body.subject
    if (body.level !== undefined) fieldsToUpdate.level = body.level
    if (estimated_days !== undefined) fieldsToUpdate.estimated_days = estimated_days
    if (body.thumbnail_url !== undefined) fieldsToUpdate.thumbnail_url = body.thumbnail_url || null
    if (body.require_audio !== undefined) fieldsToUpdate.require_audio = body.require_audio === true
    if (body.is_published !== undefined) fieldsToUpdate.is_published = body.is_published === true
    
    if (body.target_audience !== undefined) fieldsToUpdate.target_audience = body.target_audience
    if (body.what_you_will_learn !== undefined) fieldsToUpdate.what_you_will_learn = typeof body.what_you_will_learn === 'string' ? body.what_you_will_learn : JSON.stringify(body.what_you_will_learn)
    if (body.prerequisites !== undefined) fieldsToUpdate.prerequisites = typeof body.prerequisites === 'string' ? body.prerequisites : JSON.stringify(body.prerequisites)
    if (body.promo_video_url !== undefined) fieldsToUpdate.promo_video_url = body.promo_video_url
    if (body.certification_type !== undefined) fieldsToUpdate.certification_type = body.certification_type
    if (body.enrollment_type !== undefined) fieldsToUpdate.enrollment_type = body.enrollment_type
    if (body.price !== undefined) fieldsToUpdate.price = body.price
    if (body.tags !== undefined) fieldsToUpdate.tags = typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags)

    if (Object.keys(fieldsToUpdate).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const sets: string[] = []
    const values: any[] = []
    let i = 1
    for (const [key, val] of Object.entries(fieldsToUpdate)) {
      sets.push(`${key} = $${i}`)
      values.push(val)
      i++
    }
    values.push(id)

    const result = await query<any>(`
      UPDATE tajweed_paths 
      SET ${sets.join(', ')} 
      WHERE id = $${i} 
      RETURNING *, total_stages as total_courses, estimated_days as estimated_hours
    `, values)

    return NextResponse.json({ data: result[0] })
  } catch (error) {
    console.error('Error updating teacher path:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const isAuthorized = session && (session.role === 'teacher' || session.role === 'reader' || session.role === 'admin')
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const pathCheck = await query<any>(`
      SELECT created_by, manager_id FROM tajweed_paths WHERE id = $1 LIMIT 1
    `, [id])

    if (pathCheck.length === 0) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 })
    }

    const isManager = session.role === 'admin' || pathCheck[0].created_by === session.sub || pathCheck[0].manager_id === session.sub
    if (!isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await query(`DELETE FROM tajweed_paths WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting teacher path:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
