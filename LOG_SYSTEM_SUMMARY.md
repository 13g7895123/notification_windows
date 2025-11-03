# 日誌系統實作摘要

## 問題
GUI 點擊開始按鈕後，監控沒有正常在背景運行，需要日誌機制協助排查錯誤。

## 解決方案
實作完整的日誌系統，將所有操作記錄到檔案並同步顯示在 GUI。

## 實作內容

### 1. Logger 模組 (`internal/logger/logger.go`)
- 自動建立 `logs/` 目錄
- 使用日期命名：`app_YYYY-MM-DD.log`
- 支援 5 種日誌級別：DEBUG, INFO, WARN, ERROR, SUCCESS
- 同時輸出到檔案和 GUI（透過回調函數）
- 執行緒安全（使用 mutex）
- 可動態切換 Debug 模式

### 2. 整合到各模組

#### GUI (`internal/gui/window.go`)
- 建立 logger 實例
- 設定 GUI 回調函數
- 記錄所有使用者操作（開始、停止、儲存設定等）
- 記錄監控迴圈狀態
- 程式關閉時清理資源

#### API Client (`internal/api/client.go`)
- 移除舊的 debug callback 機制
- 整合 logger
- 記錄所有 API 請求和回應
- 記錄請求時間（毫秒）
- 詳細的錯誤日誌

#### Notifier (`internal/notification/notifier.go`)
- 整合 logger
- 記錄通知推送過程
- 記錄通知失敗原因

### 3. 文件更新
- README.md：新增日誌系統章節
- CHANGELOG.md：記錄此次更新
- test-logging.sh：測試腳本
- .gitignore：忽略 logs 目錄

## 使用方式

### 正常使用
程式會自動記錄所有操作到 `logs/app_YYYY-MM-DD.log`

### 問題排查
1. 在 GUI 勾選 "Debug Mode"
2. 點擊 "Test API" 測試連線
3. 查看 GUI 歷史記錄
4. 開啟 logs 目錄查看完整日誌

### 日誌範例
```
[2025-11-03 14:30:15] [INFO] === 應用程式啟動 ===
[2025-11-03 14:30:20] [INFO] 監控已啟動 - 專案: free_youtube, 間隔: 5 秒
[2025-11-03 14:30:20] [DEBUG] 監控迴圈已啟動
[2025-11-03 14:30:20] [DEBUG] API 請求: GET http://localhost:9204/api/notifications?status=0
[2025-11-03 14:30:20] [DEBUG] API 回應: HTTP 200 (125ms) | 數量: 2 | 成功: true
[2025-11-03 14:30:20] [INFO] 發現 2 個未通知的記錄
[2025-11-03 14:30:20] [SUCCESS] 已通知: 測試標題 - 測試訊息
```

## Debug 模式的優勢
- 顯示監控迴圈的每次執行
- 顯示 API 請求的詳細資訊（URL、參數、回應時間）
- 顯示通知推送的詳細過程
- 協助快速定位問題（連線問題、API 錯誤、通知失敗等）

## 檔案清單
- ✅ `internal/logger/logger.go` - 日誌模組
- ✅ `internal/gui/window.go` - 整合 logger
- ✅ `internal/api/client.go` - 整合 logger
- ✅ `internal/notification/notifier.go` - 整合 logger
- ✅ `logs/.gitkeep` - 保持目錄結構
- ✅ `.gitignore` - 忽略日誌檔案
- ✅ `README.md` - 更新文件
- ✅ `CHANGELOG.md` - 更新記錄
- ✅ `test-logging.sh` - 測試腳本

## 效果
現在當用戶點擊開始按鈕後：
1. 會在 GUI 和日誌檔同時記錄「監控已啟動」
2. 記錄監控迴圈的啟動
3. 記錄每次 API 查詢（Debug 模式）
4. 記錄所有錯誤和成功操作
5. 用戶可以透過日誌檔清楚了解程式運行狀態，快速定位問題
