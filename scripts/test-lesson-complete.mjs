import jwt from "jsonwebtoken"

const BASE = process.env.BASE || "http://localhost:3000"
const SECRET =
  process.env.JWT_SECRET ||
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  ""

const STUDENT_ID = "0ccb904c-15e5-4c4b-b4ba-f6a9ab1d12a4"
const COURSE_ID = "0ace7728-39f2-4c7c-aef0-2217ea7da951"
const LESSON_ID = "35dede4b-378d-41bd-97df-6fddfceafa7b"

let pass = 0
let fail = 0
function ok(name, cond, extra = "") {
  if (cond) {
    pass++
    console.log(`  PASS  ${name}`)
  } else {
    fail++
    console.log(`  FAIL  ${name}${extra ? ` (${extra})` : ""}`)
  }
}

function makeToken(role) {
  return jwt.sign(
    { sub: STUDENT_ID, role, email: "test-student@itqan.test" },
    SECRET,
    { expiresIn: "1h" },
  )
}

async function main() {
  if (!SECRET) {
    console.error("JWT secret not set")
    process.exit(1)
  }
  const token = makeToken("student")
  const headers = { Cookie: `session=${token}`, "Content-Type": "application/json" }

  // 1) GET lesson
  console.log("Step 1: GET lesson")
  const lessonRes = await fetch(`${BASE}/api/academy/student/lessons/${LESSON_ID}`, {
    headers,
  })
  const lessonJson = await lessonRes.json()
  console.log("  status:", lessonRes.status)
  ok("GET lesson returns 200", lessonRes.status === 200)
  ok("payload has lesson", !!lessonJson?.lesson)
  ok("is_completed exists in payload", typeof lessonJson?.is_completed === "boolean")

  // 2) POST mark complete
  console.log("Step 2: POST mark complete")
  const compRes = await fetch(
    `${BASE}/api/academy/student/lessons/${LESSON_ID}/complete`,
    { method: "POST", headers },
  )
  const compJson = await compRes.json()
  console.log("  status:", compRes.status, "body:", JSON.stringify(compJson))
  ok("POST complete returns 200", compRes.status === 200)
  ok("response has success=true", compJson?.success === true)

  // 3) GET lesson again -> should be completed
  console.log("Step 3: GET lesson again")
  const lessonRes2 = await fetch(
    `${BASE}/api/academy/student/lessons/${LESSON_ID}`,
    { headers },
  )
  const lessonJson2 = await lessonRes2.json()
  console.log("  status:", lessonRes2.status)
  ok(
    "is_completed is now true",
    lessonJson2?.is_completed === true,
    `got ${lessonJson2?.is_completed}`,
  )

  // 4) GET course -> sidebar should reflect completion + progress_percentage
  console.log("Step 4: GET course")
  const courseRes = await fetch(
    `${BASE}/api/academy/student/courses/${COURSE_ID}`,
    { headers },
  )
  const courseJson = await courseRes.json()
  console.log("  status:", courseRes.status)
  ok("GET course returns 200", courseRes.status === 200)
  const completed = (courseJson?.lessons || []).find((l) => l.id === LESSON_ID)?.is_completed
  ok("course sidebar shows lesson as completed", completed === true)

  // 5) Idempotency: hit it again, must still succeed
  console.log("Step 5: POST complete idempotent")
  const compRes2 = await fetch(
    `${BASE}/api/academy/student/lessons/${LESSON_ID}/complete`,
    { method: "POST", headers },
  )
  ok("second POST also returns 200", compRes2.status === 200)

  // Final
  console.log(`\nResults: ${pass} pass, ${fail} fail`)
  if (fail > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
