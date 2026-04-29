/**
 * E2E test for the tasks/submissions flow.
 *
 *  1. Sign a JWT for an existing teacher
 *  2. POST /api/academy/teacher/tasks                     -> create task
 *  3. GET  /api/academy/teacher/tasks                     -> verify it's listed
 *  4. Sign a JWT for the enrolled student
 *  5. GET  /api/academy/student/tasks/[id]                -> verify task is visible
 *  6. POST /api/academy/student/tasks/[id]/submit         -> submit
 *  7. Verify a row landed in task_submissions
 *  8. Cleanup
 */

import { SignJWT } from "jose"

const BASE = process.env.BASE || "http://localhost:3000"
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "hana-lazan-secret-key-change-in-production",
)

// Real rows we already located in the DB
const TEACHER = {
  id: "70f5cd5b-1669-4ce3-9594-7ca01450a697",
  email: "s@s.s",
  name: "sayed",
  role: "teacher",
}
const STUDENT = {
  id: "0ccb904c-15e5-4c4b-b4ba-f6a9ab1d12a4",
  email: "sayedxiv@gmail.com",
  name: "sayed ",
  role: "student",
}
const COURSE_ID = "0ace7728-39f2-4c7c-aef0-2217ea7da951"

async function signCookie(user) {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET)
  return `auth-token=${token}`
}

function logStep(n, label) {
  console.log(`\n=== Step ${n}: ${label} ===`)
}

function ok(label, cond, extra) {
  const mark = cond ? "PASS" : "FAIL"
  console.log(`  [${mark}] ${label}${extra ? " -> " + extra : ""}`)
  if (!cond) process.exitCode = 1
}

async function main() {
  const teacherCookie = await signCookie(TEACHER)
  const studentCookie = await signCookie(STUDENT)

  // ---------- Step 1: Teacher creates task ----------
  logStep(1, "Teacher creates a new task (audio submission)")
  const dueDate = new Date(Date.now() + 7 * 86400_000).toISOString()
  const createBody = {
    course_id: COURSE_ID,
    title: "تسليم تلاوة - اختبار آلي",
    description: "سجّل تلاوة سورة الفاتحة وأرسلها صوتياً.",
    type: "recitation",
    submission_type: "audio",
    due_date: dueDate,
    max_score: 100,
    priority: "high",
    submission_instructions: "حاول التسجيل في مكان هادئ.",
  }
  const createRes = await fetch(`${BASE}/api/academy/teacher/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: teacherCookie },
    body: JSON.stringify(createBody),
  })
  const createJson = await createRes.json().catch(() => ({}))
  console.log("  status:", createRes.status, "body:", JSON.stringify(createJson))
  ok("POST /tasks returns 200", createRes.status === 200)
  ok("response has task id", !!createJson?.data?.id)
  const taskId = createJson?.data?.id
  if (!taskId) {
    console.error("Cannot continue without task id")
    return
  }

  // ---------- Step 2: Teacher lists tasks ----------
  logStep(2, "Teacher lists tasks")
  const listRes = await fetch(`${BASE}/api/academy/teacher/tasks`, {
    headers: { cookie: teacherCookie },
  })
  const listJson = await listRes.json().catch(() => ({}))
  ok("GET /tasks returns 200", listRes.status === 200)
  const arr = Array.isArray(listJson) ? listJson : listJson.data || []
  ok("list contains created task", arr.some((t) => t.id === taskId), `found ${arr.length} tasks`)

  // ---------- Step 3: Student fetches task ----------
  logStep(3, "Student fetches the task")
  const studentTaskRes = await fetch(
    `${BASE}/api/academy/student/tasks/${taskId}`,
    { headers: { cookie: studentCookie } },
  )
  const studentTaskJson = await studentTaskRes.json().catch(() => ({}))
  console.log("  status:", studentTaskRes.status)
  ok("GET student task returns 200", studentTaskRes.status === 200)
  const taskPayload = studentTaskJson.data || studentTaskJson
  ok("payload has task title", !!taskPayload?.title || !!taskPayload?.task?.title)
  ok(
    "payload exposes submission_type",
    (taskPayload?.submission_type || taskPayload?.task?.submission_type) === "audio",
  )

  // ---------- Step 4: Student submits ----------
  logStep(4, "Student submits an audio answer (URL form)")
  const submitBody = {
    submission_type: "audio",
    audio_url: "https://example.com/test-audio.webm",
    file_name: "test-audio.webm",
    file_type: "audio/webm",
    file_size: 12345,
    text_content: "تسليم آلي تلقائي",
  }
  const submitRes = await fetch(
    `${BASE}/api/academy/student/tasks/${taskId}/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: studentCookie },
      body: JSON.stringify(submitBody),
    },
  )
  const submitJson = await submitRes.json().catch(() => ({}))
  console.log("  status:", submitRes.status, "body:", JSON.stringify(submitJson))
  ok("POST submit returns 200", submitRes.status === 200)
  ok("submission has id", !!submitJson?.data?.id)
  ok(
    "submission_type stored",
    submitJson?.data?.submission_type === "audio",
    submitJson?.data?.submission_type,
  )
  ok(
    "audio_url stored",
    submitJson?.data?.audio_url === submitBody.audio_url,
    submitJson?.data?.audio_url,
  )

  // ---------- Step 5: Re-submit (idempotent upsert) ----------
  logStep(5, "Student re-submits (should upsert, not duplicate)")
  const reSubmitRes = await fetch(
    `${BASE}/api/academy/student/tasks/${taskId}/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: studentCookie },
      body: JSON.stringify({
        ...submitBody,
        text_content: "إعادة تسليم",
      }),
    },
  )
  const reSubmitJson = await reSubmitRes.json().catch(() => ({}))
  ok("POST re-submit returns 200", reSubmitRes.status === 200)
  ok(
    "same submission row reused",
    reSubmitJson?.data?.id === submitJson?.data?.id,
    `${reSubmitJson?.data?.id} vs ${submitJson?.data?.id}`,
  )

  // ---------- Step 6: Bad payload rejection ----------
  logStep(6, "Submit with no content -> should 400")
  const badRes = await fetch(
    `${BASE}/api/academy/student/tasks/${taskId}/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: studentCookie },
      body: JSON.stringify({ submission_type: "audio" }),
    },
  )
  const badJson = await badRes.json().catch(() => ({}))
  ok("empty audio submission rejected", badRes.status === 400, `status=${badRes.status} body=${JSON.stringify(badJson)}`)

  // ---------- Step 7: Cleanup ----------
  logStep(7, "Cleaning up test data")
  console.log(`  task id = ${taskId}`)
  console.log(`  submission id = ${submitJson?.data?.id}`)
  console.log("  (cleanup is performed by the harness via SQL after this script)")

  if (process.exitCode === 1) {
    console.log("\nSome checks FAILED")
  } else {
    console.log("\nAll checks PASSED")
  }
  console.log(JSON.stringify({ taskId, submissionId: submitJson?.data?.id }))
}

main().catch((e) => {
  console.error("Fatal error:", e)
  process.exit(2)
})
