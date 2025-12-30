#!/bin/bash
# =============================================================================
# start-electron.sh
# 編譯並啟動 Electron 版本的通知監控程式
# =============================================================================

# 確保腳本在錯誤時停止
set -e

# 取得腳本所在目錄的絕對路徑
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ELECTRON_DIR="$PROJECT_ROOT/electron-client"

echo "📂 切換到 Electron 目錄: $ELECTRON_DIR"
cd "$ELECTRON_DIR"

# 檢查是否需要安裝依賴
if [ ! -d "node_modules" ]; then
    echo "📦 偵測到首次執行，正在安裝依賴..."
    npm install
fi

echo "🚀 正在編譯 Electron 客戶端..."
npm run build > /dev/null

echo "✨ 啟動應用程式..."
npm run start:prod
