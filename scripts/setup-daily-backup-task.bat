@echo off
REM ============================================================
REM  setup-daily-backup-task.bat
REM  Tao lich sao luu tu dong PostgreSQL moi ngay luc 02:00 AM
REM  Su dung Windows Task Scheduler
REM  Chay voi quyen Administrator: scripts\setup-daily-backup-task.bat
REM ============================================================

setlocal

set TASK_NAME=BacTrungHai-Daily-Database-Backup
set BACKUP_SCRIPT=%~dp0backup-db.bat
set SCHEDULE_TIME=02:00

REM --- Kiem tra quyen Administrator ---
net session >nul 2>&1
if errorlevel 1 (
    echo [LOI] Can chay voi quyen Administrator!
    echo       Click phai file nay ^> Run as administrator
    pause
    exit /b 1
)

REM --- Kiem tra file backup-db.bat ton tai ---
if not exist "%BACKUP_SCRIPT%" (
    echo [LOI] Khong tim thay: %BACKUP_SCRIPT%
    echo       Dam bao file backup-db.bat nam trong thu muc scripts\
    pause
    exit /b 1
)

REM --- Kiem tra task da ton tai chua ---
schtasks /query /tn "%TASK_NAME%" >nul 2>&1
if not errorlevel 1 (
    echo [INFO] Task "%TASK_NAME%" da ton tai.
    echo        Xoa task cu truoc khi tao moi...
    schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1
)

REM --- Tao scheduled task ---
echo [INFO] Dang tao lich sao luu tu dong...
echo        Ten task:  %TASK_NAME%
echo        Lich chay: Moi ngay luc %SCHEDULE_TIME%
echo        Script:    %BACKUP_SCRIPT%
echo.

schtasks /create ^
    /tn "%TASK_NAME%" ^
    /tr "cmd.exe /c \"%BACKUP_SCRIPT%\"" ^
    /sc daily ^
    /st %SCHEDULE_TIME% ^
    /rl highest ^
    /f

if errorlevel 1 (
    echo.
    echo [LOI] Khong the tao scheduled task!
    echo       Thu chay lai voi quyen Administrator.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo [OK] Da tao lich sao luu tu dong thanh cong!
echo.
echo  Ten task:    %TASK_NAME%
echo  Chay luc:    %SCHEDULE_TIME% moi ngay
echo  Script:      %BACKUP_SCRIPT%
echo  Luu backup:  backups\postgres\
echo  Giu lai:     7 file moi nhat (xoa tu dong file cu)
echo.
echo  Kiem tra:    schtasks /query /tn "%TASK_NAME%"
echo  Chay thu:    schtasks /run /tn "%TASK_NAME%"
echo  Xoa task:    scripts\remove-daily-backup-task.bat
echo ============================================================
echo.
pause
exit /b 0
