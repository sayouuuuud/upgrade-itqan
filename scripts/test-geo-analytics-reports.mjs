const BASE = process.env.BASE_URL || 'http://localhost:3000'
const PASSWORD = '123456'
const results = []

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

async function check(name, fn) {
  try {
    const details = await fn()
    log(name, true, details)
  } catch (error) {
    log(name, false, error.message || String(error))
  }
}

function hasArray(body, key) {
  if (!Array.isArray(body?.[key])) throw new Error(`missing ${key} array`)
  return `${key}=${body[key].length}`
}

try {
  const adminCookie = await login('admin@test.com', 'admin')
  const studentCookie = await login('student@test.com')
  const readerCookie = await login('reviewer@test.com')

  await check('academy analytics API loads for admin', async () => {
    const { res, body } = await request('/api/academy/admin/analytics', adminCookie)
    if (res.status !== 200) throw new Error(`status=${res.status}, error=${body?.error || ''}`)
    if (!body?.stats) throw new Error('missing stats')
    return `stats=${Object.keys(body.stats).join('|')}`
  })

  await check('academy analytics page loads', async () => {
    const { res } = await request('/academy/admin/analytics', adminCookie)
    if (res.status !== 200) throw new Error(`status=${res.status}`)
    return `status=${res.status}`
  })

  await check('academy analytics has country-level student counts', async () => {
    const { res, body } = await request('/api/academy/admin/analytics', adminCookie)
    if (res.status !== 200) throw new Error(`status=${res.status}`)
    if (!Array.isArray(body.studentsByCountry)) throw new Error('missing studentsByCountry')
    return `countries=${body.studentsByCountry.length}`
  })

  await check('academy analytics has region-level heatmap data', async () => {
    const { res, body } = await request('/api/academy/admin/analytics', adminCookie)
    if (res.status !== 200) throw new Error(`status=${res.status}`)
    if (!Array.isArray(body.geoHeatmap)) throw new Error('missing geoHeatmap')
    return `regions=${body.geoHeatmap.length}`
  })

  await check('academy analytics has daily activity rate', async () => {
    const { res, body } = await request('/api/academy/admin/analytics', adminCookie)
    if (res.status !== 200) throw new Error(`status=${res.status}`)
    if (body.stats?.dailyActivityRate === undefined) throw new Error('missing stats.dailyActivityRate')
    return `dailyActivityRate=${body.stats.dailyActivityRate}`
  })

  await check('academy analytics has top recorded surahs', async () => {
    const { res, body } = await request('/api/academy/admin/analytics', adminCookie)
    if (res.status !== 200) throw new Error(`status=${res.status}`)
    if (!Array.isArray(body.topSurahs)) throw new Error('missing topSurahs')
    return `topSurahs=${body.topSurahs.length}`
  })

  await check('maqra’a admin analytics API loads', async () => {
    const { res, body } = await request('/api/admin/analytics?days=30', adminCookie)
    if (res.status !== 200) throw new Error(`status=${res.status}, error=${body?.error || ''}`)
    return `${hasArray(body, 'topCountries')}, ${hasArray(body, 'overTime')}`
  })

  await check('maqra’a reports API loads weekly', async () => {
    const { res, body } = await request('/api/admin/reports?range=week', adminCookie)
    if (res.status !== 200) throw new Error(`status=${res.status}, error=${body?.error || ''}`)
    if (!body?.recitations?.daily) throw new Error('missing recitations.daily')
    if (!body?.users?.byCity) throw new Error('missing users.byCity')
    return `daily=${body.recitations.daily.length}, cities=${body.users.byCity.length}`
  })

  await check('maqra’a reports API loads monthly', async () => {
    const { res, body } = await request('/api/admin/reports?range=month', adminCookie)
    if (res.status !== 200) throw new Error(`status=${res.status}, error=${body?.error || ''}`)
    if (!body?.recitations) throw new Error('missing recitations')
    return `totalRecitations=${body.recitations.total || 0}`
  })

  await check('maqra’a reports page loads', async () => {
    const { res } = await request('/admin/reports', adminCookie)
    if (res.status !== 200) throw new Error(`status=${res.status}`)
    return `status=${res.status}`
  })

  await check('weekly/monthly admin report delivery endpoint exists', async () => {
    const { res, body } = await request('/api/cron/admin-activity-reports?period=weekly&dryRun=1', adminCookie)
    if (![200, 401].includes(res.status)) throw new Error(`status=${res.status}, error=${body?.error || ''}`)
    if (res.status === 401) throw new Error('endpoint unauthorized/unusable with admin session')
    return `status=${res.status}`
  })

  await check('no unauthorized access for student to admin analytics', async () => {
    const { res } = await request('/api/academy/admin/analytics', studentCookie)
    if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`)
    return `status=${res.status}`
  })

  await check('maqra’a reader core unaffected', async () => {
    const { res } = await request('/api/recitations?status=pending&limit=5', readerCookie)
    if (res.status !== 200) throw new Error(`status=${res.status}`)
    return `status=${res.status}`
  })
} catch (error) {
  log('test runner completed without uncaught exception', false, error?.stack || String(error))
} finally {
  const passed = results.filter((item) => item.ok).length
  const failed = results.length - passed
  const summary = { passed, failed, results }
  await import('node:fs/promises').then((fs) => fs.writeFile('/home/ubuntu/repos/itqan-reader-progress-updated-gamification-fixed/scripts/test-results/geo-analytics-reports-results.json', JSON.stringify(summary, null, 2)))
  console.log(`SUMMARY passed=${passed} failed=${failed}`)
  if (failed > 0) process.exit(1)
}
