/**
 * 📊 效能監控工具 — performanceService.js
 * 追蹤 Core Web Vitals (LCP, FID, CLS, TTFB)
 * 僅在 Production 環境啟用以減少開發干擾
 */

/**
 * 監聽 Web Vitals 指標
 * @param {Function} onReport - 回呼函式，接收 { name, value, rating } 
 */
export const initPerformanceMonitoring = (onReport) => {
    if (typeof window === 'undefined') return;

    const reportMetric = (metric) => {
        const entry = {
            name: metric.name,
            value: Math.round(metric.value),
            rating: metric.rating || getRating(metric.name, metric.value),
            timestamp: Date.now(),
        };

        if (onReport) {
            onReport(entry);
        }

        // 開發環境：顯示在 console
        if (import.meta.env.DEV) {
            const color = entry.rating === 'good' ? '#22c55e' : entry.rating === 'needs-improvement' ? '#eab308' : '#ef4444';
            console.log(
                `%c⚡ ${entry.name}: ${entry.value}ms [${entry.rating}]`,
                `color: ${color}; font-weight: bold;`
            );
        }

        // 儲存到 localStorage（最近 20 筆）
        try {
            const metrics = JSON.parse(localStorage.getItem('weaving_perf_metrics') || '[]');
            metrics.push(entry);
            if (metrics.length > 20) metrics.splice(0, metrics.length - 20);
            localStorage.setItem('weaving_perf_metrics', JSON.stringify(metrics));
        } catch { /* ignore */ }
    };

    // 使用 PerformanceObserver API
    observeLCP(reportMetric);
    observeFID(reportMetric);
    observeCLS(reportMetric);
    observeTTFB(reportMetric);
};

function observeLCP(callback) {
    try {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const last = entries[entries.length - 1];
            callback({ name: 'LCP', value: last.startTime });
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch { /* not supported */ }
}

function observeFID(callback) {
    try {
        const observer = new PerformanceObserver((list) => {
            const entry = list.getEntries()[0];
            callback({ name: 'FID', value: entry.processingStart - entry.startTime });
        });
        observer.observe({ type: 'first-input', buffered: true });
    } catch { /* not supported */ }
}

function observeCLS(callback) {
    try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            callback({ name: 'CLS', value: clsValue * 1000 }); // ×1000 to display as integer
        });
        observer.observe({ type: 'layout-shift', buffered: true });
    } catch { /* not supported */ }
}

function observeTTFB(callback) {
    try {
        const observer = new PerformanceObserver((list) => {
            const entry = list.getEntries()[0];
            callback({ name: 'TTFB', value: entry.responseStart });
        });
        observer.observe({ type: 'navigation', buffered: true });
    } catch { /* not supported */ }
}

function getRating(name, value) {
    const thresholds = {
        LCP: [2500, 4000],
        FID: [100, 300],
        CLS: [100, 250], // after ×1000
        TTFB: [800, 1800],
    };
    const [good, poor] = thresholds[name] || [1000, 3000];
    return value <= good ? 'good' : value <= poor ? 'needs-improvement' : 'poor';
}

/**
 * 取得效能指標歷史
 */
export const getPerformanceMetrics = () => {
    try {
        return JSON.parse(localStorage.getItem('weaving_perf_metrics') || '[]');
    } catch {
        return [];
    }
};
