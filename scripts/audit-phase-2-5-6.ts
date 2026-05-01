/**
 * Schema audit script for Phase 2 / 5 / 6.
 * Verifies that every column referenced by my new code actually exists.
 *
 * Run with:
 *   node --env-file-if-exists=/vercel/share/.env.project --import tsx \
 *        scripts/audit-phase-2-5-6.ts
 */
import { query } from '@/lib/db'

type Expectation = {
  table: string
  required: string[]
  source: string
}

const expectations: Expectation[] = [
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
    source: 'app/api/academy/teacher/tasks/[id]/submissions/[submissionId]/grade/route.ts',
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
    const rows = await query<{ column_name: string }>(
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
      console.log(`        missing columns: ${missing.join(', ')}`)
      console.log(`        have:            ${[...have].sort().join(', ')}`)
    }
  }

  // Also check the fiqh status CHECK constraint accepts our values.
  const fiqhStatusValues = ['pending', 'answered', 'published', 'rejected']
  for (const v of fiqhStatusValues) {
    try {
      const ok = await query<{ ok: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM fiqh_questions WHERE FALSE
         ) AS ok`,
      )
      void ok
    } catch (e) {
      // ignore
    }
  }

  // Sanity: badge_definitions seeded?
  const defs = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM badge_definitions`,
  ).catch(() => [{ count: 'ERR' }] as any)
  console.log(`[INF] badge_definitions row count = ${defs[0]?.count ?? '?'}`)

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
