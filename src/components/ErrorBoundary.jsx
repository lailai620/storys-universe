import React from 'react';
import { captureError, ErrorLevel } from '../services/errorService';

/**
 * 🚨 ErrorBoundary — 全域錯誤邊界
 * 捕捉子元件的 JS 錯誤，顯示織光風格的友善頁面
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });

        // 記錄到錯誤監控
        captureError(error, {
            level: ErrorLevel.FATAL,
            component: 'ErrorBoundary',
            action: 'component_crash',
            extra: { componentStack: errorInfo?.componentStack },
        });
    }

    handleReload = () => window.location.reload();
    handleGoHome = () => { window.location.href = import.meta.env.BASE_URL || '/'; };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-6" role="alert" aria-live="assertive">
                    <div className="max-w-sm w-full text-center">
                        {/* 圖示 */}
                        <div className="mb-6">
                            <div className="w-20 h-20 mx-auto rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                                <span className="text-4xl" aria-hidden="true">🧶</span>
                            </div>
                        </div>

                        {/* 標題 */}
                        <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2 font-display">
                            編織線斷了
                        </h1>
                        <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-8 leading-relaxed">
                            織光遇到了一些問題，<br />
                            請嘗試重新整理或返回首頁。
                        </p>

                        {/* 按鈕 */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleReload}
                                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary-dark transition-all active:scale-[0.98]"
                                aria-label="重新整理頁面"
                            >
                                重新整理
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="w-full py-3 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark font-medium rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                                aria-label="返回首頁"
                            >
                                返回首頁
                            </button>
                        </div>

                        {/* 開發模式錯誤詳情 */}
                        {import.meta.env.DEV && this.state.error && (
                            <details className="mt-6 text-left bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3">
                                <summary className="text-red-600 dark:text-red-400 text-xs font-medium cursor-pointer">
                                    🔧 錯誤詳情（開發模式）
                                </summary>
                                <pre className="mt-2 text-[10px] text-red-500 dark:text-red-300 overflow-auto max-h-40 whitespace-pre-wrap">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
