import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';

/**
 * 📖 故事集 — 顯示 AI 對話織成的故事
 */

const StoryCollection = () => {
    const navigate = useNavigate();
    const [stories, setStories] = useState([]);
    const [activeFilter, setActiveFilter] = useState('全部');

    useEffect(() => {
        // 從 localStorage 載入 AI 產生的故事
        const saved = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
        const realStories = saved.map(s => ({
            id: s.id,
            title: s.title || '無標題故事',
            date: s.createdAt,
            category: s.category || 'default',
            tags: [getCategoryTag(s.category)],
            content: s.content,
            hasAudio: false,
            isReal: true,
        }));

        setStories(realStories);
    }, []);

    // 動態產生篩選標籤
    const allTags = [...new Set(stories.flatMap(s => s.tags))];
    const filters = ['全部', ...allTags];

    const filtered = activeFilter === '全部'
        ? stories
        : stories.filter(s => s.tags.includes(activeFilter));

    const formatDate = (dateStr) => {
        try {
            const d = new Date(dateStr);
            return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
        } catch { return ''; }
    };

    return (
        <WeavingLayout>
            <header className="relative z-10 px-6 pt-12 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <button className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined">search</span>
                    </button>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">故事集</h1>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                    共 {stories.length} 篇故事
                </p>
            </header>

            {/* Filter Chips */}
            <div className="relative z-10 px-4 mb-4 overflow-x-auto flex gap-2 no-scrollbar">
                {filters.map(f => (
                    <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeFilter === f
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-surface-light dark:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/10'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Story List */}
            <main className="relative z-10 flex-1 px-4 pb-24 overflow-y-auto space-y-4">
                {stories.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-primary text-4xl">auto_stories</span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">還沒有故事</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
                            開始一段對話，AI 會幫你織出美好的故事
                        </p>
                        <button onClick={() => navigate('/light-sources')} className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all">
                            <span className="material-symbols-outlined text-sm mr-1 align-middle">add</span>
                            織第一篇故事
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <span className="material-symbols-outlined text-4xl text-primary/30 mb-4 block">auto_stories</span>
                        <p className="text-text-secondary-light dark:text-text-secondary-dark">這個分類還沒有故事</p>
                        <button onClick={() => navigate('/story-mode')} className="mt-4 text-primary text-sm font-bold">
                            去織一篇
                        </button>
                    </div>
                ) : (
                    filtered.map(story => (
                        <div
                            key={story.id}
                            onClick={() => navigate(`/story-detail/${story.id}`)}
                            className="bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden shadow-sm hover:shadow-soft transition-all cursor-pointer group"
                        >
                            {story.cover ? (
                                <div className="relative h-40 overflow-hidden">
                                    <img src={story.cover} alt={story.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                    {story.hasAudio && (
                                        <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full p-2">
                                            <span className="material-symbols-outlined text-white text-sm">headphones</span>
                                        </div>
                                    )}
                                    {story.isReal && (
                                        <div className="absolute top-3 left-3 bg-primary/80 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] text-white font-bold">
                                            AI 生成
                                        </div>
                                    )}
                                    <div className="absolute bottom-3 left-4">
                                        <p className="text-white/80 text-xs">{formatDate(story.date)}</p>
                                        <h3 className="text-white font-bold text-lg">{story.title}</h3>
                                    </div>
                                </div>
                            ) : (
                                /* 沒有封面的 AI 故事用文字卡片 */
                                <div className="p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        {story.isReal && (
                                            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">AI 生成</span>
                                        )}
                                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{formatDate(story.date)}</span>
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">{story.title}</h3>
                                    {story.content && (
                                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark line-clamp-3 leading-relaxed">{story.content}</p>
                                    )}
                                </div>
                            )}
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex gap-2">
                                    {story.tags.map(tag => (
                                        <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tag}</span>
                                    ))}
                                </div>
                                <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark text-sm">arrow_forward_ios</span>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </WeavingLayout>
    );
};

function getCategoryTag(category) {
    const map = { family: '家人', friends: '朋友', work: '職場', pets: '毛孩', self: '自己' };
    return map[category] || '生活';
}

export default StoryCollection;
