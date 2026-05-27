@echo off
REM ============================================================
REM  restore-db.bat — Khoi phuc PostgreSQL tu file backup
REM  Chay: scripts\restore-db.bat [duong-dan-file-backup.sql]
REM  Neu khong chi dinh file, script se liet ke cac file backup
REM  va cho ban chon.
REM ============================================================

setlocal enabledelayedexpansion

REM --- Cau hinh ---
set CONTAINER=logistics-postgres
set DB_USER=postgres
set DB_NAME=logistics_db
set BACKUP_DIR=%~dp0..\backups\postgres

REM --- Kiem tra Docker container dang chay ---
docker ps --format "{{.Names}}" | findstr /i "%CONTAINER%" >nul 2>&1
if errorlevel 1 (
    echo [LOI] Container "%CONTAINER%" khong chay!
    echo       Chay: docker start %CONTAINER%
    echo       Sau do thu lai.
    exit /b 1
)

REM --- Xac dinh file backup ---
set BACKUP_FILE=%~1

if "%BACKUP_FILE%"=="" (
    REM Khong co tham so — liet ke file backup de chon
    echo.
    echo === Danh sach file backup hien co ===
    echo.

    if not exist "%BACKUP_DIR%" (
        echo [LOI] Thu muc backup khong ton tai: %BACKUP_DIR%
        echo       Chua co backup nao. Chay scripts\backup-db.bat truoc.
        exit /b 1
    )

    set COUNT=0
    for /f "delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%\postgres-*.sql" 2^>nul') do (
        set /a COUNT+=1
        set "FILE_!COUNT!=%%F"
        for %%S in ("%BACKUP_DIR%\%%F") do (
            echo   !COUNT!. %%F  ^(%%~zS bytes^)
        )
    )

    if !COUNT!==0 (
        echo [LOI] Khong tim thay file backup nao trong: %BACKUP_DIR%
        exit /b 1
    )

    echo.
    set /p CHOICE="Nhap so thu tu file muon khoi phuc (1-%COUNT%), hoac 'q' de huy: "

    if /i "!CHOICE!"=="q" (
        echo [HUY] Khong khoi phuc.
        exit /b 0
    )

    set "BACKUP_FILE=%BACKUP_DIR%\!FILE_%CHOICE%!"

    if "!BACKUP_FILE!"=="%BACKUP_DIR%\" (
        echo [LOI] Lua chon khong hop le.
        exit /b 1
    )
)

REM --- Kiem tra file backup ton tai ---
if not exist "%BACKUP_FILE%" (
    echo [LOI] File backup khong ton tai: %BACKUP_FILE%
    exit /b 1
)

REM --- Kiem tra file co du lieu ---
for %%F in ("%BACKUP_FILE%") do set FILESIZE=%%~zF
if "%FILESIZE%"=="0" (
    echo [LOI] File backup rong (0 bytes): %BACKUP_FILE%
    exit /b 1
)

REM --- Canh bao truoc khi khoi phuc ---
echo.
echo ============================================================
echo  CANH BAO: KHOI PHUC DATABASE
echo ============================================================
echo.
echo  File backup:  %BACKUP_FILE%
echo  Dung luong:   %FILESIZE% bytes
echo  Database:     %DB_NAME%
echo  Container:    %CONTAINER%
echo.
echo  THAO TAC NAY SE GHI DE TOAN BO DU LIEU HIEN TAI!
echo  Dam bao ban da backup du lieu hien tai truoc khi tiep tuc.
echo.
echo ============================================================
echo.
set /p CONFIRM="Nhap 'YES' de xac nhan khoi phuc, bat ky phim khac de huy: "

if /i not "%CONFIRM%"=="YES" (
    echo [HUY] Khong khoi phuc. Du lieu hien tai khong bi thay doi.
    exit /b 0
)

REM --- Dung PM2 truoc khi restore ---
echo.
echo [INFO] Dang dung ung dung (PM2)...
pm2 stop logistics-system >nul 2>&1

REM --- Xoa va tao lai database ---
echo [INFO] Dang xoa database cu...
docker exec %CONTAINER% psql -U %DB_USER% -c "DROP DATABASE IF EXISTS %DB_NAME%;" >nul 2>&1
echo [INFO] Dang tao database moi...
docker exec %CONTAINER% psql -U %DB_USER% -c "CREATE DATABASE %DB_NAME%;" >nul 2>&1

REM --- Khoi phuc du lieu ---
echo [INFO] Dang khoi phuc du lieu tu backup...
docker exec -i %CONTAINER% psql -U %DB_USER% %DB_NAME% < "%BACKUP_FILE%" >nul 2>&1

if errorlevel 1 (
    echo.
    echo [LOI] Khoi phuc that bai!
    echo       Kiem tra: docker logs %CONTAINER% --tail 20
    echo       Thu khoi dong lai PM2: pm2 restart logistics-system
    exit /b 1
)

REM --- Khoi dong lai PM2 ---
echo [INFO] Dang khoi dong lai ung dung...
pm2 restart logistics-system >nul 2>&1

REM --- Kiem tra ket qua ---
echo.
echo ============================================================
echo [OK] Khoi phuc database thanh cong!
echo.
echo  File backup:  %BACKUP_FILE%
echo  Database:     %DB_NAME%
echo.
echo  Kiem tra:
echo    pm2 status
echo    pm2 logs logistics-system --lines 20
echo    Truy cap: https://bactrunghai.vn va dang nhap thu
echo ============================================================
echo.
exit /b 0
