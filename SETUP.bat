@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
color 1E
cls

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   نظام ترقية المراتب والضباط                             ║
echo ║   Officers Promotion Management System                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM فحص Node.js
echo [1/5] فحص Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ خطأ: Node.js غير مثبت!
    echo ❌ Error: Node.js is not installed!
    echo.
    echo 📥 حمّل من:
    echo https://nodejs.org/en/download/
    echo.
    echo بعد التثبيت:
    echo 1. أعد تشغيل الكمبيوتر
    echo 2. شغّل هذا الملف مجددًا
    echo.
    pause
    exit /b 1
)

echo ✅ تم العثور على Node.js
node --version
echo.

REM فحص npm
echo [2/5] فحص npm...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm غير متوفر
    pause
    exit /b 1
)

echo ✅ npm متوفر
npm --version
echo.

REM تنظيف package-lock
echo [3/5] تنظيف الملفات المؤقتة...
if exist package-lock.json (
    del /f /q package-lock.json
    echo ✅ تم حذف package-lock.json
)

if exist node_modules (
    rmdir /s /q node_modules
    echo ✅ تم حذف node_modules
)

echo.

REM تثبيت المكتبات
echo [4/5] تثبيت المكتبات...
echo.
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ فشل التثبيت!
    echo.
    echo جرّب:
    echo npm cache clean --force
    echo npm install
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ تم تثبيت المكتبات بنجاح!
echo.

REM بدء التطبيق
echo [5/5] تشغيل التطبيق...
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  🚀 الخادم سيبدأ الآن...                                  ║
echo ║  🌐 http://localhost:3000                                  ║
echo ║  سيتم فتح المتصفح تلقائياً                                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

timeout /t 2 /nobreak

REM فتح المتصفح
start http://localhost:3000

REM بدء الخادم
call npm start

pause
