@echo off
echo Starting Cordova Stays Backend (http://localhost:8000) and Frontend (http://localhost:5173)...
start "Cordova Stays Backend" cmd /k "cd /d C:\Jeason Final\backend && set PHP_INI_SCAN_DIR=C:\Jeason Final\backend\php-ini && php artisan serve --port=8000"
start "Cordova Stays Frontend" cmd /k "cd /d C:\Jeason Final\frontend && npm run dev"
