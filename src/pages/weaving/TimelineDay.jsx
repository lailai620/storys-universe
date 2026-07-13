import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { getStories, getMemories } from '../../services/dbService';
import { getPhotos } from '../../services/photoService';
import LazyImage from '../../components/ui/LazyImage';

/**
 * ⏳ 單日展開時光軸 — TimelineDay.jsx
 * 實作精緻單日時間線版面 (左側時間線、右側圖文排版)
 */

function formatTimeLabel(dateStr) {
    try {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
        return '';
    }
}

function formatDateHeader(dateKey) {
    try {
        const [y, m, d] = dateKey.split('-').map(Number);
        return `${y}年${m}月${d}日`;
    } catch {
        return dateKey;
    }
}

const TimelineDay = () => {
    const { date } = useParams();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDayData = async () => {
            setIsLoading(true);
            try {
                const rawStories = await getStories();
                const publishedStories = rawStories.filter(s => s.status === 'published' || !s.status);
                
                const formattedStories = publishedStories.map(s => ({
                    id: s.id,
                    type: 'story',
                    title: s.title,
                    text: s.content,
                    date: s.occurred_at || s.created_at || s.createdAt,
                    createdTime: new Date(s.created_at || s.createdAt).getTime(),
                    tags: s.tags || [],
                    photos: getPhotos(s.id) || [],
                }));

                const rawMemories = await getMemories();
                const formattedMemories = rawMemories.map(m => ({
                    id: m.id,
                    type: 'memory',
                    title: m.title || '隨手回憶',
                    text: m.text || m.content,
                    date: m.occurred_at || m.created_at || m.createdAt,
                    createdTime: new Date(m.created_at || m.createdAt).getTime(),
                    tags: m.tags || [],
                    photos: getPhotos(m.id) || [],
                }));

                let merged = [...formattedStories, ...formattedMemories];
                
                // 過濾出這一天的資料
                const dayItems = merged.filter(item => {
                    const itemDate = (item.date || '').split('T')[0] || new Date(item.createdTime).toISOString().split('T')[0];
                    return itemDate === date;
                });

                // 依照創作時間(時間順序) 排序 (舊到新，符合一天的時間流)
                dayItems.sort((a, b) => a.createdTime - b.createdTime);

                setItems(dayItems);
            } catch (err) {
                console.error('[TimelineDay] 載入失敗:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (date) {
            loadDayData();
        }
    }, [date]);

    // 取得這天最常出現的 Tag 作為副標題，如果沒有則顯示「回憶點滴」
    const getSubtitle = () => {
        if (items.length === 0) return '回憶點滴';
        const tagCounts = {};
        items.forEach(item => {
            item.tags.forEach(t => {
                tagCounts[t] = (tagCounts[t] || 0) + 1;
            });
        });
        const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
        if (sortedTags.length > 0) {
            return `${sortedTags[0][0]}之旅`;
        }
        return '回憶點滴';
    };

    return (
        <WeavingLayout hideNav>
            <main className="min-h-screen bg-[#FAFAFA] dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark pb-32">
                
                {/* ── 頂部 Header ───────────────────────────────────── */}
                <header className="sticky top-0 z-40 bg-[#FAFAFA]/90 dark:bg-background-dark/90 backdrop-blur-md pt-safe flex items-center justify-between px-4 py-4 border-b border-black/[0.04] dark:border-white/5">
                    <button 
                        onClick={() => navigate('/timeline')}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
                    </button>
                    
                    <div className="text-center flex-1 pr-10">
                        <h1 className="text-lg font-bold tracking-wider">{formatDateHeader(date)}</h1>
                        <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark mt-0.5 opacity-80">
                            {getSubtitle()} - 共 {items.length} 則
                        </p>
                    </div>
                </header>

                {/* ── 列表區域 ───────────────────────────────────── */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 opacity-50">
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                        <p className="text-sm">載入回憶中...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <span className="material-symbols-outlined text-4xl mb-2">auto_stories</span>
                        <p className="text-sm">這一天沒有紀錄回憶</p>
                    </div>
                ) : (
                    <div className="relative px-6 py-8">
                        {/* 貫穿的垂直時間線 */}
                        <div className="absolute top-8 bottom-12 left-[31px] w-0.5 bg-primary/20 rounded-full" />

                        {/* 節點列表 */}
                        <div className="space-y-10">
                            {items.map((item, index) => {
                                const isCurrent = index === items.length - 1; // 假設最後一個是橘色高亮，或者可以全部橘色
                                const hasPhotos = item.photos && item.photos.length > 0;
                                const firstPhoto = hasPhotos ? item.photos[0] : null;

                                return (
                                    <div 
                                        key={item.id} 
                                        className="relative pl-10 flex items-stretch gap-4 cursor-pointer group"
                                        onClick={() => navigate(item.type === 'story' ? `/story-detail/${item.id}` : '#')}
                                    >
                                        {/* 時間點圓圈 */}
                                        <div className={`absolute left-0 top-1.5 w-[14px] h-[14px] rounded-full border-[2.5px] z-10 transition-all bg-white dark:bg-background-dark ${
                                            isCurrent 
                                            ? 'border-primary shadow-[0_0_0_4px_rgba(244,192,37,0.2)]' 
                                            : 'border-primary/50 group-hover:border-primary'
                                        }`} />

                                        {/* 左側內容：時間、標題、內文、標籤 */}
                                        <div className="flex-1 min-w-0 py-0.5">
                                            <p className="text-[11px] font-bold text-primary mb-1 tracking-wider uppercase">
                                                {formatTimeLabel(item.date)}
                                            </p>
                                            <h3 className="text-[16px] font-bold leading-tight mb-2 text-text-primary-light dark:text-text-primary-dark">
                                                {item.title}
                                            </h3>
                                            <p className="text-[13px] leading-relaxed text-text-secondary-light dark:text-text-secondary-dark line-clamp-3 mb-3">
                                                {item.text}
                                            </p>
                                            
                                            {/* 標籤 */}
                                            {item.tags && item.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.tags.slice(0, 3).map(tag => (
                                                        <span 
                                                            key={tag} 
                                                            className="text-[10px] px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded border border-black/5 dark:border-white/5 text-text-secondary-light dark:text-text-secondary-dark"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* 右側縮圖 */}
                                        {hasPhotos && (
                                            <div className="shrink-0 relative w-24 h-24 sm:w-28 sm:h-28 self-start mt-1">
                                                <LazyImage 
                                                    src={firstPhoto.url || firstPhoto} 
                                                    alt={item.title}
                                                    className="w-full h-full object-cover rounded-2xl shadow-sm border border-black/5 dark:border-white/10"
                                                />
                                                {item.photos.length > 1 && (
                                                    <div className="absolute bottom-1.5 right-1.5 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md shadow-sm border border-black/5">
                                                        <span className="text-[10px] font-bold text-text-primary-light dark:text-white">
                                                            +{item.photos.length - 1}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* 結束點 */}
                            <div className="relative pl-10 flex items-center">
                                <div className="absolute left-[3px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/20 z-10" />
                                <p className="text-[11px] text-text-secondary-light/50 italic">
                                    這天的回憶...
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── FAB 新增按鈕 ───────────────────────────────────── */}
                <button
                    onClick={() => navigate('/story-mode')}
                    className="fixed bottom-[max(2rem,env(safe-area-inset-bottom))] right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all z-50"
                >
                    <span className="material-symbols-outlined text-2xl">add</span>
                </button>
            </main>
        </WeavingLayout>
    );
};

export default TimelineDay;
