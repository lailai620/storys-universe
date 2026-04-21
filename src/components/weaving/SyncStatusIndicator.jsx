import React, { useState, useEffect, useCallback } from 'react';

/**
 * ☁️ 雲端同步狀態指示器
 * 顯示三種狀態：已同步 / 同步中 / 離線模式
 */
const SyncStatusIndicator = ({ isSyncing = false }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const getStatus = useCallback(() => {
        if (!isOnline) return { icon: 'cloud_off', label: '離線模式', color: 'text-amber-400', bg: 'bg-amber-400/10', pulse: false };
        if (isSyncing) return { icon: 'cloud_sync', label: '同步中...', color: 'text-blue-400', bg: 'bg-blue-400/10', pulse: true };
        return { icon: 'cloud_done', label: '已同步', color: 'text-emerald-400', bg: 'bg-emerald-400/10', pulse: false };
    }, [isOnline, isSyncing]);

    const status = getStatus();

    return (
        <div className="relative">
            <button
                onClick={() => setShowTooltip(!showTooltip)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg} transition-all duration-300`}
                aria-label={`雲端狀態: ${status.label}`}
            >
                <span className={`material-symbols-outlined text-[16px] ${status.color} ${status.pulse ? 'animate-pulse' : ''}`}>
                    {status.icon}
                </span>
                <span className={`text-[11px] font-medium ${status.color} hidden sm:inline`}>
                    {status.label}
                </span>
            </button>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute top-full right-0 mt-2 w-48 p-3 rounded-xl bg-surface-dark/95 backdrop-blur-md border border-white/10 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className={`material-symbols-outlined text-[18px] ${status.color}`}>{status.icon}</span>
                        <span className="text-sm font-semibold text-text-primary-dark">{status.label}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary-dark leading-relaxed">
                        {!isOnline
                            ? '目前處於離線模式，您的變更將暫存於本機，待連線後自動同步。'
                            : isSyncing
                                ? '正在將最新變更上傳至雲端...'
                                : '所有資料已安全備份至雲端。'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default SyncStatusIndicator;
