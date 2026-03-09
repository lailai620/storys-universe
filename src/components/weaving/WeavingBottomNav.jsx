import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tapFeedback, selectFeedback } from '../../services/hapticService';

/**
 * 🌟 織光底部導航列 v2
 * 5 個 Tab：首頁 | 故事集 | ✨ 新織光(FAB) | 語音 | 設定
 * 中央 FAB 按鈕為主要 CTA
 */
const NAV_ITEMS = [
    { icon: 'home', label: '首頁', path: '/' },
    { icon: 'auto_stories', label: '故事集', path: '/story-collection' },
    { icon: 'add', label: '織故事', path: '/light-sources', isFab: true },
    { icon: 'mic', label: '語音', path: '/voice-whisper' },
    { icon: 'settings', label: '設定', path: '/settings' },
];

const WeavingBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50"
            aria-label="主要導航"
        >
            {/* 背景 */}
            <div className="absolute inset-0 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-primary/10" />

            <div className="relative flex justify-around items-end pt-2 pb-6 px-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.path;

                    // 中央 FAB 按鈕
                    if (item.isFab) {
                        return (
                            <button
                                key={item.path}
                                onClick={() => { selectFeedback(); navigate(item.path); }}
                                className="relative -mt-5 flex flex-col items-center gap-0.5 group"
                                aria-label={item.label}
                            >
                                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 flex items-center justify-center transition-all group-hover:scale-110 group-active:scale-95">
                                    <span className="material-symbols-outlined text-2xl">
                                        {item.icon}
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-primary mt-0.5">
                                    {item.label}
                                </span>
                            </button>
                        );
                    }

                    // 一般 Tab
                    return (
                        <button
                            key={item.path}
                            onClick={() => { tapFeedback(); navigate(item.path); }}
                            className="flex flex-col items-center gap-0.5 group min-w-[48px]"
                            aria-label={item.label}
                        >
                            <div className="relative p-1.5">
                                <span
                                    className={`material-symbols-outlined text-[22px] ${isActive ? 'filled' : ''} ${isActive
                                        ? 'text-primary'
                                        : 'text-text-secondary-light dark:text-text-secondary-dark group-hover:text-primary'
                                        } transition-all group-hover:scale-110`}
                                >
                                    {item.icon}
                                </span>
                                {isActive && (
                                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                                )}
                            </div>
                            <span
                                className={`text-[10px] font-medium ${isActive
                                    ? 'text-primary'
                                    : 'text-text-secondary-light dark:text-text-secondary-dark group-hover:text-primary'
                                    } transition-colors`}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default WeavingBottomNav;
