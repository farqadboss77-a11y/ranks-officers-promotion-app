#!/bin/bash

# نظام ترقية المراتب والضباط - سكريبت التشغيل
# Officers Promotion Management System - Start Script

echo ""
echo "╔════���════════════════════════════════════════╗"
echo "║   نظام ترقية المراتب والضباط                ║"
echo "║   Officers Promotion Management System      ║"
echo "╚═════════════════════════════════════════════╝"
echo ""

# فحص Node.js
if ! command -v node &> /dev/null; then
    echo "❌ خطأ: Node.js غير مثبت"
    echo "❌ Error: Node.js is not installed"
    echo ""
    echo "📥 يرجى تحميل Node.js من:"
    echo "📥 Please download Node.js from:"
    echo "   https://nodejs.org/"
    echo ""
    echo "📝 أو استخدم مدير الحزم:"
    echo "📝 Or use package manager:"
    echo ""
    echo "   macOS:"
    echo "   brew install node"
    echo ""
    echo "   Ubuntu/Debian:"
    echo "   sudo apt install nodejs npm"
    echo ""
    exit 1
fi

echo "✅ تم العثور على Node.js"
echo "✅ Node.js found"
node --version
echo ""

# فحص npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm غير متوفر"
    exit 1
fi

echo "✅ npm متوفر"
npm --version
echo ""

# التحقق من وجود package.json
if [ ! -f package.json ]; then
    echo "❌ خطأ: لم يتم العثور على package.json"
    echo "❌ Error: package.json not found"
    exit 1
fi

echo ""
echo "⏳ جاري تثبيت المكتبات..."
echo "⏳ Installing dependencies..."
echo ""

npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ فشل التثبيت"
    echo "❌ Installation failed"
    exit 1
fi

echo ""
echo "✅ تم تثبيت المكتبات بنجاح"
echo "✅ Dependencies installed successfully"
echo ""
echo "🚀 جاري تشغيل التطبيق..."
echo "🚀 Starting application..."
echo ""
echo "╔═════════════════════════════════════════════╗"
echo "║  👉 http://localhost:3000                   ║"
echo "║  سيفتح المتصفح تلقائياً                     ║"
echo "║  Browser will open automatically             ║"
echo "╚═════════════════════════════════════════════╝"
echo ""
echo "⏸️  اضغط Ctrl+C لإيقاف التطبيق"
echo "⏸️  Press Ctrl+C to stop the application"
echo ""

# فتح المتصفح تلقائياً
if command -v open &> /dev/null; then
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
fi

npm start
