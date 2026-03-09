import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { getVoiceMessages } from '../../services/voiceService';
import { getTotalPhotoCount } from '../../services/photoService';

/** 📊 織光小結 — 真實統計 */
const WeavingSummary = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState([]);
    const [progress, setProgress] = useState(0);
    const [highlights, setHighlights] = useState([]);

    useEffect(() => {
        const savedStories = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
        const voices = getVoiceMessages();
        const photos = getTotalPhotoCount();
        const memories = JSON.parse(localStorage.getItem('weaving_memories') || '[]');

        const storyCount = savedStories.length + memories.length;
        const voiceCount = voices.length;
        const total = storyCount + voiceCount + photos;

        setStats([
            { icon: 'auto_stories', label: '故事數', value: storyCount || 0 },
            { icon: 'mic', label: '語音記錄', value: voiceCount || 0 },
            { icon: 'photo_library', label: '照片', value: photos || 0 },
            { icon: 'group', label: '協作者', value: 1 },
        ]);

        // 計算「進度」: 基於已有的內容量
        const p = Math.min(100, Math.round(total * 3 + 5));
        setProgress(p);

        // 動態亮點
        const h = [];
        if (storyCount > 0) h.push(`已記錄 ${storyCount} 篇故事`);
        if (voiceCount > 0) h.push(`收錄 ${voiceCount} 段語音悄悄話`);
        if (photos > 0) h.push(`上傳了 ${photos} 張珍貴照片`);
        if (h.length === 0) h.push('開始你的第一段回憶吧！');
        setHighlights(h);
    }, []);

    return (
        <WeavingLayout>
            <header className="relative z-10 px-6 pt-12 pb-4">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-primary/10">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold font-display">織光小結</h1>
                </div>
            </header>

            <main className="relative z-10 flex-1 px-4 pb-24">
                {/* 進度 */}
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-6 mb-6 text-center border border-primary/10">
                    <h2 className="text-3xl font-bold text-primary mb-1">{progress}%</h2>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">的光源進度已完成</p>
                    <div className="h-2 w-full bg-background-light dark:bg-background-dark rounded-full overflow-hidden mt-4 mb-2">
                        <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(244,192,37,0.5)] transition-all duration-1000" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">持續編織，讓光芒更加耀眼 ✨</p>
                </div>

                {/* 統計卡片 */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {stats.map(s => (
                        <div key={s.label} className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 text-center shadow-sm">
                            <span className="material-symbols-outlined text-primary text-2xl mb-2 block">{s.icon}</span>
                            <p className="text-2xl font-bold">{s.value}</p>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* 亮點 */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-sm mb-4">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
                        活動亮點
                    </h3>
                    <ul className="space-y-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {highlights.map((h, i) => (
                            <li key={i} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                {h}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 快捷操作 */}
                <div className="flex gap-3">
                    <button onClick={() => navigate('/story-mode')} className="flex-1 py-3 bg-primary text-primary-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all">
                        <span className="material-symbols-outlined text-sm">edit</span>
                        織故事
                    </button>
                    <button onClick={() => navigate('/voice-weave')} className="flex-1 py-3 bg-primary/10 text-primary font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-primary/15 active:scale-[0.98] transition-all">
                        <span className="material-symbols-outlined text-sm">mic</span>
                        錄語音
                    </button>
                </div>
            </main>
        </WeavingLayout>
    );
};

export default WeavingSummary;
