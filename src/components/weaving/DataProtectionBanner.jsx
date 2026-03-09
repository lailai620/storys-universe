import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 💾 資料保護提示
 * 當使用者累積一定內容但未登入時，顯示非侵入式橫幅
 * 提醒備份或登入以防止資料遺失
 */
const DISMISS_KEY = 'weaving_data_banner_dismissed';
const MIN_STORIES_TO_SHOW = 2;

const DataProtectionBanner = () => {
    const navigate = useNavigate();
    const [show, setShow] = useState(false);

    useEffect(() => {
        // 已關閉過就不再顯示（7 天後重新顯示）
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (dismissed) {
            const dismissedAt = new Date(dismissed).getTime();
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - dismissedAt < sevenDays) return;
        }

        // 檢查是否有足夠內容值得提醒
        const stories = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
        const sessions = Object.keys(JSON.parse(localStorage.getItem('weaving_chat_sessions') || '{}'));
        const voices = JSON.parse(localStorage.getItem('weaving_voice_messages') || '[]');
        const totalContent = stories.length + sessions.length + voices.length;

        if (totalContent >= MIN_STORIES_TO_SHOW) {
            // 延遲 2 秒顯示，不干擾使用者操作
            const timer = setTimeout(() => setShow(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, new Date().toISOString());
        setShow(false);
    };

    const handleBackup = () => {
        navigate('/settings');
        handleDismiss();
    };

    if (!show) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[60] max-w-md mx-auto px-4 pt-14 animate-in slide-in-from-top-2 duration-500">
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 shadow-lg border border-primary/10 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-warning text-xl">cloud_off</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm mb-1">你的故事只存在這台裝置</p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-3">
                        清除瀏覽器資料或換裝置會永久遺失。建議匯出備份保護你的珍貴回憶。
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleBackup}
                            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all"
                        >
                            前往備份
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-3 py-1.5 text-xs text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors"
                        >
                            7 天後提醒
                        </button>
                    </div>
                </div>
                <button onClick={handleDismiss} className="p-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors shrink-0">
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            </div>
        </div>
    );
};

export default DataProtectionBanner;
