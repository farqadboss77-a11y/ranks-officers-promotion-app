@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

color 1E
cls

echo.
echo ╔═════════════════════════════════════════════╗
echo ║   نظام ترقية المراتب والضباط                ║
echo ║   Officers Promotion Management System      ║
echo ╚═════════════════════════════════════════════╝
echo.

REM فحص Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ خطأ: Node.js غير مثبت على الجهاز
    echo ❌ Error: Node.js is not installed
    echo.
    echo 📥 يرجى تحميل Node.js من:
    echo 📥 Please download Node.js from:
    echo.    https://nodejs.org/en/download/
    echo.
    echo 📝 بعد التثبيت:
    echo 📝 After installation:
    echo.    1. اعد تشغيل الكمبيوتر
    echo.    1. Restart your computer
    echo.    2. قم بتشغيل هذا الملف مجدداً
    echo.    2. Run this file again
    echo.
    pause
    exit /b 1
)

echo ✅ تم العثور على Node.js
echo ✅ Node.js found
node --version
echo.

REM فحص npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm غير متوفر
    pause
    exit /b 1
)

echo ✅ npm متوفر
npm --version
echo.

REM التحقق من وجود package.json
if not exist package.json (
    echo ❌ خطأ: لم يتم العثور على package.json
    echo ❌ Error: package.json not found
    echo.
    echo تأكد من وجود الملف في نفس المجلد
    pause
    exit /b 1
)

echo.
echo ⏳ جاري تثبيت المكتبات...
echo ⏳ Installing dependencies...
echo.

call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ فشل التثبيت
    echo ❌ Installation failed
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ تم تثبيت المكتبات بنجاح
echo ✅ Dependencies installed successfully
echo.
echo 🚀 جاري تشغيل التطبيق...
echo 🚀 Starting application...
echo.
echo ╔═════════════════════════════════════════════╗
echo ║  👉 http://localhost:3000                   ║
echo ║  سيفتح المتصفح تلقائياً                     ║
echo ║  Browser will open automatically             ║
echo ╚═════════════════════════════════════════════╝
echo.
echo ⏸️  اضغط Ctrl+C لإيقاف التطبيق
echo ⏸️  Press Ctrl+C to stop the application
echo.

timeout /t 2 /nobreak

start http://localhost:3000

call npm start

pause
