import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { List } from 'react-window';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { getPhotos, getTotalPhotoCount } from '../../services/photoService';
import { getStories, getMemories } from '../../services/dbService';

/** ⏳ 時光軸 - 融合隨手打卡與完整故事 */
const Timeline = () => {
    const navigate = useNavigate();
    const [groupedMemories, setGroupedMemories] = useState([]);
    const [totalPhotos, setTotalPhotos] = useState(0);
    const [totalMemories, setTotalMemories] = useState(0);
    
    const listRef = useRef();
    const sizeMap = useRef({});

    useEffect(() => {
        const loadTimeline = async () => {
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
                hasAudio: s.hasAudio
            }));

            const rawMemories = await getMemories();
            const formattedMemories = rawMemories.map(m => ({
                id: m.id,
                type: 'memory',
                title: m.title || '隨手回憶',
                text: m.text || m.content,
                date: m.occurred_at || m.created_at || m.createdAt,
                tags: m.tags || [],
                photos: getPhotos(m.id) || [], // 假設隨手記也有 photos
            }));

            let merged = [...formattedStories, ...formattedMemories];
            merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setTotalMemories(merged.length);
            setTotalPhotos(getTotalPhotoCount());
            
            // 單日群組化 (DayCluster)
            const groupsMap = new Map();
            merged.forEach(item => {
                // 直接切割 ISO 字串左邊的日期部分，避免 UTC→UTC+8 跨日問題
                const dateKey = (item.date || '').split('T')[0] || new Date().toISOString().split('T')[0];
                
                if (!groupsMap.has(dateKey)) {
                    groupsMap.set(dateKey, {
                        dateKey,
                        primaryItem: item, // 最新的一則作為主顯項目
                        items: [],
                        allPhotos: [],
                    });
                }
                const group = groupsMap.get(dateKey);
                group.items.push(item);
                if (item.photos && item.photos.length > 0) {
                    group.allPhotos.push(...item.photos);
                }
            });

            const groups = Array.from(groupsMap.values());
            if (groups.length > 0) {
                groups[0].isCurrent = true;
            }
            setGroupedMemories(groups);
            
            // 清理 listRef 重新測量
            if (listRef.current) {
                listRef.current?.resetAfterIndex?.(0);
            }
        };

        loadTimeline();
    }, []);

    // 取得項目高度，因每群組照片與文字數量不同，做大致估算
    const getItemSize = index => {
        if (sizeMap.current[index]) return sizeMap.current[index];
        const group = groupedMemories[index];
        let height = 220; // Base: padding, margin, title, text snippet
        if (group.allPhotos.length > 0) height += 90; // Photo grid height
        return height;
    };

    const setSize = useCallback((index, size) => {
        sizeMap.current = { ...sizeMap.current, [index]: size };
        if (listRef.current) {
            listRef.current?.resetAfterIndex?.(index);
        }
    }, []);

    // 建立單獨 Row 組件以便測量真實高度
    const Row = ({ index, style }) => {
        const group = groupedMemories[index];
        const rowRef = useRef();

        useEffect(() => {
            if (rowRef.current) {
                const heights = rowRef.current.getBoundingClientRect().height;
                // 添加一點 margin 確保間距
                setSize(index, heights + 56); 
            }
        }, [setSize, index]);

        const primary = group.primaryItem;
        const displayPhotos = group.allPhotos.slice(0, 4);
        const extraPhotosCount = group.allPhotos.length - 4;

        return (
            <div style={style} className="px-5 relative">
                <div ref={rowRef} className="relative pl-10 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* 時間軸線 */}
                    <div className="absolute left-[27px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/35 via-primary/15 to-transparent" />
                    
                    {/* 時間點圓點 */}
                    <div className={`absolute left-[-1px] top-[7px] w-[14px] h-[14px] rounded-full border-2 border-primary z-10 ${group.isCurrent
                        ? 'bg-primary shadow-[0_0_0_5px_rgba(244,192,37,0.15)]'
                        : 'bg-background-light dark:bg-background-dark'
                        }`} />

                    <div className="flex flex-col mb-3">
                        <span className="text-sm font-bold text-primary mb-2">
                            {group.dateKey.replace(/-/g, '/')} 
                            <span className="text-text-secondary-light/60 dark:text-text-secondary-dark/60 text-xs ml-2 font-normal">
                                {group.items.length > 1 ? `共 ${group.items.length} 則回憶` : ''}
                            </span>
                        </span>
                        
                        <div 
                            onClick={() => navigate(primary.type === 'story' ? `/story-detail/${primary.id}` : '#')}
                            className="bg-white/90 dark:bg-surface-dark/90 p-5 rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-sm cursor-pointer hover:shadow-md hover:border-primary/20 transition-all active:scale-[0.98] group"
                        >
                            <h3 className="text-[15px] font-bold leading-snug mb-2 text-text-primary-light dark:text-text-primary-dark group-hover:text-primary transition-colors">
                                {primary.title}
                            </h3>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed line-clamp-2">
                                {primary.text || primary.content}
                            </p>

                            {/* 雜誌風：最多顯示四張照片 */}
                            {displayPhotos.length > 0 && (
                                <div className="mt-3 grid grid-cols-4 gap-2">
                                    {displayPhotos.map((photo, pIdx) => (
                                        <div key={pIdx} className="relative aspect-square rounded-lg overflow-hidden border border-black/5">
                                            <img src={photo.base64 || photo.url} alt={`回憶片刻 ${pIdx}`} className="object-cover w-full h-full" />
                                            {(pIdx === 3 && extraPhotosCount > 0) && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg backdrop-blur-[2px]">
                                                    +{extraPhotosCount}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Tags 與 標籤 */}
                            <div className="mt-4 flex items-center gap-2 flex-wrap">
                                {primary.type === 'story' && (
                                    <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                        <span className="material-symbols-outlined text-[12px]">
                                            {primary.hasAudio ? 'mic' : (primary.is_ai_generated ? 'auto_stories' : 'edit_document')}
                                        </span>
                                        {primary.hasAudio ? '語音故事' : '完整故事'}
                                    </span>
                                )}
                                {primary.tags?.map(tag => (
                                    <span key={tag} className="inline-flex items-center rounded-md bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 px-2 py-0.5 text-[10px] font-medium text-text-secondary-light dark:text-text-secondary-dark">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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
                        {totalMemories} 段回憶 · {totalPhotos} 張照片
                    </span>
                </div>
                <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-2xl">more_horiz</span>
                </button>
            </header>

            <main className="flex-1 overflow-hidden relative pb-8 mt-2 h-full">
                {groupedMemories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center pt-20 pb-10 text-center animate-in fade-in duration-500">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 border-4 border-white dark:border-surface-dark shadow-sm">
                            <span className="material-symbols-outlined text-4xl text-primary opacity-80">psychology_alt</span>
                        </div>
                        <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">你的時光軸目前是一片空白畫布</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark px-10 leading-relaxed mb-8">
                            日子一天天過，總有些閃閃發光的碎片值得被留下。去編織第一個回憶吧！
                        </p>
                        <button 
                            onClick={() => navigate('/story-options')}
                            className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-full shadow-lg shadow-primary/30 flex items-center gap-2 hover:bg-primary/90 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">edit_square</span>
                            開始編織回憶
                        </button>
                    </div>
                ) : (
                    <div style={{ height: 'calc(100vh - 120px)' }}> {/* 留給 Header 的高度補償 */}
                        <List
                            listRef={listRef}
                            style={{ height: window.innerHeight - 120, width: '100%' }}
                            rowCount={groupedMemories.length}
                            rowHeight={getItemSize}
                            rowComponent={Row}
                            rowProps={{}}
                            overscanCount={3}
                        >
                            {/* Row is passed via rowComponent prop */}
                        </List>
                    </div>
                )}
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
