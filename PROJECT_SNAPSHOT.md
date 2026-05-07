# Project Snapshot — VN Logistics System

**Date:** 2026-05-07
**Branch:** `devin/1777960233-logistics-system-implementation`
**Latest stable commit:** `4b403ab`

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
| Infra | Docker Compose |

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
| `/api/admin/audit-log` | GET | Paginated audit log (OrderStatusLog) |
| `/api/analytics` | GET | Dashboard analytics |

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

- Zalo notification delivery implementation
- Production Telegram bot/chat configuration
- Production SMTP configuration
- Package image upload (model exists, no upload endpoint)
- Accountant role pages (role exists, no dedicated UI)
- Order notes/history log UI
- Production deployment configuration
- Comprehensive E2E test suite

## Known Risks / Issues

1. **ShipmentStatus ↔ OrderStatus mapping** — PENDING/PURCHASED/SELLER_SHIPPED collapse into single ShipmentStatus.PENDING. Legacy fallback in `/api/orders/[id]/status` preserves finer-grained transitions; removing it would break those flows.
2. **ShipmentStatus enum in Postgres but not as a column** — validation-only layer; adding as Order column later requires data migration.
3. **bwip-js types** — local interface used because package types don't resolve under `moduleResolution: "bundler"`. Low risk.
4. **No CI pipeline** — no automated tests or checks configured.
5. **Notification delivery is fire-and-forget** — failed sends are logged but do not block APIs.
6. **Zalo channel is a placeholder only** — returns "not implemented" gracefully.
7. **Telegram delivery requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in production** — failures are logged and do not block APIs.
8. **SMTP_* environment variables required in production** — `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
9. **Scan workflow uses web input only** — no camera scanning or mobile offline mode yet.
10. **Package status transitions are server-validated** — should remain aligned with package/shipment workflow.
11. **Audit log uses structured console logging plus existing OrderStatusLog persistence** — full entity-wide persistent audit table is not implemented yet.
