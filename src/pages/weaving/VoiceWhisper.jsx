import React from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';

/** 🎤 回憶悄悄話 - 原型 _6 */
const VoiceWhisper = () => {
    const navigate = useNavigate();
    return (
        <WeavingLayout>
            <header className="relative z-10 px-6 pt-12 pb-4">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-primary/10">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold font-display">回憶悄悄話</h1>
                </div>
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm leading-relaxed">
                    用聲音記錄最真實的情感。<br />每一段語音，都是一份永恆的禮物。
                </p>
            </header>
            <main className="relative z-10 flex-1 px-4 pb-24 space-y-4">
                <button onClick={() => navigate('/voice-weave')} className="w-full bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-sm hover:shadow-soft transition-all flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-2xl">mic</span>
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">錄製悄悄話</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">為重要的人留下一段溫暖的語音</p>
                    </div>
                    <span className="material-symbols-outlined text-primary ml-auto">arrow_forward_ios</span>
                </button>
                <button onClick={() => navigate('/voice-listen')} className="w-full bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-sm hover:shadow-soft transition-all flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-2xl">headphones</span>
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">傾聽聲音</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">聆聽夥伴留下的悄悄話</p>
                    </div>
                    <span className="material-symbols-outlined text-primary ml-auto">arrow_forward_ios</span>
                </button>
                <button onClick={() => navigate('/voice-transcript')} className="w-full bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-sm hover:shadow-soft transition-all flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-2xl">text_snippet</span>
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">語音轉譯</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">將語音自動轉為文字記錄</p>
                    </div>
                    <span className="material-symbols-outlined text-primary ml-auto">arrow_forward_ios</span>
                </button>
                <button onClick={() => navigate('/broadcast')} className="w-full bg-gradient-to-br from-primary/10 to-transparent rounded-2xl p-6 border border-primary/20 hover:shadow-soft transition-all flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-2xl">radio</span>
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">回憶廣播站</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">聆聽歲月的聲音</p>
                    </div>
                    <span className="material-symbols-outlined text-primary ml-auto">arrow_forward_ios</span>
                </button>
            </main>
        </WeavingLayout>
    );
};

export default VoiceWhisper;
