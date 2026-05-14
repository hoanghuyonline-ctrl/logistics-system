@echo off
REM ============================================================
REM  backup-uploads.bat — Sao luu thu muc uploads
REM  Chay: scripts\backup-uploads.bat
REM  Nen thu muc uploads thanh file .zip voi timestamp.
REM ============================================================

setlocal enabledelayedexpansion

REM --- Cau hinh ---
set UPLOADS_DIR=%~dp0..\uploads
set BACKUP_DIR=%~dp0..\backups\uploads
set KEEP_DAYS=7

REM --- Kiem tra thu muc uploads co ton tai khong ---
if not exist "%UPLOADS_DIR%" (
    echo [INFO] Thu muc uploads khong ton tai: %UPLOADS_DIR%
    echo        Khong co gi de backup.
    exit /b 0
)

REM --- Kiem tra thu muc uploads co file khong ---
dir /b "%UPLOADS_DIR%\*" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Thu muc uploads trong. Khong co gi de backup.
    exit /b 0
)

REM --- Tao thu muc backup neu chua co ---
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
    echo [INFO] Da tao thu muc: %BACKUP_DIR%
)

REM --- Tao ten file voi timestamp ---
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /format:list 2^>nul') do set DT=%%i
set TIMESTAMP=!DT:~0,4!-!DT:~4,2!-!DT:~6,2!-!DT:~8,2!-!DT:~10,2!

set FILENAME=uploads-%TIMESTAMP%.zip
set FILEPATH=%BACKUP_DIR%\%FILENAME%

REM --- Kiem tra file da ton tai chua ---
if exist "%FILEPATH%" (
    echo [SKIP] File da ton tai: %FILEPATH%
    exit /b 0
)

REM --- Nen uploads thanh zip ---
echo [INFO] Dang nen thu muc uploads...
echo        Nguon: %UPLOADS_DIR%
echo        File:  %FILEPATH%

powershell -NoProfile -Command "Compress-Archive -Path '%UPLOADS_DIR%\*' -DestinationPath '%FILEPATH%'" 2>nul

if errorlevel 1 (
    echo [LOI] Nen that bai!
    echo       Kiem tra PowerShell va quyen truy cap thu muc.
    exit /b 1
)

REM --- Kiem tra file zip ---
for %%F in ("%FILEPATH%") do set FILESIZE=%%~zF
echo [OK] Backup uploads thanh cong!
echo      File: %FILEPATH%
echo      Dung luong: %FILESIZE% bytes

REM --- Xoa backup cu hon %KEEP_DAYS% ngay ---
echo.
echo [INFO] Xoa backup uploads cu hon %KEEP_DAYS% ngay...
forfiles /p "%BACKUP_DIR%" /m "uploads-*.zip" /d -%KEEP_DAYS% /c "cmd /c echo [XOA] @file & del @path" 2>nul
if not errorlevel 1 (
    echo [OK] Da xoa backup cu.
) else (
    echo [INFO] Khong co backup cu de xoa.
)

REM --- Hien thi danh sach ---
echo.
echo === Danh sach backup uploads ===
dir /b /o-d "%BACKUP_DIR%\uploads-*.zip" 2>nul
echo =================================

echo.
echo Hoan tat.
exit /b 0
