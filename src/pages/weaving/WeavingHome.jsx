import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { getAllSessions } from '../../services/weavingAI';
import { getVoiceMessages } from '../../services/voiceService';
import { getTotalPhotoCount } from '../../services/photoService';
import { useAuth } from '../../context/AuthContext';

/**
 * 🌟 織光首頁 — 你的光源宇宙
 */

const DAILY_QUOTES = [
    '「記憶是一種留住你所愛、你之所是，以及你不想失去的一切的方式。」',
    '「每一道光都是一段故事，每一個故事都值得被永遠記住。」',
    '「用愛編織的回憶，會在歲月中閃閃發光。」',
    '「最珍貴的禮物，是把重要的人的故事傳承下去。」',
];

const WeavingHome = () => {
    const navigate = useNavigate();
    const { user, displayName, isAuthenticated } = useAuth();
    const [quote, setQuote] = useState('');
    const [stats, setStats] = useState({ stories: 0, voices: 0, photos: 0 });
    const [lightSources, setLightSources] = useState([]);
    const [isFirstVisit, setIsFirstVisit] = useState(false);

    useEffect(() => {
        setQuote(DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)]);

        // 從 localStorage 載入真實統計
        const sessions = getAllSessions();
        const voices = getVoiceMessages();
        const photos = getTotalPhotoCount();
        const savedStories = JSON.parse(localStorage.getItem('weaving_stories') || '[]');

        const totalStories = savedStories.length + sessions.length;
        setStats({ stories: totalStories, voices: voices.length, photos });

        // 讀取真實光源資料
        const savedSources = JSON.parse(localStorage.getItem('weaving_light_sources') || '[]');
        setLightSources(savedSources);
        setIsFirstVisit(savedSources.length === 0 && totalStories === 0);
    }, []);

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
            </header>

            <main className="relative z-10 flex-1 px-4 pb-24 overflow-y-auto">
                {/* 活動統計 */}
                {(stats.stories > 0 || stats.voices > 0 || stats.photos > 0) && (
                    <div className="flex gap-3 mb-4 px-1">
                        {[
                            { icon: 'auto_stories', label: '故事', count: stats.stories },
                            { icon: 'mic', label: '語音', count: stats.voices },
                            { icon: 'photo_library', label: '照片', count: stats.photos },
                        ].map(s => s.count > 0 && (
                            <div key={s.icon} className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
                                <span className="material-symbols-outlined text-sm">{s.icon}</span>
                                {s.count} {s.label}
                            </div>
                        ))}
                    </div>
                )}

                {/* Featured Light Source Card */}
                {featuredSource ? (
                    <div className="mt-2 mb-8">
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
                                <button onClick={() => navigate('/story-mode')} className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors active:scale-[0.98]">
                                    <span>繼續編織</span>
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ✨ 新使用者空狀態引導 */
                    <div className="mt-2 mb-8">
                        <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/15 text-center">
                            <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-primary text-4xl">auto_awesome</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-text-primary-light dark:text-text-primary-dark">開始編織你的第一道光</h3>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6 leading-relaxed">
                                選擇一個想記錄的人，讓 AI 引導你織出溫暖的故事
                            </p>
                            <button onClick={() => navigate('/light-sources')} className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors active:scale-[0.98]">
                                <span className="material-symbols-outlined text-sm">add</span>
                                <span>新增第一個光源</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Light Source Grid */}
                {(otherSources.length > 0 || lightSources.length > 0) && (
                    <div className="grid grid-cols-2 gap-4">
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
                        <button onClick={() => navigate('/light-sources')} className="bg-background-light dark:bg-background-dark border-2 border-dashed border-primary/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors h-full min-h-[140px]">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">add</span>
                            </div>
                            <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">新增光源</span>
                        </button>
                    </div>
                )}

                {/* Daily Reflection */}
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4 px-1">每日反思</h3>
                    <div className="bg-gradient-to-br from-primary/10 to-transparent rounded-2xl p-5 border border-primary/10">
                        <div className="flex gap-3 mb-2">
                            <span className="material-symbols-outlined text-primary">format_quote</span>
                            <p className="text-sm italic text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">{quote}</p>
                        </div>
                        <div className="flex justify-end mt-2">
                            <button onClick={() => navigate('/story-mode')} className="text-xs font-bold text-primary flex items-center gap-1 hover:text-primary/80 transition-colors">
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
