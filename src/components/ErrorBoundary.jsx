import React from 'react';

/**
 * ErrorBoundary - 全域錯誤邊界元件
 * ================================
 * 當子元件發生 JavaScript 錯誤時，顯示友善的錯誤頁面
 * 而不是讓整個應用程式崩潰
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // 更新 state，下一次渲染會顯示備用 UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // 記錄錯誤到控制台
        console.error('🚨 應用程式錯誤:', error);
        console.error('錯誤堆疊:', errorInfo.componentStack);

        this.setState({ errorInfo });

        // 未來可整合錯誤追蹤服務 (如 Sentry)
        // reportErrorToService(error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/storys-universe/';
    };

    render() {
        if (this.state.hasError) {
            // 錯誤 UI
            return (
                <div className="min-h-screen bg-[#0f1016] flex items-center justify-center p-4">
                    <div className="max-w-md w-full text-center">
                        {/* 錯誤圖示 */}
                        <div className="mb-6">
                            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-rose-500/20 to-red-500/20 flex items-center justify-center border border-rose-500/30">
                                <span className="text-5xl">🛸</span>
                            </div>
                        </div>

                        {/* 錯誤標題 */}
                        <h1 className="text-2xl font-bold text-white mb-3">
                            哎呀！遇到太空亂流了
                        </h1>
                        <p className="text-slate-400 mb-8">
                            故事宇宙暫時遇到了一些問題，<br />
                            請嘗試重新載入或返回首頁。
                        </p>

                        {/* 操作按鈕 */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReload}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                            >
                                🔄 重新載入
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="px-6 py-3 bg-white/10 text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all"
                            >
                                🏠 返回首頁
                            </button>
                        </div>

                        {/* 開發模式下顯示錯誤詳情 */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-8 text-left bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                                <summary className="text-red-400 font-medium cursor-pointer">
                                    🔧 開發者錯誤詳情
                                </summary>
                                <pre className="mt-3 text-xs text-red-300 overflow-auto max-h-48 whitespace-pre-wrap">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        // 正常渲染子元件
        return this.props.children;
    }
}

export default ErrorBoundary;
