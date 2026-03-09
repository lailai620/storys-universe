import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 🌟 織光 404 頁面 — 暖色系迷路主題
 * 當用戶訪問不存在的頁面時顯示
 */
const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#faf5ed] to-[#f0e6d3] flex items-center justify-center p-6 relative overflow-hidden">
            {/* 背景裝飾 — 暖色光點 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-16 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-32 left-10 w-32 h-32 rounded-full bg-amber-300/15 blur-2xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
            </div>

            <div className="max-w-sm w-full text-center relative z-10">
                {/* 插畫圖示 */}
                <div className="mb-8">
                    <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <span className="text-6xl">🧶</span>
                    </div>
                    <div className="text-7xl font-black text-primary/20 leading-none select-none">
                        404
                    </div>
                </div>

                {/* 標題與描述 */}
                <h1 className="text-2xl font-bold text-gray-800 mb-3">
                    這條線好像斷了
                </h1>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    找不到你要的頁面。<br />
                    讓我們回到熟悉的地方吧。
                </p>

                {/* 操作按鈕 */}
                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white rounded-xl font-bold text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">home</span>
                        回到首頁
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-white/60 backdrop-blur-sm text-gray-600 rounded-xl font-medium text-base border border-primary/10 hover:bg-white/80 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                        返回上一頁
                    </button>
                </div>
            </div>

            {/* 版權 */}
            <div className="absolute bottom-6 text-xs text-gray-400 tracking-widest">
                織光 WeavingLight © 2026
            </div>
        </div>
    );
};

export default NotFound;
