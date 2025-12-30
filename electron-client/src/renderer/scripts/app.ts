// 擴展 Window 介面以包含 electronAPI
declare global {
    interface Window {
        electronAPI: {
            getConfig: () => Promise<AppConfig>;
            saveConfig: (config: AppConfig) => Promise<boolean>;
            minimize: () => Promise<void>;
            close: () => Promise<void>;
            startMonitoring: () => Promise<boolean>;
            stopMonitoring: () => Promise<boolean>;
            getMonitoringStatus: () => Promise<boolean>;
            testApi: () => Promise<{ success: boolean; message: string }>;
            testNotification: () => Promise<boolean>;
            getAppVersion: () => Promise<string>;
            onNotificationReceived: (callback: (notification: NotificationItem) => void) => void;
            onMonitoringStatus: (callback: (status: boolean) => void) => void;
            onError: (callback: (error: string) => void) => void;
            onApiError: (callback: (error: { message: string; details: any }) => void) => void;
            removeAllListeners: () => void;
        };
    }
}

interface AppConfig {
    domain: string;
    apiKey: string;
    interval: number;
    debug: boolean;
}

interface NotificationItem {
    id: string;
    project: string;
    title: string;
    message: string;
    created_at: string;
}

// DOM 元素
const elements = {
    domain: document.getElementById('domain') as HTMLInputElement,
    apiKey: document.getElementById('apiKey') as HTMLInputElement,
    interval: document.getElementById('interval') as HTMLInputElement,
    debug: document.getElementById('debug') as HTMLInputElement,
    btnSave: document.getElementById('btn-save') as HTMLButtonElement,
    btnTest: document.getElementById('btn-test') as HTMLButtonElement,
    btnStart: document.getElementById('btn-start') as HTMLButtonElement,
    btnStop: document.getElementById('btn-stop') as HTMLButtonElement,
    btnTestNotify: document.getElementById('btn-test-notify') as HTMLButtonElement,

    btnCopyGuide: document.getElementById('btn-copy-guide') as HTMLButtonElement,
    statusBadge: document.getElementById('status-badge') as HTMLDivElement,
    historyList: document.getElementById('history-list') as HTMLDivElement,
    appVersion: document.getElementById('app-version') as HTMLDivElement,
};

// 最大歷史記錄數量
const MAX_HISTORY = 50;

// 初始化
async function init(): Promise<void> {
    // 載入設定
    const config = await window.electronAPI.getConfig();
    elements.domain.value = config.domain;
    elements.apiKey.value = config.apiKey;
    elements.interval.value = String(config.interval);
    elements.debug.checked = config.debug;

    // 顯示版本號
    const version = await window.electronAPI.getAppVersion();
    if (elements.appVersion) {
        elements.appVersion.textContent = `v${version}`;
    }

    // 檢查監控狀態
    const isMonitoring = await window.electronAPI.getMonitoringStatus();
    updateMonitoringUI(isMonitoring);

    // 設定事件監聽
    setupEventListeners();
    setupIPCListeners();
}

function setupEventListeners(): void {
    // 儲存設定
    elements.btnSave.addEventListener('click', async () => {
        const config: AppConfig = {
            domain: elements.domain.value,
            apiKey: elements.apiKey.value,
            interval: parseInt(elements.interval.value) || 5,
            debug: elements.debug.checked,
        };

        await window.electronAPI.saveConfig(config);
        addHistoryItem('設定已儲存', '設定檔已更新', 'info');
    });

    // 測試 API
    elements.btnTest.addEventListener('click', async () => {
        elements.btnTest.disabled = true;
        elements.btnTest.textContent = '測試中...';

        try {
            // 先儲存目前設定
            const config: AppConfig = {
                domain: elements.domain.value,
                apiKey: elements.apiKey.value,
                interval: parseInt(elements.interval.value) || 5,
                debug: elements.debug.checked,
            };
            await window.electronAPI.saveConfig(config);

            const result = await window.electronAPI.testApi();
            if (result.success) {
                addHistoryItem('API 測試成功', result.message, 'success');
            } else {
                addHistoryItem('API 測試失敗', result.message, 'error');
            }
        } catch (error) {
            addHistoryItem('API 測試錯誤', String(error), 'error');
        } finally {
            elements.btnTest.disabled = false;
            elements.btnTest.textContent = '🔗 測試 API';
        }
    });

    // 測試通知
    elements.btnTestNotify.addEventListener('click', async () => {
        elements.btnTestNotify.disabled = true;
        try {
            await window.electronAPI.testNotification();
            addHistoryItem('測試通知已發送', '請檢查右下角是否有通知視窗', 'info');
        } catch (error) {
            addHistoryItem('測試通知失敗', String(error), 'error');
        } finally {
            setTimeout(() => {
                elements.btnTestNotify.disabled = false;
            }, 1000);
        }
    });

    // 啟動監控
    elements.btnStart.addEventListener('click', async () => {
        // 先儲存設定
        const config: AppConfig = {
            domain: elements.domain.value,
            apiKey: elements.apiKey.value,
            interval: parseInt(elements.interval.value) || 5,
            debug: elements.debug.checked,
        };
        await window.electronAPI.saveConfig(config);

        await window.electronAPI.startMonitoring();
    });

    // 停止監控
    elements.btnStop.addEventListener('click', async () => {
        await window.electronAPI.stopMonitoring();
    });



    // 視窗控制
    document.getElementById('win-min')?.addEventListener('click', () => {
        window.electronAPI.minimize();
    });

    document.getElementById('win-close')?.addEventListener('click', () => {
        window.electronAPI.close();
    });

    // API Key 顯示/隱藏切換
    document.getElementById('toggle-api-key')?.addEventListener('click', () => {
        const apiKeyInput = elements.apiKey;
        const toggleBtn = document.getElementById('toggle-api-key');

        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            if (toggleBtn) {
                toggleBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            }
        } else {
            apiKeyInput.type = 'password';
            if (toggleBtn) {
                toggleBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        }
    });

    // 複製整合說明
    elements.btnCopyGuide?.addEventListener('click', async () => {
        const originalText = elements.btnCopyGuide.innerHTML;
        elements.btnCopyGuide.disabled = true;

        try {
            const markdown = getIntegrationGuideMarkdown();
            await navigator.clipboard.writeText(markdown);

            elements.btnCopyGuide.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>已複製!</span>
            `;
            addHistoryItem('整合說明已複製', 'Markdown 格式已複製到剪貼簿', 'success');

            setTimeout(() => {
                elements.btnCopyGuide.innerHTML = originalText;
                elements.btnCopyGuide.disabled = false;
            }, 2000);
        } catch (error) {
            addHistoryItem('複製失敗', String(error), 'error');
            elements.btnCopyGuide.innerHTML = originalText;
            elements.btnCopyGuide.disabled = false;
        }
    });
}

function setupIPCListeners(): void {
    // 監控狀態變更
    window.electronAPI.onMonitoringStatus((status: boolean) => {
        updateMonitoringUI(status);
        if (status) {
            addHistoryItem('監控已啟動', `間隔: ${elements.interval.value} 秒`, 'info');
        } else {
            addHistoryItem('監控已停止', '', 'info');
        }
    });

    // 收到通知
    window.electronAPI.onNotificationReceived((notification: NotificationItem) => {
        addHistoryItem(notification.title, notification.message, 'notification');
    });

    // 錯誤
    window.electronAPI.onError((error: string) => {
        addHistoryItem('錯誤', error, 'error', null);
    });

    // API 錯誤（包含詳細資訊）
    window.electronAPI.onApiError((error: { message: string; details: any }) => {
        addHistoryItem('API 錯誤', error.message, 'error', error.details);
    });
}

function updateMonitoringUI(isMonitoring: boolean): void {
    elements.btnStart.disabled = isMonitoring;
    elements.btnStop.disabled = !isMonitoring;

    const statusText = elements.statusBadge.querySelector('.status-text');
    if (statusText) {
        statusText.textContent = isMonitoring ? '監控中' : '已停止';
    }

    if (isMonitoring) {
        elements.statusBadge.classList.add('active');
    } else {
        elements.statusBadge.classList.remove('active');
    }
}

function addHistoryItem(title: string, message: string, type: 'info' | 'success' | 'error' | 'notification', details?: any): void {
    // 移除空狀態提示
    const emptyEl = elements.historyList.querySelector('.history-empty');
    if (emptyEl) {
        emptyEl.remove();
    }

    // 建立歷史項目
    const item = document.createElement('div');
    item.className = 'history-item';

    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-TW');

    // 根據類型設定 class
    item.classList.add(type);
    if (details) {
        item.classList.add('has-details');
    }

    let detailsHtml = '';
    if (details) {
        const detailsJson = JSON.stringify(details, null, 2);
        detailsHtml = `
        <div class="history-details" style="display: none;">
            <div class="detail-row"><strong>錯誤類型:</strong> ${escapeHtml(details.type || 'unknown')}</div>
            <div class="detail-row"><strong>請求方法:</strong> ${escapeHtml(details.method || 'N/A')}</div>
            <div class="detail-row"><strong>請求 URL:</strong> <code>${escapeHtml(details.url || 'N/A')}</code></div>
            ${details.requestBody ? `<div class="detail-row"><strong>請求 Body:</strong> <pre>${escapeHtml(JSON.stringify(details.requestBody, null, 2))}</pre></div>` : ''}
            ${details.responseStatus ? `<div class="detail-row"><strong>響應狀態:</strong> <span class="status-code">HTTP ${details.responseStatus} ${escapeHtml(details.responseStatusText || '')}</span></div>` : ''}
            ${details.responseBody ? `<div class="detail-row"><strong>響應內容:</strong> <pre>${escapeHtml(details.responseBody)}</pre></div>` : ''}
            ${details.errorMessage ? `<div class="detail-row"><strong>錯誤訊息:</strong> ${escapeHtml(details.errorMessage)}</div>` : ''}
            <div class="detail-row"><strong>耗時:</strong> ${details.duration || 0}ms</div>
            <div class="detail-row"><strong>時間戳:</strong> ${new Date(details.timestamp).toLocaleString('zh-TW')}</div>
            <details class="json-details">
                <summary>完整 JSON</summary>
                <div class="json-content">
                    <button class="copy-json-btn" title="複製 JSON">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        複製
                    </button>
                    <pre class="json-data">${escapeHtml(detailsJson)}</pre>
                </div>
            </details>
        </div>
        `;
    }

    item.innerHTML = `
    <div class="history-header" ${details ? 'style="cursor: pointer;"' : ''}>
       <span class="history-title">${escapeHtml(title)}${details ? ' <span class="expand-icon">▼</span>' : ''}</span>
       <span class="history-time">${timeStr}</span>
    </div>
    ${message ? `<div class="history-message">${escapeHtml(message)}</div>` : ''}
    ${detailsHtml}
    `;

    // 如果有詳細資訊，添加點擊事件
    if (details) {
        const header = item.querySelector('.history-header') as HTMLElement;
        const detailsEl = item.querySelector('.history-details') as HTMLElement;
        const expandIcon = item.querySelector('.expand-icon') as HTMLElement;

        header.addEventListener('click', () => {
            const isExpanded = detailsEl.style.display !== 'none';
            detailsEl.style.display = isExpanded ? 'none' : 'block';
            item.classList.toggle('expanded', !isExpanded);
            if (expandIcon) {
                expandIcon.textContent = isExpanded ? '▼' : '▲';
            }
        });

        // 複製 JSON 按鈕事件
        const copyBtn = item.querySelector('.copy-json-btn') as HTMLButtonElement;
        if (copyBtn) {
            const detailsJson = JSON.stringify(details, null, 2);
            copyBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const originalHtml = copyBtn.innerHTML;

                try {
                    await navigator.clipboard.writeText(detailsJson);
                    copyBtn.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        已複製
                    `;
                    copyBtn.classList.add('copied');

                    setTimeout(() => {
                        copyBtn.innerHTML = originalHtml;
                        copyBtn.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    console.error('複製失敗:', err);
                    copyBtn.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        失敗
                    `;
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHtml;
                    }, 2000);
                }
            });
        }
    }

    // 插入到開頭
    elements.historyList.insertBefore(item, elements.historyList.firstChild);

    // 限制歷史記錄數量
    while (elements.historyList.children.length > MAX_HISTORY) {
        elements.historyList.removeChild(elements.historyList.lastChild!);
    }
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getIntegrationGuideMarkdown(): string {
    return `# Windows Client 整合說明

## 接收通知 (Windows Client 整合)

Windows 客戶端應用程式應定期輪詢以下接口，以獲取並顯示新的通知訊息。

### API 端點

#### 1. 獲取待處理通知
- **Method**: GET
- **URL**: https://notify.try-8verything.com/api/notifications/windows/pending
- **Header**: X-API-Key: YOUR_API_KEY
- **說明**: 預設回傳最近 50 筆待處理通知。

**請求範例**:
\`\`\`bash
curl -X GET https://notify.try-8verything.com/api/notifications/windows/pending \\
  -H "X-API-Key: YOUR_API_KEY"
\`\`\`

**成功回應**:
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "title": "通知標題",
      "message": "通知內容",
      "project": "專案名稱",
      "created_at": "2025-12-30 12:00:00"
    }
  ],
  "count": 1
}
\`\`\`

#### 2. 更新通知狀態
- **Method**: PATCH
- **URL**: https://notify.try-8verything.com/api/notifications/windows/:id/status
- **Content-Type**: application/json
- **Header**: X-API-Key: YOUR_API_KEY
- **Body**:
\`\`\`json
{
  "status": "delivered"
}
\`\`\`

**狀態可選值**:
- \`delivered\` - 已送達（客戶端已接收並顯示通知）
- \`read\` - 已讀（使用者已查看通知）
- \`dismissed\` - 忽略（使用者關閉通知）

**請求範例**:
\`\`\`bash
curl -X PATCH https://notify.try-8verything.com/api/notifications/windows/123/status \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"status": "delivered"}'
\`\`\`

## 快速開始

### 步驟 1：安裝依賴

\`\`\`bash
cd electron-client
npm install
\`\`\`

### 步驟 2：設定 API Key

**方式 A：在 GUI 中設定（推薦）**

1. 啟動應用程式：
   \`\`\`bash
   ./start.sh
   \`\`\`

2. 在 Configuration 面板中填入：
   - **API DOMAIN**: \`https://notify.try-8verything.com\`
   - **API KEY**: 貼上您的 API Key（點擊眼睛圖示可顯示/隱藏）
   - **INTERVAL**: 輪詢間隔秒數（建議 5-30 秒）

3. 點擊 **SAVE CONFIG** 儲存設定

4. 點擊 **TEST API** 測試連線是否成功

**方式 B：直接編輯配置檔**

1. 複製範例設定檔：
   \`\`\`bash
   cp config.json.example config.json
   \`\`\`

2. 編輯 \`config.json\`：
   \`\`\`json
   {
     "domain": "https://notify.try-8verything.com",
     "apiKey": "YOUR_API_KEY_HERE",
     "project": "your_project_name",
     "interval": 5,
     "debug": false
   }
   \`\`\`

### 步驟 3：啟動監控

1. 確認設定已儲存
2. 點擊 **START MONITORING** 開始監控
3. 應用程式會自動輪詢 API 並顯示新通知

## 接收通知流程

### 1. 自動輪詢

客戶端每隔設定的時間間隔會自動呼叫：
\`\`\`
GET /api/notifications/windows/pending
\`\`\`

### 2. 顯示通知

收到新通知後，客戶端會：
- 在 Windows 系統右下角顯示通知視窗
- 顯示通知的標題和內容
- 在應用程式的 Activity Log 中記錄

### 3. 更新狀態

顯示通知後，自動將狀態更新為 \`delivered\`：
\`\`\`
PATCH /api/notifications/windows/{id}/status
Body: {"status": "delivered"}
\`\`\`

## API Key 設定指南

### 如何取得 API Key

1. 登入管理後台
2. 前往 API 設定頁面
3. 建立或複製現有的 API Key
4. **完整複製** API Key（不要有空格或換行）

### 在應用程式中設定

1. 開啟應用程式的 Configuration 面板
2. 在 **API KEY** 欄位貼上您的 API Key
3. 點擊眼睛圖示可以顯示/隱藏 API Key（方便檢查）
4. 點擊 **SAVE CONFIG** 儲存
5. 點擊 **TEST API** 驗證 API Key 是否有效

### 常見問題

**Q: 為什麼顯示 UNAUTHORIZED 錯誤？**
A: 請檢查：
- API Key 是否正確複製（沒有多餘空格）
- API Key 是否有效且未過期
- API Key 是否有正確的權限

**Q: 如何確認 API Key 已正確設定？**
A: 
1. 開啟應用程式並查看 API KEY 欄位是否有值
2. 點擊 **TEST API** 按鈕測試連線
3. 查看 Activity Log 是否顯示「API 連線成功」

**Q: GitHub 的環境變數會自動套用嗎？**
A: 不會。GitHub Actions 的環境變數（如 WINDOWS_NOTIFY_API_KEY）只在 CI/CD 中使用，需要在本地應用程式的 GUI 或 config.json 中手動設定。

## 診斷工具

如果遇到問題，可以使用診斷腳本：

\`\`\`bash
./diagnose.sh
\`\`\`

這會檢查：
- ✅ 設定檔是否存在
- ✅ API Key 是否已設定
- ✅ API Key 長度和格式
- ✅ 實際測試 API 連線
- ✅ 顯示詳細的錯誤訊息

## 日誌查看

啟用 debug 模式以查看詳細日誌：

1. 在 Configuration 面板中勾選 **DEBUG MODE**
2. 點擊 **SAVE CONFIG**
3. 查看日誌檔案：
   \`\`\`bash
   tail -f logs/notification_$(date +%Y%m%d).log
   \`\`\`

日誌會顯示：
- API Key 是否已設定（長度）
- 每次 API 請求的詳細資訊
- API 回應的狀態碼和內容
- 錯誤訊息的詳細資訊

## 進階設定

### 自訂輪詢間隔

在 **INTERVAL (SEC)** 欄位設定：
- **5-10 秒**: 即時性需求高
- **10-30 秒**: 一般使用
- **60 秒以上**: 降低伺服器負載

### 開機自動啟動

Windows 系統：
1. 按 \`Win + R\`
2. 輸入 \`shell:startup\`
3. 將應用程式的捷徑放入該資料夾

## 系統需求

- **作業系統**: Windows 10 或更新版本
- **Node.js**: 18.x 或更新版本
- **記憶體**: 最少 200MB RAM
- **網路**: 需要連接到 notify.try-8verything.com

## 相關文件

- **API 完整文件**: 查看伺服器端 API 文件
- **故障排除**: 參考 API_KEY_SETUP.md
- **更新說明**: 參考 UPDATE_NOTES.md

## 授權

MIT License
`;
}

// 啟動應用
document.addEventListener('DOMContentLoaded', init);

export { };
