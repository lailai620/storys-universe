/**
 * 🚨 錯誤監控服務 — errorService.js
 * 集中化錯誤捕捉、回報、使用者提示
 * 
 * Production 可替換為 Sentry：
 *   import * as Sentry from '@sentry/react';
 *   Sentry.init({ dsn: '...' });
 */

const MAX_ERRORS = 50;
const errorLog = [];

// ─── 錯誤等級 ─────────────────────────────────────────────
export const ErrorLevel = {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    FATAL: 'fatal',
};

// ─── 捕捉錯誤 ────────────────────────────────────────────
export const captureError = (error, context = {}) => {
    const entry = {
        timestamp: new Date().toISOString(),
        message: error?.message || String(error),
        stack: error?.stack || '',
        level: context.level || ErrorLevel.ERROR,
        component: context.component || 'unknown',
        action: context.action || '',
        userId: context.userId || 'anonymous',
        extra: context.extra || {},
    };

    // 存入本地日誌
    errorLog.push(entry);
    if (errorLog.length > MAX_ERRORS) errorLog.shift();

    // 開發環境：console 輸出
    if (import.meta.env.DEV) {
        console.group(`🚨 [${entry.level.toUpperCase()}] ${entry.component}`);
        console.error(entry.message);
        if (entry.stack) console.debug(entry.stack);
        if (Object.keys(entry.extra).length) console.table(entry.extra);
        console.groupEnd();
    }

    // 存到 localStorage（離線時用）
    try {
        const stored = JSON.parse(localStorage.getItem('weaving_error_log') || '[]');
        stored.push(entry);
        if (stored.length > MAX_ERRORS) stored.splice(0, stored.length - MAX_ERRORS);
        localStorage.setItem('weaving_error_log', JSON.stringify(stored));
    } catch { /* localStorage full — ignore */ }

    // TODO: Production 上傳到 Sentry / 自建 API
    // if (import.meta.env.PROD) {
    //     Sentry.captureException(error, { extra: entry });
    // }

    return entry;
};

// ─── 捕捉 API 錯誤 ───────────────────────────────────────
export const captureAPIError = (apiName, error, extra = {}) => {
    return captureError(error, {
        level: ErrorLevel.WARN,
        component: `API:${apiName}`,
        action: 'api_call',
        extra: { apiName, statusCode: error?.status, ...extra },
    });
};

// ─── 初始化全域錯誤監聽 ──────────────────────────────────
export const initErrorMonitoring = () => {
    // 未捕捉的 JS 錯誤
    window.addEventListener('error', (event) => {
        captureError(event.error || new Error(event.message), {
            level: ErrorLevel.FATAL,
            component: 'window',
            action: 'uncaught_error',
            extra: {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            },
        });
    });

    // 未處理的 Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
        captureError(event.reason || new Error('Unhandled rejection'), {
            level: ErrorLevel.ERROR,
            component: 'promise',
            action: 'unhandled_rejection',
        });
    });

    // 網路狀態
    window.addEventListener('offline', () => {
        captureError(new Error('Network offline'), {
            level: ErrorLevel.WARN,
            component: 'network',
            action: 'offline',
        });
    });
};

// ─── 取得錯誤日誌 ────────────────────────────────────────
export const getErrorLog = () => [...errorLog];

// ─── 清除日誌 ────────────────────────────────────────────
export const clearErrorLog = () => {
    errorLog.length = 0;
    localStorage.removeItem('weaving_error_log');
};

// ─── 使用者友善錯誤訊息 ──────────────────────────────────
export const getUserFriendlyMessage = (error) => {
    const msg = error?.message || String(error);

    if (msg.includes('NetworkError') || msg.includes('Failed to fetch')) {
        return '網路連線失敗，請檢查網路狀態後再試。';
    }
    if (msg.includes('Storage') || msg.includes('QuotaExceeded')) {
        return '儲存空間不足，請清除部分資料後再試。';
    }
    if (msg.includes('auth') || msg.includes('Auth')) {
        return '登入狀態異常，請重新登入。';
    }
    if (msg.includes('Permission') || msg.includes('denied')) {
        return '權限不足，請確認是否已授權。';
    }
    return '發生未預期的錯誤，請稍後再試。';
};
