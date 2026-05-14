@echo off
REM ============================================================
REM  remove-daily-backup-task.bat
REM  Xoa lich sao luu tu dong PostgreSQL khoi Task Scheduler
REM  Chay voi quyen Administrator: scripts\remove-daily-backup-task.bat
REM ============================================================

setlocal

set TASK_NAME=BacTrungHai-Daily-Database-Backup

REM --- Kiem tra quyen Administrator ---
net session >nul 2>&1
if errorlevel 1 (
    echo [LOI] Can chay voi quyen Administrator!
    echo       Click phai file nay ^> Run as administrator
    pause
    exit /b 1
)

REM --- Kiem tra task co ton tai khong ---
schtasks /query /tn "%TASK_NAME%" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Task "%TASK_NAME%" khong ton tai.
    echo        Khong can xoa.
    pause
    exit /b 0
)

REM --- Xac nhan xoa ---
echo [CANH BAO] Ban sap xoa lich sao luu tu dong:
echo            Task: %TASK_NAME%
echo.
set /p CONFIRM="Xac nhan xoa? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo [HUY] Khong xoa. Thoat.
    pause
    exit /b 0
)

REM --- Xoa task ---
schtasks /delete /tn "%TASK_NAME%" /f

if errorlevel 1 (
    echo.
    echo [LOI] Khong the xoa task!
    echo       Thu chay lai voi quyen Administrator.
    pause
    exit /b 1
)

echo.
echo [OK] Da xoa lich sao luu tu dong: %TASK_NAME%
echo      Backup se khong chay tu dong nua.
echo      Cac file backup cu van duoc giu lai trong backups\postgres\
echo.
echo      De cai lai: scripts\setup-daily-backup-task.bat
echo.
pause
exit /b 0
