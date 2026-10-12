@echo off
setlocal
echo ========================================================
echo   Starting AI Sign Recognition Suite (v2.0)
echo ========================================================
echo.

:: Check for python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found in PATH. Please install Python 3.10+
    pause
    exit /b 1
)

:: Check for node
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/npm not found in PATH. Please install Node.js 18+
    pause
    exit /b 1
)

echo Starting Flask Backend on http://localhost:5000...
start "AI Sign Backend" cmd /k "python main.py"

echo Starting React Frontend on http://localhost:5173...
start "AI Sign Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   Services Launched!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000/api/health
echo ========================================================
echo.
pause
