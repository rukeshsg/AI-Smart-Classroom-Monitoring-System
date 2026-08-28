@echo off
echo Launching AI-Based Smart Classroom Monitoring System...
start "Smart Classroom Monitoring - Backend" cmd /k "%~dp0run_backend.bat"
start "Smart Classroom Monitoring - Command Center Frontend" cmd /k "%~dp0run_frontend.bat"
echo Services starting!
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
