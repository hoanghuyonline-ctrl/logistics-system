# PROJECT_RULES.md

## Development Philosophy
- Incremental production-safe development only
- No architecture rewrite
- No large refactors
- No UI redesign unless explicitly requested
- Preserve backward compatibility

## Token / Quota Optimization
- Avoid full repository scans
- Focus only on task-related files
- Run minimal tests only
- Avoid unnecessary browser E2E tests

## Stack Rules
- Keep Next.js App Router
- Keep Prisma ORM
- Keep PostgreSQL
- Keep Tailwind structure
- Do not migrate frameworks

## Database Rules
- Do not rename enums without migration plan
- Keep English enums in database
- UI translations only

## Workflow
- Small tasks only
- Commit frequently
- Update PROJECT_SNAPSHOT.md after major features
- Push GitHub after stable checkpoints

## Webhook / Public Routes
- `/api/telegram/webhook` is a public route (no auth) — registered in `src/proxy.ts` `publicPaths`
- `/api/zalo/webhook` is a public route (no auth) — registered in `src/proxy.ts` `publicPaths`
- `/api/messenger/webhook` is a public route (no auth) — registered in `src/proxy.ts` `publicPaths`
- `/api/health` is a public route (no auth) — used for healthchecks
- Any new external webhook must also be added to `publicPaths` in `src/proxy.ts`

## Production Deployment Rules
- Windows Server + PM2 + `next start -p 3000 -H 0.0.0.0`
- PM2 `watch` must remain `false` — enabling it causes crash loops from file changes
- After every `npm run build`, must copy `.next/static` and `public` into `.next/standalone/` (CSS/images break without this)
- No direct push to main — all changes via PR
- Always run `npm run build` locally to verify before creating PR

## Current Priorities (updated 2026-05-16)
1. ~~Vietnamese default locale~~ ✓ complete
2. ~~Scan workflow~~ ✓ complete
3. ~~Audit log~~ ✓ complete
4. ~~Notification delivery~~ ✓ complete (Zalo, Telegram, Messenger, Email, System)
5. ~~CI pipeline~~ ✓ complete
6. **Fix CUSTOMER /dashboard production error** — unresolved, see PROJECT_SNAPSHOT.md Unresolved Issues
7. Production SMTP configuration
8. Cloud storage provider (S3/R2/MinIO)
9. API route smoke tests
10. E2E test suite (Playwright)
