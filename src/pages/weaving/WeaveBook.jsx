import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { useToast } from '../../context/ToastContext';

/** 📕 編織成書 — 顯示真實故事統計 */
const WeaveBook = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [storyCount, setStoryCount] = useState(0);
    const [bookTitle, setBookTitle] = useState('我的故事書');
    const [editingTitle, setEditingTitle] = useState(false);

    useEffect(() => {
        const stories = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
        const memories = JSON.parse(localStorage.getItem('weaving_memories') || '[]');
        setStoryCount(stories.length + memories.length);

        // 嘗試取得書名
        const saved = localStorage.getItem('weave_book_title');
        if (saved) setBookTitle(saved);
    }, []);

    const handleSaveTitle = () => {
        localStorage.setItem('weave_book_title', bookTitle);
        setEditingTitle(false);
    };

    const handleOrder = () => {
        showToast('精裝書訂購功能即將推出，敬請期待！', 'info');
    };

    return (
        <WeavingLayout showNav={false}>
            <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-primary/10">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-primary/10">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-base font-bold font-display">編織成書</h1>
                <button onClick={() => navigate('/book-customize')} className="text-primary text-sm font-bold px-3 py-1.5 rounded-full hover:bg-primary/10">
                    自訂
                </button>
            </header>

            <main className="relative z-10 flex-1 px-6 pb-24 pt-8 flex flex-col items-center">
                {/* 書封預覽 */}
                <div className="relative w-56 h-72 mb-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary-dark rounded-lg shadow-2xl">
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
                            <p className="text-xs uppercase tracking-widest mb-2 opacity-80">織光精裝書</p>

                            {editingTitle ? (
                                <div className="w-full space-y-2">
                                    <input
                                        type="text"
                                        value={bookTitle}
                                        onChange={(e) => setBookTitle(e.target.value)}
                                        className="w-full bg-white/20 text-white text-center rounded-lg px-3 py-1.5 text-lg font-bold placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                                    />
                                    <button onClick={handleSaveTitle} className="w-full text-xs bg-white/20 py-1 rounded-lg hover:bg-white/30">
                                        確定
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => setEditingTitle(true)} className="group">
                                    <h2 className="text-xl font-bold text-center mb-1 group-hover:underline decoration-dotted">{bookTitle}</h2>
                                    <span className="text-[10px] opacity-0 group-hover:opacity-60 transition-opacity">點擊編輯</span>
                                </button>
                            )}

                            <div className="mt-auto">
                                <p className="text-xs opacity-60">共 {storyCount || 13} 篇故事</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-primary-dark/30 rounded-lg -z-10 transform translate-x-2 translate-y-2" />
                </div>

                {/* 狀態 */}
                {storyCount > 0 ? (
                    <>
                        <h3 className="text-lg font-bold mb-2">你的書準備好了！</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center mb-8">
                            {storyCount} 篇故事已編排完成，<br />可以開始客製化封面和版型
                        </p>
                    </>
                ) : (
                    <>
                        <h3 className="text-lg font-bold mb-2">開始編織你的書</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center mb-8">
                            先去寫幾篇故事，<br />再回來把它們編織成一本珍貴的書
                        </p>
                    </>
                )}

                {/* 操作按鈕 */}
                <button onClick={() => navigate('/book-customize')} className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 mb-3 hover:bg-primary/90 active:scale-[0.98] transition-all">
                    <span className="material-symbols-outlined text-sm">palette</span>
                    客製化封面
                </button>
                <button onClick={() => navigate('/digital-book/1')} className="w-full py-3 bg-surface-light dark:bg-surface-dark text-primary font-medium rounded-xl border border-primary/20 flex items-center justify-center gap-2 mb-3 hover:bg-primary/5 active:scale-[0.98] transition-all">
                    <span className="material-symbols-outlined text-sm">auto_stories</span>
                    預覽數位版
                </button>
                <button onClick={handleOrder} className="w-full py-3 bg-surface-light dark:bg-surface-dark font-medium rounded-xl border border-primary/20 flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-[0.98] transition-all text-text-secondary-light dark:text-text-secondary-dark">
                    <span className="material-symbols-outlined text-sm">local_shipping</span>
                    訂購實體精裝書
                </button>

                {/* 無故事引導 */}
                {storyCount === 0 && (
                    <button onClick={() => navigate('/story-mode')} className="mt-6 text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                        <span className="material-symbols-outlined text-sm">edit</span>
                        先去寫一篇故事
                    </button>
                )}
            </main>
        </WeavingLayout>
    );
};

export default WeaveBook;
