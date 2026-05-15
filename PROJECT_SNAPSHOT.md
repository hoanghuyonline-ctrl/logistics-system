# Project Snapshot — VN Logistics System

**Date:** 2026-05-15
**Branch:** `main`
**Latest stable commit:** Docs PR (post PR #240)

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
- **Zalo Domain Verifier Public Access** (PR #90) — Whitelisted `/zalo_verifier*.html` in proxy auth bypass so Zalo OA domain verification returns 200 instead of redirecting to `/login`
- **Zalo OA Webhook** (PR #91) — Public `POST /api/zalo/webhook` endpoint for receiving Zalo OA events, added to `publicPaths` in proxy.ts
- **Zalo Webhook Auto-Reply** (PR #92) — `user_send_text` events trigger Vietnamese auto-reply with order lookup (order code → status/weight/cost) or guidance message; fire-and-forget pattern
- **Zalo Reply Formatting** (PR #94) — Polished Vietnamese mobile-friendly formatting with company header (📦 Bắc Trung Hải Logistics), emoji icons, actual order code in not-found replies, company sign-off
- **Zalo Automatic Status Notifications** (PR #95) — Shipment status changes automatically push Vietnamese Zalo notifications to bound customers; 9 status templates with emoji icons; structured `[zalo/status]` logging; only sends when customer has `zaloRecipientId` and `ZALO_SEND_ENABLED=true`
- **Zalo Auto-Bind Sender ID** (PR #96) — First-time order lookup via Zalo OA automatically binds sender ID to customer account (`User.zaloRecipientId`); conflict safety (never overwrites existing different binding); structured `[zalo/bind]` logging; Vietnamese confirmation reply on successful bind
- **Zalo QR Support Widget** (PR #166) — Floating bottom-left widget on all pages; toggle button reveals Zalo QR code image with Vietnamese text "Quét mã QR này để được Zalo hỗ trợ 24/7"; client component using `next/image`; consistent Tailwind styling
- **Zalo QR Widget in Dashboards** (PR #168) — Zalo QR support widget shown in all authenticated dashboard pages (customer, admin, warehouse, accountant); consistent placement across layouts
- **Customer Issue Submission** (PR #169) — Customers can submit complaints/issues directly from order detail page; linked to existing `CustomerIssue` model; integrated with admin issue tracking
- **Customer Notification Events** (PR #170) — All operational events (order status changes, warehouse scans, payment, etc.) now send customer notifications across all configured channels (System, Telegram, Zalo, Email)
- **Channel Routing Fix** (PR #171) — Telegram/Zalo notifications now route to per-customer channel bindings; skips sending if customer has not bound the channel; prevents delivery failures to unbound recipients
- **Notification Channel Linking Page** (PR #172) — Customer-facing `/customer/notification-channels` page showing Zalo and Telegram binding status; instructions for linking channels; Vietnamese UI
- **Channel Unlink/Relink Controls** (PR #173) — Customers can unlink and relink Zalo and Telegram notification channels from their settings; admin-side visibility preserved
- **Zalo Chatbot Greeting & FAQ Improvements** (PR #174) — Zalo OA chatbot now handles greeting messages (xin chào, hello, hi, etc.) with Vietnamese welcome reply; improved FAQ knowledge matching with better scoring; fallback guidance for unmatched queries
- **Zalo Silent Reply Fix** (PR #175) — Resolved Zalo OA silent replies after auto-binding; robust error handling with try/catch around reply sending; structured `[zalo/reply]` logging for all send attempts and failures
- **Notification Channel Delivery Logs & Health API** (PR #98) — Standardized `[notify/channel]` structured logs for SYSTEM, TELEGRAM, ZALO, EMAIL delivery results (orderCode, customerId, recipient, success/failure, reason); admin-only `GET /api/admin/notifications/health` returns channel readiness (telegram/zalo/email/messenger enabled/disabled)
- **Admin Notification Health Card** (PR #99) — Compact Vietnamese "Trạng thái kênh thông báo" card on Admin Settings page showing Telegram, Zalo OA, Email, Messenger, and App channel readiness at a glance; no secrets exposed
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
- **Messenger Send Diagnostic Logging** (PR #88) — Improved outbound send logging with Graph API response status, error body, and truncated token hint for production debugging
- **Messenger Production Deployment** — Full Messenger MVP verified on production:
  - Meta webhook verification PASS
  - Facebook Page connected and subscribed
  - Messenger auto-reply working (Vietnamese welcome message)
  - Order lookup production-tested (valid code returns status, invalid code returns guidance)
  - Vietnamese formatting verified on mobile Messenger
  - PM2 production deploy stable
  - Existing Telegram bot and web tracking unaffected
- **Admin Order Detail UI Fix** (PR #104) — Separated custom status note ("Ghi chú trạng thái") input into its own Card below customer/cost section; "Cập nhật trạng thái" card now contains only status transition buttons, fixing layout overlap that made buttons unclickable
- **Status Update Method Fix** (PR #105) — Changed admin order detail `updateStatus()` from `PUT` to `PATCH` to match the `/api/orders/[id]/status` route handler, fixing 405 errors on all status transitions
- **Product Link Display Polish** (PR #110) — Admin order detail now shows clean domain-based labels ("Mở link Taobao", "Mở link 1688", etc.) instead of raw URLs; full product URL remains clickable and opens in a new tab; no schema change
- **Copy-to-Clipboard Buttons** (PR #112) — Admin order detail copy buttons for order code, package code, barcode, and tracking fields; "Đã sao chép" toast on click; no schema change
- **Expanded Admin Order Search** (PR #113) — Admin order search now supports order code, package code, barcode, and customer phone; additive OR conditions for non-customer roles; admin-specific placeholder in VI/EN/ZH
- **Order Note Preview in Admin List** (PR #114) — Admin order list shows latest note snippet in "Ghi chú" column; truncated with hover tooltip; single-query via Prisma `take: 1`; no schema change
- **Admin Order List Visual Indicators** (PR #116) — Blue dot for orders with notes, amber dot for custom status notes, ⏳ for PENDING ≥ 3 days, red row tint for cancelled; all computed client-side from existing data
- **Quick Filter Chips** (PR #117) — Six filter chips above admin order list: Có ghi chú, Có cập nhật khách hàng, Đang chờ lâu, Đã huỷ, Hôm nay, Chưa hoàn thành; toggle behavior with "Xóa bộ lọc" clear button; server-side `filter` query param; combines with search and status dropdown
- **Last Activity Info** (PR #119) — Replaced "Ghi chú" column with "Hoạt động" showing who last touched the order and when (e.g. "Admin • 5 phút trước"); compares latest statusLog vs orderNote; role labels in Vietnamese
- **Order List Navigation** (PR #120) — Clickable rows with Ctrl/Cmd+click and middle-click new-tab support; URL state persistence for search, filter, status, and page via `useSearchParams` + `history.replaceState`
- **Priority Tagging** (PR #122) — New `OrderPriority` enum (NORMAL/HIGH/URGENT) with `priority` field on Order; admin can set priority from order detail ("Độ ưu tiên" card); colored badge in admin order list (amber for Ưu tiên, red for Khẩn cấp); new `PUT /api/orders/[id]/priority` endpoint; migration `20260513060000_add_order_priority`
- **Suspense Build Fix** (PR #123) — Wrapped `useSearchParams` in `<Suspense>` boundary for `/admin/orders` to fix Next.js production build error; split into `AdminOrdersPage` wrapper + `AdminOrdersContent` inner component

- **Status Summary Counters** (PR #125) — Compact status chips above admin order list showing order counts by status (Chờ mua, Đã mua, Đang vận chuyển, Tới kho VN, Hoàn thành) + Khẩn cấp count; clickable to filter; opt-in `summary=1` API param with `groupBy` query; new `urgent` filter case
- **Quick Status Actions** (PR #126) — "Thao tác" column in admin order list with quick transition buttons (e.g. "→ Đã mua"); reuses existing `PATCH /api/orders/[id]/status` for audit logs and notifications; CANCELLED excluded from quick actions; optimistic UI update with toast feedback

- **Admin Support Knowledge Base Foundation** (PR #128) — New `SupportKnowledge` Prisma model (title, content, category, isActive); admin-only CRUD API (`GET/POST /api/admin/support-knowledge`, `PATCH/DELETE /api/admin/support-knowledge/[id]`); "Trung tâm tri thức" admin page with add/edit/delete/toggle UI grouped by category; sidebar nav link with VI/EN/ZH i18n; 6 default seed entries (giờ làm việc, tạo đơn, kiểm tra trạng thái, nạp tiền, tính phí, liên hệ); migration `20260513080000_add_support_knowledge`; no chatbot integration yet — foundation only
- **Zalo Knowledge Base Lookup** (PR #129) — Zalo webhook fallback now searches active `SupportKnowledge` entries before returning default guidance; `findSupportKnowledgeAnswer()` helper with case-insensitive keyword matching against title/category/content; structured `[zalo/knowledge]` logging (matched=true/false, entry id/title); reply truncated to 500 chars; existing order lookup and sender auto-bind preserved; 9 Vitest tests for `scoreMatch` pure function; no AI/LLM integration
- **Knowledge Keywords Field** (PR #130) — Optional `keywords` (comma-separated text) field on `SupportKnowledge` model; admin UI "Từ khóa" input with helper text; keywords matched first (highest priority 15×) before title/category/content; `matchSource` field in structured `[zalo/knowledge]` logs (keywords/title/category/content/none); migration `20260513090000_add_support_knowledge_keywords`; backward compatible — existing entries work with null keywords; 13 Vitest tests
- **Bulk Import Knowledge** (PR #131) — "Nhập tri thức hàng loạt" card on admin knowledge page; paste documents with `#`/`##`/colon-ending headings to auto-split into multiple entries; `POST /api/admin/support-knowledge/import` admin-only API; `parseSections()` helper in `src/lib/knowledge-import.ts`; category selector for imported batch; result toast "Đã nhập X mục tri thức"; 8 Vitest tests for parsing logic; no AI/LLM integration
- **Knowledge Test Box** (PR #132) — "Thử câu hỏi chatbot" collapsible card on admin knowledge page; admin types a customer question and sees matched answer with title, matchSource, and score; reuses `testSupportKnowledgeMatch()` from `src/lib/support-knowledge.ts` (same matching logic as Zalo webhook); `POST /api/admin/support-knowledge/test` admin-only API; green/success box for matches, amber warning for no-match with guidance to add keywords; Enter key support; no AI/LLM integration
- **Knowledge Template Importer** (PR #133) — "Tạo tri thức mẫu" button on admin knowledge page; creates 10 starter entries with professional Vietnamese content (giờ làm việc, liên hệ, tạo đơn, kiểm tra đơn, nạp tiền, tính phí, quy trình vận chuyển, khiếu nại, kho TQ, kho VN); each template includes pre-defined keywords; duplicate detection by title — skips existing entries; `POST /api/admin/support-knowledge/templates` admin-only API; templates defined in `src/lib/knowledge-templates.ts`; result toast "Đã tạo X mục, bỏ qua Y mục đã có"
- **Telegram & Messenger Knowledge Fallback** (PR #134) — Telegram and Messenger webhooks now search active Support Knowledge entries before returning default guidance; reuses `findSupportKnowledgeAnswer()` from `src/lib/support-knowledge.ts` (same matching as Zalo); Telegram: commands (/start, /help, /status) and order-code lookup preserved as first priority; Messenger: order-code lookup preserved; structured logs `[telegram/knowledge]` and `[messenger/knowledge]` with matched=true/false, matchSource, entry id/title; error handling falls back to existing guidance messages; no AI/LLM integration
- **Unanswered Questions Log** (PR #135) — New `ChatbotUnansweredQuestion` Prisma model (channel, question, senderId, resolved); Zalo/Telegram/Messenger webhooks save unmatched questions fire-and-forget; admin UI section "Câu hỏi chưa có câu trả lời" on knowledge page with channel badge, timestamp, resolved status; "Đánh dấu đã xử lý" action; "Tạo tri thức" action pre-fills knowledge form with question text; `GET /api/admin/unanswered-questions` and `PATCH /api/admin/unanswered-questions/[id]` admin-only APIs; migration `20260513100000_add_chatbot_unanswered_questions`
- **Chatbot Knowledge Analytics** (PR #136) — "Hiệu quả chatbot" collapsible analytics card on admin knowledge page; counters: total/unresolved/resolved questions; channel breakdown (Zalo/Telegram/Messenger) with unresolved counts; latest unresolved question display; top 5 repeated questions with frequency; `GET /api/admin/support-knowledge/unanswered/summary` admin-only API; compact UI, no page redesign
- **Group Repeated Unanswered Questions** (PR #137) — Unanswered questions list now groups identical/similar questions by normalized text (case-insensitive, trailing punctuation stripped); each group shows: question text, count badge, all channels involved, latest timestamp, unresolved count; "Đánh dấu nhóm đã xử lý" batch resolves all questions in group; "Tạo tri thức" pre-fills form with group question; `GET /api/admin/unanswered-questions` returns grouped data; `PATCH /api/admin/unanswered-questions` batch resolve by IDs; existing individual DB records preserved
- **Unanswered Questions Search & Filters** (PR #138) — Client-side search and filters for grouped unanswered questions; search input "Tìm câu hỏi..." filters by question text; channel dropdown (Tất cả/Zalo/Telegram/Messenger) filters by any channel in group; status dropdown (Chưa xử lý/Đã xử lý/Tất cả) filters by resolved state; defaults to showing unresolved only; compact inline filter bar; existing grouping/batch resolve/create knowledge actions preserved
- **Unanswered Question Category Tagging** (PR #139) — Optional `category` field on `ChatbotUnansweredQuestion` model; 7 predefined categories (Phí vận chuyển, Giờ làm việc, Nạp tiền, Khiếu nại, Kho hàng, Tạo đơn, Khác); admin can assign/change category per group via inline dropdown; category badge (purple) displayed on each group; category filter dropdown in filter bar; "Tạo tri thức" pre-fills matching knowledge category when available; `PATCH /api/admin/unanswered-questions` extended to accept `category` field; migration `20260513110000_add_unanswered_question_category`; backward compatible — existing questions have null category
- **Knowledge Match Usage Tracking** (PR #140) — `matchCount`, `matchCountZalo`, `matchCountTelegram`, `matchCountMessenger`, `lastMatchedAt` fields on `SupportKnowledge` model; fire-and-forget tracking in `findSupportKnowledgeAnswer()` (does not block chatbot reply); Zalo/Telegram/Messenger webhooks pass channel name; admin knowledge list shows per-entry usage: "Đã dùng X lần" with per-channel breakdown (Z:/T:/M:) and "Lần cuối: ..." timestamp; sort dropdown: Mặc định / Dùng nhiều nhất / Mới sử dụng gần đây; migration `20260513120000_add_knowledge_usage_tracking`; backward compatible
- **Vietnamese Support Knowledge Seed Data** (PRs #141, #143) — 133 real Vietnamese support knowledge entries (10 in PR #141 + 123 in PR #143) covering 40 categories of daily customer questions; extracted to `prisma/support-knowledge-data.ts` with typed `KnowledgeEntry` interface; seed logic inserts only when `existingCount === 0`; natural CSKH Vietnamese wording suitable for Zalo/Telegram/Messenger auto-reply
- **PRs #130–#140 Reconciliation** (PR #144) — Clean merge of 11 PRs (#130–#140) that existed on a branch but were not on main; zero conflicts; brought in keywords field, bulk import, test box, template importer, Telegram/Messenger knowledge fallback, unanswered question logging/grouping/filters/categories, knowledge usage tracking, and 4 new Prisma migrations
- **"Tạo tri thức" Shortcut Enhancement** (PR #145) — Enhanced existing "Tạo tri thức" button on unanswered question groups; prefills content with `Khách hỏi: "[question]"\nTrả lời:` template; auto-extracts up to 6 keywords from question text; emerald button style with tooltip; reuses existing knowledge create form
- **Knowledge Match Diagnostics Logging** (PR #146) — Enhanced chatbot knowledge match logs with `score` (match confidence), `candidates` (number of entries scoring > 0), `keywords` (matched entry's keywords), and `channel` (ZALO/TELEGRAM/MESSENGER); consistent structured format across all 3 webhooks; exported `KnowledgeAnswerResult` interface; no behavior changes — logging only
- **Unanswered Questions Quick Filters** (PR #148) — 5 toggle chips above unanswered question groups list: "Chưa có tri thức" (unresolved only), "Hỏi nhiều nhất" (sort by count), "Mới nhất" (sort by time), "Đã phân loại" (has category); helps admin find chatbot knowledge gaps faster; client-side only, works alongside existing search/channel/status/category filters; no schema or API changes
- **Standalone Knowledge Seed Script** (PR #150) — `prisma/seed-support-knowledge.ts` runnable via `npm run seed:knowledge`; production-safe, skips duplicates by title; reuses existing 139-entry dataset
- **Vietnamese User Manual** (PR #151) — Complete A-to-Z user guide at `docs/USER_MANUAL.md` (834 lines) covering all 7 roles (Customer, Admin, Warehouse CN/VN, Accountant, Chatbot/Support, System Operation) with step-by-step workflows, troubleshooting, and daily/weekly/emergency checklists
- **User Manual Training Enhancements** (PR #152) — 34 screenshot placeholders (`[ẢNH: ...]`), tips/warnings/important blocks, training callouts, and screenshot checklist appendix for onboarding and future PDF/video tutorials
- **Backup & Recovery Guide** (PR #153) — `docs/BACKUP_AND_RECOVERY.md` (473 lines) covering PostgreSQL backup procedures, restore workflows, disaster recovery, emergency checklists, and operational safety notes
- **Daily Operations Checklist** (PR #154) — `docs/DAILY_OPERATIONS_CHECKLIST.md` (300 lines) with checkbox-style checklists for morning startup, warehouse CN/VN, accountant, customer support, end-of-day, and emergency quick actions
- **Incident & Operation Log** (PR #155) — `docs/INCIDENT_AND_OPERATION_LOG.md` (318 lines) with severity levels, 17 example incidents, quick/detailed log templates, daily operational notes, lessons learned, and communication guidelines with message templates
- **Automated Backup Scripts** (PR #156) — `scripts/backup-db.bat` and `scripts/backup-uploads.bat` for Windows production server; timestamped PostgreSQL backups via Docker; 7-day rotation policy; auto-create backup directories; updated BACKUP_AND_RECOVERY.md with scheduling notes
- **System Health Dashboard** (PR #157) — `/admin/system-health` page with 3 cards: system status (app online, DB connection, server time, environment), chatbot channels (Zalo/Telegram/Messenger enabled/disabled), operational indicators (unanswered questions, stuck shipments); green/red status dots; sidebar nav + i18n
- **Stuck Shipment Monitoring** (PR #158) — `/admin/stuck-shipments` page for delayed/stuck orders; warning cards for orders not updated > X days, stuck at China/Vietnam warehouse, unpaid orders waiting too long, packages without weight; red/yellow indicators; clickable order links; configurable thresholds
- **Notification Failure Tracking + Retry** (PR #159) — `NotificationFailure` Prisma model with channel, orderCode, failureCategory, shortReason, retryCount; admin `/admin/notification-failures` page with failure list, channel filter, manual retry button; `POST /api/admin/notifications/failures` retry endpoint; migration `20260514000000_add_notification_failure_retry`
- **Customer Shipment Timeline UX** (PR #160) — Enhanced customer order detail timeline with Vietnamese status descriptions, "Bước tiếp theo" next-step hints, delay warning indicators (configurable thresholds per status), visual progress bar with 9-step icons; `src/lib/shipment-timeline-info.ts` helper; no schema changes
- **Customer Issue Tracking** (PR #161) — `CustomerIssue` Prisma model with 8 issue types (thiếu hàng, giao chậm, sai cân, hỏng hàng, chưa nhận, phí sai, chatbot, khác) and 4 statuses (mới, đang xử lý, chờ khách, đã giải quyết); `/admin/customer-issues` page with create form, quick filters, inline status update, resolution notes; migration `20260514010000_add_customer_issues`
- **Staff Handover Notes** (PR #162) — `StaffNote` Prisma model with title, content, orderCode, priority (URGENT/HIGH/NORMAL), resolved toggle; `/admin/staff-notes` page accessible by Admin/Warehouse/Accountant roles; create form, filter chips (chưa xong/đã xong/khẩn cấp), search, card layout with toggle resolve; migration `20260514020000_add_staff_notes`
- **Quick Operational Views** (PR #163) — "Truy cập nhanh" section on admin dashboard with 8 clickable cards showing realtime counts: đơn chờ xử lý, kẹt kho TQ, kẹt kho VN, đơn chậm cập nhật, khiếu nại chưa xử lý, lỗi thông báo, chatbot chưa trả lời, ghi chú bàn giao; `/api/admin/quick-views` endpoint with parallel queries; color-coded active/inactive states; no schema changes

- **Zalo TOKEN_EXPIRED Diagnostics** (PR #177) — Structured `[zalo/bind]` logs with senderId/orderCode/customerId/saved/reason; `[zalo/reply]` FAIL logs with failureType=TOKEN_EXPIRED and errorCode for -216/-230; system health API `zaloDiagnostics` section (tokenExpired, boundCustomers, unresolvedFailures, configPresent); new "Chẩn Đoán Zalo OA" card on system health page with TOKEN_EXPIRED red banner warning; settings page channel health shows "Token hết hạn — cần cập nhật" with red styling; no schema changes

- **Zalo OA Automatic Token Refresh** (PR #179) — `refreshZaloAccessToken()` helper calls Zalo OAuth v4 endpoint with refresh token; runtime memory cache for refreshed access token (no .env writes); `sendZalo()` and webhook `replyToUser()` auto-refresh and retry once on TOKEN_EXPIRED (-216/-230); structured `[zalo/token]` logs (refresh success/fail, timestamp, retry result); `zalo_oa_refresh_token` added to notification config; system health API `tokenRefresh` diagnostics (lastRefreshAt, success, errorReason); health page shows "Lần refresh token gần nhất" with success/fail status; settings page shows ZALO_OA_REFRESH_TOKEN field; requires ZALO_APP_ID and ZALO_APP_SECRET_KEY env vars

- **Zalo Auto-Refresh Admin Settings** (PR #181) — Admin settings fields for `zalo_app_id`, `zalo_app_secret_key` under "Cấu hình Zalo OA"; secret key masked in UI; `zalo-token.ts` reads credentials via `getNotificationConfig()` (DB-first with env fallback); operators can manage all Zalo refresh credentials from settings page without SSH; no schema changes

- **Zalo Linking UX Improvement** (PR #183) — Customer notification channels page shows latest order code with "Sao chép mã đơn để liên kết Zalo" copy button; no-order state shows "Bạn cần có ít nhất một đơn hàng để liên kết Zalo"; admin order detail shows Zalo binding status in customer info card with helper text and order code copy button when not linked; no schema changes

- **Zalo Binding UX Enhancement** (PR #185) — Improved Zalo customer linking UX across 4 touchpoints: dismissable onboarding banner on customer dashboard prompting unlinked users to link Zalo with link to detailed guide; inline Zalo linking hint on customer order detail page with order code copy button; notification channels page Zalo section redesigned with numbered 3-step visual guide (blue circle indicators) replacing plain ordered list; admin order detail unlinked-customer warning enhanced with clearer wording ("không nhận được thông báo qua Zalo"), step-by-step guidance for admin, and explanation that binding is automatic; linked state now shows green confirmation message; all Vietnamese-first; no schema changes

- **Zalo Order Detail Linking Visibility** (PR #187) — Customer order detail page Zalo card refined: order code displayed prominently with copy button and explicit instruction "Sao chép mã đơn này và gửi cho Zalo OA Bắc Trung Hải Logistics để liên kết tài khoản"; linked state shows green success note; Vietnamese-first; no schema/webhook/notification changes

- **Zalo Timeline Notification Awareness** (PR #189) — Compact Zalo awareness box below customer order shipment timeline; unlinked state: 📱 icon, "Nhận thông báo Zalo tự động" heading, order code with copy button, link to notification channel settings; linked state: ✅ green "Zalo đã liên kết" with auto-update confirmation; Vietnamese-first; no schema/API/webhook changes

- **Admin Quick Customer Contact Actions** (PR #190) — Admin order detail customer info section: quick action buttons (Sao chép SĐT, Mở Zalo, Sao chép email, Sao chép mã đơn); Zalo deep link via `zalo.me` with VN→intl phone prefix conversion; green "Đã liên kết Zalo OA" indicator for linked customers; reuses existing copyToClipboard/toast pattern; Vietnamese-first labels; no schema/API/webhook changes

- **Warehouse Scan Success Feedback** (PR #192) — Compact green success summary card after warehouse scan status update on both China and Vietnam scan pages; shows mã kiện, barcode, trạng thái mới (StatusBadge), thời gian cập nhật (vi-VN locale), mã đơn hàng; Vietnamese helper text "Có thể tiếp tục quét mã tiếp theo."; clears on new scan or clear action; shared ScanPage component; preserves existing scan workflow, USB/keyboard scanner flow, duplicate cooldown; no schema/API/workflow changes

- **Admin Dashboard Operational Alerts Polish** (PR #194) — Improved visual emphasis for urgent operational items on admin dashboard "Truy cập nhanh" section; red pulsing badge (Tailwind animate-ping) on urgent cards when count > 0; "Cần xử lý" indicator for stuck shipments, stale orders, unresolved issues, notification failures, unanswered chatbot questions; Vietnamese summary helper text "⚠️ Có mục cần xử lý"; non-urgent cards (pending orders, handover notes) unchanged; UI-only; no schema/API/workflow changes

- **Customer Order Urgency Visibility** (PR #196) — Compact Vietnamese status helper blocks below shipment timeline on customer order detail page; amber warning box when order delayed beyond existing thresholds ("Đơn hàng đang xử lý chậm hơn dự kiến") with specific delay message and support suggestion; green helper when package at Vietnam warehouse ("Đang chuẩn bị giao"); green success when delivered ("Đơn hàng đã giao thành công"); reuses existing getDelayWarning thresholds; Vietnamese-first; no schema/API/shipment logic changes

- **Notification Center Operational Polish** (PR #198) — Improved notification dropdown readability for mobile; type-based icons via keyword matching on Vietnamese titles (✅ delivery success, 🚚 delivery, 💰 payment/deposit, ⚠️ complaints/warnings, 📦 status updates, 🔔 default); unread emphasis with left blue border accent and stronger background; Vietnamese empty-state "Chưa có thông báo mới."; UI-only; no schema/API/notification logic changes

- **Warehouse Scan Productivity Enhancement** (PR #200) — Auto-refocus and select scan input after successful status update and after scan errors for faster continuous scanning; Vietnamese helper text "Có thể dùng máy quét mã vạch hoặc nhập thủ công."; clearer red error box for invalid scans with "❌ Không tìm thấy kiện hàng" heading and guidance text; preserves duplicate cooldown, API flow, camera scan behavior; shared ScanPage component; no schema/API/workflow changes

- **Admin User Management Actions** (PR #202) — Edit user modal (name, email, role, active status) with PUT API email uniqueness check; safe delete/deactivate via `isActive: false` with Vietnamese confirmation dialog and self-delete protection (frontend + API); "Xuất Excel" export button downloads `users-export-YYYY-MM-DD.xlsx` with Vietnamese column headers (Họ tên, Email, Vai trò, Số dư, Trạng thái); `xlsx` npm dependency added; 20 new i18n keys per locale (vi/en/zh); no schema changes

- **Admin User Detail Quick Overview** (PR #204) — Compact quick-info badges on admin user table rows: order count badge (blue/grey), Zalo linked status indicator (green/grey with tooltip), "Có đơn gần đây" amber badge for orders updated within 7 days, latest order activity time-ago text below balance; API extended with `_count.orders`, `zaloRecipientId`, `updatedAt`, latest order `updatedAt` (take: 1); 7 new i18n keys per locale (vi/en/zh); no schema changes

- **Admin Order Quick Actions Polish** (PR #206) — Copy order code button (clipboard icon with toast), copy customer phone button (phone icon with tooltip), quick view detail eye icon in actions column; compact status color dot next to each order code for visual scanning; mobile-friendly `whitespace-nowrap` on action buttons; fixed pre-existing `Date.now()` purity lint error; API: added `phone` to user select in orders endpoint; 4 new i18n keys per locale (vi/en/zh); no schema changes

- **Customer Order List Readability** (PR #208) — Status color dots next to order codes, left border highlights for key states (teal=arrived VN, green=delivered, red=cancelled); 8-step progress bar with step counter and time-ago for latest status change; “⚠ Chờ lâu” warning for orders pending >3 days, “🏠 Đã về VN” and “✓ Đã giao” compact indicators; “📦 Đã đóng kiện” badge when order has package; mobile-friendly layout (product inlined under order code, progress column hidden, tighter padding); 11 new i18n keys per locale (vi/en/zh); no API or schema changes

- **Accountant Dashboard Quick Finance Visibility** (PR #210) — Finance health overview section on accountant dashboard and admin finance page with 5 compact indicators: customers with debt (💳), pending deposits (⏳), today refunds (↩️), high-value orders (💎), negative balances (⚠️); color-coded cards with Vietnamese health labels ("Cần xử lý", "Chờ xác nhận", "Đơn giá trị cao"); 4 lightweight API count queries added to `/api/accountant/dashboard` (customersWithDebt, negativeBalanceCount, todayRefunds, highValueOrdersToday); mobile-friendly layout on both pages; 11 new i18n keys per locale (vi/en/zh); no schema changes

- **Admin Shipment Problem Visibility** (PR #212) — Compact warning badges on admin order list for problematic shipments: "Chưa cập nhật" (5+ days stale, orange), "Thiếu dữ liệu" (missing weight post-China warehouse, red), "Cần kiểm tra" (missing tracking codes, amber), "Chờ khách xác nhận" (custom status note, blue); package data (totalWeightKg, barcode) added to orders API for admin/accountant roles; multiple warnings stack with flex-wrap; 7 new i18n keys per locale (vi/en/zh); no schema changes

- **Customer Order Detail FAQ Helpers** (PR #214) — Compact Vietnamese-first helper blocks on customer order detail page for common shipment states: SELLER_SHIPPED ("Người bán đang chuẩn bị giao hàng tới kho Trung Quốc"), SHIPPING_TO_VIETNAM ("Đơn hàng đang vận chuyển quốc tế, thời gian có thể thay đổi"), ARRIVED_VIETNAM_WH ("Kho Việt Nam đang xử lý và chuẩn bị giao"), OUT_FOR_DELIVERY ("Hàng đang được giao đến địa chỉ của bạn"); "Liên hệ hỗ trợ" section with Zalo-aware guidance (linked: message Zalo OA, unlinked: link to notification channel settings); no API/schema/notification changes

- **Customer Shipping Address Confirmation** (PR #215) — Required Vietnam delivery address confirmation on customer create order page; "Địa chỉ nhận hàng tại Việt Nam" section displays customer name, phone, address from existing profile (`/api/auth/me`); required checkbox "Tôi xác nhận đây là địa chỉ nhận hàng chính xác tại Việt Nam" — submit disabled until checked; missing-address warning with "Cập nhật hồ sơ →" link to `/profile` blocks submission when address is empty; Vietnamese-first; no schema/API/notification changes

- **Customer Address Edit Shortcut** (PRs #217, #219) — Compact "Sửa địa chỉ" link next to "Địa chỉ nhận hàng tại Việt Nam" section title on customer create order page; links to existing `/profile` page for quick address update before placing order; always visible regardless of address state; Vietnamese-first; no schema/API/notification changes

- **Address Edit Button Visibility Fix** (PR #221) — Made "Sửa địa chỉ" button on create order page visually obvious with bordered button style instead of plain text link; improved discoverability for mobile users

- **Wallet QR Top-Up Request Flow** (PR #222) — Customer wallet page "Nạp tiền vào ví" section with VietQR integration; amount input, QR code generation via vietqr.io API (Vietinbank CN Lạng Sơn / 110003049134); transfer reference code format `NAPVI{lastSixUserId}{lastSixTimestamp}`; bank details display (ngân hàng, số tài khoản, chủ tài khoản, nội dung CK); QR image rendering; Vietnamese-first UX with "Lưu ý quan trọng" warnings; no schema changes

- **Mobile Responsive Authenticated Layout** (PR #223) — Responsive sidebar/drawer layout for all authenticated pages (customer, admin, warehouse, accountant); collapsible sidebar on desktop with toggle button; slide-out drawer on mobile with hamburger menu; sticky top bar with page title; smooth CSS transitions; backdrop overlay on mobile; persisted sidebar state; all existing navigation links preserved; Vietnamese-first; no schema/API changes

- **Wallet QR Top-Up Admin Confirmation List** (PR #224) — New `WalletTopUpRequest` Prisma model (customerId, amount, transferReference, bankName, bankAccount, accountHolder, status PENDING/CONFIRMED/CANCELLED, confirmedBy, confirmedAt); customer wallet saves pending request on QR generation via `POST /api/wallet/topup-request`; admin finance page "Yêu cầu nạp tiền chờ xác nhận" section with table (customer info, amount, transfer reference with copy button, time, status); filter chips (Chờ xác nhận / Tất cả); confirm/cancel action buttons; `PATCH /api/admin/topup-requests/[id]` reuses existing wallet deposit logic (balance + debt handling), creates transaction, prevents duplicate confirmation; fire-and-forget wallet notification on confirmation; migration `20260515070000_add_wallet_topup_request`; 19 new `topup.*` i18n keys (VI/EN/ZH)

- **Wallet Top-Up Safety Controls** (PR #225) — Single pending QR request per customer; `POST /api/wallet/topup-request` returns existing PENDING request instead of creating duplicate; `GET /api/wallet/topup-request` returns customer's current pending request; `DELETE /api/wallet/topup-request` allows customer to cancel own PENDING request; customer wallet page loads existing pending on mount, shows amber banner "Bạn đang có một yêu cầu nạp tiền chờ xác nhận", displays existing QR/reference, "Huỷ yêu cầu nạp tiền" cancel button; new request form hidden while pending request exists; after cancel, customer can create new request; admin/accountant confirmation flow unchanged

- **CRM Lead Management Foundation** (PR #233) — New `Lead` Prisma model with fullName, phone, email, zaloName, facebookName, source (`LeadSource` enum: ZALO/FACEBOOK/WEBSITE/REFERRAL/OTHER), status (`LeadStatus` enum: NEW/CONTACTED/INTERESTED/CONVERTED/LOST), notes, assignedToId, convertedUserId; admin CRM page `/admin/crm` with dashboard stats (Leads hôm nay, Leads mới, Đã chuyển đổi, Tỉ lệ chuyển đổi), lead list table with inline status dropdown, source/status filter dropdowns, name/phone/email search, create lead form, notes modal, convert-to-customer modal (create new account or link existing user), admin assignment dropdown; `GET/POST/PUT /api/admin/leads` and `POST /api/admin/leads/convert` admin-only APIs; sidebar nav "CRM / Leads" (🎯); migration `20260515120000_add_lead_crm`; 50+ `crm.*` i18n keys (VI/EN/ZH)

- **CRM Follow-Up Reminders** (PR #234) — Added `nextFollowUpAt`, `lastContactedAt`, `followUpNote` fields to Lead model; stats endpoint returns `followUpTodayCount` and `overdueCount`; list endpoint supports `?followUp=today|overdue` filter; 2 new clickable stat cards "Chăm sóc hôm nay" (orange) and "Quá hạn chăm sóc" (red); "Chăm sóc" column in lead table with overdue badge (⚠️); 📞 "Đã liên hệ" button marks lead as CONTACTED with timestamp; 📅 follow-up scheduling modal with date picker + note; notes modal shows follow-up note and last contacted time; migration `20260515130000_add_lead_followup_fields`; 14 new `crm.*` i18n keys per locale (VI/EN/ZH)

- **Automatic CRM Lead Intake from Zalo/Facebook** (PR #235) — Incoming Zalo OA and Facebook Messenger messages automatically create/update CRM leads; new `zaloSenderId` (unique), `facebookSenderId` (unique), `isAutoCreated` fields on `Lead` model; `upsertLeadFromChannel()` in `src/lib/lead-intake.ts` deduplicates by sender ID and updates `lastContactedAt` on repeat messages; fire-and-forget pattern in both webhooks (no chatbot rewrite); CRM UI "Tự động tạo" emerald badge on auto-created leads; sort dropdown (Mới nhất / Hoạt động gần nhất) with `sort=activity` API param; migration `20260515140000_add_lead_auto_intake`; 3 new `crm.*` i18n keys (VI/EN/ZH); no mass messaging, no auto customer creation
- **CRM Lead Activity Timeline** (PR #237) — `LeadActivity` model recording all lead actions (CREATED, STATUS_CHANGED, NOTE_UPDATED, ASSIGNED, CONTACTED, FOLLOW_UP_SET, CONVERTED, AUTO_CREATED, MESSAGE_RECEIVED); `recordLeadActivity()` fire-and-forget helper; `GET /api/admin/leads/[id]/activity` endpoint; compact "Lịch sử hoạt động" timeline in CRM notes modal; Vietnamese action labels; migration `20260515150000_add_lead_activity`
- **Marketing Campaign Foundation** (PR #238) — `Campaign` model with name, channel (ZALO/FACEBOOK/EMAIL/SMS), status (DRAFT/SCHEDULED/COMPLETED/CANCELLED), targetStatus, messageTemplate, scheduledAt; `GET/POST/PUT /api/admin/campaigns`; admin campaigns page (`/admin/campaigns`) with list, create form, status/channel filters, notes modal; sidebar nav "Chiến dịch"; planning only — no message sending; migration `20260515160000_add_campaign`
- **Support Ticket Improvement** (PR #239) — Added `priority` field (LOW/NORMAL/HIGH/URGENT) to `CustomerIssue`; inline priority dropdown with color-coded chips; inline staff assignment dropdown; priority selector in create form; Vietnamese priority labels; migration `20260515170000_add_issue_priority`
- **Analytics Summary Dashboard** (PR #240) — `GET /api/admin/analytics/summary` aggregating leads by source, conversion rate, overdue follow-ups, open support tickets by priority, campaigns by status; admin page `/admin/analytics-summary` with stat cards, source bar chart, priority/campaign breakdowns; sidebar nav "Tổng quan"; no heavy charts — compact data-driven display
- **Vietnamese End-User & Admin Guides** (Docs PR post #240) — Comprehensive Vietnamese-first documentation: `docs/USER_GUIDE_VI.md` (15 sections — login/register, dashboard, order creation, order tracking, order detail, A→Z shipping flow, wallet/top-up/QR, transactions, notifications, Zalo/Telegram linking, issues/complaints, profile, common errors, FAQ) and `docs/ADMIN_GUIDE_VI.md` (25 sections — role overview, admin dashboard, user management, order management with warning badges, package management, China/Vietnam warehouse workflows, barcode scanning, accountant finance, notification channels, CRM lead management, follow-up workflow, marketing campaigns, support tickets, knowledge base/chatbot, analytics, system config, audit log, system health, staff notes, stuck shipments, production/deploy basics, backup/restore, common mistakes, real operational examples); screenshot placeholders for 32 screens; no code changes

**Production Deploy (post-PR #123):** Migration applied, Prisma generate completed, `npm run build` passed, PM2 restarted successfully.

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
| `/api/wallet/topup-request` | GET/POST/DELETE | Customer pending top-up request (get/create/cancel) |
| `/api/admin/topup-requests` | GET | List all top-up requests (ADMIN/ACCOUNTANT) |
| `/api/admin/topup-requests/[id]` | PATCH | Confirm/cancel top-up request (ADMIN/ACCOUNTANT) |
| `/api/settings` | GET/PUT | System fee configuration |
| `/api/warehouse/china/receive` | POST | Receive goods at CN warehouse |
| `/api/warehouse/vietnam/receive` | POST | Receive goods at VN warehouse |
| `/api/warehouse/vietnam/delivery/[id]` | PATCH | Dispatch/complete delivery |
| `/api/users` | GET/POST | User management |
| `/api/users/[id]` | GET/PUT/DELETE | User detail, edit, deactivate |
| `/api/users/export` | GET | Export user list as .xlsx |
| `/api/warehouse/scan` | POST | Barcode lookup + package status update |
| `/api/packages/[id]/images` | GET/POST/DELETE | Package image upload/list/delete (validated) |
| `/api/admin/audit-log` | GET | Paginated audit log (OrderStatusLog) |
| `/api/analytics` | GET | Dashboard analytics |
| `/api/accountant/dashboard` | GET | Accountant financial KPIs and recent transactions |
| `/api/telegram/webhook` | POST | Telegram chatbot webhook (public, no auth) |
| `/api/zalo/webhook` | POST | Zalo OA webhook — auto-reply, order lookup, sender ID binding, lead intake (public, no auth) |
| `/api/admin/notifications/health` | GET | Notification channel readiness status (ADMIN-only) |
| `/api/admin/support-knowledge` | GET/POST | List/create support knowledge entries (ADMIN-only) |
| `/api/admin/support-knowledge/[id]` | PATCH/DELETE | Update/delete support knowledge entry (ADMIN-only) |
| `/api/admin/customer-issues` | GET/POST/PUT | Customer issue tracking CRUD (ADMIN-only) |
| `/api/admin/staff-notes` | GET/POST/PUT | Staff handover notes CRUD (ADMIN/WAREHOUSE/ACCOUNTANT) |
| `/api/admin/stuck-shipments` | GET | Delayed/stuck shipment indicators (ADMIN-only) |
| `/api/admin/system-health` | GET | System/chatbot/operational health status (ADMIN-only) |
| `/api/admin/notifications/failures` | GET/POST | Notification failure list and retry (ADMIN-only) |
| `/api/admin/quick-views` | GET | Quick operational view counts for dashboard (ADMIN-only) |
| `/api/admin/leads` | GET/POST/PUT | CRM lead list (search, source/status/followUp filters, sort=activity), create, update (ADMIN-only) |
| `/api/admin/leads/convert` | POST | Convert lead to customer account (ADMIN-only) |
| `/api/admin/leads/[id]/activity` | GET | Lead activity timeline (last 50 activities with actor, ADMIN-only) |
| `/api/admin/campaigns` | GET/POST/PUT | Campaign list (status/channel filters), create, update (ADMIN-only) |
| `/api/admin/analytics/summary` | GET | CRM/marketing/support aggregated stats (ADMIN-only) |
| `/api/messenger/webhook` | POST | Facebook Messenger webhook — auto-reply, order lookup, lead intake (public, no auth) |

## Important Prisma Models

| Model | Key Fields |
|-------|-----------|
| **User** | id, email, password, role (CUSTOMER/ADMIN/WAREHOUSE_CN/WAREHOUSE_VN/ACCOUNTANT), zaloRecipientId (nullable) |
| **Order** | orderCode, status (OrderStatus enum), unitPriceCNY, totalCostVND, weightKg, packageId |
| **Package** | packageCode, barcode, totalWeightKg, dimensions, status (PackageStatus) |
| **Wallet** | userId, balance, debt |
| **Transaction** | userId, type, amount, orderId |
| **OrderStatusLog** | orderId, fromStatus, toStatus, changedBy |
| **SystemConfig** | key/value pairs (exchange_rate, service_fee_percent, shipping rates) |
| **Notification** | userId, title, message, isRead |
| **SupportKnowledge** | id, title, content, category, keywords, isActive, matchCount, matchCountZalo, matchCountTelegram, matchCountMessenger, lastMatchedAt |
| **ChatbotUnansweredQuestion** | id, channel, question, senderId, resolved, category |
| **NotificationFailure** | id, channel, orderCode, customerId, recipient, failureCategory, shortReason, retryCount, lastRetryAt, resolved |
| **StaffNote** | id, title, content, orderCode, priority, resolved, createdBy |
| **WalletTopUpRequest** | id, customerId, amount, transferReference, bankName, bankAccount, accountHolder, status (PENDING/CONFIRMED/CANCELLED), confirmedBy, confirmedAt |
| **Lead** | id, fullName, phone, email, zaloName, facebookName, zaloSenderId (unique), facebookSenderId (unique), source (LeadSource), status (LeadStatus), isAutoCreated, notes, assignedToId, convertedUserId, nextFollowUpAt, lastContactedAt, followUpNote |
| **LeadActivity** | id, leadId, action, detail, actorId, createdAt |
| **Campaign** | id, name, channel (CampaignChannel), status (CampaignStatus), targetStatus, messageTemplate, scheduledAt, notes, createdById |
| **CustomerIssue** | id, customerId, orderCode, issueType, description, status, priority, assignedTo, resolution |

**Enums:** OrderStatus (10 values), ShipmentStatus (8 values), PackageStatus, Role, TransactionType, LeadSource (ZALO/FACEBOOK/WEBSITE/REFERRAL/OTHER), LeadStatus (NEW/CONTACTED/INTERESTED/CONVERTED/LOST), CampaignStatus (DRAFT/SCHEDULED/COMPLETED/CANCELLED), CampaignChannel (ZALO/FACEBOOK/EMAIL/SMS)

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
6. **Zalo OA production integration complete** — webhook, auto-reply, order lookup, sender ID binding, and automatic status notifications all verified working.
7. **Telegram delivery requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in production** — failures are logged and do not block APIs.
8. **SMTP_* environment variables required in production** — `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
9. **Camera scan requires HTTPS in production** — `getUserMedia` API is restricted to secure contexts by browsers.
10. **html5-qrcode is in maintenance mode** — library works as-is (1M weekly downloads) but author is seeking new owners; no new bug fixes expected.
11. **Camera scanning requires real-device testing** — cannot be tested without a physical camera; 3-second duplicate-scan cooldown may need tuning.
12. **Package status transitions are server-validated** — should remain aligned with package/shipment workflow.
13. **Audit log uses structured console logging plus existing OrderStatusLog persistence** — full entity-wide persistent audit table is not implemented yet.
14. **Package images stored locally** — stored under `public/uploads/packages/` via `LocalStorageProvider`; swap to S3/R2/MinIO by implementing `StorageProvider` interface and setting `STORAGE_PROVIDER` env var.
15. **Uploaded images publicly accessible** — anyone with the URL can view them via direct path; acceptable for MVP simplicity.
16. **Zalo OA access token is short-lived** — current token works but needs OAuth refresh automation for long-term production use.
17. **Zalo OA tier/package required** — API sending requires an active OA package (ZBS) with sufficient quota; free tier has limitations.
18. **Zalo auto-bind requires customer initiative** — customers must message the OA at least once with a valid order code to bind their Zalo recipient ID; no admin-side manual binding yet.
18. **Smoke tests cover storage only** — 5 Vitest tests for `LocalStorageProvider`; API route and E2E tests not yet implemented.
19. **Full Docker Compose stack not yet tested end-to-end** — only Docker build verified; needs real server validation.
20. **HTTPS/TLS is not configured yet** — documented in DEPLOYMENT.md as a separate step; required for camera barcode scanning.
21. **Production requires .env.production** — docker-compose will not start without this file.
22. **DB/app ports not exposed directly** — nginx is the public entrypoint on port 80; direct DB access requires adding port mapping.
23. **Zalo TOKEN_EXPIRED now auto-recovered** (resolved PR #179) — System automatically refreshes access token on -216 error and retries. Requires ZALO_OA_REFRESH_TOKEN, ZALO_APP_ID, and ZALO_APP_SECRET_KEY to be configured. Manual intervention only needed if refresh token itself expires (~3 months).
