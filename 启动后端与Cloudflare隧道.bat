@echo off
chcp 65001 >nul
title Instagram Tracker - Cloudflare Tunnel
cd /d %~dp0
python run_tunnel.py
pause
