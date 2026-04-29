import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';

/** 🎨 書籍自訂 — 書名 + 封面照片 + 字型 + 風格 */

const FONTS = [
    { id: 'serif', name: '思源宋體（推薦）', css: "'Noto Serif TC', serif" },
    { id: 'sans', name: '思源黑體', css: "'Noto Sans TC', sans-serif" },
    { id: 'jakarta', name: 'Plus Jakarta Sans', css: "'Plus Jakarta Sans', sans-serif" },
];

const STYLES = [
    { id: 'minimal', name: '簡約', icon: 'remove' },
    { id: 'warm', name: '溫馨', icon: 'favorite' },
    { id: 'elegant', name: '典雅', icon: 'auto_awesome' },
    { id: 'playful', name: '童趣', icon: 'mood' },
];

const STORAGE_KEY = 'weave_book_config';
const TITLE_KEY = 'weave_book_title';
const COVER_PHOTO_KEY = 'weave_book_cover_photo'; // base64

const BookCustomize = () => {
    const navigate = useNavigate();
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef(null);

    // 書名
    const [bookTitle, setBookTitle] = useState(
        () => localStorage.getItem(TITLE_KEY) || '我的故事書'
    );

    // 封面照片（base64）
    const [coverPhoto, setCoverPhoto] = useState(
        () => localStorage.getItem(COVER_PHOTO_KEY) || null
    );

    // 其他設定
    const [config, setConfig] = useState(() => {
        try {
            const s = localStorage.getItem(STORAGE_KEY);
            return s ? JSON.parse(s) : { font: 'serif', style: 'elegant' };
        } catch { return { font: 'serif', style: 'elegant' }; }
    });

    const updateConfig = useCallback((key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    }, []);

    // 處理照片上傳
    const handlePhotoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert('照片大小請勿超過 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            setCoverPhoto(ev.target.result);
            setSaved(false);
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePhoto = () => {
        setCoverPhoto(null);
        setSaved(false);
    };

    const handleSave = useCallback(() => {
        localStorage.setItem(TITLE_KEY, bookTitle);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        if (coverPhoto) {
            localStorage.setItem(COVER_PHOTO_KEY, coverPhoto);
        } else {
            localStorage.removeItem(COVER_PHOTO_KEY);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }, [config, bookTitle, coverPhoto]);

    const selectedFont = FONTS.find(f => f.id === config.font) || FONTS[0];

    return (
        <WeavingLayout showNav={false}>
            <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-primary/10">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-primary/10">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h1 className="text-base font-bold font-display">書籍自訂</h1>
                <button
                    onClick={handleSave}
                    className={`text-sm font-bold px-3 py-1.5 rounded-full transition-all ${saved ? 'text-success bg-success/10' : 'text-primary hover:bg-primary/10'}`}
                >
                    {saved ? '✓ 已儲存' : '儲存'}
                </button>
            </header>

            <main className="relative z-10 flex-1 px-6 pb-24 pt-6 overflow-y-auto">

                {/* 即時封面預覽 */}
                <div className="flex justify-center mb-8">
                    <div className="relative w-44 h-56 rounded-xl shadow-2xl overflow-hidden">
                        {/* 背景：照片 or 金色漸層 */}
                        {coverPhoto ? (
                            <img
                                src={coverPhoto}
                                alt="封面"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary-dark" />
                        )}
                        {/* 半透明遮罩 */}
                        <div className="absolute inset-0 bg-black/25" />
                        {/* 文字層 */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-white">
                            <p className="text-[9px] uppercase tracking-widest mb-2 opacity-70">織光精裝書</p>
                            <h2
                                className="text-base font-bold text-center leading-snug"
                                style={{ fontFamily: selectedFont.css }}
                            >
                                {bookTitle}
                            </h2>
                            <div className="mt-auto">
                                <p className="text-[9px] opacity-50">WeavingLight</p>
                            </div>
                        </div>
                        {/* 書脊陰影 */}
                        <div className="absolute inset-0 bg-black/20 rounded-xl -z-10 transform translate-x-1.5 translate-y-1.5" />
                    </div>
                </div>

                {/* ── 書名設定 ── */}
                <h3 className="text-sm font-bold uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark mb-3">
                    書名
                </h3>
                <div className="mb-8">
                    <input
                        type="text"
                        value={bookTitle}
                        onChange={e => { setBookTitle(e.target.value); setSaved(false); }}
                        placeholder="輸入您的故事書名稱..."
                        maxLength={30}
                        className="w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                    <p className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark mt-1 text-right">
                        {bookTitle.length} / 30
                    </p>
                </div>

                {/* ── 封面照片 ── */}
                <h3 className="text-sm font-bold uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark mb-3">
                    封面照片
                </h3>
                <div className="mb-8">
                    {coverPhoto ? (
                        <div className="relative rounded-xl overflow-hidden mb-3">
                            <img src={coverPhoto} alt="封面照片" className="w-full h-32 object-cover" />
                            <button
                                onClick={handleRemovePhoto}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-6 rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark hover:border-primary/60 hover:bg-primary/5 transition-all"
                        >
                            <span className="material-symbols-outlined text-primary/50 text-2xl">add_photo_alternate</span>
                            <span className="text-xs">點此選擇封面照片</span>
                            <span className="text-[10px] opacity-50">未選擇則使用織光金色主題</span>
                        </button>
                    )}
                    {coverPhoto && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-2 text-xs text-primary hover:underline"
                        >
                            更換照片
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                    />
                </div>

                {/* ── 字型選擇 ── */}
                <h3 className="text-sm font-bold uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark mb-3">
                    字型選擇
                </h3>
                <div className="space-y-2 mb-8">
                    {FONTS.map(font => (
                        <button
                            key={font.id}
                            onClick={() => updateConfig('font', font.id)}
                            className={`w-full py-3 px-4 rounded-xl text-sm text-left transition-all flex items-center justify-between active:scale-[0.98] ${config.font === font.id
                                ? 'bg-primary/10 border border-primary/30 text-primary font-bold'
                                : 'bg-surface-light dark:bg-surface-dark hover:bg-primary/5'
                                }`}
                        >
                            <span style={{ fontFamily: font.css }}>{font.name}</span>
                            {config.font === font.id && (
                                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── 排版風格 ── */}
                <h3 className="text-sm font-bold uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark mb-3">
                    排版風格
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {STYLES.map(style => (
                        <button
                            key={style.id}
                            onClick={() => updateConfig('style', style.id)}
                            className={`py-4 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1.5 active:scale-[0.97] ${config.style === style.id
                                ? 'bg-primary/10 border-2 border-primary/30 text-primary'
                                : 'bg-surface-light dark:bg-surface-dark border border-primary/10 hover:bg-primary/5'
                                }`}
                        >
                            <span className="material-symbols-outlined text-base">{style.icon}</span>
                            {style.name}
                        </button>
                    ))}
                </div>
            </main>
        </WeavingLayout>
    );
};

export default BookCustomize;
