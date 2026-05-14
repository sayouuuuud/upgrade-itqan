const BASE = process.env.BASE_URL || 'http://localhost:3000'
const PASSWORD = '123456'

const results = []
const createdCompetitionIds = []

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
  return { res, body, text }
}

async function login(email, loginType) {
  const { res, body } = await request('/api/auth/login', '', {
    method: 'POST',
    body: JSON.stringify({ email, password: PASSWORD, loginType }),
  })
  const cookie = (res.headers.get('set-cookie') || '').match(/auth-token=[^;]+/)?.[0] || ''
  log(`login ${email}`, res.status === 200 && Boolean(cookie), `status=${res.status}, role=${body?.user?.role || 'n/a'}`)
  return cookie
}

async function assertStatus(name, path, cookie, expected, options = {}) {
  const { res, body } = await request(path, cookie, options)
  log(name, expected.includes(res.status), `status=${res.status}${body?.error ? `, error=${body.error}` : ''}`)
  return { res, body }
}

async function cleanup(adminCookie) {
  for (const id of createdCompetitionIds.reverse()) {
    await request(`/api/academy/admin/competitions/${id}`, adminCookie, { method: 'DELETE' })
  }
}

try {
  const adminCookie = await login('admin@test.com', 'admin')
  const studentCookie = await login('student@test.com')
  const readerCookie = await login('reviewer@test.com')

  await assertStatus('academy admin leaderboard allows admin', '/api/academy/admin/leaderboard?period=all_time&scope=platform&limit=5', adminCookie, [200])
  await assertStatus('academy admin leaderboard blocks student', '/api/academy/admin/leaderboard?period=all_time&scope=platform&limit=5', studentCookie, [401])
  await assertStatus('academy student platform leaderboard', '/api/academy/leaderboard?period=all_time&scope=platform&limit=5', studentCookie, [200])
  await assertStatus('academy student halaqa leaderboard', '/api/academy/leaderboard?period=all_time&scope=halaqa&limit=5', studentCookie, [200])

  const created = await assertStatus('academy admin creates monthly competition', '/api/academy/admin/competitions', adminCookie, [201], {
    method: 'POST',
    body: JSON.stringify({
      title: `اختبار أكاديمية ${Date.now()}`,
      type: 'monthly',
      start_date: '2026-05-01',
      end_date: '2026-05-31',
      max_participants: 10,
      points_multiplier: 2,
      badge_key: 'star_of_halaqah',
      min_verses: 5,
    }),
  })
  const competitionId = created.body?.data?.id
  if (competitionId) createdCompetitionIds.push(competitionId)

  if (competitionId) {
    await assertStatus('academy student submits competition recitation', `/api/academy/competitions/${competitionId}/entries`, studentCookie, [201], {
      method: 'POST',
      body: JSON.stringify({ submission_url: 'https://example.com/test-recitation.mp3', verses_count: 7, notes: 'اختبار تلقائي' }),
    })
    const entries = await assertStatus('academy admin/reader can list competition entries', `/api/academy/competitions/${competitionId}/entries`, adminCookie, [200])
    const entryId = entries.body?.data?.[0]?.id
    if (entryId) {
      await assertStatus('academy reader/admin judges entry and awards winner', `/api/academy/admin/competitions/${competitionId}/entries/${entryId}`, adminCookie, [200], {
        method: 'PATCH',
        body: JSON.stringify({ score: 96, rank: 1, feedback: 'ممتاز', mark_winner: true }),
      })
    } else {
      log('academy entry id exists for judging', false, 'no entry returned')
    }
  }

  await assertStatus('maqra’a student dashboard route loads', '/student', studentCookie, [200])
  await assertStatus('maqra’a student recitations API loads', '/api/recitations?limit=5', studentCookie, [200])
  await assertStatus('maqra’a student submit route loads', '/student/submit', studentCookie, [200])
  await assertStatus('maqra’a reader dashboard route loads', '/reader', readerCookie, [200])
  await assertStatus('maqra’a reader pending recitations API loads', '/api/recitations?status=pending&limit=5', readerCookie, [200])
  await assertStatus('maqra’a reader recitations route loads', '/reader/recitations', readerCookie, [200])

  await cleanup(adminCookie)
} catch (error) {
  log('test runner completed without uncaught exception', false, error?.stack || String(error))
} finally {
  const passed = results.filter((item) => item.ok).length
  const failed = results.length - passed
  const summary = { passed, failed, results }
  await import('node:fs/promises').then((fs) => fs.writeFile('/home/ubuntu/repos/itqan-reader-progress-updated-gamification-fixed/scripts/test-results/academy-maqraa-results.json', JSON.stringify(summary, null, 2)))
  console.log(`SUMMARY passed=${passed} failed=${failed}`)
  if (failed > 0) process.exit(1)
}
