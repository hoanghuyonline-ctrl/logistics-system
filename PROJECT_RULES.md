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
- Any new external webhook must also be added to `publicPaths` in `src/proxy.ts`

## Current Priorities
1. Vietnamese default locale
2. Scan workflow
3. Audit log
4. Notification delivery
5. CI pipeline
