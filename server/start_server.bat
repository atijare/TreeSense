@echo off
echo ========================================
echo Tree Classification API Server
echo ========================================
echo.

REM Use Python 3.12 from the user's AppData
set PYTHON_PATH=%LOCALAPPDATA%\Programs\Python\Python312\python.exe

REM Check if Python exists
if not exist "%PYTHON_PATH%" (
    echo ERROR: Python 3.12 not found at %PYTHON_PATH%
    echo.
    echo Please install Python 3.12 or update the path in this script
    echo.
    pause
    exit /b 1
)

echo Python found: %PYTHON_PATH%
echo.

REM Install dependencies if needed
echo Installing/checking dependencies...
"%PYTHON_PATH%" -m pip install -q flask flask-cors tensorflow pillow numpy
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Try running manually: python -m pip install -r requirements.txt
    pause
    exit /b 1
)

echo.
echo ========================================
echo Starting server...
echo ========================================
echo.
echo Server will be available at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

REM Start the server
"%PYTHON_PATH%" app.py

pause

