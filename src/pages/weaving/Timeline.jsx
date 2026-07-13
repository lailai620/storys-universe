import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import PhotoGrid from '../../components/weaving/PhotoGrid';
import { getPhotos, getTotalPhotoCount } from '../../services/photoService';
import { getStories, getMemories } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';

/** ⏳ 時光軸 v2 — 雜誌排版 + 九宮格照片牆 */

function formatDateLabel(dateKey) {
    try {
        const [y, m, d] = dateKey.split('-').map(Number);
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (dateKey === todayStr) return '今天';
        if (dateKey === yesterdayStr) return '昨天';
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        const date = new Date(y, m - 1, d);
        return `${m}月${d}日 週${weekDays[date.getDay()]}`;
    } catch {
        return dateKey.replace(/-/g, '/');
    }
}

function getCategoryIcon(category) {
    const map = { family: 'family_restroom', friends: 'group', work: 'work', pets: 'pets', self: 'self_improvement' };
    return map[category] || 'auto_stories';
}

// ─── 單日群組卡片 (總覽模式) ───────────────────────────────────────────
const DayGroup = ({ group, navigate }) => {
    const { items, allPhotos, dateKey, isCurrent } = group;

    return (
        <div 
            className="px-4 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 cursor-pointer group"
            onClick={() => navigate(`/timeline/day/${dateKey}`)}
        >
            <div className="bg-white/60 dark:bg-surface-dark/60 rounded-3xl p-5 border border-black/[0.04] dark:border-white/5 hover:bg-white/90 dark:hover:bg-surface-dark/90 hover:shadow-sm active:scale-[0.98] transition-all">
                {/* ── 日期標題列 ─────────────────────────── */}
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full border-2 shrink-0 transition-all ${isCurrent
                        ? 'border-primary bg-primary shadow-[0_0_0_4px_rgba(244,192,37,0.15)]'
                        : 'border-primary/40 bg-background-light dark:bg-background-dark group-hover:border-primary'
                    }`} />
                    <span className="text-sm font-bold text-primary">
                        {formatDateLabel(dateKey)}
                    </span>
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full ml-auto">
                        {items.length} 則回憶
                    </span>
                    <span className="material-symbols-outlined text-primary/40 text-[16px] group-hover:text-primary transition-colors">
                        arrow_forward_ios
                    </span>
                </div>

                {/* ── 照片九宮格 (如果有) ─────────────────────────── */}
                {allPhotos.length > 0 ? (
                    <div className="mb-2">
                        <PhotoGrid photos={allPhotos} maxDisplay={4} />
                    </div>
                ) : (
                    <div className="flex items-center gap-2 mb-2 opacity-60">
                         <span className="material-symbols-outlined text-[16px]">notes</span>
                         <span className="text-xs">{items[0].title || '文字回憶'}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── 主元件 ──────────────────────────────────────────────
const Timeline = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [groupedMemories, setGroupedMemories] = useState([]);
    const [totalPhotos, setTotalPhotos] = useState(0);
    const [storyCount, setStoryCount] = useState(0);
    const [memoryCount, setMemoryCount] = useState(0);
    const [loadError, setLoadError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // ─── 載入資料 ──────────────────────────────────────────
    useEffect(() => {
        const loadTimeline = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const rawStories = await getStories();
                const publishedStories = rawStories.filter(s => s.status === 'published' || !s.status);

                const formattedStories = publishedStories.map(s => ({
                    id: s.id,
                    type: 'story',
                    title: s.title,
                    text: s.content,
                    date: s.occurred_at || s.created_at || s.createdAt,
                    tags: s.tags || [],
                    photos: getPhotos(s.id) || [],
                    is_ai_generated: s.is_ai_generated,
                    hasAudio: s.hasAudio,
                    category: s.category,
                }));

                const rawMemories = await getMemories();
                const formattedMemories = rawMemories.map(m => ({
                    id: m.id,
                    type: 'memory',
                    title: m.title || '隨手回憶',
                    text: m.text || m.content,
                    date: m.occurred_at || m.created_at || m.createdAt,
                    tags: m.tags || [],
                    photos: getPhotos(m.id) || [],
                }));

                let merged = [...formattedStories, ...formattedMemories];
                merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setStoryCount(formattedStories.length);
                setMemoryCount(formattedMemories.length);
                setTotalPhotos(getTotalPhotoCount());

                // 單日群組化
                const groupsMap = new Map();
                merged.forEach(item => {
                    const dateKey = (item.date || '').split('T')[0] || new Date().toISOString().split('T')[0];
                    if (!groupsMap.has(dateKey)) {
                        groupsMap.set(dateKey, { dateKey, items: [], allPhotos: [] });
                    }
                    const group = groupsMap.get(dateKey);
                    group.items.push(item);
                    if (item.photos?.length > 0) {
                        group.allPhotos.push(...item.photos);
                    }
                });

                const groups = Array.from(groupsMap.values());
                groups.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
                if (groups.length > 0) groups[0].isCurrent = true;
                setGroupedMemories(groups);
            } catch (err) {
                console.error('[Timeline] 雲端載入失敗，嘗試本機備援:', err);
                try {
                    const localStories = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
                    const published = localStories.filter(s => s.status === 'published' || !s.status);
                    const formatted = published.map(s => ({
                        id: s.id, type: 'story', title: s.title,
                        text: s.content,
                        date: s.occurred_at || s.createdAt || s.created_at,
                        tags: s.tags || [], photos: getPhotos(s.id) || [],
                        category: s.category,
                    }));
                    const groupsMap = new Map();
                    formatted.forEach(item => {
                        const dateKey = (item.date || '').split('T')[0] || new Date().toISOString().split('T')[0];
                        if (!groupsMap.has(dateKey)) {
                            groupsMap.set(dateKey, { dateKey, items: [], allPhotos: [] });
                        }
                        groupsMap.get(dateKey).items.push(item);
                    });
                    const localGroups = Array.from(groupsMap.values());
                    localGroups.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
                    if (localGroups.length > 0) localGroups[0].isCurrent = true;
                    setGroupedMemories(localGroups);
                    setStoryCount(formatted.length);  // ← 修正：使用正確的 setter
                } catch (localErr) {
                    console.error('[Timeline] 本機備援也失敗:', localErr);
                    setLoadError('無法載入故事，請檢查網路連線。');
                }
            } finally {
                setIsLoading(false);
            }
        };
        loadTimeline();
    }, [user, location.key]);

    return (
        <WeavingLayout>
            <div className="h-12 w-full shrink-0" />

            {/* ─── Header ─────────────────────────── */}
            <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-primary/5">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-lg font-bold">時光軸</h1>
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {storyCount > 0 && `${storyCount} 則故事`}
                            {storyCount > 0 && memoryCount > 0 && ' · '}
                            {memoryCount > 0 && `${memoryCount} 段記憶`}
                            {(storyCount > 0 || memoryCount > 0) && totalPhotos > 0 && ` · ${totalPhotos} 張照片`}
                            {storyCount === 0 && memoryCount === 0 && '還沒有任何回憶'}
                        </span>
                    </div>
                <div className="w-10" />
            </header>

            {/* ─── Content ────────────────────────── */}
            <main className="flex-1 overflow-y-auto pb-24 pt-2">
                {/* 錯誤訊息 */}
                {loadError && (
                    <div className="mx-4 mt-4 p-4 bg-danger/10 text-danger text-sm rounded-xl flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">error</span>
                        {loadError}
                    </div>
                )}

                {/* 載入中 */}
                {isLoading && (
                    <div className="flex justify-center pt-20">
                        <span className="material-symbols-outlined animate-spin text-primary text-3xl">autorenew</span>
                    </div>
                )}

                {/* 空白狀態 */}
                {!isLoading && groupedMemories.length === 0 && !loadError && (
                    <div className="flex flex-col items-center justify-center pt-20 pb-10 text-center animate-in fade-in duration-500">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 border-4 border-white dark:border-surface-dark shadow-sm">
                            <span className="material-symbols-outlined text-4xl text-primary opacity-80">psychology_alt</span>
                        </div>
                        <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">你的時光軸目前是一片空白畫布</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark px-10 leading-relaxed mb-8">
                            日子一天天過，總有些閃閃發光的碎片值得被留下。去編織第一個回憶吧！
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-full shadow-lg shadow-primary/30 flex items-center gap-2 hover:bg-primary/90 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">edit_square</span>
                            開始編織回憶
                        </button>
                    </div>
                )}

                {/* 時光軸群組列表 */}
                {!isLoading && groupedMemories.length > 0 && (
                    <div className="pt-2">
                        {groupedMemories.map((group) => (
                            <DayGroup
                                key={group.dateKey}
                                group={group}
                                navigate={navigate}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* ─── FAB ────────────────────────────── */}
            <button
                onClick={() => navigate('/story-write')}
                className="fixed right-5 bottom-24 z-30 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
                <span className="material-symbols-outlined text-3xl">add</span>
            </button>
        </WeavingLayout>
    );
};

export default Timeline;
