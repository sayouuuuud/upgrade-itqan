# Badge Route Dev Startup Fix

## Problem
`npm run dev` failed with:

`Error: You cannot use different slug names for the same dynamic path ('badge_type' !== 'id').`

## Cause
The academy badge API used a dynamic route folder named `[badge_type]`. Next.js detected a conflicting dynamic parameter name for the same route shape after route generation.

## Fix
- Renamed:
  - `app/api/academy/admin/badges/[badge_type]/route.ts`
  - to `app/api/academy/admin/badges/[id]/route.ts`
- Updated route parameter handling internally from `badge_type` to `id`.
- Kept the API URL behavior the same: `/api/academy/admin/badges/:badgeType` still works.

## Validation
- `pnpm exec tsc --noEmit`: passed.
- `pnpm run build`: passed.
- Existing dev server route check:
  - `/api/academy/admin/badges`: returned 401 instead of route startup crash.
  - `/api/academy/admin/badges/test_badge_type`: returned 401 instead of route startup crash.

## Notes
The remaining console warnings are Next.js warnings already present in the project:
- `eslint` key in `next.config.mjs` is unsupported in this Next.js version.
- `middleware` convention is deprecated in favor of `proxy`.
