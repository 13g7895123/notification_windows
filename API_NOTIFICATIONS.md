# Notifications API 說明文件

## 概述

Notifications API 提供系統通知的建立、查詢和狀態更新功能。此 API 不需要認證，適合用於系統內部通知或專案間的通知整合。

**Base URL**: `http://localhost:9204/api`
**認證**: 不需要

---

## 資料表結構

```sql
CREATE TABLE notifications (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    project         VARCHAR(100) NOT NULL COMMENT '專案名稱，例如: crm、backend、game_bot',
    title           VARCHAR(100) NOT NULL COMMENT '通知標題',
    message         TEXT NOT NULL COMMENT '通知內容',
    status          TINYINT NOT NULL DEFAULT 0 COMMENT '0=未通知, 1=已通知',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    notified_at     DATETIME NULL COMMENT '實際通知時間',
    INDEX idx_project (project),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

---

## API 端點

### 1. 建立通知

建立新的系統通知記錄。

**端點**: `POST /api/notifications`

#### 請求參數

| 欄位 | 類型 | 必填 | 說明 | 限制 |
|------|------|------|------|------|
| project | string | 是 | 專案名稱 | 最長 100 字元 |
| title | string | 是 | 通知標題 | 最長 100 字元 |
| message | string | 是 | 通知內容 | 無限制 |
| status | integer | 否 | 通知狀態 | 0 或 1，預設為 0 |

#### 請求範例

```bash
curl -X POST http://localhost:9204/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "project": "free_youtube",
    "title": "系統維護通知",
    "message": "系統將於今晚 22:00 進行例行維護，預計維護時間 1 小時",
    "status": 0
  }'
```

#### 成功回應 (201 Created)

```json
{
  "success": true,
  "message": "通知建立成功",
  "data": {
    "id": "1",
    "project": "free_youtube",
    "title": "系統維護通知",
    "message": "系統將於今晚 22:00 進行例行維護，預計維護時間 1 小時",
    "status": "0",
    "created_at": "2025-11-02 20:58:54",
    "notified_at": null
  }
}
```

#### 錯誤回應 (400 Bad Request)

```json
{
  "success": false,
  "message": "資料驗證失敗",
  "errors": {
    "project": "專案名稱為必填欄位",
    "title": "通知標題為必填欄位"
  }
}
```

---

### 2. 更新通知狀態

更新指定通知的狀態，當狀態更新為已通知 (1) 時，會自動記錄通知時間。

**端點**: `PATCH /api/notifications/{id}/status`

#### 路徑參數

| 參數 | 類型 | 說明 |
|------|------|------|
| id | integer | 通知 ID |

#### 請求參數

| 欄位 | 類型 | 必填 | 說明 | 限制 |
|------|------|------|------|------|
| status | integer | 是 | 通知狀態 | 必須為 0 或 1 |

#### 請求範例

```bash
curl -X PATCH http://localhost:9204/api/notifications/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": 1
  }'
```

#### 成功回應 (200 OK)

```json
{
  "success": true,
  "message": "通知狀態更新成功",
  "data": {
    "id": "1",
    "status": "1",
    "notified_at": "2025-11-02 12:59:11"
  }
}
```

#### 錯誤回應

**通知不存在 (404 Not Found)**
```json
{
  "success": false,
  "message": "找不到指定的通知"
}
```

**缺少狀態參數 (400 Bad Request)**
```json
{
  "success": false,
  "message": "缺少 status 參數"
}
```

**狀態值無效 (400 Bad Request)**
```json
{
  "success": false,
  "message": "status 必須為 0 或 1"
}
```

---

### 3. 取得通知列表 (選用功能)

查詢通知列表，支援專案名稱和狀態篩選。

**端點**: `GET /api/notifications`

#### 查詢參數

| 參數 | 類型 | 必填 | 說明 | 預設值 |
|------|------|------|------|--------|
| project | string | 否 | 專案名稱篩選 | - |
| status | integer | 否 | 狀態篩選 (0 或 1) | - |
| limit | integer | 否 | 限制筆數 | 50 |

#### 請求範例

```bash
# 取得所有通知
curl http://localhost:9204/api/notifications

# 取得特定專案的通知
curl http://localhost:9204/api/notifications?project=free_youtube

# 取得特定專案的未通知記錄
curl http://localhost:9204/api/notifications?project=free_youtube&status=0

# 限制回傳筆數
curl http://localhost:9204/api/notifications?limit=10
```

#### 成功回應 (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "project": "free_youtube",
      "title": "系統維護通知",
      "message": "系統將於今晚 22:00 進行例行維護，預計維護時間 1 小時",
      "status": "1",
      "created_at": "2025-11-02 20:58:54",
      "notified_at": "2025-11-02 12:59:11"
    }
  ],
  "count": 1
}
```

---

### 4. 取得單一通知 (選用功能)

查詢指定 ID 的通知詳細資訊。

**端點**: `GET /api/notifications/{id}`

#### 路徑參數

| 參數 | 類型 | 說明 |
|------|------|------|
| id | integer | 通知 ID |

#### 請求範例

```bash
curl http://localhost:9204/api/notifications/1
```

#### 成功回應 (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "1",
    "project": "free_youtube",
    "title": "系統維護通知",
    "message": "系統將於今晚 22:00 進行例行維護，預計維護時間 1 小時",
    "status": "1",
    "created_at": "2025-11-02 20:58:54",
    "notified_at": "2025-11-02 12:59:11"
  }
}
```

#### 錯誤回應 (404 Not Found)

```json
{
  "success": false,
  "message": "找不到指定的通知"
}
```

---

## 狀態碼說明

| 狀態碼 | 說明 |
|--------|------|
| 200 OK | 請求成功 |
| 201 Created | 資源建立成功 |
| 400 Bad Request | 請求參數錯誤或驗證失敗 |
| 404 Not Found | 找不到指定的資源 |
| 500 Internal Server Error | 伺服器內部錯誤 |

---

## 使用場景

### 場景 1: 專案部署通知

```bash
# 建立部署通知
curl -X POST http://localhost:9204/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "project": "crm",
    "title": "CRM 系統部署完成",
    "message": "版本 v2.3.1 已成功部署至生產環境",
    "status": 0
  }'

# 發送通知後，更新狀態為已通知
curl -X PATCH http://localhost:9204/api/notifications/2/status \
  -H "Content-Type: application/json" \
  -d '{"status": 1}'
```

### 場景 2: 錯誤監控通知

```bash
# 建立錯誤通知
curl -X POST http://localhost:9204/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "project": "game_bot",
    "title": "資料庫連線異常",
    "message": "資料庫連線失敗，錯誤代碼: ECONNREFUSED",
    "status": 0
  }'
```

### 場景 3: 查詢未處理通知

```bash
# 取得所有未通知的記錄
curl http://localhost:9204/api/notifications?status=0

# 取得特定專案的未通知記錄
curl http://localhost:9204/api/notifications?project=backend&status=0
```

---

## 驗證規則

### project (專案名稱)
- ✅ 必填欄位
- ✅ 最長 100 字元
- ❌ 不可為空字串

### title (通知標題)
- ✅ 必填欄位
- ✅ 最長 100 字元
- ❌ 不可為空字串

### message (通知內容)
- ✅ 必填欄位
- ✅ 無長度限制
- ❌ 不可為空字串

### status (通知狀態)
- ✅ 選填欄位（預設為 0）
- ✅ 必須為 0 或 1
- ❌ 不可為其他數值

---

## 注意事項

1. **時間記錄**: 當通知狀態從 0 更新為 1 時，系統會自動記錄 `notified_at` 欄位
2. **無需認證**: 此 API 不需要 JWT token 或其他認證機制
3. **字元編碼**: 所有請求和回應使用 UTF-8 編碼
4. **排序規則**: 列表查詢預設以 `created_at` 降序排列（最新的在前）
5. **索引優化**: 資料表已針對 `project`、`status`、`created_at` 建立索引，查詢效能良好

---

## 相關檔案

- **Migration**: `backend/database/migrations/create_notifications_table.sql`
- **Model**: `backend/app/Models/NotificationModel.php`
- **Controller**: `backend/app/Controllers/Notification.php`
- **Routes**: `backend/app/Config/Routes.php`

---

## 更新日誌

### 2025-11-02
- ✅ 初始版本發布
- ✅ 實作基本 CRUD 功能
- ✅ 新增狀態更新功能
- ✅ 新增專案與狀態篩選功能
