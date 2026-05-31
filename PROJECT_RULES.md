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
- Keep Ant Design (antd) for admin sales management tables/modals
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

## Multimodal Sourcing & Ordering Rules
- **Route:** Located at `/source-search` (`src/app/(customer)/source-search/page.tsx`).
- **Translation:** Uses standard mock platform data matched via `DICTIONARY` or simulates real-time Google translation into Chinese commercial terms.
- **Workflow Persistence:**
  - *Direct Purchase (Order):* Sets `orderType` to `ECOMMERCE` on `POST /api/orders` to store it as a direct order.
  - *Consignment / Entrust:* Sets `orderType` to `CONSIGNMENT` on `POST /api/orders` and assigns a temporary `KGBTH-` tracking code.
- **H5 Mobile WebView Sandbox & Real-Time Product Snatcher:**
  - Intercepting the `Taobao Sourcing`, `1688 Sourcing`, and `Tmall Sourcing` buttons opens an in-app interactive **H5 Mobile WebView Simulator** device frame.
  - Enables users to naturally browse and search using their clean mobile browser IP and credentials to avoid server IP bans.
  - Taps into a background H5 Refresher cron-job simulating real mobile handshakes to auto-renew Alibaba H5 tokens (`_m_h5_tk` / `_m_h5_tk_enc`) in-cache 24/7 without needing user login.
  - The clean-room CI-tested extraction engine runs silently inside the device simulator, automatically extracting:
    1. *Taobao Mobile H5:* Scope `https://m.taobao.com/` (or `h5api.m.taobao.com`), capturing URL `id=...` and `.price` / `.price-num`.
    2. *1688 Mobile H5:* Scope `https://m.1688.com/`, capturing URL `/offer/[id].html` and sỉ/lẻ prices.
    3. *Tmall Mobile H5:* Scope `https://detail.m.tmall.com/`, matching Taobao structure.
  - The WebView results are displayed in a clean **2-column grid layout** showing song song parallel price tags:
    * Dòng 1: Raw currency prices of the platform (¥).
    * Dòng 2: Dynamic calculated price in Vietnam Dong under the fixed exchange rate of **3980 VND/CNY** (đ).
  - The floating "Lựa chọn sản phẩm" action overlay automatically applies the fixed exchange rate of **3980 VND/CNY** when transferring parsed product details to the procurement console.
- **Styling:** Uses premium responsive Ant Design elements wrapped in React `Suspense` with explicit loading indicators.
- **Commit History:** Officially deployed under stable commit `c535958c274b618b083eb6fd638a95e017730340`.

## AI-Powered Support Knowledge Rules
- **Logic File:** Located at `src/lib/support-knowledge.ts`.
- **Semantic Intent (Vector Search ngầm):** Uses an advanced semantic classifier mapping queries to specific key logistical intents (Lost/Damaged Goods, Delay/Customs congestion, High Fee/Customs invoicing) and boosts correlation scores.
- **Empathetic Crisis Auto-Replies:**
  - Dynamic prompts intercept user queries in operational crisis situations (loss of goods, customs delays, pricing/fees).
  - Responses prioritize customer satisfaction above all, remain highly professional, and end with an optimized call to action to collect the user's **SỐ ĐIỆN THOẠI (Phone Number)** for immediate hotline outreach.
- **Lead Capture Funnel Interception:**
  - Standard phone patterns are parsed from customer messages. If a phone/Zalo number is detected, it is immediately routed through `capturePhoneLead` in `src/lib/lead-intake.ts` to automatically populate the CRM Lead database and record a `CONTACTED` lead activity.
  - Generates instant auto-responses with high-converting brand gifts (10% discount, priority lane, source download catalog) and ensures zero data loss.
- **Database Safety:** Processes all calculations in-memory, avoiding database performance bottlenecks.
- **Test Compatibility:** Maintains 100% backward compatibility with all 38 existing Vitest unit tests.

## Production Deployment (Windows + PM2)
- **Server path:** `D:\BacTrungHai\logistics-system`
- **Runtime:** PM2 running `next start -p 3000 -H 0.0.0.0` via `ecosystem.config.js`
- PM2 `watch` must remain `false` (prevents crash loops)
- `.next/static`, `public`, and `prisma` must be copied into `.next/standalone/` after every build (CSS/images break without this)
- Always run `npx prisma migrate deploy` when new migrations exist
- **Docker is NOT used in production** — Docker Compose is optional for local dev PostgreSQL only
- **MANDATORY DAILY WORK RULES & STANDALONE PM2 SAFE DEPLOY SEQUENCE:**
  - Before building, you must run `npm.cmd install` (or `npm install`) to ensure all clean dependencies are fetched and cache is clear.
  - To prevent locked/trapped local ports under Windows environment, you must explicitly run `taskkill /f /im node.exe` to free up port 3000 before executing `pm2 reload` or `pm2 restart`.
  - Under no circumstances is any AI agent permitted to add, skip, or remove steps from this deploy sequence.
- Standard deploy sequence:
  ```powershell
  cd /d D:\BacTrungHai\logistics-system
  git pull origin main
  call npm.cmd install
  call npx.cmd prisma migrate deploy
  call npx.cmd tsx scripts/replace-legacy-domain.ts
  call npm.cmd run build
  xcopy /E /I /Y .next\static .next\standalone\.next\static
  xcopy /E /I /Y public .next\standalone\public
  xcopy /E /I /Y prisma .next\standalone\prisma
  taskkill /f /im node.exe
  pm2 restart logistics-system || pm2 start ecosystem.config.js
  ```

## Webhook / Public Routes
All public routes are registered in `src/proxy.ts` `publicPaths`:
- `/` `/login` `/register` `/shop` `/tracking` — public pages
- `/api/auth` — NextAuth authentication
- `/api/health` — healthcheck endpoint (no auth)
- `/api/public/products` — public product catalog
- `/api/telegram/webhook` — Telegram chatbot (no auth)
- `/api/messenger/webhook` — Facebook Messenger chatbot (no auth)
- `/api/zalo/webhook` — Zalo OA chatbot (no auth)
- `/api/tracking` — public order tracking lookup (no auth)
- `/api/webhooks/bank-transfer` — bank transfer webhook (no auth)
- `/api/leads/capture` — landing page lead capture (no auth)
- `/api/uploads` — serves uploaded images from disk at runtime (no auth)
- `/api/public/quotation` — public quotation request submission (no auth)
- `/quotation` — public quotation form page (no auth)
- `/knowledge` — public knowledge base articles (no auth)
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
- Returns URLs via `R2_PUBLIC_CUSTOM_DOMAIN` (e.g. `https://cdn.bactrunghai.vn/products/image.jpg`)
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
- Product variants stored as JSONB `{ groups, rows }` in `variants` column; dynamic based on category
- Product logistics specs stored as JSONB `{ weight, length, width, height }` in `specs` column; shown only for electronics categories
- `imageUrl` field preserved for backward compatibility (auto-set from first gallery image)
- Product upload endpoint: `POST /api/products/upload` (ADMIN-only, JPG/PNG/WebP, max 5MB)
- Product deletion protected by foreign key — cannot delete products with linked SalesRequests

## Sales & Payment Rules
- **Payment methods:** WALLET (deduct from balance, allow debt) and COD (cash on delivery with address confirmation)
- COD requires shipping address confirmation before payment — `shippingName`, `shippingPhone`, `shippingAddress` on SalesRequest
- Wallet payment blocked when balance is insufficient (no debt creation from wallet payment)
- Paid SalesRequest cancellation triggers automatic wallet refund (REFUND transaction)
- SalesRequest → PROCESSING auto-creates a procurement Order linked via `orderId`
- Admin manual wallet adjustments use `MANUAL_ADD`/`MANUAL_DEDUCT` transaction types
- Notification triggers use `await Promise.allSettled()` — all channels complete before API response (fixes PM2/Windows early termination)

## Admin UI Rules
- Admin sidebar organized into 5 collapsible nav groups (TỔNG QUAN, QUẢN LÝ ĐƠN HÀNG, TÀI CHÍNH & PHÂN TÍCH, HỖ TRỢ KHÁCH HÀNG, CÀI ĐẶT HỆ THỐNG)
- Back to Top floating button present on all layouts (admin, customer, warehouse, accountant)
- Zalo QR support widget consolidated into right-side floating CTA group (not standalone bottom-left)
- Mobile bottom navigation bar includes Shop button across all authenticated pages

## Public Pages
- `/` — Landing page (light SaaS footer, tracking timeline, SVG icons, micro-interactions)
- `/shop` — Public product browsing (accessible without login); "Mua ngay" triggers login redirect with cart retention
- `/shop/[id]` — Product detail page with gallery, variants, pricing
- `/tracking` — Public order tracking lookup by order code
- `/login` `/register` — Authentication pages with optional Google OAuth
- `/quotation` — Public quotation request form (no login required, lead capture)
- `/knowledge` — Public knowledge base / marketing articles (SEO-friendly slugs)

## Order Type Rules
- Order model supports 3 types via `OrderType` enum: ECOMMERCE, ENTRUST, CONSIGNMENT
- Type-specific fields are optional (`?`) to prevent data corruption across types
- Enhanced ENTRUST fields: containerType (FCL/LCL), serviceProcess (JSONB array), dimensions (L×W×H), cargoValue (USD/CNY with VND conversion), waybill/documents/truck info
- Backend POST and PUT validation dynamically checks required fields based on orderType
- Existing orders default to ECOMMERCE (backward compatible)

## Service Request Module Rules
- Each service module (Customs, Transport, Quotation, Knowledge) has its own Prisma model, enums, API routes, and pages
- Service request codes use prefix format: `HQ{YYMMDD}-{random}` (customs), `VT{YYMMDD}-{random}` (transport), `BG{YYMMDD}-{random}` (quotation)
- Quotation requests are **public** (no auth required) — used for lead generation
- Knowledge articles use TipTap rich text editor (StarterKit extensions only: Bold, Italic, Headings, Lists, Blockquote)
- Knowledge article slugs auto-generated from Vietnamese titles for SEO
- Each service module follows its own status workflow (not shared with Order/Shipment status enums)

## Biometric Authentication (WebAuthn / Passkey) Rules
- **Libraries used:** `@simplewebauthn/server` for backend verification, `@simplewebauthn/browser` for client registration/auth.
- **Data model:** Authenticator credentials are saved in the `Credential` table linked to `User`.
- **Management:** Users can register multiple fingerprints/passkeys via `/profile` (customer) or `/admin/settings` (admin).
- **Trigger:** Authentication must be manual and opt-in (triggered by clicking "Đăng nhập bằng vân tay"), never automatically invoked on page load to prevent interface locks.
- **Failures:** Failures must be caught with a simple `try-catch` showing a local message, and never lock the login page.

## Multi-Currency & Border Logistics Rules
- **Multi-Currency:** `currency` enum (`VND`, `CNY`) and `exchangeRate` must be recorded on each relevant transaction or order.
- **Border Logistics Milestones:** Shipments progress through 5 key corridor nodes: `AT_GUANGZHOU_WAREHOUSE`, `AT_NANNING_TRANSIT`, `AT_PINGXIANG_BORDER`, `CUSTOMS_CLEARED_AT`, and `AT_VIETNAM_DISTRIBUTION`.
- **Auditability:** Any status shift or pricing adjustment must create an append-only entry in `OrderTimelineLog` and `SystemAuditLog` to prevent ledger tampering.
- **Expense Leak Protection:** If total operating expenses exceed 70% of pure service revenue, dashboard health indicators must trigger warning states.

## Current Priorities
1. Enterprise product management and sales workflow refinements
2. Vietnamese default locale across all new features
3. Wallet/payment flow integrity (COD + wallet + refunds)
4. Notification delivery (SYSTEM + EMAIL + TELEGRAM + ZALO channels) — `await Promise.allSettled` pattern
5. CI pipeline (build + typecheck must pass)
6. Storage reliability (LOCAL default; R2/GDrive/GCS as alternatives)
7. Production stability on Windows + PM2
8. Biometric WebAuthn stable operations and multi-fingerprint enrollment
9. Border corridor logistics real-time dashboard analytics and cost containment
10. Remaining roadmap: International Trade Services, Documents Menu
