## 發送通知 (CI/CD 整合)

在您的 CI/CD Pipeline (如 GitHub Actions, GitLab CI 或 Jenkins) 中呼叫此接口，即可將構建狀態或系統訊息即時推送到指定使用者的 Windows 桌面。

### 請求資訊
- **Method**: POST
- **URL**: https://notify.try-8verything.com/api/notifications/windows
- **Content-Type**: application/json
- **X-API-Key**: YOUR_API_KEY

### 請求參數 (JSON Body)

| 參數名稱 | 類型 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| title | String | 是 | 通知標題，建議 20 字以內 |
| message | String | 是 | 通知內文，支援多行顯示 |
| repo | String | 是 | 專案名稱 (例如: user/repository) |
| branch | String | 否 | 觸發通知的分支名稱 |
| commit_sha | String | 否 | 完整的 Commit SHA |
| action_url | String | 否 | 點擊通知後欲跳轉的 URL |

### Curl 呼叫範例

```bash
curl -X POST https://notify.try-8verything.com/api/notifications/windows \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "title": "Build Success",
    "message": "Production build successfully completed",
    "repo": "company/frontend-app",
    "branch": "master",
    "commit_sha": "f1a2b3c4d5e6",
    "action_url": "https://vercel.com/dashboard"
  }'
```
