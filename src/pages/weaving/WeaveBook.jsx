import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { useToast } from '../../context/ToastContext';
import { getStories } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';

/** 📕 編織成書 — 故事篩選 + PDF 匯出 + 數位預覽 */
const WeaveBook = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [bookTitle, setBookTitle] = useState('我的故事書');
    const [editingTitle, setEditingTitle] = useState(false);

    // ✅ 故事篩選系統
    const [allStories, setAllStories] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isExporting, setIsExporting] = useState(false);
    const [showSelector, setShowSelector] = useState(false);
    // 日期區間篩選
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const stories = await getStories();
                const published = stories.filter(s => s.status !== 'draft');
                setAllStories(published);
                // 預設全選
                setSelectedIds(new Set(published.map(s => s.id)));
            } catch {
                // Supabase 失敗時從 localStorage 讀取
                const local = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
                const published = local.filter(s => s.status !== 'draft');
                setAllStories(published);
                setSelectedIds(new Set(published.map(s => s.id)));
            }
        };

        // 嘗試取得書名
        const saved = localStorage.getItem('weave_book_title');
        if (saved) setBookTitle(saved);

        load();
    }, [user]);

    const handleSaveTitle = () => {
        localStorage.setItem('weave_book_title', bookTitle);
        setEditingTitle(false);
    };

    const toggleStory = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelectedIds(new Set(allStories.map(s => s.id)));
    const deselectAll = () => setSelectedIds(new Set());

    // 日期區間篩選
    const applyDateFilter = () => {
        const filtered = allStories.filter(s => {
            const d = (s.occurred_at || s.created_at || s.createdAt || '').split('T')[0];
            if (dateFrom && d < dateFrom) return false;
            if (dateTo && d > dateTo) return false;
            return true;
        });
        setSelectedIds(new Set(filtered.map(s => s.id)));
        showToast(`已篩選 ${filtered.length} 篇故事`, 'success');
    };

    // 取得已選取的故事（按日期排序）
    const selectedStories = allStories
        .filter(s => selectedIds.has(s.id))
        .sort((a, b) => {
            const da = (a.occurred_at || a.created_at || a.createdAt || '').split('T')[0];
            const db = (b.occurred_at || b.created_at || b.createdAt || '').split('T')[0];
            return da.localeCompare(db);
        });

    const storyCount = selectedStories.length;

    // ✅ PDF 匯出
    const handleExportPDF = async () => {
        if (storyCount === 0) {
            showToast('請先選取至少一篇故事', 'error');
            return;
        }

        setIsExporting(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            // 封面頁
            doc.setFontSize(24);
            doc.text(bookTitle, 105, 80, { align: 'center' });
            doc.setFontSize(12);
            doc.text('Weaving Light', 105, 100, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`${storyCount} stories`, 105, 115, { align: 'center' });
            doc.text(`Export: ${new Date().toLocaleDateString('zh-TW')}`, 105, 125, { align: 'center' });
            doc.addPage();

            // 內文頁
            selectedStories.forEach((story, index) => {
                if (index > 0) doc.addPage();

                const dateStr = (story.occurred_at || story.created_at || story.createdAt || '').split('T')[0];

                doc.setFontSize(18);
                doc.text(`${index + 1}. ${story.title || 'Untitled'}`, 20, 25);
                doc.setFontSize(10);
                doc.text(dateStr, 20, 35);
                doc.line(20, 38, 190, 38);

                doc.setFontSize(12);
                const content = story.content || story.text || '';
                const lines = doc.splitTextToSize(content, 170);
                let y = 45;
                lines.forEach(line => {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(line, 20, y);
                    y += 7;
                });
            });

            const filename = `${bookTitle.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
            showToast('PDF 紀念冊匯出成功！', 'success');
        } catch (err) {
            console.error('PDF 匯出失敗:', err);
            showToast('PDF 匯出失敗，請稍後再試', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const handleOrder = () => {
        showToast('精裝書訂購功能即將推出，敬請期待！', 'info');
    };

    // 將已選故事 ID 儲存，供 DigitalBook 預覽使用
    useEffect(() => {
        localStorage.setItem('weave_selected_ids', JSON.stringify([...selectedIds]));
    }, [selectedIds]);

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

            <main className="relative z-10 flex-1 px-6 pb-24 pt-8 flex flex-col items-center overflow-y-auto">
                {/* 書封預覽 */}
                <div className="relative w-56 h-72 mb-6 shrink-0">
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
                                <p className="text-xs opacity-60">已選 {storyCount} 篇故事</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-primary-dark/30 rounded-lg -z-10 transform translate-x-2 translate-y-2" />
                </div>

                {/* ✅ 故事挑選區塊 */}
                <div className="w-full mb-6">
                    <button 
                        onClick={() => setShowSelector(!showSelector)}
                        className="w-full py-3 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark font-bold rounded-xl border border-primary/20 flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined text-sm text-primary">checklist</span>
                        挑選故事（已選 {storyCount} / {allStories.length} 篇）
                        <span className="material-symbols-outlined text-sm">{showSelector ? 'expand_less' : 'expand_more'}</span>
                    </button>
                </div>

                {showSelector && (
                    <div className="w-full bg-surface-light dark:bg-surface-dark rounded-xl border border-primary/10 p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* 日期區間篩選 */}
                        <div className="flex flex-wrap gap-2 items-center mb-4">
                            <span className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark">日期區間：</span>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-xs px-2 py-1 rounded-lg border border-primary/20 bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark" />
                            <span className="text-xs">～</span>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-xs px-2 py-1 rounded-lg border border-primary/20 bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark" />
                            <button onClick={applyDateFilter} className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20">篩選</button>
                        </div>
                        {/* 全選/取消全選 */}
                        <div className="flex gap-2 mb-3">
                            <button onClick={selectAll} className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20">全選</button>
                            <button onClick={deselectAll} className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10">取消全選</button>
                        </div>
                        {/* 故事清單 */}
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {allStories.length === 0 ? (
                                <p className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark py-4">尚無故事</p>
                            ) : (
                                allStories.map(story => {
                                    const dateStr = (story.occurred_at || story.created_at || story.createdAt || '').split('T')[0];
                                    return (
                                        <label key={story.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${selectedIds.has(story.id) ? 'bg-primary/10 border border-primary/30' : 'bg-background-light dark:bg-background-dark border border-transparent hover:bg-primary/5'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(story.id)}
                                                onChange={() => toggleStory(story.id)}
                                                className="w-4 h-4 accent-primary rounded"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark truncate">{story.title || '無標題'}</p>
                                                <p className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark">{dateStr}</p>
                                            </div>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* 操作按鈕 */}
                <div className="w-full space-y-3">
                    <button onClick={() => navigate('/book-customize')} className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all">
                        <span className="material-symbols-outlined text-sm">palette</span>
                        客製化封面
                    </button>
                    <button onClick={() => navigate('/digital-book/1')} className="w-full py-3 bg-surface-light dark:bg-surface-dark text-primary font-medium rounded-xl border border-primary/20 flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-[0.98] transition-all">
                        <span className="material-symbols-outlined text-sm">auto_stories</span>
                        預覽數位版
                    </button>

                    {/* ✅ PDF 匯出按鈕 */}
                    <button 
                        onClick={handleExportPDF} 
                        disabled={isExporting || storyCount === 0}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 hover:from-blue-500 hover:to-indigo-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExporting ? (
                            <><span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> 匯出中...</>
                        ) : (
                            <><span className="material-symbols-outlined text-sm">picture_as_pdf</span> 匯出 PDF 紀念冊</>
                        )}
                    </button>

                    <button onClick={handleOrder} className="w-full py-3 bg-surface-light dark:bg-surface-dark font-medium rounded-xl border border-primary/20 flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-[0.98] transition-all text-text-secondary-light dark:text-text-secondary-dark">
                        <span className="material-symbols-outlined text-sm">local_shipping</span>
                        訂購實體精裝書
                    </button>
                </div>

                {/* 無故事引導 */}
                {allStories.length === 0 && (
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
