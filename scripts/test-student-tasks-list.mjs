// E2E: teacher creates a task, student should see it in their list.
import { SignJWT } from "jose"

const BASE = process.env.BASE_URL || "http://localhost:3000"
const SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret"

const TEACHER_ID = "70f5cd5b-1669-4ce3-9594-7ca01450a697"
const STUDENT_ID = "0ccb904c-15e5-4c4b-b4ba-f6a9ab1d12a4"
const COURSE_ID = "0ace7728-39f2-4c7c-aef0-2217ea7da951"

async function tokenFor(sub, email, role, name = "Test User") {
  const secret = new TextEncoder().encode(SECRET)
  return await new SignJWT({ sub, email, role, name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret)
}

let pass = 0,
  fail = 0
const ok = (label, cond, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? "  -- " + extra : ""}`)
  cond ? pass++ : fail++
}

async function call(path, opts = {}, token) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "content-type": "application/json",
      cookie: `auth-token=${token}`,
      ...(opts.headers || {}),
    },
  })
  let body = null
  try {
    body = await res.json()
  } catch {}
  return { status: res.status, body }
}

const main = async () => {
  const teacherTok = await tokenFor(TEACHER_ID, "s@s.s", "teacher")
  const studentTok = await tokenFor(STUDENT_ID, "sayedxiv@gmail.com", "student")

  // 1) Teacher creates a task
  const due = new Date(Date.now() + 5 * 86400_000).toISOString().slice(0, 10)
  const created = await call(
    "/api/academy/teacher/tasks",
    {
      method: "POST",
      body: JSON.stringify({
        course_id: COURSE_ID,
        title: "اختبار ظهور المهمة - " + Date.now(),
        description: "مهمة تجريبية للتحقق من ظهورها عند الطالب",
        task_type: "homework",
        due_date: due,
        max_score: 50,
      }),
    },
    teacherTok,
  )
  console.log("create:", created.status, JSON.stringify(created.body))
  ok("teacher can create task", created.status === 201 && !!created.body?.data?.id)
  const taskId = created.body?.data?.id

  // 2) Student fetches their tasks list
  const listed = await call("/api/academy/student/tasks", { method: "GET" }, studentTok)
  console.log("list status:", listed.status, "count:", listed.body?.data?.length)
  ok("student list endpoint returns 200", listed.status === 200)
  ok("student list returns array", Array.isArray(listed.body?.data))
  const found = (listed.body?.data || []).find((t) => t.id === taskId)
  ok("created task appears in student list", !!found, found ? `title="${found.title}"` : "not found")
  if (found) {
    ok("task has course_title", typeof found.course_title === "string" && found.course_title.length > 0)
    ok("task has status field", typeof found.status === "string", `status=${found.status}`)
  }

  // 3) Cleanup
  if (taskId) {
    await fetch(`${BASE}/api/academy/teacher/tasks/${taskId}`, {
      method: "DELETE",
      headers: { cookie: `auth-token=${teacherTok}` },
    }).catch(() => {})
  }

  console.log(`\n${pass} passed, ${fail} failed`)
  process.exit(fail ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
