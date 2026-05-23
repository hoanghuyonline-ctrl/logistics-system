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
- Keep Next.js App Router (Next.js 16)
- Keep Prisma ORM (Prisma 7)
- Keep PostgreSQL
- Keep Tailwind CSS structure
- Keep TipTap for rich text editing
- Do not migrate frameworks

## Database Rules
- Do not rename enums without migration plan
- Keep English enums in database
- UI translations only
- New uploads must store **relative paths only** (e.g. `packages/file.jpg`, NOT `https://domain/packages/file.jpg`)
- Existing absolute URLs in DB are preserved and handled by `buildAssetUrl()` backward compatibility

## Workflow
- Small tasks only
- Commit frequently
- Update PROJECT_SNAPSHOT.md after major features
- Push GitHub after stable checkpoints

## Production Deployment (Windows + PM2)
- **Server path:** `D:\BacTrungHai\logistics-system`
- **Runtime:** PM2 running `next start -p 3000 -H 0.0.0.0` via `ecosystem.config.js`
- PM2 `watch` must remain `false` (prevents crash loops)
- `.next/static` and `public` must be copied into `.next/standalone/` after every build
- Always run `npx prisma migrate deploy` when new migrations exist
- Standard deploy sequence:
  ```powershell
  cd /d D:\BacTrungHai\logistics-system
  git pull origin main
  npm install
  npx prisma migrate deploy
  npm run build
  xcopy /E /I /Y .next\static .next\standalone\.next\static
  xcopy /E /I /Y public .next\standalone\public
  pm2 restart logistics-system
  ```

## Webhook / Public Routes
- `/api/telegram/webhook` is a public route (no auth) — registered in `src/proxy.ts` `publicPaths`
- `/api/zalo/webhook` is a public route (no auth) — registered in `src/proxy.ts` `publicPaths`
- `/api/messenger/webhook` is a public route (no auth) — registered in `src/proxy.ts` `publicPaths`
- `/api/uploads` is a public route (no auth) — serves uploaded images from disk at runtime
- `/api/health` is a public route (no auth) — healthcheck endpoint
- Any new external webhook must also be added to `publicPaths` in `src/proxy.ts`

## Image Storage Rules

### Default Storage: Local (`STORAGE_PROVIDER="LOCAL"`)
- **Default provider is `LOCAL`** — files stored directly on server disk at `public/uploads/`
- When `STORAGE_PROVIDER` is unset or set to `"LOCAL"`, images are saved to `public/uploads/` on the physical server
- Upload URLs are returned as `/api/uploads/packages/filename.jpg` (routed through API endpoint, NOT static `/uploads/...`)
- Admin Settings UI provides a dropdown to switch between `LOCAL` / `R2` / `gdrive` / `gcs`

### API Route for Local Uploads (`/api/uploads/[...path]`)
- **Critical:** Next.js Standalone mode does NOT serve files added to `public/` at runtime (only build-time files are served statically)
- All local upload URLs MUST go through the API route `/api/uploads/[...path]` which reads files from disk using Node.js `fs`
- The API route is at `src/app/api/uploads/[...path]/route.ts`
- It returns correct `Content-Type` headers (image/jpeg, image/png, etc.) and has directory traversal prevention
- **NEVER change `LocalStorageProvider` URL prefix back to `/uploads`** — this will cause 404 errors in production

### Cloudflare R2 (`STORAGE_PROVIDER="R2"`)
- Uses `@aws-sdk/client-s3` SDK
- Required config (Admin Settings or `.env`): `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_CUSTOM_DOMAIN`
- Returns URLs via `R2_PUBLIC_CUSTOM_DOMAIN` (e.g. `https://cdn.thue.eu.cc/products/image.jpg`)
- `next.config.ts` includes R2 custom domain in `remotePatterns`

### Google Drive (`STORAGE_PROVIDER="gdrive"`)
- Uses OAuth2 refresh token (personal Gmail account) — NOT Service Account JWT
- Required DB keys: `GDRIVE_CLIENT_ID`, `GDRIVE_CLIENT_SECRET`, `GDRIVE_REFRESH_TOKEN`, `GDRIVE_FOLDER_ID`
- All Drive API calls include `supportsAllDrives: true`

### next.config.ts Restrictions
- `next.config.ts` should remain minimal: `output: "standalone"`, `serverExternalPackages`, `headers`, `allowedDevOrigins`, R2 custom domain in `remotePatterns`
- Google Drive image URLs use `<img>` tags, not `next/image`, so `remotePatterns` is unnecessary for GDrive

## Dynamic Domain Configuration (APP_DOMAIN)
- `APP_DOMAIN` stored in SystemConfig DB table; editable via Admin Settings → "Domain hệ thống" card
- Fallback chain: DB `APP_DOMAIN` → env `APP_DOMAIN` → `NEXTAUTH_URL` → relative paths
- `src/lib/url.ts` provides: `getAppDomain()`, `buildAssetUrl()`, `toRelativePath()`, `extractStorageKey()`, `resetDomainCache()`
- All API responses must use `buildAssetUrl()` to resolve asset URLs dynamically
- **NEVER hardcode domains** in API responses or frontend components

## Product Management Rules
- Product images stored as JSONB array of `{ path, url }` objects in `images` column
- Product variants stored as JSONB `{ groups, rows }` in `variants` column
- Product logistics specs stored as JSONB `{ weight, length, width, height }` in `specs` column
- `imageUrl` field preserved for backward compatibility (auto-set from first gallery image)
- Product upload endpoint: `POST /api/products/upload` (ADMIN-only, JPG/PNG/WebP, max 5MB)
- Product deletion protected by foreign key — cannot delete products with linked SalesRequests

## Admin UI Rules
- Admin sidebar organized into 5 collapsible nav groups (TỔNG QUAN, QUẢN LÝ ĐƠN HÀNG, TÀI CHÍNH & PHÂN TÍCH, HỖ TRỢ KHÁCH HÀNG, CÀI ĐẶT HỆ THỐNG)
- Back to Top floating button present on all layouts (admin, customer, warehouse, accountant)
- Zalo QR support widget at bottom-left on all layouts — do not remove or overlap

## Current Priorities
1. Enterprise product management and sales workflow refinements
2. Vietnamese default locale across all new features
3. Wallet/payment flow integrity
4. Notification delivery (SYSTEM + EMAIL + TELEGRAM + ZALO channels)
5. CI pipeline (build + typecheck must pass)
6. Storage reliability (LOCAL default; R2/GDrive/GCS as alternatives)
7. Production stability on Windows + PM2
