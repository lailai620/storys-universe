import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';

/** 📖 數位故事書 — 載入真實故事 + 翻頁動畫 */
const EMPTY_BOOK = [
    { title: '序', subtitle: '每一道光都是一段故事', text: '這本書目前還是空白的。快去編織你的第一段故事，讓它成為這本書的第一章吧！' },
];

const DigitalBook = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [page, setPage] = useState(0);
    const [pages, setPages] = useState(EMPTY_BOOK);
    const [isFlipping, setIsFlipping] = useState(false);
    const [flipDir, setFlipDir] = useState('');
    const [bookConfig, setBookConfig] = useState({ cover: 'classic', font: 'serif' });

    // 載入真實故事 + 書籍設定
    useEffect(() => {
        const stories = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
        const memories = JSON.parse(localStorage.getItem('weaving_memories') || '[]');

        // 載入書籍設定
        try {
            const cfg = JSON.parse(localStorage.getItem('weave_book_config') || '{}');
            if (cfg.font) setBookConfig(prev => ({ ...prev, ...cfg }));
        } catch { }

        if (stories.length > 0 || memories.length > 0) {
            const realPages = [
                { title: '序', subtitle: '每一道光都是一段故事', text: '這本書記錄了我們最珍貴的回憶。每一頁都是用愛與時光編織而成的光芒。' },
            ];

            stories.forEach((s, i) => {
                realPages.push({
                    title: `第${i + 1}章`,
                    subtitle: s.title || '無標題',
                    text: s.content || s.text || '',
                });
            });

            memories.forEach((m, i) => {
                realPages.push({
                    title: `記憶 ${i + 1}`,
                    subtitle: new Date(m.createdAt || Date.now()).toLocaleDateString('zh-TW'),
                    text: m.content || m.text || '',
                });
            });

            realPages.push({
                title: '後記',
                subtitle: '持續編織中⋯',
                text: `這本書共收錄了 ${stories.length + memories.length} 段回憶。故事還在繼續，光芒也會持續閃耀。`,
            });

            setPages(realPages);
        }
    }, [id]);

    const fontFamily = bookConfig.font === 'sans'
        ? "'Noto Sans TC', sans-serif"
        : bookConfig.font === 'jakarta'
            ? "'Plus Jakarta Sans', sans-serif"
            : "'Noto Serif TC', serif";

    const handleFlip = useCallback((direction) => {
        if (isFlipping) return;
        const nextPage = direction === 'next' ? page + 1 : page - 1;
        if (nextPage < 0 || nextPage >= pages.length) return;

        setIsFlipping(true);
        setFlipDir(direction);
        setTimeout(() => {
            setPage(nextPage);
            setIsFlipping(false);
            setFlipDir('');
        }, 300);
    }, [page, pages.length, isFlipping]);

    // 觸控滑動翻頁
    const [touchStart, setTouchStart] = useState(null);

    const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
    const handleTouchEnd = (e) => {
        if (!touchStart) return;
        const diff = touchStart - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            handleFlip(diff > 0 ? 'next' : 'prev');
        }
        setTouchStart(null);
    };

    const currentPage = pages[page];

    return (
        <WeavingLayout showNav={false}>
            <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-primary/10 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-primary/10">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h1 className="text-base font-bold font-display">數位故事書</h1>
                <button onClick={() => navigate('/share')} className="p-2 rounded-full hover:bg-primary/10">
                    <span className="material-symbols-outlined text-primary">share</span>
                </button>
            </header>

            <main
                className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-6"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* 書頁 */}
                <div
                    className={`w-full max-w-sm bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl p-8 min-h-[420px] flex flex-col transition-all duration-300 ${isFlipping
                            ? flipDir === 'next'
                                ? 'translate-x-[-20px] opacity-70 rotate-[-2deg]'
                                : 'translate-x-[20px] opacity-70 rotate-[2deg]'
                            : 'translate-x-0 opacity-100 rotate-0'
                        }`}
                    style={{ fontFamily }}
                >
                    {/* 章節標記 */}
                    <p className="text-xs text-primary uppercase tracking-widest mb-4 font-sans">
                        {currentPage.title}
                    </p>

                    {/* 標題 */}
                    <h2 className="text-2xl font-bold mb-6" style={{ fontFamily }}>
                        {currentPage.subtitle}
                    </h2>

                    {/* 內文 */}
                    <p className="text-base leading-loose text-text-secondary-light dark:text-text-secondary-dark flex-1" style={{ fontFamily }}>
                        {currentPage.text}
                    </p>

                    {/* 頁碼 */}
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark text-center mt-6 font-sans">
                        {page + 1} / {pages.length}
                    </p>
                </div>

                {/* 翻頁控制 */}
                <div className="flex items-center gap-6 mt-6">
                    <button
                        onClick={() => handleFlip('prev')}
                        disabled={page === 0}
                        className="p-3 rounded-full bg-surface-light dark:bg-surface-dark disabled:opacity-30 hover:bg-primary/10 transition-all active:scale-90"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>

                    {/* 進度點 */}
                    <div className="flex gap-1.5">
                        {pages.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => { setPage(i); }}
                                className={`rounded-full transition-all ${i === page ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-primary/20 hover:bg-primary/40'
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => handleFlip('next')}
                        disabled={page === pages.length - 1}
                        className="p-3 rounded-full bg-surface-light dark:bg-surface-dark disabled:opacity-30 hover:bg-primary/10 transition-all active:scale-90"
                    >
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>

                {/* 提示 */}
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-4 text-center">
                    ← 左右滑動翻頁 →
                </p>
            </main>
        </WeavingLayout>
    );
};

export default DigitalBook;
