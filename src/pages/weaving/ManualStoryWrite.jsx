import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { saveStory, getStories } from '../../services/dbService';
import { pickAndCompressPhotos, getPhotos, savePhotos, deletePhoto } from '../../services/photoService';
import { hapticService } from '../../services/hapticService';
import { useToast } from '../../context/ToastContext';
import { generateUUID } from '../../utils/uuid';

/**
 * ✍️ 自由揮灑 — 圖文手排編輯器
 */
const ManualStoryWrite = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const location = useLocation();
    
    const queryParams = new URLSearchParams(location.search);
    const categoryQuery = queryParams.get('category') || 'default';
    const existingStoryId = queryParams.get('id');

    const [storyId] = useState(existingStoryId || generateUUID());
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [photos, setPhotos] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [occurredAt, setOccurredAt] = useState(new Date().toISOString().split('T')[0]);
    const [showSuccessGlow, setShowSuccessGlow] = useState(false);

    // 載入既有草稿或故事資料
    useEffect(() => {
        const loadExisting = async () => {
            if (existingStoryId) {
                const allStories = await getStories();
                const existing = allStories.find(s => s.id === existingStoryId);
                if (existing) {
                    setTitle(existing.title || '');
                    setContent(existing.content || '');
                    if (existing.occurred_at) {
                        setOccurredAt(existing.occurred_at.split('T')[0]);
                    }
                }
            }
            // 載入照片
            const collectionPhotos = getPhotos(storyId);
            setPhotos(collectionPhotos);
        };
        loadExisting();
    }, [existingStoryId, storyId]);

    // 處理圖片上傳
    const handleAddPhotos = async () => {
        const newPhotos = await pickAndCompressPhotos(true);
        if (newPhotos.length > 0) {
            savePhotos(storyId, newPhotos);
            setPhotos(getPhotos(storyId));
        }
    };

    // 刪除單張圖片
    const handleRemovePhoto = (photoId) => {
        if (window.confirm('確定要移除這張照片嗎？')) {
            deletePhoto(storyId, photoId);
            setPhotos(getPhotos(storyId));
        }
    };

    // 儲存邏輯 (status: 'draft' | 'published')
    const handleSave = async (status) => {
        if (!title.trim() && !content.trim() && photos.length === 0) {
            showToast('回憶還是空白的喔！請先寫下一些文字或附上照片。', 'info');
            return;
        }
        
        setIsSaving(true);
        hapticService.tap();
        try {
            await saveStory({
                id: storyId,
                title: title.trim() || '無標題回憶',
                content: content.trim(),
                category: existingStoryId ? undefined : categoryQuery, // 只有新故事才寫入 category
                is_ai_generated: false,
                status: status, // draft or published
                occurred_at: occurredAt ? `${occurredAt}T00:00:00.000Z` : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            
            // 觸發成功特效與震動
            hapticService.success();
            setShowSuccessGlow(true);
            
            setTimeout(() => {
                if (status === 'published') {
                    navigate('/story-collection');
                } else {
                    navigate('/'); // 草稿回到首頁
                }
            }, 1200);
        } catch (error) {
            console.error('儲存失敗', error);
            showToast('儲存失敗，請稍後再試。', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <WeavingLayout showNav={false}>
            {/* 標題與操作列 */}
            <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 dark:border-white/5 shadow-sm">
                <button 
                    onClick={() => {
                        if(content.trim() || photos.length > 0) {
                            if(window.confirm('要儲存為草稿嗎？如果取消將不保留變更。')) {
                                handleSave('draft');
                                return;
                            }
                        }
                        navigate(-1);
                    }} 
                    className="size-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
                
                <h1 className="text-lg font-bold font-display">自由編織</h1>
                
                <button 
                    onClick={() => handleSave('published')}
                    disabled={isSaving}
                    className="text-primary font-bold px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                    完成
                </button>
            </header>

            <main className="flex-1 flex flex-col p-5 pb-24 overflow-y-auto">
                {/* 標題與時間輸入 */}
                <div className="mb-6">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="為這段回憶下個標題..."
                        className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-text-secondary-light/50 dark:placeholder:text-text-secondary-dark/50 mb-3 font-display"
                    />
                    <div className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark bg-black/5 dark:bg-white/5 w-max px-3 py-1.5 rounded-lg">
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        <input 
                            type="date" 
                            value={occurredAt}
                            onChange={(e) => setOccurredAt(e.target.value)}
                            max={new Date().toISOString().split('T')[0]} // 不能選未來
                            className="bg-transparent border-none outline-none text-sm font-medium cursor-pointer"
                        />
                    </div>
                </div>

                {/* 預覽照片網格 */}
                {photos.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-4 mb-4 snap-x hide-scrollbar">
                        {photos.map(p => (
                            <div key={p.id} className="relative shrink-0 snap-start">
                                <img 
                                    src={p.base64} 
                                    alt="記憶照片" 
                                    className="h-32 w-32 object-cover rounded-xl shadow-sm border border-black/5 dark:border-white/5"
                                />
                                <button 
                                    onClick={() => handleRemovePhoto(p.id)}
                                    className="absolute -top-2 -right-2 size-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md scale-90 hover:scale-100 transition-transform"
                                >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* 文字編輯區 */}
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="寫下你的溫暖回憶..."
                    className="w-full flex-1 min-h-[300px] text-[17px] leading-relaxed bg-transparent border-none outline-none resize-none placeholder:text-text-secondary-light/50 dark:placeholder:text-text-secondary-dark/50 font-body"
                />
            </main>

            {/* 底部工具列 */}
            <div className="fixed bottom-0 left-0 w-full bg-surface-light dark:bg-surface-dark border-t border-black/5 dark:border-white/5 p-3 px-6 flex items-center justify-between z-40">
                <button 
                    onClick={handleAddPhotos}
                    className="flex items-center gap-2 text-primary bg-primary/10 px-4 py-2.5 rounded-xl font-medium hover:bg-primary/20 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                    附加照片
                </button>
                
                <button 
                    onClick={() => handleSave('draft')}
                    disabled={isSaving}
                    className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark px-4 py-2.5 rounded-xl font-medium hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    存為草稿
                </button>
            </div>

            {/* 保存成功光暈特效 */}
            {showSuccessGlow && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
                    <div className="relative w-40 h-40 bg-white dark:bg-surface-dark rounded-full shadow-[0_0_100px_rgba(244,192,37,1)] flex flex-col items-center justify-center animate-in zoom-in spin-in-12 duration-500">
                        <span className="material-symbols-outlined text-5xl text-primary animate-pulse mb-1">auto_awesome</span>
                        <span className="text-primary font-bold text-sm tracking-widest">保存成功</span>
                    </div>
                </div>
            )}
        </WeavingLayout>
    );
};

export default ManualStoryWrite;
