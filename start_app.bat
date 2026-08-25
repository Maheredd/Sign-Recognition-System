@echo off
echo Starting Sign Recognition App...

:: Start Backend in a new window
start "Flask Backend" cmd /k "python main.py"

:: Start Frontend in a new window
cd frontend
start "React Frontend" cmd /k "npm run dev"

echo Application started!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
pause
