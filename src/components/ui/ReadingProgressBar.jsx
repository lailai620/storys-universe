import React from 'react';

/**
 * 📊 ReadingProgressBar - 閱讀進度指示器
 * =======================================
 * 顯示在頁面頂部，提供閱讀進度的視覺回饋
 * 
 * Props:
 * - current: 當前頁碼 (1-indexed)
 * - total: 總頁數
 * - showLabel: 是否顯示頁數標籤 (預設 true)
 */

const ReadingProgressBar = ({
    current = 1,
    total = 1,
    showLabel = true,
    className = '',
}) => {
    const progress = total > 0 ? (current / total) * 100 : 0;

    return (
        <div className={`fixed top-0 left-0 right-0 z-[60] ${className}`}>
            {/* 進度條背景 */}
            <div className="h-1 bg-black/20 backdrop-blur-sm">
                {/* 進度條填充 */}
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* 頁數標籤 */}
            {showLabel && total > 1 && (
                <div className="absolute top-2 right-4 flex items-center gap-2">
                    <span className="text-xs font-bold text-white/80 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        {current} / {total}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ReadingProgressBar;
