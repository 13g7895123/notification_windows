# Windows 通知監控程式

這是一個用 Go 語言開發的 Windows 通知監控程式，可以定期查詢通知 API 並在 Windows 系統上顯示通知。

## 功能特點

- ✅ **GUI 視窗介面**：使用 Fyne 框架建立的友善圖形介面
- ✅ **自動輪詢**：可設定間隔時間（預設 5 秒）自動查詢 API
- ✅ **Windows 原生通知**：使用 Windows 10/11 原生通知系統
- ✅ **專案篩選**：可指定要監控的專案名稱
- ✅ **自動更新狀態**：顯示通知後自動更新 API 狀態為已通知
- ✅ **通知歷史**：在視窗中顯示通知歷史記錄
- ✅ **設定管理**：可在 GUI 中編輯並儲存設定

## 系統需求

- Windows 10 或更新版本
- Docker（僅用於編譯，執行時不需要）

## 編譯方式

### 方法一：使用 Docker 編譯（推薦）

這個方法適合在 Linux、macOS 或 Windows 上編譯 Windows 執行檔。

```bash
# 執行 Docker 編譯腳本
./build-docker.sh
```

編譯完成後，執行檔會放在 `dist/` 目錄下：
- `dist/windows-notification.exe` - Windows 執行檔
- `dist/config.json` - 設定檔

### 方法二：在 Windows 上直接編譯

如果你在 Windows 環境且已安裝 Go：

```cmd
# 執行 Windows 編譯腳本
build.bat
```

## 設定檔

編輯 `config.json` 設定檔：

```json
{
  "domain": "http://localhost:9204",
  "project": "free_youtube",
  "interval": 5
}
```

### 設定說明

- `domain`：API 伺服器網域（包含 http:// 或 https://）
- `project`：要監控的專案名稱，留空則監控所有專案
- `interval`：查詢間隔時間（秒），預設為 5 秒

## 使用方式

### 1. 首次使用

1. 將編譯好的 `windows-notification.exe` 和 `config.json` 放在同一個資料夾
2. 編輯 `config.json` 設定 API 網域和專案名稱
3. 雙擊執行 `windows-notification.exe`

### 2. 操作說明

程式啟動後會顯示 GUI 視窗：

1. **設定區域**
   - API 網域：輸入通知 API 的網域
   - 專案名稱：輸入要監控的專案（例如：free_youtube）
   - 查詢間隔：設定多久查詢一次 API（單位：秒）

2. **控制按鈕**
   - `啟動監控`：開始定期查詢 API
   - `停止監控`：停止查詢
   - `儲存設定`：將目前設定儲存到 config.json

3. **通知歷史**
   - 顯示最近的通知記錄和操作日誌
   - 最多保留 100 筆記錄

### 3. 背景執行

程式啟動後可以最小化視窗，它會繼續在背景監控並顯示通知。

## API 規格

程式會呼叫以下 API 端點：

- **查詢未通知記錄**：`GET /api/notifications?status=0&project={project}`
- **更新通知狀態**：`PATCH /api/notifications/{id}/status`

詳細 API 規格請參考 [API_NOTIFICATIONS.md](API_NOTIFICATIONS.md)

## 專案結構

```
windows_notification/
├── main.go                          # 主程式入口
├── config.json.example              # 設定檔範例
├── internal/
│   ├── config/config.go            # 設定檔管理
│   ├── api/client.go               # API 客戶端
│   ├── notification/notifier.go    # Windows 通知
│   └── gui/window.go               # GUI 介面
├── Dockerfile                       # Docker 編譯環境
├── build-docker.sh                  # Docker 編譯腳本（Linux/macOS）
├── build.bat                        # Windows 編譯腳本
└── README.md                        # 說明文件
```

## 技術說明

### 使用的套件

- [fyne.io/fyne/v2](https://fyne.io/) - 跨平台 GUI 框架
- [github.com/go-toast/toast](https://github.com/go-toast/toast) - Windows 通知顯示

### 交叉編譯

本專案使用 Docker 進行交叉編譯，可以在任何平台上編譯出 Windows 執行檔。編譯參數：

- `CGO_ENABLED=0`：禁用 CGO，產生純靜態執行檔
- `GOOS=windows`：目標作業系統為 Windows
- `GOARCH=amd64`：目標架構為 64 位元
- `-ldflags="-H windowsgui -s -w"`：
  - `-H windowsgui`：隱藏命令列視窗
  - `-s -w`：減少執行檔大小

## 常見問題

### Q: 通知沒有顯示？

A: 請確認：
1. Windows 通知設定已開啟
2. API 伺服器正常運作
3. 設定檔中的 domain 正確
4. 專案名稱拼寫正確

### Q: 如何讓程式開機自動啟動？

A:
1. 按 `Win + R`，輸入 `shell:startup`
2. 將 `windows-notification.exe` 的捷徑放入該資料夾

### Q: 可以監控多個專案嗎？

A: 目前一個程式實例只能監控一個專案。如需監控多個專案，可以：
1. 執行多個程式實例，每個使用不同的 config.json
2. 或將專案名稱留空，監控所有專案

## 授權

本專案採用 MIT 授權條款。
