# PROJECT_RULES.md

## Development Philosophy
- Incremental production-safe development only
- No architecture rewrite
- No large refactors
- No UI redesign unless explicitly requested
- Preserve backward compatibility
- No overengineering — keep solutions minimal and focused

## PR Workflow
- 1 task -> 1 PR -> test -> merge -> checkpoint
- Small PRs only — single feature or fix per PR
- Update PROJECT_SNAPSHOT.md after major features
- Commit frequently with clear messages
- Push to GitHub after stable checkpoints

## Token / Quota Optimization
- Avoid full repository scans
- Focus only on task-related files
- Run minimal tests only
- Avoid unnecessary browser E2E tests

## Stack Rules
- Keep Next.js 16 App Router
- Keep Prisma 7 ORM
- Keep PostgreSQL
- Keep Tailwind CSS 4
- Keep NextAuth.js v4
- Keep Vitest for testing
- Do not migrate frameworks or major libraries

## Database Rules
- Do not rename enums without migration plan
- Keep English enums in database (OrderStatus, ShipmentStatus, etc.)
- UI translations only — never change DB enum values for i18n
- Prisma schema changes require careful migration planning

## i18n Rules
- Vietnamese (vi) is the default locale
- Support VI/EN/ZH — additive keys only, no deletions
- Use existing `useI18n()` hook pattern
- Notification messages are Vietnamese-first

## Code Conventions
- TypeScript strict mode
- App Router route groups: `(auth)`, `(customer)`, `(admin)`, `(warehouse)`, `(accountant)`
- Notification delivery is fire-and-forget (never block API responses)
- Use existing `StorageProvider` interface for file storage
- Use existing notification service layer for new channels/triggers

## CI Pipeline
- GitHub Actions: lint (continue-on-error), typecheck, build
- All PRs must pass typecheck and build before merge
- Run `npm run lint` and `npm run typecheck` locally before pushing

## What NOT To Do
- Do not scan the full repository
- Do not run large browser test loops
- Do not rewrite existing architecture
- Do not add new frameworks or heavy dependencies without discussion
- Do not modify tests to make them pass — fix the code instead
- Do not push directly to the main development branch without PR
