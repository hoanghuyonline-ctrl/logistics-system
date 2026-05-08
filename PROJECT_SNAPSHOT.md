# Project Snapshot — Nam Trung Hai Logistics

**Date:** 2026-05-08
**Branch:** `devin/1777960233-logistics-system-implementation`
**Latest stable commit:** `61b04b7` (PR #37 merged)
**Previous checkpoint:** `c46bf2c` (PR #36 merged)

---

## Merged PR History

| PR | Description |
|----|-------------|
| #1–#8 | Core system: auth, customer portal, admin panel, warehouses, wallet, barcode, UI/UX, notifications infra, triggers, Telegram, warehouse scan, audit log |
| #9 | Package image upload (local storage, validation, admin detail page) |
| #10 | Zalo OA text message notification channel |
| #11 | GitHub Actions CI pipeline (lint, typecheck, build) |
| #12 | Camera barcode scan (browser camera, duplicate-scan cooldown) |
| #13 | Production deployment foundation (Dockerfile, Docker Compose, nginx, healthcheck) |
| #14 | Accountant dashboard (KPIs, role guard, VI/EN/ZH i18n) |
| #16 | Accountant profit API access |
| #17 | Order detail i18n (VI/EN/ZH) |
| #18 | Storage abstraction layer (StorageProvider interface) |
| #19 | Vitest test infrastructure (5 smoke tests for LocalStorageProvider) |
| #20 | Snapshot docs update |
| #21 | Windows 10 + Docker Desktop deployment guide |
| #22 | Brand identity update — Nam Trung Hai Logistics |
| #23 | Landing page component extraction (7 components) |
| #24 | Hero + navbar visual upgrade (mobile menu, scroll shadow, animations) |
| #25 | Services SVG icons, locations section, stats polish, footer i18n |
| #26 | Footer legal/bank, HowItWorks SVG icons, CTA polish |
| #28 | Fix: exclude static assets from auth middleware |
| #29 | Fix: define ShipmentStatus enum locally |
| #30 | Fix: break @prisma/client circular dependency |
| #31 | Admin-only "Send Test Zalo Notification" button |
| #34 | Vietnamese system notification messages |
| #35 | Vietnamese notification templates (email/Telegram) |
| #36 | Vietnamese wallet deposit + new order admin notifications |
| #37 | Vietnamese transaction descriptions |

**Unmerged branches (not in current codebase):**
- `devin/1778259117-notification-diagnostics` (PR #32 — notification diagnostics panel)
- `devin/1778261104-zalo-order-status-notify` (PR #33 — Zalo notification on order status change)

---

## Completed Features

### Core
- **Authentication** — NextAuth.js credentials provider, role-based sessions (CUSTOMER, ADMIN, WAREHOUSE_CN, WAREHOUSE_VN, ACCOUNTANT)
- **Customer Portal** — Dashboard, create order, order list/detail, wallet (deposit/balance/debt), transactions, notifications, profile
- **Admin Panel** — Dashboard with KPIs, user management, order management with status transitions, package management, finance (revenue/profit), fee settings, analytics with time-range charts, audit log
- **Warehouse China** — Dashboard, receive goods (weight entry), create packages (multi-order grouping), barcode scan
- **Warehouse Vietnam** — Dashboard, receive shipments, dispatch & complete delivery, barcode scan
- **Accountant Dashboard** — Dedicated route group with role guard, financial KPIs, recent transactions, order status summary

### Business Logic
- **Order Cost Calculation** — `(price CNY x exchange rate) + service fee + CN shipping + intl shipping (kg x rate) + VN delivery fee`
- **Wallet System** — Deposits, order payment deduction on completion, refund on cancellation, debt tracking
- **Centralized ShipmentStatus Workflow** — 8-state enum with validated transitions, bidirectional mapping to legacy OrderStatus

### Infrastructure
- **Notification System** — Modular service layer for SYSTEM/EMAIL/TELEGRAM/ZALO channels, fire-and-forget delivery
- **Zalo OA Foundation** — Basic text message delivery channel, env-configured (`ZALO_SEND_ENABLED` gate), test button on admin settings
- **Telegram Channel** — Bot API delivery using `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`
- **Email Foundation** — SMTP/Nodemailer helper with templates
- **Barcode Rendering** — Code128 barcode generation (PNG/SVG) via bwip-js, print label popup
- **Camera Barcode Scan** — Browser camera scan mode on warehouse pages, duplicate-scan cooldown
- **Package Image Upload** — Local storage, JPG/PNG/WebP validation, admin viewing/deletion
- **Storage Abstraction** — `StorageProvider` interface with `LocalStorageProvider`, ready for S3/R2/MinIO swap
- **Audit Log** — Centralized audit helper, warehouse scan/order status logging, admin read-only page
- **CI Pipeline** — GitHub Actions: npm ci, Prisma generate, lint (continue-on-error), typecheck, build
- **Production Deployment Foundation** — Dockerfile, Docker Compose (PostgreSQL + nginx), healthcheck endpoint, uploads volume persistence
- **Vitest Test Setup** — 5 smoke tests for LocalStorageProvider

### i18n & Vietnamese-First
- **Default locale: Vietnamese (vi)** with middleware + cookie sync
- **Landing page** — ~60 landing-specific keys across VI/EN/ZH
- **Order detail pages** — 50+ `orderDetail.*` keys (VI/EN/ZH)
- **System notifications** — Vietnamese-first bell-dropdown messages (9 status messages + title + fallback)
- **Notification templates** — Email/Telegram templates in Vietnamese (10 STATUS_LABELS, orderCreated, shipmentStatusChanged)
- **Wallet/order notifications** — "Nap tien thanh cong" / "Don hang moi" in Vietnamese
- **Transaction descriptions** — Vietnamese-first wording

### Landing Page (PRs #22–#26)
- Brand identity: Nam Trung Hai Logistics, navy #1B2A6B / royal blue #2B4CB8 / sky #4A90D9
- 8 components: LandingNavbar, LandingHero, LandingStats, LandingServices, LandingHowItWorks, LandingLocations, LandingCTA, LandingFooter
- Mobile-responsive navbar, hero animations, SVG icons, 4 office/warehouse locations
- Footer: director (Pham Van Tuan), bank info (Vietinbank CN Lang Son / 110003049134)
- CSS-only animations, inline SVGs, no new dependencies

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS 4 |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Auth | NextAuth.js v4 |
| Barcode | bwip-js |
| Camera Scan | html5-qrcode |
| Testing | Vitest |
| CI | GitHub Actions |
| Infra | Docker Compose + nginx |

---

## Prisma Models

| Model | Key Fields |
|-------|-----------|
| **User** | id, email, password, role (5 roles), telegramChatId |
| **Order** | orderCode, status (OrderStatus — 10 values), unitPriceCNY, totalCostVND, weightKg, packageId |
| **Package** | packageCode, barcode, totalWeightKg, dimensions, status (PackageStatus — 4 values) |
| **PackageImage** | packageId, imageUrl |
| **Wallet** | userId, balance, debt |
| **Transaction** | userId, type (4 types), amount, balanceBefore, balanceAfter, orderId, description |
| **OrderStatusLog** | orderId, fromStatus, toStatus, changedBy, note |
| **OrderNote** | orderId, userId, content |
| **SystemConfig** | key/value pairs (exchange_rate, service_fee_percent, shipping rates) |
| **Notification** | userId, title, message, type (SYSTEM/EMAIL/TELEGRAM/ZALO), isRead, orderId |

**Enums:** OrderStatus (10), ShipmentStatus (8), PackageStatus (4), Role (5), TransactionType (4), NotificationType (4)

---

## Key API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/[...nextauth]` | * | Authentication |
| `/api/orders` | GET/POST | List/create orders |
| `/api/orders/[id]` | GET/PATCH | Order detail/update |
| `/api/orders/[id]/status` | PATCH | Status transitions |
| `/api/packages` | GET/POST | List/create packages |
| `/api/packages/[id]/barcode` | GET | Render Code128 barcode |
| `/api/packages/[id]/images` | GET/POST/DELETE | Package images |
| `/api/wallet` | GET | Customer wallet |
| `/api/wallet/deposit` | POST | Deposit funds |
| `/api/settings` | GET/PUT | System fee config |
| `/api/warehouse/scan` | POST | Barcode lookup + status update |
| `/api/warehouse/china/receive` | POST | Receive goods (CN) |
| `/api/warehouse/vietnam/receive` | POST | Receive goods (VN) |
| `/api/warehouse/vietnam/delivery/[id]` | PATCH | Dispatch/complete delivery |
| `/api/users` | GET/POST | User management |
| `/api/admin/audit-log` | GET | Paginated audit log |
| `/api/admin/test-zalo` | POST | Send test Zalo message |
| `/api/accountant/dashboard` | GET | Accountant KPIs |
| `/api/analytics/*` | GET | Dashboard/revenue/profit/orders analytics |
| `/api/health` | GET | Healthcheck |

---

## App Route Groups

| Group | Layout | Pages |
|-------|--------|-------|
| `(auth)` | — | login, register |
| `(customer)` | Customer sidebar | dashboard, orders (list/new/detail), wallet, transactions, notifications, profile |
| `(admin)` | Admin sidebar | dashboard, orders (list/detail), packages (list/detail), users, finance, analytics, settings, audit-log |
| `(warehouse)` | Warehouse sidebar | china (dashboard/receive/packages/scan), vietnam (dashboard/receive/delivery/scan) |
| `(accountant)` | Accountant layout | dashboard |

---

## File Structure (Key Directories)

```
src/
  app/              # Next.js App Router pages + API routes
  components/
    landing/        # 8 landing page components
    layouts/        # Sidebar, Providers
    notifications/  # NotificationDropdown
    ui/             # Toast
    warehouse/      # CameraScanner, ScanPage
  lib/
    auth.ts         # NextAuth helpers
    prisma.ts       # Prisma client
    cost-calculator.ts
    shipment-status.ts  # ShipmentStatus enum + transitions
    storage.ts      # StorageProvider abstraction
    audit.ts        # Audit log helper
    utils.ts
    i18n/           # VI/EN/ZH translations
    notifications/
      channels/     # email.ts, telegram.ts, zalo.ts
      service.ts    # Notification service
      templates.ts  # Vietnamese notification templates
      triggers.ts   # onOrderCreated, onShipmentStatusChanged
      types.ts
prisma/
  schema.prisma     # 10 models, 6 enums
  seed.ts
tests/
  smoke/            # Vitest smoke tests (LocalStorageProvider)
```

---

## Known Risks / Technical Debt

1. **ShipmentStatus <-> OrderStatus mapping** — PENDING/PURCHASED/SELLER_SHIPPED collapse into single ShipmentStatus.PENDING; legacy fallback preserves finer-grained transitions
2. **ShipmentStatus is validation-only** — not a DB column; adding as column requires data migration
3. **CI lint uses continue-on-error** — pre-existing lint warnings not blocking
4. **Notification delivery is fire-and-forget** — failed sends logged but don't block APIs
5. **Zalo OA access token is short-lived** — needs OAuth refresh flow for production
6. **Zalo uses single global fallback recipient** — per-user delivery needs `User.zaloChatId` schema change
7. **Telegram requires env vars in production** — `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
8. **SMTP requires env vars in production** — `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
9. **Camera scan requires HTTPS** — `getUserMedia` restricted to secure contexts
10. **html5-qrcode in maintenance mode** — works but no new bug fixes expected
11. **Package images stored locally** — `public/uploads/packages/` via LocalStorageProvider; swap via `STORAGE_PROVIDER` env var
12. **Uploaded images publicly accessible** — anyone with URL can view; acceptable for MVP
13. **Smoke tests only** — 5 Vitest tests for storage; no API route or E2E tests yet
14. **Docker Compose not end-to-end tested** — Docker build verified; needs real server validation
15. **HTTPS/TLS not configured** — documented in DEPLOYMENT.md; required for camera scan
16. **Production requires `.env.production`** — docker-compose won't start without it
17. **bwip-js types** — local interface used; low risk

---

## Remaining Work

- Merge unmerged PRs (#32 notification diagnostics, #33 Zalo order status notify) — or re-implement
- Production Telegram/SMTP/Zalo configuration
- Cloud storage provider (S3/R2/MinIO) implementation
- Accountant finance/transactions pages (dashboard done, finance uses admin routes)
- API route smoke tests
- E2E test suite (Playwright)
- Dashboard redesign
- HTTPS/TLS setup
- Full Docker Compose end-to-end validation
