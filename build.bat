@echo off
echo ===================================
echo Windows 通知監控程式 - 編譯腳本
echo ===================================
echo.

echo [1/3] 正在下載依賴套件...
go mod tidy
if errorlevel 1 (
    echo 錯誤: 下載依賴套件失敗
    pause
    exit /b 1
)

echo.
echo [2/3] 正在編譯程式...
set GOOS=windows
set GOARCH=amd64
go build -ldflags="-H windowsgui -s -w" -o windows-notification.exe .
if errorlevel 1 (
    echo 錯誤: 編譯失敗
    pause
    exit /b 1
)

echo.
echo [3/3] 檢查設定檔...
if not exist config.json (
    echo 提示: 未找到 config.json，正在複製範例設定檔...
    copy config.json.example config.json
)

echo.
echo ===================================
echo 編譯完成！
echo ===================================
echo.
echo 執行檔: windows-notification.exe
echo 設定檔: config.json
echo.
echo 請先編輯 config.json 設定檔，然後執行 windows-notification.exe
echo.
pause
