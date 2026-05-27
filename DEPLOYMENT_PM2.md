# PM2 Production Deployment Guide (Windows Server)

Deploy the VN Logistics System on Windows using PM2 for process management. PostgreSQL runs via Docker on port 5433.

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ (LTS recommended) |
| npm | 9+ |
| PM2 | Latest (`npm install -g pm2`) |
| Docker Desktop | Running (for PostgreSQL) |
| Git | Any |

---

## Initial Setup

### 1. Install PM2 globally

```powershell
npm install -g pm2

# Install pm2-windows-startup for auto-restart after reboot
npm install -g pm2-windows-startup
pm2-startup install
```

### 2. Ensure PostgreSQL is running

PostgreSQL runs via Docker on port 5433:

```powershell
# Verify Docker PostgreSQL is running
docker ps | findstr postgres

# If not running, start it:
docker run -d --name logistics-postgres --restart=always -e POSTGRES_PASSWORD=123456 -e POSTGRES_DB=logistics_db -p 5433:5432 postgres:16
```

### 3. Clone and configure

```powershell
git clone <repo-url>
cd logistics-system
npm install
```

### 4. Configure environment

Create `.env.production` (or use existing `.env`):

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5433/logistics_db?schema=public"
NEXTAUTH_URL="https://bactrunghai.vn"
NEXTAUTH_SECRET="<your-secret>"
PORT=3000

# Telegram
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN="<your-bot-token>"
TELEGRAM_CHAT_ID="<your-chat-id>"

# SMTP (optional)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""
```

### 5. Build and prepare database

```powershell
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Build Next.js for production
npm run build
```

---

## Standalone Mode (Recommended for Production)

Next.js `output: "standalone"` produces a self-contained server at `.next/standalone/server.js`.
**Critical:** The standalone output does NOT include static assets (`_next/static/`) or public files (`public/`). You MUST copy them after every build, otherwise CSS/JS/images will return 404.

### Quick Deploy (Windows PowerShell)

```powershell
# One-command deploy:
powershell -File scripts\deploy-standalone.ps1

# Then start/restart:
pm2 start .next\standalone\server.js --name logistics-system
# or if already running:
pm2 restart logistics-system
```

### Manual Deploy Steps

```powershell
# 1. Build
npm run build

# 2. Copy static assets (REQUIRED — without this CSS/JS will 404!)
xcopy /E /Y /I .next\static .next\standalone\.next\static
xcopy /E /Y /I public .next\standalone\public

# 3. Start standalone server
pm2 start .next\standalone\server.js --name logistics-system
```

### Why CSS/styling breaks without the copy step

The standalone server (`server.js`) serves `/_next/static/*` from `.next/standalone/.next/static/`. If that folder is empty or missing, all CSS, JavaScript, fonts, and images return HTTP 404. The HTML loads but appears as unstyled plain text.

---

## PM2 Commands

### Start

```powershell
# Start using ecosystem config (next start mode)
pm2 start ecosystem.config.js

# Or start standalone mode
pm2 start .next\standalone\server.js --name logistics-system

# Verify running
pm2 status
```

### Stop

```powershell
pm2 stop logistics-system
```

### Restart

```powershell
# Normal restart
pm2 restart logistics-system

# After code update (full rebuild — standalone mode)
git pull origin main
npm install
npx prisma generate
powershell -File scripts\deploy-standalone.ps1
pm2 restart logistics-system

# After code update (full rebuild — next start mode)
git pull origin main
npm install
npx prisma generate
npm run build
pm2 restart logistics-system
```

### Logs

```powershell
# Live log stream
pm2 logs logistics-system

# Last 100 lines
pm2 logs logistics-system --lines 100

# Error logs only
pm2 logs logistics-system --err

# Log files location: ./logs/out.log and ./logs/error.log
```

### Status & Monitoring

```powershell
# Process status
pm2 status

# Detailed process info
pm2 describe logistics-system

# Real-time monitoring dashboard
pm2 monit
```

### Startup After Reboot

```powershell
# Save current PM2 process list (run after starting the app)
pm2 save

# The pm2-windows-startup service will auto-restore saved processes on reboot
```

To verify auto-startup is working:

```powershell
# Check if pm2-windows-startup service is installed
pm2-startup status
```

### Delete Process

```powershell
# Remove from PM2 (does not delete files)
pm2 delete logistics-system
```

---

## Update Workflow

When deploying new code:

```powershell
cd logistics-system

# 1. Pull latest code
git pull origin main

# 2. Install dependencies (if changed)
npm install

# 3. Regenerate Prisma client (if schema changed)
npx prisma generate

# 4. Push schema changes (if any)
npx prisma db push

# 5. Rebuild
npm run build

# 6. Restart PM2
pm2 restart logistics-system

# 7. Verify
pm2 status
pm2 logs logistics-system --lines 20
```

---

## Architecture

```
  Windows Server
  ├── PM2 (process manager)
  │   └── logistics-system (Next.js)    :3000
  │       ├── next start (production)
  │       └── Prisma ORM → PostgreSQL
  │
  ├── Docker Desktop
  │   └── logistics-postgres            :5433 → :5432
  │       └── logistics_db
  │
  ├── Reverse Proxy (Cloudflare / nginx)
  │   └── bactrunghai.vn → localhost:3000
  │
  └── Logs
      ├── logs/out.log
      └── logs/error.log
```

---

## Database Backup

```powershell
# Backup
docker exec logistics-postgres pg_dump -U postgres logistics_db > backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%.sql

# Restore
docker exec -i logistics-postgres psql -U postgres logistics_db < backup.sql
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `pm2: command not found` | Run `npm install -g pm2` |
| App crashes on start | Check `pm2 logs logistics-system --err` |
| Port 3000 already in use | Stop existing process: `pm2 delete logistics-system` then restart |
| Database connection refused | Verify Docker PostgreSQL: `docker ps` |
| Build fails | Run `npm run build` manually to see errors |
| PM2 not starting on reboot | Run `pm2 save` after starting the app, verify `pm2-startup status` |
| `next: not found` | Ensure `npm install` was run and `node_modules` exists |
| Prisma schema out of sync | Run `npx prisma generate && npx prisma db push` |
| Memory issues | Check `pm2 monit`, consider increasing Node.js memory: add `--max-old-space-size=2048` to args |

---

## Quick Reference

```powershell
pm2 start ecosystem.config.js    # Start app
pm2 stop logistics-system        # Stop app
pm2 restart logistics-system     # Restart app
pm2 logs logistics-system        # View logs
pm2 status                       # Check status
pm2 monit                        # Monitor dashboard
pm2 save                         # Save for auto-restart
pm2 delete logistics-system      # Remove process
```
