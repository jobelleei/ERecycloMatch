@echo off
REM ERecycloMatch presentation server: Apache + MySQL (admin site), FastAPI (YOLO), ngrok (public URL).
REM Public URL never changes: https://emcee-fence-squatted.ngrok-free.dev

set NGROK_URL=emcee-fence-squatted.ngrok-free.dev

echo Starting Apache...
start "Apache" /min cmd /c C:\xampp\apache_start.bat
echo Starting MySQL...
start "MySQL" /min cmd /c C:\xampp\mysql_start.bat

echo Starting YOLO (FastAPI on port 8080)...
start "YOLO" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 127.0.0.1 --port 8080"

echo Starting ngrok...
start "ngrok" cmd /k "%LOCALAPPDATA%\Microsoft\WindowsApps\ngrok.exe http --url=%NGROK_URL% 80"

echo.
echo Wait about 30 seconds for YOLO to load, then check on a phone using MOBILE DATA:
echo   Scanner:  https://%NGROK_URL%/yolo/
echo   Admin:    https://%NGROK_URL%/admin_syde/admin_UI/login.php
echo.
echo Keep all the opened windows running. Close them to stop the server.
pause
