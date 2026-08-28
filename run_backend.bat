@echo off
echo Starting AI-Based Smart Classroom Monitoring System - Backend...
cd /d "%~dp0"
call venv\Scripts\activate.bat
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
pause
