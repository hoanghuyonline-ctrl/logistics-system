@echo off
echo ============================================
echo   Bac Trung Hai Logistics - Windows Deploy
echo ============================================

cd /d D:\BacTrungHai\logistics-system
echo [1/7] Pulling latest code from GitHub...
git pull origin main

echo [2/7] Running database migrations...
call npx.cmd prisma migrate deploy

echo [2.5/7] Replacing legacy domain references in database...
call npx.cmd tsx scripts/replace-legacy-domain.ts

echo [3/7] Installing dependencies...
call npm.cmd install

echo [4/7] Building Next.js (standalone)...
call npm.cmd run build

echo [5/7] Copying static and public assets to standalone...
xcopy /E /I /Y .next\static .next\standalone\.next\static
xcopy /E /I /Y public .next\standalone\public
xcopy /E /I /Y prisma .next\standalone\prisma

echo [6/7] Copying environment files to standalone...
if exist .env copy /Y .env .next\standalone\.env
if exist .env.local copy /Y .env.local .next\standalone\.env.local
if exist .env.production copy /Y .env.production .next\standalone\.env.production

echo [7/7] Restarting PM2 process (standalone server)...
call npx.cmd pm2 restart logistics-system || call npx.cmd pm2 start ecosystem.config.js

echo ============================================
echo   Deploy completed successfully!
echo ============================================
