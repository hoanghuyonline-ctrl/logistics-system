# Deploy standalone Next.js server with static assets (Windows PowerShell)
# Usage: powershell -File scripts\deploy-standalone.ps1
#
# After running this script, start the server with:
#   node .next\standalone\server.js
# or:
#   pm2 start .next\standalone\server.js --name logistics-system
#
# RECOVERY: If deploy fails mid-way, fix the issue and re-run this script.
# The script is idempotent and safe to re-run.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Nam Trung Hai Logistics - Standalone Deploy" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── Pre-flight checks ──────────────────────────────────────────────

Write-Host "[Pre-flight] Checking environment..." -ForegroundColor Magenta

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor Gray
} catch {
    Write-Host "  ERROR: Node.js not found. Install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version 2>$null
    Write-Host "  npm:     v$npmVersion" -ForegroundColor Gray
} catch {
    Write-Host "  ERROR: npm not found." -ForegroundColor Red
    exit 1
}

# Check package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "  ERROR: package.json not found. Run this script from the project root." -ForegroundColor Red
    exit 1
}

# Check public folder exists
if (-not (Test-Path "public")) {
    Write-Host "  WARNING: 'public' folder not found. Static assets (favicon, images) will be missing." -ForegroundColor Yellow
    Write-Host "  TIP: If you moved or deleted 'public', restore it from git:" -ForegroundColor Yellow
    Write-Host "       git checkout -- public" -ForegroundColor Yellow
}

# Check .env file
if (-not (Test-Path ".env")) {
    Write-Host "  WARNING: .env file not found. The app may not connect to the database." -ForegroundColor Yellow
    Write-Host "  TIP: Copy .env.example to .env and fill in DATABASE_URL, NEXTAUTH_SECRET, etc." -ForegroundColor Yellow
}

Write-Host ""

# ── Step 1: Build ──────────────────────────────────────────────────

Write-Host "[1/5] Building Next.js (standalone)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FAILED" -ForegroundColor Red
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  1. Run 'npm install' first" -ForegroundColor Gray
    Write-Host "  2. Run 'npx prisma generate' if you see Prisma errors" -ForegroundColor Gray
    Write-Host "  3. Check for TypeScript errors: npm run typecheck" -ForegroundColor Gray
    Write-Host "  4. Check next.config.ts has: output: 'standalone'" -ForegroundColor Gray
    exit 1
}

# ── Step 2: Validate build output ─────────────────────────────────

Write-Host "[2/5] Validating build output..." -ForegroundColor Yellow

if (-not (Test-Path ".next\standalone\server.js")) {
    Write-Host "  ERROR: .next\standalone\server.js not found!" -ForegroundColor Red
    Write-Host "  FIX: Ensure next.config.ts has: output: 'standalone'" -ForegroundColor Yellow
    Write-Host "  Then re-run: npm run build" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path ".next\static")) {
    Write-Host "  ERROR: .next\static folder not found after build!" -ForegroundColor Red
    Write-Host "  This usually means the build failed silently or was interrupted." -ForegroundColor Yellow
    Write-Host "  FIX: Delete .next folder and rebuild:" -ForegroundColor Yellow
    Write-Host "       Remove-Item -Recurse -Force .next" -ForegroundColor Gray
    Write-Host "       npm run build" -ForegroundColor Gray
    exit 1
}

Write-Host "  Build output validated OK" -ForegroundColor Green

# ── Step 3: Copy static assets ────────────────────────────────────

Write-Host "[3/5] Copying .next\static -> .next\standalone\.next\static" -ForegroundColor Yellow
if (Test-Path ".next\standalone\.next\static") {
    Remove-Item -Recurse -Force ".next\standalone\.next\static"
}
Copy-Item -Recurse -Force ".next\static" ".next\standalone\.next\static"

# Verify copy succeeded
if (-not (Test-Path ".next\standalone\.next\static")) {
    Write-Host "  ERROR: Failed to copy static assets!" -ForegroundColor Red
    Write-Host "  TIP: Check disk space and file permissions." -ForegroundColor Yellow
    exit 1
}
Write-Host "  Static assets copied OK" -ForegroundColor Green

# ── Step 4: Copy public assets ────────────────────────────────────

Write-Host "[4/5] Copying public -> .next\standalone\public" -ForegroundColor Yellow
if (Test-Path "public") {
    if (Test-Path ".next\standalone\public") {
        Remove-Item -Recurse -Force ".next\standalone\public"
    }
    Copy-Item -Recurse -Force "public" ".next\standalone\public"

    if (-not (Test-Path ".next\standalone\public")) {
        Write-Host "  ERROR: Failed to copy public folder!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Public assets copied OK" -ForegroundColor Green
} else {
    Write-Host "  SKIPPED: No 'public' folder found (non-critical)" -ForegroundColor Yellow
}

# ── Step 5: Copy Prisma files ─────────────────────────────────────

Write-Host "[5/5] Copying Prisma files..." -ForegroundColor Yellow
$prismaOk = $true

if (Test-Path "prisma") {
    Copy-Item -Recurse -Force "prisma" ".next\standalone\prisma"
} else {
    Write-Host "  WARNING: prisma/ folder not found" -ForegroundColor Yellow
    $prismaOk = $false
}

if (Test-Path "prisma.config.ts") {
    Copy-Item -Force "prisma.config.ts" ".next\standalone\prisma.config.ts"
}

if (Test-Path "node_modules\.prisma") {
    New-Item -ItemType Directory -Force -Path ".next\standalone\node_modules\.prisma" | Out-Null
    Copy-Item -Recurse -Force "node_modules\.prisma\*" ".next\standalone\node_modules\.prisma\"
} else {
    Write-Host "  WARNING: node_modules\.prisma not found. Run 'npx prisma generate' first." -ForegroundColor Yellow
    $prismaOk = $false
}

if ($prismaOk) {
    Write-Host "  Prisma files copied OK" -ForegroundColor Green
}

# ── Final summary ─────────────────────────────────────────────────

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Deploy complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Start server:" -ForegroundColor Cyan
Write-Host "  node .next\standalone\server.js" -ForegroundColor White
Write-Host ""
Write-Host "Or with PM2:" -ForegroundColor Cyan
Write-Host "  pm2 start .next\standalone\server.js --name logistics-system" -ForegroundColor White
Write-Host "  pm2 save" -ForegroundColor White
Write-Host ""
Write-Host "PM2 useful commands:" -ForegroundColor Gray
Write-Host "  pm2 logs logistics-system    # View logs" -ForegroundColor Gray
Write-Host "  pm2 restart logistics-system # Restart" -ForegroundColor Gray
Write-Host "  pm2 stop logistics-system    # Stop" -ForegroundColor Gray
Write-Host "  pm2 monit                    # Monitor" -ForegroundColor Gray
Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Gray
Write-Host "  - White screen / missing CSS? Check .next\standalone\.next\static exists" -ForegroundColor Gray
Write-Host "  - Missing images? Check .next\standalone\public exists" -ForegroundColor Gray
Write-Host "  - DB errors? Check .env has correct DATABASE_URL" -ForegroundColor Gray
Write-Host "  - Port in use? Set PORT env var: `$env:PORT=3001; node .next\standalone\server.js" -ForegroundColor Gray
Write-Host ""
