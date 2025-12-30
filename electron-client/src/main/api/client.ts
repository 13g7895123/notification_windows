import { Logger } from '../logger/logger';

export interface ErrorDetails {
    type: 'http_error' | 'api_failure' | 'network_error' | 'timeout';
    method: string;
    url: string;
    requestHeaders?: Record<string, string>;
    requestBody?: any;
    responseStatus?: number;
    responseStatusText?: string;
    responseHeaders?: Record<string, string>;
    responseBody?: string;
    errorName?: string;
    errorMessage?: string;
    duration: number;
    timestamp: string;
}

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
        const requestHeaders = {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
        };

        const startTime = Date.now();
        this.logger.debug(`API 請求: GET ${url}`);
        this.logger.debug(`請求 Headers: ${JSON.stringify({ ...requestHeaders, 'X-API-Key': this.apiKey.substring(0, 8) + '...' })}`);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                method: 'GET',
                headers: requestHeaders,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;

            if (!response.ok) {
                // 記錄完整錯誤資訊
                let errorBody = '';
                let errorData: any = null;
                try {
                    errorBody = await response.text();
                    errorData = JSON.parse(errorBody);
                } catch (e) {
                    // 如果無法解析 JSON，使用原始文本
                }

                const errorDetails: ErrorDetails = {
                    type: 'http_error',
                    method: 'GET',
                    url,
                    requestHeaders: { ...requestHeaders, 'X-API-Key': this.apiKey.substring(0, 8) + '***' },
                    responseStatus: response.status,
                    responseStatusText: response.statusText,
                    responseHeaders: Object.fromEntries(response.headers.entries()),
                    responseBody: errorBody || '(空)',
                    duration,
                    timestamp: new Date().toISOString(),
                };

                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                this.logger.error('API 呼叫失敗 - 完整資訊:');
                this.logger.error(`請求方法: ${errorDetails.method}`);
                this.logger.error(`請求 URL: ${url}`);
                this.logger.error(`請求 Headers: ${JSON.stringify(errorDetails.requestHeaders)}`);
                this.logger.error(`響應狀態: HTTP ${response.status} ${response.statusText}`);
                this.logger.error(`響應 Headers: ${JSON.stringify(errorDetails.responseHeaders)}`);
                this.logger.error(`響應內容: ${errorBody || '(空)'}`);
                this.logger.error(`耗時: ${duration}ms`);
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                const errorMessage = errorData?.message || errorBody || `HTTP ${response.status}`;
                const error: any = new Error(`API 回應錯誤: ${errorMessage}`);
                error.details = errorDetails;
                throw error;
            }

            const responseBody = await response.text();
            const data = JSON.parse(responseBody) as ApiResponse;
            this.logger.debug(`API 回應: HTTP 200 (${duration}ms) | 數量: ${data.count} | 成功: ${data.success}`);

            if (!data.success) {
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                this.logger.error('API 回應失敗 - 完整資訊:');
                this.logger.error(`請求 URL: ${url}`);
                this.logger.error(`響應狀態: HTTP 200 (但 success=false)`);
                this.logger.error(`響應內容: ${responseBody}`);
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                throw new Error(`API 回應失敗: ${data.message}`);
            }

            return data.data;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (error instanceof Error && error.name === 'AbortError') {
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                this.logger.error('API 請求逾時:');
                this.logger.error(`請求 URL: ${url}`);
                this.logger.error(`逾時設定: ${this.timeout}ms`);
                this.logger.error(`實際耗時: ${duration}ms`);
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                throw new Error('API 請求逾時');
            }
            // 如果錯誤不是我們拋出的，記錄網絡層錯誤
            if (error instanceof Error && !error.message?.startsWith('API 回應')) {
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                this.logger.error('網絡層錯誤:');
                this.logger.error(`請求 URL: ${url}`);
                this.logger.error(`錯誤類型: ${error.name}`);
                this.logger.error(`錯誤訊息: ${error.message}`);
                this.logger.error(`完整錯誤: ${error}`);
                this.logger.error(`耗時: ${duration}ms`);
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            }
            throw error;
        }
    }

    async updateNotificationStatus(id: string, status: 'delivered' | 'read' | 'dismissed' = 'delivered'): Promise<void> {
        const url = `${this.baseURL}/api/notifications/windows/${id}/status`;
        const payload = { status };
        const requestHeaders = {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
        };

        const startTime = Date.now();
        this.logger.debug(`API 請求: PATCH ${url} | Body: ${JSON.stringify(payload)}`);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                method: 'PATCH',
                headers: requestHeaders,
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;

            if (!response.ok) {
                // 記錄完整錯誤資訊
                let errorBody = '';
                let errorData: any = null;
                try {
                    errorBody = await response.text();
                    errorData = JSON.parse(errorBody);
                } catch (e) {
                    // 如果無法解析 JSON，使用原始文本
                }

                const errorDetails: ErrorDetails = {
                    type: 'http_error',
                    method: 'PATCH',
                    url,
                    requestHeaders: { ...requestHeaders, 'X-API-Key': this.apiKey.substring(0, 8) + '***' },
                    requestBody: payload,
                    responseStatus: response.status,
                    responseStatusText: response.statusText,
                    responseHeaders: Object.fromEntries(response.headers.entries()),
                    responseBody: errorBody || '(空)',
                    duration,
                    timestamp: new Date().toISOString(),
                };

                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                this.logger.error('API 呼叫失敗 - 完整資訊:');
                this.logger.error(`請求方法: ${errorDetails.method}`);
                this.logger.error(`請求 URL: ${url}`);
                this.logger.error(`請求 Headers: ${JSON.stringify(errorDetails.requestHeaders)}`);
                this.logger.error(`請求 Body: ${JSON.stringify(payload)}`);
                this.logger.error(`響應狀態: HTTP ${response.status} ${response.statusText}`);
                this.logger.error(`響應 Headers: ${JSON.stringify(errorDetails.responseHeaders)}`);
                this.logger.error(`響應內容: ${errorBody || '(空)'}`);
                this.logger.error(`耗時: ${duration}ms`);
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                const errorMessage = errorData?.message || errorBody || `HTTP ${response.status}`;
                const error: any = new Error(`API 回應錯誤: ${errorMessage}`);
                error.details = errorDetails;
                throw error;
            }

            const responseBody = await response.text();
            const data = JSON.parse(responseBody) as ApiResponse;
            this.logger.debug(`API 回應: HTTP 200 (${duration}ms) | 成功: ${data.success} | 訊息: ${data.message}`);

            if (!data.success) {
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                this.logger.error('API 回應失敗 - 完整資訊:');
                this.logger.error(`請求 URL: ${url}`);
                this.logger.error(`請求 Body: ${JSON.stringify(payload)}`);
                this.logger.error(`響應狀態: HTTP 200 (但 success=false)`);
                this.logger.error(`響應內容: ${responseBody}`);
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                throw new Error(`API 回應失敗: ${data.message}`);
            }
        } catch (error) {
            const duration = Date.now() - startTime;
            if (error instanceof Error && error.name === 'AbortError') {
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                this.logger.error('API 請求逾時:');
                this.logger.error(`請求 URL: ${url}`);
                this.logger.error(`請求 Body: ${JSON.stringify(payload)}`);
                this.logger.error(`逾時設定: ${this.timeout}ms`);
                this.logger.error(`實際耗時: ${duration}ms`);
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                throw new Error('API 請求逾時');
            }
            // 如果錯誤不是我們拋出的，記錄網絡層錯誤
            if (error instanceof Error && !error.message?.startsWith('API 回應')) {
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                this.logger.error('網絡層錯誤:');
                this.logger.error(`請求 URL: ${url}`);
                this.logger.error(`請求 Body: ${JSON.stringify(payload)}`);
                this.logger.error(`錯誤類型: ${error.name}`);
                this.logger.error(`錯誤訊息: ${error.message}`);
                this.logger.error(`完整錯誤: ${error}`);
                this.logger.error(`耗時: ${duration}ms`);
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            }
            throw error;
        }
    }

    async testConnection(): Promise<boolean> {
        const url = `${this.baseURL}/api/notifications/windows/pending`;
        const requestHeaders = {
            'X-API-Key': this.apiKey,
        };
        const startTime = Date.now();

        this.logger.debug(`測試連線: GET ${url}`);
        this.logger.debug(`請求 Headers: ${JSON.stringify({ 'X-API-Key': this.apiKey.substring(0, 8) + '...' })}`);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, {
                method: 'GET',
                headers: requestHeaders,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;

            if (!response.ok) {
                // 讀取錯誤詳情
                let errorBody = '';
                let errorData: any = null;
                try {
                    errorBody = await response.text();
                    errorData = JSON.parse(errorBody);
                } catch (e) {
                    // 如果無法解析 JSON，使用原始文本
                }

                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                this.logger.error('測試連線失敗 - 完整資訊:');
                this.logger.error(`請求方法: GET`);
                this.logger.error(`請求 URL: ${url}`);
                this.logger.error(`請求 Headers: ${JSON.stringify({ 'X-API-Key': this.apiKey.substring(0, 8) + '***' })}`);
                this.logger.error(`響應狀態: HTTP ${response.status} ${response.statusText}`);
                this.logger.error(`響應 Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
                this.logger.error(`響應內容: ${errorBody || '(空)'}`);
                this.logger.error(`耗時: ${duration}ms`);
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                
                const errorMessage = errorData?.message || errorBody || `HTTP ${response.status}`;
                throw new Error(`HTTP ${response.status}: ${errorMessage}`);
            }

            this.logger.info(`API 連線測試成功 (${duration}ms)`);
            return true;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (error instanceof Error && error.name === 'AbortError') {
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                this.logger.error('測試連線逾時:');
                this.logger.error(`請求 URL: ${url}`);
                this.logger.error(`逾時設定: 5000ms`);
                this.logger.error(`實際耗時: ${duration}ms`);
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            } else if (error instanceof Error && !error.message?.startsWith('HTTP ')) {
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                this.logger.error('網絡層錯誤:');
                this.logger.error(`請求 URL: ${url}`);
                this.logger.error(`錯誤類型: ${error.name}`);
                this.logger.error(`錯誤訊息: ${error.message}`);
                this.logger.error(`完整錯誤: ${error}`);
                this.logger.error(`耗時: ${duration}ms`);
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            }
            throw error;
        }
    }
}
