# API Key 設定說明

## 問題：收到 UNAUTHORIZED 錯誤

如果您收到以下錯誤訊息：
```json
{
    "success": false,
    "error": {
        "code": "UNAUTHORIZED",
        "message": "請先登入或提供有效的 API Key"
    }
}
```

這表示 API Key 沒有正確傳遞或無效。

## 解決步驟

### 步驟 1：確認您有正確的 API Key

1. 從管理後台取得您的 API Key
2. **完整複製** API Key（不要有多餘的空格或換行）
3. 確認 API Key 的權限設定正確

### 步驟 2：在應用程式中設定 API Key

有**兩種方式**設定 API Key：

#### 方式 A：直接編輯 config.json（推薦）

1. 編輯 `config.json` 文件：
   ```bash
   cd electron-client
   nano config.json  # 或使用其他編輯器
   ```

2. 設定 API Key：
   ```json
   {
     "domain": "https://notify.try-8verything.com",
     "apiKey": "YOUR_ACTUAL_API_KEY_HERE",
     "project": "your_project_name",
     "interval": 5,
     "debug": true
   }
   ```

3. **重要**：確保 API Key：
   - 沒有前後空格
   - 沒有換行符號
   - 是完整的 Key（不要截斷）

#### 方式 B：在應用程式 UI 中設定

1. 啟動應用程式：
   ```bash
   ./start.sh
   ```

2. 在 Configuration 面板中：
   - **API DOMAIN**: `https://notify.try-8verything.com`
   - **API KEY**: 貼上您的 API Key
   - **PROJECT ID**: 您的專案名稱

3. 點擊 **SAVE CONFIG** 儲存

4. 點擊 **TEST API** 測試連線

### 步驟 3：執行診斷腳本

我們提供了一個診斷工具來檢查 API Key 設定：

```bash
cd electron-client
./diagnose.sh
```

這個腳本會：
- ✅ 檢查 config.json 是否存在
- ✅ 檢查 API Key 是否已設定
- ✅ 顯示 API Key 的長度和前綴
- ✅ 實際測試 API 連線
- ✅ 顯示詳細的錯誤訊息

### 步驟 4：查看詳細日誌

如果問題仍然存在，啟用 debug 模式：

1. 在 `config.json` 中設定：
   ```json
   {
     "debug": true
   }
   ```

2. 重新啟動應用程式

3. 查看日誌檔案：
   ```bash
   tail -f logs/notification_$(date +%Y%m%d).log
   ```

日誌會顯示：
- API Key 是否已設定
- API Key 的長度
- API 請求的完整 URL
- 伺服器的錯誤回應

## 常見問題

### Q1: 我在哪裡取得 API Key？
A: 從您的管理後台或系統管理員處取得。

### Q2: API Key 的格式是什麼？
A: 通常是一串長的英數字字串，例如：`abc123def456ghi789...`

### Q3: GitHub 的 WINDOWS_NOTIFY_API_KEY 是什麼？
A: 那是 GitHub Actions 或 CI/CD 使用的環境變數，**不會**自動套用到本地應用程式。您需要在 `config.json` 中手動設定。

### Q4: 為什麼我設定了還是不行？
A: 請執行診斷腳本：
```bash
./diagnose.sh
```

常見原因：
- ❌ API Key 有前後空格
- ❌ API Key 被截斷或不完整
- ❌ API Key 已過期或被撤銷
- ❌ API Key 權限不足

### Q5: 如何確認 API Key 正確傳送？
A: 查看日誌檔案，會顯示類似：
```
[DEBUG] API Key 已設定 (長度: 64)
[DEBUG] 使用 API Key: abc12345...
```

## 測試範例

使用 curl 手動測試：

```bash
# 替換 YOUR_API_KEY 為您的實際 API Key
curl -X GET https://notify.try-8verything.com/api/notifications/windows/pending \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

成功的回應應該是：
```json
{
  "success": true,
  "data": [...],
  "count": 0
}
```

失敗的回應（API Key 錯誤）：
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "請先登入或提供有效的 API Key"
  }
}
```

## 檔案位置

- **設定檔**: `electron-client/config.json`
- **範例設定**: `electron-client/config.json.example`
- **日誌檔案**: `electron-client/logs/notification_YYYYMMDD.log`
- **診斷工具**: `electron-client/diagnose.sh`

## 需要協助？

1. 執行診斷腳本：`./diagnose.sh`
2. 查看日誌檔案
3. 確認 API Key 來源是否正確
4. 聯繫系統管理員確認 API Key 狀態

## 重要提醒

⚠️ **不要將 API Key 提交到 Git！**

確保 `config.json` 已在 `.gitignore` 中：
```bash
# 檢查
cat .gitignore | grep config.json

# 如果沒有，添加
echo "config.json" >> .gitignore
```
