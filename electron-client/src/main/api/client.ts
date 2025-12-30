import { Logger } from '../logger/logger';

export interface NotificationItem {
    id: string;
    project: string;
    title: string;
    message: string;
    status: string;
    created_at: string;
    notified_at: string;
}

export interface ApiResponse {
    success: boolean;
    data: NotificationItem[];
    count: number;
    message: string;
}

export class ApiClient {
    private baseURL: string;
    private apiKey: string;
    private logger: Logger;
    private timeout: number = 10000;

    constructor(baseURL: string, apiKey: string, logger: Logger) {
        this.baseURL = baseURL;
        this.apiKey = apiKey;
        this.logger = logger;
        
        // 調試：顯示 API Key 長度（不顯示完整內容以保安全）
        if (apiKey && apiKey.trim()) {
            this.logger.debug(`API Key 已設定 (長度: ${apiKey.length})`);
        } else {
            this.logger.error('API Key 為空或未設定！');
        }
    }

    async getUnnotifiedNotifications(): Promise<NotificationItem[]> {
        const url = `${this.baseURL}/api/notifications/windows/pending`;

        const startTime = Date.now();
        this.logger.debug(`API 請求: GET ${url}`);
        this.logger.debug(`使用 API Key: ${this.apiKey ? this.apiKey.substring(0, 8) + '...' : '(未設定)'}`);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey,
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;

            if (!response.ok) {
                this.logger.error(`API 回應錯誤: HTTP ${response.status} (${duration}ms)`);
                throw new Error(`API 回應錯誤: ${response.status}`);
            }

            const data = (await response.json()) as ApiResponse;
            this.logger.debug(`API 回應: HTTP 200 (${duration}ms) | 數量: ${data.count} | 成功: ${data.success}`);

            if (!data.success) {
                this.logger.error(`API 回應失敗: ${data.message}`);
                throw new Error(`API 回應失敗: ${data.message}`);
            }

            return data.data;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (error instanceof Error && error.name === 'AbortError') {
                this.logger.error(`API 請求逾時 (${duration}ms)`);
                throw new Error('API 請求逾時');
            }
            this.logger.error(`API 請求失敗 (${duration}ms): ${error}`);
            throw error;
        }
    }

    async updateNotificationStatus(id: string, status: 'delivered' | 'read' | 'dismissed' = 'delivered'): Promise<void> {
        const url = `${this.baseURL}/api/notifications/windows/${id}/status`;
        const payload = { status };

        const startTime = Date.now();
        this.logger.debug(`API 請求: PATCH ${url} | Body: ${JSON.stringify(payload)}`);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;

            if (!response.ok) {
                this.logger.error(`API 回應錯誤: HTTP ${response.status} (${duration}ms)`);
                throw new Error(`API 回應錯誤: ${response.status}`);
            }

            const data = (await response.json()) as ApiResponse;
            this.logger.debug(`API 回應: HTTP 200 (${duration}ms) | 成功: ${data.success} | 訊息: ${data.message}`);

            if (!data.success) {
                this.logger.error(`API 回應失敗: ${data.message}`);
                throw new Error(`API 回應失敗: ${data.message}`);
            }
        } catch (error) {
            const duration = Date.now() - startTime;
            if (error instanceof Error && error.name === 'AbortError') {
                this.logger.error(`API 請求逾時 (${duration}ms)`);
                throw new Error('API 請求逾時');
            }
            this.logger.error(`API 請求失敗 (${duration}ms): ${error}`);
            throw error;
        }
    }

    async testConnection(): Promise<boolean> {
        const url = `${this.baseURL}/api/notifications/windows/pending`;
        const startTime = Date.now();

        this.logger.debug(`測試連線: GET ${url}`);
        this.logger.debug(`API Key (前8字): ${this.apiKey ? this.apiKey.substring(0, 8) + '...' : '(未設定)'}`);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-API-Key': this.apiKey,
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;

            if (!response.ok) {
                // 讀取錯誤詳情
                let errorDetails = '';
                try {
                    const errorData = await response.json();
                    errorDetails = JSON.stringify(errorData);
                    this.logger.error(`測試連線失敗 - 伺服器回應: ${errorDetails}`);
                } catch (e) {
                    errorDetails = await response.text();
                }
                
                throw new Error(`HTTP ${response.status}: ${errorDetails}`);
            }

            this.logger.info(`API 連線測試成功 (${duration}ms)`);
            return true;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error(`API 連線測試失敗 (${duration}ms): ${error}`);
            throw error;
        }
    }
}
