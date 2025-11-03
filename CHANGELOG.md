# 更新日誌

## [未發布] - 2025-11-03

### 新增功能
- ✨ 完整的日誌系統
  - 自動記錄所有操作到 `logs/` 目錄
  - 使用日期命名日誌檔：`app_YYYY-MM-DD.log`
  - 支援多種日誌級別：DEBUG, INFO, WARN, ERROR, SUCCESS
  - GUI 和檔案雙重輸出，方便問題排查

### 改進
- 🔧 重構日誌輸出機制
  - 統一使用 `internal/logger` 模組管理日誌
  - API Client 整合日誌系統
  - Notifier 整合日誌系統
  - GUI 整合日誌系統
  
- 📝 Debug 模式增強
  - 可動態切換 Debug 模式
  - Debug 模式下顯示詳細的 API 請求/回應資訊
  - 監控迴圈狀態詳細記錄
  - 通知推送過程詳細記錄

- 📖 文件更新
  - README.md 新增日誌系統說明
  - 新增問題排查指南
  - 更新專案結構說明

### 技術細節
- 新增 `internal/logger/logger.go` 模組
- 更新 `internal/gui/window.go` 整合 logger
- 更新 `internal/api/client.go` 使用 logger
- 更新 `internal/notification/notifier.go` 使用 logger
- 新增 `logs/` 目錄（透過 .gitkeep 保持）
- 更新 `.gitignore` 忽略日誌檔案

### 修復
- 🐛 改善背景運行問題的可追蹤性
  - 增加詳細日誌可協助診斷監控迴圈未正常執行的問題
  - 記錄所有關鍵操作節點的狀態

## 使用說明

### 啟用日誌
程式啟動後會自動建立 `logs/` 目錄並開始記錄日誌，無需額外設定。

### 查看日誌
```bash
# 查看今天的日誌
cat logs/app_$(date +%Y-%m-%d).log

# 即時監看日誌（Linux/macOS）
tail -f logs/app_$(date +%Y-%m-%d).log
```

### Debug 模式
在 GUI 中勾選 "Debug Mode" 可啟用詳細日誌，記錄包括：
- API 請求的完整 URL 和參數
- API 回應時間和狀態
- 監控迴圈的每次執行
- 通知推送的詳細過程
