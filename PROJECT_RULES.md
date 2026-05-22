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
- `/api/uploads` is a public route (no auth) — serves uploaded images from disk at runtime
- Any new external webhook must also be added to `publicPaths` in `src/proxy.ts`

## Image Storage Rules

### Default Storage: Local (`STORAGE_PROVIDER="local"`)
- **Default provider is `local`** — files stored directly on server disk at `public/uploads/`
- When `STORAGE_PROVIDER` is unset or set to `"local"`, images are saved to `public/uploads/packages/` on the physical server
- Upload URLs are returned as `/api/uploads/packages/filename.jpg` (routed through API endpoint, NOT static `/uploads/...`)
- Admin Settings UI provides a dropdown to switch between `local` / `gdrive` / `gcs`

### API Route for Local Uploads (`/api/uploads/[...path]`)
- **Critical:** Next.js Standalone mode does NOT serve files added to `public/` at runtime (only build-time files are served statically)
- All local upload URLs MUST go through the API route `/api/uploads/[...path]` which reads files from disk using Node.js `fs`
- The API route is at `src/app/api/uploads/[...path]/route.ts`
- It returns correct `Content-Type` headers (image/jpeg, image/png, etc.) and has directory traversal prevention
- **NEVER change `LocalStorageProvider` URL prefix back to `/uploads`** — this will cause 404 errors in production

### Google Drive (`STORAGE_PROVIDER="gdrive"`)
- Uses OAuth2 refresh token (personal Gmail account) — NOT Service Account JWT
- Required DB keys: `GDRIVE_CLIENT_ID`, `GDRIVE_CLIENT_SECRET`, `GDRIVE_REFRESH_TOKEN`, `GDRIVE_FOLDER_ID`
- All Drive API calls include `supportsAllDrives: true`

### next.config.ts Restrictions
- **DO NOT add `images.remotePatterns` for Google Drive domains** unless explicitly requested
- `next.config.ts` should remain minimal: `output: "standalone"`, `serverExternalPackages`, `headers`, `allowedDevOrigins`
- Google Drive image URLs use `<img>` tags, not `next/image`, so `remotePatterns` is unnecessary

## Current Priorities
1. Sales MVP refinements and production stability
2. Vietnamese default locale across all new features
3. Wallet/payment flow integrity
4. Notification delivery (SYSTEM + TELEGRAM channels)
5. CI pipeline (build + typecheck must pass)
6. Local storage reliability (default provider for all new deployments)
