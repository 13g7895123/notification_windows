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
            onNotificationReceived: (callback: (notification: NotificationItem) => void) => void;
            onMonitoringStatus: (callback: (status: boolean) => void) => void;
            onError: (callback: (error: string) => void) => void;
            removeAllListeners: () => void;
        };
    }
}

interface AppConfig {
    domain: string;
    project: string;
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
    project: document.getElementById('project') as HTMLInputElement,
    interval: document.getElementById('interval') as HTMLInputElement,
    debug: document.getElementById('debug') as HTMLInputElement,
    btnSave: document.getElementById('btn-save') as HTMLButtonElement,
    btnTest: document.getElementById('btn-test') as HTMLButtonElement,
    btnStart: document.getElementById('btn-start') as HTMLButtonElement,
    btnStop: document.getElementById('btn-stop') as HTMLButtonElement,
    btnTestNotify: document.getElementById('btn-test-notify') as HTMLButtonElement,
    statusBadge: document.getElementById('status-badge') as HTMLDivElement,
    historyList: document.getElementById('history-list') as HTMLDivElement,
};

// 最大歷史記錄數量
const MAX_HISTORY = 50;

// 初始化
async function init(): Promise<void> {
    // 載入設定
    const config = await window.electronAPI.getConfig();
    elements.domain.value = config.domain;
    elements.project.value = config.project;
    elements.interval.value = String(config.interval);
    elements.debug.checked = config.debug;

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
            project: elements.project.value,
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
                project: elements.project.value,
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
            project: elements.project.value,
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
}

function setupIPCListeners(): void {
    // 監控狀態變更
    window.electronAPI.onMonitoringStatus((status: boolean) => {
        updateMonitoringUI(status);
        if (status) {
            addHistoryItem('監控已啟動', `專案: ${elements.project.value || '全部'}, 間隔: ${elements.interval.value} 秒`, 'info');
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
        addHistoryItem('錯誤', error, 'error');
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

function addHistoryItem(title: string, message: string, type: 'info' | 'success' | 'error' | 'notification'): void {
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

    item.innerHTML = `
    <div class="history-header">
       <span class="history-title">${escapeHtml(title)}</span>
       <span class="history-time">${timeStr}</span>
    </div>
    ${message ? `<div class="history-message">${escapeHtml(message)}</div>` : ''}
    `;

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

// 啟動應用
document.addEventListener('DOMContentLoaded', init);

export { };
