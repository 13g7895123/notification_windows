# Electron Client 更新說明

## 最新更新 (2025-12-30)

### ✨ 新增功能

#### 1. API Key 認證支援
- 新增 API Key 設定欄位
- 所有 API 請求現在都會帶上 `X-API-Key` header
- 可在 UI 界面中直接設定和修改 API Key

#### 2. 新 API 端點整合
已更新為最新的 API 規格：

**獲取待處理通知**:
- 舊版: `GET /api/notifications?status=0`
- 新版: `GET /api/notifications/windows/pending`

**更新通知狀態**:
- 舊版: `PATCH /api/notifications/:id/status` (status: 0 或 1)
- 新版: `PATCH /api/notifications/windows/:id/status` (status: delivered/read/dismissed)

#### 3. 複製整合說明功能
- 在應用程式中可直接複製完整的 Windows Client 整合說明
- Markdown 格式，可直接用於文件或分享
- 包含最新的 API 規格和使用說明

#### 4. 一鍵啟動腳本
新增 `start.sh` 腳本，自動完成：
- Node.js 和 npm 檢查
- 依賴套件安裝
- 設定檔案建立
- 專案建置
- 應用程式啟動

### 🔧 設定檔案變更

**config.json 新增欄位**:
```json
{
  "domain": "https://notify.try-8verything.com",
  "apiKey": "YOUR_API_KEY",           // 新增
  "project": "your_project_name",
  "interval": 5,
  "debug": false
}
```

### 📝 使用說明

#### 首次設定

1. **取得 API Key**
   - 從管理後台取得您的 API Key

2. **設定應用程式**
   ```bash
   cd electron-client
   cp config.json.example config.json
   # 編輯 config.json，填入您的 API Key
   ```

3. **啟動應用程式**
   ```bash
   ./start.sh
   ```

#### 在應用程式中設定

1. 啟動應用程式後，在 Configuration 面板中填入：
   - **API DOMAIN**: `https://notify.try-8verything.com`
   - **API KEY**: 您的 API Key
   - **PROJECT ID**: 專案名稱（選填）
   - **INTERVAL**: 輪詢間隔秒數

2. 點擊「SAVE CONFIG」儲存設定

3. 點擊「TEST API」測試連線

4. 點擊「START MONITORING」開始監控

### 🔍 功能測試

#### 測試 API 連線
```bash
curl -X GET https://notify.try-8verything.com/api/notifications/windows/pending \
  -H "X-API-Key: YOUR_API_KEY"
```

#### 測試更新通知狀態
```bash
curl -X PATCH https://notify.try-8verything.com/api/notifications/windows/{id}/status \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"status": "delivered"}'
```

### 📋 複製整合說明

1. 在應用程式右下方找到「📋 Windows Client 整合說明」面板
2. 點擊「複製 MD」按鈕
3. Markdown 格式的完整說明文件已複製到剪貼簿
4. 可直接貼到文件、郵件或分享給其他開發者

### 🔄 遷移指南

#### 從舊版更新

如果您正在使用舊版本，請：

1. **更新設定檔案**
   ```bash
   # 在現有的 config.json 中加入 apiKey
   nano config.json
   ```
   
   新增：
   ```json
   "apiKey": "YOUR_API_KEY"
   ```

2. **更新 API 域名**
   ```json
   "domain": "https://notify.try-8verything.com"
   ```

3. **重新建置**
   ```bash
   npm install  # 確保依賴最新
   npm run build
   ```

4. **重新啟動**
   ```bash
   npm start
   # 或使用
   ./start.sh
   ```

### ⚙️ 技術細節

#### 通知狀態說明

- **delivered**: 通知已送達客戶端並顯示
- **read**: 使用者已讀取通知（預留功能）
- **dismissed**: 使用者已關閉/忽略通知（預留功能）

目前版本會在顯示通知後自動設定為 `delivered` 狀態。

#### API 認證流程

1. 應用程式從設定讀取 API Key
2. 每次 API 請求都會在 header 中帶上 `X-API-Key`
3. 伺服器驗證 API Key 的有效性
4. 返回通知資料或錯誤訊息

### 🐛 故障排除

#### 401 Unauthorized
- 檢查 API Key 是否正確
- 確認沒有多餘的空格或換行符號

#### 連線失敗
- 確認網路可以連接到 notify.try-8verything.com
- 檢查防火牆設定
- 查看日誌檔案：`logs/notification_YYYYMMDD.log`

#### 通知未顯示
- 點擊「TEST NOTIFICATION」測試通知功能
- 檢查 Windows 通知權限
- 查看 Activity Log 中的錯誤訊息

### 📂 專案結構更新

```
electron-client/
├── start.sh                        # 新增：一鍵啟動腳本
├── config.json.example             # 更新：加入 apiKey
├── src/
│   ├── main/
│   │   ├── api/client.ts          # 更新：新 API 端點和認證
│   │   └── config/config.ts       # 更新：apiKey 支援
│   └── renderer/
│       ├── index.html             # 更新：API Key 輸入框
│       └── scripts/app.ts         # 更新：複製功能和 API Key 處理
```

### 🔗 相關連結

- API 文件：查看應用程式中的整合說明
- 問題回報：GitHub Issues
- 更新日誌：CHANGELOG.md

### 📄 授權

MIT License
