import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { pickAndCompressPhotos, savePhotos, getPhotos, deletePhoto } from '../../services/photoService';
import { useToast } from '../../context/ToastContext';

/** 📝 即時編織 — 照片 + 文字記錄 */
const COLLECTION_ID = 'live_weaving_default';

const LiveWeaving = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [viewPhoto, setViewPhoto] = useState(null);

    // 載入已儲存的照片
    useEffect(() => {
        setPhotos(getPhotos(COLLECTION_ID));
    }, []);

    // 新增照片
    const handleAddPhotos = useCallback(async () => {
        setUploading(true);
        try {
            const newPhotos = await pickAndCompressPhotos(true);
            if (newPhotos.length > 0) {
                savePhotos(COLLECTION_ID, newPhotos);
                setPhotos(prev => [...prev, ...newPhotos]);
            }
        } catch (e) {
            showToast(e.message || '上傳失敗', 'error');
        } finally {
            setUploading(false);
        }
    }, []);

    // 刪除照片
    const handleDeletePhoto = useCallback((photoId) => {
        deletePhoto(COLLECTION_ID, photoId);
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        setViewPhoto(null);
    }, []);

    // 儲存回憶
    const handleSave = useCallback(() => {
        const memories = JSON.parse(localStorage.getItem('weaving_memories') || '[]');
        memories.unshift({
            id: `memory_${Date.now()}`,
            title: title || '無標題回憶',
            content,
            photoCount: photos.length,
            date: new Date().toISOString(),
        });
        localStorage.setItem('weaving_memories', JSON.stringify(memories));
        setSaved(true);
        setTimeout(() => navigate('/timeline'), 1500);
    }, [title, content, photos, navigate]);

    const today = new Date();
    const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

    return (
        <WeavingLayout showNav={false}>
            <header className="relative z-10 flex items-center justify-between px-4 py-3 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-primary/10">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex-1 text-center">
                    <h1 className="text-base font-bold">{dateStr}</h1>
                    <p className="text-xs text-primary font-medium tracking-wider">即時編織</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={!content.trim() && photos.length === 0}
                    className="text-primary font-bold text-sm px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors disabled:opacity-40"
                >
                    {saved ? '✓ 已存' : '完成'}
                </button>
            </header>

            <main className="flex-1 overflow-y-auto relative z-10 flex flex-col">
                {/* 標題輸入 */}
                <div className="px-5 pt-4">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="為這段回憶取個標題..."
                        className="w-full bg-transparent text-2xl font-bold placeholder-text-secondary-light/40 focus:outline-none border-none"
                    />
                </div>

                {/* 照片區域 */}
                <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                            照片 {photos.length > 0 && `(${photos.length})`}
                        </h3>
                        <button
                            onClick={handleAddPhotos}
                            disabled={uploading}
                            className="flex items-center gap-1 text-primary text-sm font-medium hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {uploading ? (
                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            ) : (
                                <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
                            )}
                            新增
                        </button>
                    </div>

                    {photos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {photos.map(photo => (
                                <button
                                    key={photo.id}
                                    onClick={() => setViewPhoto(photo)}
                                    className="relative aspect-square rounded-xl overflow-hidden group"
                                >
                                    <img
                                        src={photo.base64}
                                        alt={photo.name}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </button>
                            ))}
                            {/* 新增按鈕 */}
                            <button
                                onClick={handleAddPhotos}
                                disabled={uploading}
                                className="aspect-square rounded-xl border-2 border-dashed border-primary/20 flex items-center justify-center text-primary/40 hover:text-primary hover:border-primary/40 transition-colors"
                            >
                                <span className="material-symbols-outlined text-3xl">add</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleAddPhotos}
                            disabled={uploading}
                            className="relative h-48 w-full group cursor-pointer"
                        >
                            <div className="absolute top-0 left-4 right-4 h-40 rounded-xl shadow-lg transform scale-95 translate-y-2 opacity-60 bg-primary/10" />
                            <div className="absolute top-0 left-2 right-2 h-40 rounded-xl shadow-lg transform scale-[0.98] translate-y-1 opacity-80 bg-primary/20" />
                            <div className="absolute top-0 left-0 right-0 h-40 rounded-xl shadow-xl z-10 flex flex-col items-center justify-center border border-primary/20 bg-surface-light dark:bg-surface-dark">
                                {uploading ? (
                                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-primary text-4xl mb-2">add_photo_alternate</span>
                                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">點擊新增照片</span>
                                    </>
                                )}
                            </div>
                        </button>
                    )}
                </div>

                {/* 文字編輯 */}
                <div className="px-5 pb-20 flex-1">
                    <label className="block mb-2 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        寫下回憶...
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-transparent border-0 p-0 text-base placeholder-text-secondary-light/50 focus:ring-0 focus:outline-none resize-none min-h-[150px] leading-relaxed"
                        placeholder="描述你此刻的所見所聞、感受和想法..."
                    />
                </div>
            </main>

            {/* 照片檢視 Lightbox */}
            {viewPhoto && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onClick={() => setViewPhoto(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
                        onClick={() => setViewPhoto(null)}
                    >
                        <span className="material-symbols-outlined text-3xl">close</span>
                    </button>
                    <button
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-danger/80 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 hover:bg-danger transition-colors"
                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(viewPhoto.id); }}
                    >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        刪除照片
                    </button>
                    <img
                        src={viewPhoto.base64}
                        alt={viewPhoto.name}
                        className="max-w-[90%] max-h-[80vh] object-contain rounded-xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* 底部工具列 */}
            <nav className="relative z-30 flex items-stretch border-t border-primary/10 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-md px-2 pb-5 pt-3">
                <button onClick={() => navigate('/timeline')} className="flex flex-1 flex-col items-center justify-center gap-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[26px]">timeline</span>
                    <span className="text-[10px] font-medium">時間軸</span>
                </button>
                <button className="flex flex-1 flex-col items-center justify-center gap-1 text-primary">
                    <div className="bg-primary/10 rounded-full px-4 py-0.5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[26px]">edit</span>
                    </div>
                    <span className="text-[10px] font-medium">編輯中</span>
                </button>
                <button onClick={() => navigate('/share')} className="flex flex-1 flex-col items-center justify-center gap-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[26px]">share</span>
                    <span className="text-[10px] font-medium">分享</span>
                </button>
            </nav>
        </WeavingLayout>
    );
};

export default LiveWeaving;
