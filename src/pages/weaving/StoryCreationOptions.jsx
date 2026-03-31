import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';

/**
 * 🔀 雙軌創作選項頁面
 */
const StoryCreationOptions = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // 解析 URL query params (例如 ?category=family)
    const queryParams = new URLSearchParams(location.search);
    const category = queryParams.get('category') || 'default';

    return (
        <WeavingLayout showNav={false}>
            <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-black/5 dark:border-white/5">
                <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition">
                    <span className="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <h1 className="text-lg font-bold font-display">選擇編織方式</h1>
                <div className="size-10" />
            </header>

            <main className="flex-1 flex flex-col px-6 pt-8 pb-24 overflow-y-auto">
                <div className="mb-10 text-center">
                    <h2 className="text-[28px] font-bold leading-tight tracking-tight mb-3 font-display">
                        你想如何開始<br />這段回憶？
                    </h2>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-[15px] leading-relaxed max-w-[280px] mx-auto">
                        你可以讓織光精靈透過對話引導你，<br />或在純淨的空間中自由書寫。
                    </p>
                </div>

                <div className="flex flex-col gap-5">
                    {/* 選項 1: AI 採訪 */}
                    <button 
                        onClick={() => navigate(`/story-mode?category=${category}`)}
                        className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-3xl shadow-sm hover:shadow-soft transition-all duration-300 active:scale-[0.98] overflow-hidden"
                    >
                        {/* 光暈特效 */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-500" />
                        
                        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-primary mb-4 shadow-[0_0_15px_rgba(244,192,37,0.2)]">
                            <span className="material-symbols-outlined text-[32px]">auto_awesome</span>
                        </div>
                        <h3 className="text-xl font-bold font-display text-text-primary-light dark:text-text-primary-dark mb-2">讓精靈引導我</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-light text-center">
                            透過溫柔的問答對話<br />一步一步喚醒回憶細節
                        </p>
                    </button>

                    {/* 選項 2: 自由書寫 */}
                    <button 
                        onClick={() => navigate(`/story-write?category=${category}`)}
                        className="group relative flex flex-col items-center justify-center p-8 bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-soft transition-all duration-300 active:scale-[0.98] overflow-hidden"
                    >
                        <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-primary-light dark:text-text-primary-dark mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[32px]">edit_document</span>
                        </div>
                        <h3 className="text-xl font-bold font-display text-text-primary-light dark:text-text-primary-dark mb-2">自由揮灑撰寫</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-light text-center">
                            在純淨無干擾的編輯器中<br />自由加上文字與照片
                        </p>
                    </button>
                </div>
            </main>
        </WeavingLayout>
    );
};

export default StoryCreationOptions;
