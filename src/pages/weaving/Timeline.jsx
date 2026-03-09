import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { getPhotos, getTotalPhotoCount } from '../../services/photoService';

/** ⏳ 時光軸 */
const Timeline = () => {
    const navigate = useNavigate();
    const [memories, setMemories] = useState([]);
    const [totalPhotos, setTotalPhotos] = useState(0);

    useEffect(() => {
        // 從 localStorage 載入回憶
        const saved = JSON.parse(localStorage.getItem('weaving_memories') || '[]');
        const photos = getPhotos('live_weaving_default');

        if (saved.length > 0) {
            setMemories(saved.map(m => ({
                ...m,
                photos: [],
            })));
        } else {
            // Demo 資料
            setMemories([
                { id: 'd1', time: '10:30 AM', title: '抵達京都車站', text: '天氣晴朗，車站的人潮比想像中多。我們先去寄放行李，然後直奔抹茶店。', tags: ['交通', '心情'], photoCount: 3, date: '2026-01-14T02:30:00Z' },
                { id: 'd2', time: '01:15 PM', title: '清水寺參拜', text: '抽到了「大吉」！站在清水舞台上俯瞰京都市景，紅葉已經開始有秋天的氣息了。', tags: ['必訪景點'], photoCount: 1, isCurrent: true, date: '2026-01-14T05:15:00Z' },
                { id: 'd3', time: '03:45 PM', title: '漫步二年坂', text: '在此處稍作休息，吃了一串醬油糰子。石板路兩旁的小店非常有特色。', tags: [], photoCount: 5, date: '2026-01-14T07:45:00Z' },
                { id: 'd4', time: '07:00 PM', title: '晚餐：懷石料理', text: '每一道菜都像藝術品一樣精緻。特別是那道生魚片，新鮮度極佳。', tags: [], photoCount: 8, date: '2026-01-14T11:00:00Z' },
            ]);
        }

        setTotalPhotos(photos.length || getTotalPhotoCount());
    }, []);

    const formatTime = useCallback((dateStr) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {
            return '';
        }
    }, []);

    return (
        <WeavingLayout>
            <div className="h-12 w-full shrink-0" />
            <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-20 bg-background-light dark:bg-background-dark">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold">時光軸</h1>
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {memories.length} 段回憶 · {totalPhotos} 張照片
                    </span>
                </div>
                <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-2xl">more_horiz</span>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto relative pb-24">
                {/* 時間線 */}
                <div className="absolute left-[24px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />

                <div className="px-6 py-4 space-y-10">
                    {memories.map((item, i) => (
                        <div key={item.id || i} className="relative pl-8 group">
                            {/* 時間點圓點 */}
                            <div className={`absolute left-[-5px] top-1 w-3 h-3 rounded-full border-2 border-primary z-10 ${item.isCurrent
                                ? 'bg-primary shadow-[0_0_0_4px_rgba(244,192,37,0.2)]'
                                : 'bg-background-light dark:bg-background-dark'
                                }`} />

                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-primary mb-1">
                                    {item.time || formatTime(item.date)}
                                </span>
                                <h3 className="text-lg font-bold leading-tight mb-2">{item.title}</h3>
                                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed line-clamp-3">
                                    {item.text || item.content}
                                </p>

                                {/* 標籤 */}
                                {item.tags?.length > 0 && (
                                    <div className="mt-3 flex gap-2">
                                        {item.tags.map(tag => (
                                            <span key={tag} className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* 照片計數 */}
                                {(item.photoCount > 0) && (
                                    <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                        <span className="material-symbols-outlined text-sm">photo_library</span>
                                        <span>{item.photoCount} 張照片</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* 旅程待續 */}
                    <div className="relative pl-8 pb-10">
                        <div className="absolute left-[-4px] top-1 w-2.5 h-2.5 rounded-full bg-text-secondary-light/30" />
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark italic">等待新的回憶...</p>
                    </div>
                </div>
            </main>

            {/* 新增回憶 FAB */}
            <button
                onClick={() => navigate('/live-weaving')}
                className="fixed right-5 bottom-24 z-30 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
                <span className="material-symbols-outlined text-3xl">add</span>
            </button>
        </WeavingLayout>
    );
};

export default Timeline;
