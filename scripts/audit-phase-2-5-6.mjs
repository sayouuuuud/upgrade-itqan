/**
 * Schema audit for Phase 2 / 5 / 6.
 * Verifies that every column referenced by the new code actually exists.
 *
 * Run with:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/audit-phase-2-5-6.mjs
 */
import { Pool } from 'pg'

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING

if (!url) {
  console.error('No DATABASE_URL/POSTGRES_URL found in env')
  process.exit(2)
}

const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } })

const expectations = [
  // Phase 5 — Gamification
  {
    source: 'lib/academy/gamification.ts',
    table: 'user_points',
    required: ['id', 'user_id', 'points', 'level', 'updated_at'],
  },
  {
    source: 'lib/academy/gamification.ts',
    table: 'points_log',
    required: ['id', 'user_id', 'points', 'reason', 'reference_type', 'reference_id', 'created_at'],
  },
  {
    source: 'lib/academy/gamification.ts',
    table: 'badges',
    required: ['id', 'user_id', 'badge_type', 'earned_at'],
  },
  {
    source: 'app/api/academy/student/badges/route.ts',
    table: 'badge_definitions',
    required: ['badge_type', 'name', 'description', 'icon', 'criteria_type', 'criteria_value', 'points'],
  },
  {
    source: 'app/api/academy/student/sessions/[id]/attend/route.ts',
    table: 'session_attendance',
    required: ['session_id', 'student_id', 'joined_at', 'attendance_status'],
  },
  {
    source: 'grade/route.ts',
    table: 'tasks',
    required: ['id', 'title', 'course_id', 'max_score', 'points_reward'],
  },

  // Phase 6 — Supervisor verification
  {
    source: 'app/api/academy/supervisor/teachers/route.ts',
    table: 'academy_teachers',
    required: [
      'user_id',
      'specialization',
      'bio',
      'experience_years',
      'verification_status',
      'trust_score',
      'verified_by',
      'verified_at',
      'verification_notes',
      'created_at',
    ],
  },
  {
    source: 'app/api/academy/supervisor/teachers/[id]/route.ts',
    table: 'teacher_verifications',
    required: ['teacher_id', 'supervisor_id', 'status', 'notes', 'decided_at'],
  },

  // Phase 2 — Fiqh
  {
    source: 'app/api/academy/admin/fiqh/route.ts',
    table: 'fiqh_questions',
    required: [
      'id',
      'student_id',
      'question',
      'answer',
      'category',
      'fatwa_type',
      'madhhab_strength',
      'status',
      'answered_by',
      'created_at',
      'answered_at',
    ],
  },
]

async function main() {
  let problems = 0
  for (const exp of expectations) {
    const { rows } = await pool.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1`,
      [exp.table],
    )
    const have = new Set(rows.map((r) => r.column_name))
    const missing = exp.required.filter((c) => !have.has(c))
    const tag = missing.length === 0 ? 'OK ' : 'BAD'
    console.log(`[${tag}] ${exp.source} -> ${exp.table}`)
    if (missing.length > 0) {
      problems++
      console.log(`        missing: ${missing.join(', ')}`)
      console.log(`        present: ${[...have].sort().join(', ')}`)
    }
  }

  // CHECK constraint for fiqh_questions.status — try inserting (and rolling back) to verify accepted values
  const accepted = []
  const rejected = []
  for (const status of ['pending', 'answered', 'published', 'rejected']) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      // Find any existing student id to satisfy FK
      const r = await client.query(`SELECT id FROM users LIMIT 1`)
      if (r.rows.length === 0) {
        accepted.push(`${status}?(no users)`)
        continue
      }
      const studentId = r.rows[0].id
      await client.query(
        `INSERT INTO fiqh_questions (student_id, question, status) VALUES ($1, $2, $3)`,
        [studentId, '__audit__', status],
      )
      accepted.push(status)
    } catch (e) {
      rejected.push(`${status} (${(e.message || '').slice(0, 80)})`)
    } finally {
      await client.query('ROLLBACK').catch(() => {})
      client.release()
    }
  }
  console.log(`[INF] fiqh_questions.status accepts: ${accepted.join(', ') || '(none)'}`)
  if (rejected.length) console.log(`[INF] fiqh_questions.status rejects: ${rejected.join(' | ')}`)

  // Badge defs seeded?
  try {
    const r = await pool.query(`SELECT COUNT(*)::int AS count FROM badge_definitions`)
    console.log(`[INF] badge_definitions row count = ${r.rows[0].count}`)
  } catch (e) {
    console.log(`[INF] badge_definitions: ${e.message}`)
  }

  // teacher_verifications row count
  try {
    const r = await pool.query(`SELECT COUNT(*)::int AS count FROM teacher_verifications`)
    console.log(`[INF] teacher_verifications row count = ${r.rows[0].count}`)
  } catch (e) {
    console.log(`[INF] teacher_verifications: ${e.message}`)
  }

  await pool.end()

  if (problems > 0) {
    console.log(`\n${problems} schema mismatch(es) found.`)
    process.exit(1)
  } else {
    console.log('\nAll schema expectations satisfied.')
  }
}

main().catch((e) => {
  console.error('audit failed:', e)
  process.exit(2)
})
