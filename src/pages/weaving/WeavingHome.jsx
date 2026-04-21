import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { getTotalPhotoCount } from '../../services/photoService';
import { getVoiceMessages } from '../../services/voiceService';
import { getStories } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { hapticService } from '../../services/hapticService';
import SyncStatusIndicator from '../../components/weaving/SyncStatusIndicator';
import { getItem } from '../../services/storageService';

/**
 * 🌟 織光首頁 — 你的光源宇宙
 */

const DAILY_QUOTES = [
    '「記憶是一種留住你所愛、你之所是，以及你不想失去的一切的方式。」',
    '「每一道光都是一段故事，每一個故事都值得被永遠記住。」',
    '「用愛編織的回憶，會在歲月中閃閃發光。」',
    '「最珍貴的禮物，是把重要的人的故事傳承下去。」',
];

const AnimatedNumber = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);
    useEffect(() => {
        if (value === 0) return;
        let start = 0;
        const duration = 1000; 
        const increment = value / (duration / 16);
        let animationFrame;
        const updateCounter = () => {
            start += increment;
            if (start >= value) {
                setDisplayValue(value);
            } else {
                setDisplayValue(Math.floor(start));
                animationFrame = requestAnimationFrame(updateCounter);
            }
        };
        animationFrame = requestAnimationFrame(updateCounter);
        return () => cancelAnimationFrame(animationFrame);
    }, [value]);
    return <span>{displayValue}</span>;
};

const WeavingHome = () => {
    const navigate = useNavigate();
    const { user, displayName, isAuthenticated } = useAuth();
    const [quote, setQuote] = useState('');
    const [stats, setStats] = useState({ stories: 0, voices: 0, photos: 0 });
    const [lightSources, setLightSources] = useState([]);
    const [isFirstVisit, setIsFirstVisit] = useState(false);

    const [drafts, setDrafts] = useState([]);

    useEffect(() => {
        setQuote(DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)]);

        const loadData = async () => {
            try {
                const voices = await getVoiceMessages();
                const photos = getTotalPhotoCount();
                const allStories = await getStories();

                // ✅ 修正：只計算真實已發布的故事，不再計入 AI session 暫存
                const published = allStories.filter(s => s.status !== 'draft');
                const draftStories = allStories.filter(s => s.status === 'draft');

                const totalStories = published.length;
                setStats({ stories: totalStories, voices: voices.length, photos });
                setDrafts(draftStories);

                // 讀取真實光源資料
                const savedSources = JSON.parse(localStorage.getItem('weaving_light_sources') || '[]');
                setLightSources(savedSources);
                setIsFirstVisit(savedSources.length === 0 && totalStories === 0 && draftStories.length === 0);
            } catch (err) {
                console.error('[WeavingHome] 資料載入失敗，嘗試 localStorage 備援:', err);
                // ✅ 修正：Supabase 失敗時從 localStorage 撈取資料
                try {
                    const localStories = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
                    const published = localStories.filter(s => s.status !== 'draft');
                    const draftStories = localStories.filter(s => s.status === 'draft');
                    setStats({ stories: published.length, voices: 0, photos: getTotalPhotoCount() });
                    setDrafts(draftStories);
                    const savedSources = JSON.parse(localStorage.getItem('weaving_light_sources') || '[]');
                    setLightSources(savedSources);
                    setIsFirstVisit(savedSources.length === 0 && published.length === 0 && draftStories.length === 0);
                } catch (localErr) {
                    console.error('[WeavingHome] localStorage 也失敗:', localErr);
                }
            }
        };
        
        loadData();
    }, [user]); // ✅ 修正：使用者登入後自動重新載入資料

    const featuredSource = lightSources.length > 0 ? lightSources[0] : null;
    const otherSources = lightSources.slice(1);
    const realStoryCount = stats.stories;

    return (
        <WeavingLayout>
            <header className="relative z-10 px-6 pt-12 pb-4 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium tracking-wider uppercase mb-1">{isFirstVisit ? '歡迎來到織光' : isAuthenticated ? `歡迎回來，${displayName}` : '歡迎回來'}</span>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">你的光源宇宙</h1>
                </div>
                <div className="flex items-center gap-2">
                    <SyncStatusIndicator />
                    <div className="relative group">
                    {isAuthenticated && user?.user_metadata?.avatar_url ? (
                        <div className="w-10 h-10 rounded-full bg-cover bg-center border-2 border-primary/20 cursor-pointer" style={{ backgroundImage: `url('${user.user_metadata.avatar_url}')` }} onClick={() => navigate('/settings')} />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary cursor-pointer" onClick={() => navigate(isAuthenticated ? '/settings' : '/login')}>
                            <span className="material-symbols-outlined">{isAuthenticated ? 'person' : 'login'}</span>
                        </div>
                    )}
                    {isAuthenticated && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-background-light dark:border-background-dark" />
                    )}
                </div>
                </div>
            </header>

            <main className="relative z-10 flex-1 px-4 pb-24 overflow-y-auto">
                {/* 🎙️ 一鍵錄音大按鈕 */}
                <div 
                    onClick={() => { hapticService.tap(); navigate('/voice-whisper'); }}
                    className="mb-5 relative overflow-hidden bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-[0_4px_15px_rgba(244,63,94,0.3)] cursor-pointer
                               transform transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_25px_rgba(244,63,94,0.4)] active:scale-[0.98] group animate-in fade-in slide-in-from-bottom-4 duration-700"
                    style={{ animationFillMode: 'both' }}
                >
                    <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/15 rounded-full blur-2xl animate-pulse" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 shrink-0 bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                            <span className="material-symbols-outlined text-white text-3xl">mic</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold leading-tight mb-1 text-white">一鍵語音紀錄</h3>
                            <p className="text-white/80 text-xs">按下即可開始錄音，用聲音留住珍貴回憶</p>
                        </div>
                        <span className="material-symbols-outlined text-white/60 text-2xl group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                    </div>
                </div>

                {/* 🔍 AI 時光機入口 */}
                <div 
                    onClick={() => { hapticService.tap(); navigate('/memory-search'); }}
                    className="mb-5 relative overflow-hidden bg-gradient-to-r from-violet-500 to-indigo-600 rounded-2xl p-4 text-white shadow-[0_4px_15px_rgba(124,58,237,0.3)] cursor-pointer
                               transform transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_25px_rgba(124,58,237,0.4)] active:scale-[0.98] group animate-in fade-in slide-in-from-bottom-4 duration-700"
                    style={{ animationDelay: '100ms', animationFillMode: 'both' }}
                >
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-11 h-11 shrink-0 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                            <span className="material-symbols-outlined text-white text-xl">search</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold leading-tight mb-0.5 text-white">AI 時光機</h3>
                            <p className="text-white/70 text-[11px]">用聲音或文字，找回任何一段回憶</p>
                        </div>
                        <span className="material-symbols-outlined text-white/50 text-xl group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                    </div>
                </div>

                {/* 活動統計與時光軸入口 */}
                <div className="flex items-center justify-between mb-4 px-1">
                    {(stats.stories > 0 || stats.voices > 0 || stats.photos > 0) ? (
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                            {[
                                { icon: 'auto_stories', label: '故事', count: stats.stories },
                                { icon: 'mic', label: '語音', count: stats.voices },
                                { icon: 'photo_library', label: '照片', count: stats.photos },
                            ].map(s => s.count > 0 && (
                                <div key={s.icon} className="shrink-0 flex items-center gap-1.5 bg-black/5 dark:bg-white/5 text-text-secondary-light dark:text-text-secondary-dark px-3 py-1.5 rounded-full text-[11px] font-medium animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <span className="material-symbols-outlined text-[14px]">{s.icon}</span>
                                    <AnimatedNumber value={s.count} /> {s.label}
                                </div>
                            ))}
                        </div>
                    ) : <div />}
                    
                    <button 
                        onClick={() => navigate('/timeline')}
                        className="shrink-0 flex items-center gap-1.5 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold hover:bg-primary/20 transition-colors ml-2"
                    >
                        <span className="material-symbols-outlined text-[16px]">history</span>
                        時光軸
                    </button>
                </div>

                {/* ✨ 新增：AI 主動提問卡片 (Aha! Moment Trigger) */}
                <div 
                    onClick={() => { hapticService.tap(); navigate('/story-mode'); }}
                    className="mt-2 mb-6 relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-white shadow-[0_4px_15px_rgba(244,192,37,0.3)] cursor-pointer
                               transform transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_25px_rgba(244,192,37,0.4)] active:scale-[0.98] group animate-in fade-in slide-in-from-bottom-4 duration-700"
                    style={{ animationFillMode: 'both', animationDelay: '100ms' }}
                >
                    {/* 背景光暈動畫 */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-pulse" />
                    <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s'}} />
                    
                    <div className="relative z-10 flex items-start gap-4">
                        <div className="w-12 h-12 shrink-0 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                            <span className="material-symbols-outlined text-white text-2xl animate-[spin_10s_linear_infinite] group-hover:animate-none group-hover:scale-110 transition-transform">auto_awesome</span>
                        </div>
                        <div>
                            <span className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1 block">織光精靈向你問好</span>
                            <h3 className="text-lg font-bold leading-tight mb-2 text-white">「今天發生了什麼事，想對誰說說呢？」</h3>
                            <div className="flex items-center gap-1 text-xs font-medium bg-white/20 w-max px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 group-hover:bg-white/30 transition-colors">
                                <span className="material-symbols-outlined text-[14px]">edit_square</span>
                                開始專屬編織
                            </div>
                        </div>
                    </div>
                </div>

                {/* 待完成的草稿區 */}
                {drafts.length > 0 && (
                    <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationFillMode: 'both', animationDelay: '200ms' }}>
                        <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-3 px-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-primary">edit_note</span>
                            繼續編織未完成的回憶
                        </h3>
                        <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar px-1">
                            {drafts.map(draft => (
                                <div 
                                    key={draft.id}
                                    onClick={() => navigate(draft.is_ai_generated ? `/story-mode?session=${draft.id}&category=${draft.category}` : `/story-write?id=${draft.id}`)}
                                    className="shrink-0 snap-start w-64 bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-black/5 dark:border-white/5 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-95 flex flex-col items-start text-left"
                                >
                                    <div className="flex justify-between items-start mb-2 w-full">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <span className="material-symbols-outlined text-[16px]">{draft.is_ai_generated ? 'auto_awesome' : 'edit_document'}</span>
                                        </div>
                                        <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded font-medium tracking-wide">
                                            {draft.is_ai_generated ? '精靈引導' : '自由書寫'}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-text-primary-light dark:text-text-primary-dark mb-1 line-clamp-1 w-full">{draft.title}</h4>
                                    <p className="text-xs text-text-secondary-light/70 dark:text-text-secondary-dark/70 line-clamp-2 w-full leading-relaxed">{draft.content || '尚未寫下紀錄...'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Featured Light Source Card */}
                {featuredSource ? (
                    <div className="mt-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationFillMode: 'both', animationDelay: '300ms' }}>
                        <div className="relative bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-soft hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary border-2 border-primary/30">
                                        <span className="material-symbols-outlined text-2xl">{featuredSource.icon || 'person'}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">{featuredSource.name}</h3>
                                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{featuredSource.subtitle || '正在編織回憶'}</p>
                                    </div>
                                </div>
                                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-background-light dark:bg-background-dark text-primary hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => navigate('/live-weaving')}>
                                    <span className="material-symbols-outlined">edit</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark">光源進度</span>
                                    <span className="text-sm font-bold text-primary">{realStoryCount} 篇故事</span>
                                </div>
                                <div className="h-2 w-full bg-background-light dark:bg-background-dark rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full shadow-[0_0_10px_rgba(244,192,37,0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, realStoryCount * 5 + 10)}%` }} />
                                </div>
                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark text-right mt-1">持續記錄，讓光芒更耀眼</p>
                            </div>

                            <div className="mt-6">
                                <button onClick={() => { hapticService.tap(); navigate('/story-mode'); }} className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors active:scale-[0.98]">
                                    <span>繼續編織</span>
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (stats.stories > 0 || drafts.length > 0) ? (
                    /* ✨ 如果已經有故事，將原本的空狀態替換為時光軸入口卡片 */
                    <div className="mt-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationFillMode: 'both', animationDelay: '300ms' }}>
                        <div 
                            onClick={() => { hapticService.tap(); navigate('/timeline'); }}
                            className="relative bg-gradient-to-br from-surface-light to-surface-light dark:from-surface-dark dark:to-surface-dark rounded-2xl p-6 border border-black/5 dark:border-white/5 shadow-sm text-center cursor-pointer hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 group"
                        >
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-primary text-3xl">history</span>
                            </div>
                            <h3 className="text-lg font-bold mb-1 text-text-primary-light dark:text-text-primary-dark">重憶時光軸</h3>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4 px-4 leading-relaxed line-clamp-2">
                                重溫你記錄下的點點滴滴與動人故事。
                            </p>
                            <div className="flex items-center justify-center text-xs font-bold text-primary gap-1">
                                <span>前往生命瀑布流</span>
                                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ✨ 真正的新使用者空狀態引導 */
                    <div className="mt-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationFillMode: 'both', animationDelay: '300ms' }}>
                        <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/15 text-center">
                            <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-primary text-4xl">auto_awesome</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-text-primary-light dark:text-text-primary-dark">開始編織你的第一道光</h3>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6 leading-relaxed">
                                選擇一個想記錄的人，讓 AI 引導你織出溫暖的故事
                            </p>
                            <button onClick={() => { hapticService.tap(); navigate('/light-sources'); }} className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors active:scale-[0.98]">
                                <span className="material-symbols-outlined text-sm">add</span>
                                <span>新增第一個光源</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Light Source Grid */}
                {(otherSources.length > 0 || lightSources.length > 0) && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationFillMode: 'both', animationDelay: '400ms' }}>
                        {otherSources.map((source) => (
                            <div key={source.id} onClick={() => navigate('/story-collection')} className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 shadow-sm hover:shadow-soft transition-all duration-300 cursor-pointer">
                                <div className="flex flex-col items-center text-center mb-3">
                                    <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center text-primary mb-3 border-2 border-transparent hover:border-primary/30 transition-colors">
                                        <span className="material-symbols-outlined text-xl">{source.icon || 'person'}</span>
                                    </div>
                                    <h4 className="font-bold text-base text-text-primary-light dark:text-text-primary-dark line-clamp-1">{source.name}</h4>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">{source.storyCount || 0} 篇故事</p>
                                </div>
                                <div className="h-1.5 w-full bg-background-light dark:bg-background-dark rounded-full overflow-hidden mt-2">
                                    <div className="h-full bg-primary/80 rounded-full transition-all duration-700" style={{ width: `${source.progress || 0}%` }} />
                                </div>
                            </div>
                        ))}

                        {/* Add New */}
                        <button onClick={() => { hapticService.tap(); navigate('/light-sources'); }} className="bg-background-light dark:bg-background-dark border-2 border-dashed border-primary/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors h-full min-h-[140px]">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">add</span>
                            </div>
                            <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">新增光源</span>
                        </button>
                    </div>
                )}

                {/* Daily Reflection */}
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationFillMode: 'both', animationDelay: '500ms' }}>
                    <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4 px-1">每日反思</h3>
                    <div className="bg-gradient-to-br from-primary/10 to-transparent rounded-2xl p-5 border border-primary/10">
                        <div className="flex gap-3 mb-2">
                            <span className="material-symbols-outlined text-primary">format_quote</span>
                            <p className="text-sm italic text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">{quote}</p>
                        </div>
                        <div className="flex justify-end mt-2">
                            <button onClick={() => { hapticService.tap(); navigate('/story-mode'); }} className="text-xs font-bold text-primary flex items-center gap-1 hover:text-primary/80 transition-colors">
                                立即書寫
                                <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </WeavingLayout>
    );
};

export default WeavingHome;
