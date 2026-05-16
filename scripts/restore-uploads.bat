@echo off
REM ============================================================
REM  restore-uploads.bat — Khoi phuc thu muc uploads tu file zip
REM  Chay: scripts\restore-uploads.bat [duong-dan-file.zip]
REM  Neu khong chi dinh file, script se liet ke cac file backup
REM  va cho ban chon.
REM ============================================================

setlocal enabledelayedexpansion

REM --- Cau hinh ---
set UPLOADS_DIR=%~dp0..\uploads
set BACKUP_DIR=%~dp0..\backups\uploads

REM --- Xac dinh file backup ---
set BACKUP_FILE=%~1

if "%BACKUP_FILE%"=="" (
    REM Khong co tham so — liet ke file backup de chon
    echo.
    echo === Danh sach file backup uploads hien co ===
    echo.

    if not exist "%BACKUP_DIR%" (
        echo [LOI] Thu muc backup khong ton tai: %BACKUP_DIR%
        echo       Chua co backup nao. Chay scripts\backup-uploads.bat truoc.
        exit /b 1
    )

    set COUNT=0
    for /f "delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%\uploads-*.zip" 2^>nul') do (
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
echo  CANH BAO: KHOI PHUC THU MUC UPLOADS
echo ============================================================
echo.
echo  File backup:  %BACKUP_FILE%
echo  Dung luong:   %FILESIZE% bytes
echo  Thu muc:      %UPLOADS_DIR%
echo.
echo  Thu muc uploads hien tai se bi XOA va thay the
echo  bang noi dung tu file backup.
echo.
echo ============================================================
echo.
set /p CONFIRM="Nhap 'YES' de xac nhan khoi phuc, bat ky phim khac de huy: "

if /i not "%CONFIRM%"=="YES" (
    echo [HUY] Khong khoi phuc. Thu muc uploads khong bi thay doi.
    exit /b 0
)

REM --- Backup thu muc uploads hien tai (phong truong hop) ---
if exist "%UPLOADS_DIR%" (
    set TEMP_BACKUP=%UPLOADS_DIR%-old-%RANDOM%
    echo [INFO] Doi ten thu muc uploads hien tai thanh: !TEMP_BACKUP!
    rename "%UPLOADS_DIR%" "uploads-old-%RANDOM%" >nul 2>&1
)

REM --- Tao thu muc uploads moi ---
if not exist "%UPLOADS_DIR%" (
    mkdir "%UPLOADS_DIR%"
)

REM --- Giai nen file backup ---
echo [INFO] Dang giai nen file backup...
powershell -NoProfile -Command "Expand-Archive -Path '%BACKUP_FILE%' -DestinationPath '%UPLOADS_DIR%' -Force" 2>nul

if errorlevel 1 (
    echo.
    echo [LOI] Giai nen that bai!
    echo       Kiem tra PowerShell va quyen truy cap thu muc.
    echo       File backup co the bi hong.
    exit /b 1
)

REM --- Kiem tra ket qua ---
dir /b "%UPLOADS_DIR%\*" >nul 2>&1
if errorlevel 1 (
    echo [CANH BAO] Thu muc uploads trong sau khi giai nen.
    echo            File backup co the khong co du lieu.
) else (
    echo.
    echo ============================================================
    echo [OK] Khoi phuc uploads thanh cong!
    echo.
    echo  File backup:  %BACKUP_FILE%
    echo  Thu muc:      %UPLOADS_DIR%
    echo.
    echo  Kiem tra:
    echo    dir "%UPLOADS_DIR%"
    echo    Truy cap web va kiem tra hinh anh/file dinh kem
    echo ============================================================
)

echo.
exit /b 0
