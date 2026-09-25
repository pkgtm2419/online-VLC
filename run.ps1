# CleanPlay PowerShell Launcher
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  CleanPlay - Ad-Free Universal Video Player" -ForegroundColor Green
Write-Host "  Starting server at http://localhost:8000 ..." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Open browser in background
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:8000"
} | Out-Null

& "$scriptDir\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
