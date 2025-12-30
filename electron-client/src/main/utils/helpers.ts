/**
 * 通用工具函數 - 可獨立於 Electron 測試
 */

/**
 * 格式化日誌訊息
 */
export function formatLogMessage(level: string, message: string, timestamp?: Date): string {
    const now = timestamp || new Date();
    const dateStr = now.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    return `[${dateStr}] [${level}] ${message}`;
}

/**
 * 驗證設定值
 */
export function validateConfig(config: {
    domain?: string;
    apiKey?: string;
    interval?: number;
    debug?: boolean;
}): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.domain !== undefined) {
        if (typeof config.domain !== 'string') {
            errors.push('domain 必須是字串');
        } else if (config.domain.length === 0) {
            errors.push('domain 不可為空');
        } else if (!config.domain.startsWith('http://') && !config.domain.startsWith('https://')) {
            errors.push('domain 必須以 http:// 或 https:// 開頭');
        }
    }

    if (config.interval !== undefined) {
        if (typeof config.interval !== 'number') {
            errors.push('interval 必須是數字');
        } else if (config.interval < 1 || config.interval > 3600) {
            errors.push('interval 必須介於 1 到 3600 之間');
        }
    }

    if (config.debug !== undefined && typeof config.debug !== 'boolean') {
        errors.push('debug 必須是布林值');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * 解析 API 通知回應
 */
export interface NotificationItem {
    id: string;
    type: string;
    title: string;
    message: string;
    notified: boolean;
    created_at: string;
}

export interface ApiResponseData {
    notifications: NotificationItem[];
    count: number;
}

export function parseNotificationsResponse(responseBody: string): {
    success: boolean;
    notifications: NotificationItem[];
    count: number;
    error?: string;
} {
    try {
        const data = JSON.parse(responseBody);

        if (!data.success) {
            return {
                success: false,
                notifications: [],
                count: 0,
                error: data.message || 'API 回應失敗',
            };
        }

        const notifications = data.data?.notifications || [];
        const count = data.data?.count || 0;

        return {
            success: true,
            notifications: Array.isArray(notifications) ? notifications : [],
            count,
        };
    } catch (error) {
        return {
            success: false,
            notifications: [],
            count: 0,
            error: `JSON 解析錯誤: ${error}`,
        };
    }
}

/**
 * 建構 API URL
 */
export function buildApiUrl(domain: string, endpoint: string): string {
    // 移除 domain 結尾的斜線
    const cleanDomain = domain.replace(/\/+$/, '');
    // 確保 endpoint 以斜線開頭
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${cleanDomain}${cleanEndpoint}`;
}
