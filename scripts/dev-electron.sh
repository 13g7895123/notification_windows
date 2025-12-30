#!/bin/bash
# =============================================================================
# dev-electron.sh
# 啟動 Electron 開發模式（支援熱更新）
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

echo ""
echo "🔧 啟動開發模式..."
echo "----------------------------------------"
echo "  這會啟動 Vite dev server 和 TypeScript 監聽"
echo "  當編譯完成後，請在另一個終端機執行："
echo ""
echo "    cd electron-client && npm start"
echo ""
echo "  或使用 Ctrl+C 停止"
echo "----------------------------------------"
echo ""

npm run dev
