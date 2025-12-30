#!/bin/bash
# =============================================================================
# start-go.sh
# 啟動 Go 版本的通知監控程式
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
GO_DIR="$PROJECT_ROOT/go-client"

echo "📂 切換到 Go 目錄: $GO_DIR"
cd "$GO_DIR"

# 檢查是否已編譯
if [ ! -f "notification_windows" ] && [ ! -f "notification_windows.exe" ]; then
    echo "🔨 正在編譯 Go 應用程式..."
    go build -o notification_windows .
fi

echo "✨ 啟動 Go 版本..."
./notification_windows
