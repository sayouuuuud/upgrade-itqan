import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, withTransaction } from '@/lib/db'
import { makeEnvelope, parseBackup } from '@/lib/admin/backup'

// Tables included in a database backup, listed in FK-dependency order so a safe
// merge restore inserts parents (users, settings) before children.
const BACKUP_TABLES = [
    'system_settings',
    'users',
    'recitations',
    'bookings',
    'reviews',
    'notifications',
    'messages',
    'announcements',
    'email_templates',
] as const

// Columns we never want to round-trip on restore (DB-managed / derived).
const SKIP_COLUMNS = new Set<string>([])

// Serialize a JS value for a parameterized insert. Objects/arrays become JSON
// strings so they land correctly in jsonb columns; everything else is passed
// through untouched (pg handles primitives, dates and null).
function serializeValue(value: unknown): unknown {
    if (value !== null && typeof value === 'object') {
        return JSON.stringify(value)
    }
    return value
}

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { action } = body

    switch (action) {
        case 'export': {
            // Full-fidelity export (SELECT *) of every backup table, wrapped in a
            // signed envelope so imports can verify the file kind.
            const tables: Record<string, any[]> = {}
            const counts: Record<string, number> = {}

            for (const table of BACKUP_TABLES) {
                try {
                    const rows = await query(`SELECT * FROM ${table} ORDER BY 1`)
                    tables[table] = rows as any[]
                    counts[table] = (rows as any[]).length
                } catch (err: any) {
                    // A missing/renamed table shouldn't abort the whole export.
                    console.warn(`[Backup] Skipped table ${table}: ${err.message}`)
                }
            }

            const envelope = makeEnvelope('database', { tables }, { counts })

            await query(
                `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'backup_exported', 'Admin exported database backup')`,
                [session.sub]
            ).catch(() => { })

            return new NextResponse(JSON.stringify(envelope, null, 2), {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Disposition': `attachment; filename="itqan-database-backup-${new Date().toISOString().split('T')[0]}.json"`,
                },
            })
        }

        case 'restore': {
            // Accept either a pre-parsed payload (from the new client) or a raw
            // file string; validate it is a DATABASE backup before touching data.
            const raw = typeof body.raw === 'string' ? body.raw : JSON.stringify(body.file ?? body.data ?? {})
            const parsed = parseBackup<{ tables: Record<string, any[]> }>(raw, 'database')

            if (!parsed.ok) {
                return NextResponse.json(
                    { error: 'INVALID_BACKUP', reason: parsed.reason, detectedKind: parsed.detectedKind },
                    { status: 400 }
                )
            }

            const tables = parsed.payload?.tables ?? {}

            try {
                const summary: Record<string, { inserted: number; skipped: number }> = {}

                await withTransaction(async (tx) => {
                    for (const table of BACKUP_TABLES) {
                        const rows = tables[table]
                        if (!Array.isArray(rows) || rows.length === 0) continue

                        let inserted = 0
                        for (const row of rows) {
                            const cols = Object.keys(row).filter((c) => !SKIP_COLUMNS.has(c))
                            if (cols.length === 0) continue

                            const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
                            const colList = cols.map((c) => `"${c}"`).join(', ')
                            const values = cols.map((c) => serializeValue(row[c]))

                            // Safe merge: skip any row that conflicts with an
                            // existing primary key / unique constraint. RETURNING
                            // lets us know whether the row was actually inserted.
                            const result = await tx(
                                `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING RETURNING 1`,
                                values
                            )
                            if (result.length > 0) inserted += 1
                        }
                        summary[table] = { inserted, skipped: rows.length - inserted }
                    }
                })

                await query(
                    `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'backup_restored', 'Admin restored database from backup (safe merge)')`,
                    [session.sub]
                ).catch(() => { })

                return NextResponse.json({
                    ok: true,
                    message: 'تم استيراد قاعدة البيانات بنجاح (دمج آمن — تم تخطي السجلات المكررة)',
                    summary,
                })
            } catch (err: any) {
                console.error('[Backup] Restore failed:', err)
                return NextResponse.json({ error: `فشل الاستيراد: ${err.message}` }, { status: 500 })
            }
        }

        case 'clear_old_logs': {
            await query(`DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '90 days'`)
            await query(
                `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'logs_cleared', 'Admin cleared activity logs older than 90 days')`,
                [session.sub]
            )
            return NextResponse.json({ ok: true, message: 'Old activity logs (90+ days) cleared' })
        }

        case 'clear_page_views': {
            await query(`DELETE FROM page_views WHERE created_at < NOW() - INTERVAL '90 days'`)
            return NextResponse.json({ ok: true, message: 'Old page views (90+ days) cleared' })
        }

        case 'clear_notifications': {
            await query(
                `DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days' AND is_read = true`
            )
            return NextResponse.json({ ok: true, message: 'Old read notifications cleared' })
        }

        case 'clear_cache': {
            const { revalidatePath } = await import('next/cache')
            revalidatePath('/')
            revalidatePath('/admin')
            revalidatePath('/reader')
            revalidatePath('/student')

            await query(
                `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'cache_cleared', 'Admin cleared system cache')`,
                [session.sub]
            )
            return NextResponse.json({ ok: true, message: 'System cache cleared and pages revalidated' })
        }

        case 'stats': {
            const [tableStats] = await Promise.all([
                query(`
          SELECT
            (SELECT COUNT(*) FROM users) AS users,
            (SELECT COUNT(*) FROM recitations) AS recitations,
            (SELECT COUNT(*) FROM bookings) AS bookings,
            (SELECT COUNT(*) FROM reviews) AS reviews,
            (SELECT COUNT(*) FROM notifications) AS notifications,
            (SELECT COUNT(*) FROM activity_logs) AS activity_logs,
            (SELECT COUNT(*) FROM page_views) AS page_views,
            (SELECT COUNT(*) FROM messages) AS messages,
            (SELECT COUNT(*) FROM announcements) AS announcements,
            (SELECT COUNT(*) FROM email_templates) AS email_templates
        `),
            ])
            return NextResponse.json({
                tables: tableStats[0],
                dbSize: null,
                lastBackup: null,
            })
        }

        default:
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
}
