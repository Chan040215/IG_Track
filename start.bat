@echo off
title Instagram Tracker
color 0b
echo ============================================================
echo        Instagram Tracker (Web Dashboard)
echo ============================================================
echo.
echo Starting backend server...
start "" http://localhost:8000/
echo [Server Running] Browser opening: http://localhost:8000/
echo Keep this window open while using the application.
echo.
cd /d "%~dp0backend"
python "%~dp0backend\server.py"
pause
