# Agent A - Security Fixes Implementation

**Branch:** `feature/plan-A-security`  
**Status:** In Progress  
**Date:** May 1, 2026

---

## ✅ Completed Fixes

### A-1 🔴 Teacher Path Restriction (FIXED)
**File:** `middleware.ts`

**Problem:** Teachers could access `/academy/student/*` by manually editing the URL.

**Solution:**
```typescript
// Check for student paths - prevent teacher/supervisor from accessing student routes
if (pathname.startsWith("/academy/student")) {
    const studentAllowedRoles = ['student', 'admin', 'parent'];
    const hasStudentAccess = studentAllowedRoles.includes(sessionPayload.role) ||
        sessionPayload.academy_roles?.some(r => studentAllowedRoles.includes(r));
    if (!hasStudentAccess) {
        // Redirect teachers and supervisors away from student paths
        return NextResponse.redirect(new URL("/academy/teacher", req.url))
    }
}
```

**Testing:**
- [ ] Log in as teacher
- [ ] Try accessing `/academy/student/tasks` → Should redirect to `/academy/teacher`
- [ ] Try accessing `/academy/student/progress` → Should redirect to `/academy/teacher`
- [ ] Log in as student
- [ ] Access `/academy/student/tasks` → Should work normally

---

### A-2 🔴 Registration Redirect (FIXED)
**File:** `app/(auth)/register/page.tsx`

**Problem:** After registering with "الأكاديمية فقط" (academy only), user redirects to `/student` instead of `/academy/student`.

**Solution:**
```typescript
if (data.requiresVerification) {
  router.push(`/verify?email=${encodeURIComponent(email)}`)
} else {
  // A-2: Route correctly based on platform_preference from registration response
  if (platform === 'academy') {
    router.push('/academy/student')
  } else {
    router.push('/student')
  }
}
```

**Testing:**
- [ ] Register with platform = "academy" → Should redirect to `/academy/student`
- [ ] Register with platform = "quran" → Should redirect to `/student`
- [ ] Register with platform = "both" → Should redirect to `/student` (with switcher visible)
- [ ] Verify email and check session token has correct `platform_preference`

---

### A-6 🟠 Delete Rejected Reader Applications (FIXED)
**File:** `app/api/admin/reader-applications/route.ts`

**Problem:** `DELETE /api/admin/reader-applications` returned 405 Method Not Allowed.

**Solution:** Added DELETE method:
```typescript
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  const allowedRoles: ("admin" | "reciter_supervisor")[] = ["admin", "reciter_supervisor"]
  if (!requireRole(session, allowedRoles)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const { userId } = await req.json()

  // Only allow deletion of rejected applications
  const reader = await query<{ approval_status: string }>(
    `SELECT approval_status FROM users WHERE id = $1 AND role = 'reader'`,
    [userId]
  )

  if (reader[0].approval_status !== 'rejected') {
    return NextResponse.json({ error: "لا يمكن حذف طلب غير مرفوض" }, { status: 400 })
  }

  // Delete reader_profiles and user record
  await query(`DELETE FROM reader_profiles WHERE user_id = $1`, [userId])
  await query(`DELETE FROM users WHERE id = $1`, [userId])

  // Log action
  await logAdminAction({...})

  return NextResponse.json({ success: true, message: "تم حذف الطلب بنجاح" })
}
```

**Testing:**
- [ ] Create a reader application with rejection status
- [ ] Call `DELETE /api/admin/reader-applications` with userId
- [ ] Should return 200 with success message
- [ ] Verify user is deleted from database

---

## ⏳ Pending Fixes

### A-3 🔴 Teacher Account Creation - White Screen After Approval
**File:** `app/api/academy/admin/teacher-applications/[id]/approve`

**Current Status:** Needs investigation
- [ ] Check what happens after approval endpoint is called
- [ ] Verify session is created correctly with role='teacher'
- [ ] Check middleware redirects teacher to `/academy/teacher`
- [ ] Test login flow after approval

---

### A-4 🔴 Permission Flags Not Real-time
**Files:** `middleware.ts` + `app/api/admin/users/route.ts`

**Current Status:** Needs implementation

**SQL Queries:** See `scripts/A-security-queries.sql`

**Tasks:**
- [ ] Add trigger to invalidate permissions when admin changes access flags
- [ ] Update middleware to check DB flags on each sensitive request
- [ ] Connect Supabase Realtime listener to permission changes
- [ ] Test: Admin changes `has_academy_access` → User session immediately reflects change

---

### A-5 🟠 Disable User Account - Real-time Session Invalidation
**File:** `app/api/admin/users/route.ts`

**Current Status:** Needs implementation

**SQL Queries:** See `scripts/A-security-queries.sql`

**Tasks:**
- [ ] When `isActive` changed to `false`, call Supabase Admin API to revoke all sessions
- [ ] Or: Use Supabase Realtime to force client logout
- [ ] Test: Disable user account → User is logged out immediately (no refresh needed)

---

## SQL Schema Requirements

All security triggers and invalidation tables are defined in:
📄 **`scripts/A-security-queries.sql`**

Required tables:
- `users` (existing) - needs triggers
- `permission_invalidations` (new) - tracks permission changes
- `user_sessions` (existing) - needs deletion on user disable
- `activity_logs` (existing) - for audit trail

---

## Important Notes

1. **A-3 Before A-4:** Fix teacher account creation (A-3) before implementing real-time invalidation (A-4).
2. **Agent B Coordination:** After A-3 is complete, create PR and notify Agent B — they need same file.
3. **SQL File:** All SQL in `scripts/A-security-queries.sql` — run in Supabase SQL Editor before implementing backend code.
4. **Testing:** Each fix has associated test steps. Complete before moving to next task.

---

## Files Modified

- ✅ `middleware.ts` - A-1 + A-4 ready
- ✅ `app/(auth)/register/page.tsx` - A-2
- ⏳ `app/api/academy/admin/teacher-applications/[id]/approve` - A-3
- ⏳ `app/api/admin/users/route.ts` - A-4 + A-5
- ✅ `app/api/admin/reader-applications/route.ts` - A-6
- 📄 `scripts/A-security-queries.sql` - SQL for A-4 + A-5

---

## Next Steps

1. **A-3:** Investigate teacher approval white screen issue
2. **A-4:** Implement permission invalidation with Supabase Realtime
3. **A-5:** Add session revocation to user disable endpoint
4. **Testing:** Run complete security test suite after each fix
5. **PR:** Create feature branch PR after A-3 is resolved
