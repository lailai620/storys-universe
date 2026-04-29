/**
 * 📸 PhotoGrid — 九宮格/雜誌風照片排版元件
 * 根據照片數量自動選擇最佳排版模式
 */
import React, { useState } from 'react';
import LazyImage from '../ui/LazyImage';

const PhotoGrid = ({ photos = [], maxDisplay = 9, onPhotoClick }) => {
    const [lightboxIdx, setLightboxIdx] = useState(null);
    const displayPhotos = photos.slice(0, maxDisplay);
    const extraCount = photos.length - maxDisplay;
    const count = displayPhotos.length;

    const handleClick = (idx) => {
        if (onPhotoClick) {
            onPhotoClick(idx);
        } else {
            setLightboxIdx(idx);
        }
    };

    const getPhotoSrc = (photo) => photo.base64 || photo.url || '';

    if (count === 0) return null;

    // ─── 1 張：全寬大圖 ────────────────────────────
    if (count === 1) {
        return (
            <>
                <div className="rounded-xl overflow-hidden cursor-pointer" onClick={() => handleClick(0)}>
                    <LazyImage
                        src={getPhotoSrc(displayPhotos[0])}
                        alt="回憶照片"
                        className="w-full aspect-[16/10]"
                    />
                </div>
                {lightboxIdx !== null && (
                    <Lightbox
                        photos={photos}
                        currentIdx={lightboxIdx}
                        onClose={() => setLightboxIdx(null)}
                        onChange={setLightboxIdx}
                    />
                )}
            </>
        );
    }

    // ─── 2 張：左右並排 ────────────────────────────
    if (count === 2) {
        return (
            <>
                <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden">
                    {displayPhotos.map((photo, i) => (
                        <div key={i} className="cursor-pointer aspect-square" onClick={() => handleClick(i)}>
                            <LazyImage src={getPhotoSrc(photo)} alt={`照片 ${i + 1}`} className="w-full h-full" />
                        </div>
                    ))}
                </div>
                {lightboxIdx !== null && (
                    <Lightbox photos={photos} currentIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} onChange={setLightboxIdx} />
                )}
            </>
        );
    }

    // ─── 3 張：1 大 + 2 小（雜誌風）──────────────────
    if (count === 3) {
        return (
            <>
                <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden">
                    <div className="row-span-2 cursor-pointer" onClick={() => handleClick(0)}>
                        <LazyImage src={getPhotoSrc(displayPhotos[0])} alt="照片 1" className="w-full h-full aspect-auto min-h-[200px]" />
                    </div>
                    <div className="cursor-pointer" onClick={() => handleClick(1)}>
                        <LazyImage src={getPhotoSrc(displayPhotos[1])} alt="照片 2" className="w-full aspect-square" />
                    </div>
                    <div className="cursor-pointer" onClick={() => handleClick(2)}>
                        <LazyImage src={getPhotoSrc(displayPhotos[2])} alt="照片 3" className="w-full aspect-square" />
                    </div>
                </div>
                {lightboxIdx !== null && (
                    <Lightbox photos={photos} currentIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} onChange={setLightboxIdx} />
                )}
            </>
        );
    }

    // ─── 4-9 張：九宮格 ─────────────────────────────
    return (
        <>
            <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
                {displayPhotos.map((photo, i) => {
                    const isLast = i === displayPhotos.length - 1 && extraCount > 0;
                    return (
                        <div
                            key={i}
                            className="relative cursor-pointer aspect-square"
                            onClick={() => handleClick(i)}
                        >
                            <LazyImage src={getPhotoSrc(photo)} alt={`照片 ${i + 1}`} className="w-full h-full" />
                            {isLast && (
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">+{extraCount}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {lightboxIdx !== null && (
                <Lightbox photos={photos} currentIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} onChange={setLightboxIdx} />
            )}
        </>
    );
};

// ─── Lightbox 全螢幕預覽 ────────────────────────────
const Lightbox = ({ photos, currentIdx, onClose, onChange }) => {
    const photo = photos[currentIdx];
    if (!photo) return null;

    const src = photo.base64 || photo.url || '';
    const hasPrev = currentIdx > 0;
    const hasNext = currentIdx < photos.length - 1;

    return (
        <div
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* 關閉 */}
            <button className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white" onClick={onClose}>
                <span className="material-symbols-outlined text-3xl">close</span>
            </button>

            {/* 計數器 */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
                {currentIdx + 1} / {photos.length}
            </div>

            {/* 上一張 */}
            {hasPrev && (
                <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white z-10"
                    onClick={(e) => { e.stopPropagation(); onChange(currentIdx - 1); }}
                >
                    <span className="material-symbols-outlined text-4xl">chevron_left</span>
                </button>
            )}

            {/* 圖片 */}
            <img
                src={src}
                alt={`照片 ${currentIdx + 1}`}
                className="max-w-[92%] max-h-[85vh] object-contain rounded-xl select-none"
                onClick={(e) => e.stopPropagation()}
                draggable={false}
            />

            {/* 下一張 */}
            {hasNext && (
                <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white z-10"
                    onClick={(e) => { e.stopPropagation(); onChange(currentIdx + 1); }}
                >
                    <span className="material-symbols-outlined text-4xl">chevron_right</span>
                </button>
            )}
        </div>
    );
};

export default PhotoGrid;
