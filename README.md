# VN Logistics - China to Vietnam Shipping Management System

A production-ready logistics management system for a China-to-Vietnam shipping company. Includes customer website, admin panel, order automation, and warehouse management.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes (Route Handlers)
- **Database**: PostgreSQL 16 with Prisma 7 ORM
- **Auth**: NextAuth.js (JWT strategy)
- **Deployment**: Docker + Docker Compose

## Features

### Customer Portal
- Register/Login
- Create orders from Chinese e-commerce URLs (Taobao, 1688, Tmall)
- Track order status through 10-stage workflow
- View cost breakdown with automatic calculation
- Wallet management and transaction history
- Notification center

### Admin Panel
- Dashboard with KPI cards and analytics
- User management (CRUD, role assignment, activation/deactivation)
- Order management (status updates, tracking codes, weight entry)
- Package management (group multiple orders)
- Finance (deposits, profit tracking, revenue analytics)
- System settings (exchange rate, fee configuration)

### Warehouse Management
- **China Warehouse**: Receive goods, record weight, create packages
- **Vietnam Warehouse**: Receive shipments, manage delivery dispatch

### Automation
- Automatic cost calculation: `(Price × Exchange Rate) + Service Fee + Shipping Fees`
- Cost recalculation on weight entry
- Wallet balance checks before order creation
- Automatic payment on order completion
- Refund on cancellation
- Status change notifications

## User Roles

| Role | Access |
|------|--------|
| Customer | Customer portal, own orders/wallet |
| Admin | Full access to all features |
| Warehouse CN | China warehouse operations |
| Warehouse VN | Vietnam warehouse operations |
| Accountant | Finance and analytics |

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd logistics-system
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up db -d
```

### 3. Set up environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work for local development)
```

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Seed test data

```bash
npm run seed
```

### 6. Start the development server

```bash
npm run dev
```

Open http://localhost:3000

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@logistics.vn | admin123 | Admin |
| customer1@gmail.com | pass123 | Customer |
| customer2@gmail.com | pass123 | Customer |
| wh.china@logistics.vn | pass123 | Warehouse CN |
| wh.vietnam@logistics.vn | pass123 | Warehouse VN |
| accountant@logistics.vn | pass123 | Accountant |

## Docker Deployment

```bash
docker compose up --build
```

This starts both PostgreSQL and the Next.js application. After startup:

```bash
# Run migrations
docker compose exec app npx prisma migrate deploy

# Seed data
docker compose exec app npm run seed
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login/Register pages
│   ├── (customer)/      # Customer dashboard, orders, wallet
│   ├── (admin)/         # Admin dashboard, users, orders, settings
│   ├── (warehouse)/     # China/Vietnam warehouse pages
│   └── api/             # REST API routes
│       ├── auth/        # Authentication
│       ├── orders/      # Order CRUD + status/tracking/weight/notes
│       ├── packages/    # Package management
│       ├── wallet/      # Wallet operations
│       ├── transactions/# Transaction history
│       ├── warehouse/   # Warehouse operations
│       ├── notifications/# Notification management
│       ├── analytics/   # Dashboard, revenue, orders, profit
│       ├── settings/    # System configuration
│       └── users/       # User management
├── components/
│   ├── layouts/         # Sidebar, Providers
│   └── ui/              # Card, KPICard, StatusBadge, Pagination, LoadingSpinner
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── cost-calculator.ts # Cost calculation engine
│   ├── notifications.ts # Notification service
│   ├── prisma.ts        # Prisma client singleton
│   └── utils.ts         # Helper functions
├── types/               # TypeScript types and constants
└── proxy.ts             # Route protection (auth + role-based)
prisma/
├── schema.prisma        # Database schema (11 models, 5 enums)
└── seed.ts              # Test data seeder
```

## Order Status Flow

```
PENDING → PURCHASED → SELLER_SHIPPED → ARRIVED_CHINA_WH → PACKING
→ SHIPPING_TO_VIETNAM → ARRIVED_VIETNAM_WH → OUT_FOR_DELIVERY → COMPLETED

Any status → CANCELLED (with refund if payment was made)
```

## Cost Calculation Formula

```
Total Cost = Product Cost (VND) + Service Fee + China Shipping
           + International Shipping (weight × rate) + Vietnam Delivery

Where:
  Product Cost (VND) = Unit Price (CNY) × Quantity × Exchange Rate
  Service Fee = Product Cost (VND) × Service Fee %
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new customer
- `POST /api/auth/[...nextauth]` - NextAuth sign in/out
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PATCH /api/auth/profile` - Change password

### Orders
- `GET /api/orders` - List orders (filtered by role)
- `POST /api/orders` - Create order
- `GET /api/orders/[id]` - Order detail
- `PUT /api/orders/[id]` - Update order
- `PATCH /api/orders/[id]/status` - Update status
- `PATCH /api/orders/[id]/tracking` - Set tracking codes
- `PATCH /api/orders/[id]/weight` - Set weight (recalculates cost)
- `GET /api/orders/[id]/status-log` - Status history
- `GET/POST /api/orders/[id]/notes` - Order notes

### Packages
- `GET /api/packages` - List packages
- `POST /api/packages` - Create package (group orders)
- `GET /api/packages/[id]` - Package detail
- `PUT /api/packages/[id]` - Update package
- `PATCH /api/packages/[id]/status` - Update status
- `POST /api/packages/[id]/images` - Upload image

### Wallet & Transactions
- `GET /api/wallet` - Get own wallet
- `GET /api/wallet/[userId]` - Get user wallet (admin)
- `POST /api/wallet/deposit` - Process deposit
- `POST /api/wallet/adjust` - Manual adjustment
- `GET /api/transactions` - Own transactions
- `GET /api/transactions/[userId]` - User transactions (admin)

### Warehouse
- `POST /api/warehouse/china/receive` - Receive at China WH
- `POST /api/warehouse/vietnam/receive` - Receive at Vietnam WH
- `PATCH /api/warehouse/vietnam/delivery/[id]` - Update delivery

### Other
- `GET/PUT /api/settings` - System configuration
- `GET /api/settings/exchange-rate` - Public exchange rate
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/[id]/read` - Mark read
- `PATCH /api/notifications/read-all` - Mark all read
- `GET /api/analytics/dashboard` - Dashboard KPIs
- `GET /api/analytics/revenue` - Revenue over time
- `GET /api/analytics/orders` - Orders over time
- `GET /api/analytics/profit` - Profit breakdown
- `GET /api/users` - List users (admin)
- `POST /api/users` - Create user (admin)
- `GET/PUT/DELETE /api/users/[id]` - User CRUD (admin)

## Default Configuration

| Setting | Default Value |
|---------|--------------|
| Exchange Rate | 1 CNY = 3,500 VND |
| Service Fee | 5% |
| China Domestic Shipping | 50,000 VND |
| International Shipping | 35,000 VND/kg |
| Vietnam Delivery | 30,000 VND |
