# Agent A - Security Fixes Testing Checklist

**Branch:** `feature/plan-A-security`  
**Date:** May 1, 2026  
**Tester:** QA Team

---

## A-1: Teacher Path Restriction

### Setup
```
1. Login as admin
2. Create/Approve a teacher account
3. Get teacher session token
```

### Test Cases
- [ ] **TC-A1-001:** Teacher tries `/academy/student/tasks`
  - Expected: Redirect to `/academy/teacher`
  - Command: `curl -H "Cookie: auth-token=<token>" https://app/academy/student/tasks`

- [ ] **TC-A1-002:** Teacher tries `/academy/student/progress`
  - Expected: Redirect to `/academy/teacher`

- [ ] **TC-A1-003:** Teacher tries `/academy/student/courses`
  - Expected: Redirect to `/academy/teacher`

- [ ] **TC-A1-004:** Student tries `/academy/student/tasks`
  - Expected: Access granted (200)

- [ ] **TC-A1-005:** Admin tries `/academy/student/tasks`
  - Expected: Access granted (200)

- [ ] **TC-A1-006:** Supervisor tries `/academy/student/tasks`
  - Expected: Redirect to `/academy/supervisor`

---

## A-2: Registration Redirect

### Test Cases
- [ ] **TC-A2-001:** Register with platform = "academy"
  - Form: Select "الأكاديمية فقط"
  - Fill name, email, password
  - After verification → Should redirect to `/academy/student`
  - DB check: `platform_preference = 'academy'`

- [ ] **TC-A2-002:** Register with platform = "quran"
  - Form: Select "القرآن فقط"
  - After verification → Should redirect to `/student`
  - DB check: `platform_preference = 'quran'`

- [ ] **TC-A2-003:** Register with platform = "both"
  - Form: Select "الأكاديمية والقرآن"
  - After verification → Should redirect to `/student` (with switcher visible)
  - DB check: `platform_preference = 'both'`

- [ ] **TC-A2-004:** Session token has correct platform_preference
  - Decode JWT: `payload.platform_preference` matches DB

---

## A-3: Teacher Account Creation

### Setup
```
1. Login as academy admin
2. View pending teacher applications
3. Find test teacher application
```

### Test Cases
- [ ] **TC-A3-001:** Approve teacher application
  - Click "Approve"
  - No white screen (should show success toast)
  - DB: `role = 'teacher'`, `is_active = true`, `has_academy_access = true`

- [ ] **TC-A3-002:** New teacher login
  - Email/password from approved application
  - Should login successfully
  - Redirects to `/academy/teacher`
  - Not white screen

- [ ] **TC-A3-003:** Academy roles created
  - DB: `academy_teachers` record exists for user_id
  - `created_at` timestamp is recent

- [ ] **TC-A3-004:** Email notification sent
  - Check email inbox
  - Should receive "تمت الموافقة على طلبك كمعلم"

- [ ] **TC-A3-005:** Reject teacher application
  - Click "Reject"
  - Show rejection reason form
  - Email notification sent
  - DB: `approval_status = 'rejected'`

---

## A-4: Real-time Permission Invalidation

### Setup
```
1. User A logged in with academy access
2. User A opens `/academy/teacher` page
3. Admin changes User A's has_academy_access = false
```

### Test Cases
- [ ] **TC-A4-001:** Remove academy access while logged in
  - Admin: Set `has_academy_access = false`
  - User A: Try accessing `/academy/student`
  - Expected: Redirect to `/student` (within 30 seconds)
  - No refresh needed

- [ ] **TC-A4-002:** Remove quran access while logged in
  - Admin: Set `has_quran_access = false`
  - User A: Try accessing `/student` (quran section)
  - Expected: Redirect to `/academy/student` (if has_academy_access)
  - No refresh needed

- [ ] **TC-A4-003:** Change approval status to rejected
  - User: reader with approval_status = 'approved'
  - Admin: Set `approval_status = 'rejected'`
  - User: Try accessing `/reader`
  - Expected: Redirect to `/login`
  - Session invalidated

- [ ] **TC-A4-004:** Mode Switcher reflects DB state
  - Mode Switcher UI shows real-time flags
  - Admin changes flags → Switcher updates without refresh

- [ ] **TC-A4-005:** Middleware DB check on sensitive routes
  - Check server logs: `[v0] A-4 DB check...`
  - Verify DB query executes on:
    - `/academy/*`
    - `/admin/*`
    - `/api/admin/*`
    - `/api/academy/*`

---

## A-5: Session Invalidation on User Disable

### Setup
```
1. User B logged in with active session
2. Check DB: user.is_active = true
3. Admin opens User Management
```

### Test Cases
- [ ] **TC-A5-001:** Disable active user
  - Admin: Toggle `is_active = false`
  - Check DB: `is_active = false`
  - User B: Try any request
  - Expected: Redirect to `/login` (within 10 seconds)
  - No refresh needed

- [ ] **TC-A5-002:** All sessions cleared
  - Before disable: DB has 2-3 sessions in `user_sessions`
  - After disable: `user_sessions` empty for this user
  - Verify both Supabase Auth and local sessions cleared

- [ ] **TC-A5-003:** Cannot login after disable
  - User B tries login with same email/password
  - Expected: Login fails
  - Check if Supabase Auth user deleted or disabled

- [ ] **TC-A5-004:** Activity log recorded
  - DB: `activity_logs` has entry:
    - `action = 'user_deactivated'`
    - `user_id = <admin_id>`
    - `entity_id = <user_b_id>`

- [ ] **TC-A5-005:** Re-enable user restores access
  - Admin: Toggle `is_active = true` again
  - User B: Can login again
  - Previous sessions NOT restored (security)

---

## A-6: Delete Rejected Reader Applications

### Setup
```
1. Create reader application
2. Reject application via admin panel
3. Check DB: `approval_status = 'rejected'`
```

### Test Cases
- [ ] **TC-A6-001:** Delete rejected reader
  - Admin: Find rejected reader application
  - Click "Delete"
  - Expected: Success message
  - DB: User record deleted
  - DB: `reader_profiles` record deleted

- [ ] **TC-A6-002:** Cannot delete approved reader
  - Admin: Try deleting approved reader
  - Expected: Error "لا يمكن حذف طلب غير مرفوض"
  - User record NOT deleted

- [ ] **TC-A6-003:** Cannot delete pending reader
  - Admin: Try deleting pending (not reviewed) reader
  - Expected: Error "لا يمكن حذف طلب غير مرفوض"
  - User record NOT deleted

- [ ] **TC-A6-004:** Cascade delete records
  - Before delete: Check notifications, sessions exist
  - Delete reader via endpoint
  - After: All related records cleaned up
  - Orphaned records do not exist

- [ ] **TC-A6-005:** Activity logged
  - DB: `activity_logs` entry created
  - `action = 'reader_application_deleted'`
  - `admin_id = <current_admin>`

- [ ] **TC-A6-006:** DELETE endpoint works
  - `curl -X DELETE /api/admin/reader-applications \
    -H "Content-Type: application/json" \
    -d '{"userId": "<user_id>"}'`
  - Expected: 200 (not 405)

---

## SQL Triggers Verification

### A-4 Triggers
- [ ] **TC-SQL-A4-001:** Permission change trigger fires
  - Update user `is_active = false`
  - Check: `permission_invalidations` table has entry
  - Verify `pg_notify` message sent

- [ ] **TC-SQL-A4-002:** Realtime listener receives notification
  - Client subscribed to `user_permission_changed`
  - Admin changes permission
  - Client receives notification event
  - UI updates without refresh

### A-5 Triggers
- [ ] **TC-SQL-A5-001:** Session invalidation trigger fires
  - Set user `is_active = false`
  - Check: `user_sessions` records deleted
  - Verify `pg_notify` sent

- [ ] **TC-SQL-A5-002:** Activity log entry created
  - Trigger creates `activity_logs` entry
  - `action = 'session_revoked'`

---

## Integration Tests

- [ ] **TC-INT-001:** Full teacher approval workflow
  1. Register new teacher
  2. Admin approves
  3. Teacher logs in
  4. Access `/academy/teacher` (works)
  5. Try `/academy/student` (redirects)
  6. Admin removes academy_access
  7. Teacher redirected to `/student`

- [ ] **TC-INT-002:** Full user disable workflow
  1. User logged in
  2. Access protected route (works)
  3. Admin disables account
  4. User session invalidated
  5. User redirected to login
  6. Cannot login again
  7. Admin re-enables
  8. User can login again

- [ ] **TC-INT-003:** Reader application lifecycle
  1. Apply as reader
  2. Admin rejects
  3. Admin deletes rejected app
  4. User record gone
  5. No orphaned records

---

## Browser Compatibility

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Performance Tests

- [ ] **PERF-001:** Middleware DB check < 100ms
  - Monitor: `middleware.ts` execution time
  - Database query should be indexed

- [ ] **PERF-002:** Session revocation < 500ms
  - Monitor: Supabase Admin API call timing
  - Should complete before user notices

---

## Security Tests

- [ ] **SEC-001:** Cannot bypass role checks with URL tampering
- [ ] **SEC-002:** Cannot escalate privileges via session manipulation
- [ ] **SEC-003:** All admin actions logged with user attribution
- [ ] **SEC-004:** Sensitive data not exposed in error messages

---

## Sign-off

- [ ] QA Lead: _________________ Date: _______
- [ ] Product: _________________ Date: _______
- [ ] Security: ________________ Date: _______

---

_Agent A - Security Testing - May 1, 2026_
