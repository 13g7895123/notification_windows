import { contextBridge, ipcRenderer } from 'electron';

// 定義暴露給渲染程序的 API
const electronAPI = {
    // 設定管理
    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (config: unknown) => ipcRenderer.invoke('save-config', config),
    minimize: () => ipcRenderer.invoke('window-minimize'),
    close: () => ipcRenderer.invoke('window-close'),

    // 監控控制
    startMonitoring: () => ipcRenderer.invoke('start-monitoring'),
    stopMonitoring: () => ipcRenderer.invoke('stop-monitoring'),
    getMonitoringStatus: () => ipcRenderer.invoke('get-monitoring-status'),

    // API 測試
    testApi: () => ipcRenderer.invoke('test-api'),
    testNotification: () => ipcRenderer.invoke('test-notification'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),


    // 事件監聽
    onNotificationReceived: (callback: (notification: unknown) => void) => {
        ipcRenderer.on('notification-received', (_event, notification) => callback(notification));
    },
    onMonitoringStatus: (callback: (status: boolean) => void) => {
        ipcRenderer.on('monitoring-status', (_event, status) => callback(status));
    },
    onError: (callback: (error: string) => void) => {
        ipcRenderer.on('error', (_event, error) => callback(error));
    },
    onApiError: (callback: (error: { message: string; details: any }) => void) => {
        ipcRenderer.on('api-error', (_event, error) => callback(error));
    },

    // 移除事件監聽
    removeAllListeners: () => {
        ipcRenderer.removeAllListeners('notification-received');
        ipcRenderer.removeAllListeners('monitoring-status');
        ipcRenderer.removeAllListeners('error');
        ipcRenderer.removeAllListeners('api-error');
    },
};

// 暴露 API 到渲染程序
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript 類型定義
export type ElectronAPI = typeof electronAPI;
