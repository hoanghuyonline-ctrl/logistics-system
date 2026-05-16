# Windows 10 Local Deployment Guide

Deploy the VN Logistics System on a Windows 10 machine using Docker Desktop for production-like testing, including mobile camera barcode scanning.

---

## Prerequisites

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | Windows 10 (v2004+, Build 19041+) | Windows 10 22H2 |
| CPU | i5 (4 cores) | i5+ |
| RAM | 8 GB | 16 GB |
| Disk | 10 GB free (NVMe SSD recommended) | 20 GB free |
| Docker Desktop | 4.x+ with WSL2 backend | Latest stable |
| WSL2 | Required | Ubuntu 22.04 distro |
| Git | Any | Git for Windows |

---

## Step 1: Install WSL2 (If Not Installed)

Open **PowerShell as Administrator**:

```powershell
# Enable WSL2
wsl --install

# If already installed, ensure WSL2 is the default version
wsl --set-default-version 2

# Install Ubuntu (if not already present)
wsl --install -d Ubuntu-22.04

# Verify
wsl --list --verbose
# Should show Ubuntu with VERSION = 2
```

**Restart your PC** after installation.

---

## Step 2: Install & Configure Docker Desktop

1. Download from https://www.docker.com/products/docker-desktop/
2. During install, ensure **"Use WSL 2 instead of Hyper-V"** is checked
3. After install, open Docker Desktop → **Settings**:

### Recommended Docker Desktop Settings

| Setting | Path | Value |
|---------|------|-------|
| WSL2 backend | General → Use the WSL 2 based engine | **Enabled** |
| Memory limit | Resources → WSL Integration | See below |
| Disk image location | Resources → Disk image location | Keep default (NVMe) |
| WSL Integration | Resources → WSL Integration | Enable for your Ubuntu distro |

### RAM Allocation

With 8 GB total system RAM, configure WSL2 memory limit:

Create/edit `%UserProfile%\.wslconfig`:

```ini
[wsl2]
memory=4GB
swap=2GB
processors=4
```

**Expected RAM usage during deployment:**

| Component | RAM Usage |
|-----------|-----------|
| PostgreSQL 16 | ~100-200 MB |
| Next.js app (standalone) | ~150-300 MB |
| nginx | ~10-20 MB |
| Docker overhead | ~200-400 MB |
| **Total containers** | **~500 MB - 1 GB** |
| WSL2 + Docker Desktop | ~1-2 GB |
| **Total Docker** | **~1.5 - 3 GB** |
| Windows 10 OS | ~2-3 GB |
| **System total** | **~4-6 GB** |

With 8 GB RAM and `memory=4GB` WSL limit, you will have ~4 GB for Windows and 4 GB for Docker — sufficient for all three containers.

---

## Step 3: Clone and Configure

Open **PowerShell** or **WSL2 terminal** (recommended: use WSL2 for all commands):

```bash
# Clone the repository
git clone <repo-url>
cd logistics-system

# Create production environment file
cp .env.production.example .env.production
```

Edit `.env.production` with your values:

```env
# === Required ===
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"
NEXTAUTH_URL="http://localhost"
POSTGRES_PASSWORD="<strong-password>"

# === Email (SMTP) — leave blank to skip ===
SMTP_HOST=""
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""

# === Telegram — leave blank to skip ===
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""

# === Zalo — leave blank to skip ===
ZALO_OA_ACCESS_TOKEN=""
ZALO_RECIPIENT_ID=""
ZALO_SEND_ENABLED="false"

# === Deployment ===
HTTP_PORT="80"
```

Generate `NEXTAUTH_SECRET` (in WSL2 or Git Bash):

```bash
openssl rand -base64 32
```

Or in PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }) -as [byte[]])
```

---

## Step 4: Build and Start

### Exact Startup Sequence

```bash
# 1. Build all containers (first run takes 3-5 minutes on NVMe SSD)
docker compose build

# 2. Start database first (wait for healthy)
docker compose up -d db

# 3. Wait for PostgreSQL to be ready (~5 seconds)
docker compose ps
# Verify db shows "healthy" in STATUS column

# 4. Start all services
docker compose up -d

# 5. Wait for app to build and start (~10-30 seconds)
docker compose ps
# Wait until all three services show "healthy"

# 6. Run database migrations
docker compose exec app npx prisma migrate deploy

# 7. (Optional) Seed demo data
docker compose exec app npx prisma db seed

# 8. Verify health
curl http://localhost/api/health
# Expected: {"status":"ok","database":"ok"}
```

**Alternative: Single command (after first build):**

```bash
docker compose up -d --build && \
  sleep 30 && \
  docker compose exec app npx prisma migrate deploy
```

---

## Step 5: Verify Deployment

### Persistent Volumes

Check volumes are created and persisting:

```bash
# List Docker volumes
docker volume ls
# Should show: logistics-system_pgdata, logistics-system_uploads

# Inspect PostgreSQL data volume
docker volume inspect logistics-system_pgdata

# Inspect uploads volume
docker volume inspect logistics-system_uploads
```

**Volume persistence behavior:**
- `pgdata` — PostgreSQL data survives `docker compose down` and `docker compose up -d`
- `uploads` — Package images survive restarts
- **Only `docker compose down -v` destroys volumes** — do NOT use `-v` flag unless you want to reset everything

### nginx Reverse Proxy Paths

| URL Path | Handled By | Notes |
|----------|-----------|-------|
| `/uploads/*` | nginx (direct file serve) | Serves from `uploads` volume at `/data/uploads/` |
| `/nginx-health` | nginx (returns 200) | Health check endpoint |
| `/*` (everything else) | Proxied to Next.js :3000 | App routes, API, static assets |

---

## Step 6: Local Testing Checklist

Open `http://localhost` in your browser.

### Login Test

- [ ] Navigate to `http://localhost/login`
- [ ] Login with seeded admin account (if seeded)
- [ ] Verify redirect to dashboard based on role
- [ ] Test with each role: ADMIN, CUSTOMER, WAREHOUSE_CN, WAREHOUSE_VN, ACCOUNTANT
- [ ] Verify unauthorized access is blocked (e.g., customer cannot access `/admin`)

### Scan Workflow Test

- [ ] Login as WAREHOUSE_CN user
- [ ] Navigate to warehouse China scan page
- [ ] Enter a package barcode manually → verify lookup returns package info
- [ ] Test status update via scan → verify status transition succeeds
- [ ] Login as WAREHOUSE_VN user
- [ ] Repeat scan test on Vietnam warehouse scan page
- [ ] Verify invalid transitions are rejected with error message

### Upload Test

- [ ] Login as WAREHOUSE_CN or ADMIN
- [ ] Navigate to a package detail page
- [ ] Upload a test image (JPG, PNG, or WebP, under 5 MB)
- [ ] Verify image appears in the package image list
- [ ] Verify image is accessible via direct URL: `http://localhost/uploads/packages/<filename>`
- [ ] Delete the image → verify it is removed from list and disk
- [ ] Test rejection: try uploading a file > 5 MB → should return error
- [ ] Test rejection: try uploading a non-image file → should return error

### Notification Test

- [ ] Create a new order as CUSTOMER
- [ ] Login as ADMIN → verify "New Order" notification appears in bell dropdown
- [ ] Click notification → verify mark-as-read works
- [ ] If Telegram configured: verify Telegram message is received
- [ ] If SMTP configured: verify email is sent (check logs: `docker compose logs app | grep SMTP`)

### i18n Test

- [ ] Switch language to Vietnamese → verify all UI labels change
- [ ] Switch to Chinese → verify all UI labels change
- [ ] Switch back to English → verify all UI labels restore
- [ ] Navigate to order detail page → verify all `orderDetail.*` keys are translated

### Wallet & Order Workflow Test

- [ ] Login as CUSTOMER
- [ ] Deposit funds to wallet
- [ ] Create an order → verify cost is calculated correctly
- [ ] Login as ADMIN → advance order through status transitions
- [ ] Complete the order → verify wallet balance is deducted
- [ ] Cancel an order → verify refund is applied

---

## Step 7: Mobile Camera Scan Testing (HTTP Only)

> **Important:** Browser `getUserMedia` (camera access) only works over HTTPS or on `localhost`. For mobile testing over the local network, you need one of these approaches:

### Option A: Chrome Flag Override (Easiest for Testing)

On the **mobile device** accessing your Windows machine:

1. Find your Windows machine's local IP: `ipconfig` → look for `IPv4 Address` (e.g., `192.168.1.100`)
2. On Android Chrome, navigate to: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
3. Add your machine's URL: `http://192.168.1.100`
4. Relaunch Chrome
5. Navigate to `http://192.168.1.100/warehouse/china/scan`
6. Camera scan should now work over HTTP

### Option B: Port Forwarding via ADB (Android Only)

```powershell
# Connect Android device via USB with USB debugging enabled
adb reverse tcp:80 tcp:80

# On mobile browser, navigate to http://localhost
# Camera will work because it's "localhost"
```

### Option C: Self-Signed Certificate (More Setup)

See the "HTTPS with Self-Signed Certificate" section below.

---

## Firewall & Port Guidance

### Windows Firewall

If other devices on your LAN need to access the app (e.g., mobile camera testing):

```powershell
# Run PowerShell as Administrator

# Allow HTTP (port 80) through Windows Firewall
New-NetFirewallRule -DisplayName "Logistics System HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# If using a custom port (e.g., 8080), adjust accordingly
New-NetFirewallRule -DisplayName "Logistics System HTTP" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
```

To remove the rule later:

```powershell
Remove-NetFirewallRule -DisplayName "Logistics System HTTP"
```

### Custom Port

If port 80 is occupied (e.g., by IIS or another service):

1. Edit `.env.production`:
   ```env
   HTTP_PORT="8080"
   ```
2. Restart: `docker compose up -d`
3. Access at `http://localhost:8080`

### Router/Network

- For LAN-only testing: no router config needed
- For remote access: forward your chosen port on your router (not recommended for production)

---

## HTTPS with Self-Signed Certificate (Optional)

For proper mobile camera testing without Chrome flags:

```bash
# Generate self-signed certificate (in WSL2 or Git Bash)
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/selfsigned.key \
  -out nginx/ssl/selfsigned.crt \
  -subj "/CN=logistics.local"
```

Then modify `nginx/nginx.conf` to add an HTTPS server block (future PR scope — not included in this guide to avoid changing app logic).

---

## Common Operations on Windows

```bash
# View all container logs
docker compose logs -f

# View specific service logs
docker compose logs -f app
docker compose logs -f db
docker compose logs -f nginx

# Restart after code changes
docker compose up -d --build

# Stop all services (preserves data)
docker compose down

# Full reset (DESTROYS all data)
docker compose down -v

# Database backup
docker compose exec db pg_dump -U postgres logistics > backup.sql

# Database restore
docker compose exec -T db psql -U postgres logistics < backup.sql

# Enter app container shell
docker compose exec app sh

# Enter database shell
docker compose exec db psql -U postgres logistics

# Check container resource usage
docker stats
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `docker compose` not found | Use `docker-compose` (with hyphen) if on older Docker Desktop |
| Port 80 already in use | Change `HTTP_PORT` in `.env.production` or stop IIS: `iisreset /stop` |
| Build fails with out-of-memory | Increase WSL2 memory in `.wslconfig` to at least 4 GB |
| Containers exit immediately | Check `docker compose logs app` — likely missing `.env.production` |
| Database connection refused | Wait for `db` to be healthy: `docker compose ps` |
| Uploads not showing | Verify volume mount: `docker compose exec nginx ls /data/uploads/` |
| Slow build times | Ensure Docker Desktop uses WSL2 backend (not Hyper-V) |
| Camera not working on mobile | Use Chrome flag override (Option A above) or ADB port forwarding |
| `prisma migrate` fails | Ensure `db` is healthy first; check `DATABASE_URL` in compose |
| WSL2 consuming too much RAM | Set memory limit in `.wslconfig` and restart WSL: `wsl --shutdown` |
| Cannot access from other devices | Add Windows Firewall rule for the HTTP port |

---

## Standalone Deploy (Without Docker) — Troubleshooting

If you use `scripts/deploy-standalone.ps1` instead of Docker:

### Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| White screen / no CSS | `.next/standalone/.next/static` missing | Re-run `deploy-standalone.ps1` — it copies static assets automatically |
| Missing images/favicon | `.next/standalone/public` missing | Re-run `deploy-standalone.ps1` — it copies public folder automatically |
| "Cannot find module prisma" | `node_modules/.prisma` not copied | Run `npx prisma generate` then re-run deploy script |
| Build fails silently | Interrupted build left corrupt `.next` | Delete `.next` folder entirely, then `npm run build` |
| PM2 shows "errored" | Missing `.env` or wrong `DATABASE_URL` | Check `.env` file exists in project root with valid settings |
| Port already in use | Another process on port 3000 | `$env:PORT=3001; node .next\standalone\server.js` |
| "next.config.ts: output must be standalone" | Config missing | Add `output: "standalone"` to `next.config.ts` |

### Safe Rebuild Sequence (PowerShell)

If things go wrong, this sequence always produces a clean deploy:

```powershell
# 1. Stop PM2 process (if running)
pm2 stop logistics-system 2>$null

# 2. Clean previous build
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 3. Reinstall dependencies
npm install

# 4. Regenerate Prisma client
npx prisma generate

# 5. Deploy
powershell -File scripts\deploy-standalone.ps1

# 6. Start
pm2 start .next\standalone\server.js --name logistics-system
pm2 save
```

### Verifying a Standalone Deploy

After deploy, check these paths exist:

```powershell
# All three must exist for the app to work correctly:
Test-Path .next\standalone\server.js          # Core server
Test-Path .next\standalone\.next\static       # CSS/JS assets
Test-Path .next\standalone\public             # Images/favicon
```

If any are missing, re-run `scripts\deploy-standalone.ps1`.

---

## Architecture Diagram (Docker on Windows)

```
  Windows 10 Host
  ├── Docker Desktop (WSL2 backend)
  │   ├── nginx:alpine          :80 → exposed to host
  │   │   ├── /uploads/*        → serves from uploads volume
  │   │   └── /*                → proxy to app:3000
  │   ├── app (Next.js)         :3000 (internal)
  │   │   ├── Prisma ORM        → connects to db:5432
  │   │   └── /app/public/uploads → uploads volume
  │   └── db (PostgreSQL 16)    :5432 (internal)
  │       └── /var/lib/postgresql/data → pgdata volume
  │
  ├── Volumes (persist across restarts)
  │   ├── logistics-system_pgdata   → PostgreSQL data
  │   └── logistics-system_uploads  → Package images
  │
  └── Network
      └── LAN: http://<windows-ip>:80 → mobile testing
```
