@echo off
echo ============================================
echo   Nam Trung Hai Logistics - Windows Deploy
echo ============================================

cd /d D:\BacTrungHai\logistics-system
echo [1/6] Pulling latest code from GitHub...
git pull origin main

echo [2/6] Running database migrations...
call npx.cmd prisma migrate deploy

echo [2.5/6] Replacing legacy domain references in database...
call npx.cmd tsx scripts/replace-legacy-domain.ts

echo [3/6] Installing dependencies...
call npm.cmd install

echo [4/6] Building Next.js (standalone)...
call npm.cmd run build

echo [5/6] Copying static and public assets...
xcopy /E /I /Y .next\static .next\standalone\.next\static
xcopy /E /I /Y public .next\standalone\public
xcopy /E /I /Y prisma .next\standalone\prisma

echo [6/6] Restarting PM2 process...
call npx.cmd pm2 restart logistics-system || call npx.cmd pm2 start ecosystem.config.js

echo ============================================
echo   Deploy completed successfully!
echo ============================================
