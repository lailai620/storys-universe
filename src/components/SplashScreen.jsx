import React, { useState, useEffect } from 'react';

/**
 * 全站 Splash Screen
 * 在資源載入時顯示品牌動畫，提升專業感
 */
const SplashScreen = ({ minDisplayTime = 1500, onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
                setIsVisible(false);
                onComplete?.();
            }, 500); // 淡出動畫時間
        }, minDisplayTime);

        return () => clearTimeout(timer);
    }, [minDisplayTime, onComplete]);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0f1016] transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'
                }`}
        >
            {/* Logo 動畫 */}
            <div className="relative">
                {/* 發光背景 */}
                <div className="absolute inset-0 blur-[60px] bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 animate-pulse" />

                {/* 無限符號動畫 */}
                <svg
                    viewBox="0 0 100 50"
                    className="w-32 h-16 relative z-10"
                    fill="none"
                    stroke="url(#splashGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                >
                    <defs>
                        <linearGradient id="splashGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#818cf8" />
                            <stop offset="50%" stopColor="#c084fc" />
                            <stop offset="100%" stopColor="#f472b6" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M25,25 C25,10 40,10 50,25 C60,40 75,40 75,25 C75,10 60,10 50,25 C40,40 25,40 25,25"
                        className="animate-draw-infinity"
                    />
                </svg>
            </div>

            {/* 品牌名稱 */}
            <div className="mt-6 text-2xl font-light tracking-[0.4em] text-white/80 animate-fade-in-up">
                STORYS
            </div>

            {/* 載入提示 */}
            <div className="mt-8 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>

            {/* 版權 */}
            <div className="absolute bottom-8 text-xs text-white/30 tracking-widest">
                © 2026 Storys Universe
            </div>
        </div>
    );
};

export default SplashScreen;
