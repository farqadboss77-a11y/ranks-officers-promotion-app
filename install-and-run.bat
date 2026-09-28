@echo off
REM تطبيق ترقية المراتب والضباط - سكريبت التثبيت والتشغيل
REM Installation and Run Script for Officers Promotion App

echo.
echo ==========================================
echo تطبيق ترقية المراتب والضباط
echo Officers Promotion Management System
echo ==========================================
echo.

REM فحص Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Node.js غير مثبت على الجهاز
    echo ❌ Node.js is not installed
    echo.
    echo يرجى تحميل وتثبيت Node.js من:
    echo Please download and install Node.js from:
    echo https://nodejs.org/
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
    echo ❌ npm غير مثبت
    pause
    exit /b 1
)

echo ✅ npm متوفر
npm --version
echo.

REM تثبيت المكتبات
echo ⏳ جاري تثبيت المكتبات المطلوبة...
echo ⏳ Installing required dependencies...
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

REM بدء التطبيق
echo 🚀 جاري تشغيل التطبيق...
echo 🚀 Starting the application...
echo.
echo 📱 سيتم فتح التطبيق على:
echo 📱 Application will open at:
echo 👉 http://localhost:3000
echo.
echo اضغط Ctrl+C لإيقاف التطبيق
echo Press Ctrl+C to stop the application
echo.
timeout /t 2

call npm start
pause
