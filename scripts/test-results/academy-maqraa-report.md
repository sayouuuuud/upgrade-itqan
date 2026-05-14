# Academy + Maqra’a Test Report

## Summary
- Passed: 17
- Failed: 0

## Academy tested
- Admin login works.
- Student login works.
- Academy admin leaderboard allows admin and blocks student access.
- Student leaderboard works for platform scope.
- Student leaderboard works for halaqa scope.
- Admin can create monthly competition.
- Student can submit a competition recitation.
- Admin/reader can list competition entries.
- Admin/reader can judge the entry, mark winner, and award points/badge.

## Maqra’a tested
- Student maqra’a dashboard loads.
- Student recitations API loads.
- Student submit-recitation page loads.
- Reader login works.
- Reader maqra’a dashboard loads.
- Reader pending recitations API loads.
- Reader recitations page loads.

## Validation
- `pnpm exec tsc --noEmit`: passed.
- `pnpm run build`: passed.

## Notes
Build still prints existing Next.js warnings about deprecated `eslint` config, deprecated `middleware` convention, edge runtime static generation, and dynamic cookie usage during static generation. These warnings did not fail the build.
