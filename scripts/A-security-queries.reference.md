# A-Security Query Templates (Reference Only)

These queries are executed from application code via `pg` / `postgres-js`
with parameter binding (`$1`, `$2`, ...). They are NOT meant to be pasted
into the Supabase SQL editor — running them as-is will fail with
`there is no parameter $1`.

To run one manually for debugging, replace `$1` with a literal quoted UUID.

---

## A-4: Fetch fresh permission flags from DB

Used by `middleware.ts` and protected route handlers to bypass the JWT
cache and read the live `is_active`, `has_*_access`, and role flags.

```sql
SELECT
  u.id,
  u.role,
  u.name,
  u.email,
  u.is_active,
  u.has_quran_access,
  u.has_academy_access,
  u.platform_preference,
  u.approval_status,
  u.last_login_at,
  COALESCE(u.academy_roles, ARRAY[]::VARCHAR[]) AS academy_roles,
  EXISTS (
    SELECT 1
    FROM user_sessions us
    WHERE us.user_id = u.id
      AND us.last_active_at > NOW() - INTERVAL '5 minutes'
  ) AS is_online
FROM users u
WHERE u.id = $1;
```

---

## A-5: Get a user's active sessions (for revocation)

```sql
SELECT
  us.id          AS session_id,
  us.user_id,
  us.token,
  us.created_at,
  us.last_active_at,
  us.expires_at,
  us.ip_address,
  us.user_agent
FROM user_sessions us
WHERE us.user_id = $1
  AND us.expires_at > NOW()
ORDER BY us.last_active_at DESC;
```

---

## A-4: Mode Switcher — fetch DB flags instead of JWT cache

```sql
SELECT
  u.id,
  u.has_quran_access,
  u.has_academy_access,
  u.platform_preference,
  u.role,
  COALESCE(u.academy_roles, ARRAY[]::VARCHAR[]) AS academy_roles
FROM users u
WHERE u.id = $1;
```

---

## A-1: Diagnostic — check role-based access for student routes

```sql
SELECT
  u.id,
  u.role,
  u.name,
  CASE
    WHEN u.role = 'teacher' THEN 'DENY - student paths'
    WHEN u.role = 'student' THEN 'ALLOW - student paths'
    WHEN u.role IN ('supervisor', 'content_supervisor') THEN 'DENY - student paths'
    ELSE 'CHECK - student paths'
  END AS student_path_access,
  COALESCE(u.academy_roles, ARRAY[]::VARCHAR[]) AS academy_roles
FROM users u
WHERE u.id = $1;
```
