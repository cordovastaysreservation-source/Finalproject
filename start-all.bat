@echo off
set "PHP_DIR=C:\Users\Inting\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe"
set "PATH=%PHP_DIR%;%PATH%"

echo Starting Cordova Stays Backend (http://localhost:8000) and Frontend (http://localhost:5173)...

start "Cordova Stays Backend" cmd /k "cd /d ""%~dp0backend"" && set ""PATH=%PHP_DIR%;%%PATH%%"" && php artisan serve --port=8000"
start "Cordova Stays Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"
