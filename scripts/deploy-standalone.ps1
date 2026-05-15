# Deploy standalone Next.js server with static assets (Windows PowerShell)
# Usage: powershell -File scripts\deploy-standalone.ps1
#
# After running this script, start the server with:
#   node .next\standalone\server.js
# or:
#   pm2 start .next\standalone\server.js --name logistics-system

$ErrorActionPreference = "Stop"

Write-Host "=== Standalone Deploy ===" -ForegroundColor Cyan

# 1. Build
Write-Host "[1/4] Building Next.js..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

# 2. Copy static assets into standalone output
Write-Host "[2/4] Copying .next\static -> .next\standalone\.next\static" -ForegroundColor Yellow
if (Test-Path ".next\standalone\.next\static") {
    Remove-Item -Recurse -Force ".next\standalone\.next\static"
}
Copy-Item -Recurse -Force ".next\static" ".next\standalone\.next\static"

# 3. Copy public assets into standalone output
Write-Host "[3/4] Copying public -> .next\standalone\public" -ForegroundColor Yellow
if (Test-Path ".next\standalone\public") {
    Remove-Item -Recurse -Force ".next\standalone\public"
}
Copy-Item -Recurse -Force "public" ".next\standalone\public"

# 4. Copy Prisma files
Write-Host "[4/4] Copying Prisma files..." -ForegroundColor Yellow
if (Test-Path "prisma") {
    Copy-Item -Recurse -Force "prisma" ".next\standalone\prisma"
}
if (Test-Path "prisma.config.ts") {
    Copy-Item -Force "prisma.config.ts" ".next\standalone\prisma.config.ts"
}
if (Test-Path "node_modules\.prisma") {
    New-Item -ItemType Directory -Force -Path ".next\standalone\node_modules\.prisma" | Out-Null
    Copy-Item -Recurse -Force "node_modules\.prisma\*" ".next\standalone\node_modules\.prisma\"
}

Write-Host ""
Write-Host "=== Deploy complete ===" -ForegroundColor Green
Write-Host "Start server:"
Write-Host "  node .next\standalone\server.js"
Write-Host "  # or"
Write-Host "  pm2 start .next\standalone\server.js --name logistics-system"
