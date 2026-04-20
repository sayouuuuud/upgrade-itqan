// ============================================================
// ADMIN PANEL - FULL AUDIT SCRIPT (No server needed)
// Tests: DB schema, API file existence, code logic checks
// ============================================================

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = 'https://lrrhqjvgippgrlcozrvr.supabase.co'
const SERVICE_KEY = 'sb_secret_5ry4eQOGryzXty5QueNypQ_E3TUxSnE'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const ROOT = path.join(__dirname, '..')

// ANSI colors
const G = (s) => `\x1b[32m${s}\x1b[0m`  // green
const R = (s) => `\x1b[31m${s}\x1b[0m`  // red
const Y = (s) => `\x1b[33m${s}\x1b[0m`  // yellow
const B = (s) => `\x1b[36m${s}\x1b[0m`  // cyan
const W = (s) => `\x1b[1m${s}\x1b[0m`   // bold

let passed = 0, failed = 0, warnings = 0

function ok(msg) { console.log(G('  ✔'), msg); passed++ }
function fail(msg) { console.log(R('  ✘'), msg); failed++ }
function warn(msg) { console.log(Y('  ⚠'), msg); warnings++ }
function section(title) { console.log('\n' + W(B(`\n━━ ${title} ━━`))) }

// ─────────────────────────────────────────────────
// 1. FILE STRUCTURE CHECK
// ─────────────────────────────────────────────────
section('1. FILE STRUCTURE — Pages & API Routes')

const expectedFiles = [
  // Pages
  'app/academy/admin/courses/page.tsx',
  'app/academy/admin/teachers/page.tsx',
  'app/academy/admin/paths/page.tsx',
  'app/academy/admin/competitions/page.tsx',
  'app/academy/admin/fiqh/page.tsx',
  'app/academy/admin/halaqat/page.tsx',
  'app/academy/admin/announcements/page.tsx',
  'app/academy/admin/badges/page.tsx',
  // API List routes
  'app/api/academy/admin/courses/route.ts',
  'app/api/academy/admin/teachers/route.ts',
  'app/api/academy/admin/paths/route.ts',
  'app/api/academy/admin/competitions/route.ts',
  'app/api/academy/admin/fiqh/route.ts',
  'app/api/academy/admin/halaqat/route.ts',
  'app/api/academy/admin/announcements/route.ts',
  'app/api/academy/admin/badges/route.ts',
  // API [id] routes
  'app/api/academy/admin/courses/[id]/route.ts',
  'app/api/academy/admin/teachers/[id]/route.ts',
  'app/api/academy/admin/paths/[id]/route.ts',
  'app/api/academy/admin/competitions/[id]/route.ts',
  'app/api/academy/admin/fiqh/[id]/route.ts',
  'app/api/academy/admin/halaqat/[id]/route.ts',
  'app/api/academy/admin/announcements/[id]/route.ts',
  'app/api/academy/admin/badges/[id]/route.ts',
]

for (const f of expectedFiles) {
  const fullPath = path.join(ROOT, f)
  if (fs.existsSync(fullPath)) {
    const size = fs.statSync(fullPath).size
    if (size < 100) warn(`${f} — موجود لكن صغير جداً (${size} bytes)`)
    else ok(`${f} [${size}b]`)
  } else {
    fail(`${f} — غير موجود!`)
  }
}

// ─────────────────────────────────────────────────
// 2. CODE LOGIC CHECK — هل الصفحات تحتوي على المكونات الأساسية
// ─────────────────────────────────────────────────
section('2. PAGE CODE AUDIT — Modals & Handlers')

const pageChecks = {
  'app/academy/admin/courses/page.tsx': ['useState', 'showModal', 'handleSubmit', 'handleDelete', 'fetchCourses', 'openEdit', '/api/academy/admin/courses'],
  'app/academy/admin/teachers/page.tsx': ['useState', 'showModal', 'handleSubmit', 'handleDelete', 'fetchTeachers', '/api/academy/admin/teachers'],
  'app/academy/admin/paths/page.tsx': ['useState', 'showModal', 'handleSubmit', 'handleDelete', 'fetchPaths', '/api/academy/admin/paths'],
  'app/academy/admin/competitions/page.tsx': ['useState', 'showModal', 'handleSubmit', 'handleDelete', 'start_date', 'end_date', '/api/academy/admin/competitions'],
  'app/academy/admin/fiqh/page.tsx': ['useState', 'showModal', 'handleSubmit', 'handleDelete', 'is_published', '/api/academy/admin/fiqh'],
  'app/academy/admin/halaqat/page.tsx': ['useState', 'showModal', 'handleSubmit', 'handleDelete', 'meeting_link', '/api/academy/admin/halaqat'],
  'app/academy/admin/announcements/page.tsx': ['useState', 'showModal', 'handleSubmit', 'handleDelete', 'title_ar', 'content_ar', '/api/academy/admin/announcements'],
  'app/academy/admin/badges/page.tsx': ['useState', 'showModal', 'handleSubmit', 'handleDelete', 'badge_icon', '/api/academy/admin/badges'],
}

for (const [file, keywords] of Object.entries(pageChecks)) {
  const fullPath = path.join(ROOT, file)
  if (!fs.existsSync(fullPath)) { fail(`${file} — مش موجود`); continue }
  const content = fs.readFileSync(fullPath, 'utf-8')
  const missing = keywords.filter(k => !content.includes(k))
  const pageName = file.split('/').at(-2)
  if (missing.length === 0) {
    ok(`${pageName}/page.tsx — كل المكونات موجودة ✓`)
  } else {
    fail(`${pageName}/page.tsx — ناقص: ${missing.join(', ')}`)
  }
}

// ─────────────────────────────────────────────────
// 3. API ROUTES CODE AUDIT — هل GET + POST موجودين
// ─────────────────────────────────────────────────
section('3. API ROUTES AUDIT — GET / POST / PATCH / DELETE')

const apiChecks = {
  'courses': { list: ['export async function GET', 'export async function POST', 'courses'], id: ['export async function PATCH', 'export async function DELETE'] },
  'teachers': { list: ['export async function GET', 'export async function POST', 'users', 'teacher'], id: ['export async function PATCH', 'export async function DELETE'] },
  'paths': { list: ['export async function GET', 'export async function POST', 'learning_paths'], id: ['export async function PATCH', 'export async function DELETE'] },
  'competitions': { list: ['export async function GET', 'export async function POST', 'competitions', 'start_date'], id: ['export async function PATCH', 'export async function DELETE'] },
  'fiqh': { list: ['export async function GET', 'export async function POST', 'fiqh_questions'], id: ['export async function PATCH', 'export async function DELETE'] },
  'halaqat': { list: ['export async function GET', 'export async function POST', 'halaqat'], id: ['export async function PATCH', 'export async function DELETE'] },
  'announcements': { list: ['export async function GET', 'export async function POST', 'announcements', 'title_ar'], id: ['export async function PATCH', 'export async function DELETE'] },
  'badges': { list: ['export async function GET', 'export async function POST', 'badge_definitions'], id: ['export async function PATCH', 'export async function DELETE', 'badge_definitions'] },
}

for (const [resource, checks] of Object.entries(apiChecks)) {
  // List route
  const listPath = path.join(ROOT, `app/api/academy/admin/${resource}/route.ts`)
  if (fs.existsSync(listPath)) {
    const content = fs.readFileSync(listPath, 'utf-8')
    const missing = checks.list.filter(k => !content.includes(k))
    if (missing.length === 0) ok(`${resource}/route.ts — GET+POST ✓`)
    else fail(`${resource}/route.ts — ناقص: ${missing.join(', ')}`)
  } else {
    fail(`${resource}/route.ts — غير موجود!`)
  }

  // [id] route
  const idPath = path.join(ROOT, `app/api/academy/admin/${resource}/[id]/route.ts`)
  if (fs.existsSync(idPath)) {
    const content = fs.readFileSync(idPath, 'utf-8')
    const missing = checks.id.filter(k => !content.includes(k))
    if (missing.length === 0) ok(`${resource}/[id]/route.ts — PATCH+DELETE ✓`)
    else fail(`${resource}/[id]/route.ts — ناقص: ${missing.join(', ')}`)
  } else {
    fail(`${resource}/[id]/route.ts — غير موجود!`)
  }
}

// ─────────────────────────────────────────────────
// 4. SECURITY CHECK — هل كل route فيها Auth check
// ─────────────────────────────────────────────────
section('4. SECURITY AUDIT — Auth Checks')

const resources = ['courses', 'teachers', 'paths', 'competitions', 'fiqh', 'halaqat', 'announcements', 'badges']
for (const r of resources) {
  for (const suffix of ['route.ts', '[id]/route.ts']) {
    const filePath = path.join(ROOT, `app/api/academy/admin/${r}/${suffix}`)
    if (!fs.existsSync(filePath)) continue
    const content = fs.readFileSync(filePath, 'utf-8')
    const hasAuth = content.includes('requireRole') && content.includes('academy_admin')
    const hasUnauth = content.includes("status: 401")
    if (hasAuth && hasUnauth) ok(`${r}/${suffix} — Auth محمي ✓`)
    else fail(`${r}/${suffix} — Auth ناقص! requireRole=${hasAuth} 401=${hasUnauth}`)
  }
}

// ─────────────────────────────────────────────────
// 5. DATABASE LIVE TEST — Read from each table
// ─────────────────────────────────────────────────
section('5. DATABASE LIVE AUDIT — Table Access & Row Counts')

async function testDB() {
  const tables = [
    { name: 'courses', display: 'Courses' },
    { name: 'categories', display: 'Categories' },
    { name: 'learning_paths', display: 'Learning Paths' },
    { name: 'competitions', display: 'Competitions' },
    { name: 'fiqh_questions', display: 'Fiqh Questions' },
    { name: 'halaqat', display: 'Halaqat' },
    { name: 'announcements', display: 'Announcements' },
    { name: 'badge_definitions', display: 'Badge Definitions (new)' },
    { name: 'users', display: 'Users' },
  ]

  for (const t of tables) {
    try {
      const { data, error, count } = await supabase
        .from(t.name)
        .select('*', { count: 'exact', head: false })
        .limit(1)

      if (error) {
        fail(`${t.display} (${t.name}) — خطأ: ${error.message}`)
      } else {
        const { count: total } = await supabase.from(t.name).select('*', { count: 'exact', head: true })
        ok(`${t.display} — يمكن الوصول ✓  (${total ?? 0} سجل)`)
      }
    } catch (e) {
      fail(`${t.display} — exception: ${e.message}`)
    }
  }

  // Test teachers filter (users with role=teacher)
  try {
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher')
    ok(`Teachers filter (users WHERE role=teacher) — ${count ?? 0} مدرس`)
  } catch (e) {
    fail(`Teachers filter — ${e.message}`)
  }
}

// ─────────────────────────────────────────────────
// 6. SCHEMA COLUMNS CHECK — هل الأعمدة متوافقة مع الكود
// ─────────────────────────────────────────────────
section('6. SCHEMA ↔ CODE COMPATIBILITY')

async function testSchema() {
  // الأعمدة المطلوبة في كل جدول حسب الكود
  const required = {
    courses: ['id', 'title', 'description', 'status', 'is_published', 'category_id', 'created_at'],
    learning_paths: ['id', 'title', 'description', 'subject', 'level', 'estimated_hours', 'created_at'],
    competitions: ['id', 'title', 'description', 'type', 'start_date', 'end_date', 'status', 'max_participants', 'prizes_description'],
    fiqh_questions: ['id', 'question', 'answer', 'category', 'is_published', 'asked_at', 'answered_at'],
    halaqat: ['id', 'name', 'description', 'teacher_id', 'gender', 'max_students', 'meeting_link', 'is_active'],
    announcements: ['id', 'title_ar', 'content_ar', 'target_audience', 'priority', 'is_published', 'created_at'],
    badge_definitions: ['id', 'badge_type', 'badge_name', 'badge_description', 'badge_icon', 'points_required', 'is_active'],
    users: ['id', 'name', 'email', 'role', 'gender', 'is_active', 'created_at'],
  }

  for (const [table, cols] of Object.entries(required)) {
    try {
      const { data, error } = await supabase.from(table).select(cols.join(',')).limit(1)
      if (error) {
        // تحقق من أي عمود غلط
        fail(`${table} — خطأ في الأعمدة: ${error.message}`)
      } else {
        ok(`${table} — كل الأعمدة موجودة: [${cols.join(', ')}]`)
      }
    } catch (e) {
      fail(`${table} — exception: ${e.message}`)
    }
  }
}

// ─────────────────────────────────────────────────
// 7. WRITE TEST — Insert & Delete test row
// ─────────────────────────────────────────────────
section('7. WRITE TEST — إدراج وحذف صف تجريبي')

async function testWrite() {
  const tests = [
    {
      table: 'learning_paths',
      row: { title: '__TEST_PATH__', description: 'test', subject: 'quran', level: 'beginner', estimated_hours: 1, created_at: new Date().toISOString() }
    },
    {
      table: 'competitions',
      row: { title: '__TEST_COMP__', description: 'test', type: 'monthly', start_date: new Date().toISOString(), end_date: new Date().toISOString(), status: 'upcoming', max_participants: 10, created_at: new Date().toISOString() }
    },
    {
      table: 'fiqh_questions',
      row: { question: '__TEST_Q__', answer: 'test answer', category: 'general', is_published: false, asked_at: new Date().toISOString() }
    },
    {
      table: 'halaqat',
      row: { name: '__TEST_HALAQA__', description: 'test', gender: 'both', max_students: 10, is_active: true, created_at: new Date().toISOString() }
    },
    {
      table: 'announcements',
      row: { title_ar: '__TEST_ANN__', content_ar: 'test content', target_audience: 'all', priority: 'normal', is_published: false, created_at: new Date().toISOString() }
    },
    {
      table: 'badge_definitions',
      row: { badge_type: 'achievement', badge_name: '__TEST_BADGE__', badge_description: 'test', badge_icon: '🏆', points_required: 0, is_active: true, created_at: new Date().toISOString() }
    },
  ]

  for (const { table, row } of tests) {
    try {
      // INSERT
      const { data: inserted, error: insertErr } = await supabase.from(table).insert(row).select().single()
      if (insertErr) { fail(`INSERT ${table} — ${insertErr.message}`); continue }
      
      // DELETE
      const { error: deleteErr } = await supabase.from(table).delete().eq('id', inserted.id)
      if (deleteErr) {
        warn(`DELETE ${table} — إدراج نجح لكن حذف فشل: ${deleteErr.message}`)
      } else {
        ok(`${table} — INSERT ✓ + DELETE ✓ (id: ${inserted.id.slice(0,8)}...)`)
      }
    } catch (e) {
      fail(`${table} — exception: ${e.message}`)
    }
  }
}

// ─────────────────────────────────────────────────
// RUN ALL
// ─────────────────────────────────────────────────
async function main() {
  console.log(W(B('\n╔═══════════════════════════════════════════╗')))
  console.log(W(B('║   ACADEMY ADMIN PANEL — FULL AUDIT REPORT ║')))
  console.log(W(B('╚═══════════════════════════════════════════╝')))
  console.log(`  Time: ${new Date().toLocaleString('ar-EG')}`)

  await testDB()
  await testSchema()
  await testWrite()

  // FINAL SUMMARY
  const total = passed + failed + warnings
  console.log('\n' + W(B('\n━━ FINAL SUMMARY ━━')))
  console.log(G(`  ✔ Passed:   ${passed}`))
  console.log(Y(`  ⚠ Warnings: ${warnings}`))
  console.log(R(`  ✘ Failed:   ${failed}`))
  console.log(`  Total:     ${total}`)
  
  const score = Math.round((passed / total) * 100)
  const emoji = score === 100 ? '🏆' : score >= 90 ? '🎯' : score >= 70 ? '⚠️' : '❌'
  console.log(`\n  ${emoji} Score: ${score}%\n`)

  if (failed > 0) process.exit(1)
}

main().catch(console.error)
