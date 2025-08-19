@echo off
echo Checking if dev server is already running...

netstat -ano | findstr :5173 >nul
if %errorlevel% equ 0 (
    echo.
    echo ❌ Dev server already running on port 5173
    echo.
    echo To stop it, find the PID and run:
    echo   taskkill /PID [PID] /F
    echo.
    echo Or check what's running:
    echo   netstat -ano | findstr :5173
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ Port 5173 is free, starting dev server...
    echo.
    npm run dev
)
