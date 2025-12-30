# 在 GUI 中設定 API Key - 快速指南

## 🚀 三步驟完成設定

### 步驟 1：啟動應用程式

```bash
cd electron-client
./start.sh
```

應用程式會自動：
- ✅ 檢查 Node.js 和 npm
- ✅ 安裝依賴（如需要）
- ✅ 建置專案（如需要）
- ✅ 啟動應用程式

### 步驟 2：在 GUI 中填入 API Key

1. **開啟 Configuration 面板**（應用程式左側）

2. **填入設定**：
   - **API DOMAIN**: `https://notify.try-8verything.com`
   - **API KEY**: 貼上您的 API Key
     - 點擊 👁️ 圖示可以顯示/隱藏 API Key
     - 預設為隱藏（密碼模式）以保護安全
   - **PROJECT ID**: 您的專案名稱（例如：`free_youtube`）
   - **INTERVAL (SEC)**: `5` 或您需要的秒數

3. **點擊 SAVE CONFIG** 按鈕儲存設定

### 步驟 3：測試並啟動

1. **點擊 TEST API** 按鈕
   - 如果成功，Activity Log 會顯示「API 測試成功」✅
   - 如果失敗，會顯示錯誤訊息

2. **點擊 START MONITORING** 按鈕開始監控
   - 狀態指示器會變成「監控中」
   - 應用程式開始自動輪詢 API

## 🔑 關於 API Key

### 顯示/隱藏 API Key

- API Key 輸入框右側有一個 👁️ 圖示按鈕
- 點擊可以切換顯示或隱藏 API Key
- 預設為隱藏（密碼模式），保護您的 API Key 安全

### API Key 格式

- 通常是一串長的英數字字串
- 長度約 32-64 字元
- 範例：`abc123def456ghi789jkl012mno345pqr678`

### 從哪裡取得 API Key？

1. 登入您的管理後台
2. 前往 API 設定或開發者設定
3. 建立或複製 API Key
4. **完整複製**（不要有多餘的空格或換行）

## ✅ 驗證設定

### 方法 1：使用 TEST API 按鈕

在 GUI 中點擊 **TEST API** 按鈕，會看到：

**成功**：
```
✓ API 測試成功
API 連線成功
```

**失敗**：
```
✗ API 測試失敗
HTTP 401: {"success":false,"error":{"code":"UNAUTHORIZED",...}}
```

### 方法 2：使用診斷腳本

```bash
./diagnose.sh
```

會顯示：
- API Key 是否已設定
- API Key 的長度
- 實際測試連線
- 詳細的錯誤訊息（如有）

### 方法 3：查看日誌

1. 在 Configuration 面板勾選 **DEBUG MODE**
2. 點擊 **SAVE CONFIG**
3. 點擊 **START MONITORING**
4. 查看日誌：
   ```bash
   tail -f logs/notification_$(date +%Y%m%d).log
   ```

日誌會顯示：
```
[DEBUG] API Key 已設定 (長度: 64)
[DEBUG] 使用 API Key: abc12345...
[DEBUG] API 請求: GET https://notify.try-8verything.com/api/notifications/windows/pending
```

## ❌ 常見錯誤

### 錯誤 1: UNAUTHORIZED

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "請先登入或提供有效的 API Key"
  }
}
```

**原因**：
- API Key 為空
- API Key 不正確
- API Key 已過期

**解決**：
1. 確認 API Key 欄位有填入值
2. 點擊 👁️ 圖示檢查 API Key 是否正確
3. 從管理後台重新取得 API Key

### 錯誤 2: API Key 為空

在日誌中看到：
```
[ERROR] API Key 為空或未設定！
```

**解決**：
1. 在 GUI 的 **API KEY** 欄位填入您的 API Key
2. 點擊 **SAVE CONFIG**
3. 重新測試

### 錯誤 3: 連線失敗

```
API 請求失敗: Failed to fetch
```

**解決**：
1. 檢查網路連線
2. 確認可以訪問 https://notify.try-8verything.com
3. 檢查防火牆設定

## 💡 小技巧

### 技巧 1：先測試再監控

總是先點擊 **TEST API** 確認連線成功，再點擊 **START MONITORING**。

### 技巧 2：使用 Debug 模式

遇到問題時：
1. 勾選 **DEBUG MODE**
2. 點擊 **SAVE CONFIG**
3. 查看詳細日誌找出問題

### 技巧 3：複製整合說明

在應用程式下方的「📋 Windows Client 整合說明」面板：
- 點擊 **複製 MD** 按鈕
- 可以複製完整的 Markdown 格式使用說明
- 包含最新的 API 規格和使用方式

### 技巧 4：檢查設定檔

如果在 GUI 中設定後仍有問題，可以直接查看設定檔：

```bash
cat config.json
```

應該看到：
```json
{
  "domain": "https://notify.try-8verything.com",
  "apiKey": "您的API Key",
  "project": "free_youtube",
  "interval": 5,
  "debug": true
}
```

## 📱 使用流程

```
啟動應用程式
    ↓
填入 API Key (在 GUI 中)
    ↓
點擊 SAVE CONFIG
    ↓
點擊 TEST API (驗證連線)
    ↓
點擊 START MONITORING (開始監控)
    ↓
✓ 開始接收通知！
```

## 🔒 安全提示

- ✅ API Key 預設為隱藏模式（密碼輸入框）
- ✅ 只在需要檢查時才點擊 👁️ 圖示顯示
- ✅ 不要將 config.json 提交到 Git（已在 .gitignore 中）
- ✅ 不要分享您的 API Key 給他人
- ✅ 如果 API Key 洩露，立即從管理後台撤銷並建立新的

## 需要協助？

1. **查看日誌**：`tail -f logs/notification_*.log`
2. **執行診斷**：`./diagnose.sh`
3. **查看說明**：[API_KEY_SETUP.md](API_KEY_SETUP.md)
4. **複製整合指南**：在應用程式中點擊「複製 MD」按鈕
