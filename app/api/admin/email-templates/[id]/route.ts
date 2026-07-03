import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { logAudit } from '@/lib/admin/audit'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id } = await params

    // فحص: القوالب العامة للسوبر أدمن فقط
    const isSuperAdmin = session.role === 'admin' || (session.role as string) === 'super_admin'
    const existing = await query(`SELECT scope, template_key FROM email_templates WHERE id = $1`, [id])
    if (existing.length > 0 && existing[0].scope === 'general' && !isSuperAdmin) {
        return NextResponse.json({ error: 'القوالب العامة للمدير العام فقط' }, { status: 403 })
    }

    const allowed = ['subject_ar', 'subject_en', 'body_ar', 'body_en', 'is_active']
    const setters: string[] = []
    const values: any[] = []
    let idx = 1

    for (const [k, v] of Object.entries(body)) {
        if (allowed.includes(k)) {
            setters.push(`${k} = $${idx++}`)
            values.push(v)
        }
    }

    if (!setters.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    setters.push(`updated_at = NOW()`)
    values.push(id)

    await query(
        `UPDATE email_templates SET ${setters.join(', ')} WHERE id = $${idx}`,
        values
    )

    if (isSuperAdmin && existing.length > 0) {
        await logAudit({
            actor_id: session.sub,
            actor_email: session.email,
            action: 'email_template_updated',
            platform: existing[0].scope === 'academy' ? 'academy' : existing[0].scope === 'general' ? 'site' : 'maqraa',
            entity_type: 'email_template',
            entity_id: String(existing[0].template_key ?? id),
            new_value: body,
        })
    }

    return NextResponse.json({ ok: true })
}
