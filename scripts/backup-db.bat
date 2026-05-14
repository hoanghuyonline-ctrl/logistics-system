@echo off
REM ============================================================
REM  backup-db.bat — Sao luu PostgreSQL cho BAC TRUNG HAI LOGISTICS
REM  Chay: scripts\backup-db.bat
REM  Tu dong tao thu muc, backup, va xoa file cu hon 7 ngay.
REM ============================================================

setlocal enabledelayedexpansion

REM --- Cau hinh ---
set CONTAINER=logistics-postgres
set DB_USER=postgres
set DB_NAME=logistics_db
set BACKUP_DIR=%~dp0..\backups\postgres
set KEEP_DAYS=7

REM --- Tao thu muc backup neu chua co ---
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
    echo [INFO] Da tao thu muc: %BACKUP_DIR%
)

REM --- Tao ten file backup voi timestamp ---
for /f "tokens=1-6 delims=/:. " %%a in ("%date% %time%") do (
    set TIMESTAMP=%%a-%%b-%%c-%%d-%%e
)

REM Fallback: dung wmic neu dinh dang date khong chuan
if "%TIMESTAMP%"=="" (
    for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /format:list 2^>nul') do set DT=%%i
    set TIMESTAMP=!DT:~0,4!-!DT:~4,2!-!DT:~6,2!-!DT:~8,2!-!DT:~10,2!
)

set FILENAME=postgres-%TIMESTAMP%.sql
set FILEPATH=%BACKUP_DIR%\%FILENAME%

REM --- Kiem tra file da ton tai chua (khong ghi de) ---
if exist "%FILEPATH%" (
    echo [SKIP] File da ton tai: %FILEPATH%
    echo        Khong ghi de. Thu lai sau 1 phut.
    exit /b 0
)

REM --- Kiem tra Docker container dang chay ---
docker ps --format "{{.Names}}" | findstr /i "%CONTAINER%" >nul 2>&1
if errorlevel 1 (
    echo [LOI] Container "%CONTAINER%" khong chay!
    echo       Chay: docker start %CONTAINER%
    echo       Sau do thu lai.
    exit /b 1
)

REM --- Chay backup ---
echo [INFO] Dang backup database...
echo        Container: %CONTAINER%
echo        Database:  %DB_NAME%
echo        File:      %FILEPATH%

docker exec %CONTAINER% pg_dump -U %DB_USER% %DB_NAME% > "%FILEPATH%" 2>nul

REM --- Kiem tra ket qua ---
if errorlevel 1 (
    echo [LOI] Backup that bai!
    echo       Kiem tra: docker ps ^| findstr postgres
    echo       Kiem tra: docker logs %CONTAINER% --tail 20
    if exist "%FILEPATH%" del "%FILEPATH%"
    exit /b 1
)

REM Kiem tra file co du lieu khong
for %%F in ("%FILEPATH%") do set FILESIZE=%%~zF
if "%FILESIZE%"=="0" (
    echo [LOI] File backup rong (0 bytes)!
    echo       Database co the trong hoac container loi.
    del "%FILEPATH%"
    exit /b 1
)

echo [OK] Backup thanh cong!
echo      File: %FILEPATH%
echo      Dung luong: %FILESIZE% bytes

REM --- Xoa backup cu hon %KEEP_DAYS% ngay ---
echo.
echo [INFO] Xoa backup cu hon %KEEP_DAYS% ngay...
set DELETED=0
forfiles /p "%BACKUP_DIR%" /m "postgres-*.sql" /d -%KEEP_DAYS% /c "cmd /c echo [XOA] @file & del @path" 2>nul
if not errorlevel 1 (
    echo [OK] Da xoa backup cu.
) else (
    echo [INFO] Khong co backup cu de xoa.
)

REM --- Hien thi danh sach backup hien tai ---
echo.
echo === Danh sach backup hien tai ===
dir /b /o-d "%BACKUP_DIR%\postgres-*.sql" 2>nul
echo ==================================

echo.
echo Hoan tat. Hen gap lai ngay mai!
exit /b 0
