@echo off
chcp 65001 >nul
title Instagram Tracker - Ngrok Permanent Server
cd /d %~dp0
python run_ngrok.py
pause
