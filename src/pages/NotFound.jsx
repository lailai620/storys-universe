import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass, Rocket, ArrowLeft } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { Helmet } from 'react-helmet-async';

/**
 * 404 頁面 - 迷失星球主題
 * 當用戶訪問不存在的頁面時顯示
 */
const NotFound = () => {
    const navigate = useNavigate();
    const { playClick, playHover } = useAudio();

    return (
        <div className="min-h-screen bg-[#0f1016] flex items-center justify-center p-6 relative overflow-hidden">
            <Helmet>
                <title>404 迷失星球 | Storys Universe</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            {/* 背景星星 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            opacity: Math.random() * 0.7 + 0.3,
                        }}
                    />
                ))}
            </div>

            {/* 漂浮的行星 */}
            <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 blur-2xl animate-float" />
            <div className="absolute bottom-32 left-16 w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 blur-xl animate-float-delayed" />

            <div className="max-w-lg w-full text-center relative z-10">
                {/* 404 數字 */}
                <div className="relative mb-8">
                    <div className="text-[150px] md:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-white/5 leading-none select-none">
                        404
                    </div>
                    {/* 太空人圖示 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 backdrop-blur-sm border border-white/10 flex items-center justify-center animate-float">
                            <span className="text-5xl">🧑‍🚀</span>
                        </div>
                    </div>
                </div>

                {/* 標題與描述 */}
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    迷失在宇宙深處
                </h1>
                <p className="text-slate-400 mb-10 leading-relaxed">
                    這顆星球似乎不在我們的星圖上...<br />
                    讓我們幫你找到回家的路。
                </p>

                {/* 操作按鈕 */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => { playClick(); navigate('/'); }}
                        onMouseEnter={playHover}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full font-bold text-lg shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:scale-105 transition-all cursor-pointer"
                    >
                        <Home size={20} />
                        返回首頁
                    </button>
                    <button
                        onClick={() => { playClick(); navigate('/gallery'); }}
                        onMouseEnter={playHover}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-full font-medium text-lg border border-white/20 hover:bg-white/20 hover:scale-105 transition-all cursor-pointer"
                    >
                        <Compass size={20} />
                        探索畫廊
                    </button>
                </div>

                {/* 返回上一頁 */}
                <button
                    onClick={() => { playClick(); navigate(-1); }}
                    onMouseEnter={playHover}
                    className="mt-8 text-slate-500 hover:text-white flex items-center justify-center gap-2 mx-auto transition-colors cursor-pointer"
                >
                    <ArrowLeft size={16} />
                    返回上一頁
                </button>
            </div>

            {/* 版權 */}
            <div className="absolute bottom-6 text-xs text-white/20 tracking-widest">
                Storys Universe © 2026
            </div>
        </div>
    );
};

export default NotFound;
