#!/bin/bash
# =============================================================================
# build-electron.sh
# 編譯 Electron 應用程式（不啟動）
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ELECTRON_DIR="$PROJECT_ROOT/electron-client"

echo "📂 切換到 Electron 目錄: $ELECTRON_DIR"
cd "$ELECTRON_DIR"

# 檢查依賴
if [ ! -d "node_modules" ]; then
    echo "📦 正在安裝依賴..."
    npm install
fi

echo "🔨 編譯 Main Process..."
npm run build:main

echo "🔨 編譯 Preload Scripts..."
npm run build:preload

echo "🔨 編譯 Renderer Process..."
npm run build:renderer

echo ""
echo "✅ 編譯完成！"
echo "   輸出目錄: $ELECTRON_DIR/dist/"
echo ""
echo "   執行以下命令啟動應用程式："
echo "   cd electron-client && npm run start:prod"
