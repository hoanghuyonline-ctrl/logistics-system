@echo off
cd /d D:\BacTrungHai\logistics-system
echo ============================================
echo   Bac Trung Hai Logistics - Full Rebuild
echo ============================================

echo [1/7] Pulling latest code...
git pull origin main

echo [2/7] Stopping PM2 process...
call npx.cmd pm2 delete logistics-system 2>nul

echo [3/7] Cleaning .next directory...
if exist .next rmdir .next /s /q

echo [4/7] Building application...
call npm.cmd run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build failed!
    exit /b %ERRORLEVEL%
)

echo [5/7] Copying static assets to standalone...
xcopy /E /I /Y .next\static .next\standalone\.next\static
xcopy /E /I /Y public .next\standalone\public

echo [6/7] Copying environment files to standalone...
if exist .env copy /Y .env .next\standalone\.env
if exist .env.local copy /Y .env.local .next\standalone\.env.local
if exist .env.production copy /Y .env.production .next\standalone\.env.production

echo [7/7] Starting PM2 with standalone server...
call npx.cmd pm2 start ecosystem.config.js
call npx.cmd pm2 save

echo ============================================
echo   Deploy completed successfully!
echo ============================================
