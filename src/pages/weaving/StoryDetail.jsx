import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { getVoiceUrl, playVoice, stopPlayback } from '../../services/voiceService';
import { hapticService } from '../../services/hapticService';
import { deleteStory, saveStory, getStoryById } from '../../services/dbService';
import StoryComments from '../../components/weaving/StoryComments';

/**
 * 📖 故事詳情頁 — 獨立閱讀體驗
 * 顯示完整故事內容、metadata、分享按鈕
 */

function getCategoryLabel(category) {
    const map = { family: '家人', friends: '朋友', work: '職場', pets: '毛孩', self: '自己' };
    return map[category] || '生活';
}

function getCategoryIcon(category) {
    const map = { family: 'family_restroom', friends: 'group', work: 'work', pets: 'pets', self: 'self_improvement' };
    return map[category] || 'auto_stories';
}

const StoryDetail = () => {
    const navigate = useNavigate();
    const { storyId } = useParams();
    const [story, setStory] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [fontSize, setFontSize] = useState(16);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const loadStory = async () => {
            setIsLoading(true);
            const found = await getStoryById(storyId);
            if (found) {
                setStory(found);
            }
            setIsLoading(false);
        };
        loadStory();
        
        return () => stopPlayback();
    }, [storyId]);

    // 載入中畫面
    if (isLoading) {
        return (
            <WeavingLayout showNav={false}>
                <div className="min-h-screen flex items-center justify-center">
                    <span className="material-symbols-outlined animate-spin text-primary text-4xl">autorenew</span>
                </div>
            </WeavingLayout>
        );
    }

    const formatDate = (dateStr) => {
        try {
            const d = new Date(dateStr);
            return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
        } catch { return ''; }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: story.title,
                    text: story.content?.substring(0, 100) + '...',
                });
            } catch { }
        } else {
            await navigator.clipboard.writeText(story.content || '');
            hapticService.success();
            setShowShareMenu(true);
            setTimeout(() => setShowShareMenu(false), 2000);
        }
    };

    const handleDelete = async () => {
        hapticService.tap();
        try {
            await deleteStory(storyId);
        } catch {
            const stories = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
            localStorage.setItem('weaving_stories', JSON.stringify(stories.filter(s => s.id !== storyId)));
        }
        navigate('/story-collection', { replace: true });
    };

    const handleSaveTitle = () => {
        if (!editTitle.trim()) return;
        hapticService.success();
        const stories = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
        const idx = stories.findIndex(s => s.id === storyId);
        if (idx >= 0) {
            stories[idx].title = editTitle.trim();
            localStorage.setItem('weaving_stories', JSON.stringify(stories));
            setStory({ ...story, title: editTitle.trim() });
        }
        setIsEditingTitle(false);
    };

    const handlePlayVoice = async () => {
        if (!story?.audioId) return;
        
        if (isPlaying) {
            stopPlayback();
            setIsPlaying(false);
            setProgress(0);
        } else {
            const url = await getVoiceUrl(story.audioId);
            if (url) {
                setIsPlaying(true);
                playVoice(url, 
                    (p) => setProgress(p),
                    () => { setIsPlaying(false); setProgress(0); }
                );
            }
        }
    };

    if (!story) {
        return (
            <WeavingLayout showNav={false}>
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-4">
                    <span className="material-symbols-outlined text-5xl text-primary/30">search_off</span>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">找不到這篇故事</p>
                    <button onClick={() => navigate('/story-collection')} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
                        回到故事集
                    </button>
                </div>
            </WeavingLayout>
        );
    }

    // 將內容按段落分割
    const paragraphs = (story.content || '').split('\n').filter(p => p.trim());

    return (
        <>
            <WeavingLayout showNav={false}>
                {/* 頂部工具列 */}
                <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl border-b border-primary/5">
                    <div className="flex items-center justify-between px-4 pt-12 pb-3">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-primary/10 transition-colors">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div className="flex items-center gap-1">
                            {/* 字級調整 */}
                            <button onClick={() => setFontSize(prev => Math.max(14, prev - 2))} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                                <span className="material-symbols-outlined text-sm">text_decrease</span>
                            </button>
                            <button onClick={() => setFontSize(prev => Math.min(24, prev + 2))} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                                <span className="material-symbols-outlined text-sm">text_increase</span>
                            </button>
                            {/* 分享 */}
                            <button onClick={handleShare} className="p-2 rounded-full hover:bg-primary/10 transition-colors relative">
                                <span className="material-symbols-outlined text-sm">share</span>
                                {showShareMenu && (
                                    <div className="absolute top-full right-0 mt-1 bg-surface-dark text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
                                        已複製到剪貼簿 ✓
                                    </div>
                                )}
                            </button>
                            {/* 刪除 */}
                            <button onClick={() => { hapticService.tap(); setShowDeleteConfirm(true); }} className="p-2 rounded-full hover:bg-danger/10 transition-colors">
                                <span className="material-symbols-outlined text-sm text-danger">delete</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* 故事內容 */}
                <main className="relative z-10 flex-1 px-6 pt-28 pb-16 overflow-y-auto">
                    {/* 分類標籤 */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">{getCategoryIcon(story.category)}</span>
                            {getCategoryLabel(story.category)}
                        </span>
                        {story.isAiGenerated !== false && (
                            <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                AI 織成
                            </span>
                        )}
                    </div>

                    {/* 標題 */}
                    {isEditingTitle ? (
                        <div className="flex items-center gap-2 mb-3">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                                className="flex-1 text-2xl font-bold bg-surface-light dark:bg-surface-dark border border-primary/20 rounded-xl px-3 py-2 focus:outline-none focus:border-primary/40"
                                autoFocus
                            />
                            <button onClick={handleSaveTitle} className="p-2 rounded-full bg-primary/10 text-primary">
                                <span className="material-symbols-outlined text-sm">check</span>
                            </button>
                            <button onClick={() => setIsEditingTitle(false)} className="p-2 rounded-full bg-surface-light dark:bg-surface-dark">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    ) : (
                        <h1
                            className="text-2xl font-bold tracking-tight leading-snug mb-3 cursor-pointer hover:text-primary/80 transition-colors group"
                            onClick={() => { setEditTitle(story.title || ''); setIsEditingTitle(true); }}
                        >
                            {story.title || '無標題故事'}
                            <span className="material-symbols-outlined text-sm text-primary/0 group-hover:text-primary/50 ml-2 transition-colors">edit</span>
                        </h1>
                    )}

                    {/* 日期 & 字數 */}
                    <div className="flex items-center gap-3 text-xs text-text-secondary-light dark:text-text-secondary-dark mb-8">
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            {formatDate(story.createdAt)}
                        </span>
                        <span>·</span>
                        <span>{(story.content || '').length} 字</span>
                        <span>·</span>
                        <span>約 {Math.max(1, Math.ceil((story.content || '').length / 400))} 分鐘閱讀</span>
                    </div>

                    {/* 語音播放器 */}
                    {story.hasAudio && story.audioId && (
                        <div className="bg-primary/5 rounded-2xl p-4 mb-8 flex items-center gap-4">
                            <button 
                                onClick={handlePlayVoice}
                                className="w-12 h-12 shrink-0 rounded-full bg-primary text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-2xl">
                                    {isPlaying ? 'stop' : 'play_arrow'}
                                </span>
                            </button>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-primary">重溫原音</span>
                                    {isPlaying && <span className="text-xs text-primary animate-pulse">播放中...</span>}
                                </div>
                                <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary transition-all duration-100 ease-linear rounded-full"
                                        style={{ width: `${progress * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 裝飾分隔線 */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="flex-1 h-px bg-primary/10" />
                        <span className="material-symbols-outlined text-primary/30 text-sm">auto_awesome</span>
                        <div className="flex-1 h-px bg-primary/10" />
                    </div>

                    {/* 內文 */}
                    <article className="space-y-6" style={{ fontSize: `${fontSize}px` }}>
                        {paragraphs.length > 0 ? (
                            paragraphs.map((p, i) => (
                                <p key={i} className="leading-[1.9] text-text-primary-light dark:text-text-primary-dark">
                                    {p}
                                </p>
                            ))
                        ) : (
                            <p className="text-text-secondary-light dark:text-text-secondary-dark italic">
                                這篇故事還沒有內容
                            </p>
                        )}
                    </article>

                    {/* 尾部裝飾 */}
                    <div className="flex items-center justify-center gap-2 mt-12 mb-4">
                        <div className="w-1.5 h-1.5 bg-primary/30 rounded-full" />
                        <div className="w-1.5 h-1.5 bg-primary/50 rounded-full" />
                        <div className="w-1.5 h-1.5 bg-primary/30 rounded-full" />
                    </div>
                    <p className="text-center text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        — 由織光編織 —
                    </p>

                    {/* 📝 主配角協作—便利貼留言 */}
                    <StoryComments storyId={storyId} isOwner={true} />

                    {/* 底部按鈕組 */}
                    <div className="flex gap-3 mt-8">
                        <button
                            onClick={() => navigate('/story-collection')}
                            className="flex-1 py-3 bg-surface-light dark:bg-surface-dark rounded-xl font-medium text-sm hover:bg-primary/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            回到故事集
                        </button>
                        <button
                            onClick={() => navigate('/story-mode')}
                            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            織新故事
                        </button>
                    </div>
                </main>
            </WeavingLayout>

            {/* 刪除確認對話框 */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-6">
                    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-danger text-3xl">delete_forever</span>
                        </div>
                        <h3 className="text-xl font-bold text-center mb-2">確定要刪除這篇故事？</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center mb-6">
                            「{story.title}」將會被永久刪除，這個操作無法復原。
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={handleDelete}
                                className="w-full py-3 bg-danger text-white font-bold rounded-xl active:scale-[0.98] transition-all"
                            >
                                永久刪除
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="w-full py-3 bg-background-light dark:bg-background-dark font-medium rounded-xl text-text-secondary-light dark:text-text-secondary-dark"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>);
};

export default StoryDetail;
