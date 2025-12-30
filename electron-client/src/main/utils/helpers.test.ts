import { describe, it, expect } from 'vitest';
import {
    formatLogMessage,
    validateConfig,
    parseNotificationsResponse,
    buildApiUrl,
} from './helpers';

describe('formatLogMessage', () => {
    it('should format log message with correct level', () => {
        const fixedDate = new Date('2024-01-15T10:30:00');
        const result = formatLogMessage('INFO', 'Test message', fixedDate);

        expect(result).toContain('[INFO]');
        expect(result).toContain('Test message');
    });

    it('should handle different log levels', () => {
        const fixedDate = new Date('2024-01-15T10:30:00');

        expect(formatLogMessage('DEBUG', 'Debug msg', fixedDate)).toContain('[DEBUG]');
        expect(formatLogMessage('ERROR', 'Error msg', fixedDate)).toContain('[ERROR]');
        expect(formatLogMessage('WARN', 'Warn msg', fixedDate)).toContain('[WARN]');
        expect(formatLogMessage('SUCCESS', 'Success msg', fixedDate)).toContain('[SUCCESS]');
    });
});

describe('validateConfig', () => {
    it('should return valid for correct config', () => {
        const result = validateConfig({
            domain: 'https://example.com',
            interval: 10,
            debug: true,
        });

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid domain format', () => {
        const result = validateConfig({
            domain: 'not-a-url',
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('domain 必須以 http:// 或 https:// 開頭');
    });

    it('should reject empty domain', () => {
        const result = validateConfig({
            domain: '',
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('domain 不可為空');
    });

    it('should reject interval out of range', () => {
        const result1 = validateConfig({ interval: 0 });
        const result2 = validateConfig({ interval: 3601 });

        expect(result1.valid).toBe(false);
        expect(result2.valid).toBe(false);
        expect(result1.errors).toContain('interval 必須介於 1 到 3600 之間');
    });

    it('should accept valid interval range', () => {
        expect(validateConfig({ interval: 1 }).valid).toBe(true);
        expect(validateConfig({ interval: 60 }).valid).toBe(true);
        expect(validateConfig({ interval: 3600 }).valid).toBe(true);
    });

    it('should reject non-boolean debug', () => {
        const result = validateConfig({ debug: 'true' as any });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('debug 必須是布林值');
    });
});

describe('parseNotificationsResponse', () => {
    it('should parse successful response correctly', () => {
        const response = JSON.stringify({
            success: true,
            data: {
                notifications: [
                    { id: '1', type: 'info', title: 'Test', message: 'Hello', notified: false, created_at: '2024-01-01' },
                ],
                count: 1,
            },
        });

        const result = parseNotificationsResponse(response);

        expect(result.success).toBe(true);
        expect(result.notifications).toHaveLength(1);
        expect(result.count).toBe(1);
        expect(result.notifications[0].title).toBe('Test');
    });

    it('should handle empty notifications array', () => {
        const response = JSON.stringify({
            success: true,
            data: {
                notifications: [],
                count: 0,
            },
        });

        const result = parseNotificationsResponse(response);

        expect(result.success).toBe(true);
        expect(result.notifications).toHaveLength(0);
        expect(result.count).toBe(0);
    });

    it('should handle API failure response', () => {
        const response = JSON.stringify({
            success: false,
            message: 'Unauthorized',
        });

        const result = parseNotificationsResponse(response);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unauthorized');
    });

    it('should handle invalid JSON', () => {
        const result = parseNotificationsResponse('not valid json');

        expect(result.success).toBe(false);
        expect(result.error).toContain('JSON 解析錯誤');
    });

    it('should handle missing data field', () => {
        const response = JSON.stringify({
            success: true,
        });

        const result = parseNotificationsResponse(response);

        expect(result.success).toBe(true);
        expect(result.notifications).toHaveLength(0);
        expect(result.count).toBe(0);
    });
});

describe('buildApiUrl', () => {
    it('should combine domain and endpoint correctly', () => {
        expect(buildApiUrl('https://example.com', '/api/test')).toBe('https://example.com/api/test');
    });

    it('should handle domain with trailing slash', () => {
        expect(buildApiUrl('https://example.com/', '/api/test')).toBe('https://example.com/api/test');
    });

    it('should handle endpoint without leading slash', () => {
        expect(buildApiUrl('https://example.com', 'api/test')).toBe('https://example.com/api/test');
    });

    it('should handle multiple trailing slashes', () => {
        expect(buildApiUrl('https://example.com///', '/api/test')).toBe('https://example.com/api/test');
    });
});
