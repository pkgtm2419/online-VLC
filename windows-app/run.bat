@echo off
title PVP (Personal Video Player) - Windows Desktop
echo Starting PVP Desktop...
python pvp_desktop.py
if errorlevel 1 (
    echo.
    echo Make sure Python and dependencies are installed:
    echo pip install -r requirements.txt
    pause
)
