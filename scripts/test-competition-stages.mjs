/**
 * End-to-end test: multi-stage competition flow
 *
 * Covers the full lifecycle introduced in migration 058:
 *   1. Admin creates a 3-stage competition via POST /api/academy/admin/competitions
 *   2. Stages are visible via GET  /api/academy/admin/competitions/:id/stages
 *   3. Student joins (detail endpoint returns canSubmit = true for stage 1)
 *   4. Student submits an entry for stage 1
 *   5. Reader evaluates the entry
 *   6. Admin previews ranking via GET  /api/academy/admin/competitions/:id/advance
 *   7. Admin advances to stage 2 via POST /api/academy/admin/competitions/:id/advance
 *   8. After advance: activeStage moves to stage 2, old entry is qualified
 *   9. Student detail shows stage 2 as active, canSubmit = true
 *  10. Admin finalises the competition from stage 2 (finalize_now)
 *  11. Competition status = completed, winner exists
 *
 * Usage:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/test-competition-stages.mjs
 *
 * Environment variables read from .env:
 *   BASE_URL           (default http://localhost:3000)
 *   TEST_ADMIN_EMAIL   academy_admin account (default: uses first academy_admin in DB)
 *   TEST_STUDENT_EMAIL student account
 *   TEST_READER_EMAIL  reader account
 */

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const PASSWORD = process.env.TEST_PASSWORD || '123456'

const ADMIN_EMAIL   = process.env.TEST_ADMIN_EMAIL   || 'admin@itqan.sa'
const STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL || 'student@itqan.sa'
const READER_EMAIL  = process.env.TEST_READER_EMAIL  || 'reader@itqan.sa'

const results = []
const createdIds = { competition: null }

// ---- helpers ---------------------------------------------------------------

function log(name, ok, details = '') {
  results.push({ name, ok, details })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${details ? ` — ${details}` : ''}`)
}

async function request(path, cookie = '', options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {}),
    },
  })
  const text = await res.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  return { res, body }
}

async function login(email, loginType) {
  const { res, body } = await request('/api/auth/login', '', {
    method: 'POST',
    body: JSON.stringify({ email, password: PASSWORD, loginType }),
  })
  if (!res.ok) {
    console.error(`Login failed for ${email}: ${JSON.stringify(body)}`)
    return null
  }
  const setCookie = res.headers.get('set-cookie') || ''
  const match = setCookie.match(/(better-auth\.session_token=[^;]+)/)
  return match ? match[1] : null
}

// ---- test body -------------------------------------------------------------

async function run() {
  console.log(`\n=== Multi-stage competition E2E — ${BASE} ===\n`)

  // -- 0. Login ---------------------------------------------------------------
  const adminCookie   = await login(ADMIN_EMAIL, 'admin')
  const studentCookie = await login(STUDENT_EMAIL, 'student')
  const readerCookie  = await login(READER_EMAIL, 'reader')

  log('admin login',   !!adminCookie)
  log('student login', !!studentCookie)
  log('reader login',  !!readerCookie)

  if (!adminCookie || !studentCookie || !readerCookie) {
    console.error('\nCannot continue without all three sessions. Check credentials.')
    printSummary(); return
  }

  // -- 1. Create a 3-stage competition ----------------------------------------
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString()
  const nextWeek  = new Date(Date.now() + 7 * 86_400_000).toISOString()

  const stages = [
    { name: 'الدور التمهيدي', advance_count: 2, min_verses: 0, description: 'الدور الأول' },
    { name: 'الدور الثاني',   advance_count: 1, min_verses: 0, description: 'الدور الثاني' },
    { name: 'الدور النهائي',  advance_count: null, min_verses: 0, description: 'الدور النهائي' },
  ]

  const { res: createRes, body: createBody } = await request(
    '/api/academy/admin/competitions',
    adminCookie,
    {
      method: 'POST',
      body: JSON.stringify({
        title: `[E2E] مسابقة متعددة المراحل ${Date.now()}`,
        description: 'مسابقة اختبار E2E',
        type: 'quran',
        scope: 'academy',
        start_date: tomorrow,
        end_date: nextWeek,
        status: 'active',
        is_multi_stage: true,
        stages,
      }),
    }
  )

  const ok1 = createRes.status === 201 && createBody?.id
  log('create multi-stage competition', ok1, createBody?.id || createRes.status)
  if (!ok1) { printSummary(); return }
  createdIds.competition = createBody.id
  const CID = createdIds.competition

  // -- 2. Stages visible via admin endpoint -----------------------------------
  const { res: stRes, body: stBody } = await request(
    `/api/academy/admin/competitions/${CID}/stages`,
    adminCookie
  )
  const ok2 = stRes.ok && Array.isArray(stBody?.stages) && stBody.stages.length === 3 && stBody.activeStage
  log('GET /stages returns 3 stages + activeStage', ok2,
    ok2 ? `active="${stBody.activeStage.name}"` : JSON.stringify(stBody))

  // -- 3. Student detail — stage 1 active, canSubmit = true ------------------
  const { res: detRes, body: detBody } = await request(
    `/api/academy/student/competitions/${CID}`,
    studentCookie
  )
  const ok3a = detRes.ok && detBody?.activeStage?.name === stages[0].name
  const ok3b = detBody?.canSubmit === true
  log('student detail: activeStage = stage 1', ok3a, detBody?.activeStage?.name)
  log('student detail: canSubmit = true (stage 1)', ok3b)

  // -- 4. Student submits entry for stage 1 ----------------------------------
  const { res: subRes, body: subBody } = await request(
    `/api/academy/student/competitions/${CID}/submit`,
    studentCookie,
    {
      method: 'POST',
      body: JSON.stringify({ submission_url: 'https://example.com/recitation.mp3', notes: 'test', verses_count: 10 }),
    }
  )
  const ok4 = subRes.ok || subRes.status === 200 || subRes.status === 201
  log('student submits entry for stage 1', ok4, subRes.status)

  // -- 5. Reader sees entry in judging list (scoped to stage 1) --------------
  const { res: eListRes, body: eListBody } = await request(
    `/api/reader/competitions/${CID}/entries`,
    readerCookie
  )
  const entry = (eListBody?.data || eListBody?.entries || [])[0]
  const ok5 = eListRes.ok && !!entry
  log('reader sees entries for stage 1', ok5, `count=${eListBody?.data?.length ?? eListBody?.entries?.length ?? 0}`)

  let entryId = entry?.id
  if (!entryId) {
    // Fall back to admin entries endpoint
    const { body: adm } = await request(`/api/academy/competitions/${CID}/entries`, adminCookie)
    entryId = (adm?.data || [])[0]?.id
    log('fallback: admin entries endpoint for entryId', !!entryId, entryId)
  }

  // -- 6. Reader evaluates the entry -----------------------------------------
  if (entryId) {
    const { res: evalRes } = await request(
      `/api/reader/competitions/entries/${entryId}/evaluate`,
      readerCookie,
      { method: 'POST', body: JSON.stringify({ score: 90, feedback: 'جيد' }) }
    )
    log('reader evaluates entry', evalRes.ok, evalRes.status)
  } else {
    log('reader evaluates entry', false, 'no entryId — skipped')
  }

  // -- 7. Admin previews ranking before advancing ----------------------------
  const { res: pvRes, body: pvBody } = await request(
    `/api/academy/admin/competitions/${CID}/advance`,
    adminCookie
  )
  const ok7 = pvRes.ok && typeof pvBody?.ready === 'boolean'
  log('GET /advance returns preview with ready flag', ok7,
    ok7 ? `ready=${pvBody.ready} pending=${pvBody.pending}` : JSON.stringify(pvBody))

  // -- 8. Admin advances to stage 2 ------------------------------------------
  const { res: advRes, body: advBody } = await request(
    `/api/academy/admin/competitions/${CID}/advance`,
    adminCookie,
    { method: 'POST', body: JSON.stringify({ action: 'advance' }) }
  )
  const ok8 = advRes.ok && advBody?.success === true
  log('POST /advance (action=advance) succeeds', ok8,
    ok8 ? `advanced to "${advBody?.stage?.name ?? 'next'}"` : JSON.stringify(advBody))

  // -- 9. Verify active stage moved to stage 2 --------------------------------
  const { body: stBody2 } = await request(
    `/api/academy/admin/competitions/${CID}/stages`,
    adminCookie
  )
  const ok9 = stBody2?.activeStage?.name === stages[1].name ||
    stBody2?.stages?.find((s) => s.status === 'active')?.name === stages[1].name
  log('after advance: activeStage = stage 2', ok9, stBody2?.activeStage?.name)

  // Check that stage 1 entry is now qualified
  const { body: entriesAfter } = await request(
    `/api/academy/competitions/${CID}/entries`,
    adminCookie
  )
  const advancedEntry = (entriesAfter?.data || []).find((e) => e.id === entryId)
  const ok9b = advancedEntry?.status === 'qualified' || advancedEntry?.status === 'winner'
  log('stage 1 entry status = qualified after advance', ok9b, advancedEntry?.status ?? 'entry not found')

  // -- 10. Admin finalises from stage 2 (finalize_now) -----------------------
  const { res: finRes, body: finBody } = await request(
    `/api/academy/admin/competitions/${CID}/advance`,
    adminCookie,
    { method: 'POST', body: JSON.stringify({ action: 'finalize_now' }) }
  )
  const ok10 = finRes.ok && finBody?.success === true
  log('POST /advance (action=finalize_now) succeeds', ok10, JSON.stringify(finBody))

  // -- 11. Competition status = completed ------------------------------------
  // The student detail or a generic GET competition should reflect completion.
  const { body: finalDet } = await request(
    `/api/academy/student/competitions/${CID}`,
    studentCookie
  )
  const ok11 = finalDet?.competition?.status === 'completed'
  log('competition.status = completed after finalize', ok11, finalDet?.competition?.status)

  // ---- summary ---------------------------------------------------------------
  printSummary()

  // ---- cleanup: attempt to remove the test competition ----------------------
  if (createdIds.competition) {
    const { res: delRes } = await request(
      `/api/academy/admin/competitions/${createdIds.competition}`,
      adminCookie,
      { method: 'DELETE' }
    )
    console.log(`\nCleanup: DELETE competition → ${delRes.status}`)
  }
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok).length
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
  if (failed > 0) {
    console.log('\nFailed tests:')
    results.filter((r) => !r.ok).forEach((r) => console.log(`  FAIL ${r.name}: ${r.details}`))
    process.exit(1)
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
