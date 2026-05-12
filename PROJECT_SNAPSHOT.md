# Project Snapshot — VN Logistics System

**Date:** 2026-05-12
**Branch:** `main`
**Latest stable commit:** `df6316b`

---

## Completed Features

- **Authentication** — NextAuth.js with credentials provider, role-based sessions
- **Customer Portal** — Dashboard, create order, order list/detail, wallet (deposit/balance/debt), transactions, notifications, profile
- **Admin Panel** — Dashboard with KPIs, user management, order management with status transitions, package management, finance (revenue/profit), fee settings, analytics with time-range charts
- **Warehouse China** — Dashboard, receive goods (weight entry), create packages (multi-order grouping)
- **Warehouse Vietnam** — Dashboard, receive shipments, dispatch & complete delivery
- **Order Cost Calculation** — Automatic: `(price CNY × exchange rate) + service fee + CN shipping + intl shipping (kg × rate) + VN delivery fee`
- **Wallet System** — Deposits, order payment deduction on completion, refund on cancellation, debt tracking
- **Centralized ShipmentStatus Workflow** — 8-state enum with validated transitions, bidirectional mapping to legacy OrderStatus
- **Barcode Rendering** — Code128 barcode generation (PNG/SVG) via bwip-js, print label popup
- **UI/UX Redesign** — Modern SaaS design across all 25+ pages, reusable components, toast notifications, loading/empty states
- **Notification Infrastructure** — Modular service layer for SYSTEM/EMAIL/TELEGRAM/ZALO channels
- **Email Notification Foundation** — SMTP/Nodemailer helper with templates
- **Notification Triggers** — Order created and shipment status changed events connected using fire-and-forget pattern
- **Notification UI** — Bell dropdown with unread badge, latest notifications, mark-as-read action, and VI/EN/ZH translations
- **Telegram Notification Delivery** — Telegram Bot API channel using `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`, integrated with notification service
- **Warehouse Scan Workflow** — Barcode/packageCode scan pages for China and Vietnam warehouses, server-validated status transitions, USB scanner/manual input support, VI/EN/ZH translations
- **Audit Log System** — Centralized audit helper, warehouse scan/order status logging, admin read-only audit log page, VI/EN/ZH translations
- **Package Image Upload** — Warehouse/admin upload, local image storage, package image viewing/deletion, JPG/PNG/WebP validation
- **Zalo OA Notification Foundation** — Basic OA text message delivery channel, env-configured, integrated with notification service
- **Zalo Order Status Notification** (PR #33) — Fire-and-forget Vietnamese Zalo notification on order status change, reuses existing `sendZalo()`, gated by `ZALO_SEND_ENABLED`
- **Zalo Diagnostics & Vietnamese UX** (PR #41) — Structured Zalo send logs (timestamp, orderCode, recipientId, success/failure, failureCategory, errorReason), failure classification into 6 categories (TOKEN_EXPIRED, INVALID_RECIPIENT, PERMISSION_DENIED, NETWORK_ERROR, CONFIG_MISSING, UNKNOWN) with Vietnamese labels, improved admin test UI (clearer config status, last test timestamp), natural Vietnamese notification wording
- **Vietnamese System Notifications** (PR #34) — Customer-facing bell-dropdown notifications converted to Vietnamese-first wording (9 status messages + title + fallback)
- **Vietnamese Notification Templates** (PR #35) — Email/Telegram notification templates converted to Vietnamese-first: 10 STATUS_LABELS, orderCreatedTemplate, shipmentStatusChangedTemplate, sign-off updated to "Công ty TNHH Bắc Trung Hải Logistics"
- **Vietnamese Wallet & Order Notifications** (PR #36) — Wallet deposit notification ("Nạp tiền thành công") and new order admin notification ("Đơn hàng mới") converted to Vietnamese-first wording
- **Full Vietnamese-First Customer Text** (PR #42) — All remaining English customer-facing text converted to natural Vietnamese: notifications page (title, subtitle, empty state, mark-all-read), admin settings (header, fee labels, descriptions, save button, toasts), API error messages, warehouse status logs, seed data notifications/transactions
- **Vietnamese-First Admin/Accountant/Customer UI Text** (PR #43) — Remaining scoped Admin, Accountant, and Customer hardcoded English UI text converted to `useI18n()` with additive VI/EN/ZH keys; direct shared `Pagination` and `StatusBadge` labels localized; CI/typecheck compatibility updated so PR #43 passed GitHub CI
- **CI Pipeline** — GitHub Actions workflow for npm ci, Prisma generate, lint, typecheck, and production build validation on push/pull_request
- **Camera Barcode Scan** — Optional browser camera scan mode on warehouse scan pages, auto-submit through existing scan workflow, duplicate-scan cooldown, VI/EN/ZH translations
- **Production Deployment Foundation** — Dockerfile, Docker Compose with PostgreSQL/nginx, healthcheck endpoint, uploads volume persistence, .env.production.example, DEPLOYMENT.md
- **PM2 Production Setup** (PR #50) — `ecosystem.config.js` for PM2 process management on Windows server; production `next start` instead of `npm run dev`; auto-restart on crash/reboot via `pm2-windows-startup`; structured logging to `logs/`; DEPLOYMENT_PM2.md with full command reference
- **Accountant Dashboard** — Dedicated `(accountant)` route group with role guard, financial KPIs (revenue, profit, debt, deposits, pending payments), recent transactions table, order status summary, `/api/accountant/dashboard` API, VI/EN/ZH translations
- **Accountant Profit API Access** — ACCOUNTANT role added to `/api/analytics/profit` role check, unlocking finance page for accountants
- **Order Detail i18n** — Customer and admin order detail pages fully translated with `useI18n()`, 50 `orderDetail.*` keys added to VI/EN/ZH
- **Storage Abstraction Layer** — `StorageProvider` interface with `LocalStorageProvider`, package image upload/delete routed through abstraction, `STORAGE_PROVIDER` env var for future S3/R2/MinIO swap
- **Vitest Test Infrastructure** — Vitest configured with `@/` path alias, `npm test` / `npm run test:watch` scripts, 5 smoke tests for `LocalStorageProvider` (upload, delete, missing file, nested dirs, URL format)
- **Telegram Chatbot Basic** (PR #47, #48) — `POST /api/telegram/webhook` for Telegram Bot API webhook; `/start` welcome message (including `/start@bot` and `/start payload` variants); order code lookup with Vietnamese status labels; graceful error handling; public route bypass in proxy.ts; unrecognized bot commands skipped; production webhook verified on `https://thue.eu.cc`
- **Telegram Help Command** (PR #56) — `/help` and `/help@bactrunghai_bot` return Vietnamese usage instructions, command list, and order code lookup example
- **Telegram Status Command** (PR #58) — `/status` and `/status@bactrunghai_bot` return Vietnamese guidance for checking order status by sending an order code
- **Telegram Unknown Command Guidance** (PR #60) — Unknown Telegram slash commands now return Vietnamese guidance with supported commands (`/start`, `/help`, `/status`) and order lookup instructions
- **Telegram Invalid Text Guidance** (PR #62) — Normal text that is not a valid order code now returns Vietnamese guidance with correct order code example and `/help` suggestion
- **Telegram Order Lookup Formatting** (PR #64) — Successful Telegram order lookup replies now use cleaner Vietnamese mobile-friendly formatting with order code, status, weight/cost when available, and Bắc Trung Hải Logistics sign-off
- **Telegram Order Not Found Guidance** (PR #66) — Valid-looking but unmatched order codes now return clearer Vietnamese guidance with order code example and support instruction
- **Telegram Start Menu UX** (PR #68) — `/start` now shows a clearer Vietnamese quick command menu with order lookup example and available commands
- **Telegram Command Tests** (PR #70) — Minimal tests added for Telegram command parsing/handling covering `/start`, `/help`, `/status`, bot username suffix variants, unknown slash commands, and invalid normal text
- **Telegram Order Lookup Reply Tests** (PR #72) — Minimal tests added for successful Telegram order lookup formatting, not-found guidance, and graceful handling of missing optional order fields
- **SMTP Config Diagnostics** (PR #74) — Admin settings now show SMTP production readiness for SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM without exposing secret values
- **Public Landing Page Redesign** — Complete 5-PR series (PRs #22–#26):
  - **Brand Identity Update** (PR #22) — Company name, logo, brand colors (navy #1B2A6B, royal blue #2B4CB8, sky #4A90D9), contact info, SEO metadata
  - **Component Extraction** (PR #23) — Monolithic `page.tsx` (235 lines) refactored into 7 reusable components under `src/components/landing/` with barrel export
  - **Hero + Navbar Visual Upgrade** (PR #24) — Mobile hamburger menu, scroll-aware sticky navbar, hero background blobs, staggered fade-up CSS animations, trust indicators
  - **Services + Locations Section** (PR #25) — SVG icons replacing emojis in services, new `LandingLocations` component (4 offices/warehouses), stats bar polish, footer i18n fix
  - **Footer Legal/Bank + Final Polish** (PR #26) — 4-column footer with director (Phạm Văn Tuấn), bank info (Vietinbank CN Lạng Sơn / 110003049134), HowItWorks SVG icons, CTA hover/animation polish, hero i18n fix
  - **i18n** — ~60 new landing-specific keys across VI/EN/ZH (additive only, zero deletions)
  - **Architecture** — 8 landing components: LandingNavbar, LandingHero, LandingStats, LandingServices, LandingHowItWorks, LandingLocations, LandingCTA, LandingFooter
  - **No new dependencies** — CSS-only animations, inline SVG icons, existing i18n hook pattern
- **Facebook Messenger Webhook Foundation** (PR #81) — Public `/api/messenger/webhook` route with Meta verification challenge support (`hub.mode`/`hub.verify_token`/`hub.challenge`), incoming event logging (text messages, postbacks, non-text), public route registration in `proxy.ts`, env vars `MESSENGER_VERIFY_TOKEN` / `MESSENGER_PAGE_ACCESS_TOKEN`
- **Messenger Basic Welcome Reply** (PR #84) — Incoming Messenger text messages receive a Vietnamese welcome/order lookup guidance reply, with graceful skip when `MESSENGER_PAGE_ACCESS_TOKEN` is missing
- **Messenger Order Lookup MVP** (PR #85) — Messenger detects valid-looking order codes, looks up safe order fields, and replies in Vietnamese with status, optional weight/cost, or not-found guidance

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Auth | NextAuth.js |
| Barcode | bwip-js |
| Testing | Vitest |
| Infra | Docker Compose, PM2 |

## Important API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/[...nextauth]` | * | Authentication |
| `/api/orders` | GET/POST | List/create orders |
| `/api/orders/[id]` | GET/PATCH | Order detail/update |
| `/api/orders/[id]/status` | PATCH | Status transitions (centralized validator) |
| `/api/packages` | GET/POST | List/create packages |
| `/api/packages/[id]/barcode` | GET | Render Code128 barcode (PNG/SVG) |
| `/api/wallet` | GET | Customer wallet |
| `/api/wallet/deposit` | POST | Deposit funds |
| `/api/settings` | GET/PUT | System fee configuration |
| `/api/warehouse/china/receive` | POST | Receive goods at CN warehouse |
| `/api/warehouse/vietnam/receive` | POST | Receive goods at VN warehouse |
| `/api/warehouse/vietnam/delivery/[id]` | PATCH | Dispatch/complete delivery |
| `/api/users` | GET/POST | User management |
| `/api/warehouse/scan` | POST | Barcode lookup + package status update |
| `/api/packages/[id]/images` | GET/POST/DELETE | Package image upload/list/delete (validated) |
| `/api/admin/audit-log` | GET | Paginated audit log (OrderStatusLog) |
| `/api/analytics` | GET | Dashboard analytics |
| `/api/accountant/dashboard` | GET | Accountant financial KPIs and recent transactions |
| `/api/telegram/webhook` | POST | Telegram chatbot webhook (public, no auth) |

## Important Prisma Models

| Model | Key Fields |
|-------|-----------|
| **User** | id, email, password, role (CUSTOMER/ADMIN/WAREHOUSE_CN/WAREHOUSE_VN/ACCOUNTANT) |
| **Order** | orderCode, status (OrderStatus enum), unitPriceCNY, totalCostVND, weightKg, packageId |
| **Package** | packageCode, barcode, totalWeightKg, dimensions, status (PackageStatus) |
| **Wallet** | userId, balance, debt |
| **Transaction** | userId, type, amount, orderId |
| **OrderStatusLog** | orderId, fromStatus, toStatus, changedBy |
| **SystemConfig** | key/value pairs (exchange_rate, service_fee_percent, shipping rates) |
| **Notification** | userId, title, message, isRead |

**Enums:** OrderStatus (10 values), ShipmentStatus (8 values), PackageStatus, Role, TransactionType

## Remaining Major Tasks

- Public landing page visual testing across all 3 locales (VI/EN/ZH)
- Dashboard redesign (not started — landing page complete)
- ~~Production Telegram bot/chat configuration~~ ✓ webhook registered, bot `@bactrunghai_bot` verified on `thue.eu.cc`
- Production SMTP configuration
- Accountant finance/transactions pages (dashboard done, finance & analytics use admin routes)
- Cloud storage provider (S3/R2/MinIO) — abstraction layer ready, needs provider implementation
- API route smoke tests (orders, warehouse scan, status transitions)
- Comprehensive E2E test suite (Playwright)

## Known Risks / Issues

1. **ShipmentStatus ↔ OrderStatus mapping** — PENDING/PURCHASED/SELLER_SHIPPED collapse into single ShipmentStatus.PENDING. Legacy fallback in `/api/orders/[id]/status` preserves finer-grained transitions; removing it would break those flows.
2. **ShipmentStatus enum in Postgres but not as a column** — validation-only layer; adding as Order column later requires data migration.
3. **bwip-js types** — local interface used because package types don't resolve under `moduleResolution: "bundler"`. Low risk.
4. **CI lint step uses continue-on-error** — pre-existing lint warnings are not blocking; to be resolved incrementally.
5. **Notification delivery is fire-and-forget** — failed sends are logged but do not block APIs.
6. **Zalo OA access token is short-lived** — needs OAuth refresh flow for production use.
7. **Telegram delivery requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in production** — failures are logged and do not block APIs.
8. **SMTP_* environment variables required in production** — `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
9. **Camera scan requires HTTPS in production** — `getUserMedia` API is restricted to secure contexts by browsers.
10. **html5-qrcode is in maintenance mode** — library works as-is (1M weekly downloads) but author is seeking new owners; no new bug fixes expected.
11. **Camera scanning requires real-device testing** — cannot be tested without a physical camera; 3-second duplicate-scan cooldown may need tuning.
12. **Package status transitions are server-validated** — should remain aligned with package/shipment workflow.
13. **Audit log uses structured console logging plus existing OrderStatusLog persistence** — full entity-wide persistent audit table is not implemented yet.
14. **Package images stored locally** — stored under `public/uploads/packages/` via `LocalStorageProvider`; swap to S3/R2/MinIO by implementing `StorageProvider` interface and setting `STORAGE_PROVIDER` env var.
15. **Uploaded images publicly accessible** — anyone with the URL can view them via direct path; acceptable for MVP simplicity.
16. **Zalo delivery uses one global fallback recipient ID** — per-user Zalo delivery needs schema changes (e.g., `User.zaloChatId`).
17. **Zalo delivery cannot be tested without real OA credentials** — requires valid `ZALO_OA_ACCESS_TOKEN` and `ZALO_RECIPIENT_ID`.
18. **Smoke tests cover storage only** — 5 Vitest tests for `LocalStorageProvider`; API route and E2E tests not yet implemented.
19. **Full Docker Compose stack not yet tested end-to-end** — only Docker build verified; needs real server validation.
20. **HTTPS/TLS is not configured yet** — documented in DEPLOYMENT.md as a separate step; required for camera barcode scanning.
21. **Production requires .env.production** — docker-compose will not start without this file.
22. **DB/app ports not exposed directly** — nginx is the public entrypoint on port 80; direct DB access requires adding port mapping.
