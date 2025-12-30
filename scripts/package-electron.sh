#!/bin/bash
# =============================================================================
# package-electron.sh
# 打包 Electron 應用程式為可安裝檔案
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

# 先編譯
echo "🔨 正在編譯應用程式..."
npm run build

# 打包
echo ""
echo "📦 正在打包應用程式..."
echo "   目標平台: 當前系統"
echo ""

npm run package

echo ""
echo "✅ 打包完成！"
echo "   輸出目錄: $ELECTRON_DIR/release/"
echo ""
echo "   根據您的作業系統，安裝檔案位於："
echo "   - Windows: release/*.exe"
echo "   - macOS:   release/*.dmg"
echo "   - Linux:   release/*.AppImage 或 *.deb"
