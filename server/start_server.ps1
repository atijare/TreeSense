# Tree Classification API Server Startup Script (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tree Classification API Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Use Python 3.12 from the user's AppData
$pythonPath = "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe"

# Check if Python exists
if (-not (Test-Path $pythonPath)) {
    Write-Host "ERROR: Python 3.12 not found at $pythonPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Python 3.12 or update the path in this script" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Python found: $pythonPath" -ForegroundColor Green
Write-Host ""

# Install dependencies if needed
Write-Host "Installing/checking dependencies..." -ForegroundColor Yellow
& $pythonPath -m pip install -q flask flask-cors tensorflow pillow numpy
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    Write-Host "Try running manually: python -m pip install -r requirements.txt" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server will be available at: http://localhost:5000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
& $pythonPath app.py

