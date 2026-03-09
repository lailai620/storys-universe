import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';

/** 🎨 書籍自訂 — 封面/字型/風格選擇 + 即時預覽 + 持久化 */
const COVERS = [
    { id: 'classic', name: '經典金', color: 'from-primary/80 to-primary-dark', text: 'text-white' },
    { id: 'forest', name: '森林綠', color: 'from-emerald-700 to-emerald-900', text: 'text-emerald-50' },
    { id: 'ocean', name: '海洋藍', color: 'from-blue-700 to-blue-900', text: 'text-blue-50' },
    { id: 'rose', name: '玫瑰紅', color: 'from-rose-600 to-rose-800', text: 'text-rose-50' },
    { id: 'midnight', name: '午夜黑', color: 'from-gray-800 to-gray-950', text: 'text-gray-100' },
    { id: 'lavender', name: '薰衣草', color: 'from-purple-500 to-purple-800', text: 'text-purple-50' },
];

const FONTS = [
    { id: 'serif', name: '思源宋體', css: "'Noto Serif TC', serif" },
    { id: 'sans', name: '思源黑體', css: "'Noto Sans TC', sans-serif" },
    { id: 'jakarta', name: 'Plus Jakarta Sans', css: "'Plus Jakarta Sans', sans-serif" },
];

const STYLES = [
    { id: 'minimal', name: '簡約', icon: 'remove' },
    { id: 'warm', name: '溫馨', icon: 'favorite' },
    { id: 'elegant', name: '典雅', icon: 'auto_awesome' },
    { id: 'playful', name: '童趣', icon: 'mood' },
];

const STORAGE_KEY = 'weave_book_config';

const BookCustomize = () => {
    const navigate = useNavigate();
    const [saved, setSaved] = useState(false);
    const [storyCount, setStoryCount] = useState(0);

    // 載入已儲存的設定
    const [config, setConfig] = useState(() => {
        try {
            const s = localStorage.getItem(STORAGE_KEY);
            return s ? JSON.parse(s) : { cover: 'classic', font: 'serif', style: 'minimal' };
        } catch { return { cover: 'classic', font: 'serif', style: 'minimal' }; }
    });

    useEffect(() => {
        const stories = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
        const memories = JSON.parse(localStorage.getItem('weaving_memories') || '[]');
        setStoryCount(stories.length + memories.length);
    }, []);

    const updateConfig = useCallback((key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    }, []);

    const handleSave = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }, [config]);

    const selectedCover = COVERS.find(c => c.id === config.cover) || COVERS[0];
    const selectedFont = FONTS.find(f => f.id === config.font) || FONTS[0];
    const bookTitle = localStorage.getItem('weave_book_title') || '我的故事書';

    return (
        <WeavingLayout showNav={false}>
            <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-primary/10">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-primary/10">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h1 className="text-base font-bold font-display">書籍自訂</h1>
                <button
                    onClick={handleSave}
                    className={`text-sm font-bold px-3 py-1.5 rounded-full transition-all ${saved ? 'text-success bg-success/10' : 'text-primary hover:bg-primary/10'
                        }`}
                >
                    {saved ? '✓ 已儲存' : '儲存'}
                </button>
            </header>

            <main className="relative z-10 flex-1 px-6 pb-24 pt-6 overflow-y-auto">
                {/* 即時封面預覽 */}
                <div className="flex justify-center mb-8">
                    <div className="relative w-44 h-56">
                        <div className={`absolute inset-0 bg-gradient-to-br ${selectedCover.color} rounded-lg shadow-2xl transition-all duration-500`}>
                            <div className={`absolute inset-0 flex flex-col items-center justify-center p-5 ${selectedCover.text}`}>
                                <p className="text-[10px] uppercase tracking-widest mb-2 opacity-80">織光精裝書</p>
                                <h2 className="text-lg font-bold text-center mb-1 transition-all" style={{ fontFamily: selectedFont.css }}>
                                    {bookTitle}
                                </h2>
                                <div className="mt-auto">
                                    <p className="text-[10px] opacity-60">{storyCount || 13} 篇故事</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-black/20 rounded-lg -z-10 transform translate-x-1.5 translate-y-1.5" />
                    </div>
                </div>

                {/* 封面顏色 */}
                <h3 className="text-sm font-bold uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark mb-4">
                    封面顏色
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {COVERS.map(c => (
                        <button
                            key={c.id}
                            onClick={() => updateConfig('cover', c.id)}
                            className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${c.color} shadow-md transition-all active:scale-95 ${config.cover === c.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark scale-105' : 'hover:scale-105'
                                }`}
                        >
                            <span className={`text-xs font-medium ${c.text}`}>{c.name}</span>
                        </button>
                    ))}
                </div>

                {/* 字型選擇 */}
                <h3 className="text-sm font-bold uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark mb-4">
                    字型選擇
                </h3>
                <div className="space-y-2 mb-8">
                    {FONTS.map(font => (
                        <button
                            key={font.id}
                            onClick={() => updateConfig('font', font.id)}
                            className={`w-full py-3 px-4 rounded-xl text-sm text-left transition-all flex items-center justify-between active:scale-[0.98] ${config.font === font.id
                                    ? 'bg-primary/10 border border-primary/30 text-primary font-bold'
                                    : 'bg-surface-light dark:bg-surface-dark hover:bg-primary/5'
                                }`}
                        >
                            <span style={{ fontFamily: font.css }}>{font.name}</span>
                            {config.font === font.id && (
                                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* 排版風格 */}
                <h3 className="text-sm font-bold uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark mb-4">
                    排版風格
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {STYLES.map(style => (
                        <button
                            key={style.id}
                            onClick={() => updateConfig('style', style.id)}
                            className={`py-4 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1.5 active:scale-[0.97] ${config.style === style.id
                                    ? 'bg-primary/10 border-2 border-primary/30 text-primary'
                                    : 'bg-surface-light dark:bg-surface-dark border border-primary/10 hover:bg-primary/5'
                                }`}
                        >
                            <span className="material-symbols-outlined text-base">{style.icon}</span>
                            {style.name}
                        </button>
                    ))}
                </div>
            </main>
        </WeavingLayout>
    );
};

export default BookCustomize;
